import LegalPageLayout from "../../components/public/LegalPageLayout";
import SITE from "../../config/site";

const SECTIONS = [
  {
    title: "1. Introduction",
    body: "These Terms and Conditions (\"Terms\") govern your access to and use of the BharatPlay website, the BharatPlay Android application and related services (together, the \"Service\"). By accessing or using the Service, you agree to be bound by these Terms.",
  },
  {
    title: "2. Acceptance of Terms",
    body: "By creating an account, downloading the application or accessing the Service in any way, you confirm that you have read, understood and agreed to these Terms and to any additional policies referenced in them, including the Privacy Policy.",
  },
  {
    title: "3. Eligibility",
    body: "You must be at least 13 years old, or the minimum age required by the laws of your country, to use the Service. If you are using the Service on behalf of an organisation, you confirm that you have authority to bind that organisation to these Terms.",
  },
  {
    title: "4. Account Registration",
    body: "You may be required to create an account to use certain features of the Service. You agree to provide accurate and complete information when registering and to keep your account information up to date. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account.",
  },
  {
    title: "5. User Responsibilities",
    body: "You are responsible for your conduct while using the Service, for the content you submit, and for ensuring that your use complies with these Terms and with applicable laws and regulations.",
  },
  {
    title: "6. Acceptable Use",
    body: "You agree to use the Service only for lawful purposes and in a manner that does not infringe the rights of others or restrict anyone else's use and enjoyment of the Service.",
  },
  {
    title: "7. Prohibited Activities",
    body: "You agree not to: (a) use the Service for any unlawful purpose; (b) upload malicious software, harmful content or content that violates our content policies; (c) attempt to gain unauthorised access to other accounts or systems; (d) engage in spam, phishing or deceptive practices; (e) manipulate view counts, likes, points or other metrics; (f) harass, bully, threaten or defame other users; (g) infringe the intellectual property or privacy rights of others; or (h) interfere with the operation or security of the Service.",
  },
  {
    title: "8. User Content",
    body: "You retain ownership of the content you upload, post or share on the Service (\"User Content\"). By submitting User Content, you grant BharatPlay a worldwide, non-exclusive, royalty-free, sub-licensable and transferable licence to use, reproduce, modify, adapt, publish and distribute your content in connection with operating, promoting and improving the Service. You represent that you own or have the necessary rights to the User Content you submit.",
  },
  {
    title: "9. Intellectual Property",
    body: "The Service, including its design, trademarks, logos, software and other materials, is owned by or licensed to BharatPlay and is protected by applicable intellectual property laws. Except as expressly permitted by these Terms, you may not copy, modify, distribute, sell or exploit any part of the Service without prior written permission.",
  },
  {
    title: "10. Third-Party Services",
    body: "The Service may link to or integrate with third-party websites, applications or services, including authentication providers such as Google. BharatPlay is not responsible for the content, policies or practices of any third-party services. Your use of third-party services is governed by their own terms and privacy policies.",
  },
  {
    title: "11. Advertisements",
    body: "The Service may display advertisements and promotional content. Advertisements shown through the Service do not constitute an endorsement by BharatPlay of the advertised products or services.",
  },
  {
    title: "12. Service Availability",
    body: "We aim to keep the Service available at all times, but we do not guarantee uninterrupted or error-free availability. The Service may be unavailable from time to time for maintenance, upgrades or other reasons, and we may modify, suspend or discontinue features at any time.",
  },
  {
    title: "13. Changes and Updates",
    body: "We may update, change or replace parts of the Service and these Terms from time to time. We will take reasonable steps to notify you of material changes, but it is your responsibility to review the latest Terms before continuing to use the Service.",
  },
  {
    title: "14. Account Suspension",
    body: "We may suspend your access to the Service, with or without notice, if we reasonably believe you have violated these Terms or used the Service in a way that harms the Service or other users. During a suspension you may lose access to features, content or account data.",
  },
  {
    title: "15. Account Termination",
    body: "You may stop using the Service and delete your account at any time using the Account & Data Deletion page. We may also terminate or permanently close your account for repeated or serious violations of these Terms. Upon termination, your right to access and use the Service ceases, and we may delete your User Content in accordance with our data practices.",
  },
  {
    title: "16. Disclaimer",
    body: "The Service is provided \"as is\" and \"as available\" without warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose and non-infringement. BharatPlay does not warrant that the Service will be uninterrupted, secure or free of errors or viruses.",
  },
  {
    title: "17. Limitation of Liability",
    body: "To the fullest extent permitted by law, BharatPlay and its affiliates shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits, data, goodwill or other intangible losses, arising out of or related to your use of, or inability to use, the Service.",
  },
  {
    title: "18. Indemnification",
    body: "You agree to indemnify and hold harmless BharatPlay and its affiliates, officers, employees and agents from and against any claims, liabilities, damages, losses and expenses, including reasonable legal fees, arising out of or in any way connected with your use of the Service, your User Content, or your violation of these Terms or applicable law.",
  },
  {
    title: "19. Governing Law",
    body: "These Terms are governed by the laws of the jurisdiction in which BharatPlay is established, without regard to conflict of law principles. Any disputes will be subject to the exclusive jurisdiction of the courts in that jurisdiction, subject to any rights you may have under mandatory consumer protection laws.",
  },
  {
    title: "20. Changes to Terms",
    body: "We may revise these Terms at any time. The most current version will always be available on this page. If a revision is material, we will make reasonable efforts to notify you. Your continued use of the Service after any change constitutes acceptance of the revised Terms.",
  },
  {
    title: "21. Contact Information",
    body: SITE.supportEmail
      ? `If you have any questions about these Terms, you may contact us at ${SITE.supportEmail} or through the Contact page.`
      : "If you have any questions about these Terms, please contact us through the Contact page and a member of our team will respond.",
  },
];

export default function TermsConditionsPage() {
  return (
    <LegalPageLayout
      title="BharatPlay Terms & Conditions"
      description="Read the BharatPlay Terms & Conditions governing your use of the BharatPlay website, mobile application and services."
      intro="These Terms & Conditions set out the rules and responsibilities that apply when you access or use BharatPlay and its services."
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