# Bhangdiya & Bhangdiya client portal

Client document portal for a Chartered Accountant firm. The owner is not a developer:
explain things in plain language and confirm before changing any live account setting.

## Hard requirement: zero cost
Everything must stay on free plans with **no card or bank details** anywhere. Do not suggest
anything that needs Firebase Blaze, Vercel Pro, Cloudinary paid plans or other paid services.
If a feature can't be done for free, say so and offer the free alternative.

SMS / mobile OTP login was tested on 2026-11-06 and is **not possible for free**: Firebase
refuses to send SMS without the paid Blaze plan (`auth/operation-not-allowed`). The owner chose
Google-account sign-in instead. Don't bring SMS back unless they agree to pay.

## How it fits together
- **Website**: React + Vite (`src/`), built to `dist/`.
- **Hosting + file server**: Cloudflare Workers free plan. `worker/index.js` serves the site,
  three `/api/*` routes, and forwards `/__/auth/*` to `bhangdiya-portal.firebaseapp.com` so Google
  sign-in runs on our own address (needed for phone browsers; see `src/firebase.js`).
  Config in `wrangler.jsonc`. Secrets (`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) live only
  in Cloudflare (`wrangler secret put`), never in git.
- **Login**: Firebase Auth (project `bhangdiya-portal`, Spark/free), "Continue with Google" only.
  Pop-up on computers, full-page redirect on phones. Owner account: cricketxplore2409@gmail.com.
- **Database**: Firestore in `asia-south1` (Mumbai). Rules in `firestore.rules` accept only
  verified Google sign-ins, matched on the lower-case email.
  - `admins/{gmail}`: added by hand in the Firebase console only.
  - `clients/{gmail}`: `{ name, mobile: "+91…"|null, active, createdAt }` (mobile is contact info only).
  - `clients/{gmail}/files/{fileId}`: `{ name, category: GST|ITR|MASTERS, fy: "FY 2025-26"|null, size, publicId, uploadedAt, uploadedBy }`.
- **Documents**: Cloudinary free plan, cloud `xxezxppo`, stored as `type: private`, `resource_type: raw`
  in folder `clients/<email with symbols as _>`, so nothing opens without a signed link. The Worker
  gives 5-minute links only after Firestore (using the caller's own login token) confirms they may
  read that file record.

## Commands
- `npm install` — install packages
- `npm test` — rules and file-server tests on the local emulator (needs Java 21+)
- `npm run emulators` then `npm run seed` then `npm run dev:local` — try the whole site locally
  with fake data; sign in as `sample.admin@example.com` or `sample.client@example.com`
- `npm run deploy:rules` — publish `firestore.rules` (needs `npx firebase login`)
- `npm run deploy:site` — build and publish to Cloudflare (needs `npx wrangler login`)

## Status
- Rebuild lives on branch `rebuild-foundation`. Not published yet.
- Old Create React App version is on `main`, deployed on Vercel at cabhangdiyabrothers.vercel.app
  (test data only). Publishing the new rules will stop the old site working; that's accepted.
