# No big deal — 100 rejections

A mobile-friendly, dependency-free tracker for jobs, internships, scholarships, and other opportunities. Rejections fill a 100-dot board; accepted applications are celebrated separately. Dates are editable, outcomes can be undone, and entries persist in local browser storage. Local tracking requires no accounts or external services. Optional cross-device sync uses a user-owned Supabase Free project; see [setup instructions](backend/SETUP.md).

## Run locally

From this checkout, run `python3 -m http.server 8000`. Open the server in a browser. No build or dependency installation is needed.

## Publish without a VPN

This repository belongs to `lisaxu220/lisaxu220`. Commit and push `index.html`, `style.css`, and `app.js` to the `gh-pages` branch. In GitHub repository **Settings → Pages**, select **Deploy from a branch**, branch **gh-pages**, folder **/ (root)**, then save. GitHub supplies the public HTTPS URL after deployment (normally `https://lisaxu220.github.io/lisaxu220/`). Use the URL shown by GitHub Pages as the authoritative address. This replaces the existing profile page at that location.

Public hosting does not require a VPN in ordinary network conditions. Availability still depends on local Internet restrictions. The interface is public; application entries stay in localStorage on the user's browser and are not committed or sent to GitHub. Without a configured sync account, entries remain local to each device. Clearing browser data can remove unsynced entries. Use **Export my data** for a JSON backup. Export does not currently include an import interface.

## Validation

Browser checks cover all four opportunity types, rejection progress, editable rejection date, accepted outcomes, reload persistence, filters, undo, JSON export, deletion, 100 board dots, mobile overflow, and JavaScript errors. The app uses browser-local calendar dates for automatic date fields.

## Milestone badges

Rejections unlock badges at 1, 10, 25, 50, 75, and 100. The next-badge progress indicator and badge collection derive from existing saved attempts; no data migration is required. Undoing or deleting a rejection recalculates earned badges. New threshold crossings show a celebration; loading existing progress does not replay it. Reduced-motion preferences disable confetti.

## Install on Android and use offline

Open the public HTTPS site in normal Android Chrome (not incognito). Wait for **Ready offline**, then tap **Install app** and confirm Chrome's prompt. If the prompt is unavailable, use Chrome's **⋮ → Install app / Add to Home screen** menu. Launch from the home-screen icon. After the first successful cache preparation, the app shell, icons, CSS, and JavaScript work offline; adding attempts, outcomes, badges, date edits, and JSON export work offline too. Internet/VPN connectivity is needed for the first visit and later app updates, not for cached offline use.

The manifest uses a stable app ID/start URL and relative scope so GitHub Pages project paths work. The service worker caches only this app's assets, falls back to the app shell for app entry navigation, and removes only old caches with this app's prefix. Updates do not clear localStorage. Change the cache version and asset query versions together whenever changing cached app files. Keep the precache list in `sw.js` in sync with `index.html`.

Installation is free and requires no Play Store account. Installation itself does not add syncing. With the optional free sync account configured, changes sync when online; local-only entries stay in this browser profile. Clearing site storage may remove both offline files and entries; keep exported backups. Installation/offline behavior was tested in Chromium with a normal persistent profile, mobile viewport, no manifest/installability errors, and simulated offline reload/new-page navigation. Physical Android installation still depends on the user's Chrome version and device.

## Optional free sync

The implementation and database schema are prepared; a real Supabase Free project must be connected and tested before deployment. Follow [backend/SETUP.md](backend/SETUP.md). The current public app stays local-only until then. No paid upgrades or services are authorized.
