import LegalPageLayout from "../../components/public/LegalPageLayout";
import SITE from "../../config/site";

const SECTIONS = [
  {
    title: "1. Introduction",
    body: 'These Terms & Conditions ("Terms") govern your access to and use of the BharatPlay website and Android application (together, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.',
  },
  {
    title: "2. Eligibility",
    body: "You must be at least 13 years of age (or the minimum age required in your jurisdiction) to create an account and use the Service. By using the Service, you represent that you meet this age requirement and have the legal capacity to enter into these Terms.",
  },
  {
    title: "3. Account Registration",
    body: "To access certain features, you must create an account. You agree to provide accurate information and keep your account credentials secure. You are responsible for all activity that occurs under your account. Notify us immediately of any unauthorised use.",
  },
  {
    title: "4. User Content",
    body: "You retain ownership of the content you upload (videos, comments, profile information, etc.). By uploading content, you grant BharatPlay a worldwide, non-exclusive, royalty-free licence to host, store, display, distribute and promote that content in connection with the Service. You are solely responsible for the content you post.",
  },
  {
    title: "5. Acceptable Use",
    body: "You agree not to use the Service to upload, post or share any content that is illegal, harmful, harassing, defamatory, pornographic, or that infringes the rights of others. You also agree not to interfere with the Service, attempt to gain unauthorised access, or engage in any activity that harms other users or BharatPlay.",
  },
  {
    title: "6. Prohibited Content and Conduct",
    body: "Prohibited content includes, but is not limited to: copyrighted material without permission, hate speech, violence, child sexual exploitation material, spam, scams, and content that promotes illegal activities. We may remove such content and suspend or terminate accounts that violate these rules.",
  },
  {
    title: "7. Intellectual Property",
    body: "The BharatPlay name, logo, design and all related intellectual property belong to us. You may not use our trademarks or branding without prior written permission. User content remains the property of the respective users, subject to the licence granted above.",
  },
  {
    title: "8. Copyright and DMCA",
    body: "We respect intellectual property rights. If you believe your copyrighted work has been uploaded without authorisation, please follow the process described in our Copyright Policy. We may remove infringing content and, in appropriate cases, terminate repeat infringers.",
  },
  {
    title: "9. Termination",
    body: "We may suspend or terminate your account at any time if you violate these Terms or if we believe it is necessary to protect the Service or other users. You may delete your account at any time through the Delete Account page. Upon termination, your right to use the Service ends immediately.",
  },
  {
    title: "10. Rewards, Advertising and Withdrawals",
    body: "BharatPlay may offer points or other in-app rewards for eligible activity, including approved rewarded-ad experiences. Rewards are promotional, have no guaranteed cash value until a withdrawal is approved, and may be limited, reversed, withheld, or removed for invalid activity, duplicate accounts, automation, fraud, chargebacks, policy violations, or technical errors. Conversion rates, minimum thresholds, supported payout methods, fees, regions, and processing times may change and are shown in the app when available. A withdrawal request is not a payment guarantee; payouts require an active BharatPlay account, successful verification, an available payout system, and final approval. Users must not encourage accidental ad clicks or use methods that manipulate ad measurement.",
  },
  {
    title: "11. Disclaimers",
    body: 'The Service is provided on an "as is" and "as available" basis. We do not guarantee that the Service will be uninterrupted, error-free or secure. To the maximum extent permitted by law, we disclaim all warranties, express or implied.',
  },
  {
    title: "12. Limitation of Liability",
    body: "To the maximum extent permitted by law, BharatPlay and its officers, directors and employees shall not be liable for any indirect, incidental, special, consequential or punitive damages arising out of your use of the Service.",
  },
  {
    title: "13. Changes to Terms",
    body: 'We may update these Terms from time to time. When we make material changes, we will update the "Last Updated" date and, where appropriate, notify you. Your continued use of the Service after changes take effect constitutes acceptance of the revised Terms.',
  },
  {
    title: "14. Governing Law",
    body: "These Terms are governed by the laws of India. Any disputes arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts in India.",
  },
  {
    title: "15. Contact Us",
    body: SITE.supportEmail
      ? `If you have questions about these Terms, you can contact us at ${SITE.supportEmail}.`
      : "If you have questions about these Terms, please use the Contact page to reach us.",
  },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="BharatPlay Terms & Conditions"
      description="Read the Terms & Conditions that govern your use of the BharatPlay website and mobile application."
      intro="These Terms & Conditions set out the rules for using BharatPlay. Please read them carefully."
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
