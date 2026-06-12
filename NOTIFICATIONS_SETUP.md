# Email notifications setup (Google Workspace / Gmail)

Whenever someone completes one of the three lead forms, the site sends **two emails**:

1. **A notification to your team** — with the lead's name, email, clinic, etc. (reply-to is set to the lead, so you can just hit Reply).
2. **A confirmation to the person** who filled out the form — branded, tailored to what they asked for.

| Form | Page | `type` sent |
|------|------|-------------|
| I'm ready to buy | `checkout.html` (after payment succeeds) | `buy` |
| I want to speak to sales | `schedule.html` | `sales` |
| Email me a demo | `get-started.html` | `demo` |

All three call **`/api/notify`**, which sends through your **Google Workspace
(Gmail) mailbox over SMTP** (via `nodemailer`).

> Note: `integratehealth.ai` is registered at GoDaddy, but **email is run by
> Google**, so we send through Gmail's SMTP server — not GoDaddy's.

---

## One-time setup (about 10 minutes)

### 1. Turn on 2-Step Verification
The Google account `hallesutton@integratehealth.ai` needs 2-Step Verification
enabled before it can issue an app password.
Check at **https://myaccount.google.com/security**.

### 2. Create an App Password
Gmail SMTP will **not** accept your normal password — you need a 16-character
app password:

1. Go to **https://myaccount.google.com/apppasswords**
2. Name it "Website notifications" → **Create**
3. Copy the 16-character password it shows (e.g. `abcd efgh ijkl mnop`).
   Spaces don't matter — with or without works.

> Don't see the App Passwords page? It only appears once 2-Step Verification
> (Step 1) is on.

### 3. Add the environment variables in Vercel
Vercel → your project → **Settings → Environment Variables**. Add each:

| Name | Value |
|------|-------|
| `SMTP_USER` | `hallesutton@integratehealth.ai` |
| `SMTP_PASS` | the 16-char app password from Step 2 |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `FROM_EMAIL` | `Integrate Health <hallesutton@integratehealth.ai>` |
| `TEAM_INBOX` | `hallesutton@integratehealth.ai` |

- `TEAM_INBOX` can be **comma-separated** for several recipients.
- `FROM_EMAIL` must use the **same address** as `SMTP_USER` — Gmail won't let you
  send "from" an address the account doesn't own.
- Apply each to **Production** (and Preview if you want test deploys to send).

### 4. Redeploy
Vercel → **Deployments** → ⋯ on the latest → **Redeploy**, so the new dependency
and env vars take effect.

---

## Testing it

1. Open `get-started.html` on the deployed site, fill it out, submit.
2. The team notification should arrive at `TEAM_INBOX`, and the address you
   entered in the form should get the confirmation.
3. Nothing arrives? Check **Vercel → your project → Logs** for `/api/notify`.
   The usual culprits: using the normal password instead of an app password,
   or 2-Step Verification not enabled.

## Customizing the wording
All subject lines and copy live at the top of **`api/notify.js`** in the `FLOWS`
object. The visual styling (logo bar, colors) is in the `shell()` function below it.

## Notes
- Uses the `nodemailer` package (in `package.json`) to talk SMTP.
- **Sending limits:** a Google Workspace mailbox can send up to ~2,000 emails/day,
  which is plenty for lead notifications. If you ever outgrow it or want better
  transactional deliverability/logging, a dedicated service (AWS SES, Resend) is
  a small change to just the send function.
- For the **buy** flow, the notification is fire-and-forget so a mail hiccup
  never blocks the customer's success screen. **Sales** and **demo** wait for the
  send and show a retry on failure, so a lead is never silently lost.
