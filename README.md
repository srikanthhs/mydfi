# Field Visits (mydfi.vercel.app)

Field inspection app for Mayiladuthurai District. Single-page app in `index.html`, deployed on Vercel.

## Deploy
- Merging into `main` deploys to production on Vercel automatically.
- If mydfi.vercel.app does not switch to the new deploy, open Vercel → mydfi → Deployments and **Promote** the latest one.
- `build.js` splits `index.html` into hashed CSS/JS files at deploy time. Bump `CACHE` in `sw.js` on every release.

## AI features (Google Gemini)
- `api/ai.js` is a Vercel function that calls Gemini. It powers "Clean up with AI" on New visit and "Write AI summary" on the weekly card.
- It needs the environment variable `GEMINI_API_KEY` in Vercel (Production **and** Preview). Create the key at https://aistudio.google.com/apikey.
- After adding or changing the key, redeploy so the new value is picked up.
