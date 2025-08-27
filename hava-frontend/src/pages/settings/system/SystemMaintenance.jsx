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

function SystemMaintenance() {
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { user } = useAuth();

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [dbBackupScheduled, setDbBackupScheduled] = useState(true);

  const handleClearCache = () =>
    showMessage("Cache cleared successfully!", "success");
  const handleBackupDatabase = () =>
    showMessage("Database backup initiated.", "info");
  const handleViewErrorLogs = () =>
    showMessage("Opening error logs (simulated).", "info");

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
          System & Maintenance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Switch
            label="Enable Maintenance Mode"
            description="Take the site offline for updates."
            isOn={maintenanceMode}
            handleToggle={() => setMaintenanceMode(!maintenanceMode)}
          />
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}
          >
            <div>
              <span className="text-lg font-semibold">Application Cache</span>
              <p className="text-sm text-gray-500 mt-1">
                Clear temporary data.
              </p>
            </div>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold"
            >
              Clear
            </button>
          </div>
          <Switch
            label="Automated Database Backups"
            description="Schedule regular database backups."
            isOn={dbBackupScheduled}
            handleToggle={() => setDbBackupScheduled(!dbBackupScheduled)}
          />
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}
          >
            <div>
              <span className="text-lg font-semibold">Manual Backup</span>
              <p className="text-sm text-gray-500 mt-1">
                Create an on-demand backup.
              </p>
            </div>
            <button
              onClick={handleBackupDatabase}
              className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold"
            >
              Backup
            </button>
          </div>
          <div
            className={`md:col-span-2 p-4 rounded-xl border flex items-center justify-between ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}
          >
            <div>
              <span className="text-lg font-semibold">View Error Logs</span>
              <p className="text-sm text-gray-500 mt-1">
                Access system error logs for debugging.
              </p>
            </div>
            <button
              onClick={handleViewErrorLogs}
              className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold"
            >
              View Logs
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default SystemMaintenance;
