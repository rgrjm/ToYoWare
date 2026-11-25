# Setting up the games page on Netlify

## Files to add to your project
Put these in your site's repo/folder, matching this structure:

```
your-site/
├── index.html
├── style.css
├── games.html          (replace existing)
├── games.css           (replace existing)
├── netlify.toml        (new)
├── package.json         (new — or merge into your existing one)
└── netlify/
    └── functions/
        ├── games.js     (new)
        ├── file.js      (new)
        └── verify.js    (new)
```

## 1. Install the storage package
In your project folder:
```
npm install
```
This pulls in `@netlify/blobs`, listed in `package.json`.

## 2. Set your admin key
This is the password that lets you add/edit/remove games and upload files.
- Go to your site in the Netlify dashboard
- **Site configuration → Environment variables → Add a variable**
- Key: `ADMIN_KEY`
- Value: pick a real password (not "admin" or "password123" — treat it like any other login)
- Save, then trigger a new deploy (env vars only apply to deploys made after they're set)

## 3. Deploy
Push to the branch Netlify watches, or drag-and-drop deploy as usual. Netlify will detect
`netlify/functions/` automatically and build `games.js` and `file.js` into live endpoints at:
- `/.netlify/functions/games`
- `/.netlify/functions/file`
- `/.netlify/functions/verify`

## 4. Using it
- Visit `games.html`. Anyone can browse, search, and download.
- Click **admin** in the nav, enter your `ADMIN_KEY` value. The page checks it against the
  server before letting you in — a wrong key shows "Incorrect admin key." A correct key is
  stored only for your current browser tab session (`sessionStorage`) — closing the tab logs
  you out.
- Once logged in, you'll see **+ add game** and **edit** links appear.
- In the add/edit form you can either upload a file directly (stored in Netlify Blobs,
  capped around 5.5MB) or paste an external link (Google Drive, itch.io, your own file host)
  in the "external download link" field — either one fills in the card's **download** link.

## Honest limitations
- The admin check happens server-side (in the function), so it's real in the sense that
  a wrong key gets rejected — but it's still a single shared password, not per-user accounts.
  Don't reuse this password anywhere else.
- Direct uploads are capped by the serverless function payload limit (~5.5MB). For bigger
  game files, use the external link field and host the file elsewhere.
- Netlify Blobs is fine for a personal/portfolio-scale library. It isn't meant to replace
  a CDN for high-traffic file distribution.
