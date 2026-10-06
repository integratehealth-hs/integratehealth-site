// /api/stripe-webhook.js
// Vercel Serverless Function, handles Stripe webhook events.
//
// IMPORTANT: We disable Vercel's default body parser so we receive the raw
// request body. Stripe's signature verification requires the EXACT bytes.
//
// Required env vars:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET    whsec_... (from the Stripe dashboard webhook endpoint)
//
// Register endpoint URL in Stripe dashboard:
//   https://<your-vercel-domain>/api/stripe-webhook
//
// Events to listen for (minimum):
//   invoice.payment_succeeded
//   invoice.payment_failed
//   customer.subscription.created
//   customer.subscription.updated
//   customer.subscription.deleted

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Disable body parsing so we can verify the raw payload signature.
module.exports.config = {
  api: { bodyParser: false },
};

// Read the raw body as a Buffer.
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  let event;
  try {
    const rawBody = await readRawBody(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event.
  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('✅ Invoice paid:', invoice.id, 'customer:', invoice.customer);
        // TODO: provision the user's account, e.g. create a record in your DB,
        // send a welcome email, or trigger a Make/Zapier hook.
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.warn('⚠️ Invoice payment failed:', invoice.id);
        // TODO: notify the customer / mark account as past_due.
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        console.log(`Subscription ${event.type}:`, sub.id, 'status:', sub.status);
        // TODO: sync subscription status to your DB.
        break;
      }
      default:
        // Other event types we don't act on.
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).send('Webhook handler failed');
  }
};
