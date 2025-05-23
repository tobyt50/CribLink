import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
// Removed AdminHeader as it's no longer needed with the new sidebar structure
import AdminSidebar from '../../components/admin/Sidebar';
// Import icons used in Users.js for consistency
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

const Inquiries = () => {
  // State for inquiry data and filtering/sorting
  const [inquiries, setInquiries] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState('created_at'); // Assuming inquiries have a creation date
  const [sortDirection, setSortDirection] = useState('desc');

  // State for pagination
  const [page, setPage] = useState(1);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const limit = 10; // Same limit as Users.js

  // State for sidebar visibility and collapse, consistent with other admin pages
  const [isCollapsed, setIsCollapsed] = useState(false);
  // State for active section in the sidebar, consistent with other admin pages
  const [activeSection, setActiveSection] = useState('inquiries'); // Set default active section for Inquiries page

  // State for action selections (if we implement a similar action dropdown)
  // For now, keeping simple buttons, but adding the state structure
  const [actionSelections, setActionSelections] = useState({});

  // Function to format date (copied from Users.js)
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };


  // Fetch inquiries with pagination, sorting, and filtering
  const fetchInquiries = async () => {
    // Construct URL parameters similar to Users.js
    const params = new URLSearchParams({
      search,
      status: statusFilter,
      page,
      limit,
      sort: sortKey,
      direction: sortDirection
    });

    try {
      // Assuming the backend supports these query parameters
      const res = await fetch(`http://localhost:5000/admin/inquiries?${params}`);
      const data = await res.json();
      // Assuming the API returns an object like { inquiries: [...], total: N }
      setInquiries(data.inquiries || data); // Adjust based on actual API response structure
      setTotalInquiries(data.total || data.length); // Adjust based on actual API response structure
    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
      // Optionally set inquiries to empty array and total to 0 on error
      setInquiries([]);
      setTotalInquiries(0);
    }
  };

  const location = useLocation();

  useEffect(() => {
    if (location.state?.sortKey) {
      setSortKey(location.state.sortKey);
    }
    if (location.state?.sortDirection) {
      setSortDirection(location.state.sortDirection);
    }
  }, [location.state]);

  // Effect to fetch data when filters, sorting, or pagination changes
  useEffect(() => {
    fetchInquiries();
  }, [search, statusFilter, page, sortKey, sortDirection]); // Dependencies include all state variables affecting the fetch

  // Removed the resize effect as AdminSidebar is now fixed and manages its own collapse state.

  // Handle sorting click (copied from Users.js logic)
  const handleSortClick = (key) => {
    setSortDirection(sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc');
    setSortKey(key);
    setPage(1); // Reset page to 1 on sort change
  };

  // Render sort icon (copied from Users.js)
  const renderSortIcon = (key) => sortKey === key
    ? sortDirection === 'asc'
      ? <ArrowUpIcon className="h-4 w-4 inline text-green-700" />
      : <ArrowDownIcon className="h-4 w-4 inline text-green-700" />
    : <ArrowDownIcon className="h-4 w-4 inline text-gray-400" />;

  // Handle assigning an inquiry (kept similar prompt logic for now)
  const handleAssign = async (inquiryId) => {
    // Replaced window.prompt with a custom alert/modal for consistency and better UX
    // For this example, I'll use a simple alert for demonstration, but in a real app,
    // you'd use a custom modal for input.
    const agentId = prompt('Enter Agent ID to assign:'); // Still using prompt for now, but ideally a modal
    if (!agentId) return; // Exit if prompt is cancelled or empty

    try {
      const res = await fetch(`http://localhost:5000/admin/inquiries/${inquiryId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId }),
      });
      if (res.ok) {
        alert('Inquiry assigned successfully!'); // Provide user feedback
        fetchInquiries(); // Refresh data
      } else {
        const errorData = await res.json();
        alert(`Failed to assign inquiry: ${errorData.message || res.statusText}`); // Show error message
      }
    } catch (err) {
      console.error('Failed to assign inquiry:', err);
      alert('An error occurred while assigning the inquiry.'); // Generic error for unexpected issues
    }
  };

  // Handle resolving an inquiry
  const handleResolve = async (inquiryId) => {
    // Replaced window.confirm with a custom alert/modal for consistency and better UX
    if (!window.confirm('Are you sure you want to resolve this inquiry?')) { // Still using confirm for now, but ideally a modal
      return; // Exit if user cancels
    }
    try {
      const res = await fetch(`http://localhost:5000/admin/inquiries/${inquiryId}/resolve`, {
        method: 'PUT',
      });
      if (res.ok) {
        alert('Inquiry resolved successfully!'); // Provide user feedback
        fetchInquiries(); // Refresh data
      } else {
        const errorData = await res.json();
        alert(`Failed to resolve inquiry: ${errorData.message || res.statusText}`); // Show error message
      }
    } catch (err) {
      console.error('Failed to resolve inquiry:', err);
      alert('An error occurred while resolving the inquiry.'); // Generic error
    }
  };

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalInquiries / limit);

  // Calculate content shift based on sidebar state (copied from Users.js)
  const contentShift = isCollapsed ? 80 : 256;

  return (
    // Apply layout and styling from Users.js
    <div className="bg-gray-50 pt-0 -mt-6 px-4 md:px-8">
      {/* AdminSidebar component (now receives collapsed, setCollapsed, activeSection, setActiveSection) */}
      <AdminSidebar
        collapsed={isCollapsed}
        setCollapsed={setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      {/* Main content area with motion animation */}
      <motion.div
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 p-4 md:p-6" // Responsive padding
      >
        {/* Mobile-only H1 element */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className="text-2xl font-extrabold text-green-700 text-center">User Inquiries</h1>
        </div>
        {/* Desktop Header, consistent with other admin pages */}
        <div className="hidden md:block mb-6">
          <h1 className="text-3xl font-extrabold text-green-700 mb-6 text-center">User Inquiries</h1>
        </div>

        {/* Main content card with motion animation and styling */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl p-6 shadow space-y-4" // Rounded corners and shadow from Users.js
        >
          {/* Filter and Search section */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <input
              type="text"
              placeholder="Search inquiries..."
              className="w-full md:w-1/3 py-2 px-4 border border-gray-300 rounded-xl" // Changed to rounded-xl
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} // Reset page on search
            />
            {/* Status Filter */}
            <select
              className="py-2 px-4 border border-gray-300 rounded-xl bg-transparent focus:outline-none" // Changed to rounded-xl
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }} // Reset page on filter change
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="resolved">Resolved</option>
            </select>
            {/* Export button placeholder (if needed later, similar to Users.js) */}
            {/* <div className="relative inline-block text-left">
                 <button className="inline-flex justify-center items-center gap-x-1.5 rounded-xl bg-green-400 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500">
                   Export <ChevronDownIcon className="-mr-1 h-5 w-5 text-white" />
                 </button>
               </div> */}
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full mt-4 text-left text-sm table-fixed"> {/* Table styling from Users.js */}
              <thead>
                <tr className="text-gray-500">
                  {/* Table Headers with Sorting */}
                  {/* Assuming sortable keys: inquiry_id, name, email, status, created_at */}
                  {['inquiry_id', 'name', 'email', 'status', 'created_at', 'assigned_agent', 'actions'].map((k) => ( // Added assigned_agent and actions to sortable columns
                    <th
                      key={k}
                      onClick={k !== 'actions' ? () => handleSortClick(k) : undefined} // Actions column not sortable
                      className="py-2 px-2 cursor-pointer hover:text-green-700 whitespace-nowrap text-left"
                    >
                      <div className="flex items-center justify-start gap-1">
                        <span>{k.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        {k !== 'actions' && renderSortIcon(k)} {/* Only render sort icon for sortable columns */}
                      </div>
                    </th>
                  ))}
                  {/* Non-sortable headers */}
                  <th className="py-2 px-2 text-left whitespace-nowrap">Message</th> {/* Message column is not sortable */}
                </tr>
              </thead>
              <tbody>
                {/* Map through filtered and paginated inquiries */}
                {inquiries.map(inquiry => (
                  <tr key={inquiry.inquiry_id} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-2 text-left">{inquiry.inquiry_id}</td>
                    <td title={inquiry.name} className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap px-2 text-left">{inquiry.name}</td>
                    <td title={inquiry.email} className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap px-2 text-left">{inquiry.email}</td>
                    <td className="px-2 text-left">{inquiry.status}</td>
                    {/* Display formatted creation date */}
                    <td className="px-2 text-left">{formatDate(inquiry.created_at)}</td> {/* Assuming 'created_at' field */}
                    <td className="px-2 text-left">{inquiry.assigned_agent || 'Unassigned'}</td>
                    <td className="text-left px-2">
                      {/* Action buttons */}
                      <div className="flex flex-col gap-1 items-start w-full min-w-[120px]">
                        {/* Assign button */}
                        {inquiry.status !== 'resolved' && inquiry.status !== 'assigned' && (
                          <button
                            onClick={() => handleAssign(inquiry.inquiry_id)}
                            className="text-xs text-white bg-blue-500 hover:bg-blue-600 rounded-xl px-2 py-1 w-full" // Changed to rounded-xl
                          >
                            Assign
                          </button>
                        )}
                        {/* Resolve button */}
                        {inquiry.status !== 'resolved' && (
                          <button
                            onClick={() => handleResolve(inquiry.inquiry_id)}
                            className="text-xs text-white bg-green-500 hover:bg-green-600 rounded-xl px-2 py-1 w-full" // Changed to rounded-xl
                          >
                            Resolve
                          </button>
                        )}
                        {/* Example of a disabled button for resolved inquiries */}
                        {inquiry.status === 'resolved' && (
                          <span className="text-xs text-gray-500 bg-gray-200 rounded-xl px-2 py-1 w-full text-center">Resolved</span> // Changed to rounded-xl
                        )}
                      </div>
                    </td>
                    {/* Display message content - consider truncation or modal for long messages */}
                    <td title={inquiry.message} className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap px-2 text-left">{inquiry.message}</td>
                  </tr>
                ))}
                {/* Message when no inquiries are found */}
                {inquiries.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-gray-400"> {/* Adjusted colspan */}
                      No inquiries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center pt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              className="px-4 py-2 rounded-xl bg-gray-100 text-sm disabled:opacity-50" // Changed to rounded-xl
            >
              Prev
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl bg-gray-100 text-sm disabled:opacity-50" // Changed to rounded-xl
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
