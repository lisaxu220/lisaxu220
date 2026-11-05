# Offline OCR assets

Tesseract.js 6.0.1 and its matching Tesseract.js-core 6.x dependency were obtained from the official npm packages using npm's lockfile integrity verification. `provenance.json` records exact resolved versions and SHA-256 checksums of the shipped files. License texts and bundled third-party notices are retained in `licenses/`.

The Simplified Chinese model comes from `@tesseract.js-data/chi_sim` 1.0.0, `4.0.0_best_int/chi_sim.traineddata.gz`, published by the Tesseract.js project's naptha/tessdata repository (package declares MIT; underlying Tesseract training data is Apache-2.0). Engine: https://github.com/naptha/tesseract.js . Model distribution: https://github.com/naptha/tessdata . Traineddata source: https://github.com/tesseract-ocr/tessdata_best .

All assets are served from this app's own origin and cached for offline use; no CDN or hosted OCR/AI service receives images. This is approximate text recognition, not guaranteed place identification. Review spellings and location clues against the original screenshot.
