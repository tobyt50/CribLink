import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Squares2X2Icon,
  TableCellsIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import AgentSidebar from '../../components/agent/Sidebar';
import ClientCard from '../../components/agent/ClientCard';
import SendEmailModal from '../../components/agent/SendEmailModal';
import API_BASE_URL from '../../config';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('full_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState('graphical');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [agentId, setAgentId] = useState(null);

  // State for sidebar visibility and collapse, consistent with other agent pages
  const [isCollapsed, setIsCollapsed] = useState(false);
  // State for active section in the sidebar, consistent with other agent pages
  const [activeSection, setActiveSection] = useState('clients'); // Set default active section for Clients page

  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);
  const navigate = useNavigate();

  // Removed the resize effect as AgentSidebar is now fixed and manages its own collapse state.

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
        const { data } = await axios.get(`${API_BASE_URL}/clients/agent/${agentId}/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClients(data);
        setFilteredClients(data);
      } catch (err) {
        console.error('Failed to fetch clients', err);
      }
    };
    fetchClients();
  }, [agentId]);

  useEffect(() => {
    const filtered = clients.filter((c) =>
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  useEffect(() => {
    const sorted = [...filteredClients].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      if (typeof aValue === 'string') return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
    setFilteredClients(sorted);
  }, [sortKey, sortDirection]);

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
        <ArrowUpIcon className="h-4 w-4 ml-1 inline text-green-700" />
      ) : (
        <ArrowDownIcon className="h-4 w-4 ml-1 inline text-green-700" />
      );
    }
    return <ArrowDownIcon className="h-4 w-4 ml-1 inline text-gray-400" />;
  };

  const handleExportCsv = (scope) => {
    const dataToExport = scope === 'current' ? filteredClients : clients;
    const headers = ['user_id', 'full_name', 'email', 'date_joined', 'status', 'notes', 'client_status'];
    const csvRows = dataToExport.map((c) => [
      c.user_id,
      c.full_name,
      c.email,
      new Date(c.date_joined).toLocaleDateString(),
      c.status,
      c.notes || '',
      c.client_status || '',
    ]);
    const csvContent = [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'clients.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDropdownOpen(false);
  };

  // Adjust contentShift based on isCollapsed state, consistent with other agent pages
  const contentShift = isCollapsed ? 80 : 256;

  return (
    <div className="bg-gray-50 pt-0 -mt-6 px-4 md:px-8">
      {/* AgentSidebar now receives collapsed, setCollapsed, activeSection, setActiveSection */}
      <AgentSidebar
        collapsed={isCollapsed}
        setCollapsed={setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <motion.div
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3 }}
        className="flex-1 p-4 md:p-6" // Restored original padding
      >
        {/* Mobile-only H1 element */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className="text-2xl font-extrabold text-green-700 text-center">Clients</h1>
        </div>

        {/* Desktop-only centered title, consistent with other agent pages */}
        <div className="hidden md:block mb-6"> {/* Restored original mb-6 */}
          <h1 className="text-3xl font-extrabold text-green-700 mb-6 text-center">Clients</h1>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-xl shadow-sm"
          />

          <div className="flex gap-2 items-center">
            <div className="relative" ref={exportDropdownRef}>
              <button
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="bg-green-400 text-white flex items-center px-4 h-10 rounded-xl hover:bg-green-500 text-sm font-medium"
              >
                Export to CSV <ChevronDownIcon className="ml-2 h-5 w-5" />
              </button>
              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-10">
                  <button onClick={() => handleExportCsv('current')} className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100">
                    Current View
                  </button>
                  <button onClick={() => handleExportCsv('all')} className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100">
                    All Clients
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setViewMode('simple')} className={`p-2 rounded-xl ${viewMode === 'simple' ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
              <TableCellsIcon className="h-6 w-6" />
            </button>
            <button onClick={() => setViewMode('graphical')} className={`p-2 rounded-xl ${viewMode === 'graphical' ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
              <Squares2X2Icon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No clients found matching your criteria.
          </div>
        ) : (
          viewMode === 'graphical' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map(client => (
                <ClientCard
                  key={client.user_id}
                  client={{ ...client, agent_id: agentId }}
                  onSendEmail={() => handleSendEmail(client)}
                  onRespondInquiry={() => handleRespondInquiry(client.user_id)}
                  onViewProfile={() => handleViewProfile(client.user_id)}
                  onRemove={() => handleRemoveClient(client.user_id)}
                  onToggleStatus={() => handleToggleStatus(client.user_id, client.client_status)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th onClick={() => handleSortClick('full_name')} className="cursor-pointer text-left">Name {renderSortIcon('full_name')}</th>
                    <th onClick={() => handleSortClick('email')} className="cursor-pointer text-left">Email {renderSortIcon('email')}</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(client => (
                    <tr key={client.user_id} className="border-t">
                      <td className="px-2 py-2">{client.full_name}</td>
                      <td className="px-2 py-2">{client.email}</td>
                      <td className="px-2 py-2">{client.client_status}</td>
                      <td className="px-2 py-2 flex gap-2 flex-wrap">
                        <button onClick={() => handleViewProfile(client.user_id)} className="text-xs text-green-700 hover:underline">View</button>
                        <button onClick={() => handleSendEmail(client)} className="text-xs text-blue-700 hover:underline">Email</button>
                        <button onClick={() => handleRespondInquiry(client.user_id)} className="text-xs text-indigo-700 hover:underline">Respond</button>
                        <button onClick={() => handleToggleStatus(client.user_id, client.client_status)} className="text-xs text-yellow-600 hover:underline">
                          {client.client_status === 'vip' ? 'Make Regular' : 'Make VIP'}
                        </button>
                        <button onClick={() => handleRemoveClient(client.user_id)} title="Remove client">
                          <TrashIcon className="h-4 w-4 text-red-500 hover:text-red-700" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        <SendEmailModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          agentId={agentId}
          client={selectedClient}
          onSent={() => toast.success("Email sent")}
        />
      </motion.div>
    </div>
  );
};

export default Clients;
