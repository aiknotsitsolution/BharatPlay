import { configureStore } from "@reduxjs/toolkit";
import profileReducer from "@/features/profile/profileSlice";
import videosReducer from "@/features/videos/videosSlice";
import notificationsReducer from "@/features/notifications/notificationsSlice";
import videoPageReducer from "@/features/video-page/videoPageSlice";
import uploadReducer from "@/features/upload/uploadSlice";

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    videos: videosReducer,
    notifications: notificationsReducer,
    videoPage: videoPageReducer,
    upload: uploadReducer,
  },
});

export default store;
