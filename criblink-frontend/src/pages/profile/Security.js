import React from 'react';
import { motion } from 'framer-motion';
import { Loader, Save } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';

function Security({ form, handleChange, handleUpdate, updating }) {
  const { darkMode } = useTheme();

  // Styles for form elements
  const inputFieldStyles =
    `mt-1 block w-full py-2.5 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
      darkMode
        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
    }`;
  const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;
  const inputGroupStyles = "flex flex-col";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="space-y-6"
    >
      {/* Change Password Section */}
      <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-xl font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Change Password</h3>
        <div className="space-y-4">
            <div className={inputGroupStyles}>
                <label className={labelStyles} htmlFor="current_password">Current Password</label>
                <input
                    type="password"
                    id="current_password"
                    name="current_password"
                    value={form.current_password}
                    onChange={handleChange}
                    className={inputFieldStyles}
                    autoComplete="current-password"
                />
            </div>
            <div className={inputGroupStyles}>
                <label className={labelStyles} htmlFor="new_password">New Password</label>
                <input
                    type="password"
                    id="new_password"
                    name="new_password"
                    value={form.new_password}
                    onChange={handleChange}
                    className={inputFieldStyles}
                    autoComplete="new-password"
                />
            </div>
            <div className={inputGroupStyles}>
                <label className={labelStyles} htmlFor="confirm_password">Confirm New Password</label>
                <input
                    type="password"
                    id="confirm_password"
                    name="confirm_password"
                    value={form.confirm_password}
                    onChange={handleChange}
                    className={inputFieldStyles}
                    autoComplete="new-password"
                />
            </div>
        </div>
      </div>

      {/* Two-Factor Authentication Section (Placeholder) */}
      <div>
         <h3 className={`text-xl font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Two-Factor Authentication (2FA)</h3>
         <div className={`p-5 rounded-lg border text-sm ${darkMode ? "bg-gray-900 border-green-700 text-green-200" : "bg-green-50 border-green-200 text-green-700"}`}>
             <p className="mb-2 font-medium">Enhance your account security by enabling Two-Factor Authentication.</p>
             <p>This section is under development. Please check back later to set up 2FA.</p>
         </div>
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="bg-green-600 text-white py-2.5 px-4 rounded-full hover:bg-green-700 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
        >
          {updating ? (
            <Loader size={20} className="animate-spin mr-2 inline-block" />
          ) : (
            <Save size={20} className="mr-2 inline-block" />
          )}
          {updating ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </motion.div>
  );
}

export default Security;
