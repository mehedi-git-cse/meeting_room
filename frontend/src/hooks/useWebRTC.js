import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSocket } from "../api/socket";
import { http } from "../api/http";

const FALLBACK_ICE = { iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] };

let cachedRtcConfig = null;

const getRtcConfig = async () => {
  if (cachedRtcConfig) return cachedRtcConfig;
  try {
    const { data } = await http.get("/rtc/config");
    cachedRtcConfig = data.iceServers?.length ? data : FALLBACK_ICE;
  } catch {
    cachedRtcConfig = FALLBACK_ICE;
  }
  return cachedRtcConfig;
};

export const useWebRTC = ({ roomId, userId, mediaType }) => {
  const peersRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const isVideo = mediaType === "video";

  const attachTracks = (pc, stream) => {
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  };

  const replaceVideoTrack = useCallback((nextTrack) => {
    peersRef.current.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");

      if (sender) {
        sender.replaceTrack(nextTrack || null);
      } else if (nextTrack && localStreamRef.current) {
        pc.addTrack(nextTrack, localStreamRef.current);
      }
    });
  }, []);

  const bootstrapLocalMedia = useCallback(async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: isVideo
    });

    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, [isVideo]);

  const createPeer = useCallback(
    async (targetUserId, offer = false) => {
      const socket = getSocket();
      if (!socket || !roomId || !userId) return;

      if (targetUserId === userId) return;
      const existing = peersRef.current.get(targetUserId);
      if (existing) {
        return existing;
      }

      const rtcConfig = await getRtcConfig();
      const pc = new RTCPeerConnection(rtcConfig);
      const local = localStreamRef.current || (await bootstrapLocalMedia());
      attachTracks(pc, local);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc:ice-candidate", {
            roomId,
            targetUserId,
            candidate: event.candidate
          });
        }
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        setRemoteStreams((prev) => {
          const filtered = prev.filter((x) => x.userId !== targetUserId);
          return [...filtered, { userId: targetUserId, stream }];
        });
      };

      pc.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
          peersRef.current.delete(targetUserId);
          setRemoteStreams((prev) => prev.filter((x) => x.userId !== targetUserId));
        }
      };

      peersRef.current.set(targetUserId, pc);

      if (offer) {
        const description = await pc.createOffer();
        await pc.setLocalDescription(description);

        socket.emit("webrtc:offer", {
          roomId,
          targetUserId,
          sdp: description,
          mediaType
        });
      }

      return pc;
    },
    [bootstrapLocalMedia, mediaType, roomId, userId]
  );

  const setMicEnabled = useCallback((enabled) => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }, []);

  const setCameraEnabled = useCallback(
    async (enabled) => {
      if (!localStreamRef.current) {
        await bootstrapLocalMedia();
      }

      if (!localStreamRef.current || isScreenSharing) return;

      const existingVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (enabled) {
        if (!existingVideoTrack) {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const [track] = videoStream.getVideoTracks();
          if (!track) return;

          localStreamRef.current.addTrack(track);
          replaceVideoTrack(track);
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          return;
        }

        existingVideoTrack.enabled = true;
        return;
      }

      if (existingVideoTrack) {
        existingVideoTrack.enabled = false;
      }
    },
    [bootstrapLocalMedia, isScreenSharing, replaceVideoTrack]
  );

  const startScreenShare = useCallback(async () => {
    if (!localStreamRef.current) {
      await bootstrapLocalMedia();
    }

    if (!localStreamRef.current || isScreenSharing) return;

    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const [screenTrack] = screenStream.getVideoTracks();
    if (!screenTrack) return;

    screenTrackRef.current = screenTrack;
    setIsScreenSharing(true);
    replaceVideoTrack(screenTrack);

    const nextTracks = [
      ...localStreamRef.current.getAudioTracks(),
      screenTrack
    ];
    setLocalStream(new MediaStream(nextTracks));

    const socket = getSocket();
    socket?.emit("webrtc:screen-share-start", { roomId });

    screenTrack.onended = () => {
      screenTrackRef.current = null;
      setIsScreenSharing(false);

      const fallbackVideo = localStreamRef.current?.getVideoTracks()[0] || null;
      replaceVideoTrack(fallbackVideo);
      setLocalStream(new MediaStream(localStreamRef.current?.getTracks() || []));
      socket?.emit("webrtc:screen-share-stop", { roomId });
    };
  }, [bootstrapLocalMedia, isScreenSharing, replaceVideoTrack, roomId]);

  const stopScreenShare = useCallback(() => {
    const currentTrack = screenTrackRef.current;
    if (!currentTrack) return;

    currentTrack.stop();
    screenTrackRef.current = null;
    setIsScreenSharing(false);

    const fallbackVideo = localStreamRef.current?.getVideoTracks()[0] || null;
    replaceVideoTrack(fallbackVideo);
    setLocalStream(new MediaStream(localStreamRef.current?.getTracks() || []));

    const socket = getSocket();
    socket?.emit("webrtc:screen-share-stop", { roomId });
  }, [replaceVideoTrack, roomId]);

  const cleanup = useCallback(() => {
    const socket = getSocket();
    if (roomId) {
      socket?.emit("room:leave", { roomId });
    }

    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();

    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
      setIsScreenSharing(false);
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    setRemoteStreams([]);
  }, [roomId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId || !userId) return undefined;

    socket.emit("room:join", { roomId });

    const onOffer = async ({ fromUserId, targetUserId, sdp }) => {
      if (targetUserId !== userId) return;

      const pc = (await createPeer(fromUserId, false)) || peersRef.current.get(fromUserId);
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc:answer", {
        roomId,
        targetUserId: fromUserId,
        sdp: answer,
        mediaType
      });
    };

    const onAnswer = async ({ fromUserId, targetUserId, sdp }) => {
      if (targetUserId !== userId) return;
      const pc = peersRef.current.get(fromUserId);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    };

    const onCandidate = async ({ fromUserId, targetUserId, candidate }) => {
      if (targetUserId !== userId) return;
      const pc = peersRef.current.get(fromUserId);
      if (!pc) return;
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const onRoomUsers = async ({ roomId: joinedRoomId, users }) => {
      if (joinedRoomId !== roomId) return;

      const peers = (users || []).filter((id) => id !== userId);
      for (const peerUserId of peers) {
        if (userId.localeCompare(peerUserId) < 0) {
          await createPeer(peerUserId, true);
        }
      }
    };

    const onRoomUserJoined = async ({ roomId: joinedRoomId, userId: joinedUserId }) => {
      if (joinedRoomId !== roomId || joinedUserId === userId) return;

      if (userId.localeCompare(joinedUserId) < 0) {
        await createPeer(joinedUserId, true);
      }
    };

    const onRoomUserLeft = ({ roomId: leftRoomId, userId: leftUserId }) => {
      if (leftRoomId !== roomId || !leftUserId) return;

      const pc = peersRef.current.get(leftUserId);
      if (pc) {
        pc.close();
        peersRef.current.delete(leftUserId);
      }

      setRemoteStreams((prev) => prev.filter((x) => x.userId !== leftUserId));
    };

    socket.on("webrtc:offer", onOffer);
    socket.on("webrtc:answer", onAnswer);
    socket.on("webrtc:ice-candidate", onCandidate);
    socket.on("room:users", onRoomUsers);
    socket.on("room:user-joined", onRoomUserJoined);
    socket.on("room:user-left", onRoomUserLeft);

    return () => {
      socket.off("webrtc:offer", onOffer);
      socket.off("webrtc:answer", onAnswer);
      socket.off("webrtc:ice-candidate", onCandidate);
      socket.off("room:users", onRoomUsers);
      socket.off("room:user-joined", onRoomUserJoined);
      socket.off("room:user-left", onRoomUserLeft);
      cleanup();
    };
  }, [cleanup, createPeer, mediaType, roomId, userId]);

  return useMemo(
    () => ({
      localStream,
      remoteStreams,
      setMicEnabled,
      setCameraEnabled,
      startScreenShare,
      stopScreenShare,
      isScreenSharing,
      cleanup
    }),
    [cleanup, isScreenSharing, localStream, remoteStreams, setCameraEnabled, setMicEnabled, startScreenShare, stopScreenShare]
  );
};
