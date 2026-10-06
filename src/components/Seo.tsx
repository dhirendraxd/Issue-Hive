import { Helmet } from "react-helmet-async";
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

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={keywordList} />
      <meta name="author" content={ISSUEHIVE_CREATOR.name} />
      <meta name="geo.region" content="NP" />
      <meta name="geo.placename" content="Nepal" />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      <link rel="canonical" href={pageUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={`${SEO.siteName} — campus issue reporting for Nepal`} />
      <meta property="og:site_name" content={SEO.siteName} />
      <meta property="og:locale" content="en_NP" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={`${SEO.siteName} — campus issue reporting for Nepal`} />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": `${SEO.baseUrl}/#website`,
              name: SEO.siteName,
              url: `${SEO.baseUrl}/`,
              description: SEO.defaultDescription,
              inLanguage: "en-NP",
              publisher: { "@id": `${SEO.baseUrl}/#creator` },
            },
            {
              "@type": "Person",
              "@id": `${SEO.baseUrl}/#creator`,
              name: ISSUEHIVE_CREATOR.name,
              url: ISSUEHIVE_CREATOR.url,
              sameAs: ISSUEHIVE_CREATOR.sameAs,
              jobTitle: ISSUEHIVE_CREATOR.jobTitle,
              description:
                "Designer and creator of IssueHive, a student voice and campus issue reporting project for Nepal.",
            },
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
          ],
        })}
      </script>
      {jsonLdArray.map((entry, index) => (
        <script key={`jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
}
