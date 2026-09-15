import { SettingsPageShell, SettingsPageHeader } from "../components/common/SettingsShared";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using Bharat Play (the \"Service\"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Service.",
  },
  {
    title: "2. User Accounts",
    body: "You must be at least 13 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating your account and to update it as necessary.",
  },
  {
    title: "3. User Content",
    body: "You retain ownership of any content you upload, post, or share on the Service (\"User Content\"). By submitting User Content, you grant Bharat Play a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content in connection with operating and improving the Service.",
  },
  {
    title: "4. Video Content",
    body: "Creators are solely responsible for the videos they upload. Videos must comply with our content policies and must not infringe on third-party intellectual property rights. Bharat Play reserves the right to remove content that violates these terms.",
  },
  {
    title: "5. Prohibited Activities",
    body: "You agree not to: (a) use the Service for any unlawful purpose; (b) upload malicious software or harmful content; (c) attempt to gain unauthorized access to other accounts or systems; (d) engage in spam, phishing, or deceptive practices; (e) manipulate view counts, likes, or other metrics; (f) harass, bully, or threaten other users.",
  },
  {
    title: "6. Intellectual Property",
    body: "All content, trademarks, logos, and software associated with the Service are the property of Bharat Play or its licensors. You may not use, copy, or distribute any part of the Service without prior written permission, except as permitted by applicable law.",
  },
  {
    title: "7. Privacy",
    body: "Your use of the Service is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information. By using the Service, you consent to the practices described in the Privacy Policy.",
  },
  {
    title: "8. Third-Party Services",
    body: "The Service may contain links to or integrations with third-party websites or services. Bharat Play is not responsible for the content, policies, or practices of any third-party services. Use of third-party services is at your own risk.",
  },
  {
    title: "9. Account Suspension & Termination",
    body: "Bharat Play reserves the right to suspend or terminate your account at any time, with or without notice, for conduct that violates these Terms or is otherwise harmful to the Service or other users. Upon termination, your right to use the Service ceases immediately.",
  },
  {
    title: "10. Disclaimers",
    body: "The Service is provided \"as is\" and \"as available\" without warranties of any kind, whether express or implied. Bharat Play does not guarantee that the Service will be uninterrupted, error-free, or secure.",
  },
  {
    title: "11. Limitation of Liability",
    body: "To the fullest extent permitted by law, Bharat Play shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service. Our total liability shall not exceed the amount you paid us in the twelve months preceding the claim.",
  },
  {
    title: "12. Changes to Terms",
    body: "We may update these Terms from time to time. When we make material changes, we will notify you through the Service or by email. Your continued use of the Service after such changes constitutes your acceptance of the updated Terms.",
  },
  {
    title: "13. Contact Information",
    body: "If you have questions about these Terms, please contact us through the Feedback or Customer Support pages available in the application.",
  },
];

export default function TermsPage() {
  return (
    <SettingsPageShell>
      <SettingsPageHeader title="Terms & Conditions" />

      <p className="mt-2 max-w-2xl text-sm text-zinc-500">
        Last updated: August 2025
      </p>

      <div className="mt-6 space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold text-zinc-200 sm:text-base">
              {section.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {section.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 text-center">
        <p className="text-xs text-zinc-600">
          This is a draft document. Legal content requires official review and
          approval before production use.
        </p>
      </div>
    </SettingsPageShell>
  );
}
