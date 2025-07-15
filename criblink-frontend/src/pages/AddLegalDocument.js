// src/pages/AddLegalDocument.js
import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import { useTheme } from '../layouts/AppShell';
import { ChevronDown } from 'lucide-react';
import { useMessage } from '../context/MessageContext';

// Reusable Dropdown component (copied from AddListing.js for self-containment)
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
      // FIX: Changed 'handleClick' to 'handleClickOutside' in cleanup
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
        className={`flex items-center justify-between w-full py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200
          ${darkMode
            ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400"
            : "bg-white border-gray-300 text-gray-700 hover:border-green-500 focus:ring-green-600"
          }`}
      >
        <span>{selectedOptionLabel}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-500"}`} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute left-0 right-0 mt-2 border rounded-xl shadow-xl py-1 z-50 transform origin-top max-h-60 overflow-y-auto
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


const AddLegalDocument = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();

  // State variables for legal document fields
  const [documentTitle, setDocumentTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [propertyId, setPropertyId] = useState(''); // This should ideally be a dropdown/search for existing properties
  const [documentType, setDocumentType] = useState('');
  const [status, setStatus] = useState('Pending'); // Default status
  const [completionDate, setCompletionDate] = useState('');
  const [documentFile, setDocumentFile] = useState(null); // For the actual file object

  // Options for dropdowns
  const documentTypeOptions = [
    { value: "", label: "Select Document Type" },
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
    { value: "Pending", label: "Pending" },
    { value: "Active", label: "Active" },
    { value: "Completed", label: "Completed" },
    { value: "Archived", label: "Archived" },
    { value: "Rejected", label: "Rejected" },
  ];

  // Dropzone configuration for legal documents (PDF, DOCX)
  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setDocumentFile(acceptedFiles[0]);
      showMessage(`File selected: ${acceptedFiles[0].name}`, 'info');
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false, // Only allow one document at a time
  });

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleClose = () => {
    navigate(-1); // Go back to the previous page
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!documentTitle || !documentType || !documentFile || !status) {
      showMessage('Please fill in all required fields and upload a document.', 'error');
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(documentFile);
    reader.onloadend = async () => {
      const fileBase64 = reader.result; // data:application/pdf;base64,...
      const fileName = documentFile.name;

      const payload = {
        title: documentTitle,
        client_name: clientName, // This should match the backend schema field name
        property_id: propertyId || null, // Can be null if not associated with a specific property
        document_type: documentType,
        status: status,
        completion_date: completionDate || null, // Can be null
        fileBase64: fileBase64,
        fileName: fileName,
      };

      const token = localStorage.getItem('token');
      if (!token) {
        showMessage('Authentication token not found. Please sign in.', 'error');
        navigate('/signin');
        return;
      }

      try {
        // Use the /docs/upload endpoint as defined in documentRoutes.js
        await axiosInstance.post(`${API_BASE_URL}/docs/upload`, payload, {
          headers: {
            'Content-Type': 'application/json', // Sending JSON with base64
            'Authorization': `Bearer ${token}`
          }
        });

        showMessage('Legal document added successfully!', 'success', 3000);
        // Clear form fields after successful submission
        setDocumentTitle('');
        setClientName('');
        setPropertyId('');
        setDocumentType('');
        setStatus('Pending');
        setCompletionDate('');
        setDocumentFile(null);

        // Redirect back to the LegalDocuments page after successful upload
        navigate(-1); // This will take the user back to the previous page, which should be LegalDocuments
      } catch (error) {
        let errorMessage = 'Failed to add legal document. Please try again.';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        showMessage(errorMessage, 'error');
      }
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      showMessage("Failed to read file. Please try again.", "error");
    };
  };

  // Styles for form elements, consistent with Home.js and AddListing.js
  const formElementStyles = `py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200
    ${darkMode
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
    }`;

  return (
    <div className={`flex items-center justify-center min-h-screen p-4 md:p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"} overflow-x-hidden`}>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`rounded-2xl shadow-2xl w-full max-w-2xl p-8 space-y-6 relative ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white text-2xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>

        <motion.h2
          className={`text-2xl font-bold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          Add Legal Document
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Document Title */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Document Title</label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(capitalizeFirstLetter(e.target.value))}
              className={`block w-full ${formElementStyles}`}
              required
            />
          </div>

          {/* Document Type */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Document Type</label>
            <Dropdown
              placeholder="Select Document Type"
              options={documentTypeOptions}
              value={documentType}
              onChange={setDocumentType}
              className="w-full"
            />
          </div>

          {/* Client Name (Optional, as per schema) */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Client Name (Optional)</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(capitalizeFirstLetter(e.target.value))}
              className={`block w-full ${formElementStyles}`}
              placeholder="e.g., John Doe"
            />
          </div>

          {/* Property ID (Optional, can be a number or null) */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Associated Property ID (Optional)</label>
            <input
              type="number"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className={`block w-full ${formElementStyles}`}
              placeholder="e.g., 123 (if linked to a property)"
            />
          </div>

          {/* Status */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Status</label>
            <Dropdown
              placeholder="Select Status"
              options={statusOptions}
              value={status}
              onChange={setStatus}
              className="w-full"
            />
          </div>

          {/* Completion Date (Optional) */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Completion Date (Optional)</label>
            <input
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              className={`block w-full ${formElementStyles}`}
            />
          </div>

          {/* File Dropzone */}
          <div {...getRootProps()} className={`p-6 border-dashed border-2 rounded-2xl cursor-pointer text-center transition-all duration-200 ${
            darkMode
              ? "border-gray-600 bg-gray-700 text-gray-300 hover:border-green-500 focus:ring-green-400"
              : "border-gray-300 bg-gray-50 text-gray-600 hover:border-green-500 focus:ring-green-600"
          }`}>
            <input {...getInputProps()} />
            {documentFile ? (
              <p className="font-medium text-lg">{documentFile.name}</p>
            ) : (
              <p>Drag 'n' drop a legal document (PDF, DOC, DOCX) here, or click to select file</p>
            )}
            {documentFile && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDocumentFile(null); showMessage('File removed.', 'info'); }}
                className="mt-2 text-red-600 bg-transparent hover:underline"
              >
                Remove File
              </button>
            )}
          </div>

          <button type="submit" className="w-full bg-green-700 text-white py-3 px-6 rounded-2xl hover:bg-green-800 text-sm transition-all duration-200">
            Upload Document
          </button>
        </motion.div>
      </motion.form>
    </div>
  );
};

export default AddLegalDocument;
