# Happy Paws Pet Spa: Frontend + Backend

Structure:
  public/index.html   -> frontend (website + booking form)
  server.js           -> backend (Node + Express + Nodemailer)
  package.json, .env.example

## Option A (recommended): one deployment
The backend serves the website. Leave `const API=''` in public/index.html.
1. npm install
2. Copy .env.example to .env and fill in the 3 values
3. npm start -> http://localhost:3000
4. Deploy on Render: Web Service, build `npm install`, start `npm start`, add the 3 env variables.

## Option B: frontend and backend hosted separately
1. Deploy the backend on Render (as above).
2. In public/index.html set `const API='https://your-backend.onrender.com'`.
3. Host public/index.html on GitHub Pages or Netlify.
4. (Optional) set ALLOWED_ORIGIN on Render to your frontend URL.

## Gmail
Google Account > Security > enable 2-Step Verification > App passwords > create one > use as EMAIL_PASS.

## Check
GET /health -> {"ok":true,"emailConfigured":true}
POST /api/booking with JSON: name, phone, date, time, guests, note
