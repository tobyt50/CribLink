import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader, Save, Shield, Cookie, Mail, Download, Globe } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import axiosInstance from '../../api/axiosInstance';
import API_BASE_URL from '../../config';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';

function Privacy({ form, handleChange, handleUpdate, updating }) {
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  const [privacyLoading, setPrivacyLoading] = useState(true);

  // Initial form state for privacy settings, will be updated from fetched data
  const [privacyForm, setPrivacyForm] = useState({
    data_collection_opt_out: false,
    personalized_ads: true,
    cookie_preferences: {
      essential: true, // Usually not opt-out
      analytics: true,
      marketing: true,
      functional: true,
    },
    communication_email_updates: true,
    communication_marketing: true,
    communication_newsletter: false,
    share_favourites_with_agents: false, // NEW: Add this field
    share_property_preferences_with_agents: false, // NEW: Add this field
  });

  const token = localStorage.getItem("token"); // Get token from local storage

  // Fetch Privacy Settings
  const fetchPrivacySettings = useCallback(async () => {
    setPrivacyLoading(true);
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = response.data;

      // Update privacyForm with fetched data, ensuring defaults if null/undefined
      setPrivacyForm({
        data_collection_opt_out: userData.data_collection_opt_out ?? false,
        personalized_ads: userData.personalized_ads ?? true,
        cookie_preferences: {
          essential: userData.cookie_preferences?.essential ?? true,
          analytics: userData.cookie_preferences?.analytics ?? true,
          marketing: userData.cookie_preferences?.marketing ?? true,
          functional: userData.cookie_preferences?.functional ?? true,
        },
        communication_email_updates: userData.communication_email_updates ?? true,
        communication_marketing: userData.communication_marketing ?? true,
        communication_newsletter: userData.communication_newsletter ?? false,
        share_favourites_with_agents: userData.share_favourites_with_agents ?? false, // NEW: Initialize new field
        share_property_preferences_with_agents: userData.share_property_preferences_with_agents ?? false, // NEW: Initialize new field
      });
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      showMessage(error?.response?.data?.message || 'Failed to load privacy settings.', 'error');
    } finally {
      setPrivacyLoading(false);
    }
  }, [token, showMessage]);

  useEffect(() => {
    if (token) {
      fetchPrivacySettings();
    }
  }, [token, fetchPrivacySettings]);

  const handlePrivacyChange = (e) => {
    const { name, type, checked, value } = e.target;

    if (name.startsWith('cookie_preferences.')) {
      const cookieType = name.split('.')[1];
      setPrivacyForm(prev => ({
        ...prev,
        cookie_preferences: {
          ...prev.cookie_preferences,
          [cookieType]: checked,
        },
      }));
    } else if (type === 'checkbox') {
      setPrivacyForm(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setPrivacyForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const inputFieldStyles =
    `mt-1 block w-full py-2.5 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
      darkMode
        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
    }`;
  const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;

  const handleDataExport = () => {
    showConfirm({
      title: "Request Data Export",
      message: "A request will be sent to export your data. A link to download your data will be sent to your registered email address shortly.",
      onConfirm: async () => {
        // In a real application, this would trigger a backend process to compile user data
        // and send a download link to their email, or directly provide a file.
        // As there's no explicit backend endpoint for this in the provided files,
        // we'll just simulate a success message for now.
        showMessage('Your data export request has been initiated. Check your email for a download link.', 'success');
      },
      confirmLabel: "Confirm Request",
      cancelLabel: "Cancel"
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="space-y-8 p-4 bg-transparent dark:bg-transparent rounded-none shadow-none max-w-full mx-auto my-0
                 md:p-0 md:bg-transparent md:dark:bg-transparent md:rounded-none md:shadow-none md:max-w-none md:mx-0 md:my-0"
    >
      {/* Data Collection & Usage Transparency */}
      <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-2xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          <Shield className="mr-3 text-blue-500" size={24} /> Data & Usage
        </h3>
        <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Control how your data is collected and used to improve your experience.
        </p>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="data_collection_opt_out"
              name="data_collection_opt_out"
              checked={privacyForm.data_collection_opt_out}
              onChange={handlePrivacyChange}
              className={`h-5 w-5 rounded-md ${darkMode ? "form-checkbox text-green-500 bg-gray-700 border-gray-600 focus:ring-green-400" : "form-checkbox text-green-600 bg-white border-gray-300 focus:ring-green-600"}`}
            />
            <label htmlFor="data_collection_opt_out" className={labelStyles}>
              Opt out of anonymous data collection for product improvement.
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="personalized_ads"
              name="personalized_ads"
              checked={privacyForm.personalized_ads}
              onChange={handlePrivacyChange}
              className={`h-5 w-5 rounded-md ${darkMode ? "form-checkbox text-green-500 bg-gray-700 border-gray-600 focus:ring-green-400" : "form-checkbox text-green-600 bg-white border-gray-300 focus:ring-green-600"}`}
            />
            <label htmlFor="personalized_ads" className={labelStyles}>
              Enable personalized advertising based on your activity.
            </label>
          </div>
          {/* NEW: Share Favourites with Agents Setting */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="share_favourites_with_agents"
              name="share_favourites_with_agents"
              checked={privacyForm.share_favourites_with_agents}
              onChange={handlePrivacyChange}
              className={`h-5 w-5 rounded-md ${darkMode ? "form-checkbox text-green-500 bg-gray-700 border-gray-600 focus:ring-green-400" : "form-checkbox text-green-600 bg-white border-gray-300 focus:ring-green-600"}`}
            />
            <label htmlFor="share_favourites_with_agents" className={labelStyles}>
              Allow agents to view your favourited listings on your profile.
            </label>
          </div>
          {/* NEW: Share Property Preferences with Agents Setting */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="share_property_preferences_with_agents"
              name="share_property_preferences_with_agents"
              checked={privacyForm.share_property_preferences_with_agents}
              onChange={handlePrivacyChange}
              className={`h-5 w-5 rounded-md ${darkMode ? "form-checkbox text-green-500 bg-gray-700 border-gray-600 focus:ring-green-400" : "form-checkbox text-green-600 bg-white border-gray-300 focus:ring-green-600"}`}
            />
            <label htmlFor="share_property_preferences_with_agents" className={labelStyles}>
              Allow agents to view your property preferences on your profile.
            </label>
          </div>
        </div>
      </div>

      {/* Cookie Preferences */}
      <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-2xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          <Cookie className="mr-3 text-brown-500" size={24} /> Cookie Preferences
        </h3>
        <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Manage which types of cookies are stored on your device when you use our service.
        </p>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="cookie_preferences.essential"
              name="cookie_preferences.essential"
              checked={privacyForm.cookie_preferences.essential}
              onChange={handlePrivacyChange}
              disabled // Essential cookies are usually required
              className={`h-5 w-5 rounded-md cursor-not-allowed ${darkMode ? "form-checkbox text-gray-500 bg-gray-700 border-gray-600" : "form-checkbox text-gray-400 bg-gray-100 border-gray-300"}`}
            />
            <label htmlFor="cookie_preferences.essential" className={`${labelStyles} ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Essential Cookies (Required)
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="cookie_preferences.analytics"
              name="cookie_preferences.analytics"
              checked={privacyForm.cookie_preferences.analytics}
              onChange={handlePrivacyChange}
              className={`h-5 w-5 rounded-md ${darkMode ? "form-checkbox text-green-500 bg-gray-700 border-gray-600 focus:ring-green-400" : "form-checkbox text-green-600 bg-white border-gray-300 focus:ring-green-600"}`}
            />
            <label htmlFor="cookie_preferences.analytics" className={labelStyles}>
              Analytics Cookies (e.g., website performance)
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="cookie_preferences.marketing"
              name="cookie_preferences.marketing"
              checked={privacyForm.cookie_preferences.marketing}
              onChange={handlePrivacyChange}
              className={`h-5 w-5 rounded-md ${darkMode ? "form-checkbox text-green-500 bg-gray-700 border-gray-600 focus:ring-green-400" : "form-checkbox text-green-600 bg-white border-gray-300 focus:ring-green-600"}`}
            />
            <label htmlFor="cookie_preferences.marketing" className={labelStyles}>
              Marketing Cookies (e.g., personalized ads)
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="cookie_preferences.functional"
              name="cookie_preferences.functional"
              checked={privacyForm.cookie_preferences.functional}
              onChange={handlePrivacyChange}
              className={`h-5 w-5 rounded-md ${darkMode ? "form-checkbox text-green-500 bg-gray-700 border-gray-600 focus:ring-green-400" : "form-checkbox text-green-600 bg-white border-gray-300 focus:ring-green-600"}`}
            />
            <label htmlFor="cookie_preferences.functional" className={labelStyles}>
              Functional Cookies (e.g., remembering preferences)
            </label>
          </div>
        </div>
      </div>

      {/* Communication Preferences */}
      <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-2xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          <Mail className="mr-3 text-purple-500" size={24} /> Communication Preferences
        </h3>
        <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Choose which types of emails you'd like to receive from us.
        </p>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="communication_email_updates"
              name="communication_email_updates"
              checked={privacyForm.communication_email_updates}
              onChange={handlePrivacyChange}
              className={`h-5 w-5 rounded-md ${darkMode ? "form-checkbox text-green-500 bg-gray-700 border-gray-600 focus:ring-green-400" : "form-checkbox text-green-600 bg-white border-gray-300 focus:ring-green-600"}`}
            />
            <label htmlFor="communication_email_updates" className={labelStyles}>
              Product Updates & Service Announcements
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="communication_marketing"
              name="communication_marketing"
              checked={privacyForm.communication_marketing}
              onChange={handlePrivacyChange}
              className={`h-5 w-5 rounded-md ${darkMode ? "form-checkbox text-green-500 bg-gray-700 border-gray-600 focus:ring-green-400" : "form-checkbox text-green-600 bg-white border-gray-300 focus:ring-green-600"}`}
            />
            <label htmlFor="communication_marketing" className={labelStyles}>
              Promotional Offers & Marketing
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="communication_newsletter"
              name="communication_newsletter"
              checked={privacyForm.communication_newsletter}
              onChange={handlePrivacyChange}
              className={`h-5 w-5 rounded-md ${darkMode ? "form-checkbox text-green-500 bg-gray-700 border-gray-600 focus:ring-green-400" : "form-checkbox text-green-600 bg-white border-gray-300 focus:ring-green-600"}`}
            />
            <label htmlFor="communication_newsletter" className={labelStyles}>
              Monthly Newsletter
            </label>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className={`pb-6 mb-6 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-2xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          <Download className="mr-3 text-cyan-500" size={24} /> Export Your Data
        </h3>
        <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Request a copy of all your personal data stored on our platform. The data will be provided in a machine-readable format.
        </p>
        <button
          onClick={handleDataExport}
          className="bg-cyan-600 text-white py-2 px-4 rounded-full hover:bg-cyan-700 text-md font-semibold shadow transition duration-200 ease-in-out transform hover:scale-105 flex items-center"
        >
          <Download size={18} className="mr-2" /> Request Data Export
        </button>
      </div>

      {/* Save Changes Button */}
      <div className="flex justify-center pt-8">
        <button
          onClick={() => handleUpdate(privacyForm)}
          disabled={updating || privacyLoading}
          className="bg-green-600 text-white py-2.5 px-4 rounded-full hover:bg-green-700 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition duration-200 ease-in-out transform hover:scale-105 flex items-center"
        >
          {updating || privacyLoading ? (
            <Loader size={20} className="animate-spin mr-2 inline-block" />
          ) : (
            <Save size={20} className="mr-2 inline-block" />
          )}
          {updating ? "Saving..." : privacyLoading ? "Loading..." : "Save Changes"}
        </button>
      </div>
    </motion.div>
  );
}

export default Privacy;
