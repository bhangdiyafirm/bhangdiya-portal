# Bhangdiya & Bhangdiya — Client Portal

Clients sign in with their Google (Gmail) account, with no password, and view the GST, income
tax and other documents the office has shared with them. Admins add clients and upload documents.
Everything runs on free plans with no card or bank details.

**Nothing important lives on any one computer.** The code is on GitHub, and the site, logins,
data and documents are all on free online services. A computer is only needed to make changes.

| Part | Service (free plan) | Where to manage it |
|---|---|---|
| Code | GitHub `bhangdiyafirm/bhangdiya-portal` | github.com |
| Website + file server | Cloudflare Workers | dash.cloudflare.com |
| Google sign-in + client list | Firebase project `bhangdiya-portal` | console.firebase.google.com |
| Document files | Cloudinary `xxezxppo` | console.cloudinary.com |

## Starting on a new computer
1. Install the **Claude desktop app** (claude.ai/download) and sign in with your Claude account.
2. Install [Git](https://git-scm.com) and [Node.js](https://nodejs.org) (the LTS version).
3. In the Claude app's **Code** tab, start a new session, choose a folder (for example `C:\`),
   and send this message:

   > Clone https://github.com/bhangdiyafirm/bhangdiya-portal into C:\bhangdiya-portal,
   > run npm install, then read CLAUDE.md and tell me where the portal project stands.

4. From then on, open `C:\bhangdiya-portal` in the Code tab and talk to Claude as before.
   `CLAUDE.md` holds everything Claude needs to know; the old chat itself does not move over.

To publish changes from the new computer, Claude will ask you to log in once to Cloudflare
(`npx wrangler login`), and to Firebase only if the database rules change.

No computer at all? **claude.ai/code** in a browser can work on the GitHub project directly.

## First-time setup (once)
1. **Cloudflare**: create a free account, then `npx wrangler login` and `npm run deploy:site`.
   Add the Cloudinary keys: `npx wrangler secret put CLOUDINARY_API_KEY` and
   `npx wrangler secret put CLOUDINARY_API_SECRET` (from Cloudinary → Settings → API Keys).
2. **Firebase** (console.firebase.google.com → Bhangdiya Portal):
   - Authentication → Sign-in method: turn **Google** on; turn Phone and Email/Password off.
   - Authentication → Settings → Authorised domains: add the Cloudflare site address.
   - Google Cloud console → APIs & Services → Credentials → the "Web client" OAuth client:
     add `https://<site address>/__/auth/handler` to Authorised redirect URIs.
   - Firestore: add a document `admins/<admin gmail>` with `role: "admin"` for each admin.
   - Then `npx firebase login` and `npm run deploy:rules`.
3. **Cloudinary**: delete the old `bhangdiya_portal` unsigned upload preset.

## Tests
`npm test` checks that clients can only see their own files, that only verified Google accounts
count, that only admins can upload or delete, and that the file server refuses anyone without
permission. It uses a local copy of the database, never the real one, and needs Java 21+.
