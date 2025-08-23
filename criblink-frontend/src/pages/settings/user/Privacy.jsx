import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader, Save, Shield, Cookie, Mail, Download } from 'lucide-react';
import { useTheme } from '../../../layouts/AppShell';
import axiosInstance from '../../../api/axiosInstance';
import API_BASE_URL from '../../../config';
import { useMessage } from '../../../context/MessageContext';
import { useConfirmDialog } from '../../../context/ConfirmDialogContext';

// --- Skeleton for Privacy section ---
const PrivacySectionSkeleton = ({ darkMode }) => (
    <div className="space-y-8 animate-pulse">
        {/* Data Collection Skeleton */}
        <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div className={`h-6 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}></div>
            <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                        <div className={`h-5 w-5 rounded-md ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                        <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                    </div>
                ))}
            </div>
        </div>
        {/* Cookie Preferences Skeleton */}
        <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div className={`h-6 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}></div>
            <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                        <div className={`h-5 w-5 rounded-md ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                        <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                    </div>
                ))}
            </div>
        </div>
        {/* Communication Preferences Skeleton */}
        <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div className={`h-6 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}></div>
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                        <div className={`h-5 w-5 rounded-md ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                        <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                    </div>
                ))}
            </div>
        </div>
        {/* Data Export Skeleton */}
        <div className={`pb-6 mb-6`}>
            <div className={`h-6 w-1/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}></div>
            <div className={`h-10 w-48 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
        </div>
        {/* Save Changes Button Skeleton */}
        <div className="flex justify-center pt-8">
            <div className={`h-12 w-48 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
        </div>
    </div>
);

function Privacy() {
    const { darkMode } = useTheme();
    const { showMessage } = useMessage();
    const { showConfirm } = useConfirmDialog();
    
    const [privacyForm, setPrivacyForm] = useState({
        data_collection_opt_out: false,
        personalized_ads: true,
        cookie_preferences: {
            essential: true,
            analytics: true,
            marketing: true,
            functional: true,
        },
        communication_email_updates: true,
        communication_marketing: true,
        communication_newsletter: false,
        share_favourites_with_agents: false,
        share_property_preferences_with_agents: false,
    });

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const token = localStorage.getItem("token");

    // Fetch Privacy Settings
    const fetchPrivacySettings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/users/profile', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const userData = response.data;
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
                share_favourites_with_agents: userData.share_favourites_with_agents ?? false,
                share_property_preferences_with_agents: userData.share_property_preferences_with_agents ?? false,
            });
        } catch (error) {
            showMessage(error?.response?.data?.message || 'Failed to load privacy settings.', 'error');
        } finally {
            setLoading(false);
        }
    }, [token, showMessage]);

    useEffect(() => {
        if (token) {
            fetchPrivacySettings();
        }
    }, [token, fetchPrivacySettings]);

    const handlePrivacyChange = (e) => {
        const { name, type, checked } = e.target;
        if (name.startsWith('cookie_preferences.')) {
            const cookieType = name.split('.')[1];
            setPrivacyForm(prev => ({ ...prev, cookie_preferences: { ...prev.cookie_preferences, [cookieType]: checked } }));
        } else if (type === 'checkbox') {
            setPrivacyForm(prev => ({ ...prev, [name]: checked }));
        }
    };

    const handleUpdate = async () => {
        setUpdating(true);
        try {
            await axiosInstance.put('/users/update', privacyForm, {
                 headers: { Authorization: `Bearer ${token}` } 
            });
            showMessage('Privacy settings updated successfully!', 'success');
        } catch(error) {
            showMessage(error.response?.data?.message || 'Failed to update settings.', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleDataExport = () => {
        showConfirm({
            title: "Request Data Export",
            message: "A link to download your data will be sent to your registered email address shortly.",
            onConfirm: () => {
                showMessage('Your data export request has been initiated. Check your email.', 'success');
            },
            confirmLabel: "Confirm Request",
        });
    };

    const labelStyles = `block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`;
    const checkboxStyles = `h-5 w-5 rounded-md ${darkMode ? "form-checkbox text-green-500 bg-gray-700 border-gray-600" : "form-checkbox text-green-600 border-gray-300"}`;

    if (loading) {
        return <PrivacySectionSkeleton darkMode={darkMode} />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Data Collection & Usage */}
            <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <h3 className={`text-lg md:text-xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                    <Shield className="mr-3 text-blue-500" /> Data & Usage
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <input type="checkbox" id="data_collection_opt_out" name="data_collection_opt_out" checked={privacyForm.data_collection_opt_out} onChange={handlePrivacyChange} className={checkboxStyles} />
                        <label htmlFor="data_collection_opt_out" className={labelStyles}>Opt out of anonymous data collection.</label>
                    </div>
                    <div className="flex items-center space-x-3">
                        <input type="checkbox" id="personalized_ads" name="personalized_ads" checked={privacyForm.personalized_ads} onChange={handlePrivacyChange} className={checkboxStyles} />
                        <label htmlFor="personalized_ads" className={labelStyles}>Enable personalized advertising.</label>
                    </div>
                    <div className="flex items-center space-x-3">
                        <input type="checkbox" id="share_favourites_with_agents" name="share_favourites_with_agents" checked={privacyForm.share_favourites_with_agents} onChange={handlePrivacyChange} className={checkboxStyles} />
                        <label htmlFor="share_favourites_with_agents" className={labelStyles}>Allow agents to view your favourited listings.</label>
                    </div>
                    <div className="flex items-center space-x-3">
                        <input type="checkbox" id="share_property_preferences_with_agents" name="share_property_preferences_with_agents" checked={privacyForm.share_property_preferences_with_agents} onChange={handlePrivacyChange} className={checkboxStyles} />
                        <label htmlFor="share_property_preferences_with_agents" className={labelStyles}>Allow agents to view your property preferences.</label>
                    </div>
                </div>
            </div>

            {/* Cookie Preferences */}
            <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <h3 className={`text-lg md:text-xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                    <Cookie className="mr-3 text-yellow-500" /> Cookie Preferences
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <input type="checkbox" id="cookie_essential" name="cookie_preferences.essential" checked={privacyForm.cookie_preferences.essential} disabled className={`${checkboxStyles} cursor-not-allowed`} />
                        <label htmlFor="cookie_essential" className={`${labelStyles} ${darkMode ? "text-gray-500" : "text-gray-600"}`}>Essential Cookies (Required)</label>
                    </div>
                    <div className="flex items-center space-x-3">
                        <input type="checkbox" id="cookie_analytics" name="cookie_preferences.analytics" checked={privacyForm.cookie_preferences.analytics} onChange={handlePrivacyChange} className={checkboxStyles} />
                        <label htmlFor="cookie_analytics" className={labelStyles}>Analytics Cookies</label>
                    </div>
                    <div className="flex items-center space-x-3">
                        <input type="checkbox" id="cookie_marketing" name="cookie_preferences.marketing" checked={privacyForm.cookie_preferences.marketing} onChange={handlePrivacyChange} className={checkboxStyles} />
                        <label htmlFor="cookie_marketing" className={labelStyles}>Marketing Cookies</label>
                    </div>
                    <div className="flex items-center space-x-3">
                        <input type="checkbox" id="cookie_functional" name="cookie_preferences.functional" checked={privacyForm.cookie_preferences.functional} onChange={handlePrivacyChange} className={checkboxStyles} />
                        <label htmlFor="cookie_functional" className={labelStyles}>Functional Cookies</label>
                    </div>
                </div>
            </div>

            {/* Communication Preferences */}
            <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <h3 className={`text-lg md:text-xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                    <Mail className="mr-3 text-purple-500" /> Communication Preferences
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <input type="checkbox" id="comm_updates" name="communication_email_updates" checked={privacyForm.communication_email_updates} onChange={handlePrivacyChange} className={checkboxStyles} />
                        <label htmlFor="comm_updates" className={labelStyles}>Product Updates & Announcements</label>
                    </div>
                    <div className="flex items-center space-x-3">
                        <input type="checkbox" id="comm_marketing" name="communication_marketing" checked={privacyForm.communication_marketing} onChange={handlePrivacyChange} className={checkboxStyles} />
                        <label htmlFor="comm_marketing" className={labelStyles}>Promotional Offers</label>
                    </div>
                    <div className="flex items-center space-x-3">
                        <input type="checkbox" id="comm_newsletter" name="communication_newsletter" checked={privacyForm.communication_newsletter} onChange={handlePrivacyChange} className={checkboxStyles} />
                        <label htmlFor="comm_newsletter" className={labelStyles}>Monthly Newsletter</label>
                    </div>
                </div>
            </div>

            {/* Data Export */}
            <div className={`pb-6 mb-6`}>
                <h3 className={`text-lg md:text-xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                    <Download className="mr-3 text-cyan-500" /> Export Your Data
                </h3>
                <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Request a copy of all your personal data stored on our platform.</p>
                <button onClick={handleDataExport} className="bg-cyan-600 text-white py-2 px-4 rounded-full hover:bg-cyan-700 font-semibold flex items-center">
                    <Download size={18} className="mr-2" /> Request Data Export
                </button>
            </div>

            {/* Save Changes Button */}
            <div className="flex justify-center pt-8">
                <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="bg-green-600 text-white py-2.5 px-6 rounded-full hover:bg-green-700 text-lg font-semibold disabled:opacity-50 flex items-center"
                >
                    {updating ? <Loader size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                    {updating ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </motion.div>
    );
}

export default Privacy;