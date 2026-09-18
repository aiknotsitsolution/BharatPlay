import { useEffect } from "react";

/**
 * Lightweight page-level SEO helper.
 * Sets <title> and <meta name="description"> for the current page. No extra
 * packages required. Falls back to a default meta tag already present in
 * index.html when a description is not supplied.
 */
export default function usePageMeta(title, description) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;

    let metaTag = document.querySelector('meta[name="description"]');
    let previousDescription = "";
    if (metaTag) previousDescription = metaTag.content;

    if (description) {
      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.name = "description";
        document.head.appendChild(metaTag);
      }
      metaTag.content = description;
    }

    return () => {
      document.title = previousTitle;
      if (metaTag && previousDescription) {
        metaTag.content = previousDescription;
      }
    };
  }, [title, description]);
}