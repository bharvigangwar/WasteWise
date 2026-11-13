# WasteWise: Agent Instructions

You are building **WasteWise** with me (a B.Tech CSE student) in small, safe steps across about 5 sessions. Each session is limited by a daily usage quota, so efficiency matters.

## Project summary
A citizen reward website. Citizens upload photos of segregated household waste. AI verifies the waste category. Approved contributions are recorded and earn **Green Coins**. Participating local businesses accept Green Coins under predefined program rules.

Roles: **citizen**, **business** (partner), **admin**.

## Stack and conventions (do not change without asking)
- Monorepo: `client/` (Next.js App Router + React, JavaScript, Tailwind CSS, axios) and `server/` (Node, Express, MongoDB with Mongoose, CommonJS).
- Auth: JWT sent as `Authorization: Bearer <token>`. Passwords hashed with bcryptjs. Token stored in localStorage on the client (keep it simple).
- Images: multer (memory storage) then Cloudinary. Max 5 MB, jpg/png/webp only.
- AI: Google Gemini vision through the current official `@google/genai` SDK. Model name read from env `GEMINI_MODEL`. The AI must return strict JSON: `{ "category": "...", "confidence": 0-1, "reason": "..." }`. Validate and parse it defensively.
- Waste categories: `wet`, `dry`, `recyclable`, `ewaste`, `hazardous`, `unknown`.
- Server layout: `config/ models/ controllers/ routes/ middleware/ services/`. Frontend layout: `app/ components/ context/ lib/`.
- Every new file starts with a short header comment, and every function gets a plain-language comment explaining what it does and why. I am a student and must be able to explain the code.
- Consistent API response shape: `{ success: true, data }` or `{ success: false, message }`. Errors go through `middleware/errorHandler.js`.
- Never commit secrets. Every new env variable must be added to `server/.env.example` or `client/.env.example`.

## Data models
- **User**: name, email (unique), password (select:false), role (citizen|business|admin), isActive.
- **Contribution**: user, imageUrl, imageHash (SHA-256 of the image buffer), declaredCategory, aiCategory, confidence, aiReason, status (approved|rejected|pending_review), coinsAwarded, reviewedBy, timestamps.
- **CoinTransaction** (ledger, append-only): user, type (earn|redeem|refund|adjust), amount, contribution?, redemption?, note, timestamps. **Balance is always computed from the ledger** (sum of amounts), never stored as a mutable field.
- **Business**: owner (User), name, address, category, isApproved, timestamps.
- **Redemption**: user, business, coins, code (unique, short), status (pending|completed|expired|cancelled), expiresAt, timestamps.
- **ProgramRule** (single document): coinsPerCategory map, confidenceThreshold (default 0.75), dailyContributionLimit (default 5), minRedeemCoins, maxRedeemCoinsPerTransaction, coinValueInRupees.

## Core business rules
1. Reject if the same `imageHash` already exists (duplicate image).
2. Reject if the user already hit `dailyContributionLimit` today.
3. Call the AI. If `aiCategory === declaredCategory` and `confidence >= confidenceThreshold`, set status `approved` and create an `earn` ledger entry. If the AI category differs or confidence is below the threshold, set `rejected` (very low confidence) or `pending_review` (borderline) so an admin can decide.
4. Redemption: the citizen requests coins for a business, which creates a `pending` Redemption with a code. Coins are deducted through a `redeem` ledger entry at creation. The business confirms the code, which marks it `completed`. If it expires or is cancelled, add a `refund` ledger entry. Enforce the min and max rules from ProgramRule.

## WORKING RULES (important: these protect my daily quota)
1. **Start every session by auditing, not assuming.** Read `PROGRESS.md` first. If it does not exist, inspect the repo (file tree, `package.json` files, key files) to detect which phases below are already complete, then create `PROGRESS.md`. Do not rebuild anything that already works. Phases 0 and 1 are already done by me, so only verify them quickly.
2. Do only the **current day's phases**, then stop at the checkpoint. Do not run ahead.
3. Be economical:
   - Do not re-read files you just wrote. Do not paste whole files back in chat. Summarise changes in a few bullets.
   - Create related files in batches, not one by one.
   - Verify with fast terminal checks (a short `node` script or `curl`/PowerShell `Invoke-RestMethod`), not long-running dev servers or browser/screenshot testing. Only use the browser if I explicitly ask.
   - Keep explanations short. Code comments carry the explanation.
   - Do not refactor working code, add unrequested features, or add TypeScript, Docker or testing frameworks.
4. After each phase: run the quickest check that proves it works, fix problems immediately, then update `PROGRESS.md` (phase status, files created, env vars added, how to test, known issues).
5. At each **CHECKPOINT**: stop, make sure `PROGRESS.md` is current, and give me (a) a one-paragraph summary, (b) the exact `git add` and `git commit -m "..."` commands to run (conventional commit style, written for Windows PowerShell), and (c) any manual steps I must do (for example get a Gemini API key or Cloudinary keys), then wait. **Do not run `git commit` or `git push` yourself.**
6. If you are about to hit a limit or are uncertain, finish the current file cleanly, update `PROGRESS.md` with exact next steps, and stop. Never leave the repo in a half-working state.
7. If something is ambiguous, pick the simplest option consistent with this document and note it in `PROGRESS.md` rather than asking many questions. Ask at most one question at a time, and only when blocked.

## PHASE PLAN
**Day 1: Auth (backend + frontend)**
- Phase 0/1: verify only (monorepo, Express server, DB connection, `/api/health`, error handler).
- Phase 2: User model, register/login/me endpoints, JWT `protect` middleware, `authorize(...roles)` middleware, seed script for the first admin.
- Phase 3: Next.js setup, Tailwind, axios instance with token interceptor, `AuthContext`, login and register pages, navbar, a protected-route wrapper, and a role-aware dashboard shell.
- CHECKPOINT 1.

**Day 2: Upload + AI**
- Phase 4: Cloudinary config, multer upload middleware, Contribution model, `POST /api/contributions` (stores image and hash only), upload page with preview.
- Phase 5: `services/aiClassifier.js` with Gemini vision, strict JSON parsing, error and fallback handling, a small script to test it on a sample image.
- CHECKPOINT 2.

**Day 3: Coins + redemption**
- Phase 6: ProgramRule model with defaults, approval logic from the business rules, CoinTransaction ledger, `coinService.js` (balance, earn), wallet endpoint, citizen dashboard (balance, history, contribution list with status badges).
- Phase 7: Business and Redemption models, business registration (needs admin approval), partner list page, redemption create, confirm and expire logic, business dashboard.
- CHECKPOINT 3.

**Day 4: Admin panel**
- Phase 8: admin endpoints and pages for reviewing `pending_review` contributions (approve or reject), approving businesses, editing ProgramRule, a basic stats overview (users, contributions, coins issued and redeemed).
- CHECKPOINT 4.

**Day 5: Hardening + polish**
- Phase 9: input validation on all endpoints, rate limiting on auth and upload, loading and error states in the UI, responsive layout check, a full end-to-end test script for the happy path, and a README (setup, env vars, architecture, API list, screenshots placeholder).
- FINAL CHECKPOINT.