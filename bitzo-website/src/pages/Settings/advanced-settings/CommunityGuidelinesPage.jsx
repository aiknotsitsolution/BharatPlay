import { Link } from "react-router-dom";
import LegalPageLayout from "../../../components/public/LegalPageLayout";
import LegalContent from "../../../components/public/LegalContent";
import SITE from "../../../config/site";

const SECTIONS = [
  {
    title: "1. Be Respectful",
    body: "Treat other users with respect. Do not harass, bully, threaten or demean anyone. Personal attacks, hate speech and discrimination of any kind are not allowed.",
  },
  {
    title: "2. Keep It Legal",
    body: "Do not post content that is illegal under Indian law or that promotes illegal activities. This includes content related to drugs, weapons, fraud, or any criminal activity.",
  },
  {
    title: "3. No Hate Speech or Violence",
    body: "Content that promotes hatred, violence or discrimination based on caste, religion, gender, race, nationality, disability or any other protected characteristic is strictly prohibited.",
  },
  {
    title: "4. Protect Children",
    body: "Any content that exploits, endangers or sexualises minors is strictly forbidden and will result in immediate account termination and reporting to authorities where required.",
  },
  {
    title: "5. Respect Intellectual Property",
    body: <>Only upload content that you own or have permission to use. Do not upload copyrighted videos, music or other material without proper rights. Repeated <Link to="/copyright-policy" className="text-blue-500 underline underline-offset-2 hover:text-blue-400">copyright violations</Link> may lead to account termination.</>,
  },
  {
    title: "6. No Spam or Scams",
    body: "Do not post spam, repetitive comments, misleading links, phishing attempts or any form of scam. Do not use the Service to promote pyramid schemes or fraudulent offers.",
  },
  {
    title: "7. Authentic Content",
    body: "Do not impersonate other people or organisations. Do not spread false information with the intent to deceive. Misinformation that can cause real-world harm may be removed.",
  },
  {
    title: "8. Stay Safe",
    body: "Do not share personal information of others without consent. Do not encourage or engage in self-harm, suicide or dangerous challenges. If you see content that suggests someone is in danger, report it.",
  },
  {
    title: "9. Reporting Violations",
    body: "If you see content or behaviour that violates these guidelines, use the report feature available on videos, comments and channels. Our team reviews reports and takes action as needed.",
  },
  {
    title: "10. Consequences",
    body: "Violations may result in content removal, temporary restrictions, or permanent account termination depending on the severity and frequency of the violation. Serious violations may also be reported to law enforcement.",
  },
  {
    title: "11. Questions",
    body: SITE.supportEmail
      ? `If you have questions about these Community Guidelines, contact us at ${SITE.supportEmail}.`
      : "If you have questions about these Community Guidelines, please use the Contact page.",
  },
];

export default function CommunityGuidelinesPage() {
  return (
    <LegalPageLayout
      title="BharatPlay Community Guidelines"
      description="Learn the rules that help keep the BharatPlay community safe, respectful and enjoyable for everyone."
      intro="These Community Guidelines explain what is and is not allowed on BharatPlay so that everyone can have a positive experience."
      lastUpdated={SITE.legal.lastUpdated}
    >
      <LegalContent sections={SECTIONS} />
    </LegalPageLayout>
  );
}
