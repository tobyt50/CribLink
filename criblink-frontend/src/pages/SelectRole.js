import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card'; // adjust if your path differs
import { motion } from 'framer-motion';
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook
import React, { useState, useEffect } from 'react'; // Import useState and useEffect

// Skeleton for the SelectRole page
const SelectRoleSkeleton = ({ darkMode }) => (
  <div className={`flex flex-col items-center justify-center min-h-screen px-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mt-[-60px]"
    >
      <div className={`h-8 w-3/4 mx-auto rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} animate-pulse mb-4`}></div>
      <div className={`h-4 w-1/2 mx-auto rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} animate-pulse mb-10`}></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center">
        {[1, 2].map((_, i) => (
          <div
            key={i}
            className={`p-6 rounded-xl shadow-lg animate-pulse ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <div className={`h-6 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-3`}></div>
            <div className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);

export default function SelectRole() {
  const navigate = useNavigate();
  const { darkMode } = useTheme(); // Use the dark mode context
  const [loading, setLoading] = useState(true); // New loading state

  useEffect(() => {
    // Simulate a loading delay, replace with actual data fetching if needed
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // Simulate 0.5 seconds loading
    return () => clearTimeout(timer);
  }, []);

  const selectRole = (role) => {
    navigate('/signup', { state: { role } });
  };

  const roles = [
    { label: 'Client', description: 'Browse and save listings', value: 'user' },
    { label: 'Agent', description: 'Manage listings and inquiries', value: 'agent' }
  ];

  if (loading) {
    return <SelectRoleSkeleton darkMode={darkMode} />;
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen px-4`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl mt-[-60px]"
      >
        <h1 className={`text-3xl font-bold text-center mb-2 ${darkMode ? "text-green-400" : "text-green-700"}`}>Create Your Criblink Account</h1>
        <p className={`text-center mb-10 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Choose your role to continue</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center">
          {roles.map((role) => (
            <Card
              key={role.value}
              onClick={() => selectRole(role.value)}
              className={`cursor-pointer ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"}`}
            >
              <h2 className={`text-xl font-semibold mb-2 ${darkMode ? "text-green-400" : "text-green-700"}`}>{role.label}</h2>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>{role.description}</p>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
