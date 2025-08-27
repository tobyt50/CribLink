import React from "react";
import {
  UserPlus,
  Hourglass,
  UserRoundCheck,
  CheckCircle,
  UserX,
  EllipsisVertical,
  MessageSquareText,
  Phone,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AgentContactCard = ({
  agentInfo,
  darkMode,
  userRole,
  userId,
  connectionStatus,
  handleSendConnectionRequest,
  handleDisconnectFromAgent,
  handleOpenChat,
  navigate,
  showOptionsMenu,
  setShowOptionsMenu,
  optionsMenuRef,
}) => {
  return (
    <div
      className={`space-y-4 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}
    >
      <h2
        className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}
      >
        Contact Agent
      </h2>

      <div className="flex items-center space-x-4">
        <img
          src={agentInfo.profilePic}
          alt={agentInfo.name}
          className={`w-16 h-16 rounded-full object-cover border-2 shadow-sm ${darkMode ? "border-green-700" : "border-green-300"}`}
        />
        <div className="flex flex-col">
          <p
            className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}
          >
            {agentInfo.name}
            {userRole === "client" &&
              agentInfo.id &&
              userId !== agentInfo.id && (
                <span
                  className="ml-2 inline-block align-middle relative"
                  ref={optionsMenuRef}
                >
                  {(connectionStatus === "none" ||
                    connectionStatus === "rejected") && (
                    <button
                      onClick={handleSendConnectionRequest}
                      className={`p-1.5 rounded-full transition-all duration-200
                        ${darkMode ? "text-purple-400 hover:bg-gray-700" : "text-purple-600 hover:bg-gray-200"}`}
                      title="Send Connection Request"
                    >
                      <UserPlus size={20} />
                    </button>
                  )}
                  {connectionStatus === "pending_sent" && (
                    <button
                      disabled
                      className={`p-1.5 rounded-full cursor-not-allowed ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                      title="Connection Request Sent (Pending)"
                    >
                      <Hourglass size={20} />
                    </button>
                  )}
                  {connectionStatus === "pending_received" && (
                    <button
                      onClick={() => navigate(`/client/dashboard/requests`)}
                      className={`p-1.5 rounded-full transition-all duration-200
                        ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-600 hover:bg-gray-200"}`}
                      title="Respond to Agent Request"
                    >
                      <UserRoundCheck size={20} />
                    </button>
                  )}
                  {connectionStatus === "connected" && (
                    <>
                      <button
                        disabled
                        className={`p-1.5 rounded-full cursor-not-allowed ${darkMode ? "text-green-500" : "text-green-600"}`}
                        title="Already Connected"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOptionsMenu(!showOptionsMenu);
                        }}
                        className={`ml-1 p-1.5 rounded-full transition-all duration-200
                        ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-200"}`}
                        title="More Options"
                      >
                        <EllipsisVertical size={20} />
                      </button>
                      {showOptionsMenu && (
                        <div
                          className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10
                        ${darkMode ? "bg-gray-700 ring-1 ring-gray-600" : "bg-white ring-1 ring-gray-200"}`}
                        >
                          <div
                            className="py-1"
                            role="menu"
                            aria-orientation="vertical"
                          >
                            <button
                              onClick={handleDisconnectFromAgent}
                              className={`flex items-center w-full px-4 py-2 text-sm
                              ${darkMode ? "text-gray-200 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-100"}`}
                              role="menuitem"
                            >
                              <UserX size={16} className="mr-2" /> Disconnect
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </span>
              )}
          </p>
          <p
            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            Property Agent
          </p>
          {agentInfo.agency !== "N/A" && (
            <p
              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              {agentInfo.agency}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        {agentInfo.phone !== "N/A" && userRole !== "guest" && (
          <a
            href={`tel:${agentInfo.phone}`}
            className={`flex flex-col items-center justify-center p-2 rounded-xl font-semibold transition-colors duration-300 shadow-md flex-1 min-w-[90px] max-w-[calc(33%-0.75rem)]
              ${darkMode ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-500 text-white hover:bg-blue-600"}`}
            title="Call Agent"
          >
            <Phone size={20} />
            <span className="text-xs mt-1">Call</span>
          </a>
        )}

        {agentInfo.email !== "N/A" && (
          <a
            href={`mailto:${agentInfo.email}`}
            className={`flex flex-col items-center justify-center p-2 rounded-xl font-semibold transition-colors duration-300 shadow-md flex-1 min-w-[90px] max-w-[calc(33%-0.75rem)]
              ${darkMode ? "bg-green-600 text-white hover:bg-green-500" : "bg-green-500 text-white hover:bg-green-600"}`}
            title="Email Agent"
          >
            <Mail size={20} />
            <span className="text-xs mt-1">Email</span>
          </a>
        )}

        {agentInfo.id && (userRole === "client" || userRole === "guest") && (
          <button
            onClick={handleOpenChat}
            className={`flex flex-col items-center justify-center p-2 rounded-xl font-semibold transition-colors duration-300 shadow-md flex-1 min-w-[90px] max-w-[calc(33%-0.75rem)]
              ${darkMode ? "bg-purple-600 text-white hover:bg-purple-500" : "bg-purple-500 text-white hover:bg-purple-600"}`}
            title="Chat with Agent"
          >
            <MessageSquareText size={20} />
            <span className="text-xs mt-1">Chat</span>
          </button>
        )}
      </div>

      {userRole === "client" && agentInfo.id && userId !== agentInfo.id && (
        <button
          onClick={() => navigate(`/agent-profile/${agentInfo.id}`)}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors duration-300 shadow-md w-full mt-4
            ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-500 text-white hover:bg-gray-600"}`}
        >
          👤 View Agent Profile
        </button>
      )}
    </div>
  );
};

export default AgentContactCard;
