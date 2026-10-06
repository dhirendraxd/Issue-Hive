export const SEO = {
  siteName: "IssueHive",
  baseUrl: "https://issue-hive-nine.vercel.app",
  defaultTitle: "Campus Issue Reporting in Nepal | IssueHive",
  defaultDescription:
    "IssueHive is a student voice platform for Nepalese campuses. Report campus problems, choose public or private visibility, gather community support, and follow progress through resolution.",
  keywords: [
    "campus issue reporting Nepal",
    "student voice platform Nepal",
    "college issue reporting",
    "report campus problems",
    "campus problem tracking",
    "campus issue resolution",
    "student community engagement",
  ],
  ogImage: "/og-image.png",
};

export const ISSUEHIVE_CREATOR = {
  name: "Dhirendra Singh Dhami",
  url: "https://dhirendrasinghdhami.com.np/",
  description:
    "Dhirendra Singh Dhami is a Kathmandu-based interdisciplinary designer and digital marketer whose experience spans frontend engineering, visual design, digital marketing, growth, business operations, event coordination, and communication. Interested in technology, internet governance, climate justice, social entrepreneurship, and civic-minded community building, he co-hosts Lovelace Talk and created IssueHive, a student voice platform for campus communities.",
  knowsAbout: [
    "Product and graphic design",
    "Frontend development",
    "Digital marketing and growth",
    "Business operations",
    "Event coordination and communication",
    "Internet governance",
    "Civic technology",
    "Climate justice and sustainability",
    "Social entrepreneurship",
    "Community building",
    "Public policy and advocacy",
  ],
  sameAs: [
    "https://dhirendrasinghdhami.com.np/",
    "https://www.linkedin.com/in/dhirendra-singh-dhami/?isSelfProfile=true",
    "https://www.behance.net/dhirendraxd",
  ],
  profiles: [
    { label: "Personal website", url: "https://dhirendrasinghdhami.com.np/" },
    {
      label: "LinkedIn profile",
      url: "https://www.linkedin.com/in/dhirendra-singh-dhami/?isSelfProfile=true",
    },
    { label: "Behance portfolio", url: "https://www.behance.net/dhirendraxd" },
  ],
  jobTitle: "Designer and creator of IssueHive",
};

export function buildTitle(pageTitle?: string) {
  if (!pageTitle) return SEO.defaultTitle;
  if (pageTitle.includes(SEO.siteName)) return pageTitle;
  return `${pageTitle} | ${SEO.siteName}`;
}
