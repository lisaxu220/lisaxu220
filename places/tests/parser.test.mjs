import test from 'node:test';
import assert from 'node:assert/strict';
import {extractPlaces,amapLinks,placeKey} from '../parser.mjs';
test('groups labelled addresses with numbered venue names',()=>{
 const r=extractPlaces('上海咖啡\n1. 蓝瓶咖啡（裕通店）\n地址：静安区裕通路9号\n2. Manner Coffee（南阳路店）\n地址：静安区南阳路205号');
 assert.equal(r.places.length,2);assert.equal(r.places[0].name,'蓝瓶咖啡（裕通店）');assert.equal(r.places[0].address,'静安区裕通路9号');assert.equal(r.places[1].city,'上海');
});
test('keeps names without inventing street addresses and follows city headings',()=>{
 const r=extractPlaces('杭州\n店名：知味观\n上海\n店名：老吉士');
 assert.deepEqual(r.places.map(p=>[p.name,p.city,p.address]),[['知味观','杭州',''],['老吉士','上海','']]);
});
test('supports inline address, emoji list, and deduplication',()=>{
 assert.equal(extractPlaces('📍阿明面馆｜上海市黄浦区福州路11号').places[0].name,'阿明面馆');
 assert.equal(extractPlaces('1️⃣ 北山咖啡\n2️⃣ 湖边茶室','杭州').places.length,2);
 assert.equal(extractPlaces('店名：知味观\n店名：知味观','杭州').places.length,1);
});
test('link-only shares and narrative text are not fabricated places',()=>{
 assert.equal(extractPlaces('打开小红书看我的笔记 https://xhslink.com/a/123').linkOnly,true);
 assert.equal(extractPlaces('今天真的好开心！记得点赞关注～').places.length,0);
});
test('unlabelled quoted names and address-only items remain reviewable',()=>{
 assert.equal(extractPlaces('推荐“阿明面馆”和“湖边茶室”','杭州').places.length,2);
 assert.ok(extractPlaces('杭州市上城区仁和路83号').places[0].address);
});
test('encodes special characters without changing query structure',()=>{
 const p=[{name:'A&B ?#咖啡',city:'上海',address:''},{name:'阿明面馆',city:'杭州',address:''}];
 const links=amapLinks(p),u=new URL(links.android);
 assert.equal(u.searchParams.get('keywords'),'上海 A&B ?#咖啡|杭州 阿明面馆');assert.equal(u.searchParams.get('sourceApplication'),'PocketPlaces');assert.ok(links.intent.includes('package=com.autonavi.minimap;'));assert.ok(links.web.startsWith('https://uri.amap.com/search?'));
 assert.throws(()=>amapLinks([]));assert.throws(()=>amapLinks(Array(11).fill(p[0])));
 assert.equal(placeKey({name:'Manner Coffee',city:'上海',address:''}),placeKey({name:'MANNERCOFFEE',city:'上海',address:''}));
});
test('bounds extraction size',()=>assert.equal(extractPlaces(Array.from({length:100},(_,i)=>`店名：餐厅${i}`).join('\n')).places.length,80));

test('preserves meaningful leading digits in brand names and addresses',()=>{const r=extractPlaces('店名：7分甜\n地址：123 Nanjing Road','上海');assert.equal(r.places[0].name,'7分甜');assert.equal(r.places[0].address,'123 Nanjing Road');});
