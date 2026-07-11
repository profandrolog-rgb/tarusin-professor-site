import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { s as supabase, b as Badge } from "../main.mjs";
const BentoImageCell = ({ image, className = "", rounded = "rounded-lg" }) => {
  const url = (image == null ? void 0 : image.path) ? supabase.storage.from("disease-media").getPublicUrl(image.path).data.publicUrl : null;
  const x = (image == null ? void 0 : image.x) ?? 50;
  const y = (image == null ? void 0 : image.y) ?? 50;
  const zoom = (image == null ? void 0 : image.zoom) ?? 100;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `relative overflow-hidden bg-muted/40 ring-1 ring-border/60 shadow-inner ${rounded} ${className}`,
      children: url ? /* @__PURE__ */ jsx(
        "img",
        {
          src: url,
          alt: "",
          loading: "lazy",
          draggable: false,
          className: "absolute inset-0 h-full w-full object-cover select-none pointer-events-none",
          style: {
            objectPosition: `${x}% ${y}%`,
            transform: `scale(${zoom / 100})`,
            transformOrigin: `${x}% ${y}%`
          }
        }
      ) : /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground/70", children: "+" })
    }
  );
};
const DiseaseBentoCard = ({ article, featured, categoryLabel }) => {
  const thumb = article.thumbnail_path ? supabase.storage.from("disease-media").getPublicUrl(article.thumbnail_path).data.publicUrl : null;
  const cells = [article.bento_image_1, article.bento_image_2, article.bento_image_3];
  const hasCells = featured && cells.some((c) => c == null ? void 0 : c.path);
  return /* @__PURE__ */ jsxs(
    Link,
    {
      to: `/for-parents/${article.slug}/`,
      className: `group relative block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-md ring-1 ring-black/[0.02] transition-all duration-300 ease-out will-change-transform hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-2xl hover:ring-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${featured ? "md:col-span-2 md:row-span-2 min-h-[280px]" : "min-h-[160px]"}`,
      children: [
        thumb && /* @__PURE__ */ jsx(
          "img",
          {
            src: thumb,
            alt: "",
            loading: "lazy",
            className: "absolute inset-0 h-full w-full object-cover opacity-25 transition-opacity duration-300 group-hover:opacity-40"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-background/95 via-background/75 to-background/30" }),
        /* @__PURE__ */ jsxs("div", { className: `relative flex h-full flex-col gap-3 p-5 ${featured ? "md:p-6" : ""}`, children: [
          categoryLabel && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "w-fit text-xs shadow-sm", children: categoryLabel }),
          hasCells && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2 mt-1", children: cells.map((cell, i) => /* @__PURE__ */ jsx(
            BentoImageCell,
            {
              image: cell,
              className: "aspect-square shadow-md ring-1 ring-border/70",
              rounded: "rounded-xl"
            },
            i
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-auto", children: [
            /* @__PURE__ */ jsx(
              "h3",
              {
                className: `font-semibold text-foreground group-hover:text-primary transition-colors ${featured ? "text-xl md:text-2xl" : "text-base"}`,
                children: article.title
              }
            ),
            featured && article.description && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground line-clamp-3", children: article.description })
          ] })
        ] })
      ]
    }
  );
};
export {
  BentoImageCell as B,
  DiseaseBentoCard as D
};
