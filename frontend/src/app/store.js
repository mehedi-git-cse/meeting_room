import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import chatReducer from "../features/chat/chatSlice";
import serversReducer from "../features/servers/serversSlice";
import webrtcReducer from "../features/webrtc/webrtcSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    servers: serversReducer,
    webrtc: webrtcReducer
  }
});
