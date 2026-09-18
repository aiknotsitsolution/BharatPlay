import LegalPageLayout from "../../components/public/LegalPageLayout";
import SITE from "../../config/site";

const SECTIONS = [
  {
    title: "1. Respect for Copyright",
    body: "BharatPlay respects the intellectual property rights of others and expects users to do the same. Uploading content that you do not own or have permission to use is a violation of our Terms and may lead to removal of the content and account action.",
  },
  {
    title: "2. What is Copyright Infringement?",
    body: "Copyright infringement occurs when someone uses copyrighted material (such as videos, music, images or text) without the permission of the copyright owner. This includes uploading full movies, TV shows, songs or other protected works without authorisation.",
  },
  {
    title: "3. How to Report Copyright Infringement",
    body: "If you believe that your copyrighted work has been uploaded to BharatPlay without authorisation, please send a notice containing the following information to the contact details below: (a) a description of the copyrighted work; (b) the URL or location of the allegedly infringing material on BharatPlay; (c) your contact information; (d) a statement that you have a good-faith belief that the use is not authorised; (e) a statement that the information in the notice is accurate; and (f) your signature (physical or electronic).",
  },
  {
    title: "4. Counter-Notification",
    body: "If your content was removed due to a copyright notice and you believe the removal was a mistake or that you have the right to use the material, you may submit a counter-notification. Include your contact details, identification of the removed content, and a statement under penalty of perjury that you have a good-faith belief the content was removed by mistake.",
  },
  {
    title: "5. Repeat Infringers",
    body: "BharatPlay will terminate the accounts of users who are determined to be repeat copyright infringers in appropriate circumstances.",
  },
  {
    title: "6. Contact for Copyright Notices",
    body: SITE.supportEmail
      ? `Please send copyright-related notices to ${SITE.supportEmail} with the subject line \"Copyright Notice\".`
      : "Please use the Contact page and select the copyright-related option to submit a notice.",
  },
];

export default function CopyrightPolicyPage() {
  return (
    <LegalPageLayout
      title="BharatPlay Copyright Policy"
      description="Learn how BharatPlay handles copyright and how to report alleged copyright infringement."
      intro="This Copyright Policy explains how we handle copyright claims and the process for reporting and responding to alleged infringement."
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