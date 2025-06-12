import React from "react";
import { useTheme } from "../layouts/AppShell"; // Import useTheme hook
import { useMessage } from '../context/MessageContext'; // Import useMessage hook

function Footer() {
  const currentYear = new Date().getFullYear();
  const { darkMode } = useTheme(); // Use the dark mode context
  const { showMessage } = useMessage(); // Initialize useMessage

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewsletterSubscribe = (e) => {
    e.preventDefault();
    const emailInput = e.target.elements[0]; // Get the email input element
    const email = emailInput.value;

    if (email && email.includes('@') && email.includes('.')) {
      showMessage('Thank you for subscribing to our newsletter!', 'success', 3000);
      emailInput.value = ''; // Clear the input field
    } else {
      showMessage('Please enter a valid email address.', 'error', 3000);
    }
  };


  return (
    <footer className={`mt-16 ${darkMode ? "bg-gray-800 text-white" : "bg-[#2c332f] text-white"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 md:grid-cols-5 text-sm">
          {/* Company Info */}
          <div className="md:col-span-1">
            <h2 className={`text-xl font-bold mb-3 ${darkMode ? "text-green-400" : "text-green-500"}`}>CribLink</h2>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-400"}`}>
              Your trusted partner in finding the perfect property to rent, buy, or sell across Nigeria.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className={`text-md font-semibold mb-3 ${darkMode ? "text-white" : "text-white"}`}>Explore</h3>
            <ul className="space-y-2">
              <li><a href="/" className={`${darkMode ? "text-gray-300 hover:text-green-400" : "hover:text-green-400"} transition`}>Listings</a></li>
              <li><a href="/contact" className={`${darkMode ? "text-gray-300 hover:text-green-400" : "hover:text-green-400"} transition`}>Contact Us</a></li>
              <li><a href="/about" className={`${darkMode ? "text-gray-300 hover:text-green-400" : "hover:text-green-400"} transition`}>About</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className={`text-md font-semibold mb-3 ${darkMode ? "text-white" : "text-white"}`}>Legal</h3>
            <ul className="space-y-2">
              <li><a href="/privacy" className={`${darkMode ? "text-gray-300 hover:text-green-400" : "hover:text-green-400"} transition`}>Privacy Policy</a></li>
              <li><a href="/terms" className={`${darkMode ? "text-gray-300 hover:text-green-400" : "hover:text-green-400"} transition`}>Terms & Conditions</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className={`text-md font-semibold mb-3 ${darkMode ? "text-white" : "text-white"}`}>Newsletter</h3>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-400"} mb-2`}>Get updates about new listings and offers.</p>
            <form onSubmit={handleNewsletterSubscribe} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className={`w-full px-3 py-2 rounded-md text-sm border focus:outline-none focus:ring-2 focus:ring-green-500
                  ${darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-gray-800 text-gray-200 border-gray-700"}`}
              />
              <button
                type="submit"
                className={`px-4 py-2 rounded-md text-sm transition
                  ${darkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Social & App Links */}
          <div>
            <h3 className={`text-md font-semibold mb-3 ${darkMode ? "text-white" : "text-white"}`}>Connect with us</h3>
            <div className="flex space-x-4 mb-4">
              <a href="https://twitter.com" aria-label="Twitter" className={`${darkMode ? "text-gray-300 hover:text-green-400" : "hover:text-green-400"} transition`}>
                <i className="fab fa-twitter text-lg"></i>
              </a>
              <a href="https://facebook.com" aria-label="Facebook" className={`${darkMode ? "text-gray-300 hover:text-green-400" : "hover:text-green-400"} transition`}>
                <i className="fab fa-facebook text-lg"></i>
              </a>
              <a href="https://instagram.com" aria-label="Instagram" className={`${darkMode ? "text-gray-300 hover:text-green-400" : "hover:text-green-400"} transition`}>
                <i className="fab fa-instagram text-lg"></i>
              </a>
              <a href="mailto:info@criblink.com" aria-label="Email" className={`${darkMode ? "text-gray-300 hover:text-green-400" : "hover:text-green-400"} transition`}>
                <i className="fas fa-envelope text-lg"></i>
              </a>
              <a href="https://wa.me/2348123456789" aria-label="WhatsApp" className={`${darkMode ? "text-gray-300 hover:text-green-400" : "hover:text-green-400"} transition`}>
                <i className="fab fa-whatsapp text-lg"></i>
              </a>
            </div>

            <div className="flex space-x-3">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Get it on Google Play"
                className="h-10 object-contain"
              />
              <img
                src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                alt="Download on the App Store"
                className="h-10 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <div className={`mt-12 border-t pt-6 flex flex-col sm:flex-row justify-between items-center text-xs
          ${darkMode ? "border-gray-700 text-gray-500" : "border-gray-700 text-gray-500"}`}>
          <p>&copy; {currentYear} CribLink. All rights reserved.</p>
          <p>Made with 💚 in Nigeria</p>
        </div>

        {/* Back to Top Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={scrollToTop}
            className={`p-2 rounded-full shadow-md transition
              ${darkMode ? "bg-green-600 text-white hover:bg-green-700" : "bg-green-500 text-white hover:bg-green-600"}`}
            title="Back to top"
          >
            <i className="fas fa-arrow-up"></i>
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
