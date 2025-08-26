import { motion } from "framer-motion";
import {
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  Hash,
  Hourglass,
  Link,
  Loader,
  Mail,
  MapPin,
  PencilIcon,
  Phone,
  Save,
  Search,
  User,
  UserCheck,
  UserPlus,
  UserX,
  X
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";
import { useAuth } from "../../../context/AuthContext";
import { useConfirmDialog } from "../../../context/ConfirmDialogContext";
import { useMessage } from "../../../context/MessageContext";
import { useTheme } from "../../../layouts/AppShell";

// --- Skeleton for General section ---
const GeneralSectionSkeleton = ({ darkMode }) => (
  <div className="space-y-8 animate-pulse">
    <div
      className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
    >
      <div
        className={`h-6 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}
      ></div>
      <div className="flex flex-col md:flex-row md:space-x-8">
        <div className="md:w-1/2 mb-6 md:mb-0">
          <div className="flex flex-col items-center space-y-4 mt-2">
            <div
              className={`w-32 h-32 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
            ></div>
            <div
              className={`h-8 w-full rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
            ></div>
          </div>
        </div>
        <div className="md:w-1/2">
          <div
            className={`h-32 w-full rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
          ></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <div
              className={`h-10 w-full rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
            ></div>
          </div>
        ))}
      </div>
    </div>
    <div
      className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
    >
      <div
        className={`h-6 w-1/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}
      ></div>
      <div
        className={`h-24 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
      ></div>
    </div>
    <div
      className={`pb-6 mb-6 ${darkMode ? "border-gray-700" : "border-gray-200"}`}
    >
      <div
        className={`h-6 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}
      ></div>
      <div
        className={`h-24 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
      ></div>
    </div>
  </div>
);

// New component for displaying overview data with better styling
const OverviewDisplayCard = ({ icon, label, value, darkMode }) => (
  <div
    className={`flex items-center md:items-start p-4 rounded-xl transition 
      ${darkMode ? "bg-gray-800" : "bg-gray-50"} 
      shadow-sm hover:shadow-md`}
  >
    <div
      className={`flex-shrink-0 mr-4 p-2 rounded-full 
        ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
    >
      {icon}
    </div>
    <div className="flex flex-col">
      <p
        className={`text-xs md:text-sm font-medium tracking-wide 
          ${darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        {label}
      </p>
      <p
        className={`text-sm md:text-base font-semibold break-words 
          ${darkMode ? "text-gray-200" : "text-gray-800"}`}
      >
        {value || "—"}
      </p>
    </div>
  </div>
);



function General() {
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    phone: "",
    location: "",
    bio: "",
    social_links: [{ platform: "", url: "" }],
  });
  const [userInfo, setUserInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePictureData, setProfilePictureData] = useState({
    base64: null,
    name: null,
  });
  const [profilePicturePreview, setProfilePicturePreview] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);


  const [agencies, setAgencies] = useState([]);
  const [filteredAgencies, setFilteredAgencies] = useState([]);
  const [agencySearchTerm, setAgencySearchTerm] = useState("");
  const [agentMemberships, setAgentMemberships] = useState([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);

  const [showRegisterAgencyForm, setShowRegisterAgencyForm] = useState(false);
  const [newAgencyForm, setNewAgencyForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    logoBase64: null,
    logoOriginalname: null,
  });
  const [registeringAgency, setRegisteringAgency] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const [revertingRole, setRevertingRole] = useState(false);

  const inputFieldStyles = `mt-1 block w-full py-2.5 px-4 border rounded-xl shadow-sm disabled:cursor-not-allowed ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 disabled:bg-gray-800" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 disabled:bg-gray-100"}`;
  const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;

  const fetchProfile = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        const response = await axiosInstance.get("/users/profile");
        const data = response.data;
        setUserInfo(data);
        setForm({
          full_name: data.full_name || "",
          username: data.username || "",
          phone: data.phone || "",
          location: data.location || "",
          bio: data.bio || "",
          social_links:
            data.social_links && data.social_links.length > 0
              ? data.social_links
              : [{ platform: "", url: "" }],
        });
        setProfilePicturePreview(data.profile_picture_url || "");
      } catch (error) {
        showMessage("Failed to load profile data.", "error");
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [showMessage],
  );

  const fetchAgencies = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/agencies");
      setAgencies(response.data);
      setFilteredAgencies(response.data);
    } catch (error) {
      showMessage("Failed to load agencies.", "error");
    }
  }, [showMessage]);

  const fetchAgentMemberships = useCallback(async () => {
    if (!user?.user_id || user?.role === 'client') {
      setLoadingMemberships(false);
      return;
    }
    setLoadingMemberships(true);
    try {
      const response = await axiosInstance.get(
        `/agencies/${user.user_id}/agency-memberships`,
      );
      setAgentMemberships(response.data || []);
    } catch (error) {
      console.error(
        "Error fetching agent agency memberships:",
        error.response?.data || error.message,
      );
      showMessage("Failed to load your agency affiliations.", "error");
      setAgentMemberships([]);
    } finally {
      setLoadingMemberships(false);
    }
  }, [user?.user_id, user?.role, showMessage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowImageModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfile(false),
        fetchAgencies(),
        fetchAgentMemberships(),
      ]);
      setLoading(false);
    };
    if (user) {
      fetchAllData();
    }
  }, [user, fetchProfile, fetchAgencies, fetchAgentMemberships]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
        setProfilePictureData({ base64: reader.result, name: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearProfilePicture = () => {
    setProfilePicturePreview("");
    setProfilePictureData({ base64: null, name: null });
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const payload = { ...form };
      if (profilePictureData.base64) {
        if (profilePictureData.base64.startsWith('data:image')) {
            payload.profile_picture_base64 = profilePictureData.base64;
            payload.profile_picture_originalname = profilePictureData.name;
        }
      } else if (!profilePicturePreview) {
          // The backend should handle deleting the picture if the URL is empty
      }

      const response = await axiosInstance.put("/users/update", payload);
      updateUser(response.data.user, response.data.token);
      showMessage("Profile updated successfully!", "success");
      await fetchProfile(false);
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Failed to update profile.",
        "error",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    fetchProfile(false);
  };

  const addSocialLink = () =>
    setForm((prev) => ({
      ...prev,
      social_links: [...prev.social_links, { platform: "", url: "" }],
    }));

  const handleSocialLinkChange = (index, field, value) => {
    const newLinks = [...form.social_links];
    newLinks[index][field] = value;
    setForm((prev) => ({ ...prev, social_links: newLinks }));
  };

  const removeSocialLink = (index) =>
    setForm((prev) => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index),
    }));

  const handleAgencySearchChange = (e) => {
    const term = e.target.value;
    setAgencySearchTerm(term);
    if (term) {
      setFilteredAgencies(
        agencies.filter(
          (agency) =>
            agency.name.toLowerCase().includes(term.toLowerCase()) ||
            (agency.email && agency.email.toLowerCase().includes(term.toLowerCase())),
        ),
      );
    } else {
      setFilteredAgencies(agencies);
    }
  };

  const handleSendAgencyConnectionRequest = async (agencyId) => {
    try {
      await axiosInstance.post("/agencies/request-to-join", {
        agency_id: agencyId,
      });
      showMessage("Agency connection request sent!", "success");
      fetchAgentMemberships();
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Failed to send request.",
        "error",
      );
    }
  };

  const handleDisconnectFromAgency = (agencyId) => {
    showConfirm({
      title: "Disconnect from Agency",
      message: "Are you sure you want to disconnect from this agency?",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(
            `/agencies/${agencyId}/members/${user.user_id}`,
          );
          showMessage("Successfully disconnected from agency.", "success");
          fetchAgentMemberships();
          fetchProfile(false);
        } catch (error) {
          showMessage(
            error.response?.data?.message || "Failed to disconnect.",
            "error",
          );
        }
      },
    });
  };

  const handleCancelPendingRequest = (agencyId) => {
    showConfirm({
      title: "Cancel Request",
      message: "Are you sure you want to cancel your join request?",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(
            `/agencies/${agencyId}/members/${user.user_id}`,
          );
          showMessage("Your request has been cancelled.", "success");
          fetchAgentMemberships();
        } catch (error) {
          showMessage(
            error.response?.data?.message || "Failed to cancel request.",
            "error",
          );
        }
      },
    });
  };

  const handleNewAgencyFormChange = (e) => {
    setNewAgencyForm({ ...newAgencyForm, [e.target.name]: e.target.value });
  };

  const handleNewAgencyLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAgencyForm({
          ...newAgencyForm,
          logoBase64: reader.result,
          logoOriginalname: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterAgency = async () => {
    setRegisteringAgency(true);
    try {
      const response = await axiosInstance.post(
        "/agencies/register-agent-agency",
        newAgencyForm,
      );
      updateUser(response.data.user, response.data.token);
      showMessage("Agency registered successfully!", "success");
      setShowRegisterAgencyForm(false);
      await Promise.all([fetchProfile(false), fetchAgentMemberships()]);
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Failed to register agency.",
        "error",
      );
    } finally {
      setRegisteringAgency(false);
    }
  };

  const handleChangeRoleToAgent = async () => {
    showConfirm({
      title: "Become an Agent",
      message:
        "Are you sure you want to change your role to an Agent? This action cannot be undone.",
      onConfirm: async () => {
        setChangingRole(true);
        try {
          const response = await axiosInstance.put("/users/change-to-agent");
  
          // ✅ Replace old token and clear stale user
          updateUser(response.data.user, response.data.token);
          showMessage("You are now an Agent!", "success");
  
          // Fetch memberships (agent-specific data)
          await fetchAgentMemberships();
        } catch (error) {
          showMessage(
            error.response?.data?.message || "Failed to change role.",
            "error"
          );
        } finally {
          setChangingRole(false);
        }
      },
    });
  };
  

  const handleRevertRoleToClient = async () => {
    showConfirm({
      title: "Revert to Client",
      message: "Are you sure you want to revert your role to a Client? You will be disconnected from your agency if you are part of one.",
      onConfirm: async () => {
        setRevertingRole(true);
        try {
          const response = await axiosInstance.put("/users/revert-to-client");
          updateUser(response.data.user, response.data.token);
          showMessage("You are now a Client!", "success");
          await Promise.all([fetchProfile(false), fetchAgentMemberships()]);
        } catch (error) {
          showMessage(
            error.response?.data?.message || "Failed to revert role.",
            "error",
          );
        } finally {
          setRevertingRole(false);
        }
      },
    });
  };


  const connectedAgentMembership = agentMemberships.find(
    (m) => m.request_status === "accepted",
  );
  const pendingOrRejectedMembership = agentMemberships.find(
    (m) => m.request_status === "pending" || m.request_status === "rejected",
  );
  const hasAnyAffiliation = !!(
    connectedAgentMembership || pendingOrRejectedMembership
  );

  if (loading) {
    return <GeneralSectionSkeleton darkMode={darkMode} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div
  className={`pb-8 mb-8 border-b transition-colors ${
    darkMode ? "border-gray-700" : "border-gray-200"
  }`}
>
  {/* Header */}
  <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
    <h3
      className={`text-xl md:text-2xl font-bold tracking-tight flex items-center ${
        darkMode ? "text-gray-100" : "text-gray-900"
      }`}
    >
      <User className="mr-3 text-green-500" size={26} />
      Overview
    </h3>
    <div className="flex space-x-2">
      {isEditing ? (
        <>
          <button
            onClick={handleCancelEdit}
            className={`px-5 py-2 rounded-full font-medium text-sm shadow-sm transition ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              handleUpdate().then(() => setIsEditing(false));
            }}
            disabled={updating}
            className="px-5 py-2 font-medium rounded-full flex items-center text-sm bg-green-600 text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50"
          >
            {updating ? (
              <Loader size={16} className="animate-spin mr-2" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            {updating ? "Saving..." : "Save"}
          </button>
        </>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="px-5 py-2 rounded-full font-medium flex items-center text-sm bg-green-600 text-white shadow-sm transition hover:bg-green-700"
        >
          <PencilIcon size={16} className="mr-2" /> Edit
        </button>
      )}
    </div>
  </div>

  {/* Profile & Bio Section */}
<div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 mb-8 items-start">
  {/* Left Column (Profile picture + identity on mobile) */}
  <div className="flex flex-col md:items-center space-y-3 md:space-y-4">
    {/* Mobile: Picture + identity inline */}
    <div className="flex items-center space-x-4 md:hidden">
      <div
        onClick={() => setShowImageModal(true)}
        className="relative w-20 h-20 rounded-full overflow-hidden shadow-md border-4 border-green-500/20 bg-gray-100 dark:bg-gray-800 flex items-center justify-center cursor-pointer"
      >
        {profilePicturePreview ? (
          <img
            src={profilePicturePreview}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-10 h-10 text-gray-400" />
        )}
      </div>

      <div className="flex flex-col">
        <p className={`font-semibold text-base ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
          {form.full_name}
        </p>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          @{form.username}
        </p>
        <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          {userInfo.email}
        </p>
      </div>
    </div>

    {/* Desktop: Picture only */}
    <div
      onClick={() => setShowImageModal(true)}
      className="hidden md:flex w-32 h-32 rounded-full overflow-hidden shadow-md border-4 border-green-500/20 bg-gray-100 dark:bg-gray-800 items-center justify-center cursor-pointer"
    >
      {profilePicturePreview ? (
        <img
          src={profilePicturePreview}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      ) : (
        <User className="w-16 h-16 text-gray-400" />
      )}
    </div>

    {/* Remove Button */}
    {isEditing && profilePicturePreview && (
      <button
        type="button"
        onClick={handleClearProfilePicture}
        className="px-3 py-1 text-xs font-medium rounded-full bg-red-500 text-white shadow hover:bg-red-600"
      >
        Remove Picture
      </button>
    )}

    {/* Upload Input */}
    {isEditing && (
      <input
        type="file"
        accept="image/*"
        onChange={handleProfilePictureChange}
        className={`block w-full text-sm cursor-pointer file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:font-medium shadow-sm transition ${
          darkMode
            ? "file:bg-green-600 file:text-white hover:file:bg-green-700"
            : "file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
        }`}
      />
    )}
  </div>

  {/* Right Column (About Me) */}
  <div className="space-y-3">
    {isEditing ? (
      <>
        <label className={labelStyles} htmlFor="bio">
          About Me
        </label>
        <textarea
          id="bio"
          name="bio"
          value={form.bio || ""}
          onChange={handleChange}
          rows="5"
          className={`${inputFieldStyles} min-h-[120px] resize-none`}
          disabled={!isEditing}
        />
      </>
    ) : (
      <div className="space-y-2">
        <p
          className={`text-sm font-semibold uppercase tracking-wide ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          About Me
        </p>
        <p
          className={`whitespace-pre-wrap leading-relaxed ${
            darkMode ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {form.bio || "No bio provided."}
        </p>
      </div>
    )}
  </div>
</div>

{/* Profile Picture Modal */}
{showImageModal && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    onClick={() => setShowImageModal(false)} // Close when clicking background
  >
    <div
      className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden flex items-center justify-center"
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
    >
      <button
        className="absolute top-3 right-3 p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700"
        onClick={() => setShowImageModal(false)}
      >
        <X size={18} />
      </button>
      <img
        src={profilePicturePreview}
        alt="Profile Large"
        className="object-contain max-w-[70vw] max-h-[70vh]"
      />
    </div>
  </div>
)}


{/* Info Fields */}
{isEditing ? (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label className={labelStyles}>Full Name</label>
      <input
        type="text"
        name="full_name"
        value={form.full_name}
        onChange={handleChange}
        className={inputFieldStyles}
        disabled={!isEditing}
      />
    </div>
    <div>
      <label className={labelStyles}>Username</label>
      <input
        type="text"
        name="username"
        value={form.username}
        onChange={handleChange}
        className={inputFieldStyles}
        disabled={!isEditing}
      />
    </div>
    <div>
      <label className={labelStyles}>Email</label>
      <input
        type="email"
        value={userInfo.email || ""}
        className={inputFieldStyles}
        disabled
      />
    </div>
    <div>
      <label className={labelStyles}>Phone Number</label>
      <input
        type="tel"
        name="phone"
        value={form.phone}
        onChange={handleChange}
        className={inputFieldStyles}
        disabled={!isEditing}
      />
    </div>
    <div>
      <label className={labelStyles}>Location</label>
      <input
        type="text"
        name="location"
        value={form.location}
        onChange={handleChange}
        className={inputFieldStyles}
        disabled={!isEditing}
      />
    </div>
    <div>
      <label className={labelStyles}>Date Joined</label>
      <input
        type="text"
        value={
          userInfo.date_joined
            ? new Date(userInfo.date_joined).toLocaleDateString()
            : "N/A"
        }
        className={inputFieldStyles}
        disabled
      />
    </div>
  </div>
) : (
  <>
    {/* Overview Info Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Hidden on mobile (already shown beside profile pic) */}
      <div className="hidden md:block">
        <OverviewDisplayCard
          icon={<UserCheck size={20} className="text-green-500" />}
          label="Full Name"
          value={form.full_name}
          darkMode={darkMode}
        />
      </div>
      <div className="hidden md:block">
        <OverviewDisplayCard
          icon={<Hash size={20} className="text-sky-500" />}
          label="Username"
          value={form.username}
          darkMode={darkMode}
        />
      </div>
      <div className="hidden md:block">
        <OverviewDisplayCard
          icon={<Mail size={20} className="text-red-500" />}
          label="Email"
          value={userInfo.email}
          darkMode={darkMode}
        />
      </div>

      {/* Always visible */}
      <OverviewDisplayCard
        icon={<Phone size={20} className="text-violet-500" />}
        label="Phone Number"
        value={form.phone}
        darkMode={darkMode}
      />
      <OverviewDisplayCard
        icon={<MapPin size={20} className="text-orange-500" />}
        label="Location"
        value={form.location}
        darkMode={darkMode}
      />
      <OverviewDisplayCard
        icon={<Calendar size={20} className="text-amber-500" />}
        label="Date Joined"
        value={
          userInfo.date_joined
            ? new Date(userInfo.date_joined).toLocaleDateString()
            : "N/A"
        }
        darkMode={darkMode}
      />
    </div>
  </>
)}
</div>



      {/* --- AGENCY SECTION --- */}
      <div
        className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <h3
          className={`text-lg md:text-xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}
        >
          <Building className="mr-3 text-orange-500" size={24} /> My Role & Agency
        </h3>
        {user?.role === 'client' && (
            <div className={`p-4 rounded-xl border space-y-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h4 className="font-bold text-md flex items-center"><Briefcase size={20} className="mr-2"/>Become an Agent</h4>
                <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
                    Unlock powerful tools to manage properties, connect with clients, and grow your real estate business. As an agent, you can create your own agency or join an existing one to collaborate with a team.
                </p>
                <ul className={`list-disc list-inside space-y-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    <li>List and manage properties with ease.</li>
                    <li>Gain insights with advanced analytics.</li>
                    <li>Collaborate with other agents in your agency.</li>
                    <li>Expand your reach and connect with more clients.</li>
                </ul>
                <button
                    onClick={handleChangeRoleToAgent}
                    disabled={changingRole}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {changingRole ? (
                        <>
                            <Loader size={20} className="animate-spin mr-2" />
                            Changing Role...
                        </>
                    ) : (
                        "Change to Agent"
                    )}
                </button>
            </div>
        )}

        {(user?.role === "agent" || user?.role === "agency_admin") && (
          <>
            {loadingMemberships ? (
              <div
                className={`p-4 rounded-xl flex items-center justify-center ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
              >
                <Loader size={20} className="animate-spin mr-2" /> Loading
                affiliations...
              </div>
            ) : hasAnyAffiliation ? (
              <div className="space-y-3">
                {connectedAgentMembership && (
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${darkMode ? "bg-green-800/20 border-green-700" : "bg-green-50 border-green-200"}`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle
                        size={24}
                        className={darkMode ? "text-green-400" : "text-green-600"}
                      />
                      <div>
                        <p
                          className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}
                        >
                          Connected to: {connectedAgentMembership.agency_name}
                        </p>
                        <p
                          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          Your request was accepted.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleDisconnectFromAgency(
                          connectedAgentMembership.agency_id,
                        )
                      }
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${darkMode ? "bg-red-600 text-white hover:bg-red-500" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                    >
                      Disconnect
                    </button>
                  </div>
                )}
                {pendingOrRejectedMembership && (
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${pendingOrRejectedMembership.request_status === "pending" ? (darkMode ? "bg-yellow-800/20 border-yellow-700" : "bg-yellow-50 border-yellow-200") : (darkMode ? "bg-red-800/20 border-red-700" : "bg-red-50 border-red-200")}`}
                  >
                    <div className="flex items-center gap-3">
                      {pendingOrRejectedMembership.request_status ===
                      "pending" ? (
                        <Hourglass
                          size={24}
                          className={
                            darkMode ? "text-yellow-400" : "text-yellow-600"
                          }
                        />
                      ) : (
                        <UserX
                          size={24}
                          className={darkMode ? "text-red-400" : "text-red-600"}
                        />
                      )}
                      <div>
                        <p
                          className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}
                        >
                          {pendingOrRejectedMembership.request_status ===
                          "pending"
                            ? "Pending Request"
                            : "Request Rejected"}
                        </p>
                        <p
                          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          To join: {pendingOrRejectedMembership.agency_name}
                        </p>
                      </div>
                    </div>
                    {pendingOrRejectedMembership.request_status ===
                      "pending" && (
                      <button
                        onClick={() =>
                          handleCancelPendingRequest(
                            pendingOrRejectedMembership.agency_id,
                          )
                        }
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition ${darkMode ? "bg-red-600 text-white hover:bg-red-500" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  You are not affiliated with any agency. You can register your
                  own or join an existing one.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setShowRegisterAgencyForm(true)}
                    className={`w-full sm:w-auto px-6 py-2 rounded-full font-semibold flex items-center justify-center transition ${darkMode ? "bg-green-600 text-white hover:bg-green-700" : "bg-green-500 text-white hover:bg-green-600"}`}
                  >
                    Register Your Agency
                  </button>
                </div>
                {showRegisterAgencyForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 mt-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}
                  >
                    {/* Agency Registration Form JSX */}
                    <h4
                      className={`text-md font-bold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}
                    >
                      New Agency Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        name="name"
                        value={newAgencyForm.name}
                        onChange={handleNewAgencyFormChange}
                        placeholder="Agency Name"
                        className={inputFieldStyles}
                      />
                      <input
                        name="email"
                        value={newAgencyForm.email}
                        onChange={handleNewAgencyFormChange}
                        placeholder="Agency Email"
                        className={inputFieldStyles}
                      />
                      <input
                        name="phone"
                        value={newAgencyForm.phone}
                        onChange={handleNewAgencyFormChange}
                        placeholder="Agency Phone"
                        className={inputFieldStyles}
                      />
                      <input
                        name="address"
                        value={newAgencyForm.address}
                        onChange={handleNewAgencyFormChange}
                        placeholder="Agency Address"
                        className={inputFieldStyles}
                      />
                    </div>
                    <textarea
                      name="description"
                      value={newAgencyForm.description}
                      onChange={handleNewAgencyFormChange}
                      placeholder="Agency Description"
                      rows="3"
                      className={`${inputFieldStyles} mt-4`}
                    ></textarea>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => setShowRegisterAgencyForm(false)}
                        className={`px-3 py-1 rounded-full text-sm ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRegisterAgency}
                        disabled={registeringAgency}
                        className="px-3 py-1 rounded-full text-sm bg-green-600 text-white disabled:opacity-50"
                      >
                        {registeringAgency ? "Registering..." : "Submit"}
                      </button>
                    </div>
                  </motion.div>
                )}
                <div className="relative pt-4">
                  <div
                    className={`absolute inset-0 flex items-center`}
                    aria-hidden="true"
                  >
                    <div
                      className={`w-full border-t ${darkMode ? "border-gray-700" : "border-gray-300"}`}
                    />
                  </div>
                  <div className="relative flex justify-center">
                    <span
                      className={`px-2 text-sm ${darkMode ? "bg-gray-900 text-gray-400" : "bg-gray-50 text-gray-500"}`}
                    >
                      OR
                    </span>
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <Search
                      size={20}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    />
                    <input
                      type="text"
                      placeholder="Search for an existing agency..."
                      value={agencySearchTerm}
                      onChange={handleAgencySearchChange}
                      className={`w-full py-2 pl-10 pr-4 ${inputFieldStyles}`}
                    />
                  </div>
                  <ul className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {filteredAgencies.map((agency) => (
                      <li
                        key={agency.agency_id}
                        className={`p-2 rounded-lg flex justify-between items-center ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                      >
                        <span>{agency.name}</span>
                        <button
                          onClick={() =>
                            handleSendAgencyConnectionRequest(agency.agency_id)
                          }
                          className="p-2 rounded-full bg-green-500 text-white"
                        >
                          <UserPlus size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h4 className="font-bold text-md mb-2">Account Actions</h4>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>If you no longer wish to be an agent, you can revert your account to a client role.</p>
                <button
                    onClick={handleRevertRoleToClient}
                    disabled={revertingRole}
                    className={`w-full sm:w-auto px-5 py-2 rounded-full font-semibold flex items-center justify-center transition text-sm ${darkMode ? "bg-red-800 text-white hover:bg-red-700" : "bg-red-100 text-red-700 hover:bg-red-200"} disabled:opacity-50`}
                >
                    {revertingRole ? (
                        <>
                            <Loader size={18} className="animate-spin mr-2" />
                            Reverting...
                        </>
                    ) : (
                        "Revert to Client"
                    )}
                </button>
            </div>
          </>
        )}
      </div>

      <div
        className={`pb-6 mb-6 ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <h3
          className={`text-lg md:text-xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}
        >
          <Link className="mr-3 text-cyan-500" size={24} /> Social Media &
          Websites
        </h3>
        <div className="space-y-4">
          {form.social_links?.map((link, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className="w-full md:w-1/3">
                <label className={labelStyles}>Platform</label>
                <input
                  type="text"
                  value={link.platform}
                  onChange={(e) =>
                    handleSocialLinkChange(index, "platform", e.target.value)
                  }
                  className={inputFieldStyles}
                  placeholder="e.g., LinkedIn"
                  disabled={!isEditing}
                />
              </div>

              <div className="w-full md:w-2/3">
                <label className={labelStyles}>URL</label>
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) =>
                    handleSocialLinkChange(index, "url", e.target.value)
                  }
                  className={inputFieldStyles}
                  placeholder="https://linkedin.com/in/yourprofile"
                  disabled={!isEditing}
                />
              </div>

              {isEditing && form.social_links.length > 1 && (
                <button
                  onClick={() => removeSocialLink(index)}
                  className={`self-start md:self-center p-2 rounded-full transition ${
                    darkMode
                      ? "bg-red-700 text-white"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          ))}
          {isEditing && (
            <button
              type="button"
              onClick={addSocialLink}
              className={`mt-4 px-4 py-2 rounded-full font-semibold flex items-center transition ${
                darkMode
                  ? "bg-gray-700 text-gray-200"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <Link size={18} className="mr-2" /> Add Link
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default General;
