import { Helmet } from "react-helmet-async";
import { SEO, buildTitle } from "@/lib/seo";

type SeoProps = {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
};

export default function Seo({
  title,
  description,
  path,
  keywords,
  ogImage,
  noIndex,
}: SeoProps) {
  const fullTitle = buildTitle(title);
  const metaDescription = description || SEO.defaultDescription;
  const keywordList = (keywords || SEO.keywords).join(", ");
  const pageUrl = path ? `${SEO.baseUrl}${path}` : SEO.baseUrl;
  const imageUrl = ogImage ? `${SEO.baseUrl}${ogImage}` : `${SEO.baseUrl}${SEO.ogImage}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={keywordList} />
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
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: fullTitle,
          url: pageUrl,
          description: metaDescription,
          isPartOf: {
            "@type": "WebSite",
            name: SEO.siteName,
            url: SEO.baseUrl,
          },
        })}
      </script>
    </Helmet>
  );
}
