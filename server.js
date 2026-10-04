require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
// Allow the front end to call this API even if hosted on a different domain
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.set('trust proxy', 1);
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));   // serves the front end

const FILE = path.join(__dirname, 'bookings.json');
const mailer = process.env.EMAIL_USER
  ? nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } })
  : null;

// simple spam guard: max 5 requests / 10 min per IP
const hits = {};
function limited(ip) {
  const now = Date.now();
  hits[ip] = (hits[ip] || []).filter(t => now - t < 600000);
  hits[ip].push(now);
  return hits[ip].length > 5;
}
const clean = s => String(s || '').trim().slice(0, 300);

app.post('/api/booking', async (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: 'Too many requests' });
  const b = { name: clean(req.body.name), phone: clean(req.body.phone), date: clean(req.body.date),
              time: clean(req.body.time), guests: clean(req.body.guests), note: clean(req.body.note) };
  if (b.name.length < 2 || !/^[0-9+ ]{10,14}$/.test(b.phone) || !b.date || !b.time)
    return res.status(400).json({ error: 'Please fill name, phone, date and time correctly' });

  // 1. save to file
  const all = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : [];
  all.push({ ...b, receivedAt: new Date().toISOString() });
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2));
  console.log('New booking:', b);

  // 2. email the owner
  if (mailer) {
    try {
      await mailer.sendMail({
        from: process.env.EMAIL_USER, to: process.env.OWNER_EMAIL,
        subject: `New pet booking: ${b.name} (${b.guests})`,
        text: `Name: ${b.name}\nPhone: ${b.phone}\nDate: ${b.date}\nTime: ${b.time}\nPet type: ${b.guests}\nNote: ${b.note || '-'}`
      });
    } catch (e) {
      console.error('Email failed:', e.message);
      return res.status(500).json({ error: 'Could not notify the spa' });
    }
  }
  res.json({ ok: true });
});

app.get('/health', (req, res) => res.json({ ok: true, emailConfigured: !!mailer }));
if (!mailer) console.warn('WARNING: EMAIL_USER not set. Bookings are saved but emails are NOT sent.');

app.listen(process.env.PORT || 3000, () => console.log('Running on port ' + (process.env.PORT || 3000)));
