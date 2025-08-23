import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Loader, Save, UserRoundCheck, Hourglass, ShieldAlert, Trash2, X, PencilIcon, Mail, Phone, Globe, MapPin, FileText, CheckCircle } from 'lucide-react';
import { useTheme } from '../../../layouts/AppShell';
import { useMessage } from '../../../context/MessageContext';
import { useAuth } from '../../../context/AuthContext';
import { useConfirmDialog } from '../../../context/ConfirmDialogContext';
import axiosInstance from '../../../api/axiosInstance';
import API_BASE_URL from '../../../config';

// --- Skeleton Component for Agency Settings ---
const AgencySettingsSkeleton = ({ darkMode }) => (
  <div className="animate-pulse space-y-8">
    {/* Agency Information Skeleton */}
    <div className="pb-6 mb-6 border-b border-gray-200 dark:border-gray-700">
      <div className={`h-8 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}></div>
      <div className="flex flex-col items-center mb-6">
        <div className={`w-32 h-32 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className={`h-4 w-1/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
            <div className={`h-10 w-full rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
          </div>
        ))}
      </div>
    </div>

    {/* Agency Members Skeleton */}
    <div className="pb-6 mb-6 border-b border-gray-200 dark:border-gray-700">
      <div className={`h-8 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}></div>
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className={`flex items-center justify-between p-4 rounded-xl h-20 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}></div>
        ))}
      </div>
    </div>

    {/* Pending Join Requests Skeleton */}
    <div className="pb-6 mb-6 border-b border-gray-200 dark:border-gray-700">
      <div className={`h-8 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}></div>
       <div className={`p-4 rounded-xl h-24 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}></div>
    </div>
  </div>
);


