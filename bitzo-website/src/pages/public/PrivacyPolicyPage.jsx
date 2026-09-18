import LegalPageLayout from "../../components/public/LegalPageLayout";
import SITE from "../../config/site";

const SECTIONS = [
  {
    title: "1. Introduction",
    body: "This Privacy Policy explains how BharatPlay (\"we\", \"our\" or \"us\") collects, uses, stores, shares and protects information relating to users of the BharatPlay website and the BharatPlay Android application (together, the \"Service\"). By using the Service, you agree to the practices described in this policy.",
  },
  {
    title: "2. Information We Collect",
    body: "We collect information that you provide directly to us and information that is collected automatically when you use the Service. The exact categories of information we collect depend on how you use the Service.",
  },
  {
    title: "3. Personal Information",
    body: "When you create an account, we may collect personal information such as your name, email address, profile picture and other details you choose to provide. If you sign in using a supported identity provider, such as Google Sign-In used on the BharatPlay website, we receive the account information made available by that provider in accordance with your choices on that provider's platform.",
  },
  {
    title: "4. Account Information",
    body: "Account information includes your username, display name, email address, profile picture, and settings and preferences associated with your account, such as watch history, favourite and watch-later lists, channel information, and rewards or points balance.",
  },
  {
    title: "5. Device and Technical Information",
    body: "We may collect technical information about the device and browser you use to access the Service, including operating system, browser type, device identifiers, app version, network information and similar technical details needed to operate and secure the Service.",
  },
  {
    title: "6. Usage Information",
    body: "We may collect information about how you interact with the Service, such as the videos you watch, videos you upload, searches you perform, channels you follow, and other interactions. This helps us operate, personalise and improve the Service.",
  },
  {
    title: "7. Cookies and Similar Technologies",
    body: "We may use cookies and similar technologies to keep you signed in, remember your preferences, understand usage and help operate the Service. You can usually manage or disable cookies through your browser settings, but some features of the Service may not work as intended without them.",
  },
  {
    title: "8. How We Use Information",
    body: "We use the information we collect to provide, operate, maintain, personalise and improve the Service; to create and manage accounts; to process and display user content; to support rewards and other features; to communicate with you; to detect and prevent fraud, abuse or security incidents; and to comply with applicable laws.",
  },
  {
    title: "9. Advertising",
    body: "Where advertising is displayed through the Service, it is provided by us or through third-party advertising technologies, and these parties may use cookies or similar technologies. Where applicable, advertising partners may collect information about your device and your interactions to serve and measure advertisements. You can learn about your choices through your device or browser settings.",
  },
  {
    title: "10. Analytics",
    body: "We may use analytics, advertising or similar third-party technologies where applicable to operate, understand and improve our services. Any analytics providers we engage are used to help us understand aggregate usage patterns so we can improve the Service; we do not claim analytics practices beyond what is actually deployed.",
  },
  {
    title: "11. Third-Party Services / SDKs",
    body: "The Service may use third-party services and software development kits (SDKs) to support core functionality. For example, the BharatPlay website uses Google Sign-In for authentication, and the BharatPlay mobile application uses Firebase Authentication for sign-in and account-related features. These providers process data according to their own privacy policies and our instructions.",
  },
  {
    title: "12. Data Sharing",
    body: "We do not sell your personal information. We may share your information with service providers who help us operate the Service (for example, hosting, storage, authentication and communication services), with other users as required to provide the Service (such as publicly available profile and channel information), or where required or permitted by law.",
  },
  {
    title: "13. Service Providers",
    body: "We may engage trusted third-party providers to process information on our behalf. These providers are expected to handle your information with appropriate confidentiality and security and only for the purposes we authorise.",
  },
  {
    title: "14. Data Retention",
    body: "We retain your information for as long as needed to operate the Service, comply with legal obligations, resolve disputes and enforce our agreements. Content and data you delete may persist in backups or logs for a reasonable period before being removed.",
  },
  {
    title: "15. Data Security",
    body: "We use reasonable technical and organisational measures designed to protect your information against unauthorised access, alteration, disclosure or destruction. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
  },
  {
    title: "16. Children's Privacy",
    body: "The Service is not directed to children below the minimum age required to create an account (at least 13 years of age, or older if required by applicable law in your jurisdiction). We do not knowingly collect personal information from children under this age. If you believe a child has provided us with personal information, please contact us so we can take appropriate action.",
  },
  {
    title: "17. User Privacy Rights",
    body: "Depending on your location, you may have rights to access, correct, delete or restrict the processing of your personal information, and to object to certain processing. You can exercise many of these rights directly through your account settings or by contacting us using the details in the Contact Us section below.",
  },
  {
    title: "18. Consent",
    body: "By using the Service and providing us with your information, you consent to the collection, use and sharing of your information as described in this Privacy Policy.",
  },
  {
    title: "19. Account & Data Deletion",
    body: "You can request the deletion of your BharatPlay account and the personal information associated with it through the Account & Data Deletion page. We process deletion requests in accordance with applicable law. Some information may be retained where required by law or for legitimate business purposes, such as preventing fraud or fulfilling legal obligations.",
  },
  {
    title: "20. Changes to Privacy Policy",
    body: "We may update this Privacy Policy from time to time. When we make material changes, we will update the \"Last Updated\" date at the top of this page and, where appropriate, notify you through the Service. Your continued use of the Service after changes take effect constitutes your acceptance of the updated policy.",
  },
  {
    title: "21. Contact Us",
    body: SITE.supportEmail
      ? `If you have any questions about this Privacy Policy or your personal information, you can reach us at ${SITE.supportEmail}. You may also use the Contact page to submit a privacy request.`
      : "If you have any questions about this Privacy Policy or your personal information, please use the Contact page to submit a privacy request and a member of our team will respond.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="BharatPlay Privacy Policy"
      description="Read the BharatPlay Privacy Policy to understand what information we collect, how we use it, and how you can manage or delete your data."
      intro="This Privacy Policy describes how BharatPlay collects, uses, stores and protects information in connection with the BharatPlay website and mobile application."
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