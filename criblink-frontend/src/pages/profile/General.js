import React from 'react';
import { motion } from 'framer-motion';
import { Loader, Save } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';

function General({ form, handleChange, handleUpdate, updating, userInfo }) {
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
      {/* General Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input group for Full Name */}
        <div className={inputGroupStyles}>
          <label className={labelStyles} htmlFor="full_name">Full Name</label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className={inputFieldStyles}
            autoComplete="name"
          />
        </div>
        {/* Input group for Username */}
        <div className={inputGroupStyles}>
          <label className={labelStyles} htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            className={inputFieldStyles}
            autoComplete="username"
          />
        </div>
        {/* Input group for Email */}
        <div className={inputGroupStyles}>
          <label className={labelStyles} htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={userInfo.email} // Display email from userInfo as it's not editable
            onChange={handleChange} // Keep onChange for consistency but it's disabled
            className={`${inputFieldStyles} cursor-not-allowed ${darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-gray-100"}`}
            disabled
            autoComplete="email"
          />
        </div>
         {/* Input group for Phone Number */}
         <div className={inputGroupStyles}>
          <label className={labelStyles} htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={inputFieldStyles}
            autoComplete="tel"
          />
        </div>
         {/* Input group for Location */}
         <div className={inputGroupStyles}>
          <label className={labelStyles} htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={form.location}
            onChange={handleChange}
            className={inputFieldStyles}
            autoComplete="address-level1"
          />
        </div>
        {/* Input group for Agency Name (only for agents) */}
        {userInfo.role === 'agent' && (
          <div className={inputGroupStyles}>
            <label className={labelStyles} htmlFor="agency">Agency Name</label>
            <input
              type="text"
              id="agency"
              name="agency"
              value={form.agency}
              onChange={handleChange}
              className={inputFieldStyles}
              autoComplete="organization"
            />
          </div>
        )}
      </div>

      {/* Bio Section */}
      <div className={inputGroupStyles}>
        <label className={labelStyles} htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          name="bio"
          value={form.bio}
          onChange={handleChange}
          className={`${inputFieldStyles} h-28 resize-none`}
          placeholder="Tell us a little about yourself..."
        ></textarea>
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

export default General;
