import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import API from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  loading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  error: string | null;
  successMessage: string | null;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface OnboardPayload {
  name: string;
  email: string;
  password: string;
  companyName: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
}

// FIX: was reading from localStorage before store was ready — safe fallback
const getPersistedAuth = (): Partial<AuthState> => {
  try {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const persisted = getPersistedAuth();

const initialState: AuthState = {
  loading: false,
  isAuthenticated: persisted.isAuthenticated ?? false,
  user: persisted.user ?? null,
  token: persisted.token ?? localStorage.getItem("token") ?? null,
  error: null,
  successMessage: null,
};

// FIX: use shared API instance (respects VITE_API_BASE_URL) instead of raw axios
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await API.post<LoginResponse>("/auth/login", credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || error.message || "Login failed"
      );
    }
  }
);

// FIX: renamed to onboardUser (was duplicated as registerUser with same type key causing RTK warning)
export const onboardUser = createAsyncThunk(
  "auth/onboardUser",
  async (userData: OnboardPayload, { rejectWithValue }) => {
    try {
      const response = await API.post("/auth/onboard", userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || error.message || "Registration failed"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      state.successMessage = null;
      localStorage.removeItem("token");
      localStorage.removeItem("auth");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token ?? null;
        state.error = null;
        // Persist token so API interceptor and ProtectedRoute both see it
        if (action.payload.token) {
          localStorage.setItem("token", action.payload.token);
          localStorage.setItem(
            "auth",
            JSON.stringify({ isAuthenticated: true, token: action.payload.token })
          );
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.error = action.payload as string;
      })
      .addCase(onboardUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(onboardUser.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = "Account created successfully! Please log in.";
      })
      .addCase(onboardUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAuthMessages, logout } = authSlice.actions;
export default authSlice.reducer;
