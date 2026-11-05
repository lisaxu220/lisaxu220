# Pocket Places — first prototype

An independent, free static app at `/places/`, alongside the rejection tracker. It receives shared **text**, conservatively extracts possible Chinese venues/addresses, lets you review/edit/select them, saves a local shortlist, and opens an Amap multi-keyword search. No paid API, AI account, backend, developer map key, or new database is required by this version.

## What is implemented

- Android installable PWA with a GET Web Share Target for title/text/URL. Install from normal Chrome, then select Pocket Places in the Android share sheet when text is available. Physical Android/Xiaohongshu share-sheet compatibility still needs device testing.
- On-device heuristic extraction of numbered venues, labelled names/addresses, quoted names, and inline name/address pairs. Common Chinese cities are inferred; an optional city hint and editable fields handle missing or incorrect context. Results are candidates, not guaranteed correct POIs. No coordinates are fabricated.
- Review all venues at once, select/deselect, edit branch/city/address, bulk save, deduplicate, remove, export JSON, and retain entries across reloads/offline sessions. Separate localStorage key from the rejection tracker. No cross-device syncing yet.
- Amap Android intent with a documented `androidamap://poi` multi-keyword search. Up to ten places per handoff is this app's own conservative limit, not a claimed Amap limit. On Android, Save & open preserves the click gesture; unsupported devices can open the web search instead.
- Independent app identity/service-worker scope/cache prefix. Offline extraction, review, saving, and export work after first online setup. Actual Amap searches still need connectivity. GET share text may be visible in the host request URL when no app worker controls the visit; when installed/controlled, shared text uses the cached shell and the URL is cleared.

## Important boundaries

This is not an automatic Xiaohongshu link reader or a geocoding service. Xiaohongshu may share only a link, not the post's full contents. Such input is explicitly flagged, rather than inventing venues. Link fetching faces login/access/CORS restrictions and has not been implemented. Images/OCR are not implemented. A free, permitted content-reading path must be verified before promising link-only automation.

Amap's multi-keyword endpoint is documented for POI searches, including category queries. Whether a particular combination of restaurant names returns every correct branch must be tested in the Android Amap app. The intent is not proof that Amap will show exact matching pins. A multi-marker URI requires resolved coordinates or POI IDs; obtaining those accurately is a separate lookup integration with account/quota/terms requirements.

**Saved in Pocket Places is not saved in Amap favourites.** No official bulk personal-favourites write endpoint was established. Amap searches cannot be presented as automatic collection imports. The goal of share-one-post → verified multiple pins/favourites in Amap remains partially unresolved.

## Official sources inspected

- Android POI search, pipe-separated keywords: https://lbs.amap.com/api/amap-mobile/guide/android/search
- Android marker, requires coordinates: https://lbs.amap.com/api/amap-mobile/guide/android/marker
- Web keyword search: https://lbs.amap.com/api/uri-api/guide/search/search
- Multiple map markers, requires coordinates or POI IDs: https://lbs.amap.com/api/uri-api/guide/mobile-web/points

No commercial SDK or metered REST API is used. Free API allowances have not been established for a future lookup service; do not enable billing or assume unlimited usage. All future paid choices require the user's explicit approval.

## Run / validate

From `/workspace/lisaxu220`: `python3 -m http.server 8000`, then open `/places/` on that server. Test extraction with `node --test places/tests/parser.test.mjs`. Browser checks exercise editing/selection, bulk saving, duplicate handling, persistence, exports, offline share queries, missing-post-text feedback, deletion, mobile overflow, manifest validity, and installability. They do not replace an actual Android Amap/Xiaohongshu test.
