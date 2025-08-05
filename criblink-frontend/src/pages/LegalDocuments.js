// src/pages/LegalDocuments.js
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '../components/admin/Sidebar';
import AgencyAdminSidebar from '../components/agencyadmin/Sidebar'; // Import the new sidebar
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpIcon, ArrowDownIcon, TrashIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import API_BASE_URL from '../config';
import { Menu, X, Search, SlidersHorizontal, Plus, FileText, LayoutGrid, LayoutList, Eye, Trash2 } from 'lucide-react';
import { useTheme } from '../layouts/AppShell';
import { useMessage } from '../context/MessageContext';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import { useSidebarState } from '../hooks/useSidebarState';
import { useAuth } from '../context/AuthContext';
import DocumentCard from '../components/DocumentCard'; // Import the new DocumentCard component

// Reusable Dropdown component
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

        document.addEventListener("click", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("click", handleClickOutside);
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
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
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
                                onClick={(e) => {
                                    e.stopPropagation();
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

// Skeleton for a Document Card (grid view)
const DocumentCardSkeleton = ({ darkMode }) => (
  <div className={`rounded-xl shadow-lg p-4 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
    <div className={`w-full h-24 rounded-lg ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-3`}></div>
    <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-2`}></div>
    <div className={`h-3 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-3`}></div>
    <div className="flex justify-between items-center">
      <div className={`h-8 w-1/3 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
      <div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </div>
  </div>
);

// Skeleton for a Document Table Row (list view)
const DocumentTableRowSkeleton = ({ darkMode, numCols }) => (
  <tr className={`border-t animate-pulse ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
    {[...Array(numCols)].map((_, i) => (
      <td key={i} className="py-2 px-2">
        <div className={`h-4 w-full rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
      </td>
    ))}
  </tr>
);


const LegalDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [filteredDocuments, setFilteredDocuments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState('upload_date');
    const [sortDirection, setSortDirection] = useState('desc');
    const [documentTypeFilter, setDocumentTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalDocuments, setTotalDocuments] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();
    const { darkMode } = useTheme();
    const { showMessage } = useMessage();
    const { showConfirm } = useConfirmDialog();
    const { user } = useAuth();

    // View mode state, initialized from localStorage
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('defaultDocumentsView') || 'list'); // 'list' or 'grid'

    // Use the useSidebarState hook
    const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
    const [activeSection, setActiveSection] = useState('documents');

    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef(null);

    const [showSearchBarFilters, setShowSearchBarFilters] = useState(false);
    const filterAreaRef = useRef(null);

    // Loading state
    const [loading, setLoading] = useState(true);

    // Determine limit based on viewMode and screen size
    const getLimit = useCallback(() => {
        if (viewMode === 'grid') {
            return isMobile ? 20 : 25; // 20 per page for mobile grid, 25 for desktop grid
        }
        return 10; // 10 per page for list view
    }, [viewMode, isMobile]);

    const currentLimit = getLimit(); // Get the current limit

    useEffect(() => {
        // Update localStorage when viewMode changes
        localStorage.setItem('defaultDocumentsView', viewMode);
        // Reset page to 1 when view mode changes, as limits might change
        setPage(1);
    }, [viewMode]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
                setIsExportDropdownOpen(false);
            }
            if (filterAreaRef.current && !filterAreaRef.current.contains(e.target)) {
                setShowSearchBarFilters(false);
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsExportDropdownOpen(false);
                setShowSearchBarFilters(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const fetchDocuments = useCallback(async () => {
        if (!user) return;
        setLoading(true); // Start loading

        const params = new URLSearchParams();

        if (documentTypeFilter && documentTypeFilter.toLowerCase() !== 'all') {
            params.append('document_type', documentTypeFilter);
        }
        if (searchTerm) {
            params.append('search', searchTerm);
        }
        if (statusFilter && statusFilter.toLowerCase() !== 'all' && statusFilter.toLowerCase() !== 'all statuses') {
            params.append('status', statusFilter);
        }

        params.append('page', page);
        params.append('limit', currentLimit); // Use currentLimit here

        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/docs?${params.toString()}`, { headers });
            setDocuments(response.data.documents || []);
            setFilteredDocuments(response.data.documents || []);
            setTotalDocuments(response.data.total || 0);
            setTotalPages(response.data.totalPages || 1);
        } catch (error) {
            let errorMessage = 'Failed to fetch legal documents. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
            setDocuments([]);
            setFilteredDocuments([]);
            setTotalDocuments(0);
            setTotalPages(1);
        } finally {
            setLoading(false); // End loading
        }
    }, [documentTypeFilter, searchTerm, statusFilter, page, currentLimit, showMessage, user]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const filterAndSortDocuments = useCallback(() => {
        let sortedData = [...documents].sort((a, b) => {
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
            } else if (sortKey === 'upload_date' || sortKey === 'completion_date') {
                const dateA = new Date(aValue);
                const dateB = new Date(bValue);
                return sortDirection === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
            }
            return 0;
        });

        setFilteredDocuments(sortedData);
    }, [documents, sortKey, sortDirection]);

    useEffect(() => {
        filterAndSortDocuments();
    }, [documents, sortKey, sortDirection, filterAndSortDocuments]);

    const performDeleteDocument = async (documentId, publicId) => {
        const token = localStorage.getItem('token');

        if (!token) {
            showMessage('Authentication token not found. Please sign in.', 'error');
            return;
        }

        try {
            await axiosInstance.delete(`${API_BASE_URL}/docs/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                data: { publicId: publicId }
            });
            showMessage(`Document ${documentId} deleted successfully!`, 'success');
            fetchDocuments();
        } catch (error) {
            let errorMessage = 'Failed to delete document. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
        }
    };

    const handleDeleteDocument = (documentId, publicId) => {
        showConfirm({
            title: "Delete Legal Document",
            message: "Are you sure you want to permanently delete this legal document? This action cannot be undone.",
            onConfirm: () => performDeleteDocument(documentId, publicId),
            confirmLabel: "Delete",
            cancelLabel: "Cancel"
        });
    };

    const handleExportCsv = async (scope) => {
        const dataToExport = scope === 'current' ? filteredDocuments : documents;

        if (dataToExport.length === 0) {
            showMessage(`No document data found for ${scope} export.`, 'info');
            setIsExportDropdownOpen(false);
            return;
        }

        const headers = [
            'document_id', 'title', 'client_name', 'property_id', 'document_type', 'status', 'upload_date', 'completion_date', 'document_url', 'agent_name', 'agency_name'
        ];

        const csvRows = dataToExport.map(d => [
            d.document_id,
            d.title,
            d.client_name || 'N/A',
            d.property_id || 'N/A',
            d.document_type,
            d.status,
            d.upload_date ? new Date(d.upload_date).toLocaleDateString() : 'N/A',
            d.completion_date ? new Date(d.completion_date).toLocaleDateString() : 'N/A',
            d.document_url || 'N/A',
            d.agent_name || 'N/A',
            d.agency_name || 'N/A'
        ].map(field => `"${String(field).replace(/"/g, '""')}"`));

        const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'legal_documents.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportDropdownOpen(false);
        showMessage('Legal document data exported successfully!', 'success');
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const handleDocumentTypeChange = (value) => {
        setDocumentTypeFilter(value);
        setPage(1);
    };

    const handleStatusChange = (value) => {
        setStatusFilter(value);
        setPage(1);
    };

    const handleSortClick = (key) => {
        const sortableColumns = ['document_id', 'title', 'client_name', 'property_id', 'document_type', 'status', 'upload_date', 'completion_date', 'agent_name', 'agency_name'];
        if (!sortableColumns.includes(key)) return;

        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const renderSortIcon = (key) => {
        const sortableColumns = ['document_id', 'title', 'client_name', 'property_id', 'document_type', 'status', 'upload_date', 'completion_date', 'agent_name', 'agency_name'];
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

    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

    const documentTypeOptions = [
        { value: "all", label: "All Document Types" },
        { value: "Lease Agreement", label: "Lease Agreement" },
        { value: "Sales Deed", label: "Sales Deed" },
        { value: "MOU", label: "Memorandum of Understanding" },
        { value: "Power of Attorney", label: "Power of Attorney" },
        { value: "Title Deed", label: "Title Deed" },
        { value: "Survey Plan", label: "Survey Plan" },
        { value: "Valuation Report", label: "Valuation Report" },
        { value: "Other", label: "Other" },
    ];

    const statusOptions = [
        { value: "all", label: "All Statuses" },
        { value: "Pending", label: "Pending" },
        { value: "Active", label: "Active" },
        { value: "Completed", label: "Completed" },
        { value: "Archived", label: "Archived" },
        { value: "Rejected", label: "Rejected" },
    ];


    return (
        <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
            {isMobile && (
                <motion.button
                    onClick={() => setIsSidebarOpen(prev => !prev)}
                    className={`fixed top-20 left-4 z-50 p-2 rounded-xl shadow-md h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white"}`}
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

            {user && user.role === 'agency_admin' ? (
                <AgencyAdminSidebar
                    collapsed={isMobile ? false : isCollapsed}
                    setCollapsed={isMobile ? () => {} : setIsCollapsed}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    isMobile={isMobile}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />
            ) : (
                <AdminSidebar
                    collapsed={isMobile ? false : isCollapsed}
                    setCollapsed={isMobile ? () => {} : setIsCollapsed}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    isMobile={isMobile}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />
            )}

            <motion.div
                key={isMobile ? 'mobile' : 'desktop'}
                animate={{ marginLeft: contentShift }}
                transition={{ duration: 0.3 }}
                initial={false}
                className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
                style={{ minWidth: `calc(100% - ${contentShift}px)` }}
            >
                <div className="md:hidden flex items-center justify-center mb-4">
                    <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Legal Documents</h1>
                </div>

                <div className="hidden md:block mb-6">
                    <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Legal Documents</h1>
                </div>

                <main className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-4 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
                    >
                        {isMobile && (
                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex items-center justify-between gap-4">
                                    {/* Search Bar with integrated Filter Icon */}
                                    <div className="flex-1 relative" ref={filterAreaRef}>
                                        <input
                                            type="text"
                                            placeholder="Search documents..."
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            className={`w-full px-4 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowSearchBarFilters(prev => !prev); }}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? "text-gray-300 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-200"}`}
                                            title="Filter Documents"
                                        >
                                            <SlidersHorizontal size={20} />
                                        </button>
                                        <AnimatePresence>
                                            {showSearchBarFilters && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className={`absolute left-0 right-0 top-full mt-2 p-4 rounded-xl shadow-lg z-50 space-y-4
                                                        ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}
                                                >
                                                    <div>
                                                        <label htmlFor="document-type-filter-mobile" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                            Document Type
                                                        </label>
                                                        <Dropdown
                                                            placeholder="Select Document Type"
                                                            options={documentTypeOptions}
                                                            value={documentTypeFilter}
                                                            onChange={handleDocumentTypeChange}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="status-filter-mobile" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                            Status
                                                        </label>
                                                        <Dropdown
                                                            placeholder="Select Status"
                                                            options={statusOptions}
                                                            value={statusFilter}
                                                            onChange={handleStatusChange}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <button
                                        className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center flex-shrink-0"
                                        onClick={() => navigate('/documents/add')}
                                        title="Add New Legal Document"
                                    >
                                        <Plus size={20} />
                                    </button>
                                    <div className="relative inline-block text-left flex-shrink-0" ref={exportDropdownRef}>
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
                                                    <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Documents</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* View mode buttons for mobile */}
                                <div className="flex justify-center gap-2 w-full">
                                    <button
                                        className={`flex-1 p-2 rounded-xl h-10 flex items-center justify-center ${viewMode === 'list' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                        onClick={() => setViewMode('list')}
                                        title="List View"
                                    >
                                        <LayoutList className="h-5 w-5 mr-2" /> List View
                                    </button>
                                    <button
                                        className={`flex-1 p-2 rounded-xl h-10 flex items-center justify-center ${viewMode === 'grid' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                        onClick={() => setViewMode('grid')}
                                        title="Grid View"
                                    >
                                        <LayoutGrid className="h-5 w-5 mr-2" /> Grid View
                                    </button>
                                </div>
                            </div>
                        )}

                        {!isMobile && (
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="flex items-center gap-4 w-full">
                                    {/* Search Bar with integrated Filter Icon */}
                                    <div className="w-full relative max-w-[28rem]" ref={filterAreaRef}>
                                        <input
                                            type="text"
                                            placeholder="Search documents by title, client, property ID, agent, or agency..."
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            className={`w-full px-4 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                                darkMode
                                                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                            }`}
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowSearchBarFilters(prev => !prev); }}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? "text-gray-300 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-200"}`}
                                            title="Filter Documents"
                                        >
                                            <SlidersHorizontal size={20} />
                                        </button>
                                        <AnimatePresence>
                                            {showSearchBarFilters && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className={`absolute left-0 right-0 top-full mt-2 p-4 rounded-xl shadow-lg z-50 space-y-4
                                                        ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}
                                                >
                                                    <div>
                                                        <label htmlFor="document-type-filter-desktop" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                            Document Type
                                                        </label>
                                                        <Dropdown
                                                            placeholder="Select Document Type"
                                                            options={documentTypeOptions}
                                                            value={documentTypeFilter}
                                                            onChange={handleDocumentTypeChange}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="status-filter-desktop" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                            Status
                                                        </label>
                                                        <Dropdown
                                                            placeholder="Select Status"
                                                            options={statusOptions}
                                                            value={statusFilter}
                                                            onChange={handleStatusChange}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="flex gap-2 items-center">
                                    <button
                                        className="bg-green-500 text-white flex items-center justify-center px-4 h-10 rounded-xl hover:bg-green-600 text-sm font-medium"
                                        onClick={() => navigate('/documents/add')}
                                    >
                                        +Add Document
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
                                                    <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Documents</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'list' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                        onClick={() => setViewMode('list')}
                                        title="List View"
                                    >
                                        <LayoutList className="h-6 w-6" />
                                    </button>
                                    <button
                                        className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'grid' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                        onClick={() => setViewMode('grid')}
                                        title="Grid View"
                                    >
                                        <LayoutGrid className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            viewMode === 'grid' ? (
                                <motion.div
                                    layout
                                    className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                                >
                                    {[...Array(currentLimit)].map((_, i) => <DocumentCardSkeleton key={i} darkMode={darkMode} />)}
                                </motion.div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className={`w-full mt-4 text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        <thead>
                                            <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                {[
                                                    'document_id', 'title', 'client_name', 'property_id',
                                                    'document_type', 'status', 'upload_date', 'completion_date',
                                                    (user && user.role === 'admin' ? 'agency_name' : null),
                                                    (user && user.role === 'admin' ? 'agent_name' : null),
                                                    'actions'
                                                ].filter(Boolean).map((key) => (
                                                    <th
                                                        key={key}
                                                        className={`py-2 px-2 whitespace-nowrap`}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <span className="truncate">
                                                                {{
                                                                    document_id: 'ID',
                                                                    property_id: 'Property ID',
                                                                    document_type: 'Type',
                                                                    upload_date: 'Upload Date',
                                                                    completion_date: 'Completion Date',
                                                                    agency_name: 'Agency',
                                                                    agent_name: 'Agent',
                                                                    actions: 'Actions'
                                                                }[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                            </span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                                            {[...Array(currentLimit)].map((_, i) => (
                                                <DocumentTableRowSkeleton
                                                    key={i}
                                                    darkMode={darkMode}
                                                    numCols={
                                                        (user && user.role === 'admin') ? 11 : 9 // Adjust numCols based on whether agency/agent names are shown
                                                    }
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        ) : filteredDocuments.length === 0 ? (
                            <div className={`text-center py-8 col-span-full ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                No legal documents found matching your criteria.
                            </div>
                        ) : (
                            viewMode === 'grid' ? (
                                <motion.div
                                    layout
                                    className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                                >
                                    {filteredDocuments.map((doc) => (
                                        <div key={doc.document_id}>
                                            <DocumentCard
                                                document={doc}
                                                onDelete={handleDeleteDocument}
                                            />
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className={`w-full mt-4 text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        <thead>
                                            <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                {[
                                                    'document_id', 'title', 'client_name', 'property_id',
                                                    'document_type', 'status', 'upload_date', 'completion_date',
                                                    (user && user.role === 'admin' ? 'agency_name' : null),
                                                    (user && user.role === 'admin' ? 'agent_name' : null),
                                                    'actions'
                                                ].filter(Boolean).map((key) => (
                                                    <th
                                                        key={key}
                                                        onClick={key !== 'actions' ? () => handleSortClick(key) : undefined}
                                                        className={`py-2 px-2 whitespace-nowrap ${key !== 'actions' ? 'cursor-pointer hover:text-green-700' : ''}`}
                                                        style={{
                                                            width:
                                                                key === 'document_id' ? '90px' :
                                                                key === 'title' ? '150px' :
                                                                key === 'client_name' ? '120px' :
                                                                key === 'property_id' ? '90px' :
                                                                key === 'document_type' ? '120px' :
                                                                key === 'status' ? '80px' :
                                                                key === 'upload_date' ? '120px' :
                                                                key === 'completion_date' ? '120px' :
                                                                key === 'agency_name' ? '120px' :
                                                                key === 'agent_name' ? '120px' :
                                                                key === 'actions' ? '100px' : 'auto'
                                                        }}
                                                        title={
                                                            {
                                                                document_id: 'Document ID',
                                                                title: 'Document Title',
                                                                client_name: 'Client Name',
                                                                property_id: 'Property ID',
                                                                document_type: 'Document Type',
                                                                status: 'Status',
                                                                upload_date: 'Upload Date',
                                                                completion_date: 'Completion Date',
                                                                agency_name: 'Agency Name',
                                                                agent_name: 'Agent Name',
                                                                actions: 'Actions'
                                                            }[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                                        }
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <span className="truncate">
                                                                {{
                                                                    document_id: 'ID',
                                                                    client_name: 'Client Name',
                                                                    property_id: 'Property ID',
                                                                    document_type: 'Type',
                                                                    upload_date: 'Upload Date',
                                                                    completion_date: 'Completion Date',
                                                                    agency_name: 'Agency',
                                                                    agent_name: 'Agent',
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
                                            {filteredDocuments.map((doc) => (
                                                <tr key={doc.document_id} className={`border-t cursor-default max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}>
                                                    <td className="py-1 px-1 sm:py-2 sm:px-2 max-w-[90px] truncate" title={doc.document_id || ''}>{doc.document_id}</td>
                                                    <td className="py-1 px-1 sm:py-2 sm:px-2 max-w-[150px] truncate" title={doc.title || ''}>{doc.title}</td>
                                                    <td className="py-1 px-1 sm:py-2 sm:px-2 max-w-[120px] truncate" title={doc.client_name || ''}>{doc.client_name || 'N/A'}</td>
                                                    <td className="py-1 px-1 sm:py-2 sm:px-2 max-w-[90px] truncate" title={doc.property_id || ''}>{doc.property_id || 'N/A'}</td>
                                                    <td className="py-1 px-1 sm:py-2 sm:px-2 max-w-[120px] truncate" title={doc.document_type || ''}>{doc.document_type}</td>
                                                    <td className={`py-1 px-1 sm:py-2 sm:px-2 max-w-[80px] truncate font-semibold ${
                                                        doc.status && doc.status.toLowerCase() === 'active' ? 'text-green-600' :
                                                        doc.status && doc.status.toLowerCase() === 'completed' ? 'text-blue-600' :
                                                        doc.status && doc.status.toLowerCase() === 'pending' ? 'text-yellow-600' :
                                                        doc.status && doc.status.toLowerCase() === 'rejected' ? 'text-red-600' :
                                                        'text-gray-600'
                                                    }`} title={capitalizeFirstLetter(doc.status)}>{capitalizeFirstLetter(doc.status)}</td>
                                                    <td className="py-1 px-1 sm:py-2 sm:px-2 max-w-[120px] truncate" title={doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : ''}>{doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'N/A'}</td>
                                                    <td className="py-1 px-1 sm:py-2 sm:px-2 max-w-[120px] truncate" title={doc.completion_date ? new Date(doc.completion_date).toLocaleDateString() : ''}>{doc.completion_date ? new Date(doc.completion_date).toLocaleDateString() : 'N/A'}</td>
                                                    {user && user.role === 'admin' && (
                                                        <td className="py-1 px-1 sm:py-2 sm:px-2 max-w-[120px] truncate" title={doc.agency_name || ''}>{doc.agency_name || 'N/A'}</td>
                                                    )}
                                                    {user && user.role === 'admin' && (
                                                        <td className="py-1 px-1 sm:py-2 sm:px-2 max-w-[120px] truncate" title={doc.agent_name || ''}>{doc.agent_name || 'N/A'}</td>
                                                    )}
                                                    <td className="py-1 px-1 sm:py-2 sm:px-2 flex items-center space-x-1 sm:space-x-2 max-w-[100px]">
                                                        {doc.document_url && (
                                                            <a
                                                                href={`${doc.document_url}?fl_attachment=${encodeURIComponent(doc.title || 'document')}`}
                                                                download
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 p-1"
                                                                title="View Document"
                                                            >
                                                                <Eye size={20} />
                                                            </a>
                                                        )}
                                                        <button
                                                            className="text-red-600 hover:text-red-800 p-1"
                                                            onClick={() => handleDeleteDocument(doc.document_id, doc.public_id)}
                                                            title="Delete Document"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
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
                            )
                        )}
                    </motion.div>
                </main>
            </motion.div>
        </div>
    );
};

export default LegalDocuments;
