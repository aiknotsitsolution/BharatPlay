import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: "idle",
  progress: 0,
  error: null,
};

const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {
    uploadStarted: (state) => {
      state.status = "uploading";
      state.progress = 0;
      state.error = null;
    },
    uploadProgressUpdated: (state, action) => {
      state.progress = Math.min(100, Math.max(0, Number(action.payload) || 0));
    },
    uploadSucceeded: (state) => {
      state.status = "succeeded";
      state.progress = 100;
      state.error = null;
    },
    uploadFailed: (state, action) => {
      state.status = "failed";
      state.error = action.payload || "Upload failed. Please try again.";
    },
    uploadReset: () => initialState,
  },
});

export const {
  uploadStarted,
  uploadProgressUpdated,
  uploadSucceeded,
  uploadFailed,
  uploadReset,
} = uploadSlice.actions;

export default uploadSlice.reducer;
