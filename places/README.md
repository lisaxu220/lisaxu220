# Pocket Places — first prototype

An independent, free static app at `/places/`, alongside the rejection tracker. It receives shared **text and screenshots**, conservatively extracts possible Chinese venues/addresses, lets you review/edit/select them, saves a local shortlist, and opens an Amap multi-keyword search. No paid API, AI account, backend, developer map key, or new cloud database is required by this version.

## What is implemented

- Android installable PWA with a multipart POST Web Share Target for title/text/URL and screenshots. Install from normal Chrome, then select Pocket Places in the Android share sheet when text is available. Physical Android/Xiaohongshu share-sheet compatibility still needs device testing.
- On-device heuristic extraction of numbered venues, labelled names/addresses, quoted names, and inline name/address pairs. Common Chinese cities are inferred; an optional city hint and editable fields handle missing or incorrect context. Results are candidates, not guaranteed correct POIs. No coordinates are fabricated.
- Review all venues at once, select/deselect, edit branch/city/address, bulk save, deduplicate, remove, export JSON, and retain entries across reloads/offline sessions. Separate localStorage key from the rejection tracker. No cross-device syncing yet.
- Amap Android intent with a documented `androidamap://poi` multi-keyword search. Up to ten places per handoff is this app's own conservative limit, not a claimed Amap limit. On Android, Save & open preserves the click gesture; unsupported devices can open the web search instead.
- Independent app identity/service-worker scope/cache prefix. Offline extraction, review, saving, and export work after first online setup. Actual Amap searches still need connectivity. When installed/controlled, shared image files are intercepted by the app worker and shared text uses the cached shell; share URLs are cleared after receipt. Legacy GET text links remain supported.

## Important boundaries

This is not an automatic Xiaohongshu link reader or a geocoding service. Xiaohongshu may share only a link, not the post's full contents. Such input is explicitly flagged, rather than inventing venues. Link fetching faces login/access/CORS restrictions and has not been implemented. Screenshot OCR is now implemented locally; see below. Video/audio extraction is not implemented. A free, permitted content-reading path must be verified before promising link-only automation.

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

## Comment screenshots (new)

Choose up to 10 JPEG/PNG/WebP screenshots, or share images from Android to the installed app. The Android Web Share Target now accepts multipart POST files; the service worker stores those files in on-device IndexedDB, then launches the cached app. No image is sent to an OCR service or to the sync database. Android share-sheet presentation still depends on Chrome/device support and needs a physical-device check.

The app ships a pinned Tesseract.js 6.0.1 reader, core 6.1.2 and the Simplified Chinese model. Roughly 6 MB of assets are downloaded once from the app's own site and cached. Chinese comments are the main target; Latin names may be less accurate. The reader works offline after setup and makes no third-party OCR requests. See `vendor/ocr/NOTICE.md`, licenses, and SHA-256 provenance. No paid AI, API subscription, or metered OCR backend is used.

Screenshots are read sequentially, with dark-mode normalization/upscaling and overlapping strips for long images. Limits: 12 MB per file, 40 MB in a selection, 24 million pixels and 30,000 pixels high per decoded image. Large screenshots may need cropping/splitting on memory-constrained phones. Keep the page open while reading. This does not process video/audio or fetch comment threads from a post link.

Recognition is approximate. In the supplied real screenshot test, the browser reader recognized the restaurant name 天明饭店, but some location wording was misread. The review screen and editable recognized text are required, not optional evidence that exact geocoding succeeded. Comment date/location metadata and some phonetic rows are ignored; nearby prose can supply an area clue. An area is never presented as a verified street address or resolved POI.

Source image references accompany reviewed/saved places, and source previews remain available offline on the same device. Duplicate extraction results combine source references. Images stay in IndexedDB even if removed from the current reading selection so saved references remain usable. Clearing browser site data removes them. JSON exports include place text/source IDs, **not screenshot binaries**; retain your originals. Source images and place lists do not sync across devices.

Validation includes the real supplied screenshot read fully offline, editable results and durable source previews, multipart image share reception, parser tests for comment prose/pinyin/date metadata, and existing text-flow regressions. It does not claim perfect OCR or that the native Amap app saved any pins.
