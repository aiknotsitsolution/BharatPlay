// import LegalPageLayout from "../../components/public/LegalPageLayout";
// import SITE from "../../config/site";

// const SECTIONS = [
//   {
//     title: "1. Introduction",
//     body: "This Privacy Policy explains how BharatPlay (\"we\", \"our\" or \"us\") collects, uses, stores, shares and protects information relating to users of the BharatPlay website and the BharatPlay Android application (together, the \"Service\"). By using the Service, you agree to the practices described in this policy.",
//   },
//   {
//     title: "2. Information We Collect",
//     body: "We collect information that you provide directly to us and information that is collected automatically when you use the Service. The exact categories of information we collect depend on how you use the Service.",
//   },
//   {
//     title: "3. Personal Information",
//     body: "When you create an account, we may collect personal information such as your name, email address, profile picture and other details you choose to provide. If you sign in using a supported identity provider, such as Google Sign-In used on the BharatPlay website, we receive the account information made available by that provider in accordance with your choices on that provider's platform.",
//   },
//   {
//     title: "4. Account Information",
//     body: "Account information includes your username, display name, email address, profile picture, and settings and preferences associated with your account, such as watch history, favourite and watch-later lists, channel information, and rewards or points balance.",
//   },
//   {
//     title: "5. Device and Technical Information",
//     body: "We may collect technical information about the device and browser you use to access the Service, including operating system, browser type, device identifiers, app version, network information and similar technical details needed to operate and secure the Service.",
//   },
//   {
//     title: "6. Usage Information",
//     body: "We may collect information about how you interact with the Service, such as the videos you watch, videos you upload, searches you perform, channels you follow, and other interactions. This helps us operate, personalise and improve the Service.",
//   },
//   {
//     title: "7. Cookies and Similar Technologies",
//     body: "We may use cookies and similar technologies to keep you signed in, remember your preferences, understand usage and help operate the Service. You can usually manage or disable cookies through your browser settings, but some features of the Service may not work as intended without them.",
//   },
//   {
//     title: "8. How We Use Information",
//     body: "We use the information we collect to provide, operate, maintain, personalise and improve the Service; to create and manage accounts; to process and display user content; to support rewards and other features; to communicate with you; to detect and prevent fraud, abuse or security incidents; and to comply with applicable laws.",
//   },
//   {
//     title: "9. Advertising",
//     body: "Where advertising is displayed through the Service, it is provided by us or through third-party advertising technologies, and these parties may use cookies or similar technologies. Where applicable, advertising partners may collect information about your device and your interactions to serve and measure advertisements. You can learn about your choices through your device or browser settings.",
//   },
//   {
//     title: "10. Analytics",
//     body: "We may use analytics, advertising or similar third-party technologies where applicable to operate, understand and improve our services. Any analytics providers we engage are used to help us understand aggregate usage patterns so we can improve the Service; we do not claim analytics practices beyond what is actually deployed.",
//   },
//   {
//     title: "11. Third-Party Services / SDKs",
//     body: "The Service may use third-party services and software development kits (SDKs) to support core functionality. For example, the BharatPlay website uses Google Sign-In for authentication, and the BharatPlay mobile application uses Firebase Authentication for sign-in and account-related features. These providers process data according to their own privacy policies and our instructions.",
//   },
//   {
//     title: "12. Data Sharing",
//     body: "We do not sell your personal information. We may share your information with service providers who help us operate the Service (for example, hosting, storage, authentication and communication services), with other users as required to provide the Service (such as publicly available profile and channel information), or where required or permitted by law.",
//   },
//   {
//     title: "13. Service Providers",
//     body: "We may engage trusted third-party providers to process information on our behalf. These providers are expected to handle your information with appropriate confidentiality and security and only for the purposes we authorise.",
//   },
//   {
//     title: "14. Data Retention",
//     body: "We retain your information for as long as needed to operate the Service, comply with legal obligations, resolve disputes and enforce our agreements. Content and data you delete may persist in backups or logs for a reasonable period before being removed.",
//   },
//   {
//     title: "15. Data Security",
//     body: "We use reasonable technical and organisational measures designed to protect your information against unauthorised access, alteration, disclosure or destruction. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
//   },
//   {
//     title: "16. Children's Privacy",
//     body: "The Service is not directed to children below the minimum age required to create an account (at least 13 years of age, or older if required by applicable law in your jurisdiction). We do not knowingly collect personal information from children under this age. If you believe a child has provided us with personal information, please contact us so we can take appropriate action.",
//   },
//   {
//     title: "17. User Privacy Rights",
//     body: "Depending on your location, you may have rights to access, correct, delete or restrict the processing of your personal information, and to object to certain processing. You can exercise many of these rights directly through your account settings or by contacting us using the details in the Contact Us section below.",
//   },
//   {
//     title: "18. Consent",
//     body: "By using the Service and providing us with your information, you consent to the collection, use and sharing of your information as described in this Privacy Policy.",
//   },
//   {
//     title: "19. Account & Data Deletion",
//     body: "You can request the deletion of your BharatPlay account and the personal information associated with it through the Account & Data Deletion page. We process deletion requests in accordance with applicable law. Some information may be retained where required by law or for legitimate business purposes, such as preventing fraud or fulfilling legal obligations.",
//   },
//   {
//     title: "20. Changes to Privacy Policy",
//     body: "We may update this Privacy Policy from time to time. When we make material changes, we will update the \"Last Updated\" date at the top of this page and, where appropriate, notify you through the Service. Your continued use of the Service after changes take effect constitutes your acceptance of the updated policy.",
//   },
//   {
//     title: "21. Contact Us",
//     body: SITE.supportEmail
//       ? `If you have any questions about this Privacy Policy or your personal information, you can reach us at ${SITE.supportEmail}. You may also use the Contact page to submit a privacy request.`
//       : "If you have any questions about this Privacy Policy or your personal information, please use the Contact page to submit a privacy request and a member of our team will respond.",
//   },
// ];

