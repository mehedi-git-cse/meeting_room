import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Video } from "lucide-react";
import { http } from "../api/http";
import { getSocket } from "../api/socket";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { CallDock } from "../components/CallDock";
import { ChannelSidebar } from "../components/ChannelSidebar";
import { ChatWindow } from "../components/ChatWindow";
import { MessageComposer } from "../components/MessageComposer";
import { ServerSidebar } from "../components/ServerSidebar";
import { logoutThunk } from "../features/auth/authSlice";
import { fetchMessagesThunk } from "../features/chat/chatSlice";
import { addMemberThunk, createChannelThunk, createServerThunk, fetchChannelsThunk, fetchServersThunk, setCurrentChannel, setCurrentServer } from "../features/servers/serversSlice";
import { endCall, startCall, toggleCamera, toggleMic, toggleScreenShare } from "../features/webrtc/webrtcSlice";
import { useRealtime } from "../hooks/useRealtime";
import { useWebRTC } from "../hooks/useWebRTC";

const AppPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user, accessToken } = useAppSelector((s) => s.auth);
  const { servers, channels, currentServerId, currentChannelId } = useAppSelector((s) => s.servers);
  const currentServer = servers.find((s) => s.id === currentServerId);
  const currentUserRole = currentServer?.currentRole;
  const { messages, typingUsers } = useAppSelector((s) => s.chat);
  const callState = useAppSelector((s) => s.webrtc);

  useRealtime(accessToken, currentChannelId);

  const {
    localStream,
    remoteStreams,
    cleanup,
    setMicEnabled,
    setCameraEnabled,
    startScreenShare,
    stopScreenShare,
    isScreenSharing
  } = useWebRTC({
    roomId: callState.roomId,
    userId: user?.id,
    mediaType: callState.mediaType
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    dispatch(fetchServersThunk());
  }, [dispatch, navigate, user]);

  useEffect(() => {
    if (currentServerId) {
      dispatch(fetchChannelsThunk(currentServerId));
    }
  }, [currentServerId, dispatch]);

  useEffect(() => {
    if (currentChannelId) {
      dispatch(fetchMessagesThunk(currentChannelId));
    }
  }, [currentChannelId, dispatch]);

  const currentChannel = useMemo(
    () => channels.find((channel) => channel.id === currentChannelId),
    [channels, currentChannelId]
  );

  const sendMessage = async (content) => {
    if (!currentChannelId) return;

    await http.post(`/chat/channels/${currentChannelId}/messages`, { content });
  };

  const onTyping = (typing) => {
    if (!currentChannelId) return;
    const socket = getSocket();
    socket?.emit("user:typing", { channelId: currentChannelId, typing });
  };

  const beginCall = (mediaType) => {
    if (!currentChannelId) return;

    dispatch(startCall({ roomId: currentChannelId, mediaType }));
  };

  useEffect(() => {
    if (!currentChannel || currentChannel.type !== "VOICE") return;

    const shouldStartVoiceCall = !callState.inCall || callState.roomId !== currentChannel.id;
    if (shouldStartVoiceCall) {
      dispatch(startCall({ roomId: currentChannel.id, mediaType: "voice" }));
    }
  }, [callState.inCall, callState.roomId, currentChannel, dispatch]);

  useEffect(() => {
    if (!callState.inCall) return;
    setMicEnabled(callState.micEnabled);
  }, [callState.inCall, callState.micEnabled, localStream, setMicEnabled]);

  useEffect(() => {
    if (!callState.inCall) return;
    setCameraEnabled(callState.cameraEnabled);
  }, [callState.cameraEnabled, callState.inCall, localStream, setCameraEnabled]);

  useEffect(() => {
    if (!callState.inCall) return;

    if (callState.screenSharing) {
      startScreenShare();
      return;
    }

    stopScreenShare();
  }, [callState.inCall, callState.screenSharing, startScreenShare, stopScreenShare]);

  useEffect(() => {
    if (!callState.inCall && isScreenSharing) {
      stopScreenShare();
    }
  }, [callState.inCall, isScreenSharing, stopScreenShare]);

  const handleEndCall = () => {
    cleanup();
    dispatch(endCall());
  };

  return (
    <main className="workspace-grid">
      <ServerSidebar
        servers={servers}
        currentServerId={currentServerId}
        onSelectServer={(serverId) => dispatch(setCurrentServer(serverId))}
        onCreateServer={(name) => dispatch(createServerThunk({ name }))}
      />

      <ChannelSidebar
        channels={channels}
        currentChannelId={currentChannelId}
        currentServerId={currentServerId}
        currentUserRole={currentUserRole}
        onSelectChannel={(channelId) => dispatch(setCurrentChannel(channelId))}
        onCreateChannel={({ name, type }) => dispatch(createChannelThunk({ serverId: currentServerId, name, type }))}
        onAddMember={async (username) => {
          const result = await dispatch(addMemberThunk({ serverId: currentServerId, username }));
          if (addMemberThunk.rejected.match(result)) return result.payload;
          return null;
        }}
      />

      <section className="main-panel">
        <header className="top-bar">
          <div>
            <h2>{currentChannel ? `#${currentChannel.name}` : "Select a channel"}</h2>
            <small>@{user?.username}</small>
          </div>
          <div className="top-actions">
            <button onClick={() => beginCall("voice")} type="button">
              <Phone size={16} /> Voice
            </button>
            <button onClick={() => beginCall("video")} type="button">
              <Video size={16} /> Video
            </button>
            <button onClick={() => dispatch(logoutThunk())} type="button" className="logout">
              Logout
            </button>
          </div>
        </header>

        <ChatWindow
          currentChannelName={currentChannel?.name}
          messages={messages}
          typingUsers={typingUsers}
          currentUserId={user?.id}
        />

        <MessageComposer onSend={sendMessage} onTyping={onTyping} />

        <CallDock
          inCall={callState.inCall}
          mediaType={callState.mediaType}
          micEnabled={callState.micEnabled}
          cameraEnabled={callState.cameraEnabled}
          screenSharing={callState.screenSharing || isScreenSharing}
          onToggleMic={() => dispatch(toggleMic())}
          onToggleCamera={() => dispatch(toggleCamera())}
          onToggleScreen={() => dispatch(toggleScreenShare())}
          onEnd={handleEndCall}
        />

        {callState.inCall && (
          <section className="media-grid">
            <article>
              <h4>Your Stream</h4>
              <video
                autoPlay
                muted
                playsInline
                ref={(el) => {
                  if (el && localStream) el.srcObject = localStream;
                }}
              />
            </article>
            {remoteStreams.map((remote) => (
              <article key={remote.userId}>
                <h4>Peer {remote.userId.slice(0, 4)}</h4>
                <video
                  autoPlay
                  playsInline
                  ref={(el) => {
                    if (el) el.srcObject = remote.stream;
                  }}
                />
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
};

export default AppPage;
