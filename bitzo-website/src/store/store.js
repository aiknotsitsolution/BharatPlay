import { configureStore } from "@reduxjs/toolkit";
import profileReducer from "../features/profile/profileSlice";
import videosReducer from "../features/videos/videosSlice";
import notificationsReducer from "../features/notifications/notificationsSlice";

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    videos: videosReducer,
    notifications: notificationsReducer,
  },
});

export default store;
