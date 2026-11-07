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

## Status (2026-11-07)
- **Live** at https://bhangdiya-portal.bhangdiya.workers.dev (Cloudflare account subdomain `bhangdiya`),
  deployed from `main` with `npm run deploy:site`. Owner confirmed sign-in and the admin screens work.
- Firebase: Google provider on; new rules published (via the console); authorised domain and the
  Google Cloud OAuth client ("Web client (auto created by Google Service)") include the live address
  and `/__/auth/handler`. Phone and Email/Password providers are still on (harmless: rules ignore them).
- Admins in Firestore: cricketxplore2409@gmail.com and panclients@gmail.com (owner's choice).
  bhangdiyafirm@gmail.com was removed at the owner's request.
- The new version is on `main` (the old Create React App version is in git history before that).
  Vercel still watches `main` and will fail to build it; that's harmless, and the Vercel project
  can be disconnected or deleted whenever the owner likes.
- Cloudinary keys were added in the Cloudflare dashboard as **plain-text variables**, not secrets.
  Before any `wrangler deploy`, make sure they've been changed to type Secret, or the deploy will
  delete them and break uploads (check with `npx wrangler secret list`).
- Still to do:
  1. Owner changes the two Cloudinary variables in Cloudflare from Text to **Secret**.
  2. Delete Cloudinary's old unsigned `bhangdiya_portal` upload preset (the console had signed out).
  3. Optional: make the GitHub repo private; switch off Phone and Email/Password sign-in in Firebase.
  4. Owner may add a custom domain later (free/cheap); it then needs adding to Firebase authorised
     domains and to the Google Cloud OAuth client, like the workers.dev address.
- History: the first version of this rebuild was planned and built in one long Claude Code session
  on the owner's old PC (Nov 2026). That chat is not available on other PCs; this file replaces it.
