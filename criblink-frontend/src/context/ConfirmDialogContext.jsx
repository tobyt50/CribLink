// src/context/ConfirmDialogContext
import { createContext, useContext, useState } from "react";

const ConfirmDialogContext = createContext();

export const ConfirmDialogProvider = ({ children }) => {
  const [state, setState] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Yes",
    cancelLabel: "Cancel",
    onConfirm: null,
  });

  const showConfirm = ({
    title = "Are you sure?",
    message,
    onConfirm,
    confirmLabel = "Yes",
    cancelLabel = "Cancel",
  }) => {
    setState({ open: true, title, message, confirmLabel, cancelLabel, onConfirm });
  };

  const closeConfirm = () => setState((prev) => ({ ...prev, open: false }));

  const confirm = () => {
    state.onConfirm?.();
    closeConfirm();
  };

  return (
    <ConfirmDialogContext.Provider value={{ showConfirm, closeConfirm, confirm, ...state }}>
      {children}
    </ConfirmDialogContext.Provider>
  );
};

export const useConfirmDialog = () => useContext(ConfirmDialogContext);
