// /api/notify.js
// Vercel Serverless Function (Node 20 runtime)
//
// Sends two emails whenever someone completes a lead/checkout form:
//   1) A NOTIFICATION to your team (with the lead's details; reply-to = the lead)
//   2) A CONFIRMATION to the person who filled out the form
//
// Handles three flows, set by `type` in the POST body:
//   "buy"   → I'm ready to buy        (checkout.html, after payment succeeds)
//   "sales" → I want to speak to sales (schedule.html)
//   "demo"  → Email me a demo          (get-started.html)
//
// Sends email via your Google Workspace (Gmail) mailbox over SMTP (nodemailer).
//
// Required env vars (Vercel → Project → Settings → Environment Variables):
//   SMTP_USER   your Google Workspace address, e.g. "hallesutton@integratehealth.ai"
//   SMTP_PASS   a Google "App Password" (16 chars) — NOT your login password.
//               Create at https://myaccount.google.com/apppasswords
//               (requires 2-Step Verification enabled on the account).
//   SMTP_HOST   "smtp.gmail.com"
//   SMTP_PORT   465
//   FROM_EMAIL  e.g. "Integrate Health <hallesutton@integratehealth.ai>"
//               (must be the same address as SMTP_USER)
//   TEAM_INBOX  where team notifications go, e.g. "hallesutton@integratehealth.ai"
//               (comma-separate for multiple recipients)

const nodemailer = require('nodemailer');

const BRAND_BLUE = '#0057B8';
const BRAND_CYAN = '#5DBED8';
const INK = '#333333';
const MUTED = '#666666';
// Logo is served from the live site (email clients need an absolute URL).
const LOGO_URL = 'https://integratehealth.ai/assets/logo.png';
// Karla / Petrona load in clients that support web fonts (e.g. Apple Mail);
// everywhere else (Gmail, Outlook) the web-safe fallbacks keep the look close.
const FONT_SANS = "'Karla', Arial, Helvetica, sans-serif";
const FONT_SERIF = "'Petrona', Georgia, 'Times New Roman', serif";

// ── Per-flow copy ────────────────────────────────────────────────────────
const FLOWS = {
  buy: {
    teamSubject: (n, c) => `💳 New customer — ${n}${c ? ` (${c})` : ''}`,
    teamLead: 'Someone just completed checkout and is now a customer.',
    custSubject: 'Welcome to Integrate Health 🎉',
    custHeading: "you're all set!",
    custBody:
      "Thanks for choosing Integrate Health. Your account is being set up now — " +
      "we'll be in touch within 24 hours with your login details so you can start " +
      "saving hours every week. Welcome aboard.",
  },
  sales: {
    teamSubject: (n, c) => `📞 Sales call request — ${n}${c ? ` (${c})` : ''}`,
    teamLead: 'Someone requested a call with sales.',
    custSubject: "You're on the calendar — Integrate Health",
    custHeading: "you're on the calendar!",
    custBody:
      "Thanks for booking time with us. We've got your request and a calendar invite " +
      "is on its way. We're looking forward to walking through your workflow and " +
      "seeing how Integrate can help.",
  },
  demo: {
    teamSubject: (n, c) => `✉️ Demo request — ${n}${c ? ` (${c})` : ''}`,
    teamLead: 'Someone requested a demo / overview.',
    custSubject: 'Your Integrate Health demo',
    custHeading: 'your demo is on the way',
    custBody:
      "Thanks for your interest in Integrate Health. We'll be in touch within 24 hours " +
      "to get your 48-hour free trial started and show you how it works. Get ready to " +
      "get time back.",
  },
};

