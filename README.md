# No big deal — 100 rejections

A mobile-friendly, dependency-free tracker for jobs, internships, scholarships, and other opportunities. Rejections fill a 100-dot board; accepted applications are celebrated separately. Dates are editable, outcomes can be undone, and entries persist in local browser storage. No accounts or external fonts, APIs, or services are required.

## Run locally

From this checkout, run `python3 -m http.server 8000`. Open the server in a browser. No build or dependency installation is needed.

## Publish without a VPN

This repository belongs to `lisaxu220/lisaxu220`. Commit and push `index.html`, `style.css`, and `app.js` to the `gh-pages` branch. In GitHub repository **Settings → Pages**, select **Deploy from a branch**, branch **gh-pages**, folder **/ (root)**, then save. GitHub supplies the public HTTPS URL after deployment (normally `https://lisaxu220.github.io/lisaxu220/`). Use the URL shown by GitHub Pages as the authoritative address. This replaces the existing profile page at that location.

Public hosting does not require a VPN in ordinary network conditions. Availability still depends on local Internet restrictions. The interface is public; application entries stay in localStorage on the user's browser and are not committed or sent to GitHub. Entries do not sync between devices and can be lost if browser data is cleared. Use **Export my data** for a JSON backup. Export does not currently include an import interface.

## Validation

Browser checks cover all four opportunity types, rejection progress, editable rejection date, accepted outcomes, reload persistence, filters, undo, JSON export, deletion, 100 board dots, mobile overflow, and JavaScript errors. The app uses browser-local calendar dates for automatic date fields.
