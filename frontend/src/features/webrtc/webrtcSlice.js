import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  inCall: false,
  roomId: null,
  mediaType: "voice",
  micEnabled: true,
  cameraEnabled: false,
  screenSharing: false,
  remotePeers: []
};

const webrtcSlice = createSlice({
  name: "webrtc",
  initialState,
  reducers: {
    startCall(state, action) {
      state.inCall = true;
      state.roomId = action.payload.roomId;
      state.mediaType = action.payload.mediaType;
    },
    endCall(state) {
      return { ...initialState };
    },
    toggleMic(state) {
      state.micEnabled = !state.micEnabled;
    },
    toggleCamera(state) {
      state.cameraEnabled = !state.cameraEnabled;
    },
    toggleScreenShare(state) {
      state.screenSharing = !state.screenSharing;
    },
    setRemotePeers(state, action) {
      state.remotePeers = action.payload;
    }
  }
});

export const { startCall, endCall, toggleMic, toggleCamera, toggleScreenShare, setRemotePeers } = webrtcSlice.actions;
export default webrtcSlice.reducer;
