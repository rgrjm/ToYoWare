# ToYoWare

Source of [toyoware.com](https://toyoware.com) — a portfolio plus a small game library.

- `index.html` — portfolio (contact form uses Netlify Forms)
- `games.html` — game library, backed by Netlify Functions + Blobs
- `toyoware.html` — about page

See `setup.md` for deploying the games page (admin key, functions).
Note: the `games` and `file` functions live in `netlify/functions/` in the deployed repo; `verify.js` should sit there too.
