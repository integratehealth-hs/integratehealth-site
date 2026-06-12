# Email notifications — files to update

These are the files that changed to make the lead forms send emails.
Drop each one into the **same path** in your project/repo, replacing the
existing file (only `api/notify.js` is brand new).

| File in this folder | Goes to (in your repo) | New or changed |
|---------------------|------------------------|----------------|
| `api/notify.js` | `api/notify.js` | 🆕 new file |
| `get-started.html` | `get-started.html` | changed (demo form wired up) |
| `schedule.html` | `schedule.html` | changed (sales form wired up) |
| `checkout.html` | `checkout.html` | changed (buy → notify on success) |
| `package.json` | `package.json` | changed (added `nodemailer`) |
| `.env.example` | `.env.example` | changed (documents the new vars) |
| `NOTIFICATIONS_SETUP.md` | `NOTIFICATIONS_SETUP.md` | 🆕 setup guide |

## After you copy these in
1. Commit & push so Vercel deploys (or however you deploy).
2. In Vercel → Settings → Environment Variables, add the 6 values:
   - `SMTP_USER` = `hallesutton@integratehealth.ai`
   - `SMTP_PASS` = your 16-char Google **app password**
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `465`
   - `FROM_EMAIL` = `Integrate Health <hallesutton@integratehealth.ai>`
   - `TEAM_INBOX` = `hallesutton@integratehealth.ai`
3. Redeploy, then test by submitting the form on `get-started.html` on the live site.

Full details are in `NOTIFICATIONS_SETUP.md`.
