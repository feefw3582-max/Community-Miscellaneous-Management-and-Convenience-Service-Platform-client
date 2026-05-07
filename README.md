# Community Miscellaneous Management and Convenience Service Platform Client

This repository contains the static resident-side frontend prototype for the community miscellaneous management and convenience service platform.

## Included in this version

- `resident.html`: resident app entry
- `resident.js`: resident app interaction logic
- `shared-state.js`: shared mock state and localStorage linkage
- `styles.css`: shared visual styles
- `site.webmanifest`: installable web app manifest
- `assets/app-icon.svg`: app icon
- `mock/resident-data.json`
- `mock/shared-state.json`
- `tokens/resident-app.tokens.css`
- `tokens/resident-app.tokens.json`

## Run locally

Open `resident.html` directly, or serve the folder with any static server.

Example:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000/resident.html
```

## Notes

- This is a static prototype for presentation and interaction demo purposes.
- Data is powered by mock JSON and `localStorage`.
- The current version focuses on the resident client homepage rework into a more product-like continuous app canvas.
