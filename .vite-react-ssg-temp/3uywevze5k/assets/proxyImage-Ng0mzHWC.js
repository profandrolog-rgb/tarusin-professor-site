const MAP = [
  ["https://images.unsplash.com/", "https://api.tarusin.pro/unsplash/"],
  ["https://i.ytimg.com/", "https://api.tarusin.pro/ytimg/"]
];
function proxyImage(url) {
  if (!url) return "";
  for (const [from, to] of MAP) {
    if (url.startsWith(from)) return url.replace(from, to);
  }
  return url;
}
export {
  proxyImage as p
};
