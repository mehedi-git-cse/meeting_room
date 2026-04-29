import { useState } from "react";
import clsx from "clsx";
import { Plus, X } from "lucide-react";

export const ServerSidebar = ({ servers, currentServerId, onSelectServer, onCreateServer }) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onCreateServer(name.trim());
    setName("");
    setLoading(false);
    setShowModal(false);
  };

  return (
    <aside className="server-sidebar">
      <div className="brand">OM</div>
      <ul>
        {servers.map((server) => (
          <li key={server.id}>
            <button
              className={clsx("server-pill", { active: server.id === currentServerId })}
              onClick={() => onSelectServer(server.id)}
              title={server.name}
              type="button"
            >
              {(server.name || "S").slice(0, 2).toUpperCase()}
            </button>
          </li>
        ))}
        <li>
          <button
            className="server-pill server-pill-add"
            title="Create Server"
            type="button"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} />
          </button>
        </li>
      </ul>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Server</h3>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form className="modal-form" onSubmit={handleCreate}>
              <label>
                Server Name
                <input
                  autoFocus
                  placeholder="e.g. My Team"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <button type="submit" disabled={loading || !name.trim()}>
                {loading ? "Creating..." : "Create Server"}
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

