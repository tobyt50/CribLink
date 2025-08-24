import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../../layouts/AppShell";
import { useMessage } from "../../../context/MessageContext";
import { useAuth } from "../../../context/AuthContext";
import { Loader, Save } from "lucide-react";

const Switch = ({ isOn, handleToggle, label, description }) => {
  const { darkMode } = useTheme();
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border h-full ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}
    >
      <div>
        <span
          className={`text-lg font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}
        >
          {label}
        </span>
        {description && (
          <p
            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mt-1`}
          >
            {description}
          </p>
        )}
      </div>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOn ? "bg-green-600" : darkMode ? "bg-gray-600" : "bg-gray-200"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOn ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
};

function Integrations() {
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { user } = useAuth();

  const [crmEnabled, setCrmEnabled] = useState(false);
  const [analyticsId, setAnalyticsId] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleUpdate = () => {
    setUpdating(true);
    setTimeout(() => {
      showMessage("Integration settings saved! (Simulated)", "success");
      setUpdating(false);
    }, 1000);
  };

  const inputFieldStyles = `mt-1 block w-full py-2.5 px-4 border rounded-xl shadow-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`;
  const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;

  if (user?.role !== "admin")
    return <p>You do not have permission to view these settings.</p>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className={`pb-6 mb-6`}>
        <h3
          className={`text-lg md:text-xl font-bold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}
        >
          Integrations
        </h3>
        <p className={`mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Connect third-party services to enhance functionality.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Switch
            label="Enable CRM Integration"
            description="Sync data with your external CRM."
            isOn={crmEnabled}
            handleToggle={() => setCrmEnabled(!crmEnabled)}
          />
          <div>
            <label htmlFor="analyticsId" className={labelStyles}>
              Google Analytics ID
            </label>
            <input
              type="text"
              id="analyticsId"
              value={analyticsId}
              onChange={(e) => setAnalyticsId(e.target.value)}
              className={inputFieldStyles}
              placeholder="UA-XXXXX-Y"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-center pt-8">
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="bg-green-600 text-white py-2.5 px-6 rounded-full font-semibold flex items-center disabled:opacity-50"
        >
          {updating ? (
            <Loader size={20} className="animate-spin mr-2" />
          ) : (
            <Save size={20} className="mr-2" />
          )}
          Save Integration Settings
        </button>
      </div>
    </motion.div>
  );
}

export default Integrations;
