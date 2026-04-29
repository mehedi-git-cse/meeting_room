import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { http } from "../../api/http";

const initialState = {
  servers: [],
  channels: [],
  currentServerId: null,
  currentChannelId: null
};

export const fetchServersThunk = createAsyncThunk("servers/fetchAll", async () => {
  const { data } = await http.get("/servers");
  return data;
});

export const fetchChannelsThunk = createAsyncThunk("servers/fetchChannels", async (serverId) => {
  const { data } = await http.get(`/servers/${serverId}/channels`);
  return { serverId, channels: data };
});

export const createChannelThunk = createAsyncThunk("servers/createChannel", async ({ serverId, name, type }) => {
  const { data } = await http.post(`/servers/${serverId}/channels`, { name, type });
  return data;
});

export const createServerThunk = createAsyncThunk("servers/createServer", async ({ name }) => {
  const { data } = await http.post("/servers", { name });
  return data;
});

export const addMemberThunk = createAsyncThunk("servers/addMember", async ({ serverId, username }, { rejectWithValue }) => {
  try {
    const { data } = await http.post(`/servers/${serverId}/members`, { username });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to add member");
  }
});

const serversSlice = createSlice({
  name: "servers",
  initialState,
  reducers: {
    setCurrentServer(state, action) {
      state.currentServerId = action.payload;
      state.currentChannelId = null;
    },
    setCurrentChannel(state, action) {
      state.currentChannelId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServersThunk.fulfilled, (state, action) => {
        state.servers = action.payload;
        if (!state.currentServerId && action.payload.length) {
          state.currentServerId = action.payload[0].id;
        }
      })
      .addCase(fetchChannelsThunk.fulfilled, (state, action) => {
        state.channels = action.payload.channels;
        if (!state.currentChannelId && action.payload.channels.length) {
          state.currentChannelId = action.payload.channels[0].id;
        }
      })
      .addCase(createChannelThunk.fulfilled, (state, action) => {
        state.channels.push(action.payload);
      })
      .addCase(createServerThunk.fulfilled, (state, action) => {
        state.servers.push(action.payload);
        state.currentServerId = action.payload.id;
        state.channels = action.payload.channels || [];
        state.currentChannelId = null;
      });
  }
});

export const { setCurrentServer, setCurrentChannel } = serversSlice.actions;
export default serversSlice.reducer;
