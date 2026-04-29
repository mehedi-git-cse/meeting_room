import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { http, setAuthHeader } from "../../api/http";

const refreshKey = "openmeeting_refresh";

const initialState = {
  user: null,
  accessToken: null,
  loading: false,
  error: null
};

export const loginThunk = createAsyncThunk("auth/login", async (payload) => {
  const { data } = await http.post("/auth/login", payload);
  localStorage.setItem(refreshKey, data.refreshToken);
  return data;
});

export const registerThunk = createAsyncThunk("auth/register", async (payload) => {
  const { data } = await http.post("/auth/register", payload);
  localStorage.setItem(refreshKey, data.refreshToken);
  return data;
});

export const bootstrapAuthThunk = createAsyncThunk("auth/bootstrap", async () => {
  const refreshToken = localStorage.getItem(refreshKey);
  if (!refreshToken) {
    return null;
  }

  const { data } = await http.post("/auth/refresh", { refreshToken });
  localStorage.setItem(refreshKey, data.refreshToken);
  setAuthHeader(data.accessToken);

  const me = await http.get("/users/me");
  return { ...data, user: me.data };
});

export const logoutThunk = createAsyncThunk("auth/logout", async (_, { getState }) => {
  const refreshToken = localStorage.getItem(refreshKey);
  if (refreshToken) {
    await http.post("/auth/logout", { refreshToken });
  }

  localStorage.removeItem(refreshKey);
  const { auth } = getState();
  return { previousUser: auth.user };
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        setAuthHeader(action.payload.accessToken);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        setAuthHeader(action.payload.accessToken);
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(bootstrapAuthThunk.fulfilled, (state, action) => {
        if (!action.payload) {
          return;
        }

        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        setAuthHeader(action.payload.accessToken);
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        setAuthHeader(null);
      });
  }
});

export default authSlice.reducer;
