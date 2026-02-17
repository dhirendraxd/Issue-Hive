export const SEO = {
  siteName: "IssueHive",
  baseUrl: "https://issue-hive-nine.vercel.app",
  defaultTitle: "IssueHive | Issue Reporting Nepal & Campus Voices",
  defaultDescription:
    "College-focused platform that enables students to submit, support, and track campus-related issues simply and transparently. Designed with a minimal, student-first approach, the project emphasizes community moderation, voice, and clarity in how issues are visible.",
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
  ogImage: "/og-image.png",
};

export function buildTitle(pageTitle?: string) {
  if (!pageTitle) return SEO.defaultTitle;
  if (pageTitle.includes(SEO.siteName)) return pageTitle;
  return `${pageTitle} | ${SEO.siteName}`;
}
