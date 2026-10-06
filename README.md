# Publish package

Copy everything in this folder into your GitHub repo at the same paths (replace existing files), commit, and push. Vercel redeploys automatically.

## What's included
- Pages (repo root): index.html, pricing.html, checkout.html, solutions.html, comparison.html, get-started.html, schedule.html, privacy-policy.html, terms-of-service.html, 404.html (new)
- Config (repo root): vercel.json (clean URLs), package.json, robots.txt, sitemap.xml, llms.txt, .env.example
- assets/: site.js (new), doctor.webp, card-bg.webp (new)
- api/: notify.js, create-subscription.js, stripe-webhook.js

## Still needed before checkout works
1. Stripe price IDs: checkout.html still has 6 placeholders (price_REPLACE_...). Send the 6 Live price IDs and they will be filled in.
2. Vercel environment variables (Live mode): STRIPE_SECRET_KEY (sk_live_...), STRIPE_WEBHOOK_SECRET (whsec_...), FOUNDERS_COUPON_ID, PRO_MONTHLY_PRICE_ID. Redeploy after adding them.

Until step 1 is done, the rest of the site works normally; only checkout will show an error.

## Clean up in GitHub
Delete these from your repo: checkout-original-backup.html, temp_animation_template.html, extracted_242b1174.jsx, extracted_50d75347.jsx, extracted_bc5383a1.jsx, ios-frame.jsx, mobile-preview.html, email-preview.html, assets/carousel-1.png, assets/carousel-2.png, assets/carousel-3.png, assets/carousel-bg.png.
