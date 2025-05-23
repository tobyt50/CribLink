import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Sidebar';
import { ArrowUpIcon, ArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortKey, setSortKey] = useState('date_joined');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('users');

  const [actionSelections, setActionSelections] = useState({});
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const exportDropdownRef = useRef(null);
  const limit = 10;

  // State for the confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState('');
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [confirmModalAction, setConfirmModalAction] = useState(() => () => {}); // Function to execute on confirmation

  // State for the alert modal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');
  const [alertModalType, setAlertModalType] = useState('success'); // 'success' or 'error'

  // Function to show the alert modal
  const showCustomAlert = (message, type) => {
    setAlertModalMessage(message);
    setAlertModalType(type);
    setShowAlertModal(true);
  };

  // Function to close the alert modal
  const closeAlertModal = () => {
    setShowAlertModal(false);
    setAlertModalMessage('');
    setAlertModalType('success');
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  // Function to fetch users from the backend
  const fetchUsers = async () => {
    const params = new URLSearchParams({ search, role: roleFilter, page, limit, sort: sortKey, direction: sortDirection });
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setUsers(data.users); // Update the users state with the fetched data
      setTotalUsers(data.total);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      showCustomAlert('Failed to fetch users. Please try again later.', 'error');
    }
  };

  const location = useLocation();

  useEffect(() => {
    if (location.state?.roleFilter) {
      setRoleFilter(location.state.roleFilter);
    }
    if (location.state?.sortKey) {
      setSortKey(location.state.sortKey);
    }
    if (location.state?.sortDirection) {
      setSortDirection(location.state.sortDirection);
    }
  }, [location.state]);

  // Effect to re-fetch users whenever search, filter, pagination, or sort parameters change
  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, page, sortKey, sortDirection]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) setIsExportDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortClick = (key) => {
    setSortDirection(sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc');
    setSortKey(key);
    setPage(1);
  };

  const renderSortIcon = (key) => sortKey === key
    ? sortDirection === 'asc'
      ? <ArrowUpIcon className="h-4 w-4 inline text-green-700" />
      : <ArrowDownIcon className="h-4 w-4 inline text-green-700" />
    : <ArrowDownIcon className="h-4 w-4 inline text-gray-400" />;

  const handleExportCsv = async (scope) => {
    if ((scope === 'current' && users.length === 0) || (scope === 'all' && totalUsers === 0)) {
      showCustomAlert(scope === 'current' ? 'No user data on the current page.' : 'No user data found for full export.', 'error');
      setIsExportDropdownOpen(false);
      return;
    }

    let dataToExport = users;
    const token = localStorage.getItem('token');

    if (scope === 'all') {
      const params = new URLSearchParams({ search, role: roleFilter, sort: sortKey, direction: sortDirection });
      try {
        const res = await fetch(`http://localhost:5000/admin/users?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        dataToExport = data.users || data;
      } catch (err) {
        console.error('Export error:', err);
        showCustomAlert('Failed to fetch all user data for export.', 'error');
        setIsExportDropdownOpen(false);
        return;
      }
    }

    setIsExportDropdownOpen(false);
    const headers = ['User ID', 'Full Name', 'Email', 'Role', 'Status', 'Date Joined'];
    const csv = [headers.join(','), ...dataToExport.map(u => [u.user_id, u.full_name, u.email, u.role, u.status || 'active', formatDate(u.date_joined)].map(f => `"${String(f).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'users_directory.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showCustomAlert('Export successful!', 'success');
  };

  // Function to handle user deletion logic
  const performDelete = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchUsers();
        showCustomAlert('User deleted successfully.', 'success');
      } else {
        const errorData = await response.json();
        showCustomAlert(`Failed to delete user: ${errorData.message || response.statusText}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showCustomAlert('An error occurred while trying to delete the user.', 'error');
    }
  };

  // Function to trigger delete confirmation
  const handleDelete = (userId) => {
    setConfirmModalTitle('Confirm Deletion');
    setConfirmModalContent('Are you sure you want to delete this user? This action cannot be undone.');
    setConfirmModalAction(() => () => performDelete(userId));
    setShowConfirmModal(true);
  };

  // Function to handle ban/unban logic
  const performBanToggle = async (userId, currentStatus) => {
    const actionText = currentStatus === 'banned' ? 'unban' : 'ban';
    const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchUsers();
        showCustomAlert(`User ${actionText}ned successfully.`, 'success');
      } else {
        const errorData = await res.json();
        showCustomAlert(`Failed to ${actionText} user: ${errorData.message || res.statusText}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showCustomAlert(`An error occurred while trying to ${actionText} the user.`, 'error');
    }
  };

  // Function to trigger ban/unban confirmation
  const handleBanToggle = (userId, status) => {
    const actionText = status === 'banned' ? 'unban' : 'ban';
    setConfirmModalTitle(`Confirm ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`);
    setConfirmModalContent(`Are you sure you want to ${actionText} this user?`);
    setConfirmModalAction(() => () => performBanToggle(userId, status));
    setShowConfirmModal(true);
  };

  // Function to handle role change logic
  const performRoleChange = async (userId, newRole) => {
    const token = localStorage.getItem('token');
    try {
      // Updated to use PUT method and /admin/users/:userId/role endpoint
      const res = await fetch(`http://localhost:5000/admin/users/${userId}/role`, {
        method: 'PUT', // Changed to PUT
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newRole: newRole }) // Ensure newRole is sent in the body
      });
      const data = await res.json();
      if (res.ok) {
        showCustomAlert(`Role changed to ${newRole} successfully.`, 'success');
      } else {
        showCustomAlert(data.error || 'Failed to change role', 'error');
      }
      fetchUsers();
    } catch (err) {
      console.error(err);
      showCustomAlert('An error occurred while trying to change the user role.', 'error');
    }
  };

  // Function to trigger role change confirmation
  const handleRoleChange = (userId, role) => {
    setConfirmModalTitle('Confirm Role Change');
    setConfirmModalContent(`Are you sure you want to change this user's role to ${role}?`);
    setConfirmModalAction(() => () => performRoleChange(userId, role));
    setShowConfirmModal(true);
  };

  const handleActionApply = (user) => {
    const action = actionSelections[user.user_id];
    if (!action) return;
    if (action === 'ban' || action === 'unban') handleBanToggle(user.user_id, user.status);
    else if (action === 'delete') handleDelete(user.user_id);
    else if (action.startsWith('role:')) handleRoleChange(user.user_id, action.split(':')[1]);
    setActionSelections(prev => ({ ...prev, [user.user_id]: '' }));
  };

  const totalPages = Math.ceil(totalUsers / limit);
  const contentShift = isCollapsed ? 80 : 256;

  // Confirmation Modal Component
  const ConfirmModal = ({ show, title, message, onConfirm, onCancel }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
          <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
          <p className="mb-6 text-gray-700">{message}</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Alert Modal Component
  const AlertModal = ({ show, message, type, onClose }) => {
    if (!show) return null;

    const bgColor = type === 'success' ? 'bg-green-100' : 'bg-red-100';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const borderColor = type === 'success' ? 'border-green-500' : 'border-red-500';

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className={`p-4 rounded-lg shadow-xl max-w-sm w-full mx-4 border-l-4 ${bgColor} ${borderColor}`}>
          <div className="flex justify-between items-center">
            <p className={`font-semibold ${textColor}`}>{message}</p>
            <button onClick={onClose} className={`text-lg font-bold ${textColor} hover:opacity-75`}>
              &times;
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 pt-0 -mt-6 px-4 md:px-8">
      <AdminSidebar
        collapsed={isCollapsed}
        setCollapsed={setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <motion.div animate={{ marginLeft: contentShift }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="flex-1 p-4 md:p-6">
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className="text-2xl font-extrabold text-green-700 text-center">Users</h1>
        </div>
        <div className="hidden md:block mb-6">
          <h1 className="text-3xl font-extrabold text-green-700 mb-6 text-center">Users</h1>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-3xl p-6 shadow space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full md:w-1/3 py-2 px-4 border border-gray-300 rounded-2xl" />
            <div className="relative inline-block text-left" ref={exportDropdownRef}>
              <button onClick={() => setIsExportDropdownOpen(p => !p)} className="inline-flex justify-center items-center gap-x-1.5 rounded-lg bg-green-400 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500">
                Export to CSV <ChevronDownIcon className="-mr-1 h-5 w-5 text-white" />
              </button>
              {isExportDropdownOpen && (
                <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <button onClick={() => handleExportCsv('current')} className="text-gray-700 block w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Current Page</button>
                    <button onClick={() => handleExportCsv('all')} className="text-gray-700 block w-full px-4 py-2 text-left text-sm hover:bg-gray-100">All Users</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full mt-4 text-left text-sm table-fixed">
              <thead>
                <tr className="text-gray-500">
                  {['user_id', 'full_name', 'email', 'status', 'date_joined'].map((k) => (
                    <th key={k} onClick={() => handleSortClick(k)} className="py-2 px-2 cursor-pointer hover:text-green-700 whitespace-nowrap text-left">
                      <div className="flex items-center justify-start gap-1">
                        <span>{k.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        {renderSortIcon(k)}
                      </div>
                    </th>
                  ))}
                  <th className="py-2 px-2 text-left">
                    <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="py-1 px-2 border rounded-lg text-sm w-24 bg-transparent focus:outline-none">
                      <option value="">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="agent">Agent</option>
                      <option value="client">Client</option>
                    </select>
                  </th>
                  <th className="px-6 py-2 text-left whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.user_id} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-2 text-left">{user.user_id}</td>
                    <td title={user.full_name} className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap px-2 text-left">{user.full_name}</td>
                    <td title={user.email} className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap px-2 text-left">{user.email}</td>
                    <td className="px-2 text-left">{user.status || 'active'}</td>
                    <td className="px-2 text-left">{formatDate(user.date_joined)}</td>
                    <td className="px-2 text-left">{user.role === 'user' ? 'Client' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
                    <td className="text-left px-2">
                      <div className="flex flex-col gap-1 items-start w-full min-w-[120px]">
                        <select className="py-1 px-2 border rounded-lg text-sm w-full" value={actionSelections[user.user_id] || ''} onChange={(e) => setActionSelections(prev => ({ ...prev, [user.user_id]: e.target.value }))}>
                          <option value="">Select Action</option>
                          {(user.role === 'client' || user.role === 'agent') && <option value="role:admin">Promote to Admin</option>}
                          {user.role === 'client' && <option value="role:agent">Promote to Agent</option>}
                          {user.role === 'admin' && <option value="role:agent">Demote to Agent</option>}
                          {(user.role === 'admin' || user.role === 'agent') && <option value="role:client">Demote to Client</option>}
                          <option value={user.status === 'banned' ? 'unban' : 'ban'}>{user.status === 'banned' ? 'Unban' : 'Ban'}</option>
                          <option value="delete">Delete</option>
                        </select>
                        <button onClick={() => handleActionApply(user)} className="text-xs text-white bg-green-400 hover:bg-green-500 rounded-lg px-2 py-1 w-full">Apply</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan="7" className="text-center py-4 text-gray-400">No users found.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center pt-4">
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(p - 1, 1))} className="px-4 py-2 rounded-lg bg-gray-100 text-sm disabled:opacity-50">Prev</button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-lg bg-gray-100 text-sm disabled:opacity-50">Next</button>
          </div>
        </motion.div>
      </motion.div>

      {/* Confirmation Modal */}
      <ConfirmModal
        show={showConfirmModal}
        title={confirmModalTitle}
        message={confirmModalContent}
        onConfirm={() => { confirmModalAction(); setShowConfirmModal(false); }}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Alert Modal */}
      <AlertModal
        show={showAlertModal}
        message={alertModalMessage}
        type={alertModalType}
        onClose={closeAlertModal}
      />
    </div>
  );
};

export default Users;
