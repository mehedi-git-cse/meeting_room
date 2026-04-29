import { useEffect } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../api/socket";
import { useAppDispatch } from "../app/hooks";
import { appendMessage, patchMessage, removeMessage, setTyping } from "../features/chat/chatSlice";

export const useRealtime = (token, activeChannelId) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!token) return undefined;

    const socket = connectSocket(token);

    socket.on("message:new", (message) => dispatch(appendMessage(message)));
    socket.on("message:edit", (message) => dispatch(patchMessage(message)));
    socket.on("message:delete", (payload) => dispatch(removeMessage(payload)));
    socket.on("user:typing", (payload) => dispatch(setTyping(payload)));

    return () => {
      socket.off("message:new");
      socket.off("message:edit");
      socket.off("message:delete");
      socket.off("user:typing");
    };
  }, [dispatch, token]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeChannelId) return;

    socket.emit("room:join", { roomId: activeChannelId });

    return () => {
      socket.emit("room:leave", { roomId: activeChannelId });
    };
  }, [activeChannelId]);

  useEffect(
    () => () => {
      disconnectSocket();
    },
    []
  );
};
