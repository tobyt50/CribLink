import { motion } from "framer-motion";
import { ArrowLeft, Building2, CheckCircle, Globe2, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom"; // Import useNavigate for routing
import { useAuth } from "../context/AuthContext"; // Import useAuth hook
import { useTheme } from "../layouts/AppShell"; // Import useTheme hook

const features = [
  {
    title: "Verified Listings",
    icon: (
      <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
    ),
    description:
      "We ensure every property is validated, verified, and trustworthy—giving you peace of mind.",
  },
  {
    title: "Expert Agents",
    icon: <Users size={32} className="text-green-600 dark:text-green-400" />,
    description:
      "Our vetted agents bring deep knowledge and local insights to every interaction.",
  },
  {
    title: "Nationwide Reach",
    icon: <Globe2 size={32} className="text-green-600 dark:text-green-400" />,
    description:
      "From Lagos to Abuja and beyond, our network spans the entire country.",
  },
  {
    title: "Smart Matching",
    icon: (
      <Building2 size={32} className="text-green-600 dark:text-green-400" />
    ),
    description:
      "Intelligent search and filters help you find your ideal home faster.",
  },
];

const testimonials = [
  {
    name: "Ada Okonkwo",
    quote:
      "Hava made finding my first apartment in Abuja unbelievably smooth. Their listings are accurate and agents are top-notch!",
  },
  {
    name: "Tunde Adebayo",
    quote:
      "I've worked with many platforms as a real estate agent, but Hava stands out. It truly empowers both agents and clients.",
  },
  {
    name: "Fatima Bello",
    quote:
      "The interface, the filters, the support—everything about Hava just works beautifully. Highly recommended!",
  },
];

const AboutUs = () => {
    const location = useLocation();
  
    const handleBack = () => {
      const fromAuthPage =
        location.key === "default" || // direct load (no history)
        location.state?.fromAuth ||
        ["/signin", "/signup"].includes(document.referrer.split("/").pop());
  
      if (fromAuthPage) {
        // if last page was sign in/up, go to home or dashboard instead
        navigate("/");
      } else {
        navigate(-1);
      }
    };
  const { darkMode } = useTheme(); // Use the dark mode context
  const { user } = useAuth(); // Get user from AuthContext
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Function to handle "Get Started" button click
  const handleGetStarted = () => {
    navigate("/select-role"); // Route to /select-role
  };

  return (
    <div
      className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-8`}
    >
      <button
        onClick={handleBack}
        aria-label="Go back"
        className={`absolute left-4 p-2 rounded-lg shadow-sm transition hover:scale-105
    ${darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700"}`}
      >
        <ArrowLeft size={20} />
      </button>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto text-center"
      >
        <h1
          className={`text-2xl md:text-3xl font-extrabold mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}
        >
          About Hava
        </h1>
        <p
          className={`max-w-3xl mx-auto text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`}
        >
          Hava is Nigeria’s modern real estate hub — designed to connect
          clients, agents, and verified property listings into one seamless
          experience. We believe finding your dream home or managing real estate
          should be intuitive, transparent, and empowering.
        </p>
      </motion.div>

      {/* Mission & Vision */}
      <div className="mt-16 max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className={`p-8 rounded-2xl shadow-lg border-t-4 border-green-600 ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white"}`}
        >
          <h2
            className={`text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}
          >
            Our Mission
          </h2>
          <p
            className={`${darkMode ? "text-gray-300" : "text-gray-700"} leading-relaxed`}
          >
            To redefine how people discover, interact with, and manage real
            estate in Nigeria — through technology, trust, and simplicity.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className={`p-8 rounded-2xl shadow-lg border-t-4 border-green-600 ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white"}`}
        >
          <h2
            className={`text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}
          >
            Our Vision
          </h2>
          <p
            className={`${darkMode ? "text-gray-300" : "text-gray-700"} leading-relaxed`}
          >
            To be the most trusted platform for real estate in Africa — where
            agents thrive, clients are empowered, and property meets purpose.
          </p>
        </motion.div>
      </div>

      {/* Why Choose Us */}
      <div className="mt-24 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-2xl md:text-3xl font-extrabold text-center mb-12 ${darkMode ? "text-green-400" : "text-green-700"}`}
        >
          Why Choose Hava?
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className={`p-6 rounded-xl shadow-md text-center border hover:shadow-lg transition duration-300 ${
                darkMode
                  ? "bg-gray-800 border-green-700 text-gray-200"
                  : "bg-white border-green-100"
              }`}
            >
              <div className="mb-4 flex justify-center">{feature.icon}</div>
              <h3
                className={`text-lg font-semibold mb-2 ${darkMode ? "text-green-400" : "text-green-700"}`}
              >
                {feature.title}
              </h3>
              <p
                className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="mt-24 max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-2xl md:text-3xl font-extrabold text-center mb-12 ${darkMode ? "text-green-400" : "text-green-700"}`}
        >
          What Our Users Say
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className={`p-6 rounded-xl shadow-md border hover:shadow-lg ${
                darkMode
                  ? "bg-gray-800 border-gray-700 text-gray-200"
                  : "bg-white border-gray-100"
              }`}
            >
              <p
                className={`italic mb-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                "{t.quote}"
              </p>
              <p
                className={`font-semibold ${darkMode ? "text-green-400" : "text-green-700"}`}
              >
                - {t.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA - Only show for guest users */}
      {!user && (
        <div className="mt-24 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-gradient-to-br from-green-600 to-green-400 text-white p-10 rounded-2xl shadow-xl"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Find or List Your Property?
            </h2>
            <p className="mb-6 text-white/90">
              Join thousands of Nigerians discovering and managing real estate
              smarter with Hava.
            </p>
            <button
              onClick={handleGetStarted}
              className="bg-white text-green-700 font-semibold py-2.5 px-6 rounded-full shadow hover:bg-gray-100 transition"
            >
              Get Started
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AboutUs;
