import LegalPageLayout from "../../components/public/LegalPageLayout";
import SITE from "../../config/site";

const SECTIONS = [
  {
    title: "1. What Happens When You Delete Your Account",
    body: "Deleting your BharatPlay account will permanently remove your profile, uploaded videos, comments, likes, subscriptions, watch history and other personal data associated with the account, subject to the exceptions described below.",
  },
  {
    title: "2. Data That May Be Retained",
    body: "Some information may be retained for a limited period where required by law, for security and fraud prevention, or for legitimate business purposes (for example, records of previous transactions or legal notices). Backups may also retain data for a short time before permanent deletion.",
  },
  {
    title: "3. How to Request Account Deletion",
    body: "You can request account deletion through the dedicated option in your account settings (if available) or by contacting us. Please use the email associated with your account so we can verify your identity.",
  },
  {
    title: "4. Verification",
    body: "To protect your account, we may ask you to verify your identity before processing a deletion request. This helps prevent unauthorised deletion by someone else.",
  },
  {
    title: "5. Processing Time",
    body: "We aim to process account deletion requests within a reasonable time after verification. You will receive confirmation once the process is complete or if we need additional information.",
  },
  {
    title: "6. Contact for Deletion Requests",
    body: SITE.supportEmail
      ? `To request deletion of your account, email us at ${SITE.supportEmail} with the subject line \"Account Deletion Request\" and include the email address linked to your account.`
      : "To request deletion of your account, please use the Contact page and clearly state that you wish to delete your account.",
  },
];

export default function DeleteAccountPage() {
  return (
    <LegalPageLayout
      title="Delete Account"
      description="Learn how to permanently delete your BharatPlay account and associated data."
      intro="This page explains what happens when you delete your account and how to submit a deletion request."
      lastUpdated={SITE.legal.lastUpdated}
    >
      <div className="space-y-7">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-semibold text-white sm:text-lg">
              {section.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </LegalPageLayout>
  );
}