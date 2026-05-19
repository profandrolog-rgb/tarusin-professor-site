import { Helmet } from "react-helmet-async";

interface PageMetaProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
}

const SITE_URL = "https://tarusin-professor-site.lovable.app";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const PageMeta = ({ title, description, path, image, type = "website" }: PageMetaProps) => {
  const url = `${SITE_URL}${path}`;
  const ogImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:site_name" content="Профессор Тарусин Д.И." />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:url" content={url} />
    </Helmet>
  );
};

export default PageMeta;
