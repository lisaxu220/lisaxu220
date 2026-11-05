// Conservative, on-device candidate extraction. These are search suggestions, not geocoded POIs.
const cities=['北京','上海','广州','深圳','杭州','成都','重庆','南京','苏州','武汉','西安','长沙','厦门','青岛','天津','大连','宁波','无锡','福州','昆明','贵阳','南宁','南昌','济南','郑州','合肥','沈阳','哈尔滨','长春','石家庄','太原','兰州','西宁','银川','呼和浩特','乌鲁木齐','拉萨','海口','三亚','珠海','佛山','东莞','惠州','中山','绍兴','嘉兴','湖州','温州','金华','台州','扬州','常州','洛阳','泉州','汕头','丽江','大理','桂林','香港','澳门'];
const cityOf=text=>cities.find(c=>new RegExp(c+'(?:市|探店|美食|旅游|攻略|打卡|[\s｜|·:：，,。!！/]|$)').test(text)||text.startsWith(c))||'';
const clean=text=>text.replace(/https?:\/\/\S+/gi,'').replace(/#[^\s#]+/g,'').replace(/^\s*(?:\d+\s*[.、)）]\s*|\d\ufe0f?\u20e3\s*|[①-⑳❶-❿]\s*)/u,'').replace(/^[\s•·\-—.、)）:：📍🏠🏡🏢🍜☕🍽️✨⭐✅🔸🔹]+/u,'').replace(/[\s。；;]+$/,'').trim();
const isAddress=text=>/(?:路|街|巷|弄|大道|胡同|大厦|广场|商场|购物中心|园区|[A-Za-z]+\s+(?:Road|Street|Rd|St))[^\n]{0,45}(?:\d+\s*(?:号|弄|楼|层|室|座)|地铁|出口)/i.test(text)||/(?:省|市|区|县).{1,25}(?:路|街|巷|大道|胡同)\S*/.test(text);
const nameLabel=/^(?:店名|店铺|餐厅名?|名称|地点|位置|咖啡店|restaurant|place|name)\s*[:：]\s*/i;
const addressLabel=/^(?:详细地址|地址|位置|坐标|address)\s*[:：]\s*/i;
function reasonable(text){return text.length>=2&&text.length<=100&&!/^(?:推荐|攻略|收藏|点赞|关注|分享|人均|营业时间|交通|地铁|营业|排队|必吃|这家|真的|好吃|不要|一定|记得|建议|小红书|复制|打开)[^店馆]{0,8}$/.test(text)&&!/[。！？!?]/.test(text);}
export function extractPlaces(input,cityHint=''){
 const text=String(input).slice(0,20000).replace(/\r/g,'');
 const links=[...text.matchAll(/https?:\/\/[^\s<>]+/g)].map(m=>m[0].replace(/[，。；）)]+$/,''));
 let currentCity=cityHint.trim()||cityOf(text.split('\n')[0]);
 const places=[];let previous=null;
 const add=(name,address='',city=currentCity)=>{
  name=clean(name).replace(/^[“「『《]|[”」』》]$/g,'');address=clean(address);
  if(!reasonable(name)&&!address)return;
  const p={name:name||address,address,city,kind:address?'address':'name',source:links[0]||''};
  places.push(p);previous=p;
 };
 for(const raw of text.split(/\n|[;；]/)){
  if(places.length>=80)break;
  let line=clean(raw);if(!line)continue;
  const localCity=cityOf(line);if(localCity)currentCity=localCity;
  if(cities.includes(line.replace(/市$/,'')))continue;
  const label=nameLabel.test(line),addressExplicit=addressLabel.test(line);
  if(addressExplicit){
   const address=line.replace(addressLabel,'');
   if(previous&&!previous.address){previous.address=clean(address);previous.kind='address';if(localCity)previous.city=localCity;}
   else add(address,address);
   continue;
  }
  if(label){
   line=line.replace(nameLabel,'');
   for(const part of line.split(/[、]/)){if(isAddress(part))add(part,part);else add(part);}
   continue;
  }
  const chunks=line.split(/[｜|]/).map(clean).filter(Boolean);
  if(chunks.length>1&&chunks.some(isAddress)){
   const address=chunks.find(isAddress),name=chunks.find(c=>c!==address&&reasonable(c));add(name||address,address);continue;
  }
  if(isAddress(line)){
   if(previous&&!previous.address){previous.address=line;previous.kind='address';if(localCity)previous.city=localCity;}
   else add(line,line);
   continue;
  }
  const numbered=/^\s*(?:\d+[.、)）\s]|[①-⑳❶-❿]|\d\ufe0f?\u20e3|[-•]\s)/u.test(raw);
  const pin=/^\s*[📍🏠🏡]/u.test(raw);
  const quoted=[...line.matchAll(/[“「『]([^”」』]{2,60})[”」』]/g)].map(m=>m[1]);
  if(quoted.length){quoted.forEach(n=>add(n));continue;}
  if((numbered||pin)&&reasonable(line)){add(line);continue;}
  if(localCity&&/^(?:周末|探店|必吃|旅游)?(?:咖啡|咖啡馆|美食|餐厅|景点|公园)(?:清单|合集|推荐|攻略)?$/.test(line.replace(localCity,'')))continue;
  if(line.length<=50&&/(?:咖啡(?:馆)?|餐厅|饭店|面馆|茶馆|茶室|酒吧|酒店|民宿|博物馆|美术馆|公园|书店|寺|\([^)]*店\)|（[^）]*店）)$/.test(line)&&!/(?:推荐|合集|攻略|值得|一定要|最好|家店|这家)/.test(line))add(line);
 }
 const dedup=new Map();
 for(const p of places){const key=placeKey(p);if(!dedup.has(key))dedup.set(key,p);}
 return {places:[...dedup.values()],links,linkOnly:!dedup.size&&!!links.length};
}
export function placeKey(p){return [p.city,p.name,p.address].map(x=>(x||'').toLowerCase().replace(/[\s，,。·（）()]/g,'')).join('|');}
export function amapLinks(places){
 if(!places.length)throw Error('Choose at least one place.');
 if(places.length>10)throw Error('Open up to 10 places per search.');
 const keywords=places.map(p=>[p.city,p.name,p.address].filter(Boolean).join(' ').replace(/\|/g,' ')).join('|');
 const query=new URLSearchParams({sourceApplication:'PocketPlaces',keywords,dev:'0'}).toString();
 const web=new URL('https://uri.amap.com/search');
 web.search=new URLSearchParams({keyword:keywords,src:'PocketPlaces',callnative:'1'}).toString();
 if(query.length>6000)throw Error('These searches are too long. Select fewer places.');
 return {android:'androidamap://poi?'+query,web:web.href,intent:'intent://poi?'+query+'#Intent;scheme=androidamap;package=com.autonavi.minimap;S.browser_fallback_url='+encodeURIComponent(web.href)+';end'};
}
