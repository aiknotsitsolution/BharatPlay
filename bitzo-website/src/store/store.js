import { configureStore } from "@reduxjs/toolkit";
import profileReducer from "../features/profile/profileSlice";
import videosReducer from "../features/videos/videosSlice";
import notificationsReducer from "../features/notifications/notificationsSlice";
import videoPageReducer from "../features/videoPage/videoPageSlice";

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    videos: videosReducer,
    notifications: notificationsReducer,
    videoPage: videoPageReducer,
  },
});

export default store;
