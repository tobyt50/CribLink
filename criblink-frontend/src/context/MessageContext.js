// src/context/MessageContext.js
import { createContext, useContext, useState, useCallback, useRef } from "react";

const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  // Use a ref for a persistent counter to ensure unique IDs
  const messageIdCounter = useRef(0);

  // showMessage now adds a new message object to the messages array
  const showMessage = useCallback((text, type = "info", duration = 5000, actions = []) => {
    // Generate a unique ID for each message by combining timestamp and a counter
    const id = `${Date.now()}-${messageIdCounter.current++}`;
    const newMessage = { id, text, type, actions };

    setMessages(prevMessages => [...prevMessages, newMessage]);

    // This function will be created here to be used in the timeout
    const dismiss = (messageId) => {
        setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    // Automatically dismiss the message after a duration, if provided
    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }, []); // No dependencies needed as everything is self-contained

  // dismissMessage removes a message by its ID from the messages array
  const dismissMessage = useCallback((id) => {
    setMessages(prevMessages => prevMessages.filter(message => message.id !== id));
  }, []);

  // The context value now exposes the 'messages' array and 'dismissMessage' function
  return (
    <MessageContext.Provider value={{ messages, showMessage, dismissMessage }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => useContext(MessageContext);
