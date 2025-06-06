import React, { useEffect, useState } from 'react';
import AgentSidebar from '../../components/agent/Sidebar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config';
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence for mobile toggle
import { ArrowUpIcon, ArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline'; // Import icons for sorting and delete
import { Menu, X } from 'lucide-react'; // Import Menu and X icons for sidebar toggle
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook
import { motion } from 'framer-motion'; // Import motion for animations
import { ArrowUpIcon, ArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline'; // Import icons for sorting and delete

const ArchivedClients = () => {
  const [clients, setClients] = useState([]);
  const [agentId, setAgentId] = useState(null);
  const navigate = useNavigate();
  const { darkMode } = useTheme(); // Use the dark mode context

  // State for sidebar visibility and collapse, consistent with other agent pages
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('archived-clients'); // Set default active section
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  // State for sorting
  const [sortKey, setSortKey] = useState('archived_at'); // Default sort by archived date
  const [sortDirection, setSortDirection] = useState('desc'); // Default sort descending

  // Sync sidebar state on window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // Open on desktop, closed on mobile
      const isMobile = window.innerWidth < 768;
      setIsSidebarOpen(!isMobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAgentId(data.user_id);
      } catch {
        console.error("Failed to fetch agent profile. Redirecting to signin.");
        navigate('/signin');
      }
    };
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    if (!agentId) return;
    const token = localStorage.getItem('token');
    const fetchArchived = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/clients/agent/${agentId}/archived-clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClients(data);
      } catch (err) {
        console.error('Fetch archived clients error:', err);
        console.error('Fetch archived error', err);
      }
    };
    fetchArchived();
  }, [agentId]);

  const handleRestore = async (clientId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_BASE_URL}/clients/agent/${agentId}/archived-clients/${clientId}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients((prev) => prev.filter((c) => c.user_id !== clientId));
      console.log('Client restored successfully!'); // Replaced alert
    } catch (err) {
      console.error('Restore failed:', err);
      console.log('Failed to restore client.'); // Replaced alert
    }
  };

  const handleDelete = async (clientId) => {
    const isConfirmed = window.confirm('Are you sure you want to permanently delete this archived client? This action cannot be undone.'); // Kept for now as per instructions, but ideally replaced with custom modal

    if (!isConfirmed) {
      return;
      // Update the state to remove the restored client
      setClients((prev) => prev.filter((c) => c.user_id !== clientId));
      // Optionally show a success message
      alert('Client restored successfully!');
    } catch (err) {
      console.error('Restore failed:', err);
      // Optionally show an error message to the user
      alert('Failed to restore client.');
    }
  };

  // Function to handle permanent deletion of an archived client
  const handleDelete = async (clientId) => {
    // Show a confirmation dialog
    const isConfirmed = window.confirm('Are you sure you want to permanently delete this archived client? This action cannot be undone.');

    if (!isConfirmed) {
      return; // Stop if the user cancels
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Authentication token not found. Please sign in.'); // Replaced alert
      alert('Authentication token not found. Please sign in.');
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/clients/agent/${agentId}/archived-clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients((prev) => prev.filter((c) => c.user_id !== clientId));
      console.log('Archived client deleted permanently.'); // Replaced alert
    } catch (err) {
      console.error('Delete failed:', err);
      console.log('Failed to permanently delete client.'); // Replaced alert
    }
  };

  const handleSortClick = (key) => {
    const sortableColumns = ['full_name', 'email', 'client_status', 'archived_at'];
    if (!sortableColumns.includes(key)) return;

    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Assuming the backend endpoint for deleting an archived client is DELETE /clients/agent/:agentId/archived-clients/:clientId
      await axios.delete(`${API_BASE_URL}/clients/agent/${agentId}/archived-clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update the state to remove the deleted client
      setClients((prev) => prev.filter((c) => c.user_id !== clientId));
      // Optionally show a success message
      alert('Archived client deleted permanently.');
    } catch (err) {
      console.error('Delete failed:', err);
      // Optionally show an error message to the user
      alert('Failed to permanently delete client.');
    }
  };


  // Function to handle sorting when a column header is clicked
  const handleSortClick = (key) => {
    // Define sortable columns
    const sortableColumns = ['full_name', 'email', 'client_status', 'archived_at'];
    if (!sortableColumns.includes(key)) return; // Only sort sortable columns

    if (sortKey === key) {
      // If the same column is clicked, reverse the sort direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If a new column is clicked, set it as the sort key and default to ascending
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (key) => {
    const sortableColumns = ['full_name', 'email', 'client_status', 'archived_at'];
    if (!sortableColumns.includes(key)) return null;

    if (sortKey === key) {
      return sortDirection === 'asc' ? (
        <ArrowUpIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      ) : (
        <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      );
    }
    return <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`} />;
  };

  // Function to render the sort icon next to the column header
  const renderSortIcon = (key) => {
    const sortableColumns = ['full_name', 'email', 'client_status', 'archived_at'];
    if (!sortableColumns.includes(key)) return null; // Only show icon for sortable columns

    if (sortKey === key) {
      // Show up or down arrow based on sort direction
      return sortDirection === 'asc' ? (
        <ArrowUpIcon className="h-4 w-4 ml-1 inline text-green-700" />
      ) : (
        <ArrowDownIcon className="h-4 w-4 ml-1 inline text-green-700" />
      );
    }
    // Show a default down arrow for unsorted columns (optional, can be null)
    return <ArrowDownIcon className="h-4 w-4 ml-1 inline text-gray-400" />;
  };

  // Apply sorting to the clients data before rendering
  const sortedClients = [...clients].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    // Handle null or undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
    if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

    const typeA = typeof aValue;
    const typeB = typeof bValue;

    // Basic comparison for strings and numbers
    if (typeA === 'string' && typeB === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else if (typeA === 'number' && typeB === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    } else if (sortKey === 'archived_at') {
        // Special handling for date strings
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        return sortDirection === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    }
    // Fallback for other types or mixed types
    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    } else if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Adjust contentShift based on isCollapsed and isMobile states, consistent with other agent pages
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
      {/* Mobile Sidebar Toggle Button */}
      {isMobile && (
        <motion.button
          onClick={() => setIsSidebarOpen(prev => !prev)}
          className={`fixed top-20 left-4 z-50 p-2 rounded-full shadow-md ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white"}`}
          initial={false}
          animate={{ rotate: isSidebarOpen ? 180 : 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isSidebarOpen ? 'close' : 'menu'}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      )}

      <AgentSidebar
        collapsed={isMobile ? false : isCollapsed}
        setCollapsed={isMobile ? () => {} : setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <motion.div
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 p-6 overflow-auto min-w-0" // Added overflow-auto and min-w-0
        style={{ willChange: 'margin-left', minWidth: `calc(100% - ${contentShift}px)` }} // Ensure content doesn't shrink
      >
        {/* Mobile-only H1 element */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Archived Clients</h1>
        </div>
        {/* Desktop-only centered title */}
        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Archived Clients</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`rounded-3xl p-6 shadow space-y-4 max-w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="overflow-x-auto">
            <table className={`w-full text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <thead>
                <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {['full_name', 'email', 'client_status', 'archived_at', 'Actions'].map((key) => (
                      <th
                          key={key}
                          onClick={key !== 'Actions' ? () => handleSortClick(key) : undefined}
                          className={`text-left px-2 py-2 whitespace-nowrap ${key !== 'Actions' ? 'cursor-pointer hover:text-green-700' : ''}`}
                      >
                          <div className="flex items-center gap-1">
                              <span className="truncate">
                                  {{
                                      full_name: 'Name',
                                      client_status: 'Status',
                                      archived_at: 'Archived',
                                  }[key] || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              {renderSortIcon(key)}
                          </div>
                      </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                {sortedClients.map(client => (
                  <tr key={client.user_id} className={`border-t cursor-default max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}>
                    <td className="px-2 py-2 whitespace-nowrap max-w-[150px] truncate" title={client.full_name}>{client.full_name}</td>
                    <td className="px-2 py-2 whitespace-nowrap max-w-[200px] truncate" title={client.email}>{client.email}</td>
                    <td className={`px-2 py-2 whitespace-nowrap max-w-[100px] truncate ${
                        client.client_status === 'vip' ? 'text-green-600' :
                        client.client_status === 'regular' ? 'text-gray-600' :
                        (darkMode ? 'text-gray-300' : 'text-gray-700')
                    }`} title={client.client_status}>{client.client_status}</td>
                    <td className="px-2 py-2 whitespace-nowrap max-w-[120px] truncate" title={new Date(client.archived_at).toLocaleDateString()}>{new Date(client.archived_at).toLocaleDateString()}</td>
                    <td className="px-2 py-2 whitespace-nowrap flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(client.user_id)}
                        className={`text-sm hover:underline ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-700 hover:text-green-800"}`}
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDelete(client.user_id)}
                        className={`p-1 ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}`}
                        title="Permanently Delete Client"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedClients.length === 0 && (
                  <tr>
                    <td colSpan={5} className={`text-center py-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      No archived clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

  const contentShift = isSidebarOpen ? (isCollapsed ? 80 : 256) : 0;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AgentSidebar
        isOpen={isSidebarOpen}
        isCollapsed={isCollapsed}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onCollapseToggle={() => setIsCollapsed(!isCollapsed)}
      />
      {/* Apply motion for layout animation */}
      <motion.div
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 p-6"
      >
        <h1 className="text-2xl font-bold text-green-700 mb-6 text-center">Archived Clients</h1>
        <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                {/* Make headers clickable and add sort icons */}
                {['full_name', 'email', 'client_status', 'archived_at', 'Actions'].map((key) => (
                    <th
                        key={key}
                        onClick={key !== 'Actions' ? () => handleSortClick(key) : undefined}
                        className={`text-left px-2 py-2 whitespace-nowrap ${key !== 'Actions' ? 'cursor-pointer hover:text-green-700' : ''}`}
                    >
                        <div className="flex items-center gap-1">
                            <span className="truncate">
                                {{
                                    full_name: 'Name',
                                    client_status: 'Status',
                                    archived_at: 'Archived',
                                }[key] || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            {renderSortIcon(key)}
                        </div>
                    </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Use sortedClients for rendering */}
              {sortedClients.map(client => (
                <tr key={client.user_id} className="border-t hover:bg-gray-50">
                  <td className="px-2 py-2 whitespace-nowrap">{client.full_name}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{client.email}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{client.client_status}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{new Date(client.archived_at).toLocaleDateString()}</td>
                  <td className="px-2 py-2 whitespace-nowrap flex items-center gap-2"> {/* Use flex to align buttons */}
                    <button
                      onClick={() => handleRestore(client.user_id)}
                      className="text-sm text-green-700 hover:underline"
                    >
                      Restore
                    </button>
                     {/* Add the delete button */}
                    <button
                      onClick={() => handleDelete(client.user_id)}
                      className="text-red-600 hover:text-red-800 p-1" // Use p-1 for padding around icon
                      title="Permanently Delete Client"
                    >
                      <TrashIcon className="h-5 w-5" /> {/* Use TrashIcon */}
                    </button>
                  </td>
                </tr>
              ))}
              {sortedClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-6">
                    No archived clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default ArchivedClients;
