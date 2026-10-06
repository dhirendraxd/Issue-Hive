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
  url: "https://www.linkedin.com/in/dhirendra-singh-dhami/?isSelfProfile=true",
  sameAs: [
    "https://www.linkedin.com/in/dhirendra-singh-dhami/?isSelfProfile=true",
    "https://www.behance.net/dhirendraxd",
  ],
  jobTitle: "Designer and creator of IssueHive",
};

export function buildTitle(pageTitle?: string) {
  if (!pageTitle) return SEO.defaultTitle;
  if (pageTitle.includes(SEO.siteName)) return pageTitle;
  return `${pageTitle} | ${SEO.siteName}`;
}
