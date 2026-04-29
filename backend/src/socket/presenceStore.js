const onlineUsers = new Map();

export const addConnection = (userId, socketId) => {
  const sockets = onlineUsers.get(userId) || new Set();
  sockets.add(socketId);
  onlineUsers.set(userId, sockets);
};

export const removeConnection = (userId, socketId) => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;

  sockets.delete(socketId);

  if (sockets.size === 0) {
    onlineUsers.delete(userId);
  }
};

export const isOnline = (userId) => onlineUsers.has(userId);

export const getOnlineUsers = () => Array.from(onlineUsers.keys());
