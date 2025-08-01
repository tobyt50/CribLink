import React from 'react';
import { Share2 } from 'lucide-react';

const MoreActions = ({ setIsShareModalOpen, darkMode }) => {
  return (
    <div className={`space-y-4 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}>
      <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>More Actions</h2>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
            onClick={() => setIsShareModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-300 transition-colors duration-300 shadow-sm ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-800"}`}
        >
            <Share2 size={20} /> Share / Recommend
        </button>
      </div>
    </div>
  );
};

export default MoreActions;
