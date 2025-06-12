import React, { useEffect, useState } from 'react';
import AgentSidebar from '../../components/agent/Sidebar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useSidebarState } from '../../hooks/useSidebarState'; // Import the hook

const ArchivedClients = () => {
  const [clients, setClients] = useState([]);
  const [agentId, setAgentId] = useState(null);
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  // Use the useSidebarState hook
  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
  const [activeSection, setActiveSection] = useState('archived-clients'); // Set default active section

  // State for sorting
  const [sortKey, setSortKey] = useState('archived_at'); // Default sort by archived date
  const [sortDirection, setSortDirection] = useState('desc'); // Default sort descending

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAgentId(data.user_id);
      } catch (err) {
        console.error("Failed to fetch agent profile:", err);
        showMessage('Failed to load profile. Please sign in again.', 'error');
        navigate('/signin');
      }
    };
    fetchProfile();
  }, [navigate, showMessage]);

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
        showMessage('Failed to fetch archived clients.', 'error');
      }
    };
    fetchArchived();
  }, [agentId, showMessage]);

  const handleRestore = async (clientId) => {
    const token = localStorage.getItem('token');
    showConfirm({
      title: "Restore Client",
      message: "Are you sure you want to restore this client?",
      onConfirm: async () => {
        try {
          await axios.post(`${API_BASE_URL}/clients/agent/${agentId}/archived-clients/${clientId}/restore`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setClients((prev) => prev.filter((c) => c.user_id !== clientId));
          showMessage('Client restored successfully!', 'success');
        } catch (err) {
          console.error('Restore failed:', err);
          showMessage('Failed to restore client. Please try again.', 'error');
        }
      },
      confirmLabel: "Restore",
      cancelLabel: "Cancel"
    });
  };

  const handleDelete = async (clientId) => {
    showConfirm({
      title: "Permanently Delete Client",
      message: "Are you sure you want to permanently delete this archived client? This action cannot be undone.",
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          showMessage('Authentication token not found. Please sign in.', 'error');
          navigate('/signin');
          return;
        }

        try {
          await axios.delete(`${API_BASE_URL}/clients/agent/${agentId}/archived-clients/${clientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setClients((prev) => prev.filter((c) => c.user_id !== clientId));
          showMessage('Archived client deleted permanently.', 'success');
        } catch (err) {
          console.error('Delete failed:', err);
          showMessage('Failed to permanently delete client. Please try again.', 'error');
        }
      },
      confirmLabel: "Delete Permanently",
      cancelLabel: "Cancel"
    });
  };

  const handleSortClick = (key) => {
    const sortableColumns = ['full_name', 'email', 'client_status', 'archived_at'];
    if (!sortableColumns.includes(key)) return;

    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
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

  const sortedClients = [...clients].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
    if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

    const typeA = typeof aValue;
    const typeB = typeof bValue;

    if (typeA === 'string' && typeB === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else if (typeA === 'number' && typeB === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    } else if (sortKey === 'archived_at') {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        return sortDirection === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    }
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
          className={`fixed top-20 left-4 z-50 p-2 rounded-xl shadow-md h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-800" : "bg-white"}`}
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
        key={isMobile ? 'mobile' : 'desktop'} // Key for re-animation on mobile/desktop switch
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        initial={false}
        className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
        style={{ minWidth: `calc(100% - ${contentShift}px)` }} // Ensure content doesn't shrink
      >
        {/* Mobile-only H1 element */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Archived Clients</h1>
        </div>
        {/* Desktop-only centered title */}
        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Archived Clients</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-4 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}>
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
      </motion.div>
    </div>
  );
};

export default ArchivedClients;
