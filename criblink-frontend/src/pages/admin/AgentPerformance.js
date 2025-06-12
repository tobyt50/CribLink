import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '../../components/admin/Sidebar';
import axiosInstance from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import {
    ArrowUpIcon, ArrowDownIcon, TrashIcon, PencilIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import API_BASE_URL from '../../config';
import { Menu, X, Search, SlidersHorizontal, Plus, FileText } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useSidebarState } from '../../hooks/useSidebarState'; // Import the hook

// Reusable Dropdown component from Listings.js
const Dropdown = ({ options, value, onChange, placeholder, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { darkMode } = useTheme();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const menuVariants = {
        hidden: { opacity: 0, y: -10, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 500,
                damping: 30,
                delayChildren: 0.05,
                staggerChildren: 0.02,
            },
        },
        exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15, ease: "easeOut" } },
    };

    const itemVariants = {
        hidden: { y: 10, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    const selectedOptionLabel = options.find(option => option.value === value)?.label || placeholder;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 h-10
                  ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400" : "bg-white border-gray-300 text-gray-500 hover:border-green-500 focus:ring-green-600"}`}
            >
                <span className="overflow-hidden truncate">{selectedOptionLabel}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDownIcon className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-500"}`} />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={menuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={`absolute left-0 right-0 mt-2 border rounded-xl shadow-xl py-1 z-50 overflow-hidden transform origin-top
                          ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                    >
                        {options.map((option) => (
                            <motion.button
                                key={option.value}
                                variants={itemVariants}
                                whileHover={{ x: 5 }}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors duration-200
                                  ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-green-50 hover:text-green-700"}`}
                            >
                                {option.label}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


const AgentPerformance = () => {
    const [performanceData, setPerformanceData] = useState([]);
    const [filteredPerformance, setFilteredPerformance] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState('full_name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [page, setPage] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;
    const navigate = useNavigate();
    const { darkMode } = useTheme();
    const { showMessage } = useMessage();
    const { showConfirm } = useConfirmDialog();

    // Use the useSidebarState hook
    const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
    const [activeSection, setActiveSection] = useState('agent-performance');

    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef(null);

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isDesktopFilterModalOpen, setIsDesktopFilterModalOpen] = useState(false);

    // No longer need this useEffect as useSidebarState handles it
    // useEffect(() => {
    //     const handleResize = () => {
    //         const mobile = window.innerWidth < 768;
    //         setIsMobile(mobile);
    //         setIsSidebarOpen(!mobile);
    //     };

    //     window.addEventListener('resize', handleResize);
    //     return () => window.removeEventListener('resize', handleResize);
    // }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
                setIsExportDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchAgentPerformance = useCallback(async () => {
        const params = new URLSearchParams();
        if (searchTerm) {
            params.append('search', searchTerm);
        }
        params.append('page', page);
        params.append('limit', limit);

        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/admin/agent/performance?${params.toString()}`, { headers });

            setPerformanceData(response.data.performance || []);
            setFilteredPerformance(response.data.performance || []);
            setTotalEntries(response.data.total || 0);
            setTotalPages(response.data.totalPages || 1);
        } catch (error) {
            let errorMessage = 'Failed to fetch agent performance data. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
            setPerformanceData([]);
            setFilteredPerformance([]);
            setTotalEntries(0);
            setTotalPages(1);
        }
    }, [searchTerm, page, limit, showMessage]);

    useEffect(() => {
        fetchAgentPerformance();
    }, [fetchAgentPerformance]);

    const filterAndSortPerformance = useCallback(() => {
        let sortedData = [...performanceData].sort((a, b) => {
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
            } else {
                if (aValue < bValue) {
                    return sortDirection === 'asc' ? -1 : 1;
                } else if (aValue > bValue) {
                    return sortDirection === 'asc' ? 1 : -1;
                }
                return 0;
            }
        });

        setFilteredPerformance(sortedData);
    }, [performanceData, sortKey, sortDirection]);

    useEffect(() => {
        filterAndSortPerformance();
    }, [performanceData, sortKey, sortDirection, filterAndSortPerformance]);

    const performDeletePerformance = async (userId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Authentication token not found. Please sign in.', 'error');
            return;
        }

        try {
            await axiosInstance.delete(`${API_BASE_URL}/admin/agent/performance/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            showMessage('Agent performance entry deleted successfully!', 'success');
            fetchAgentPerformance();
        } catch (error) {
            let errorMessage = 'Failed to delete agent performance entry. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
        }
    };

    const handleDeletePerformance = (userId) => {
        showConfirm({
            title: "Delete Agent Performance Entry",
            message: `Are you sure you want to delete the performance entry for user ID ${userId}? This action cannot be undone.`,
            onConfirm: () => performDeletePerformance(userId),
            confirmLabel: "Delete",
            cancelLabel: "Cancel"
        });
    };

    const handleExportCsv = async (scope) => {
        const dataToExport = scope === 'current' ? filteredPerformance : performanceData;

        if (dataToExport.length === 0) {
            showMessage(`No agent performance data found for ${scope} export.`, 'info');
            setIsExportDropdownOpen(false);
            return;
        }

        const headers = [
            'user_id', 'full_name', 'deals_closed', 'revenue', 'avg_rating',
            'properties_assigned', 'client_feedback', 'region', 'commission_earned'
        ];

        try {
            const csvRows = dataToExport.map(p => [
                p.user_id,
                p.full_name,
                p.deals_closed,
                p.revenue,
                p.avg_rating,
                p.properties_assigned,
                p.client_feedback ? `"${String(p.client_feedback).replace(/"/g, '""')}"` : 'N/A',
                p.region,
                p.commission_earned
            ].map(field => `"${String(field).replace(/"/g, '""')}"`));

            const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'agent_performance.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsExportDropdownOpen(false);
            showMessage('Agent performance data exported successfully!', 'success');
        } catch (error) {
            let errorMessage = 'Failed to export agent performance data to CSV. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const handleSortClick = (key) => {
        const sortableColumns = [
            'user_id', 'full_name', 'deals_closed', 'revenue', 'avg_rating',
            'properties_assigned', 'region', 'commission_earned'
        ];
        if (!sortableColumns.includes(key)) return;

        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const renderSortIcon = (key) => {
        const sortableColumns = [
            'user_id', 'full_name', 'deals_closed', 'revenue', 'avg_rating',
            'properties_assigned', 'region', 'commission_earned'
        ];
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

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value);
    };

    const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

    return (
        <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
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

            <AdminSidebar
                collapsed={isMobile ? false : isCollapsed}
                setCollapsed={isMobile ? () => {} : setIsCollapsed}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                isMobile={isMobile}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            <motion.div
                key={isMobile ? 'mobile' : 'desktop'}
                animate={{ marginLeft: contentShift }}
                transition={{ duration: 0.3 }}
                initial={false}
                className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
                style={{ minWidth: `calc(100% - ${contentShift}px)` }}
            >
                <div className="md:hidden flex items-center justify-center mb-4">
                    <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Agent Performance</h1>
                </div>

                <div className="hidden md:block mb-6">
                    <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Agent Performance</h1>
                </div>

                <main className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        // Conditionally apply classes based on mobile view
                        className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-4 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
                    >
                        {isMobile && (
                            <div className="flex justify-between items-center mb-4">
                                <button
                                    className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                                    onClick={() => navigate('/admin/agent/performance/add')}
                                    title="Add New Performance Entry"
                                >
                                    <Plus size={20} />
                                </button>
                                <button
                                    className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                                    onClick={() => setIsFilterModalOpen(true)}
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
                                                <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Data</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {!isMobile && (
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="flex items-center gap-4 w-full">
                                    <input
                                        type="text"
                                        placeholder="Search by name or region..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className={`w-full md:w-1/2 py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                          darkMode
                                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                        }`}
                                    />
                                </div>

                                <div className="flex gap-2 items-center">
                                    <button
                                        className="bg-green-500 text-white flex items-center justify-center px-4 h-10 rounded-xl hover:bg-green-600 text-sm font-medium"
                                        onClick={() => navigate('/admin/agent/performance/add')}
                                    >
                                        +Add Entry
                                    </button>

                                    <div className="relative inline-block text-left" ref={exportDropdownRef}>
                                        <button
                                            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                                            className="inline-flex justify-center items-center gap-x-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 h-10"
                                        >
                                            Export to CSV <ChevronDownIcon className="-mr-1 h-5 w-5 text-white" />
                                        </button>
                                        {isExportDropdownOpen && (
                                            <div className={`absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-white text-gray-900"}`}>
                                                <div className="py-1">
                                                    <button onClick={() => handleExportCsv('current')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>Current View</button>
                                                    <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Data</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {filteredPerformance.length === 0 ? (
                            <div className={`text-center py-8 col-span-full ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                No agent performance data found.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className={`w-full mt-4 text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                    <thead>
                                        <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            {[
                                                'user_id', 'full_name', 'deals_closed', 'revenue', 'avg_rating',
                                                'properties_assigned', 'region', 'commission_earned', 'actions'
                                            ].map((key) => (
                                                <th
                                                    key={key}
                                                    onClick={key !== 'actions' ? () => handleSortClick(key) : undefined}
                                                    className={`py-2 px-2 whitespace-nowrap ${key !== 'actions' ? 'cursor-pointer hover:text-green-700' : ''}`}
                                                    style={{
                                                        width:
                                                            key === 'user_id' ? '80px' :
                                                            key === 'full_name' ? '120px' :
                                                            key === 'deals_closed' ? '100px' :
                                                            key === 'revenue' ? '120px' :
                                                            key === 'avg_rating' ? '90px' :
                                                            key === 'properties_assigned' ? '120px' :
                                                            key === 'region' ? '90px' :
                                                            key === 'commission_earned' ? '120px' :
                                                            key === 'actions' ? '120px' : 'auto'
                                                    }}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        <span className="truncate">
                                                            {{
                                                                user_id: 'ID',
                                                                full_name: 'Agent Name',
                                                                deals_closed: 'Deals',
                                                                avg_rating: 'Rating',
                                                                properties_assigned: 'Properties',
                                                                commission_earned: 'Commission',
                                                                actions: 'Actions'
                                                            }[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </span>
                                                        {renderSortIcon(key)}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                                        {filteredPerformance.map((entry) => (
                                            <tr key={entry.user_id} className={`border-t cursor-default max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}>
                                                <td className="py-2 px-2 max-w-[80px] truncate">{entry.user_id}</td>
                                                <td className="py-2 px-2 max-w-[120px] truncate" title={entry.full_name && entry.full_name.length > 15 ? entry.full_name : ''}>{entry.full_name}</td>
                                                <td className="py-2 px-2 max-w-[100px] truncate">{entry.deals_closed}</td>
                                                <td className="py-2 px-2 max-w-[120px] truncate" title={entry.revenue ? formatCurrency(entry.revenue) : ''}>
                                                    {formatCurrency(entry.revenue)}
                                                </td>
                                                <td className="py-2 px-2 max-w-[90px] truncate">{entry.avg_rating}</td>
                                                <td className="py-2 px-2 max-w-[120px] truncate">{entry.properties_assigned}</td>
                                                <td className="py-2 px-2 max-w-[90px] truncate" title={entry.region && entry.region.length > 10 ? entry.region : ''}>{entry.region}</td>
                                                <td className="py-2 px-2 max-w-[120px] truncate" title={entry.commission_earned ? formatCurrency(entry.commission_earned) : ''}>
                                                    {formatCurrency(entry.commission_earned)}
                                                </td>
                                                <td className="py-2 px-2 space-x-2 max-w-[120px]">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            className="bg-green-500 text-white px-3 py-1 rounded-xl hover:bg-green-600 text-xs"
                                                            onClick={() => navigate(`/admin/agent/performance/edit/${entry.user_id}`)}
                                                            title="Edit Entry"
                                                        >
                                                            <PencilIcon className="h-4 w-4 inline" />
                                                            <span className="ml-1">Edit</span>
                                                        </button>
                                                        <button
                                                            className="text-red-600 hover:text-red-800 p-1"
                                                            onClick={() => handleDeletePerformance(entry.user_id)}
                                                            title="Delete Entry"
                                                        >
                                                            <TrashIcon className="h-6 w-6" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="flex justify-center items-center space-x-4 mt-4">
                                    <button
                                        disabled={page === 1}
                                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                        className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
                                    >
                                        Prev
                                    </button>
                                    <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Page {page} of {totalPages}</span>
                                    <button
                                        disabled={page === totalPages || totalPages === 0}
                                        onClick={() => setPage(prev => prev + 1)}
                                        className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </main>
            </motion.div>

            {/* Mobile Filter Modal (if needed in the future for more filters) */}
            <AnimatePresence>
                {isMobile && isFilterModalOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={`fixed inset-x-0 top-14 bottom-0 z-50 p-6 flex flex-col overflow-y-auto ${darkMode ? "bg-gray-900" : "bg-white"}`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Filters</h2>
                            <button onClick={() => setIsFilterModalOpen(false)} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-200"}`}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 flex-grow">
                            <div className="relative">
                                <Search size={20} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                                <input
                                    type="text"
                                    placeholder="Search by name or region..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                      darkMode
                                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                    }`}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setIsFilterModalOpen(false)}
                            className="w-full mt-6 py-3 bg-green-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-green-700 transition-colors"
                        >
                            Apply Filters
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Filter Modal (if needed in the future for more filters) */}
            <AnimatePresence>
                {!isMobile && isDesktopFilterModalOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`rounded-3xl p-6 shadow-xl w-full max-w-md mx-auto ${darkMode ? "bg-gray-800" : "bg-white"}`}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className={`text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Filters</h2>
                                <button onClick={() => setIsDesktopFilterModalOpen(false)} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-200"}`}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                            </div>

                            <button
                                onClick={() => setIsDesktopFilterModalOpen(false)}
                                className="w-full mt-6 py-3 bg-green-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-green-700 transition-colors"
                            >
                                Apply Filters
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AgentPerformance;
