const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Make sure to set your secret key in environment variables

router.post("/create-payment-intent", async (req, res) => {
  const { amount, currency } = req.body;

  try {
    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount should be in smallest currency unit (e.g., cents for dollars)
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Send client secret, customerId, and ephemeralKey to the client
    // (customerId and ephemeralKey are required for Payment Sheet)
    res.json({
      clientSecret: paymentIntent.client_secret,
      // In a real application, you will create a Stripe customer and ephemeral key for each user
      // This is a simplified example
      customerId: "cus_xxxxxxxxxxxxxx", // Replace with actual customer ID
      ephemeralKey: "ek_xxxxxxxxxxxxxx", // Replace with actual temporary key
    });
  } catch (e) {
    console.error("Error creating payment intent:", e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

