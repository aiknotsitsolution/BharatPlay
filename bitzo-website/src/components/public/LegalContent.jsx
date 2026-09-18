import usePageMeta from "../../hooks/usePageMeta";
import { useTheme } from "../../context/ThemeContext";

export default function LegalContent({
  title,
  description,
  intro,
  lastUpdated,
  sections,
}) {
  usePageMeta(title, description);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="space-y-7">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className={`text-base font-semibold sm:text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
            {section.title}
          </h2>
          <div className={`mt-2 text-sm leading-relaxed sm:text-[15px] ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
            {section.body}
          </div>
        </section>
      ))}
    </div>
  );
}
