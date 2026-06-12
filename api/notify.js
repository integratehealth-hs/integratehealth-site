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
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f6f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,0.06);">
        <tr><td style="background:${BRAND_BLUE};padding:22px 28px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:22px;color:#ffffff;font-weight:600;letter-spacing:.2px;">Integrate&nbsp;Health</span>
        </td></tr>
        <tr><td style="padding:32px 28px;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
          ${innerHtml}
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #eef1f4;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#98a2b3;">
          Integrate Health, LLC · This message was sent because a form was submitted on integratehealth.ai
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

function row(label, value) {
  if (!value) return '';
  return `<tr>
    <td style="padding:8px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#98a2b3;width:130px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#1a1a1a;">${esc(value)}</td>
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
      <p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:.6px;text-transform:uppercase;color:${BRAND_CYAN};font-weight:700;">New lead</p>
      <h1 style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:21px;color:#1a1a1a;">${esc(flow.teamLead)}</h1>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${row('Name', name)}
        ${row('Email', email)}
        ${row('Phone', phone)}
        ${row('Clinic', clinic)}
        ${row('Requested day', day)}
        ${row('Requested time', time)}
        ${row('Note', note)}
      </table>
      <p style="margin:22px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#667085;">Reply to this email to respond to ${esc(name)} directly.</p>
    `);

    // 2) CUSTOMER confirmation -------------------------------------------
    const custHtml = shell(`
      <h1 style="margin:0 0 14px;font-family:Georgia,serif;font-style:italic;font-size:26px;color:${BRAND_BLUE};font-weight:600;">${esc(flow.custHeading)}</h1>
      <p style="margin:0 0 18px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#3a3f45;">Hi ${esc(firstName || 'there')},</p>
      <p style="margin:0 0 18px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#3a3f45;">${esc(flow.custBody)}</p>
      ${day || time ? `<p style="margin:0 0 18px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#3a3f45;"><strong>Your time:</strong> ${esc([day, time].filter(Boolean).join(' · '))}</p>` : ''}
      <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#3a3f45;">— The Integrate Health team</p>
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
