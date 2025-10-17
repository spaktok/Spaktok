const express = require("express");
const router = express.Router();
const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  console.warn("STRIPE_SECRET_KEY is not set. Payment endpoints will return 503.");
}
const stripe = require("stripe")(stripeSecret || "");

router.post("/create-payment-intent", async (req, res) => {
  const { amount, currency } = req.body;

  try {
    if (!stripeSecret) {
      return res.status(503).json({ error: "Stripe is not configured" });
    }
    // إنشاء Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // يجب أن يكون المبلغ بالوحدات الأصغر للعملة (مثلاً، سنتات للدولار)
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // إرسال client secret و customerId و ephemeralKey إلى العميل
    // (customerId و ephemeralKey مطلوبان لـ Payment Sheet)
    res.json({
      clientSecret: paymentIntent.client_secret,
      // في تطبيق حقيقي، ستقوم بإنشاء عميل Stripe و ephemeral key لكل مستخدم
      // هذا مثال مبسط
      customerId: "cus_xxxxxxxxxxxxxx", // استبدل بمعرف العميل الحقيقي
      ephemeralKey: "ek_xxxxxxxxxxxxxx", // استبدل بمفتاح مؤقت حقيقي
    });
  } catch (e) {
    console.error("Error creating payment intent:", e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

