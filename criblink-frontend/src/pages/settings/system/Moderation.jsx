import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../../layouts/AppShell";
import { useMessage } from "../../../context/MessageContext";
import { useAuth } from "../../../context/AuthContext";

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

function Moderation() {
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { user } = useAuth();

  const [autoApprove, setAutoApprove] = useState(true);
  const [enableComments, setEnableComments] = useState(true);

  const handleToggleAutoApprove = () => {
    setAutoApprove(!autoApprove);
    showMessage(
      `Auto-approve listings ${!autoApprove ? "enabled" : "disabled"}.`,
      "success",
    );
  };

  const handleToggleComments = () => {
    setEnableComments(!enableComments);
    showMessage(
      `User comments ${!enableComments ? "enabled" : "disabled"}.`,
      "success",
    );
  };

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
          Content Moderation
        </h3>
        <p className={`mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Manage how user-generated content is handled.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Switch
            label="Auto-Approve New Listings"
            description="Approve new agent listings automatically."
            isOn={autoApprove}
            handleToggle={handleToggleAutoApprove}
          />
          <Switch
            label="Enable User Comments"
            description="Allow comments on property listings."
            isOn={enableComments}
            handleToggle={handleToggleComments}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default Moderation;
