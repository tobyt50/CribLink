// src/components/GlobalMessageToasts.js
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, XCircle, Info } from "lucide-react";
import { useMessage } from "../context/MessageContext"; // Restored to original path

const icons = {
  success: <CheckCircle className="text-green-500 w-5 h-5" />,
  error: <XCircle className="text-red-500 w-5 h-5" />,
  info: <Info className="text-blue-500 w-5 h-5" />,
};

export default function GlobalMessageToasts() {
  const { messages, dismissMessage } = useMessage();

  // Ensure messages is an array before attempting to map over it.
  // This handles cases where 'messages' might be undefined or null initially.
  if (!Array.isArray(messages)) {
    console.error("Messages context is not providing an array for 'messages'. Current value:", messages);
    return null; // Or render a fallback UI if desired
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-3 w-full max-w-sm">
      <AnimatePresence>
        {messages.map(({ id, text, type, actions }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex items-start gap-3 p-4 rounded-xl shadow-lg border bg-white dark:bg-gray-900 dark:border-gray-700"
          >
            {icons[type] || icons.info}
            <div className="flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-200">{text}</p>
              {/* Conditionally render actions if they exist and there's at least one */}
              {actions && actions.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        action.onClick?.();
                        dismissMessage(id);
                      }}
                      className="text-xs font-medium px-2 py-1 rounded border bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => dismissMessage(id)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
