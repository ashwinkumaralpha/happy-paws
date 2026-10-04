module.exports = (req, res) => res.status(200).json({ ok: true, emailConfigured: !!process.env.EMAIL_USER });
