# voidstream

## Local setup

1. Create a local env file:

   - `cp .env.example .env` (Mac/Linux)
   - `copy .env.example .env` (Windows PowerShell)

2. Fill in `TMDB_API_KEY` in `.env`.

3. Install packages:

   - `npm install`

4. Start both backend proxy and frontend:

   - `npm run start`

5. If 3000 or 5000 is taken, use alternate ports:

   - Frontend: `npm run client:alt` (3001) or set `PORT` manually.
   - Backend: use `npm run server:alt` (5001) or set `PORT` manually:
     - Linux/macOS: `export PORT=5001 && npm run server`
     - Windows PowerShell: `cross-env PORT=5001 npm run server`
   - This mirrors the same pattern as the client alternative and avoids local conflicts.

## Vercel

- Add `TMDB_API_KEY` as a Vercel Environment Variable.
- `vercel.json` is configured for static build + API proxy.
- Deploy with `npx vercel --prod`.
