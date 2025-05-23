import React from "react";
import { motion } from "framer-motion";
import { Building2, Users, CheckCircle, Globe2 } from "lucide-react";

const features = [
  {
    title: "Verified Listings",
    icon: <CheckCircle size={32} className="text-green-600" />,
    description:
      "We ensure every property is validated, verified, and trustworthy—giving you peace of mind.",
  },
  {
    title: "Expert Agents",
    icon: <Users size={32} className="text-green-600" />,
    description:
      "Our vetted agents bring deep knowledge and local insights to every interaction.",
  },
  {
    title: "Nationwide Reach",
    icon: <Globe2 size={32} className="text-green-600" />,
    description:
      "From Lagos to Abuja and beyond, our network spans the entire country.",
  },
  {
    title: "Smart Matching",
    icon: <Building2 size={32} className="text-green-600" />,
    description:
      "Intelligent search and filters help you find your ideal home faster.",
  },
];

const testimonials = [
  {
    name: "Ada Okonkwo",
    quote:
      "CribLink made finding my first apartment in Abuja unbelievably smooth. Their listings are accurate and agents are top-notch!",
  },
  {
    name: "Tunde Adebayo",
    quote:
      "I've worked with many platforms as a real estate agent, but CribLink stands out. It truly empowers both agents and clients.",
  },
  {
    name: "Fatima Bello",
    quote:
      "The interface, the filters, the support—everything about CribLink just works beautifully. Highly recommended!",
  },
];

const AboutUs = () => {
  return (
    <div className="bg-gray-50 pt-0 -mt-6 px-4 md:px-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto text-center"
      >
        <h1 className="text-3xl font-extrabold text-green-700 mb-6">About CribLink</h1>
        <p className="text-gray-600 max-w-3xl mx-auto text-lg">
          CribLink is Nigeria’s modern real estate hub — designed to connect clients,
          agents, and verified property listings into one seamless experience. We
          believe finding your dream home or managing real estate should be
          intuitive, transparent, and empowering.
        </p>
      </motion.div>

      {/* Mission & Vision */}
      <div className="mt-16 max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-green-600"
        >
          <h2 className="text-2xl font-bold text-green-700 mb-4">Our Mission</h2>
          <p className="text-gray-700 leading-relaxed">
            To redefine how people discover, interact with, and manage real estate
            in Nigeria — through technology, trust, and simplicity.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-green-600"
        >
          <h2 className="text-2xl font-bold text-green-700 mb-4">Our Vision</h2>
          <p className="text-gray-700 leading-relaxed">
            To be the most trusted platform for real estate in Africa — where agents
            thrive, clients are empowered, and property meets purpose.
          </p>
        </motion.div>
      </div>

      {/* Why Choose Us */}
      <div className="mt-24 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-extrabold text-center text-green-700 mb-12"
        >
          Why Choose CribLink?
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-md text-center border border-green-100 hover:shadow-lg transition duration-300"
            >
              <div className="mb-4 flex justify-center">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-green-700 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
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
          className="text-3xl font-extrabold text-center text-green-700 mb-12"
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
              className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg"
            >
              <p className="text-gray-600 italic mb-4">"{t.quote}"</p>
              <p className="text-green-700 font-semibold">- {t.name}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
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
            Join thousands of Nigerians discovering and managing real estate smarter
            with CribLink.
          </p>
          <button className="bg-white text-green-700 font-semibold py-2.5 px-6 rounded-full shadow hover:bg-gray-100 transition">
            Get Started
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;