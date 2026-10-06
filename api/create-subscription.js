// /api/create-subscription.js
// Vercel Serverless Function (Node runtime)
//
// Creates (or reuses) a Stripe Customer for the given email, then creates an
// *incomplete* Subscription. Returns the clientSecret for the first invoice's
// PaymentIntent so the frontend can confirm the card via Stripe Elements.
//
// Required env vars (set in Vercel → Project → Settings → Environment Variables):
//   STRIPE_SECRET_KEY        sk_test_... or sk_live_...
//
// Optional (founders rate: Pro at $79/mo for the first 12 months):
//   FOUNDERS_COUPON_ID       Stripe coupon: $50 off, duration "repeating", 12 months
//   PRO_MONTHLY_PRICE_ID     the Pro monthly price ID; the coupon only applies to it
//
// The frontend POSTs:
//   { priceId, offer, email, firstName, lastName, clinic }

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

module.exports = async (req, res) => {
  // --- CORS (only needed if you call this from a different origin; harmless otherwise) ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, offer, email, firstName, lastName, clinic } = req.body || {};

    if (!priceId || !email) {
      return res.status(400).json({ error: 'Missing priceId or email.' });
    }

    // 1) Find or create a Customer for this email (idempotent on email).
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data[0] || await stripe.customers.create({
      email,
      name: [firstName, lastName].filter(Boolean).join(' ') || undefined,
      metadata: {
        clinic: clinic || '',
        source: 'integratehealth-checkout',
      },
    });

    // 2) Create a Subscription with `default_incomplete` so the first invoice
    //    generates a PaymentIntent we can confirm on the client.
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      ...(offer === 'founders' && process.env.FOUNDERS_COUPON_ID &&
          (!process.env.PRO_MONTHLY_PRICE_ID || priceId === process.env.PRO_MONTHLY_PRICE_ID)
        ? { discounts: [{ coupon: process.env.FOUNDERS_COUPON_ID }] }
        : {}),
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        clinic: clinic || '',
        firstName: firstName || '',
        lastName: lastName || '',
        offer: offer || '',
      },
    });

    const paymentIntent = subscription.latest_invoice && subscription.latest_invoice.payment_intent;
    if (!paymentIntent || !paymentIntent.client_secret) {
      return res.status(500).json({ error: 'Could not create payment intent for this subscription.' });
    }

    return res.status(200).json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
    });
  } catch (err) {
    console.error('create-subscription error:', err);
    // Don't leak internal details , return Stripe's user-safe message when present.
    const msg = (err && err.raw && err.raw.message) || err.message || 'Internal error';
    return res.status(500).json({ error: msg });
  }
};
