# StudyPin

StudyPin is an AI-powered student knowledge platform built with React, Tailwind CSS, Vite, Node.js, Express, and MongoDB-ready backend patterns.

## What is included

- Modern `frontend` workspace with a StudyPin homepage, hero section, search, and recommendation-style sections.
- `backend` Express API with sample note data, content recommendation endpoint, and AI stub routes.
- Production-ready structure for scaling into PDF upload, OCR, embeddings, and user personalization.

## Run locally

1. Open two terminals.

2. Create a `.env` file inside `backend/` from `.env.example` and set your MongoDB connection, JWT secret, OpenAI key, and Elasticsearch endpoint:

```bash
cd backend
copy .env.example .env
```

3. Start backend:

```bash
cd backend
npm install
npm run dev
```

4. Start frontend:

```bash
cd frontend
npm install
npm run dev
```

5. Open the app at `http://localhost:5173`

## Notes

- The frontend supports a proxy to `http://localhost:4000/api` for the backend.
- The backend now includes OpenAI embedding support, user auth, MongoDB-ready persistence, note upload, and recommendation endpoints.
- Search now uses `GET /api/search?q=...` with fallback text search when configured.
- Use this scaffold to add OCR, Clerk/NextAuth, richer OpenAI pipelines, and advanced recommendation personalization.
