import { useState } from "react";
import clsx from "clsx";
import { Hash, Volume2, Plus, UserPlus, X } from "lucide-react";

const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button type="button" className="modal-close" onClick={onClose}><X size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

export const ChannelSidebar = ({
  channels,
  currentChannelId,
  onSelectChannel,
  onCreateChannel,
  onAddMember,
  currentServerId,
  currentUserRole
}) => {
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("TEXT");
  const [memberUsername, setMemberUsername] = useState("");
  const [memberError, setMemberError] = useState("");
  const [memberSuccess, setMemberSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const canManage = ["ADMIN", "MODERATOR"].includes(currentUserRole);

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) return;
    setLoading(true);
    await onCreateChannel({ name: channelName.trim(), type: channelType });
    setChannelName("");
    setChannelType("TEXT");
    setLoading(false);
    setShowCreateChannel(false);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberUsername.trim()) return;
    setLoading(true);
    setMemberError("");
    setMemberSuccess("");
    const err = await onAddMember(memberUsername.trim());
    if (err) {
      setMemberError(err);
    } else {
      setMemberSuccess(`${memberUsername.trim()} added successfully!`);
      setMemberUsername("");
    }
    setLoading(false);
  };

  return (
    <aside className="channel-sidebar">
      <div className="channel-sidebar-header">
        <h2>Channels</h2>
        {canManage && (
          <div className="channel-actions">
            <button type="button" title="Add Member" onClick={() => { setShowAddMember(true); setMemberError(""); setMemberSuccess(""); }}>
              <UserPlus size={15} />
            </button>
            <button type="button" title="New Channel" onClick={() => setShowCreateChannel(true)}>
              <Plus size={15} />
            </button>
          </div>
        )}
      </div>

      <ul>
        {channels.map((channel) => (
          <li key={channel.id}>
            <button
              className={clsx("channel-item", { active: currentChannelId === channel.id })}
              type="button"
              onClick={() => onSelectChannel(channel.id)}
            >
              {channel.type === "TEXT" ? <Hash size={16} /> : <Volume2 size={16} />}
              <span>{channel.name}</span>
            </button>
          </li>
        ))}
      </ul>

      {showCreateChannel && (
        <Modal title="Create Channel" onClose={() => setShowCreateChannel(false)}>
          <form className="modal-form" onSubmit={handleCreateChannel}>
            <label>
              Channel Name
              <input
                autoFocus
                placeholder="e.g. general"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
              />
            </label>
            <label>
              Type
              <select value={channelType} onChange={(e) => setChannelType(e.target.value)}>
                <option value="TEXT">Text</option>
                <option value="VOICE">Voice</option>
              </select>
            </label>
            <button type="submit" disabled={loading || !channelName.trim()}>
              {loading ? "Creating..." : "Create Channel"}
            </button>
          </form>
        </Modal>
      )}

      {showAddMember && (
        <Modal title="Add Member" onClose={() => setShowAddMember(false)}>
          <form className="modal-form" onSubmit={handleAddMember}>
            <label>
              Username
              <input
                autoFocus
                placeholder="Enter username"
                value={memberUsername}
                onChange={(e) => setMemberUsername(e.target.value)}
              />
            </label>
            {memberError && <p className="modal-error">{memberError}</p>}
            {memberSuccess && <p className="modal-success">{memberSuccess}</p>}
            <button type="submit" disabled={loading || !memberUsername.trim()}>
              {loading ? "Adding..." : "Add Member"}
            </button>
          </form>
        </Modal>
      )}
    </aside>
  );
};
