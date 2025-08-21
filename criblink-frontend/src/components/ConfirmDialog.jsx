// src/components/ConfirmDialog.js
import { Dialog } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfirmDialog } from "../context/ConfirmDialogContext";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog() {
  const { open, closeConfirm, confirm, title, message, confirmLabel, cancelLabel } = useConfirmDialog();

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onClose={closeConfirm} className="relative z-50">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel
              as={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl p-6"
            >
              <div className="flex gap-3 mb-4">
                <AlertTriangle className="text-yellow-500 w-6 h-6 mt-1" />
                <div>
                  <Dialog.Title className="font-semibold text-gray-800 dark:text-gray-100 text-lg">
                    {title}
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {message}
                  </Dialog.Description>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={closeConfirm}
                  className="px-4 py-2 text-sm rounded-lg border bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={confirm}
                  className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white"
                >
                  {confirmLabel}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
