import React, {useState, useEffect, useCallback} from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../layouts/AppShell';
import { useMessage } from '../../../context/MessageContext';
import { useAuth } from '../../../context/AuthContext';
import { Loader, Save } from 'lucide-react';

// Reusable Switch Component
const Switch = ({ isOn, handleToggle, label, description }) => {
    const { darkMode } = useTheme();
    return (
        <div className={`flex items-center justify-between p-4 rounded-xl border h-full ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
            <div>
                <span className={`text-lg font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{label}</span>
                {description && <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>{description}</p>}
            </div>
            <button
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOn ? 'bg-green-600' : (darkMode ? 'bg-gray-600' : 'bg-gray-200')}`}
                role="switch"
                aria-checked={isOn}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
};

// --- Skeleton Component ---
const NotificationsSkeleton = ({ darkMode }) => (
    <div className="space-y-8 animate-pulse">
        {/* Email Settings Skeleton */}
        <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div className={`h-6 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`h-10 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                <div className={`h-10 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
            </div>
        </div>
        {/* Notification Toggles Skeleton */}
        <div className={`pb-6 mb-6`}>
            <div className={`h-6 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className={`h-24 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                <div className={`h-24 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                <div className={`h-24 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
            </div>
        </div>
        <div className="flex justify-center pt-8">
            <div className={`h-12 w-48 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
        </div>
    </div>
);

function Notifications() {
    const { darkMode } = useTheme();
    const { showMessage } = useMessage();
    const { user } = useAuth();

    // State from AdminSettings.jsx
    const [emailSettings, setEmailSettings] = useState({ senderEmail: 'admin@example.com', smtpHost: 'smtp.example.com' });
    const [notificationToggles, setNotificationToggles] = useState({ email: true, sms: false, inApp: true });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Simulated fetch
    useEffect(() => {
        // In a real app, you would fetch these from a system settings endpoint
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
    }, []);

    const handleEmailChange = (e) => {
        setEmailSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleToggleChange = (key) => {
        setNotificationToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };
    
    const handleUpdate = () => {
        setUpdating(true);
        // Simulate API call
        setTimeout(() => {
            showMessage("Notification settings saved! (Simulated)", "success");
            setUpdating(false);
        }, 1000);
    };

    const inputFieldStyles = `mt-1 block w-full py-2.5 px-4 border rounded-xl shadow-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`;
    const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;

    if (loading) {
        return <NotificationsSkeleton darkMode={darkMode} />;
    }
    
    if (user?.role !== 'admin') {
        return <p>You do not have permission to view these settings.</p>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <h3 className={`text-lg md:text-xl font-bold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                    Email Settings
                </h3>
                <p className={`mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Configure the system's outgoing email server (SMTP).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="senderEmail" className={labelStyles}>Sender Email Address</label>
                        <input type="email" id="senderEmail" name="senderEmail" value={emailSettings.senderEmail} onChange={handleEmailChange} className={inputFieldStyles} />
                    </div>
                    <div>
                        <label htmlFor="smtpHost" className={labelStyles}>SMTP Host</label>
                        <input type="text" id="smtpHost" name="smtpHost" value={emailSettings.smtpHost} onChange={handleEmailChange} className={inputFieldStyles} />
                    </div>
                </div>
            </div>

            <div className={`pb-6 mb-6`}>
                <h3 className={`text-lg md:text-xl font-bold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                    System-Wide Notification Channels
                </h3>
                <p className={`mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Enable or disable notification channels for all users.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Switch label="Email Notifications" description="Receive updates via email." isOn={notificationToggles.email} handleToggle={() => handleToggleChange('email')} />
                    <Switch label="SMS Notifications" description="Get alerts on your phone." isOn={notificationToggles.sms} handleToggle={() => handleToggleChange('sms')} />
                    <Switch label="In-App Notifications" description="See notifications in the dashboard." isOn={notificationToggles.inApp} handleToggle={() => handleToggleChange('inApp')} />
                </div>
            </div>

             <div className="flex justify-center pt-8">
                <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="bg-green-600 text-white py-2.5 px-6 rounded-full hover:bg-green-700 text-lg font-semibold disabled:opacity-50 flex items-center"
                >
                    {updating ? <Loader size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                    {updating ? "Saving..." : "Save Notification Settings"}
                </button>
            </div>
        </motion.div>
    );
}

export default Notifications;