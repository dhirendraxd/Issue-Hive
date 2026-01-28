export const SEO = {
  siteName: "IssueHive",
  baseUrl: "https://issue-hive-nine.vercel.app",
  defaultTitle: "IssueHive | Issue Reporting Nepal & Campus Voices",
  defaultDescription:
    "IssueHive is a student voice platform for issue reporting in Nepal. Report campus problems, share campus event posts, and drive community engagement with transparent resolution tracking.",
  keywords: [
    "issue reporting nepal",
    "college issue reporting system nepal",
    "campus events posts nepal",
    "report campus problems",
    "student voice",
    "students voice",
    "campus voices",
    "community engagement",
  ],
  ogImage: "/og-image.webp",
};

export function buildTitle(pageTitle?: string) {
  if (!pageTitle) return SEO.defaultTitle;
  if (pageTitle.includes(SEO.siteName)) return pageTitle;
  return `${pageTitle} | ${SEO.siteName}`;
}
