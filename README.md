# AI Gurukul

A jungle-themed, animated, fully responsive AI learning website for kids: AI stories, poems and rhymes, quizzes, homework help and progress tracking.

```
New folder/
├── frontend/   React 19 + Vite + Tailwind CSS 4 + Motion (animations)
└── backend/    Node.js + Express 5 + SQLite (built into Node) + JWT auth
```

## Run it locally

You need **Node.js 22.13 or newer** (24 recommended).

```bash
# 1. Install everything (one time)
npm run setup

# 2. Start the backend  (terminal 1) -> http://localhost:5000
npm run dev:backend

# 3. Start the frontend (terminal 2) -> http://localhost:5173
npm run dev:frontend
```

Open **http://localhost:5173**, click **Start free**, create an account and make your first story.

To run it as a single server (production style): `npm run build` and then `npm start`. This serves the site and the API together on http://localhost:5000.

## Free AI: no key needed

| What | Service | Key? |
|---|---|---|
| Stories, poems, rhymes, quizzes, homework help | [Pollinations](https://pollinations.ai) text API | None |
| Story illustrations | Pollinations image API | None |
| Read-aloud | Browser's built-in speech (Web Speech API) | None |

The keyless Pollinations tier is slow and limited: about **one reply and one image every 45 seconds per IP**. The app is built around this:
- The quiz is written in the **same AI call** as the story, so opening a quiz is instant.
- Each illustration is downloaded **once**, cached in `backend/data/images/`, and spaced to respect the limit. Mascot artwork shows until it's ready.
- If the AI is busy, the backend waits and retries. If it still fails, a built-in practice story is used, so the app never breaks.

**For faster, better answers, add a free key** in `backend/.env` (copy `backend/.env.example`). The first configured provider is tried first, and Pollinations stays as the backup:
- Google Gemini (free tier): https://aistudio.google.com/apikey → `GEMINI_API_KEY=...`
- Groq (free tier): https://console.groq.com/keys → `GROQ_API_KEY=...`

## Features

- **Animated landing page**: swaying trees, drifting clouds, falling leaves, a flying bee, a monkey on a vine, a typing AI demo, and scroll-reveal sections.
- **Family accounts**: a parent signs up (with consent) and adds up to 6 child profiles. After login, each child picks their buddy on the **"Who's learning today?"** screen.
- **Parent Corner** (`/parent`): locked behind the account password, so children can't open it. It shows a family overview, each child's report (written insights, subject levels, quiz scores, weekly activity, recent activity, the homework questions they asked with Guru Owl's answers, stories, badges), and lets the parent add, edit or remove profiles and change the name and password.
- **Story Studio**: any topic, 8 subjects, story / poem / rhyme, "Surprise me".
- **Story reader**: AI illustration, read-aloud with paragraph highlighting, moral, fun fact, flip-card vocabulary.
- **Quizzes**: instant feedback, cheering mascots, confetti, an animated score ring, and a review list.
- **Personalized learning**: each subject has a level from 1 to 5. A quiz score of 80% or more moves it up, under 50% moves it down, and stories and quizzes adapt to the level.
- **Homework Help**: chat with Guru Owl in Hint, Steps or Explain mode. It gives hints first, so the child learns rather than copies.
- **Progress**: XP and jungle ranks, streaks, subject levels, weekly activity chart, quiz history, 8 badges.
- **Kid safety**: unsafe topics are blocked before reaching the AI, child-safe system prompts, per-user AI rate limits.
- **Responsive**: phone layouts use a bottom tab bar, desktop uses a top nav. All animations respect the "reduce motion" system setting.

## How logins work

- **Parent session**: lasts 1 hour, kept only in the current browser tab. It's created by logging in or by re-entering the password inside the app, and it unlocks Parent Corner and lets the parent add explorers.
- **Child session**: lasts 7 days and is used for all learning. Children can switch to a brother's or sister's profile without the password.
- Databases from the first version (one child per login) are upgraded automatically on startup.

## Tests

```bash
cd backend && npm test
```

The tests run with AI turned off (`AI_OFFLINE=1`) and an in-memory database.

## Deploying

- Set `JWT_SECRET` to a long random string and `NODE_ENV=production`.
- Either run `npm run build && npm start` on one server, or host `frontend/dist` separately. In that case set `VITE_API_URL` to the backend URL when building, and `CORS_ORIGIN` on the backend to the frontend URL.
- The SQLite database and cached images live in `backend/data/`. Keep that folder on persistent storage.
