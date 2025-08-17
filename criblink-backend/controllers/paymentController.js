const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const SUBSCRIPTION_TIERS = require('../config/subscriptionConfig');

// A simple lookup for plan prices (in the smallest currency unit, e.g., cents)
const PLAN_PRICES = {
    pro: 2900, // $29.00
    enterprise: 7900, // $79.00
};

exports.createPaymentIntent = async (req, res) => {
    const { planName } = req.body; // e.g., "pro"
    const user = req.user;

    if (!planName || !PLAN_PRICES[planName]) {
        return res.status(400).json({ message: 'Invalid plan selected.' });
    }

    const amount = PLAN_PRICES[planName];

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd', // Or your preferred currency
            metadata: {
                userId: user.user_id,
                userEmail: user.email,
                targetPlan: planName,
                // If it's an agency_admin, we should track the agency ID
                agencyId: user.role === 'agency_admin' ? user.agency_id : null,
            },
        });

        // Send the client secret back to the frontend
        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Stripe Error:', error.message);
        res.status(500).json({ message: 'Failed to create payment intent.', error: error.message });
    }
};