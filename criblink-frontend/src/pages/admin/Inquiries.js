import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Sidebar';
import { ArrowUpIcon, ArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook


const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [search, setSearch] = useState('');
  // Removed statusFilter state as the dropdown is being removed
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const [page, setPage] = useState(1);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const limit = 10;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('inquiries');
  const { darkMode } = useTheme(); // Use the dark mode context

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  const fetchInquiries = async () => {
    const params = new URLSearchParams({
      search,
      // Removed status filter from params
      page,
      limit,
      sort: sortKey,
      direction: sortDirection,
    });

    try {
      const res = await fetch(`http://localhost:5000/admin/inquiries?${params}`);
      const data = await res.json();
      setInquiries(data.inquiries || data);
      setTotalInquiries(data.total || data.length);
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
  }, [search, page, sortKey, sortDirection]); // Removed statusFilter from dependencies

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
    // All columns except 'actions' are now sortable
    if (key !== 'actions') {
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

  const handleAssign = async (inquiryId) => {
    console.log(`Assigning inquiry ${inquiryId}. Agent ID will be prompted in a custom modal.`);
  };

  const handleResolve = async (inquiryId) => {
    console.log(`Confirming resolution for inquiry ${inquiryId}.`);
  };

  const totalPages = Math.ceil(totalInquiries / limit);

  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <motion.button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
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

      {/* Sidebar */}
      <AdminSidebar
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
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>User Inquiries</h1>
        </div>
        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>User Inquiries</h1>
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
              className={`w-full md:w-1/3 py-2 px-4 border rounded-xl h-10 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${ // Added focus and transition classes
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" // Added focus:ring-green-400
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600" // Added focus:ring-green-600
              }`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {/* Removed the status filter select element */}
          </div>

          {/* Table container with horizontal scroll */}
          <div className="overflow-x-auto">
            <table className={`w-full mt-4 text-left text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <thead>
                <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {[
                    'inquiry_id',
                    'name',
                    'email',
                    'phone',
                    'message',
                    'status',
                    'assigned_agent',
                    'created_at',
                    'actions',
                  ].map((key) => (
                    <th
                      key={key}
                      onClick={() => handleSortClick(key)} // Now all columns except 'actions' are clickable for sorting
                      className={`py-2 px-2 cursor-pointer select-none ${
                        sortKey === key ? (darkMode ? 'text-green-400' : 'text-green-700') : ''
                      }`}
                      style={{
                        width:
                          key === 'inquiry_id' ? '90px' :
                          key === 'name' ? '120px' :
                          key === 'email' ? '160px' :
                          key === 'phone' ? '120px' :
                          key === 'message' ? '150px' :
                          key === 'status' ? '80px' :
                          key === 'assigned_agent' ? '120px' :
                          key === 'created_at' ? '120px' :
                          key === 'actions' ? '150px' : 'auto'
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>
                          {key === 'inquiry_id' ? 'ID' :
                           key === 'assigned_agent' ? 'Agent' :
                           key === 'created_at' ? 'Created At' :
                           key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        {key !== 'actions' && renderSortIcon(key)} {/* Sort icon for all sortable columns */}
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
                      <td className="py-2 px-2 max-w-[90px] truncate" title={inq.inquiry_id && inq.inquiry_id.length > 10 ? inq.inquiry_id : ''}>{inq.inquiry_id}</td>
                      <td className="py-2 px-2 max-w-[120px] truncate" title={inq.name && inq.name.length > 15 ? inq.name : ''}>{inq.name}</td>
                      <td className="py-2 px-2 max-w-[160px] truncate" title={inq.email && inq.email.length > 20 ? inq.email : ''}>{inq.email}</td>
                      <td className="py-2 px-2 max-w-[120px] truncate" title={inq.phone && inq.phone.length > 15 ? inq.phone : ''}>{inq.phone}</td>
                      <td className="py-2 px-2 max-w-[150px] truncate" title={inq.message && inq.message.length > 20 ? inq.message : ''}>{inq.message}</td>
                      <td
                        className={`py-2 px-2 max-w-[80px] truncate font-semibold ${
                          inq.status === 'new'
                            ? 'text-red-600'
                            : inq.status === 'assigned'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                        title={inq.status && inq.status.length > 10 ? inq.status : ''}
                      >
                        {inq.status}
                      </td>
                      <td className="py-2 px-2 max-w-[120px] truncate" title={inq.assigned_agent && inq.assigned_agent.length > 15 ? inq.assigned_agent : ''}>
                        {inq.assigned_agent || 'Unassigned'}
                      </td>
                      <td className="py-2 px-2 max-w-[120px] truncate" title={formatDate(inq.created_at) && formatDate(inq.created_at).length > 15 ? formatDate(inq.created_at) : ''}>
                        {formatDate(inq.created_at)}
                      </td>
                      <td className="py-2 px-2 space-x-2 max-w-[150px]">
                        <button
                          onClick={() => handleAssign(inq.inquiry_id)}
                          className="py-1 px-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition text-xs"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => handleResolve(inq.inquiry_id)}
                          className="py-1 px-3 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition text-xs"
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className={`py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
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
              Prev
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
    </div>
  );
};

export default Inquiries;
