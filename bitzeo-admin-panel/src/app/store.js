import { configureStore } from "@reduxjs/toolkit";
import adminLoginReducer from "../redux/slices/adminLoginSlice";
import adminUser360Reducer from "../redux/slices/adminUser360Slice";
import adminUploadsReducer from "../redux/slices/adminUploadsSlice";

export const store = configureStore({
  reducer: {
    adminLogin: adminLoginReducer,
    adminUser360: adminUser360Reducer,
    adminUploads: adminUploadsReducer,
  },
});

export default store;
