const nodemailer = require('nodemailer');
const clean = s => String(s || '').trim().slice(0, 300);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const b = { name: clean(body.name), phone: clean(body.phone), date: clean(body.date),
              time: clean(body.time), guests: clean(body.guests), note: clean(body.note) };
  if (b.name.length < 2 || !/^[0-9+ ]{10,14}$/.test(b.phone) || !b.date || !b.time)
    return res.status(400).json({ error: 'Please fill name, phone, date and time correctly' });

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.OWNER_EMAIL)
    return res.status(500).json({ error: 'Email is not configured on the server' });

  try {
    const mailer = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.OWNER_EMAIL,
      subject: `New pet booking: ${b.name} (${b.guests})`,
      text: `Name: ${b.name}\nPhone: ${b.phone}\nDate: ${b.date}\nTime: ${b.time}\nPet type: ${b.guests}\nNote: ${b.note || '-'}`
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Email failed:', e.message);
    return res.status(500).json({ error: 'Could not notify the spa' });
  }
};
