import React from 'react';
import { AnimatePresence } from 'framer-motion';
import ShareModal from '../ShareModal'; // Assuming ShareModal is in the same directory or adjust path
import ClientInquiryModal from '../ClientInquiryModal'; // Assuming ClientInquiryModal is in the same directory or adjust path

const ModalsContainer = ({
  isShareModalOpen,
  setIsShareModalOpen,
  listing,
  agentClients,
  darkMode,
  currentAgentId,
  userRole,
  isClientInquiryModalOpen,
  conversationForClientModal,
  setIsClientInquiryModalOpen,
  setConversationForClientModal,
  setOpenedConversationId,
  handleViewProperty,
  handleDeleteInquiry,
  handleSendMessageToConversation
}) => {
  return (
    <AnimatePresence>
      {isShareModalOpen && listing && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          clients={agentClients}
          listing={listing}
          darkMode={darkMode}
          currentAgentId={currentAgentId}
          userRole={userRole}
        />
      )}
      {isClientInquiryModalOpen && conversationForClientModal && (
        <ClientInquiryModal
          isOpen={isClientInquiryModalOpen}
          onClose={() => {
            setIsClientInquiryModalOpen(false);
            setConversationForClientModal(null);
            setOpenedConversationId(null);
          }}
          conversation={conversationForClientModal}
          darkMode={darkMode}
          onViewProperty={handleViewProperty}
          onDelete={handleDeleteInquiry}
          onSendMessage={handleSendMessageToConversation}
          isGuest={userRole === 'guest'}
        />
      )}
    </AnimatePresence>
  );
};

export default ModalsContainer;
