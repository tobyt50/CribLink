import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/Sidebar';
import { motion } from 'framer-motion';
import { Bars3Icon } from '@heroicons/react/24/outline';

const Settings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // for mobile sidebar visibility
  const [isCollapsed, setIsCollapsed] = useState(false); // for desktop sidebar collapse

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsSidebarOpen(!isMobile); // open on desktop, closed on mobile
    };
    handleResize(); // initial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const contentShift = isSidebarOpen
    ? isCollapsed
      ? 80
      : 256
    : 0;

const [settings, setSettings] = useState({
    commissionRate: '',
    supportEmail: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({ name: '', email: '' });

  useEffect(() => {
    fetchSettings();
    fetchProfile();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/admin/settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/admin/profile');
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const handleChange = (e) => {
    setSettings((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('http://localhost:5000/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      alert('Settings updated!');
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return ( // Added return statement here to wrap the JSX
    <div className="flex min-h-screen bg-gray-50 relative overflow-x-hidden">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(prev => !prev)}
        isCollapsed={isCollapsed}
        onCollapseToggle={() => setIsCollapsed(prev => !prev)}
      />

      <motion.div
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 p-4 md:p-6"
      >
        {/* Mobile-only toggle and centered heading */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <button
            className="text-gray-600 hover:text-green-700 rounded-xl" // Added rounded-xl
            onClick={() => setIsSidebarOpen(prev => !prev)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          {/* Changed heading text and added text-center */}
          <h1 className="text-2xl font-extrabold text-green-700 text-center">Settings</h1>
        </div>

        {/* Desktop-only centered title */}
        <div className="hidden md:block mb-6">
          {/* Changed heading text and added text-center */}
          <h1 className="text-3xl font-extrabold text-green-700 mb-6 text-center">Settings</h1>
        </div>

        {/* Settings content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-6 rounded-3xl shadow space-y-6" // Changed to rounded-3xl for consistency
        >
          <h2 className="text-xl font-semibold">Admin Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Name</label>
              <input value={profile.name} disabled className="mt-1 w-full rounded-xl border px-4 py-2 bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input value={profile.email} disabled className="mt-1 w-full rounded-xl border px-4 py-2 bg-gray-100" />
            </div>
          </div>

          <h2 className="text-xl font-semibold mt-6">System Preferences</h2>
          {loading ? (
            <p>Loading settings...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Default Commission Rate (%)</label>
                <input
                  name="commissionRate"
                  value={settings.commissionRate}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Support Email</label>
                <input
                  name="supportEmail"
                  value={settings.supportEmail}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border px-4 py-2"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          <div className="mt-10">
            <h2 className="text-xl font-semibold">Roles & Permissions (Overview)</h2>
            <p className="text-sm text-gray-500 mt-1">
              This section is currently read-only. Use backend tools to manage permissions.
            </p>
            <ul className="mt-4 text-sm text-gray-700 list-disc list-inside">
              <li><strong>Admin:</strong> Full platform access, can manage agents and users</li>
              <li><strong>Agent:</strong> Can manage listings, respond to inquiries</li>
              <li><strong>User:</strong> Can post inquiries and view listings</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Settings;
