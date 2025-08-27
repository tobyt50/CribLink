import { motion } from "framer-motion";
import { Building2, Check, Crown, Rocket, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../layouts/AppShell";

export default function SubscriptionPage() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentUserPlan = user?.subscription_type || "basic";

  const plans = [
    {
      name: "Basic",
      price: "Free",
      tag: "Starter",
      gradient: darkMode
        ? "from-neutral-800/60 to-neutral-900/60"
        : "from-white to-gray-100",
      features: [
        "5 active listings",
        "0 Featured priority",
        "5 images per listing",
        "No video tours",
        "Basic analytics",
      ],
      icon: (
        <Building2
          size={32}
          className={darkMode ? "text-neutral-200" : "text-neutral-700"}
        />
      ),
    },
    {
      name: "Pro",
      price: "$29/mo",
      tag: "Most Popular",
      gradient: darkMode
        ? "from-blue-800/40 to-indigo-800/40"
        : "from-blue-100 to-indigo-100",
      features: [
        "20 active listings",
        "Featured priority: 6",
        "5 Featured listings (14 days)",
        "15 images per listing",
        "1 video tour per listing",
        "Moderate analytics",
        "Instant lead alerts",
      ],
      icon: (
        <Rocket
          size={32}
          className={darkMode ? "text-blue-200" : "text-blue-500"}
        />
      ),
    },
    {
      name: "Enterprise",
      price: "$79/mo",
      tag: "Elite",
      gradient: darkMode
        ? "from-amber-800/40 to-orange-800/40"
        : "from-amber-100 to-orange-100",
      features: [
        "Unlimited listings",
        "Featured priority: 10",
        "10 Featured listings (30 days)",
        "Unlimited images/videos",
        "Advanced analytics",
        "Agency branding + CRM",
        "Priority support + boosts",
      ],
      icon: (
        <Zap
          size={32}
          className={darkMode ? "text-amber-200" : "text-amber-500"}
        />
      ),
    },
  ];

  const container = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const selectPlan = (plan) => {
    const { icon, ...planWithoutIcon } = plan;
    navigate("/subscriptions/checkout", {
      state: {
        selectedPlan: planWithoutIcon,
        currentUserPlan, // pass the current user plan
      },
    });
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
          Command the Market
        </motion.h1>
        <motion.p
          className={`max-w-3xl mx-auto mb-6 text-lg font-light ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          From new agents to market leaders — choose the plan that unlocks your
          full potential on Hava.
        </motion.p>
      </section>

      <section className="relative z-10 px-6 md:px-12 grid md:grid-cols-3 gap-6 pb-10 max-w-7xl mx-auto">
        {plans.map((plan, i) => {
          const isCurrentPlan = plan.name.toLowerCase() === currentUserPlan;
          const isBasicPlan = plan.name === "Basic";

          let buttonText = "Upgrade";
          if (isCurrentPlan) {
            buttonText = "Current Plan";
          } else if (isBasicPlan) {
            buttonText = "Default Plan";
          } else if (currentUserPlan === "enterprise" && plan.name === "Pro") {
            buttonText = "Change Plan";
          }

          return (
            <motion.div
              key={i}
              className={`rounded-3xl bg-gradient-to-br ${plan.gradient} p-6 shadow-lg flex flex-col justify-between ${darkMode ? "shadow-black/50" : "shadow-gray-200"} backdrop-blur-sm ${!isBasicPlan && !isCurrentPlan ? "cursor-pointer" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={
                !isBasicPlan && !isCurrentPlan
                  ? { scale: 1.03, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }
                  : { boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }
              }
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              viewport={{ once: true }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-2xl ${darkMode ? "bg-neutral-800/50" : "bg-gray-100/50"}`}
                  >
                    {plan.icon}
                  </div>
                  {plan.name === "Pro" && (
                    <Star
                      className={darkMode ? "text-amber-200" : "text-amber-500"}
                      size={24}
                    />
                  )}
                  {plan.name === "Enterprise" && (
                    <Crown
                      className={darkMode ? "text-amber-200" : "text-amber-500"}
                      size={24}
                    />
                  )}
                </div>
                <h3
                  className={`text-2xl font-semibold tracking-tight ${darkMode ? "text-neutral-100" : "text-neutral-900"}`}
                >
                  {plan.name}
                </h3>

                <div className="flex items-center justify-between my-3">
                  <p
                    className={`text-4xl font-bold tracking-tight ${darkMode ? "text-neutral-100" : "text-neutral-900"}`}
                  >
                    {plan.price}
                  </p>
                  <button
                    onClick={() =>
                      !isCurrentPlan && !isBasicPlan && selectPlan(plan)
                    }
                    disabled={isCurrentPlan || isBasicPlan}
                    className={`ml-4 font-semibold px-5 py-2 rounded-xl transition-all duration-300 ${
                      isCurrentPlan
                        ? darkMode
                          ? "bg-green-500/30 text-green-300 cursor-default"
                          : "bg-green-600 text-white cursor-default"
                        : isBasicPlan
                          ? darkMode
                            ? "bg-neutral-700/50 text-neutral-400 cursor-default"
                            : "bg-gray-200/50 text-neutral-500 cursor-default"
                          : darkMode
                            ? "bg-white/10 text-white hover:bg-white/20"
                            : "bg-black/5 text-black hover:bg-black/10"
                    }`}
                  >
                    {buttonText}
                  </button>
                </div>

                <span
                  className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ${darkMode ? "bg-neutral-700/50 text-neutral-300" : "bg-gray-200/50 text-neutral-700"}`}
                >
                  {plan.tag}
                </span>

                <motion.ul
                  className="space-y-2 text-sm"
                  variants={container}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {plan.features.map((f, idx) => (
                    <motion.li
                      key={idx}
                      className={`flex items-center gap-2 ${darkMode ? "text-neutral-300" : "text-neutral-700"} font-medium`}
                      variants={item}
                    >
                      <Check
                        className={darkMode ? "text-blue-400" : "text-blue-600"}
                        size={16}
                      />{" "}
                      {f}
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
            </motion.div>
          );
        })}
      </section>

      <section
        className={`relative z-10 text-center py-10 ${darkMode ? "bg-gray-800/50" : "bg-white/50"} backdrop-blur-md`}
      >
        <motion.h2
          className={`text-3xl font-semibold tracking-tight mb-3 ${darkMode ? "text-neutral-100" : "text-neutral-900"}`}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
          viewport={{ once: true }}
        >
          Ready to own your market?
        </motion.h2>
        <motion.p
          className={`mb-6 text-lg font-medium max-w-2xl mx-auto ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          Upgrade today and start dominating your local real estate scene.
        </motion.p>
        <button
          onClick={() => selectPlan(plans[1])}
          className={`px-8 py-3 font-semibold rounded-2xl shadow-md transition-all duration-300 ${darkMode ? "bg-white text-black hover:bg-neutral-200" : "bg-black text-white hover:bg-neutral-800"}`}
        >
          {currentUserPlan === "enterprise"
            ? "Change My Plan"
            : "Upgrade My Plan"}
        </button>
      </section>

      <Footer />
    </div>
  );
}
