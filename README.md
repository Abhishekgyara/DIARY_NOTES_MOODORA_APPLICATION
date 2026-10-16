# Moodora

Moodora is a personal diary and mood-tracking app. It lets each account write and manage dated diary entries, save daily mood breakdowns, browse entries by calendar, keep a photo gallery, and view journaling analytics.

## Stack

- React 18 and Vite
- Node.js and Express REST API
- MongoDB database named `diarynotes`, accessed with Mongoose
- MongoDB GridFS for photo binaries
- JWT sessions and bcrypt password hashing

The browser keeps a small local cache for rendering. The API and MongoDB are the source of truth for account data.

## Requirements

- Node.js 18 or later
- MongoDB running locally or a MongoDB connection URI

## Configure and run

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create `.env` in the project root using `.env.example` as a template. Set a private, random `JWT_SECRET`. `MONGODB_URI` defaults to `mongodb://127.0.0.1:27017/diarynotes`; the server explicitly selects the `diarynotes` database.

   If an Atlas `mongodb+srv://` URI fails with a DNS `querySrv ECONNREFUSED` error, set `MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1` in `.env` to use public DNS resolvers for the SRV lookup. You can remove this override if your network's DNS starts resolving Atlas correctly.

3. Start the API in one terminal:

   ```sh
   npm run server
   ```

4. Start the Vite app in another terminal:

   ```sh
   npm run dev
   ```

Vite proxies `/api` to `http://localhost:4000`. For a deployed frontend, set `VITE_API_URL` to the API base URL and configure the API's `CLIENT_ORIGIN` to the frontend origin.

## Deploy to Vercel

The Vercel deployment serves the Vite site and the Express API from the same origin. The catch-all serverless function under `api/` forwards API requests to the Express app; `vercel.json` sends client-side routes to the SPA entry point.

1. Push this project to a Git provider and import it in Vercel. Set the Vercel **Root Directory** to `project` if the repository contains this app in a subfolder.
2. Keep the build command as `npm run build` and the output directory as `dist`. The `api/` function is detected automatically; do not set a separate `VITE_API_URL` for the same-origin deployment.
3. In Vercel **Project → Settings → Environment Variables**, add:
   - `MONGODB_URI`: the Atlas connection string, including the database user's credentials. The backend selects the `diarynotes` database.
   - `JWT_SECRET`: a long, random secret. Keep it private and never commit it.
   - `CLIENT_ORIGIN`: optional for same-origin Vercel deployment; if set, use the deployed site origin.
4. In MongoDB Atlas **Network Access**, allow the Vercel backend to connect. Use Vercel static egress IPs when available. `0.0.0.0/0` permits connections from anywhere and should only be a deliberate temporary option; protect the database with a strong, least-privilege database user if you use it.
5. Deploy, then check `https://<your-domain>/api/health`. It should respond with `{"status":"ok","database":"diarynotes"}`.

Vercel serverless request-size limits require photos to be at most 4MB; the app validates the limit before upload. The installed PWA requires HTTPS, which Vercel provides for deployed domains. Desktop Chrome/Edge can show a native install prompt; on iOS Safari use **Share → Add to Home Screen**.

## Data stored in MongoDB

- **Users**: account name, normalized email, bcrypt password hash, reminder settings, and in-progress draft
- **Entries**: title, content, entry date, mood, favorites, word count, and linked photo IDs
- **Moods**: daily mood percentages, unique per account and date
- **Photos**: metadata in MongoDB and image bytes in the `photos` GridFS bucket; JPG, PNG, and WebP files up to 4MB are accepted

Every record is scoped to its authenticated account. Clearing browser storage only clears the local cache; clearing data or deleting an account from Settings removes the corresponding MongoDB records and photos.

Existing browser-only/demo data is not automatically migrated to a new account.

## Useful commands

```sh
npm run build
npm run lint
npm run typecheck
```
