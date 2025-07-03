import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader, Save, User, Image, Link, X } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';

function General({ form, handleChange, handleUpdate, updating, userInfo, onProfilePictureDataChange }) {
  const { darkMode } = useTheme();

  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  // profilePictureFile state is no longer needed as we directly pass base64 to parent
  // const [profilePictureFile, setProfilePictureFile] = useState(null);

  useEffect(() => {
    if (userInfo?.profile_picture_url) {
      setProfilePicturePreview(userInfo.profile_picture_url);
    } else {
      setProfilePicturePreview('');
    }
  }, [userInfo?.profile_picture_url]);

  const [socialLinks, setSocialLinks] = useState([]);

  useEffect(() => {
    if (userInfo?.social_links && Array.isArray(userInfo.social_links)) {
      setSocialLinks(userInfo.social_links);
    } else {
      setSocialLinks([{ platform: '', url: '' }]);
    }
  }, [userInfo?.social_links]);

  const inputFieldStyles =
    `mt-1 block w-full py-2.5 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
      darkMode
        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
    }`;
  const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;
  const inputGroupStyles = "flex flex-col";

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result); // Set preview from data URL
        onProfilePictureDataChange(reader.result, file.name); // Pass base64 and original name to parent
      };
      reader.readAsDataURL(file);
    } else {
      setProfilePicturePreview('');
      onProfilePictureDataChange(null, null); // Clear base64 data in parent
    }
  };

  const handleClearProfilePicture = () => {
    setProfilePicturePreview(''); // Clear the preview
    onProfilePictureDataChange(null, null); // Signal to parent to clear base64 data
  };

  const addSocialLink = () => {
    const newSocialLinks = [...socialLinks, { platform: '', url: '' }];
    setSocialLinks(newSocialLinks);
    handleChange({ target: { name: 'social_links', value: newSocialLinks } });
  };

  const handleSocialLinkChange = (index, field, value) => {
    const newSocialLinks = [...socialLinks];
    newSocialLinks[index][field] = value;
    setSocialLinks(newSocialLinks);
    handleChange({ target: { name: 'social_links', value: newSocialLinks } });
  };

  const removeSocialLink = (index) => {
    const newSocialLinks = socialLinks.filter((_, i) => i !== index);
    setSocialLinks(newSocialLinks);
    handleChange({ target: { name: 'social_links', value: newSocialLinks } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="space-y-8 p-4 bg-transparent dark:bg-transparent rounded-none shadow-none max-w-full mx-auto my-0
                 md:p-0 md:bg-transparent md:dark:bg-transparent md:rounded-none md:shadow-none md:max-w-none md:mx-0 md:my-0"
    >
      <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-2xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          <User className="mr-3 text-green-500" size={24} /> General Information
        </h3>

        <div className="flex flex-col md:flex-row md:space-x-8 mb-6">
          <div className="md:w-1/2 mb-6 md:mb-0">
            <label className={labelStyles} htmlFor="profile_picture">Profile Picture</label>
            <div className="flex flex-col items-center space-y-4 mt-2">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {profilePicturePreview ? (
                  <img
                    src={profilePicturePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
                {profilePicturePreview && (
                  <button
                    type="button"
                    onClick={handleClearProfilePicture}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    aria-label="Clear profile picture"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <input
                type="file"
                id="profile_picture"
                name="profile_picture"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${darkMode ? "file:bg-green-600 file:text-white file:hover:bg-green-700 text-gray-300" : "file:bg-green-50 file:text-green-700 hover:file:bg-green-100 text-gray-700"}`}
              />
               <p className={`mt-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                 PNG, JPG, or GIF up to 5MB.
               </p>
            </div>
          </div>

          <div className="md:w-1/2">
            <div className={inputGroupStyles}>
              <label className={labelStyles} htmlFor="bio">About Me</label>
              <textarea
                id="bio"
                name="bio"
                value={form.bio || ''}
                onChange={handleChange}
                rows="5"
                className={`${inputFieldStyles} min-h-[100px]`}
                placeholder="Tell us a little about yourself, your interests, or your professional background..."
              ></textarea>
              <p className={`mt-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                A short description about yourself visible on your public profile.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={inputGroupStyles}>
            <label className={labelStyles} htmlFor="full_name">Full Name</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={form.full_name || ''}
              onChange={handleChange}
              className={inputFieldStyles}
              autoComplete="name"
            />
          </div>
          <div className={inputGroupStyles}>
            <label className={labelStyles} htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={form.username || ''}
              onChange={handleChange}
              className={inputFieldStyles}
              autoComplete="username"
            />
          </div>
          <div className={inputGroupStyles}>
            <label className={labelStyles} htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={userInfo.email || ''}
              className={`${inputFieldStyles} cursor-not-allowed ${darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-gray-100 text-gray-500"}`}
              disabled
              autoComplete="email"
            />
          </div>
          <div className={inputGroupStyles}>
            <label className={labelStyles} htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={form.phone || ''}
              onChange={handleChange}
              className={inputFieldStyles}
              autoComplete="tel"
            />
          </div>
          <div className={inputGroupStyles}>
            <label className={labelStyles} htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={form.location || ''}
              onChange={handleChange}
              className={inputFieldStyles}
              autoComplete="address-level1"
            />
          </div>
          {userInfo.role === 'agent' && (
            <div className={inputGroupStyles}>
              <label className={labelStyles} htmlFor="agency">Agency Name</label>
              <input
                type="text"
                id="agency"
                name="agency"
                value={form.agency || ''}
                onChange={handleChange}
                className={inputFieldStyles}
                autoComplete="organization"
              />
            </div>
          )}
           <div className={inputGroupStyles}>
            <label className={labelStyles}>Date Joined</label>
            <input
              type="text"
              value={userInfo.date_joined ? new Date(userInfo.date_joined).toLocaleDateString() : 'N/A'}
              className={`${inputFieldStyles} cursor-not-allowed ${darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-gray-100 text-gray-500"}`}
              disabled
            />
          </div>
        </div>
      </div>

      <div className={`pb-6 mb-6 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-2xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          <Link className="mr-3 text-cyan-500" size={24} /> Social Media & Websites
        </h3>
        <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Add links to your social media profiles or personal websites.
        </p>
        <div className="space-y-4">
          {socialLinks.map((link, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-grow">
                <label className={labelStyles} htmlFor={`platform-${index}`}>Platform</label>
                <input
                  type="text"
                  id={`platform-${index}`}
                  value={link.platform}
                  onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                  className={inputFieldStyles}
                  placeholder="e.g., LinkedIn, Twitter, Personal Website"
                />
              </div>
              <div className="flex-grow-[2]">
                <label className={labelStyles} htmlFor={`url-${index}`}>URL</label>
                <input
                  type="url"
                  id={`url-${index}`}
                  value={link.url}
                  onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                  className={inputFieldStyles}
                  placeholder="https://example.com/your-profile"
                />
              </div>
              {socialLinks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSocialLink(index)}
                  className={`flex-shrink-0 p-2 rounded-full ${darkMode ? "bg-red-700 hover:bg-red-600 text-white" : "bg-red-100 hover:bg-red-200 text-red-600"}`}
                  aria-label="Remove social link"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addSocialLink}
            className={`mt-4 px-4 py-2 rounded-full font-semibold transition duration-200 flex items-center ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-800"}`}
          >
            <Link size={18} className="mr-2" /> Add Another Link
          </button>
        </div>
      </div>


      <div className="flex justify-center pt-8">
      <button
        onClick={() => handleUpdate({})}
        disabled={updating}
        className="bg-green-600 text-white py-2.5 px-4 rounded-full hover:bg-green-700 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition duration-200 ease-in-out transform hover:scale-105 flex items-center"
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
