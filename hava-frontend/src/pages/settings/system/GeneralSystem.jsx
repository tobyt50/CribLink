import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../../layouts/AppShell";
import { useMessage } from "../../../context/MessageContext";
import { useAuth } from "../../../context/AuthContext";
import axiosInstance from "../../../api/axiosInstance";
import API_BASE_URL from "../../../config";
import { Loader, Save } from "lucide-react";

// --- Skeleton Component ---
const GeneralSystemSkeleton = ({ darkMode }) => (
  <div className="space-y-8 animate-pulse">
    <div
      className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
    >
      <div
        className={`h-6 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}
      ></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`h-24 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
          ></div>
        ))}
      </div>
    </div>
    <div className="flex justify-center pt-8">
      <div
        className={`h-12 w-48 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
      ></div>
    </div>
  </div>
);

function GeneralSystem() {
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const [settings, setSettings] = useState({
    site_name: "RealtyHub",
    contact_email: "support@realtyhub.com",
    default_currency: "NGN",
    mapbox_api_key: "",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch system settings
  const fetchSystemSettings = useCallback(async () => {
    setLoading(true);
    try {
      // NOTE: Assuming an endpoint '/system/settings' exists for admins.
      // You will need to create this on your backend.
      // For now, we'll simulate a fetch.
      // const response = await axiosInstance.get('/system/settings');
      // setSettings(response.data);

      // Simulating a load with current state
      setTimeout(() => setLoading(false), 500);
    } catch (error) {
      showMessage("Failed to load system settings.", "error");
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchSystemSettings();
  }, [fetchSystemSettings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      // NOTE: Assuming an endpoint '/system/settings' exists to update.
      // await axiosInstance.put('/system/settings', settings, {
      //     headers: { Authorization: `Bearer ${token}` }
      // });
      showMessage(
        "System settings updated successfully! (Simulated)",
        "success",
      );
    } catch (error) {
      showMessage("Failed to update system settings.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const inputFieldStyles = `mt-1 block w-full py-2.5 px-4 border rounded-xl shadow-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`;
  const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;

  if (loading) {
    return <GeneralSystemSkeleton darkMode={darkMode} />;
  }

  // Only admins should see this component
  if (user?.role !== "admin") {
    return <p>You do not have permission to view these settings.</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div
        className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <h3
          className={`text-lg md:text-xl font-bold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}
        >
          General System Settings
        </h3>
        <p className={`mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Configure core settings for the entire application.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelStyles} htmlFor="site_name">
              Site Name
            </label>
            <input
              type="text"
              id="site_name"
              name="site_name"
              value={settings.site_name}
              onChange={handleChange}
              className={inputFieldStyles}
              placeholder="e.g., RealtyHub"
            />
          </div>
          <div>
            <label className={labelStyles} htmlFor="contact_email">
              Public Contact Email
            </label>
            <input
              type="email"
              id="contact_email"
              name="contact_email"
              value={settings.contact_email}
              onChange={handleChange}
              className={inputFieldStyles}
              placeholder="e.g., support@example.com"
            />
          </div>
          <div>
            <label className={labelStyles} htmlFor="default_currency">
              Default Currency
            </label>
            <select
              id="default_currency"
              name="default_currency"
              value={settings.default_currency}
              onChange={handleChange}
              className={inputFieldStyles}
            >
              <option value="NGN">Nigerian Naira (NGN)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>
          <div>
            <label className={labelStyles} htmlFor="mapbox_api_key">
              Mapbox API Key
            </label>
            <input
              type="text"
              id="mapbox_api_key"
              name="mapbox_api_key"
              value={settings.mapbox_api_key}
              onChange={handleChange}
              className={inputFieldStyles}
              placeholder="pk.ey..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="bg-green-600 text-white py-2.5 px-6 rounded-full hover:bg-green-700 text-lg font-semibold disabled:opacity-50 flex items-center"
        >
          {updating ? (
            <Loader size={20} className="animate-spin mr-2" />
          ) : (
            <Save size={20} className="mr-2" />
          )}
          {updating ? "Saving..." : "Save System Settings"}
        </button>
      </div>
    </motion.div>
  );
}

export default GeneralSystem;
