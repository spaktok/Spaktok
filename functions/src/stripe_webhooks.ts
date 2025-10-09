import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {apiVersion: '2022-11-15'});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

admin.initializeApp();

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig!, webhookSecret);
  } catch (err: any) {
    functions.logger.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
  case 'payment_intent.succeeded':
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    functions.logger.info('PaymentIntent was successful!', paymentIntent);
    // TODO: Fulfill the purchase, e.g., update Firestore
    break;
  case 'charge.refunded':
    const charge = event.data.object as Stripe.Charge;
    functions.logger.info('Charge was refunded!', charge);
    // TODO: Handle refund logic
    break;
    // ... handle other event types
  default:
    functions.logger.warn(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

