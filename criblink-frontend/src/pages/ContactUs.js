import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, Send, Loader, X } from "lucide-react";

const ContactUs = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await fetch("https://criblink-api.onrender.com/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setSent(true);
        setForm({ name: "", email: "", message: "" });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const tawk = document.createElement("script");
    tawk.src = "https://embed.tawk.to/66573b5c9a809f19fb36a2c8/1huas9tmf";
    tawk.async = true;
    tawk.charset = "UTF-8";
    tawk.setAttribute("crossorigin", "*");
    document.body.appendChild(tawk);
    return () => {
      document.body.removeChild(tawk);
    };
  }, []);

  return (
    <div className="bg-gray-50 pt-0 -mt-6 px-4 md:px-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3"
          >
            <span>✅ Message sent successfully!</span>
            <button onClick={() => setShowToast(false)}><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center"
      >
        <h1 className="text-3xl font-extrabold text-green-700 mb-6">Contact Us</h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Have questions or need assistance? We're here to help you every step of the
          way. Reach out to the CribLink team today.
        </p>
      </motion.div>

      <div className="mt-16 max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-6"
        >
          <div className="flex items-start gap-4">
            <Mail className="text-green-600" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Email</h3>
              <p className="text-gray-600">support@criblink.com</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Phone className="text-green-600" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Phone</h3>
              <p className="text-gray-600">+234 701 234 5678</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <MapPin className="text-green-600" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Head Office</h3>
              <p className="text-gray-600">12B Admiralty Way, Lekki Phase 1, Lagos</p>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden mt-6 shadow-lg border border-green-100">
            <iframe
              title="CribLink Office Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3944.417107705835!2d3.457116374961688!3d6.436023025005597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103bf53079a3bb1b%3A0x97ad5ff0e285f1b6!2sLekki%20Phase%201!5e0!3m2!1sen!2sng!4v1716401052342!5m2!1sen!2sng"
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white p-8 rounded-2xl shadow-xl space-y-6 border border-green-100"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full py-2.5 px-4 bg-green-50 border border-green-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full py-2.5 px-4 bg-green-50 border border-green-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows={5}
              className="w-full py-2.5 px-4 bg-green-50 border border-green-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 resize-none"
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={sending}
            className="w-full flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
            {sending ? "Sending..." : "Send Message"}
          </button>
        </motion.form>
      </div>
    </div>
  );
};

export default ContactUs;
