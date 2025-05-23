import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
// Removed AdminHeader as it's no longer needed with the new sidebar structure
import AdminSidebar from '../../components/admin/Sidebar';
import { ArrowUpIcon, ArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('start_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalStaff, setTotalStaff] = useState(0);

  // State for sidebar visibility and collapse, consistent with Dashboard.js and Listings.js
  const [isCollapsed, setIsCollapsed] = useState(false);
  // State for active section in the sidebar, consistent with Dashboard.js and Listings.js
  const [activeSection, setActiveSection] = useState('staff'); // Set default active section for Staff page

  const [actionSelections, setActionSelections] = useState({});
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const exportDropdownRef = useRef(null);
  const limit = 10;

  const fetchStaff = async () => {
    const params = new URLSearchParams({ search, page, limit, sort: sortKey, direction: sortDirection });
    try {
      const res = await fetch(`http://localhost:5000/admin/staff?${params.toString()}`);
      const data = await res.json();
      setStaffList(data.staff);
      setTotalStaff(data.total);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  useEffect(() => { fetchStaff(); }, [search, page, sortKey, sortDirection]);

  // Removed the resize effect as AdminSidebar is now fixed and manages its own collapse state.

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortClick = (key) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const renderPersistentSortIcon = (key) => {
    const isSorted = sortKey === key;
    const iconClass = 'h-4 w-4';
    if (!isSorted) return <ArrowDownIcon className={`${iconClass} text-gray-400`} />;
    return sortDirection === 'asc'
      ? <ArrowUpIcon className={`${iconClass} text-green-700`} />
      : <ArrowDownIcon className={`${iconClass} text-green-700`} />;
  };

  const handleExportCsv = async (scope) => {
    if ((scope === 'current' && staffList.length === 0) || (scope === 'all' && totalStaff === 0)) {
      alert(`No staff data found for ${scope} export.`);
      setIsExportDropdownOpen(false);
      return;
    }
    let data = staffList;
    if (scope === 'all') {
      const params = new URLSearchParams({ search, sort: sortKey, direction: sortDirection });
      try {
        const res = await fetch(`http://localhost:5000/admin/staff?${params.toString()}`);
        const fullData = await res.json();
        data = fullData.staff || fullData;
      } catch (err) {
        console.error('Export fetch error:', err);
        alert('Export failed.');
        return;
      }
    }

    const headers = ['Employee ID', 'Full Name', 'Role', 'Department', 'Email', 'Phone', 'Start Date', 'Status', 'User ID'];
    const csvRows = data.map(s => [
      s.employee_id, s.full_name, s.role, s.department, s.email, s.phone,
      formatDate(s.start_date), s.status || 'N/A', s.user_id || 'N/A'
    ].map(f => `"${String(f).replace(/"/g, '""')}"`));

    const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'staff_directory.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDropdownOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      alert('Delete functionality not yet implemented.');
    }
  };

  const handleStatusToggle = async (id, status) => {
    const newStatus = status === 'active' ? 'suspended' : 'active';
    alert(`Status toggle to: ${newStatus} not yet implemented.`);
  };

  const handleResetPassword = async (id) => {
    alert(`Reset password for ${id} not yet implemented.`);
  };

  const handleActionApply = (staff) => {
    const action = actionSelections[staff.employee_id];
    if (!action) return;
    if (action === 'suspend' || action === 'activate') handleStatusToggle(staff.employee_id, staff.status);
    else if (action === 'delete') handleDelete(staff.employee_id);
    else if (action === 'reset-password') handleResetPassword(staff.employee_id);
    setActionSelections(prev => ({ ...prev, [staff.employee_id]: '' }));
  };

  const totalPages = Math.ceil(totalStaff / limit);
  // Adjust contentShift based on isCollapsed state, consistent with Dashboard.js and Listings.js
  const contentShift = isCollapsed ? 80 : 256;

  const formatDate = (iso) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
  };

  return (
    <div className="bg-gray-50 pt-0 -mt-6 px-4 md:px-8">
      {/* AdminSidebar now receives collapsed, setCollapsed, activeSection, setActiveSection */}
      <AdminSidebar
        collapsed={isCollapsed}
        setCollapsed={setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <motion.div animate={{ marginLeft: contentShift }} transition={{ duration: 0.3 }} className="flex-1 p-4 md:p-6">
        {/* Mobile-only H1 element */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className="text-2xl font-extrabold text-green-700 text-center">Staff Directory</h1>
        </div>
        {/* Desktop-only centered title, consistent with Dashboard.js and Listings.js */}
        <div className="hidden md:block mb-6">
          {/* Centered heading for desktop */}
          <h1 className="text-3xl font-extrabold text-green-700 mb-6 text-center">Staff Directory</h1>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-3xl p-6 shadow space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full md:w-1/3 py-2 px-4 border border-gray-300 rounded-xl" />
            <div className="relative inline-block text-left" ref={exportDropdownRef}>
              <button onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)} className="inline-flex justify-center items-center gap-x-1.5 rounded-xl bg-green-400 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500">
                Export to CSV <ChevronDownIcon className="-mr-1 h-5 w-5 text-white" />
              </button>
              {isExportDropdownOpen && (
                <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <button onClick={() => handleExportCsv('current')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-xl">Current Page</button>
                    <button onClick={() => handleExportCsv('all')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-xl">All Staff</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full mt-4 text-sm table-fixed">
              <thead>
                <tr className="text-gray-500">
                  {["employee_id", "full_name", "role", "department", "email", "phone", "start_date", "status"].map(key => (
                    <th key={key} onClick={() => handleSortClick(key)} className="py-2 px-2 cursor-pointer text-left hover:text-green-700 align-middle">
                      <div className="flex items-center gap-2">
                        <span>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        {renderPersistentSortIcon(key)}
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-2 text-left whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(staff => (
                  <tr key={staff.employee_id} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-2">{staff.employee_id}</td>
                    <td className="py-2 px-2">{staff.full_name}</td>
                    <td className="py-2 px-2 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" title={staff.role}>{staff.role}</td>
                    <td className="py-2 px-2">{staff.department}</td>
                    <td className="py-2 px-2 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" title={staff.email}>{staff.email}</td>
                    <td className="py-2 px-2">{staff.phone}</td>
                    <td className="py-2 px-2">{formatDate(staff.start_date)}</td>
                    <td className="py-2 px-2">{staff.status || 'N/A'}</td>
                    <td className="text-left px-2">
                      <div className="flex flex-col gap-1 items-start w-full min-w-[120px]">
                        <select className="py-1 px-2 border rounded-xl text-sm w-full" value={actionSelections[staff.employee_id] || ''} onChange={e => setActionSelections(prev => ({ ...prev, [staff.employee_id]: e.target.value }))}>
                          <option value="">Select Action</option>
                          <option value={staff.status === 'active' ? 'suspend' : 'activate'}>{staff.status === 'active' ? 'Suspend' : 'Activate'}</option>
                          <option value="reset-password">Reset Password</option>
                          <option value="delete">Delete</option>
                        </select>
                        <button onClick={() => handleActionApply(staff)} className="text-xs text-white bg-green-400 hover:bg-green-500 rounded-xl px-2 py-1 w-full">Apply</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-gray-400">No staff members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              className="px-4 py-2 rounded-xl bg-gray-100 text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(prev => prev + 1)}
              className="px-4 py-2 rounded-xl bg-gray-100 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Staff;