// export default function PrivacyPolicyPage() {
//   return (
//     <LegalPageLayout
//       title="BharatPlay Privacy Policy"
//       description="Read the BharatPlay Privacy Policy to understand what information we collect, how we use it, and how you can manage or delete your data."
//       intro="This Privacy Policy describes how BharatPlay collects, uses, stores and protects information in connection with the BharatPlay website and mobile application."
//       lastUpdated={SITE.legal.lastUpdated}
//     >
//       <div className="space-y-7">
//         {SECTIONS.map((section) => (
//           <section key={section.title}>
//             <h2 className="text-base font-semibold text-white sm:text-lg">
//               {section.title}
//             </h2>
//             <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
//               {section.body}
//             </p>
//           </section>
//         ))}
//       </div>
//     </LegalPageLayout>
//   );
// }

import LegalPageLayout from "../../components/public/LegalPageLayout";
import SITE from "../../config/site";

const SECTIONS = [
  {
    title: "1. Introduction",
    body: 'This Privacy Policy explains how BharatPlay ("we", "our" or "us") collects, uses, stores, shares and protects information relating to users of the BharatPlay website and the BharatPlay Android application (together, the "Service"). By using the Service, you agree to the practices described in this policy.',
  },
  {
    title: "2. Information We Collect",
    body: "We collect information that you provide directly to us and information that is collected automatically when you use the Service. The categories of information we collect are described below.",
  },
  {
    title: "3. Account Information",
    body: "When you create or use an account, we collect account information such as your username, display name, email address, profile picture, and account settings and preferences (including watch history, favourites, watch-later lists, channel information, and rewards or points balance).",
  },
  {
    title: "4. Email / Phone Number",
    body: "We collect your email address when you sign up or sign in. If you provide a phone number (for example during account recovery or verification), we collect and store that phone number as well. We do not require a phone number to use the Service unless you choose to provide one.",
  },
  {
    title: "5. Profile Information",
    body: "You may choose to provide additional profile information such as a display name, bio, profile picture, or other details you add to your public profile or channel. This information is visible to other users as part of the Service.",
  },
  {
    title: "6. Uploaded Videos and Content",
    body: "When you upload videos or other content, we collect and store the video files, titles, descriptions, thumbnails, tags, and any other metadata you provide. This content is processed and may be made publicly available according to the visibility settings you choose.",
  },
  {
    title: "7. Comments, Likes and Subscriptions",
    body: "We collect the comments you post, the videos and channels you like, and the channels you subscribe to or follow. This information is used to operate social features of the Service and may be visible to other users.",
  },
  {
    title: "8. Watch History and Usage Information",
    body: "We collect information about how you interact with the Service, including the videos you watch, searches you perform, channels you visit, and other actions you take. Watch history is stored as part of your account so we can provide personalised recommendations and resume playback.",
  },
  {
    title: "9. Device and App Information",
    body: "We collect technical information about the device and browser or app you use, including operating system, browser or app version, device model, device identifiers, network information, IP address, and similar technical details needed to operate, secure and improve the Service.",
  },
  {
    title: "10. Analytics",
    body: "We use analytics tools to understand how the Service is used (for example, which features are popular, crash reports, and aggregate usage patterns). This helps us improve performance and user experience. Analytics data is generally processed in aggregated or de-identified form where possible.",
  },
  {
    title: "11. Advertising and Advertising Identifiers",
    body: "Where advertising is shown on the Service, we or our advertising partners may use cookies, device advertising identifiers, or similar technologies to serve and measure ads. Depending on the app version, country, and enabled mediation configuration, advertising partners may include AppLovin MAX, Unity Ads, LevelPlay (ironSource), Mintegral, or other providers that we enable in the future. These partners may collect information about your device, approximate location, and interactions with ads. You can manage advertising preferences through your device or browser settings. Rewarded advertising does not guarantee a cash payment; any rewards are subject to the applicable program rules, fraud checks, eligibility, and available payout process.",
  },
  {
    title: "12. Third-Party Services and SDKs",
    body: "The Service uses third-party services and software development kits (SDKs). For example, the website uses Google Sign-In for authentication, and the Android app uses Firebase Authentication (and related Firebase services) for sign-in and account features. These providers process data according to their own privacy policies and our instructions. We may also use third-party SDKs for analytics, crash reporting, fraud prevention, or advertising where applicable. The exact providers enabled for a release will be listed in the relevant app-store disclosures and may vary by country or mediation setup.",
  },
  {
    title: "13. How We Use Information",
    body: "We use the information we collect to provide, operate, maintain, personalise and improve the Service; to create and manage accounts; to process and display user content (videos, comments, likes, subscriptions); to support rewards and other features; to communicate with you; to detect and prevent fraud, abuse or security incidents; and to comply with applicable laws.",
  },
  {
    title: "14. Data Sharing",
    body: "We do not sell your personal information. We may share information with: (a) service providers who help us operate the Service (hosting, storage, authentication, analytics, communication); (b) other users as required to provide the Service (publicly available profile, channel information, uploaded videos, comments, likes and subscriptions); and (c) where required or permitted by law (for example, to respond to legal requests or protect our rights).",
  },
  {
    title: "15. Data Security",
    body: "We use reasonable technical and organisational measures designed to protect your information against unauthorised access, alteration, disclosure or destruction. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
  },
  {
    title: "16. Data Retention",
    body: "We retain your information for as long as needed to operate the Service, comply with legal obligations, resolve disputes and enforce our agreements. Content and data you delete may remain in backups or logs for a reasonable period before permanent removal.",
  },
  {
    title: "17. Account and Data Deletion",
    body: "You can request deletion of your BharatPlay account and the personal information associated with it through the Account & Data Deletion page or by contacting us. We process deletion requests in accordance with applicable law. Some information may be retained where required by law or for legitimate business purposes (such as preventing fraud or fulfilling legal obligations).",
  },
  {
    title: "18. Children's Privacy",
    body: "The Service is not directed to children below the minimum age required to create an account (at least 13 years of age, or older if required by applicable law in your jurisdiction). We do not knowingly collect personal information from children under this age. If you believe a child has provided us with personal information, please contact us so we can take appropriate action.",
  },
  {
    title: "19. Your Privacy Rights",
    body: "Depending on your location, you may have rights to access, correct, delete or restrict the processing of your personal information, and to object to certain processing. You can exercise many of these rights directly through your account settings or by contacting us.",
  },
  {
    title: "20. Consent",
    body: "By using the Service and providing us with your information, you consent to the collection, use and sharing of your information as described in this Privacy Policy.",
  },
  {
    title: "21. Changes to This Privacy Policy",
    body: 'We may update this Privacy Policy from time to time. When we make material changes, we will update the "Last Updated" date at the top of this page and, where appropriate, notify you through the Service. Your continued use of the Service after changes take effect constitutes your acceptance of the updated policy.',
  },
  {
    title: "22. Contact Us",
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