function AgencySettings() {
    const { darkMode } = useTheme();
    const { showMessage } = useMessage();
    const { showConfirm } = useConfirmDialog();
    const { user, logout } = useAuth();

    const [agencyInfo, setAgencyInfo] = useState(null);
    const [editingAgencyInfo, setEditingAgencyInfo] = useState(false);
    const [agencyForm, setAgencyForm] = useState({ name: '', email: '', phone: '', website: '', address: '', description: '', logoBase64: null, logoOriginalname: null });
    const [newLogoPreview, setNewLogoPreview] = useState('');
    const [updatingAgency, setUpdatingAgency] = useState(false);

    const [agencyMembers, setAgencyMembers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Styles
    const inputFieldStyles = `mt-1 block w-full py-2.5 px-4 border rounded-xl shadow-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`;
    const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;

    // --- Data Fetching ---
    const fetchAgencyInfo = useCallback(async () => {
        if (!user?.agency_id) return;
        try {
            const response = await axiosInstance.get(`/agencies/${user.agency_id}`);
            const data = response.data;
            setAgencyInfo(data);
            setAgencyForm({
                name: data.name || '', email: data.email || '', phone: data.phone || '',
                website: data.website || '', address: data.address || '', description: data.description || '',
                logoBase64: null, logoOriginalname: null,
            });
            setNewLogoPreview(data.logo_url || '');
        } catch (error) {
            showMessage("Failed to load agency information.", "error");
        }
    }, [user, showMessage]);

    const fetchAgencyMembers = useCallback(async () => {
        if (!user?.agency_id) return;
        try {
            const response = await axiosInstance.get(`/agencies/${user.agency_id}/agents`);
            setAgencyMembers(response.data);
        } catch (error) {
            showMessage("Failed to load agency members.", "error");
        }
    }, [user, showMessage]);

    const fetchPendingRequests = useCallback(async () => {
        if (!user?.agency_id) return;
        try {
            const response = await axiosInstance.get(`/agencies/${user.agency_id}/pending-requests`);
            setPendingRequests(response.data);
        } catch (error) {
            showMessage("Failed to load pending join requests.", "error");
        }
    }, [user, showMessage]);

    useEffect(() => {
        if (user?.role === 'agency_admin' && user?.agency_id) {
            setIsLoading(true);
            Promise.all([
                fetchAgencyInfo(),
                fetchAgencyMembers(),
                fetchPendingRequests()
            ]).finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [user, fetchAgencyInfo, fetchAgencyMembers, fetchPendingRequests]);

    // --- Event Handlers ---
    const handleAgencyFormChange = (e) => setAgencyForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewLogoPreview(reader.result);
                setAgencyForm(prev => ({ ...prev, logoBase64: reader.result, logoOriginalname: file.name }));
            };
            reader.readAsDataURL(file);
        }
    };
    const handleClearLogo = () => {
        setNewLogoPreview('');
        setAgencyForm(prev => ({ ...prev, logoBase64: null, logoOriginalname: null }));
    };

    const handleUpdateAgencyInfo = async () => {
        setUpdatingAgency(true);
        try {
            const response = await axiosInstance.put(`/agencies/${user.agency_id}`, agencyForm);
            setAgencyInfo(response.data);
            setEditingAgencyInfo(false);
            showMessage("Agency information updated successfully!", "success");
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to update agency info.', "error");
        } finally {
            setUpdatingAgency(false);
        }
    };

    const handleApproveRequest = (requestId) => {
        showConfirm({
            title: "Approve Join Request",
            message: "Are you sure you want to approve this agent's request?",
            onConfirm: async () => {
                try {
                    await axiosInstance.put(`/agencies/approve-join-request/${requestId}`);
                    showMessage("Agent request approved!", "success");
                    fetchPendingRequests();
                    fetchAgencyMembers();
                } catch (error) {
                    showMessage(error.response?.data?.message || 'Failed to approve request.', "error");
                }
            }
        });
    };

    const handleRejectRequest = (requestId) => {
        showConfirm({
            title: "Reject Join Request",
            message: "Are you sure you want to reject this agent's request?",
            onConfirm: async () => {
                try {
                    await axiosInstance.put(`/agencies/reject-join-request/${requestId}`);
                    showMessage("Agent request rejected.", "info");
                    fetchPendingRequests();
                } catch (error) {
                    showMessage(error.response?.data?.message || 'Failed to reject request.', "error");
                }
            }
        });
    };

    const handleRemoveAgent = (agentId, agentName) => {
        showConfirm({
            title: `Remove ${agentName}?`,
            message: `Are you sure you want to remove ${agentName} from your agency?`,
            onConfirm: async () => {
                try {
                    await axiosInstance.delete(`/agencies/${user.agency_id}/members/${agentId}`);
                    showMessage(`${agentName} removed from agency.`, "success");
                    fetchAgencyMembers();
                } catch (error) {
                    showMessage(error.response?.data?.message || 'Failed to remove agent.', "error");
                }
            },
        });
    };

    const handleDeleteAgency = () => {
        showConfirm({
            title: "Confirm Agency Deletion",
            message: "This action is irreversible and will permanently delete all agency data, disconnect all agents, and revert your role. Are you absolutely sure?",
            onConfirm: () => {
                setTimeout(() => {
                    showConfirm({
                        title: "Final Confirmation",
                        message: (<div><p>Type <span className="font-bold text-red-500">DELETE MY AGENCY</span> to confirm.</p><input type="text" id="deleteConfirmInput" className={`w-full p-2 mt-2 border rounded ${darkMode ? "bg-gray-700 border-gray-600" : ""}`}/></div>),
                        onConfirm: async () => {
                            const confirmInput = document.getElementById('deleteConfirmInput')?.value;
                            if (confirmInput !== "DELETE MY AGENCY") {
                                showMessage("Confirmation text did not match.", "error");
                                return;
                            }
                            try {
                                await axiosInstance.delete(`/agencies/${user.agency_id}/admin-delete`);
                                showMessage("Agency deleted successfully. Please log in again.", "success");
                                logout();
                            } catch (error) {
                                showMessage(error.response?.data?.message || 'Failed to delete agency.', "error");
                            }
                        },
                        confirmLabel: "Delete Permanently",
                        isDangerous: true,
                    });
                }, 100);
            },
            confirmLabel: "Proceed",
            isDangerous: true
        });
    };


    if (isLoading) return <AgencySettingsSkeleton darkMode={darkMode} />;
    if (!user || (user.role !== 'agency_admin' && user.role !== 'admin')) return <p>You do not have permission to view these settings.</p>;
    if (!agencyInfo) return <p>Could not load agency information. You may not be part of an agency.</p>;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* --- Agency Information Section --- */}
            <div className="pb-8 mb-8 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                    <h3 className={`text-2xl font-bold flex items-center ${darkMode ? "text-green-400" : "text-green-700"}`}><Landmark className="mr-3" /> Agency Overview</h3>
                    <div className="flex space-x-2">
                        {editingAgencyInfo ? (<>
                            <button onClick={() => { setEditingAgencyInfo(false); fetchAgencyInfo();}} className={`px-4 py-1.5 rounded-full font-medium text-sm ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>Cancel</button>
                            <button onClick={handleUpdateAgencyInfo} disabled={updatingAgency} className="px-4 py-1.5 font-medium rounded-full flex items-center text-sm bg-green-600 text-white disabled:opacity-50">
                                {updatingAgency ? <Loader size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />} Save
                            </button>
                        </>) : (
                            <button onClick={() => setEditingAgencyInfo(true)} className="px-4 py-1.5 rounded-full font-medium flex items-center text-sm bg-green-600 text-white">
                                <PencilIcon size={16} className="mr-1" /> Edit
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Logo and Info Fields */}
                     {editingAgencyInfo ? (
                        <div className="md:col-span-2 space-y-4">
                            <input type="file" accept="image/*" onChange={handleLogoChange} className={`block w-full text-sm ${darkMode ? 'text-gray-300' : ''}`} />
                            <input name="name" value={agencyForm.name} onChange={handleAgencyFormChange} placeholder="Agency Name" className={inputFieldStyles} />
                            <input name="email" value={agencyForm.email} onChange={handleAgencyFormChange} placeholder="Email" className={inputFieldStyles} />
                            <input name="phone" value={agencyForm.phone} onChange={handleAgencyFormChange} placeholder="Phone" className={inputFieldStyles} />
                            <input name="website" value={agencyForm.website} onChange={handleAgencyFormChange} placeholder="Website" className={inputFieldStyles} />
                            <input name="address" value={agencyForm.address} onChange={handleAgencyFormChange} placeholder="Address" className={inputFieldStyles} />
                            <textarea name="description" value={agencyForm.description} onChange={handleAgencyFormChange} placeholder="Description" className={inputFieldStyles} rows="3"/>
                        </div>
                     ) : (
                        <>
                         <InfoCard icon={<Landmark size={18} />} label="Agency Name" value={agencyInfo.name} />
                         <InfoCard icon={<Mail size={18} />} label="Email" value={agencyInfo.email} />
                         <InfoCard icon={<Phone size={18} />} label="Phone" value={agencyInfo.phone} />
                         <InfoCard icon={<Globe size={18} />} label="Website" value={agencyInfo.website || 'N/A'} />
                         <InfoCard icon={<MapPin size={18} />} label="Address" value={agencyInfo.address || 'N/A'} />
                         <InfoCard icon={<FileText size={18} />} label="Description" value={agencyInfo.description || 'N/A'} />
                        </>
                     )}
                </div>
            </div>

            {/* --- Agency Members Section --- */}
            <div className="pb-6 mb-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className={`text-2xl font-bold mb-5 flex items-center ${darkMode ? "text-green-400" : "text-green-700"}`}><UserRoundCheck className="mr-3" /> Agency Members</h3>
                <div className="space-y-4">
                    {agencyMembers.length > 0 ? agencyMembers.map(member => (
                        <div key={member.user_id} className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                            <div>
                                <p className="font-semibold">{member.full_name} ({member.agency_role})</p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                            {member.user_id !== user.user_id && <button onClick={() => handleRemoveAgent(member.user_id, member.full_name)} className={`px-3 py-1 rounded-full text-sm font-semibold ${darkMode ? "bg-red-600" : "bg-red-100 text-red-600"}`}>Remove</button>}
                        </div>
                    )) : <p className={darkMode ? "text-gray-400" : "text-gray-600"}>No other agents in your agency.</p>}
                </div>
            </div>

            {/* --- Pending Join Requests Section --- */}
            <div className="pb-6 mb-6 border-b border-gray-200 dark:border-gray-700">
                 <h3 className={`text-2xl font-bold mb-5 flex items-center ${darkMode ? "text-green-400" : "text-green-700"}`}><Hourglass className="mr-3" /> Pending Join Requests</h3>
                 <div className="space-y-4">
                    {pendingRequests.length > 0 ? pendingRequests.map(req => (
                        <div key={req.request_id} className={`p-4 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">{req.agent_name}</p>
                                    <p className="text-sm text-gray-500">{req.agent_email}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleApproveRequest(req.request_id)} className="px-4 py-2 rounded-full text-sm font-semibold bg-green-500 text-white">Approve</button>
                                    <button onClick={() => handleRejectRequest(req.request_id)} className="px-4 py-2 rounded-full text-sm font-semibold bg-red-500 text-white">Reject</button>
                                </div>
                            </div>
                        </div>
                    )) : <p className={darkMode ? "text-gray-400" : "text-gray-600"}>No pending join requests.</p>}
                 </div>
            </div>
            
            {/* --- Danger Zone --- */}
            <div>
                <h3 className={`text-2xl font-bold mb-4 flex items-center text-red-500`}><ShieldAlert className="mr-3" /> Danger Zone</h3>
                <div className="p-6 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
                    <p className="mb-4 text-red-700 dark:text-red-300">Permanently delete your agency and all associated data. This action cannot be undone.</p>
                    <button onClick={handleDeleteAgency} className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl flex items-center">
                        <Trash2 size={20} className="mr-2" /> Delete Agency Permanently
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

const InfoCard = ({ icon, label, value }) => {
    const { darkMode } = useTheme();
    return (
        <div className={`flex flex-col p-4 rounded-xl shadow-sm border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <label className={`text-sm font-medium mb-2 flex items-center space-x-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {icon} <span>{label}</span>
            </label>
            <p className={`text-base break-words ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{value}</p>
        </div>
    );
};

export default AgencySettings;