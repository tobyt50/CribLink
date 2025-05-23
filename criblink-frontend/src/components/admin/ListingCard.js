import React from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const ListingCard = ({ listing, onAction }) => {
  const handleAction = async (action) => {
    try {
      await axios.post(`/admin/listings/${listing.id}/${action}`);
      onAction();
    } catch (err) {
      console.error(`Failed to ${action} listing`, err);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
    >
      <h3 className="text-lg font-semibold">{listing.title}</h3>
      <p className="text-sm text-gray-500">{listing.location}</p>
      <p className="mt-2 text-gray-700 line-clamp-3">{listing.description}</p>

      <div className="flex justify-between mt-4">
        <span className={`text-xs px-2 py-1 rounded bg-${listing.status === 'approved' ? 'green' : listing.status === 'pending' ? 'yellow' : 'red'}-100 text-${listing.status === 'approved' ? 'green' : listing.status === 'pending' ? 'yellow' : 'red'}-700`}>
          {listing.status}
        </span>
        <div className="flex gap-2">
          <button onClick={() => handleAction('approve')} className="text-green-600 hover:underline text-sm">Approve</button>
          <button onClick={() => handleAction('reject')} className="text-red-600 hover:underline text-sm">Reject</button>
          <button onClick={() => handleAction('feature')} className="text-blue-600 hover:underline text-sm">Feature</button>
          <button onClick={() => handleAction('remove')} className="text-gray-600 hover:underline text-sm">Remove</button>
        </div>
      </div>
    </motion.div>
  );
};

export default ListingCard;
