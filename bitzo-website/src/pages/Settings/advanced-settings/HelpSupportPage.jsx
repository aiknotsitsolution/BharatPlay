import { Link } from "react-router-dom";
import LegalPageLayout from "../../../components/public/LegalPageLayout";
import LegalContent from "../../../components/public/LegalContent";
import SITE from "../../../config/site";

const SECTIONS = [
  {
    title: "1. Getting Started",
    body: "Create an account using Google Sign-In (website) or Firebase Authentication (Android app). Once signed in, you can watch videos, subscribe to channels, like content, comment, and upload your own videos if the feature is available on your account.",
  },
  {
    title: "2. Uploading Videos",
    body: "To upload a video, go to the upload section, select your file, add a title, description and thumbnail, then publish. Make sure you have the rights to the content you upload. Large files may take time to process.",
  },
  {
    title: "3. Managing Your Account",
    body: "You can update your profile picture, display name and other settings from your account page. You can also manage watch history, favourites and watch-later lists.",
  },
  {
    title: "4. Reporting Problems",
    body: <>If you see content that violates our <Link to="/community-guidelines" className="text-blue-500 underline underline-offset-2 hover:text-blue-400">Community Guidelines</Link> or <Link to="/content-policy" className="text-blue-500 underline underline-offset-2 hover:text-blue-400">Content Policy</Link>, use the report button on the video, comment or channel. For technical issues (app crashes, login problems, playback errors), contact us with details of the problem and your device information.</>,
  },
  {
    title: "5. Account & Data Deletion",
    body: <>If you want to permanently delete your account and associated data, go to the <Link to="/delete-account" className="text-blue-500 underline underline-offset-2 hover:text-blue-400">Delete Account page</Link> and follow the instructions. This action cannot be undone.</>,
  },
  {
    title: "6. Still Need Help?",
    body: SITE.supportEmail
      ? `If you cannot find the answer you need, email us at ${SITE.supportEmail}. Please include as much detail as possible so we can assist you faster.`
      : "If you cannot find the answer you need, please use the Contact page and provide as much detail as possible.",
  },
];

export default function HelpSupportPage() {
  return (
    <LegalPageLayout
      title="Help & Support"
      description="Find answers to common questions about using BharatPlay and get support when you need it."
      intro="This page answers common questions and explains how to get help with BharatPlay."
      lastUpdated={SITE.legal.lastUpdated}
    >
      <LegalContent sections={SECTIONS} />
    </LegalPageLayout>
  );
}
