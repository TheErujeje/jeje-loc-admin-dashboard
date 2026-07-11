# LOC Admin Dashboard

Next.js 14 app for managing LOC: users, prize rules, and the payout queue.

## Setup

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL
npm run dev   # runs on :3052
```

## Pages

- `/login` — admin email/password (`POST /auth/admin/login`).
- `/payouts` — read-only view of every payout and its status, plus a manual "Sync & Calculate Now" button (same logic the backend scheduler runs automatically every 15 minutes).
- `/users` — every registered manager.
- `/prize-rules` — configure what gets paid out and to which rank (gameweek winner, season overall, H2H cup, etc.) — these drive what the payout engine calculates.
- `/payouts/approve?token=...` — **this is the page the "Approve payout" link in the admin notification email points to.** No login needed — the token itself is the one-time credential. Landing here immediately approves the payout and fires the Paystack transfer. Set `PAYOUT_APPROVAL_BASE_URL` in the backend's `.env` to `http://localhost:3052/payouts/approve` (or your deployed URL) so the emailed links point here.

## Still needed

Auth guard via middleware instead of client-side redirects, refresh-token handling, a way to mark a season `completed` / open a new season's registration (currently direct-DB or a script — see backend `seed.py`).
