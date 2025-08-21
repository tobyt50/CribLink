import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../layouts/AppShell';
import { FileText, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import { useMessage } from '../context/MessageContext';

const DocumentCard = ({ document, onDelete }) => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { showConfirm } = useConfirmDialog();
  const { showMessage } = useMessage();
  const cardRef = useRef(null);

  const handleViewDocument = () => {
    if (document.document_url) {
      window.open(
        `${document.document_url}?fl_attachment=${encodeURIComponent(document.title || 'document')}`,
        '_blank'
      );
    } else {
      showMessage('Document URL not available.', 'info');
    }
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 400 }}
      className={`w-full max-w-md mx-auto flex flex-col overflow-hidden rounded-2xl border shadow-md hover:shadow-xl cursor-pointer p-4 ${
        darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-green-200 text-gray-800'
      }`}
    >
      {/* Document Icon always visible */}
      <div className="flex items-center justify-between mb-2">
        <h3
          className={`text-base font-semibold truncate ${
            darkMode ? 'text-green-300' : 'text-green-700'
          }`}
          title={document.title}
        >
          {document.title}
        </h3>
        <FileText size={32} className={`${darkMode ? 'text-green-400' : 'text-green-600'}`} />
      </div>

      <p className="text-xs mb-1">
        <span className="font-medium">Type:</span> {document.document_type || 'N/A'}
      </p>
      <p className="text-xs mb-1">
        <span className="font-medium">Client:</span> {document.client_name || 'N/A'}
      </p>
      <p className="text-xs mb-1">
        <span className="font-medium">Property ID:</span> {document.property_id || 'N/A'}
      </p>
      <p className="text-xs mb-1">
        <span className="font-medium">Upload Date:</span>{' '}
        {document.upload_date ? new Date(document.upload_date).toLocaleDateString() : 'N/A'}
      </p>
      <p className="text-xs mb-1">
        <span className="font-medium">Completion Date:</span>{' '}
        {document.completion_date ? new Date(document.completion_date).toLocaleDateString() : 'N/A'}
      </p>

      {document.agent_name && (
        <p className="text-xs mb-1">
          <span className="font-medium">Agent:</span> {document.agent_name}
        </p>
      )}

      {document.agency_name && (
        <p className="text-xs mb-1">
          <span className="font-medium">Agency:</span> {document.agency_name}
        </p>
      )}

      <div className="text-xs font-semibold mt-2">
        {capitalizeFirstLetter(document.status)}
      </div>

      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={handleViewDocument}
          className={`p-2 rounded-full ${
            darkMode
              ? 'bg-gray-700 text-green-400 hover:bg-gray-600'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
          title="View Document"
        >
          <Eye size={20} />
        </button>
        <button
          onClick={() => onDelete(document.document_id, document.public_id)}
          className={`p-2 rounded-full ${
            darkMode
              ? 'bg-gray-700 text-red-400 hover:bg-gray-600'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
          title="Delete Document"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </motion.div>
  );
};

export default DocumentCard;
