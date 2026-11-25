import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import MainLayout from "@/components/layout/MainLayout";
import ProtectedLayout from "./ProtectedRoute";
import PublicLayout from "@/components/public/PublicLayout";

const Home = lazy(() => import("@/pages/Home"));
const Shorts = lazy(() => import("@/pages/Shorts"));
const Trending = lazy(() => import("@/pages/Trending"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const WatchPage = lazy(() => import("@/components/common/WatchPage"));
const WithdrawPage = lazy(() => import("@/components/common/WithdrawPage"));
const UploadVideo = lazy(() => import("@/pages/upload/UploadVideoScreen"));
const Profile = lazy(() => import("@/pages/MyProfile"));
const ReelPlayerPage = lazy(
  () => import("@/components/common/ReelPlayerPage"),
);
const FullVideo = lazy(() => import("@/pages/video/FullVideo"));
const AuthPageV2 = lazy(() => import("@/pages/auth/AuthPageV2"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const WatchHistoryTab = lazy(
  () => import("@/pages/Settings/WatchHistoryTab"),
);
const LikedVideosTab = lazy(() => import("@/pages/Settings/LikedVideosTab"));
const YourVideosTab = lazy(() => import("@/pages/Settings/YourVideosTab"));
const WatchLaterTab = lazy(() => import("@/pages/Settings/WatchLaterTab"));
const ChannelPage = lazy(() => import("@/components/channels/ChannelPage"));
const ChannelCustomization = lazy(
  () => import("@/components/channels/ChannelCustomization"),
);
const Leaderboard = lazy(() => import("@/pages/Settings/Leaderboard"));
const SubscribedChannels = lazy(
  () => import("@/pages/upload/SubscribedChannels"),
);
const ViewAll = lazy(() => import("@/pages/ViewAll"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const CopyrightPage = lazy(() => import("@/pages/CopyrightPage"));
const CopyrightClaimPage = lazy(() => import("@/pages/CopyrightClaimPage"));
const MyClaimsPage = lazy(() => import("@/pages/MyClaimsPage"));
const FAQPage = lazy(() => import("@/pages/FAQPage"));
const FeedbackPage = lazy(() => import("@/pages/FeedbackPage"));
const VidBuxAppStudio = lazy(() => import("@/pages/Studio/VidBuxAppStudio"));
const MySupportRequests = lazy(() => import("@/pages/MySupportRequests"));
const HomePage = lazy(() => import("@/pages/public-site/HomePage"));
const AboutPage = lazy(() => import("@/pages/public-site/AboutPage"));
const PrivacyPolicyPage = lazy(
  () => import("@/pages/public-site/PrivacyPolicyPage"),
);
const TermsConditionsPage = lazy(
  () => import("@/pages/public-site/TermsConditionsPage"),
);
const ContactPage = lazy(() => import("@/pages/public-site/ContactPage"));
const DeleteAccountPage = lazy(
  () => import("@/pages/public-site/DeleteAccountPage"),
);
const AppsPage = lazy(() => import("@/pages/public-site/AppsPage"));
const CommunityGuidelinesPage = lazy(
  () => import("@/pages/public-site/CommunityGuidelinesPage"),
);
const ContentPolicyPage = lazy(
  () => import("@/pages/public-site/ContentPolicyPage"),
);
const CopyrightPolicyPage = lazy(
  () => import("@/pages/public-site/CopyrightPolicyPage"),
);
const HelpSupportPage = lazy(
  () => import("@/pages/public-site/HelpSupportPage"),
);
const ForBusinessPage = lazy(
  () => import("@/pages/public-site/ForBusinessPage"),
);
const DevelopersPage = lazy(
  () => import("@/pages/public-site/DevelopersPage"),
);
const AdvertisingPage = lazy(
  () => import("@/pages/public-site/AdvertisingPage"),
);

function ViewAllRoute() {
  const { type } = useParams();
  const selectedCategory = useSelector(
    (state) => state.videos.selectedCategory,
  );
  return <ViewAll key={`${type}-${selectedCategory || "all"}`} />;
}

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f0f0f] text-white grid place-items-center">
          Loading...
        </div>
      }
    >
      <Routes>
      {/* PUBLIC COMPANY SITE — no authentication required */}
      <Route element={<PublicLayout />}>
        <Route path="advanced-settings" element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="terms" element={<TermsConditionsPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="delete-account" element={<DeleteAccountPage />} />
        <Route path="apps" element={<AppsPage />} />
        <Route
          path="community-guidelines"
          element={<CommunityGuidelinesPage />}
        />
        <Route path="content-policy" element={<ContentPolicyPage />} />
        <Route path="copyright-policy" element={<CopyrightPolicyPage />} />
        <Route path="help-support" element={<HelpSupportPage />} />
        <Route path="for-business" element={<ForBusinessPage />} />
        <Route path="developers" element={<DevelopersPage />} />
        <Route path="advertising" element={<AdvertisingPage />} />
        {/* Kept for backwards compatibility */}
        <Route path="terms-and-conditions" element={<TermsConditionsPage />} />
      </Route>

      {/* OLD LOGIN DESIGN — KEPT FOR EASY ROLLBACK */}
      {/* <Route path="/login" element={<AuthPage />} /> */}

      {/* NEW LOGIN DESIGN — 3D + GLASSMORPHISM */}
      <Route path="/login" element={<AuthPageV2 />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="shorts" element={<Shorts />} />
        <Route path="shorts/:id" element={<Shorts />} />
        <Route path="video/:id" element={<FullVideo />} />
        <Route path="videos/:type" element={<ViewAllRoute />} />
        <Route path="channel/:id" element={<ChannelPage />} />
      </Route>

      <Route element={<ProtectedLayout />}>
        <Route element={<MainLayout />}>
          <Route path="trending" element={<Trending />} />
          <Route path="watch/:id" element={<WatchPage />} />
          <Route path="withdraw" element={<WithdrawPage />} />
          <Route path="uploadvideo" element={<UploadVideo />} />
          <Route path="reel" element={<ReelPlayerPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="subscribechannel/:id" element={<SubscribedChannels />} />

          <Route path="history" element={<WatchHistoryTab />} />
          <Route path="liked-videos" element={<LikedVideosTab />} />
          <Route path="watch-later" element={<WatchLaterTab />} />
          <Route path="your-videos" element={<YourVideosTab />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="channel/customize" element={<ChannelCustomization />} />
          <Route path="copyright" element={<CopyrightPage />} />
          <Route path="copyright/claim" element={<CopyrightClaimPage />} />
          <Route path="copyright/my-claims" element={<MyClaimsPage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route
            path="customer-support"
            element={<Navigate to="/contact" replace />}
          />
          <Route path="studio" element={<VidBuxAppStudio />} />
          <Route path="my-support-requests" element={<MySupportRequests />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
