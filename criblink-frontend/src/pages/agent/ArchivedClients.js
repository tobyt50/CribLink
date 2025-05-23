import React, { useEffect, useState } from 'react';
import AgentSidebar from '../../components/agent/Sidebar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config';
import { motion } from 'framer-motion'; // Import motion for animations
import { ArrowUpIcon, ArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline'; // Import icons for sorting and delete

const ArchivedClients = () => {
  const [clients, setClients] = useState([]);
  const [agentId, setAgentId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  // State for sorting
  const [sortKey, setSortKey] = useState('archived_at'); // Default sort by archived date
  const [sortDirection, setSortDirection] = useState('desc'); // Default sort descending

  // Sync sidebar state on window resize
  useEffect(() => {
    const handleResize = () => {
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
      alert('Authentication token not found. Please sign in.');
      return;
    }

    try {
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
