# Bhangdiya & Bhangdiya — Client Portal

Clients sign in with their mobile number and a code sent by SMS, then view the GST, income tax
and other documents the office has shared with them. Admins add clients and upload documents.

**Nothing important lives on any one computer.** The code is on GitHub, and the site, logins,
data and documents are all on free online services. A computer is only needed to make changes.

| Part | Service (free plan) | Where to manage it |
|---|---|---|
| Code | GitHub `bhangdiyafirm/bhangdiya-portal` | github.com |
| Website + file server | Cloudflare Workers | dash.cloudflare.com |
| Mobile login + client list | Firebase project `bhangdiya-portal` | console.firebase.google.com |
| Document files | Cloudinary `xxezxppo` | console.cloudinary.com |

## Working on it from any computer
1. Install [Node.js](https://nodejs.org) (LTS) and [Git](https://git-scm.com).
2. `git clone https://github.com/bhangdiyafirm/bhangdiya-portal.git`
3. `cd bhangdiya-portal` then `npm install`
4. Open the folder in Claude Code. `CLAUDE.md` tells it everything about the project.

## First-time setup (once)
1. **Cloudflare**: create a free account, then run `npx wrangler login` and `npm run deploy:site`.
   Add the Cloudinary keys: `npx wrangler secret put CLOUDINARY_API_KEY` and
   `npx wrangler secret put CLOUDINARY_API_SECRET` (from Cloudinary → Settings → API Keys).
2. **Firebase**: `npx firebase login`, then `npm run deploy:rules`.
   In Authentication → Settings → Authorised domains, add the Cloudflare site address.
   In Firestore, add a document `admins/+91XXXXXXXXXX` with `role: "admin"` for each admin mobile.
3. **Cloudinary**: delete the old `bhangdiya_portal` unsigned upload preset.

## Tests
`npm test` checks that clients can only see their own files, that only admins can upload or
delete, and that the file server refuses anyone without permission. It uses a local copy of the
database, never the real one, and needs Java installed.
