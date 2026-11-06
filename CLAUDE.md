# Bhangdiya & Bhangdiya client portal

Client document portal for a Chartered Accountant firm. The owner is not a developer:
explain things in plain language and confirm before changing any live account setting.

## Hard requirement: zero cost
Everything must stay on free plans with **no card or bank details** anywhere. Do not suggest
anything that needs Firebase Blaze, Vercel Pro, Cloudinary paid plans or other paid services.
If a feature can't be done for free, say so and offer the free alternative.

## How it fits together
- **Website**: React + Vite (`src/`), built to `dist/`.
- **Hosting + file server**: Cloudflare Workers free plan. `worker/index.js` serves the site and
  three `/api/*` routes. Config in `wrangler.jsonc`. Secrets (`CLOUDINARY_API_KEY`,
  `CLOUDINARY_API_SECRET`) live only in Cloudflare (`wrangler secret put`), never in git.
- **Login**: Firebase Auth (project `bhangdiya-portal`, Spark/free), mobile number + SMS code.
  Owner account: cricketxplore2409@gmail.com.
- **Database**: Firestore in `asia-south1` (Mumbai). Rules in `firestore.rules`.
  - `admins/{+91XXXXXXXXXX}`: added by hand in the Firebase console only.
  - `clients/{+91XXXXXXXXXX}`: `{ name, active, createdAt }`.
  - `clients/{id}/files/{fileId}`: `{ name, category: GST|ITR|MASTERS, fy: "FY 2025-26"|null, size, publicId, uploadedAt, uploadedBy }`.
- **Documents**: Cloudinary free plan, cloud `xxezxppo`, stored as `type: private`, `resource_type: raw`,
  so nothing opens without a signed link. The Worker gives 5-minute links only after Firestore
  (using the caller's own login token) confirms they may read that file record.

## Known open question
Firebase docs say real SMS codes need the paid Blaze plan; the console mentions 10 free SMS/day.
This must be tested with a real phone. If real SMS is blocked on the free plan, the free fallback
is "Continue with Google" sign-in (enable the Google provider; key clients by email instead).

## Commands
- `npm install` — install packages
- `npm test` — rules and file-server tests on the local emulator (needs Java)
- `npm run emulators` then `npm run seed` then `npm run dev:local` — try the whole site locally
  with fake data (admin 9999999901, client 9999999902; the code shows in the emulator output)
- `npm run deploy:rules` — publish `firestore.rules` (needs `npx firebase login`)
- `npm run deploy:site` — build and publish to Cloudflare (needs `npx wrangler login`)

## Old version
The original Create React App version is on the `main` branch and deployed on Vercel at
cabhangdiyabrothers.vercel.app (test data only). This rebuild is on `rebuild-foundation`.
