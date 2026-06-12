# Redeploy — files to push since last night

Drop these into your repo (same paths), commit, and push. Vercel redeploys automatically.

| File in this folder | Goes to (in your repo) | What changed |
|---------------------|------------------------|--------------|
| `schedule.html` | `schedule.html` (root) | Real Google booking calendar embedded (replaces the mock slot-picker) |
| `api/notify.js` | `api/notify.js` | Integrate-branded emails (logo, gradient, Karla/Petrona) |

That's everything for the website. No environment-variable changes needed.

Not in here (on purpose):
- `booking-emails.gs` → already installed in Google Apps Script; it is NOT part of the website and does not get deployed.
