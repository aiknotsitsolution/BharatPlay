import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: "idle",
  requiresOtp: false,
  error: null,
};

const adminLoginSlice = createSlice({
  name: "adminLogin",
  initialState,
  reducers: {
    submitStarted(state) {
      state.status = "pending";
      state.error = null;
    },
    otpRequested(state) {
      state.status = "idle";
      state.requiresOtp = true;
    },
    loginSucceeded(state) {
      state.status = "succeeded";
      state.requiresOtp = false;
      state.error = null;
    },
    submitFailed(state, action) {
      state.status = "failed";
      state.error = action.payload;
    },
    resetLogin(state) {
      state.status = "idle";
      state.requiresOtp = false;
      state.error = null;
    },
  },
});

export const {
  submitStarted,
  otpRequested,
  loginSucceeded,
  submitFailed,
  resetLogin,
} = adminLoginSlice.actions;

export default adminLoginSlice.reducer;
