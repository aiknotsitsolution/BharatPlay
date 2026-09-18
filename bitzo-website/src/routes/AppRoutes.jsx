import { Routes, Route, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import MainLayout from "../components/layout/MainLayout";
import ProtectedLayout from "../pages/Login.jsx/ProtectiveRoute/ProtectedRoute";
import Home from "../pages/Home";
import Shorts from "../pages/Shorts";
import Trending from "../pages/Trending";
import NotFound from "../pages/NotFound";
import WatchPage from "../components/common/WatchPage";
import WithdrawPage from "../components/common/WithdrawPage";
import UploadVideo from "../pages/UploadVideo/UploadVideoScreen";
import Profile from "../pages/MyProfile";
import ReelPlayerPage from "../components/common/ReelPlayerPage";
import FullVideo from "../pages/UploadVideo/FullVideo";

// OLD LOGIN DESIGN — KEPT FOR EASY ROLLBACK
// import AuthPage from "../pages/Login.jsx/AuthPage";

// NEW LOGIN DESIGN — 3D + GLASSMORPHISM
import AuthPageV2 from "../pages/LoginV2/AuthPageV2";
import ForgotPassword from "../pages/LoginV2/ForgotPassword";
import WatchHistoryTab from "../pages/Settings/WatchHistoryTab";
import LikedVideosTab from "../pages/Settings/LikedVideosTab";
import YourVideosTab from "../pages/Settings/YourVideosTab";
import WatchLaterTab from "../pages/Settings/WatchLaterTab";
import ChannelPage from "../components/channels/ChannelPage";
import ChannelCustomization from "../components/channels/ChannelCustomization";
import Leaderboard from "../pages/Settings/Leaderboard";
import SubscribedChannels from "../pages/UploadVideo/SubscribedChannels";
import ViewAll from "../pages/ViewAll";
import SearchPage from "../pages/SearchPage";
import CopyrightPage from "../pages/CopyrightPage";
import CopyrightClaimPage from "../pages/CopyrightClaimPage";
import MyClaimsPage from "../pages/MyClaimsPage";
import FAQPage from "../pages/FAQPage";
import FeedbackPage from "../pages/FeedbackPage";
import SupportPage from "../pages/SupportPage";
import BharatPlayStudio from "../pages/Studio/BharatPlayStudio";

// Public company website
import PublicLayout from "../components/public/PublicLayout";
import HomePage from "../pages/public/HomePage";
import AboutPage from "../pages/public/AboutPage";
import PrivacyPolicyPage from "../pages/public/PrivacyPolicyPage";
import TermsConditionsPage from "../pages/public/TermsConditionsPage";
import ContactPage from "../pages/public/ContactPage";
import DeleteAccountPage from "../pages/public/DeleteAccountPage";
import AppsPage from "../pages/public/AppsPage";

function ViewAllRoute() {
  const { type } = useParams();
  const selectedCategory = useSelector(
    (state) => state.videos.selectedCategory,
  );
  return <ViewAll key={`${type}-${selectedCategory || "all"}`} />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC COMPANY SITE — no authentication required */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="terms" element={<TermsConditionsPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="delete-account" element={<DeleteAccountPage />} />
        <Route path="apps" element={<AppsPage />} />
        {/* Kept for backwards compatibility */}
        <Route path="terms-and-conditions" element={<TermsConditionsPage />} />
      </Route>

      {/* OLD LOGIN DESIGN — KEPT FOR EASY ROLLBACK */}
      {/* <Route path="/login" element={<AuthPage />} /> */}

      {/* NEW LOGIN DESIGN — 3D + GLASSMORPHISM */}
      <Route path="/login" element={<AuthPageV2 />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedLayout />}>
        <Route element={<MainLayout />}>
          <Route path="home" element={<Home />} />
          <Route path="shorts" element={<Shorts />} />
          <Route path="shorts/:id" element={<Shorts />} />
          <Route path="trending" element={<Trending />} />
          <Route path="watch/:id" element={<WatchPage />} />
          <Route path="withdraw" element={<WithdrawPage />} />
          <Route path="uploadvideo" element={<UploadVideo />} />
          <Route path="reel" element={<ReelPlayerPage />} />
          <Route path="videos/:type" element={<ViewAllRoute />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="video/:id" element={<FullVideo />} />
          <Route path="profile" element={<Profile />} />
          <Route path="subscribechannel/:id" element={<SubscribedChannels />} />

          <Route path="history" element={<WatchHistoryTab />} />
          <Route path="liked-videos" element={<LikedVideosTab />} />
          <Route path="watch-later" element={<WatchLaterTab />} />
          <Route path="your-videos" element={<YourVideosTab />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="channel/:id" element={<ChannelPage />} />
          <Route path="channel/customize" element={<ChannelCustomization />} />
          <Route path="copyright" element={<CopyrightPage />} />
          <Route path="copyright/claim" element={<CopyrightClaimPage />} />
          <Route path="copyright/my-claims" element={<MyClaimsPage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="customer-support" element={<SupportPage />} />
          <Route path="studio" element={<BharatPlayStudio />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
