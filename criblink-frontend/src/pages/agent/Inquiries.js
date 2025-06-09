import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import AgentSidebar from '../../components/agent/Sidebar';
import { ArrowUpIcon, ArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import AgentInquiryModal from '../../components/AgentInquiryModal'; // Import the new AgentInquiryModal

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const [page, setPage] = useState(1);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const limit = 10;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('inquiries');
  const { darkMode } = useTheme();

  // State for the AgentInquiryModal (for viewing/responding/deleting inquiries)
  const [isAgentInquiryModalOpen, setIsAgentInquiryModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null); // The inquiry object for the modal
  const [agentMessageForResolution, setAgentMessageForResolution] = useState(''); // Only used when mode is 'resolve'

  const navigate = useNavigate();

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  const fetchInquiries = async () => {
    const params = new URLSearchParams({
      search,
      page,
      limit,
      sort: sortKey,
      direction: sortDirection,
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/agent/inquiries?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          console.error("Authentication or Authorization error fetching inquiries.");
          navigate('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setInquiries(data.inquiries || []);
      setTotalInquiries(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
      setInquiries([]);
      setTotalInquiries(0);
    }
  };

  const location = useLocation();

  useEffect(() => {
    if (location.state?.sortKey) setSortKey(location.state.sortKey);
    if (location.state?.sortDirection) setSortDirection(location.state.sortDirection);
  }, [location.state]);

  useEffect(() => {
    fetchInquiries();
  }, [search, page, sortKey, sortDirection]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSortClick = (key) => {
    if (key !== 'message_action' && key !== 'view_property') {
      setSortDirection(sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc');
      setSortKey(key);
      setPage(1);
    }
  };

  const renderSortIcon = (key) =>
    sortKey === key ? (
      sortDirection === 'asc' ? (
        <ArrowUpIcon className={`h-4 w-4 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      ) : (
        <ArrowDownIcon className={`h-4 w-4 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      )
    ) : (
      <ArrowDownIcon className={`h-4 w-4 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
    );

  // Clicking the message directly opens AgentInquiryModal
  const handleViewMessageAndResolve = (inquiry) => {
    setSelectedInquiry(inquiry);
    setAgentMessageForResolution(inquiry.agent_response || ''); // Pre-fill with agent's existing response
    setIsAgentInquiryModalOpen(true); // Open the AgentInquiryModal
  };

  const handleDeleteInquiry = async () => {
    if (!selectedInquiry) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/agent/inquiries/${selectedInquiry.inquiry_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        console.log(`Inquiry ${selectedInquiry.inquiry_id} deleted successfully.`);
        setIsAgentInquiryModalOpen(false); // Close modal
        setSelectedInquiry(null);
        fetchInquiries(); // Re-fetch inquiries
      } else {
        console.error('Failed to delete inquiry.');
      }
    } catch (err) {
      console.error('Error deleting inquiry:', err);
    }
  };

  const handleSubmitResolution = async (inquiryToResolve, agentResponse, setInquiryStatus) => {
    if (!inquiryToResolve || !agentResponse.trim()) {
      setInquiryStatus('error');
      console.error('No inquiry selected or message is empty for resolution.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/agent/inquiries/${inquiryToResolve.inquiry_id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agent_response: agentResponse,
          client_email: inquiryToResolve.email,
        }),
      });

      if (res.ok) {
        setInquiryStatus('success');
        console.log(`Inquiry ${inquiryToResolve.inquiry_id} resolved successfully.`);
        setTimeout(() => {
          setIsAgentInquiryModalOpen(false);
          setSelectedInquiry(null);
          setAgentMessageForResolution('');
          fetchInquiries();
        }, 2000);
      } else {
        setInquiryStatus('error');
        console.error('Failed to resolve inquiry.');
      }
    } catch (err) {
      setInquiryStatus('error');
      console.error('Error resolving inquiry:', err);
    }
  };

  const handleViewProperty = (propertyId) => {
    navigate(`/listings/${propertyId}`);
  };

  const totalPages = Math.ceil(totalInquiries / limit);

  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;


  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <motion.button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className={`fixed top-20 left-4 z-50 p-2 rounded-full shadow-md ${darkMode ? "bg-gray-800" : "bg-white"}`}
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

      {/* Sidebar */}
      <AgentSidebar
        collapsed={isMobile ? false : isCollapsed}
        setCollapsed={isMobile ? () => {} : setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main content with smooth margin-left shift and min width so content doesn't shrink */}
      <motion.div
        key={isMobile ? 'mobile' : 'desktop'}
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3 }}
        initial={false}
        className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
        style={{ minWidth: `calc(100% - ${contentShift}px)` }}
      >
        {/* Headers */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Client Inquiries</h1>
        </div>
        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Client Inquiries</h1>
        </div>

        {/* Card container */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`rounded-3xl p-6 shadow space-y-4 max-w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}
        >
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder="Search inquiries..."
              className={`w-full md:w-1/3 py-2 px-4 border rounded-xl h-10 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
              }`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Table container with horizontal scroll */}
          <div className="overflow-x-auto">
            <table className={`w-full mt-4 text-left text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <thead>
                <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {[
                    'inquiry_id',
                    'message_action', // Combined message and action for table header
                    'client_id',
                    'property_id',
                    'name',
                    'email',
                    'phone',
                    'status',
                    'assigned_agent',
                    'agent_response',
                    'created_at',
                    'updated_at',
                  ].map((key) => (
                    <th
                      key={key}
                      onClick={() => handleSortClick(key)}
                      className={`py-2 px-2 cursor-pointer select-none ${
                        sortKey === key ? (darkMode ? 'text-green-400' : 'text-green-700') : ''
                      }`}
                      style={{
                        width:
                          key === 'inquiry_id' ? '90px' :
                          key === 'message_action' ? '200px' : // Increased width for message/actions
                          key === 'client_id' ? '120px' :
                          key === 'property_id' ? '120px' :
                          key === 'name' ? '120px' :
                          key === 'email' ? '160px' :
                          key === 'phone' ? '120px' :
                          key === 'status' ? '80px' :
                          key === 'assigned_agent' ? '120px' :
                          key === 'agent_response' ? '150px' :
                          key === 'created_at' ? '120px' :
                          key === 'updated_at' ? '120px' : 'auto'
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>
                          {key === 'inquiry_id' ? 'ID' :
                           key === 'message_action' ? 'Message / Actions' :
                           key === 'client_id' ? 'Client ID' :
                           key === 'property_id' ? 'Property ID' :
                           key === 'assigned_agent' ? 'Agent' :
                           key === 'agent_response' ? 'Agent Response' :
                           key === 'created_at' ? 'Created At' :
                           key === 'updated_at' ? 'Updated At' :
                           key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        {(key !== 'message_action' && key !== 'property_id' && key !== 'client_id') && renderSortIcon(key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                {inquiries.length > 0 ? (
                  inquiries.map((inq) => (
                    <tr
                      key={inq.inquiry_id}
                      className={`border-t cursor-default max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}
                    >
                      <td className="py-2 px-2 max-w-[90px] truncate" title={inq.inquiry_id}>{inq.inquiry_id}</td>
                      {/* Message column: Clicking message opens AgentInquiryModal */}
                      <td className="py-2 px-2 max-w-[200px]">
                        <div className="flex flex-col gap-1">
                          <span
                            className="truncate cursor-pointer text-blue-500 hover:underline"
                            onClick={() => handleViewMessageAndResolve(inq)}
                            title="Click to view message & resolve"
                          >
                            {inq.message}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 max-w-[120px] truncate" title={inq.client_id || 'N/A'}>{inq.client_id || 'Guest'}</td>
                      <td className="py-2 px-2 max-w-[120px] truncate">
                        {inq.property_id ? (
                          <div className="flex items-center">
                            <span className="truncate" title={inq.property_id}>{inq.property_id}</span>
                            <button
                              onClick={() => handleViewProperty(inq.property_id)}
                              className="ml-2 py-1 px-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition text-xs"
                              title="View"
                            >
                              View
                            </button>
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="py-2 px-2 max-w-[120px] truncate" title={inq.name}>{inq.name}</td>
                      <td className="py-2 px-2 max-w-[160px] truncate" title={inq.email}>{inq.email}</td>
                      <td className="py-2 px-2 max-w-[120px] truncate" title={inq.phone || 'N/A'}>{inq.phone || 'N/A'}</td>
                      <td
                        className={`py-2 px-2 max-w-[80px] truncate font-semibold ${
                          inq.status === 'new'
                            ? 'text-red-600'
                            : inq.status === 'assigned'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                        title={inq.status}
                      >
                        {inq.status}
                      </td>
                      <td className="py-2 px-2 max-w-[120px] truncate" title={inq.assigned_agent || 'Unassigned'}>
                        {inq.assigned_agent || 'Unassigned'}
                      </td>
                      <td className="py-2 px-2 max-w-[150px] truncate" title={inq.agent_response || 'No response yet'}>
                         {inq.agent_response || 'N/A'}
                      </td>
                      <td className="py-2 px-2 max-w-[120px] truncate" title={formatDate(inq.created_at)}>
                        {formatDate(inq.created_at)}
                      </td>
                      <td className="py-2 px-2 max-w-[120px] truncate" title={formatDate(inq.updated_at)}>
                        {formatDate(inq.updated_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className={`py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      No inquiries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center space-x-4 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
            >
              Previous
            </button>
            <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages || totalPages === 0}
              className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
            >
              Next
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* AgentInquiryModal (for viewing, resolving, and deleting) */}
      <AnimatePresence>
        {isAgentInquiryModalOpen && selectedInquiry && (
          <AgentInquiryModal
            isOpen={isAgentInquiryModalOpen}
            onClose={() => setIsAgentInquiryModalOpen(false)}
            onSubmit={handleSubmitResolution}
            inquiry={selectedInquiry}
            initialAgentMessage={agentMessageForResolution}
            darkMode={darkMode}
            onViewProperty={handleViewProperty}
            onDelete={handleDeleteInquiry}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inquiries;
