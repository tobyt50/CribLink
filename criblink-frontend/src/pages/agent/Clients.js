import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Squares2X2Icon,
  TableCellsIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import AgentSidebar from '../../components/agent/Sidebar';
import ClientCard from '../../components/agent/ClientCard'; // Keep if ClientCard is still used elsewhere or for reference
import SendEmailModal from '../../components/agent/SendEmailModal';
import API_BASE_URL from '../../config';
import { Menu, X, Search, SlidersHorizontal, FileText, LayoutGrid, LayoutList, Plus } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook
import Card from '../../components/ui/Card'; // Import the Card component

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('full_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState('simple');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [agentId, setAgentId] = useState(null);
  const { darkMode } = useTheme(); // Use the dark mode context

  // State for sidebar visibility and collapse, consistent with other agent pages
  const [isCollapsed, setIsCollapsed] = useState(false);
  // State for active section in the sidebar, consistent with other agent pages
  const [activeSection, setActiveSection] = useState('clients'); // Set default active section for Clients page

  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);
  const navigate = useNavigate();

  // State for mobile view and sidebar open/close, consistent with Inquiries.js and Listings.js
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  // States for editable notes
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editedNoteContent, setEditedNoteContent] = useState('');

  // Pagination states, similar to Users.js
  const [page, setPage] = useState(1);
  const itemsPerPage = 12; // Display 12 clients per page

  // Effect to handle window resize for mobile responsiveness, consistent with other pages
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // Close sidebar on mobile, open on desktop
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAgentId(data.user_id);
      } catch {
        navigate('/signin');
      }
    };
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    const fetchClients = async () => {
      if (!agentId) return;
      try {
        const token = localStorage.getItem('token');
        // Note: Backend might need to be updated to support pagination parameters (page, limit)
        const { data } = await axios.get(`${API_BASE_URL}/clients/agent/${agentId}/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClients(data);
        setFilteredClients(data); // Initialize filteredClients with all clients
      } catch (err) {
        console.error('Failed to fetch clients', err);
      }
    };
    fetchClients();
  }, [agentId]); // Depend on agentId

  useEffect(() => {
    let currentClients = [...clients];

    // Apply search filter
    if (searchTerm) {
      currentClients = currentClients.filter((c) =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    currentClients.sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      if (typeof aValue === 'string') return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredClients(currentClients);
    setPage(1); // Reset to first page on filter/sort change
  }, [searchTerm, clients, sortKey, sortDirection]); // Depend on all relevant states

  const handleSendEmail = (client) => {
    setSelectedClient(client);
    setEmailModalOpen(true);
  };

  const handleRespondInquiry = (clientId) => {
    navigate(`/agent/respond-inquiry/${clientId}`);
  };

  const handleViewProfile = (clientId) => {
    navigate(`/agent/client-profile/${clientId}`);
  };

  const handleRemoveClient = async (clientId) => {
    const removed = clients.find((c) => c.user_id === clientId);
    setClients((prev) => prev.filter((c) => c.user_id !== clientId));
    setFilteredClients((prev) => prev.filter((c) => c.user_id !== clientId));

    const undoId = toast.loading("Archiving client...");

    const timeout = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/clients/agent/${agentId}/clients/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.update(undoId, { render: "Client archived", type: "success", isLoading: false, autoClose: 3000 });
      } catch {
        toast.update(undoId, { render: "Failed to archive", type: "error", isLoading: false, autoClose: 3000 });
        setClients((prev) => [...prev, removed]);
        setFilteredClients((prev) => [...prev, removed]);
      }
    }, 3000);

    toast.update(undoId, {
      render: (
        <div>
          Client archived
          <button
            onClick={() => {
              clearTimeout(timeout);
              setClients((prev) => [...prev, removed]);
              setFilteredClients((prev) => [...prev, removed]);
              toast.dismiss(undoId);
              toast.info("Archive canceled");
            }}
            className="ml-3 underline text-sm text-blue-200 hover:text-white"
          >
            Undo
          </button>
        </div>
      ),
      type: "warning",
      isLoading: false,
      autoClose: 5000,
    });
  };

  const handleToggleStatus = async (clientId, currentStatus) => {
    const newStatus = currentStatus === 'vip' ? 'regular' : 'vip';
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/clients/agent/${agentId}/clients/${clientId}/vip`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients((prev) => prev.map((c) => c.user_id === clientId ? { ...c, client_status: newStatus } : c));
      setFilteredClients((prev) => prev.map((c) => c.user_id === clientId ? { ...c, client_status: newStatus } : c));
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleSortClick = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (key) => {
    if (sortKey === key) {
      return sortDirection === 'asc' ? (
        <ArrowUpIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      ) : (
        <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      );
    }
    return <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`} />;
  };

  const handleExportCsv = (scope) => {
    const dataToExport = scope === 'current' ? filteredClients : clients;
    if (dataToExport.length === 0) {
      toast.info(`No client data found for ${scope} export.`);
      setIsExportDropdownOpen(false);
      return;
    }

    const headers = ['user_id', 'full_name', 'email', 'date_joined', 'status', 'notes', 'client_status'];
    const csvRows = dataToExport.map((c) => [
      c.user_id,
      c.full_name,
      c.email,
      new Date(c.date_joined).toLocaleDateString(),
      c.status,
      c.notes || '',
      c.client_status || '',
    ].map(field => `"${String(field).replace(/"/g, '""')}"`)); // Ensure fields are quoted and escaped

    const csvContent = [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'clients.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDropdownOpen(false);
    toast.success("Clients exported successfully!");
  };

  // Adjust contentShift based on isCollapsed and isMobile states, consistent with other pages
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  // Handler for editing notes
  const handleEditNote = useCallback((clientId, currentNote) => {
    setEditingNoteId(clientId);
    setEditedNoteContent(currentNote || '');
  }, []);

  // Handler for saving notes
  const handleSaveNote = useCallback(async (clientId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/clients/agent/${agentId}/clients/${clientId}/note`, {
        note: editedNoteContent,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients((prev) =>
        prev.map((c) => (c.user_id === clientId ? { ...c, notes: editedNoteContent } : c))
      );
      setFilteredClients((prev) =>
        prev.map((c) => (c.user_id === clientId ? { ...c, notes: editedNoteContent } : c))
      );
      toast.success('Note updated successfully!');
    } catch (err) {
      console.error('Failed to update note:', err);
      toast.error('Failed to update note.');
    } finally {
      setEditingNoteId(null); // Exit editing mode
      setEditedNoteContent(''); // Clear edited content
    }
  }, [agentId, editedNoteContent, clients]); // Depend on agentId, editedNoteContent, and clients

  // Handler for canceling note edit
  const handleCancelEdit = useCallback(() => {
    setEditingNoteId(null);
    setEditedNoteContent('');
  }, []);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
      {/* Mobile Sidebar Toggle Button - consistent with other pages */}
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

      {/* AgentSidebar now receives collapsed, setCollapsed, activeSection, setActiveSection, isMobile, isSidebarOpen, setIsSidebarOpen */}
      <AgentSidebar
        collapsed={isMobile ? false : isCollapsed} // Sidebar is never collapsed in mobile view
        setCollapsed={isMobile ? () => {} : setIsCollapsed} // Disable setCollapsed on mobile
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobile={isMobile} // Pass isMobile prop
        isSidebarOpen={isSidebarOpen} // Pass isSidebarOpen prop
        setIsSidebarOpen={setIsSidebarOpen} // Pass setIsSidebarOpen prop
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
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Clients</h1>
        </div>

        {/* Desktop-only centered title, consistent with other agent pages */}
        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Clients</h1>
        </div>

        {/* Main content area wrapped in a single white container */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`rounded-3xl p-6 shadow space-y-4 max-w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          {/* Mobile Control Menu */}
          {isMobile && (
            <div className="flex justify-between items-center mb-4">
              <button
                className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                onClick={() => navigate('/add-client')} /* Assuming an add client route */
                title="Add New Client"
              >
                <Plus size={20} />
              </button>
              <button
                className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                onClick={() => { /* Implement filter modal if needed */ }}
                title="Open Filters"
              >
                <SlidersHorizontal size={20} />
              </button>
              <div className="relative inline-block text-left" ref={exportDropdownRef}>
                <button
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                  title="Export"
                >
                  <FileText size={20} />
                </button>
                {isExportDropdownOpen && (
                  <div className={`absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-white text-gray-900"}`}>
                    <div className="py-1">
                      <button onClick={() => handleExportCsv('current')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>Current View</button>
                      <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Clients</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                  onClick={() => setViewMode('simple')}
                  title="List View"
                >
                  <LayoutList className="h-5 w-5" />
                </button>
                <button
                  className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                  onClick={() => setViewMode('graphical')}
                  title="Grid View"
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Desktop Filters and Controls */}
          {!isMobile && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full md:w-1/3 px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
              />

              <div className="flex gap-2 items-center">
                <button
                  className="bg-green-500 text-white flex items-center justify-center px-4 h-10 rounded-xl hover:bg-green-600 text-sm font-medium"
                  onClick={() => navigate('/add-client')} /* Assuming an add client route */
                >
                  +Add Client
                </button>

                <div className="relative inline-block text-left" ref={exportDropdownRef}>
                  <button
                    onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                    className="inline-flex justify-center items-center gap-x-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 h-10"
                    title="Export to CSV"
                  >
                    Export to CSV <FileText className="ml-2 h-5 w-5" />
                  </button>
                  {isExportDropdownOpen && (
                    <div className={`absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-white text-gray-900"}`}>
                      <div className="py-1">
                        <button onClick={() => handleExportCsv('current')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>Current View</button>
                        <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Clients</button>
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={() => setViewMode('simple')} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
                  <TableCellsIcon className="h-6 w-6" />
                </button>
                <button onClick={() => setViewMode('graphical')} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
                  <Squares2X2Icon className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}

          {filteredClients.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              No clients found matching your criteria.
            </div>
          ) : (
            viewMode === 'graphical' ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedClients.map(client => (
                  <Card key={client.user_id} className="p-4 flex flex-col items-center justify-between">
                    {/* Profile Picture Section */}
                    <div className="mb-4">
                      <img
                        src={`https://placehold.co/80x80/E0F7FA/004D40?text=${client.full_name.charAt(0).toUpperCase()}`}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-green-500"
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/80x80/E0F7FA/004D40?text=${client.full_name.charAt(0).toUpperCase()}`; }}
                      />
                    </div>

                    <div className="text-lg font-semibold mb-2 flex items-center gap-2">
                      {client.full_name}
                      {/* Client Status styled in a small rounded corner container */}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                          ${client.client_status === 'vip'
                            ? 'bg-green-200 text-green-800'
                            : (darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700')
                          }`}>
                        {client.client_status || 'regular'}
                      </span>
                    </div>
                    <div className="text-sm mb-2">{client.email}</div>

                    {/* Notes Section - Notes label, content, and icons on the same line and centered */}
                    <div className="w-full mb-4 px-2">
                      {editingNoteId === client.user_id ? (
                        <div className="flex flex-col items-center w-full"> {/* Centralize the textarea and buttons */}
                          <textarea
                            className={`w-full p-2 border rounded-md text-sm text-center ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-300 text-gray-800"}`}
                            value={editedNoteContent}
                            onChange={(e) => setEditedNoteContent(e.target.value)}
                            rows="1"
                            style={{ minHeight: '1.5rem', maxHeight: '5rem', overflowY: 'auto' }}
                          />
                          <div className="flex gap-2 mt-2"> {/* Buttons closer to textarea */}
                            <button
                              onClick={() => handleSaveNote(client.user_id)}
                              className={`p-1 rounded-full ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-700"}`}
                              title="Save Note"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className={`p-1 rounded-full ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-700"}`}
                              title="Cancel Edit"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2"> {/* This row will be centered */}
                          <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} flex-shrink-0`}>Notes:</span>
                          <div className={`text-sm text-gray-500 dark:text-gray-400 italic break-words flex-grow-0`}> {/* No flex-grow */}
                            {client.notes || 'No notes yet.'}
                          </div>
                          <button
                            onClick={() => handleEditNote(client.user_id, client.notes)}
                            className={`p-1 rounded-full ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
                            title="Edit Note"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center">
                      <button onClick={() => handleViewProfile(client.user_id)} className={`text-xs hover:underline rounded-xl px-2 py-1 h-8 flex items-center justify-center ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-700 hover:text-green-800"}`}>View</button>
                      <button onClick={() => handleSendEmail(client)} className={`text-xs hover:underline rounded-xl px-2 py-1 h-8 flex items-center justify-center ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-700 hover:text-blue-800"}`}>Email</button>
                      <button onClick={() => handleRespondInquiry(client.user_id)} className={`text-xs hover:underline rounded-xl px-2 py-1 h-8 flex items-center justify-center ${darkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-700 hover:text-indigo-800"}`}>Respond</button>
                      <button onClick={() => handleToggleStatus(client.user_id, client.client_status)} className={`text-xs hover:underline rounded-xl px-2 py-1 h-8 flex items-center justify-center ${darkMode ? "text-yellow-400 hover:text-yellow-300" : "text-yellow-600 hover:text-yellow-700"}`}>
                        {client.client_status === 'vip' ? 'Make Regular' : 'Make VIP'}
                      </button>
                      <button onClick={() => handleRemoveClient(client.user_id)} title="Remove client" className={`rounded-xl p-1 h-8 w-8 flex items-center justify-center ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-700"}`}>
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={`w-full text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <thead>
                    <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      <th onClick={() => handleSortClick('full_name')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: '120px' }}>Name {renderSortIcon('full_name')}</th>
                      <th onClick={() => handleSortClick('email')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: '150px' }}>Email {renderSortIcon('email')}</th>
                      <th className="text-left py-2 px-1 whitespace-nowrap" style={{ width: '80px' }}>Status</th>
                      <th className="text-left py-2 px-1 whitespace-nowrap" style={{ width: '200px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                    {paginatedClients.map(client => ( // Use paginatedClients here too
                      <tr key={client.user_id} className={`border-t cursor-default max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}>
                        <td className="px-1 py-2 truncate whitespace-nowrap max-w-[120px]" title={client.full_name}>{client.full_name}</td>
                        <td className="px-1 py-2 truncate whitespace-nowrap max-w-[150px]" title={client.email}>{client.email}</td>
                        <td className={`px-1 py-2 truncate whitespace-nowrap max-w-[80px] font-semibold ${
                            client.client_status === 'vip'
                              ? 'text-green-600'
                              : (darkMode ? 'text-gray-300' : 'text-gray-600')
                          }`} title={client.client_status || 'regular'}>{client.client_status || 'regular'}</td>
                        <td className="px-1 py-2 flex gap-1 max-w-[200px]">
                          <button onClick={() => handleViewProfile(client.user_id)} className={`text-xs hover:underline rounded-xl px-2 py-1 h-8 flex items-center justify-center ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-700 hover:text-green-800"}`}>View</button>
                          <button onClick={() => handleSendEmail(client)} className={`text-xs hover:underline rounded-xl px-2 py-1 h-8 flex items-center justify-center ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-700 hover:text-blue-800"}`}>Email</button>
                          <button onClick={() => handleRespondInquiry(client.user_id)} className={`text-xs hover:underline rounded-xl px-2 py-1 h-8 flex items-center justify-center ${darkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-700 hover:text-indigo-800"}`}>Respond</button>
                          <button onClick={() => handleToggleStatus(client.user_id, client.client_status)} className={`text-xs hover:underline rounded-xl px-2 py-1 h-8 flex items-center justify-center ${darkMode ? "text-yellow-400 hover:text-yellow-300" : "text-yellow-600 hover:text-yellow-700"}`}>
                            {client.client_status === 'vip' ? 'Make Regular' : 'Make VIP'}
                          </button>
                          <button onClick={() => handleRemoveClient(client.user_id)} title="Remove client" className={`rounded-xl p-1 h-8 w-8 flex items-center justify-center ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-700"}`}>
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
          {/* Pagination Controls */}
          {filteredClients.length > 0 && (
            <div className="flex justify-center items-center space-x-4 mt-4">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
              >Prev</button>
              <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages || totalPages === 0}
                className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
              >Next</button>
            </div>
          )}
        </motion.div>

        <SendEmailModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          agentId={agentId}
          client={selectedClient}
          onSent={() => toast.success("Email sent")}
          darkMode={darkMode} // Pass darkMode prop
        />
      </motion.div>
    </div>
  );
};

export default Clients;