// ── Email chrome ─────────────────────────────────────────────────────────
function shell(innerHtml) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600&family=Petrona:ital,wght@0,400;0,500;1,400;1,500&display=swap');
    body{margin:0;padding:0;}
    a{text-decoration:none;}
  </style></head>
  <body style="margin:0;padding:0;background:#f4f6f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,87,184,0.08);">
        <!-- Logo header on white, the way it sits on the site -->
        <tr><td align="center" style="padding:30px 28px 22px;">
          <img src="${LOGO_URL}" alt="Integrate Health" width="190" style="display:block;width:190px;max-width:60%;height:auto;" />
        </td></tr>
        <!-- Gradient accent bar (solid fallback first) -->
        <tr><td style="height:4px;line-height:4px;font-size:0;background:${BRAND_BLUE};background:linear-gradient(90deg,#5DBED8 0%,#0057B8 100%);">&nbsp;</td></tr>
        <tr><td style="padding:34px 32px;font-family:${FONT_SANS};color:${INK};">
          ${innerHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #eef1f4;font-family:${FONT_SANS};font-size:12px;line-height:1.6;color:#98a2b3;">
          <a href="https://integratehealth.ai" style="color:${BRAND_BLUE};font-weight:500;">integratehealth.ai</a><br>
          Integrate Health, LLC · the AI scribe built for functional medicine<br>
          You received this because a form was submitted on integratehealth.ai.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

function row(label, value) {
  if (!value) return '';
  return `<tr>
    <td style="padding:9px 0;font-family:${FONT_SANS};font-size:12px;letter-spacing:.4px;text-transform:uppercase;color:#98a2b3;width:140px;vertical-align:top;">${label}</td>
    <td style="padding:9px 0;font-family:${FONT_SANS};font-size:15px;color:${INK};">${esc(value)}</td>
  </tr>`;
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ── SMTP transport (GoDaddy) ─────────────────────────────────────────────
let _transporter = null;
function transporter() {
  if (_transporter) return _transporter;
  const port = Number(process.env.SMTP_PORT || 465);
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465, // 465 = SSL; 587 = STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return _transporter;
}

async function sendEmail({ to, subject, html, replyTo }) {
  return transporter().sendMail({
    from: process.env.FROM_EMAIL,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
}

// ── Handler ──────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const {
      type, firstName = '', lastName = '', email = '',
      phone = '', clinic = '', note = '', day = '', time = '',
    } = body;

    const flow = FLOWS[type];
    if (!flow) return res.status(400).json({ error: 'Unknown form type.' });
    if (!email) return res.status(400).json({ error: 'Missing email.' });

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.FROM_EMAIL || !process.env.TEAM_INBOX) {
      return res.status(500).json({ error: 'Email is not configured on the server.' });
    }

    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || email;
    const teamInbox = process.env.TEAM_INBOX.split(',').map((s) => s.trim()).filter(Boolean);

    // 1) TEAM notification ------------------------------------------------
    const teamHtml = shell(`
      <p style="margin:0 0 6px;font-family:${FONT_SANS};font-size:12px;letter-spacing:.8px;text-transform:uppercase;color:${BRAND_CYAN};font-weight:600;">new lead</p>
      <h1 style="margin:0 0 22px;font-family:${FONT_SANS};font-size:22px;font-weight:500;color:${INK};">${esc(flow.teamLead)}</h1>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #eef1f4;">
        ${row('Name', name)}
        ${row('Email', email)}
        ${row('Phone', phone)}
        ${row('Clinic', clinic)}
        ${row('Requested day', day)}
        ${row('Requested time', time)}
        ${row('Note', note)}
      </table>
      <p style="margin:24px 0 0;font-family:${FONT_SANS};font-size:13px;color:${MUTED};">Just hit reply to respond to ${esc(name)} directly — their address is set as the reply-to.</p>
    `);

    // 2) CUSTOMER confirmation -------------------------------------------
    const custHtml = shell(`
      <h1 style="margin:0 0 18px;font-family:${FONT_SERIF};font-style:italic;font-size:30px;line-height:1.2;color:${BRAND_BLUE};font-weight:500;">${esc(flow.custHeading)}</h1>
      <p style="margin:0 0 18px;font-family:${FONT_SANS};font-size:16px;line-height:1.7;color:${INK};">Hi ${esc(firstName || 'there')},</p>
      <p style="margin:0 0 18px;font-family:${FONT_SANS};font-size:16px;line-height:1.7;color:${INK};">${esc(flow.custBody)}</p>
      ${day || time ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr><td style="border-left:3px solid ${BRAND_CYAN};padding:4px 0 4px 14px;font-family:${FONT_SANS};font-size:15px;color:${INK};"><span style="color:${MUTED};">your time:</span> ${esc([day, time].filter(Boolean).join(' · '))}</td></tr></table>` : ''}
      <p style="margin:28px 0 0;font-family:${FONT_SERIF};font-style:italic;font-size:16px;color:${MUTED};">— the Integrate Health team</p>
    `);

    // Send both. Team email first so a lead is never lost even if the
    // customer address bounces.
    const results = await Promise.allSettled([
      sendEmail({ to: teamInbox, subject: flow.teamSubject(name, clinic), html: teamHtml, replyTo: email }),
      sendEmail({ to: email, subject: flow.custSubject, html: custHtml }),
    ]);

    const teamOk = results[0].status === 'fulfilled';
    const custOk = results[1].status === 'fulfilled';
    if (!teamOk) console.error('Team email failed:', results[0].reason);
    if (!custOk) console.error('Customer email failed:', results[1].reason);

    // As long as the team got notified, treat it as success for the UI.
    if (!teamOk) return res.status(502).json({ error: 'Could not send notification.' });
    return res.status(200).json({ ok: true, teamOk, custOk });
  } catch (err) {
    console.error('notify error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
