import { useEffect } from "react";
import { ISSUEHIVE_CREATOR, SEO, buildTitle } from "@/lib/seo";

type SeoProps = {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

export default function Seo({
  title,
  description,
  path,
  keywords,
  ogImage,
  noIndex,
  jsonLd,
}: SeoProps) {
  const fullTitle = buildTitle(title);
  const metaDescription = description || SEO.defaultDescription;
  const keywordList = (keywords || SEO.keywords).join(", ");
  const pageUrl = path ? `${SEO.baseUrl}${path}` : `${SEO.baseUrl}/`;
  const imageUrl = ogImage ? `${SEO.baseUrl}${ogImage}` : `${SEO.baseUrl}${SEO.ogImage}`;

  const jsonLdArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  const routeStructuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        name: fullTitle,
        url: pageUrl,
        description: metaDescription,
        inLanguage: "en-NP",
        author: { "@id": `${SEO.baseUrl}/#creator` },
        isPartOf: { "@id": `${SEO.baseUrl}/#website` },
      },
      ...jsonLdArray,
    ],
  });

  useEffect(() => {
    const previousTitle = document.title;
    const previousValues: Array<() => void> = [];

    const updateMeta = (attribute: "name" | "property", key: string, content: string) => {
      const selector = `meta[${attribute}="${key}"]`;
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      const existed = element !== null;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      const previousContent = element.getAttribute("content");
      element.setAttribute("content", content);
      previousValues.push(() => {
        if (existed && previousContent !== null) {
          element?.setAttribute("content", previousContent);
        } else {
          element?.remove();
        }
      });
    };

    const updateCanonical = () => {
      let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      const existed = element !== null;
      if (!element) {
        element = document.createElement("link");
        element.rel = "canonical";
        document.head.appendChild(element);
      }
      const previousHref = element.href;
      element.href = pageUrl;
      previousValues.push(() => {
        if (existed) {
          element?.setAttribute("href", previousHref);
        } else {
          element?.remove();
        }
      });
    };

    document.title = fullTitle;
    updateMeta("name", "description", metaDescription);
    updateMeta("name", "keywords", keywordList);
    updateMeta("name", "author", ISSUEHIVE_CREATOR.name);
    updateMeta("name", "geo.region", "NP");
    updateMeta("name", "geo.placename", "Nepal");
    updateMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    updateCanonical();

    const socialMetadata: Array<[ "name" | "property", string, string ]> = [
      ["property", "og:title", fullTitle],
      ["property", "og:description", metaDescription],
      ["property", "og:type", "website"],
      ["property", "og:url", pageUrl],
      ["property", "og:image", imageUrl],
      ["property", "og:image:alt", `${SEO.siteName} — campus issue reporting for Nepal`],
      ["property", "og:site_name", SEO.siteName],
      ["property", "og:locale", "en_NP"],
      ["name", "twitter:card", "summary_large_image"],
      ["name", "twitter:title", fullTitle],
      ["name", "twitter:description", metaDescription],
      ["name", "twitter:image", imageUrl],
      ["name", "twitter:image:alt", `${SEO.siteName} — campus issue reporting for Nepal`],
    ];
    socialMetadata.forEach(([attribute, key, value]) => updateMeta(attribute, key, value));

    const existingStructuredData = document.getElementById("issuehive-route-jsonld");
    const hadStructuredData = existingStructuredData !== null;
    const previousStructuredData = existingStructuredData?.textContent;
    const schemaElement = existingStructuredData ?? document.createElement("script");
    schemaElement.id = "issuehive-route-jsonld";
    schemaElement.type = "application/ld+json";
    schemaElement.textContent = routeStructuredData;
    if (!hadStructuredData) document.head.appendChild(schemaElement);

    return () => {
      document.title = previousTitle;
      previousValues.reverse().forEach((restore) => restore());
      if (hadStructuredData && previousStructuredData !== null) {
        schemaElement.textContent = previousStructuredData;
      } else {
        schemaElement.remove();
      }
    };
  }, [fullTitle, metaDescription, keywordList, pageUrl, imageUrl, noIndex, routeStructuredData]);

  return null;
}
