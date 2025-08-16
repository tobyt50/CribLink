import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTheme } from '../layouts/AppShell';
import Footer from '../components/Footer';
import { useLocation, useNavigate } from 'react-router-dom';

export default function CheckoutPage() {
  const { darkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedPlan } = location.state || {
    selectedPlan: {
      name: "Pro",
      price: "$29/mo",
      features: [
        "20 active listings",
        "Featured priority: 6",
        "5 Featured listings (14 days)",
        "15 images per listing",
        "1 video tour per listing",
        "Moderate analytics",
        "Instant lead alerts",
      ],
    },
  };

  const handleBack = () => {
    navigate('/subscriptions');
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden font-sans ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}
      style={{ paddingTop: "var(--header-height, 56px)", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      <motion.div
        className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br opacity-5 ${darkMode ? "from-blue-500/10 to-indigo-500/10" : "from-blue-200/10 to-indigo-200/10"}`}
        animate={{ opacity: [0.05, 0.1, 0.05] }}
        transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
      />

      <section className="text-center pb-8 relative z-10" style={{ paddingTop: "var(--header-height, 16px)" }}>
        <motion.h1
          className={`text-5xl md:text-6xl font-light tracking-wide mb-4 ${darkMode ? "text-neutral-100" : "text-neutral-900"}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        >
          Upgrade Your Subscription
        </motion.h1>
        <motion.p
          className={`max-w-3xl mx-auto mb-6 text-lg font-light ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Unlock premium features and take your real estate game to the next level.
        </motion.p>
      </section>

      <section className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto pb-10">
        {/* Plan Summary */}
        <motion.div
          className={`rounded-3xl p-6 mb-8 shadow-lg backdrop-blur-sm ${darkMode ? "bg-neutral-800/60 shadow-black/50" : "bg-white shadow-gray-200"}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          viewport={{ once: true }}
        >
          <h2 className={`text-2xl font-semibold tracking-tight mb-4 ${darkMode ? "text-neutral-100" : "text-neutral-900"}`}>Selected Plan: {selectedPlan.name}</h2>
          <p className={`text-4xl font-bold tracking-tight mb-4 ${darkMode ? "text-neutral-100" : "text-neutral-900"}`}>{selectedPlan.price}</p>
          <ul className="space-y-2 text-sm">
            {selectedPlan.features.map((f, idx) => (
              <li key={idx} className={`flex items-center gap-2 ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>
                <Check className={darkMode ? "text-blue-400" : "text-blue-600"} size={16} /> {f}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Payment Information */}
        <motion.div
          className={`rounded-3xl p-6 mb-8 shadow-lg backdrop-blur-sm ${darkMode ? "bg-neutral-800/60 shadow-black/50" : "bg-white shadow-gray-200"}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          viewport={{ once: true }}
        >
          <h2 className={`text-2xl font-semibold tracking-tight mb-4 ${darkMode ? "text-neutral-100" : "text-neutral-900"}`}>Payment Information</h2>
          <input
            type="text"
            placeholder="Card Number"
            className={`w-full mb-4 p-3 rounded-xl border-none ${darkMode ? "bg-neutral-700 text-white" : "bg-gray-100 text-black"}`}
          />
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="MM"
              className={`w-full p-3 rounded-xl border-none ${darkMode ? "bg-neutral-700 text-white" : "bg-gray-100 text-black"}`}
            />
            <input
              type="text"
              placeholder="YY"
              className={`w-full p-3 rounded-xl border-none ${darkMode ? "bg-neutral-700 text-white" : "bg-gray-100 text-black"}`}
            />
            <input
              type="text"
              placeholder="CVC"
              className={`w-full p-3 rounded-xl border-none ${darkMode ? "bg-neutral-700 text-white" : "bg-gray-100 text-black"}`}
            />
          </div>
          <input
            type="text"
            placeholder="Cardholder Name"
            className={`w-full mb-4 p-3 rounded-xl border-none ${darkMode ? "bg-neutral-700 text-white" : "bg-gray-100 text-black"}`}
          />
        </motion.div>

        {/* Billing Details */}
        <motion.div
          className={`rounded-3xl p-6 mb-8 shadow-lg backdrop-blur-sm ${darkMode ? "bg-neutral-800/60 shadow-black/50" : "bg-white shadow-gray-200"}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          viewport={{ once: true }}
        >
          <h2 className={`text-2xl font-semibold tracking-tight mb-4 ${darkMode ? "text-neutral-100" : "text-neutral-900"}`}>Billing Details</h2>
          <input
            type="email"
            placeholder="Email for Receipt"
            className={`w-full mb-4 p-3 rounded-xl border-none ${darkMode ? "bg-neutral-700 text-white" : "bg-gray-100 text-black"}`}
          />
          <input
            type="text"
            placeholder="Billing Address"
            className={`w-full mb-4 p-3 rounded-xl border-none ${darkMode ? "bg-neutral-700 text-white" : "bg-gray-100 text-black"}`}
          />
          <input
            type="text"
            placeholder="City"
            className={`w-full mb-4 p-3 rounded-xl border-none ${darkMode ? "bg-neutral-700 text-white" : "bg-gray-100 text-black"}`}
          />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="State"
              className={`w-full p-3 rounded-xl border-none ${darkMode ? "bg-neutral-700 text-white" : "bg-gray-100 text-black"}`}
            />
            <input
              type="text"
              placeholder="ZIP Code"
              className={`w-full p-3 rounded-xl border-none ${darkMode ? "bg-neutral-700 text-white" : "bg-gray-100 text-black"}`}
            />
          </div>
          <input
            type="text"
            placeholder="Country"
            className={`w-full p-3 rounded-xl border-none ${darkMode ? "bg-neutral-700 text-white" : "bg-gray-100 text-black"}`}
          />
        </motion.div>

        {/* Order Summary */}
        <motion.div
          className={`rounded-3xl p-6 mb-8 shadow-lg backdrop-blur-sm ${darkMode ? "bg-neutral-800/60 shadow-black/50" : "bg-white shadow-gray-200"}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          viewport={{ once: true }}
        >
          <h2 className={`text-2xl font-semibold tracking-tight mb-4 ${darkMode ? "text-neutral-100" : "text-neutral-900"}`}>Order Summary</h2>
          <div className="flex justify-between mb-2 text-sm">
            <span className={`${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>Subtotal</span>
            <span>{selectedPlan.price}</span>
          </div>
          <div className="flex justify-between mb-2 text-sm">
            <span className={`${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>Taxes</span>
            <span>$0.00</span>
          </div>
          <div className="flex justify-between font-bold mt-4">
            <span>Total</span>
            <span>{selectedPlan.price}</span>
          </div>
          <p className={`text-sm mt-4 ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>Billed monthly. Cancel anytime.</p>
        </motion.div>

        {/* Back and Confirm Buttons */}
        <div className="flex gap-4">
          <motion.button
            onClick={handleBack}
            className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 ${darkMode ? "bg-neutral-700 text-white hover:bg-neutral-600" : "bg-gray-200 text-black hover:bg-gray-300"}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back to Plans
          </motion.button>
          <motion.button
            className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 shadow-md ${darkMode ? "bg-white text-black hover:bg-neutral-200" : "bg-black text-white hover:bg-neutral-800"}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Confirm Upgrade
          </motion.button>
        </div>

        {/* Security and Trust */}
        <p className={`text-center mt-6 text-sm ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
          Secure payment. PCI compliant. 30-day money-back guarantee.
        </p>
      </section>

      <Footer />
    </div>
  );
}