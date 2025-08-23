import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../layouts/AppShell';
import { useMessage } from '../context/MessageContext';

import { 
    LogOut, Settings, X, Building, LifeBuoy, ChevronDown, Star, LogIn, UserPlus 
} from 'lucide-react';

// Dynamic import logic remains the same
const getMenuItemsByRole = async (role) => {
  try {
    switch (role) {
      case 'admin':
        const adminModule = await import('./admin/Sidebar.jsx');
        // Filter out items we are now handling statically or removing
        return adminModule.MENU_ITEMS.filter(item => !['settings', 'dashboard', 'listings'].includes(item.key)) || [];
      default:
        return [];
    }
  } catch (error) {
    console.error(`Could not load sidebar config for role "${role}":`, error);
    return [];
  }
};

const MobileSidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [roleSpecificItems, setRoleSpecificItems] = useState([]);

  useEffect(() => {
    if (user?.role) {
      getMenuItemsByRole(user.role).then(setRoleSpecificItems);
    } else {
      setRoleSpecificItems([]);
    }
  }, [user]);

  const handleLogout = useCallback(() => {
    logout();
    setIsOpen(false);
    navigate("/signin");
    showMessage('You have been logged out.', 'info', 3000);
  }, [logout, setIsOpen, navigate, showMessage]);

  const handleLinkClick = () => {
    setIsOpen(false);
  };
  
  // --- START: REFINED STYLES ---
  // Tighter vertical padding for a more compact list
  const menuLinkClasses = (isActive) => `
    flex items-center gap-4 w-full px-6 py-2.5 transition-all
    ${ isActive
        ? (darkMode ? 'bg-gray-900 text-green-200 font-semibold border-r-4 border-green-400' : 'bg-green-100 text-green-800 font-semibold border-r-4 border-green-600')
        : (darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')
    }`;
  // --- END: REFINED STYLES ---
  
  const GuestMenu = () => (
    // ... GuestMenu remains the same, as it doesn't have the profile header ...
    <>
      <div className="flex justify-end p-4">
        <button onClick={() => setIsOpen(false)} className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}><X size={24} /></button>
      </div>
      <nav className="flex-grow overflow-y-auto pt-8">
        <NavLink to="/signin" onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive)}><LogIn size={24} /> <span>Login</span></NavLink>
        <hr className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`} />
        <NavLink to="/select-role" onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive)}><UserPlus size={24} /> <span>Create Account</span></NavLink>
        <hr className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`} />
        <NavLink to="/agencies" onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive)}><Building size={24} /> <span>Agencies</span></NavLink>
        <hr className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`} />
        <div>
            <button onClick={() => setIsSupportOpen(prev => !prev)} className={`flex items-center justify-between gap-4 w-full px-6 py-2.5 transition-all ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}><span className="flex items-center gap-4"><LifeBuoy size={24} /> <span>Support</span></span><motion.div animate={{ rotate: isSupportOpen ? 180 : 0 }}><ChevronDown size={20} /></motion.div></button>
            <AnimatePresence>
              {isSupportOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-10"><NavLink to="/about" onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive)}>About Us</NavLink><NavLink to="/contact" onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive)}>Contact Us</NavLink></motion.div>)}
            </AnimatePresence>
        </div>
      </nav>
    </>
  );

  const UserMenu = () => (
    // --- START: MODIFICATION FOR SCROLLING ---
    // The entire UserMenu is now inside a single scrollable container
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto">
        <div className={`relative p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button onClick={() => setIsOpen(false)} className={`absolute top-4 right-4 p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}><X size={24} /></button>
            <div className="flex flex-col items-center text-center pt-8">
                {user?.profile_picture_url ? (
                  // Bigger profile picture
                  <img src={user.profile_picture_url} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-md border-2 border-green-500" />
                ) : (
                  // Bigger initials circle
                  <div className="bg-gradient-to-br from-green-500 to-green-700 text-white w-24 h-24 rounded-full flex items-center justify-center font-bold text-4xl shadow-md">
                      {user?.full_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="mt-4">
                    <p className="font-semibold text-lg">{user?.full_name}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                    <p className={`text-xs mt-2 font-semibold uppercase tracking-wider px-2 py-1 rounded-full inline-block ${darkMode ? 'bg-gray-700 text-green-300' : 'bg-green-100 text-green-800'}`}>
                      {user?.role?.replace('_', ' ')}
                    </p>
                </div>
            </div>
        </div>
        
        <nav className="pt-2">
          {/* RENAMED, REMOVED OTHERS */}
          <NavLink to="/settings" onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive || location.pathname.startsWith('/profile') || location.pathname.startsWith('/settings'))}><Settings size={24} /> <span>Manage Profile</span></NavLink>
          <hr className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`} />

          <NavLink to="/agencies" onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive)}><Building size={24} /> <span>Agencies</span></NavLink>
          <hr className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`} />

          <NavLink to="/subscriptions" onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive)}><Star size={24} /> <span>Subscriptions</span></NavLink>
          <hr className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`} />

          {roleSpecificItems.map((item) => (<React.Fragment key={item.key}><NavLink to={item.to} onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive)}>{React.cloneElement(item.icon, { size: 24 })} <span>{item.name}</span></NavLink><hr className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`} /></React.Fragment>))}

          <div>
              <button onClick={() => setIsSupportOpen(prev => !prev)} className={`flex items-center justify-between gap-4 w-full px-6 py-2.5 transition-all ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}><span className="flex items-center gap-4"><LifeBuoy size={24} /> <span>Support</span></span><motion.div animate={{ rotate: isSupportOpen ? 180 : 0 }}><ChevronDown size={20} /></motion.div></button>
              <AnimatePresence>{isSupportOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-10"><NavLink to="/about" onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive)}>About Us</NavLink><NavLink to="/contact" onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive)}>Contact Us</NavLink></motion.div>)}</AnimatePresence>
          </div>
        </nav>
      </div>

      <div className={`mt-auto border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button onClick={handleLogout} className={`flex items-center gap-4 w-full px-6 py-4 transition-all ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}><LogOut size={24} /><span>Sign Out</span></button>
      </div>
    </div>
    // --- END: MODIFICATION FOR SCROLLING ---
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div onClick={() => setIsOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-black/60 z-[199] md:hidden" />
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} 
            className={`fixed top-0 right-0 h-full w-full flex flex-col z-[200] md:hidden shadow-2xl ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}
          >
            {user ? <UserMenu /> : <GuestMenu />}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileSidebar;