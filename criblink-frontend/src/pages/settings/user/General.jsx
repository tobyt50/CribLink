import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, Save, User, Image, Link, X, UserPlus, Hourglass, UserRoundCheck, UserX, EllipsisVertical, Landmark, ChevronDownIcon, Search, CheckCircle, PencilIcon } from 'lucide-react';
import { useTheme } from '../../../layouts/AppShell';
import axiosInstance from '../../../api/axiosInstance';
import API_BASE_URL from '../../../config';
import { useMessage } from '../../../context/MessageContext';
import { useConfirmDialog } from '../../../context/ConfirmDialogContext';
import { useAuth } from '../../../context/AuthContext';

// --- Skeleton for General section ---
const GeneralSectionSkeleton = ({ darkMode }) => (
    <div className="space-y-8 animate-pulse">
        <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div className={`h-6 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}></div>
            <div className="flex flex-col md:flex-row md:space-x-8">
                <div className="md:w-1/2 mb-6 md:mb-0">
                    <div className="flex flex-col items-center space-y-4 mt-2">
                        <div className={`w-32 h-32 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                        <div className={`h-8 w-full rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                    </div>
                </div>
                <div className="md:w-1/2">
                    <div className={`h-32 w-full rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i}><div className={`h-10 w-full rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div></div>
                ))}
            </div>
        </div>
        <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div className={`h-6 w-1/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}></div>
            <div className={`h-24 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
        </div>
        <div className={`pb-6 mb-6 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div className={`h-6 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}></div>
            <div className={`h-24 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
        </div>
    </div>
);


function General() {
    const { darkMode } = useTheme();
    const { showMessage } = useMessage();
    const { showConfirm } = useConfirmDialog();
    const { user, updateUser } = useAuth();

    const [form, setForm] = useState({
        full_name: '', username: '', phone: '', location: '', bio: '',
        social_links: [{ platform: '', url: '' }],
    });
    const [userInfo, setUserInfo] = useState({});
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // State to control edit mode
    const [profilePictureData, setProfilePictureData] = useState({ base64: null, name: null });
    const [profilePicturePreview, setProfilePicturePreview] = useState('');

    // Agency related state
    const [agencies, setAgencies] = useState([]);
    const [filteredAgencies, setFilteredAgencies] = useState([]);
    const [agencySearchTerm, setAgencySearchTerm] = useState('');
    const [agentMemberships, setAgentMemberships] = useState([]);
    const [loadingMemberships, setLoadingMemberships] = useState(true);
    const optionsMenuRef = useRef(null);

    // New Agency Registration state
    const [showRegisterAgencyForm, setShowRegisterAgencyForm] = useState(false);
    const [newAgencyForm, setNewAgencyForm] = useState({ name: '', address: '', phone: '', email: '', website: '', description: '', logoBase64: null, logoOriginalname: null });
    const [registeringAgency, setRegisteringAgency] = useState(false);

    // Styles
    const inputFieldStyles = `mt-1 block w-full py-2.5 px-4 border rounded-xl shadow-sm disabled:cursor-not-allowed ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 disabled:bg-gray-800" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 disabled:bg-gray-100"}`;
    const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;

    // --- Data Fetching ---
    const fetchProfile = useCallback(async (showLoader = true) => {
        if(showLoader) setLoading(true);
        try {
            const response = await axiosInstance.get('/users/profile');
            const data = response.data;
            setUserInfo(data);
            setForm({
                full_name: data.full_name || '', username: data.username || '', phone: data.phone || '',
                location: data.location || '', bio: data.bio || '',
                social_links: data.social_links && data.social_links.length > 0 ? data.social_links : [{ platform: '', url: '' }],
            });
            setProfilePicturePreview(data.profile_picture_url || '');
        } catch (error) {
            showMessage('Failed to load profile data.', 'error');
        } finally {
            if(showLoader) setLoading(false);
        }
    }, [showMessage]);
    
    const fetchAgencies = useCallback(async () => { /* ... unchanged ... */ }, [showMessage]);
    const fetchAgentMemberships = useCallback(async () => { /* ... unchanged ... */ }, [user, showMessage]);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            await Promise.all([ fetchProfile(false), fetchAgencies(), fetchAgentMemberships() ]);
            setLoading(false);
        };
        fetchAllData();
    }, [fetchProfile, fetchAgencies, fetchAgentMemberships]);

    // --- Event Handlers ---
    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result);
                setProfilePictureData({ base64: reader.result, name: file.name });
            };
            reader.readAsDataURL(file);
        }
    };
    const handleClearProfilePicture = () => {
        setProfilePicturePreview('');
        setProfilePictureData({ base64: null, name: null });
    };
    const handleUpdate = async () => {
        setUpdating(true);
        try {
            const payload = { ...form };
            if (profilePictureData.base64) {
                payload.profile_picture_base64 = profilePictureData.base64;
                payload.profile_picture_originalname = profilePictureData.name;
            }
            const response = await axiosInstance.put('/users/update', payload);
            updateUser(response.data.user);
            showMessage('Profile updated successfully!', 'success');
            await fetchProfile(false); // Re-fetch without loader
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to update profile.', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        fetchProfile(false); // Revert changes by re-fetching
    };
    
    // Social Links Handlers
    const addSocialLink = () => setForm(prev => ({ ...prev, social_links: [...prev.social_links, { platform: '', url: '' }] }));
    const handleSocialLinkChange = (index, field, value) => {
        const newLinks = [...form.social_links];
        newLinks[index][field] = value;
        setForm(prev => ({ ...prev, social_links: newLinks }));
    };
    const removeSocialLink = (index) => setForm(prev => ({ ...prev, social_links: prev.social_links.filter((_, i) => i !== index) }));

    // Agency Handlers (unchanged)
    const handleAgencySearchChange = (e) => { /* ... */ };
    const handleSendAgencyConnectionRequest = async (agencyId) => { /* ... */ };
    const handleDisconnectFromAgency = (agencyId) => { /* ... */ };
    const handleCancelPendingRequest = (agencyId) => { /* ... */ };
    const handleNewAgencyFormChange = (e) => { /* ... */ };
    const handleNewAgencyLogoChange = (e) => { /* ... */ };
    const handleRegisterAgency = async () => { /* ... */ };

    const connectedAgentMembership = agentMemberships.find(m => m.request_status === 'accepted');
    const pendingOrRejectedMembership = agentMemberships.find(m => m.request_status === 'pending' || m.request_status === 'rejected');
    const hasAnyAffiliation = !!(connectedAgentMembership || pendingOrRejectedMembership);

    if (loading) {
        return <GeneralSectionSkeleton darkMode={darkMode} />;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                    <h3 className={`text-lg md:text-xl font-bold flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                        <User className="mr-3 text-green-500" size={24} /> Profile Overview
                    </h3> 
                    <div className="flex space-x-2">
                        {isEditing ? (
                            <>
                                <button onClick={handleCancelEdit} className={`px-4 py-1.5 rounded-full font-medium text-sm ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}>Cancel</button>
                                <button onClick={() => { handleUpdate().then(() => setIsEditing(false)); }} disabled={updating} className="px-4 py-1.5 font-medium rounded-full flex items-center text-sm bg-green-600 text-white disabled:opacity-50 hover:bg-green-700">
                                    {updating ? <Loader size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
                                    {updating ? "Saving..." : "Save"}
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="px-4 py-1.5 rounded-full font-medium flex items-center text-sm bg-green-600 text-white hover:bg-green-700">
                                <PencilIcon size={16} className="mr-1" /> Edit
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:space-x-8 mb-6">
                    <div className="md:w-1/2 mb-6 md:mb-0">
                        <label className={labelStyles}>Profile Picture</label>
                        <div className="flex flex-col items-center space-y-4 mt-2">
                            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                {profilePicturePreview ? <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-16 h-16 text-gray-400" />}
                                {isEditing && profilePicturePreview && <button type="button" onClick={handleClearProfilePicture} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"><X size={16} /></button>}
                            </div>
                            {isEditing && (
                                <input type="file" accept="image/*" onChange={handleProfilePictureChange} className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 ${darkMode ? "file:bg-green-600 file:text-white" : "file:bg-green-50 file:text-green-700"}`} />
                            )}
                        </div>
                    </div>
                    <div className="md:w-1/2">
                        <label className={labelStyles} htmlFor="bio">About Me</label>
                        <textarea id="bio" name="bio" value={form.bio || ''} onChange={handleChange} rows="5" className={`${inputFieldStyles} min-h-[100px]`} disabled={!isEditing} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className={labelStyles}>Full Name</label><input type="text" name="full_name" value={form.full_name} onChange={handleChange} className={inputFieldStyles} disabled={!isEditing} /></div>
                    <div><label className={labelStyles}>Username</label><input type="text" name="username" value={form.username} onChange={handleChange} className={inputFieldStyles} disabled={!isEditing} /></div>
                    <div><label className={labelStyles}>Email</label><input type="email" value={userInfo.email || ''} className={`${inputFieldStyles}`} disabled /></div>
                    <div><label className={labelStyles}>Phone Number</label><input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputFieldStyles} disabled={!isEditing} /></div>
                    <div><label className={labelStyles}>Location</label><input type="text" name="location" value={form.location} onChange={handleChange} className={inputFieldStyles} disabled={!isEditing} /></div>
                    <div><label className={labelStyles}>Date Joined</label><input type="text" value={userInfo.date_joined ? new Date(userInfo.date_joined).toLocaleDateString() : 'N/A'} className={`${inputFieldStyles}`} disabled /></div>
                </div>
            </div>

            {(user?.role === 'agent' || user?.role === 'agency_admin') && (
                <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <h3 className={`text-lg md:text-xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                        <Landmark className="mr-3 text-orange-500" size={24} /> Agency
                    </h3>
                    {/* Agency section remains interactive as it has its own logic */}
                    {/* ... (agency JSX unchanged) ... */}
                </div>
            )}

            <div className={`pb-6 mb-6 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <h3 className={`text-lg md:text-xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                    <Link className="mr-3 text-cyan-500" size={24} /> Social Media & Websites
                </h3>
                <div className="space-y-4">
  {form.social_links?.map((link, index) => (
    <div
      key={index}
      className="flex flex-col md:flex-row md:items-center gap-4"
    >
      {/* Platform Input */}
      <div className="w-full md:w-1/3">
        <label className={labelStyles}>Platform</label>
        <input
          type="text"
          value={link.platform}
          onChange={(e) =>
            handleSocialLinkChange(index, "platform", e.target.value)
          }
          className={inputFieldStyles}
          placeholder="e.g., LinkedIn"
          disabled={!isEditing}
        />
      </div>

      {/* URL Input */}
      <div className="w-full md:w-2/3">
        <label className={labelStyles}>URL</label>
        <input
          type="url"
          value={link.url}
          onChange={(e) =>
            handleSocialLinkChange(index, "url", e.target.value)
          }
          className={inputFieldStyles}
          placeholder="https://linkedin.com/in/yourprofile"
          disabled={!isEditing}
        />
      </div>

      {/* Remove Button */}
      {isEditing && form.social_links.length > 1 && (
        <button
          onClick={() => removeSocialLink(index)}
          className={`self-start md:self-center p-2 rounded-full transition ${
            darkMode ? "bg-red-700 text-white" : "bg-red-100 text-red-600"
          }`}
        >
          <X size={20} />
        </button>
      )}
    </div>
  ))}

  {/* Add Link Button */}
  {isEditing && (
    <button
      type="button"
      onClick={addSocialLink}
      className={`mt-4 px-4 py-2 rounded-full font-semibold flex items-center transition ${
        darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"
      }`}
    >
      <Link size={18} className="mr-2" /> Add Link
    </button>
  )}
</div>

            </div>
            
            {/* The main save button at the bottom is no longer needed */}

        </motion.div>
    );
}

export default General;