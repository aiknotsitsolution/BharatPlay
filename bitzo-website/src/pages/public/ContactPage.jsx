import LegalPageLayout from "../../components/public/LegalPageLayout";
import SITE from "../../config/site";

const SECTIONS = [
  {
    title: "How to Reach Us",
    body: SITE.supportEmail
      ? `You can contact the BharatPlay team by emailing us at ${SITE.supportEmail}. We aim to respond to genuine enquiries within a reasonable time.`
      : "You can contact the BharatPlay team through the form or options available on this page. We aim to respond to genuine enquiries within a reasonable time.",
  },
  {
    title: "What You Can Contact Us About",
    body: "You may contact us for account issues, privacy requests, copyright notices, content reports, technical problems, partnership enquiries, or general feedback about the Service.",
  },
  {
    title: "Privacy Requests",
    body: "If you wish to exercise privacy rights (access, correction, deletion, etc.), please mention \"Privacy Request\" in the subject line so we can route your message correctly.",
  },
  {
    title: "Copyright Notices",
    body: "For copyright-related notices, please follow the process described in our Copyright Policy and include all required information.",
  },
  {
    title: "Response Time",
    body: "We try to acknowledge messages as quickly as possible. Complex requests (especially legal or privacy-related) may take longer to process fully.",
  },
];

export default function ContactPage() {
  return (
    <LegalPageLayout
      title="Contact Us"
      description="Get in touch with the BharatPlay team for support, privacy requests, copyright notices and general enquiries."
      intro="We are here to help. Use the information below to reach the right team."
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