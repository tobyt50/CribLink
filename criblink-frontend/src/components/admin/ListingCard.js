import React from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook
import { useMessage } from '../../context/MessageContext'; // Import useMessage hook
import { useConfirmDialog } from '../../context/ConfirmDialogContext'; // Import useConfirmDialog hook

const ListingCard = ({ listing, onAction }) => {
  const { darkMode } = useTheme(); // Use the dark mode context
  const { showMessage } = useMessage(); // Initialize useMessage
  const { showConfirm } = useConfirmDialog(); // Initialize useConfirmDialog

  const performAction = async (action) => {
    try {
      // Assuming onAction handles the API call and state update in the parent component
      // This card component just dispatches the action.
      await onAction(listing.id, action);
      showMessage(`Listing ${listing.title} successfully ${action}d!`, 'success');
    } catch (err) {
      console.error(`Failed to ${action} listing`, err);
      let errorMessage = `Failed to ${action} listing. Please try again.`;
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      showMessage(errorMessage, 'error');
    }
  };

  const handleDeleteConfirmation = () => {
    showConfirm({
      title: "Confirm Deletion",
      message: `Are you sure you want to remove the listing "${listing.title}"? This action cannot be undone.`,
      onConfirm: () => performAction('remove'), // Call performAction if confirmed
      confirmLabel: "Delete",
      cancelLabel: "Cancel"
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl shadow-md p-4 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
    >
      <h3 className={`text-lg font-semibold ${darkMode ? "text-green-400" : "text-gray-800"}`}>{listing.title}</h3>
      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{listing.location}</p>
      <p className={`mt-2 line-clamp-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{listing.description}</p>

      <div className="flex justify-between mt-4">
        <span className={`text-xs px-2 py-1 rounded
          ${listing.status === 'approved' ? 'bg-green-100 text-green-700' :
            listing.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'}
          ${darkMode ?
            (listing.status === 'approved' ? 'dark:bg-green-700 dark:text-green-200' :
            listing.status === 'pending' ? 'dark:bg-yellow-700 dark:text-yellow-200' :
            'dark:bg-red-700 dark:text-red-200') : ''
          }`}
        >
          {listing.status}
        </span>
        <div className="flex gap-2">
          <button onClick={() => performAction('approve')} className={`text-sm hover:underline ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-800"}`}>Approve</button>
          <button onClick={() => performAction('reject')} className={`text-sm hover:underline ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}`}>Reject</button>
          <button onClick={() => performAction('feature')} className={`text-sm hover:underline ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}>Feature</button>
          <button onClick={handleDeleteConfirmation} className={`text-sm hover:underline ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"}`}>Remove</button>
        </div>
      </div>
    </motion.div>
  );
};

export default ListingCard;
