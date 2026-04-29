import { Mic, MicOff, Monitor, PhoneOff, Video, VideoOff } from "lucide-react";

export const CallDock = ({
  inCall,
  mediaType,
  micEnabled,
  cameraEnabled,
  screenSharing,
  onToggleMic,
  onToggleCamera,
  onToggleScreen,
  onEnd
}) => {
  if (!inCall) return null;

  return (
    <div className="call-dock">
      <span>{mediaType === "video" ? "Video Call" : "Voice Call"} Live</span>
      <div className="actions">
        <button onClick={onToggleMic} type="button">
          {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
        </button>
        <button onClick={onToggleCamera} type="button">
          {cameraEnabled ? <Video size={16} /> : <VideoOff size={16} />}
        </button>
        <button onClick={onToggleScreen} type="button" className={screenSharing ? "active" : ""}>
          <Monitor size={16} />
        </button>
        <button onClick={onEnd} type="button" className="danger">
          <PhoneOff size={16} />
        </button>
      </div>
    </div>
  );
};
