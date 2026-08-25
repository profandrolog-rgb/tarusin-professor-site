import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchDiseaseArticles from "./tools/search-disease-articles";
import getDiseaseArticle from "./tools/get-disease-article";
import searchVideos from "./tools/search-videos";
import listBlogPosts from "./tools/list-blog-posts";
import searchPatients from "./tools/search-patients";
import listPatientVisits from "./tools/list-patient-visits";

// Issuer must be the direct Supabase host, built from the project ref that Vite
// inlines at build time (never from SUPABASE_URL, which may be a proxy).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "tarusin-digital-space",
  title: "Tarusin Digital Space",
  version: "0.1.0",
  instructions:
    "Tools for Tarusin Digital Space (сайт профессора Тарусина). Use search_disease_articles / get_disease_article for medical articles, search_videos and list_blog_posts for public content, and search_patients / list_patient_visits for clinical records the signed-in user is allowed to see.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchDiseaseArticles,
    getDiseaseArticle,
    searchVideos,
    listBlogPosts,
    searchPatients,
    listPatientVisits,
  ],
});
