import { Helmet } from "react-helmet-async";
import { SEO } from "@/lib/seo";

type BreadcrumbItem = {
  name: string;
  url: string;
};

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

type IssuePageProps = {
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorUrl: string;
  votes: number;
  status: "open" | "in-progress" | "resolved" | "closed";
  category: string;
  college?: string;
  imageUrl?: string;
};

export function IssuePageSchema({
  title,
  description,
  createdAt,
  updatedAt,
  authorName,
  authorUrl,
  votes,
  status,
  category,
  college,
  imageUrl,
}: IssuePageProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    description: description,
    dateCreated: createdAt,
    dateModified: updatedAt,
    author: {
      "@type": "Person",
      name: authorName,
      url: authorUrl,
    },
    keywords: [category, "issue reporting", "campus voice", college].filter(Boolean),
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/VoteAction",
      userInteractionCount: votes,
    },
    contentStatus: status,
    isPartOf: {
      "@type": "WebSite",
      name: SEO.siteName,
      url: SEO.baseUrl,
    },
    ...(imageUrl && { image: imageUrl }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

type ArticlePageProps = {
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  updatedAt: string;
  authorName: string;
  imageUrl?: string;
  tags?: string[];
};

export function ArticlePageSchema({
  title,
  description,
  content,
  publishedAt,
  updatedAt,
  authorName,
  imageUrl,
  tags,
}: ArticlePageProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: description,
    articleBody: content,
    datePublished: publishedAt,
    dateModified: updatedAt,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: SEO.siteName,
      url: SEO.baseUrl,
    },
    keywords: tags ? tags.join(", ") : SEO.keywords.join(", "),
    ...(imageUrl && { image: imageUrl }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

type LocalBusinessProps = {
  name: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  url?: string;
};

export function LocalBusinessSchema({
  name,
  address,
  city,
  country,
  phone,
  email,
  url,
}: LocalBusinessProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: name,
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressLocality: city,
      addressCountry: country,
    },
    ...(phone && { telephone: phone }),
    ...(email && { email: email }),
    ...(url && { url: url }),
    isPartOf: {
      "@type": "WebSite",
      name: SEO.siteName,
      url: SEO.baseUrl,
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
