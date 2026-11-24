import { configureStore } from "@reduxjs/toolkit";
import adminLoginReducer from "./slices/adminLoginSlice";
import adminUser360Reducer from "./slices/adminUser360Slice";
import adminUploadsReducer from "./slices/adminUploadsSlice";

export const store = configureStore({
  reducer: {
    adminLogin: adminLoginReducer,
    adminUser360: adminUser360Reducer,
    adminUploads: adminUploadsReducer,
  },
});

export default store;
