import LegalPageLayout from "../../components/public/LegalPageLayout";
import SITE from "../../config/site";

const SECTIONS = [
  {
    title: "1. Purpose of This Policy",
    body: "This Content Policy sets out the types of content that are allowed and not allowed on BharatPlay. It works together with our Community Guidelines and Terms & Conditions.",
  },
  {
    title: "2. Allowed Content",
    body: "Users may upload original videos, creative content, educational material, entertainment, music (with proper rights), and other content that complies with applicable laws and our policies. Content should be suitable for a broad audience unless clearly marked otherwise.",
  },
  {
    title: "3. Prohibited Content",
    body: "The following types of content are not allowed: (a) illegal content; (b) content that promotes violence, terrorism or extremism; (c) child sexual exploitation material; (d) non-consensual intimate imagery; (e) hate speech and discriminatory content; (f) spam and scams; (g) content that infringes copyright or other intellectual property rights; (h) content that promotes self-harm or suicide; (i) highly graphic violence without clear context or educational purpose.",
  },
  {
    title: "4. Restricted Content",
    body: "Some content may be age-restricted or limited in distribution if it contains mature themes, strong language, or other sensitive material. We may apply age gates or reduced visibility where appropriate.",
  },
  {
    title: "5. Enforcement",
    body: "We review reported content and may remove material that violates this policy. Depending on the severity, we may issue warnings, restrict features, or permanently suspend accounts. Serious violations may be reported to law enforcement.",
  },
  {
    title: "6. Appeals",
    body: "If you believe your content was removed in error, you may appeal through the options provided in the notification or by contacting us. We will review appeals in good faith.",
  },
  {
    title: "7. Contact",
    body: SITE.supportEmail
      ? `For questions about this Content Policy, contact us at ${SITE.supportEmail}.`
      : "For questions about this Content Policy, please use the Contact page.",
  },
];

export default function ContentPolicyPage() {
  return (
    <LegalPageLayout
      title="BharatPlay Content Policy"
      description="Understand what content is allowed and not allowed on BharatPlay."
      intro="This Content Policy explains the standards that apply to all content uploaded or shared on BharatPlay."
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