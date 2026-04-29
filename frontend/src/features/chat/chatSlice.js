import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { http } from "../../api/http";

const initialState = {
  messages: [],
  typingUsers: {}
};

export const fetchMessagesThunk = createAsyncThunk("chat/fetchMessages", async (channelId) => {
  if (!channelId) return [];
  const { data } = await http.get(`/chat/channels/${channelId}/messages`);
  return data;
});

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    appendMessage(state, action) {
      state.messages.push(action.payload);
    },
    patchMessage(state, action) {
      const idx = state.messages.findIndex((m) => m.id === action.payload.id);
      if (idx >= 0) state.messages[idx] = action.payload;
    },
    removeMessage(state, action) {
      state.messages = state.messages.filter((m) => m.id !== action.payload.messageId);
    },
    setTyping(state, action) {
      const { userId, typing } = action.payload;
      state.typingUsers[userId] = typing;
    },
    clearMessages(state) {
      state.messages = [];
      state.typingUsers = {};
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMessagesThunk.fulfilled, (state, action) => {
      state.messages = action.payload;
    });
  }
});

export const { appendMessage, patchMessage, removeMessage, setTyping, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
