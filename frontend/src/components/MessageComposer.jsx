import { useRef, useState } from "react";
import { Paperclip, SendHorizontal } from "lucide-react";
import { uploadFile } from "../api/upload";

export const MessageComposer = ({ onSend, onTyping }) => {
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const submit = (event) => {
    event.preventDefault();
    if (!content.trim()) return;
    onSend(content.trim());
    setContent("");
    onTyping(false);
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFile(file);
      onSend(result.url);
    } catch {
      // silently ignore upload errors in UI
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <form className="composer" onSubmit={submit}>
      <input
        value={content}
        placeholder="Message #channel"
        onChange={(event) => {
          setContent(event.target.value);
          onTyping(event.target.value.length > 0);
        }}
      />
      <button
        type="button"
        aria-label="Attach file"
        className="attach"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        <Paperclip size={18} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*,application/pdf"
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <button type="submit" aria-label="Send message" disabled={uploading}>
        <SendHorizontal size={18} />
      </button>
    </form>
  );
};
