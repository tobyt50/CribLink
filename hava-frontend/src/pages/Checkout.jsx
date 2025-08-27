import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTheme } from "../layouts/AppShell";
import Footer from "../components/Footer";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import axiosInstance from "../api/axiosInstance";
import CheckoutForm from "../components/CheckoutForm";

// Initialize Stripe outside of the component to avoid re-creating it on every render
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutPage() {
  const { darkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // If no plan was selected (e.g., user navigated directly to the URL), redirect them.
  if (!location.state?.selectedPlan || !location.state?.currentUserPlan) {
    return <Navigate to="/subscriptions" replace />;
  }

  const { selectedPlan, currentUserPlan } = location.state;

  // Safeguard to prevent checkout for the Basic plan.
  if (selectedPlan.name === "Basic") {
    return <Navigate to="/subscriptions" replace />;
  }

  // Determine the checkout context
  const isDowngrade =
    currentUserPlan === "enterprise" && selectedPlan.name === "Pro";
  const headerText = isDowngrade
    ? "Confirm Your Downgrade"
    : "Complete Your Upgrade";
  const subText = isDowngrade
    ? "You're switching to a plan with fewer features. Please confirm your choice."
    : "You're one step away from unlocking premium features.";

  // State to hold the client secret from the backend
  const [clientSecret, setClientSecret] = useState("");

  // useEffect to create the Payment Intent as soon as the page loads
  useEffect(() => {
    if (selectedPlan) {
      axiosInstance
        .post("/payments/create-payment-intent", {
          planName: selectedPlan.name.toLowerCase(),
        })
        .then((res) => {
          setClientSecret(res.data.clientSecret);
        })
        .catch((err) => {
          console.error("Failed to create payment intent:", err);
        });
    }
  }, [selectedPlan]);

  const appearance = {
    theme: darkMode ? "night" : "stripe",
    variables: {
      colorPrimary: "#10B981",
      colorBackground: darkMode ? "#1F2937" : "#FFFFFF",
      colorText: darkMode ? "#FFFFFF" : "#000000",
      colorDanger: "#EF4444",
      fontFamily: "system-ui, sans-serif",
      borderRadius: "0.75rem",
    },
  };
  const options = {
    clientSecret,
    appearance,
  };

  const handleBack = () => {
    navigate("/subscriptions");
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden font-sans ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}
      style={{
        paddingTop: "var(--header-height, 56px)",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <motion.div
        className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br opacity-5 ${darkMode ? "from-blue-500/10 to-indigo-500/10" : "from-blue-200/10 to-indigo-200/10"}`}
        animate={{ opacity: [0.05, 0.1, 0.05] }}
        transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
      />

      <section className="text-center -mt-6 pb-2 relative z-10">
        <motion.h1
          className={`text-4xl md:text-6xl font-light tracking-wide mb-4 ${darkMode ? "text-green-400" : "text-green-600"}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        >
          {headerText}
        </motion.h1>
        <motion.p
          className={`max-w-3xl mx-auto mb-6 text-lg font-light ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {subText}
        </motion.p>
      </section>

      <section className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto pb-10">
        {/* Plan Summary */}
        <motion.div
          className={`rounded-3xl p-6 md:p-8 mb-8 shadow-lg backdrop-blur-sm ${darkMode ? "bg-neutral-800/60 shadow-black/50" : "bg-white shadow-gray-200"}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row md:items-start md:gap-8">
            {/* Left Side: Plan Name and Price */}
            <div className="flex-shrink-0 md:w-1/3 mb-6 md:mb-0 text-center md:text-left">
              <p
                className={`text-sm font-medium mb-1 ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}
              >
                Selected Plan
              </p>
              <h2
                className={`text-3xl font-bold tracking-tight mb-2 ${darkMode ? "text-neutral-100" : "text-neutral-900"}`}
              >
                {selectedPlan.name}
              </h2>
              <p
                className={`text-5xl font-extrabold tracking-tighter bg-gradient-to-r ${darkMode ? "from-green-400 to-blue-400" : "from-green-600 to-blue-600"} bg-clip-text text-transparent`}
              >
                {selectedPlan.price.split("/")[0]}
                <span
                  className={`text-lg font-semibold align-baseline ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}
                >
                  /{selectedPlan.price.split("/")[1]}
                </span>
              </p>
            </div>

            {/* Right Side: Features Grid */}
            <div
              className={`flex-grow md:border-l md:pl-8 ${darkMode ? "md:border-neutral-700" : "md:border-neutral-200"}`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${darkMode ? "text-neutral-200" : "text-neutral-800"}`}
              >
                Plan Benefits:
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {selectedPlan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className={`flex items-start gap-3 ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}
                  >
                    <Check
                      className={`flex-shrink-0 mt-1 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                      size={16}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Payment Information */}
        <motion.div
          className={`rounded-3xl p-6 mb-8 shadow-lg backdrop-blur-sm ${darkMode ? "bg-neutral-800/60 shadow-black/50" : "bg-white shadow-gray-200"}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          viewport={{ once: true }}
        >
          <h2
            className={`text-2xl font-semibold tracking-tight mb-4 ${darkMode ? "text-neutral-100" : "text-neutral-900"}`}
          >
            Payment Details
          </h2>

          {clientSecret ? (
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm
                selectedPlan={selectedPlan}
                currentUserPlan={currentUserPlan}
              />
            </Elements>
          ) : (
            <div className="text-center p-8">Loading payment form...</div>
          )}
        </motion.div>

        {/* Back Button */}
        <div className="flex gap-4">
          <motion.button
            onClick={handleBack}
            className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 ${darkMode ? "bg-neutral-700 text-white hover:bg-neutral-600" : "bg-gray-200 text-black hover:bg-gray-300"}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back to Plans
          </motion.button>
        </div>

        <p
          className={`text-center mt-6 text-sm ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}
        >
          Secure payment via Stripe. PCI compliant.
        </p>
      </section>

      <Footer />
    </div>
  );
}
