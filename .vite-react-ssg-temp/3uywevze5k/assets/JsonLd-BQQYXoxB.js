import { jsx } from "react/jsx-runtime";
import { Helmet } from "react-helmet-async";
const JsonLd = ({ data }) => /* @__PURE__ */ jsx(Helmet, { children: /* @__PURE__ */ jsx("script", { type: "application/ld+json", children: JSON.stringify(data) }) });
export {
  JsonLd as J
};
