const FALLBACK_API_URL = "https://script.google.com/macros/s/AKfycbxzlazLkS5hXUtj4dg7UiZESPEsCx8sBUQawgWlTsS3lXsGuO7W6plCavPqNp6-YQsw/exec";
const FALLBACK_TITLE = "Undangan Pernikahan";
const FALLBACK_DESC = "Undangan pernikahan digital dengan RSVP online.";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getOrigin(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const proto = req.headers["x-forwarded-proto"] || "https";
  if (!host) return "";
  return `${proto}://${host}`;
}

function normalizeConfig(config) {
  const source = (config && typeof config === "object") ? config : {};
  const title = String(source.seoTitle || "").trim() || FALLBACK_TITLE;
  const description = String(source.seoDescription || "").trim() || FALLBACK_DESC;
  const heroBackgroundPhoto = String(source.heroBackgroundPhoto || "").trim();
  const galleryPhotos = Array.isArray(source.galleryPhotos) ? source.galleryPhotos : [];
  const fallbackGalleryPhoto = String(galleryPhotos[0] || "").trim();
  const image = heroBackgroundPhoto || fallbackGalleryPhoto;
  return { title, description, image };
}

function resolveImageUrl(raw, origin) {
  const value = String(raw || "").trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${origin}${value}`;
  }

  // Config frontend biasanya menyimpan path seperti assets/photos/...
  return `${origin}/frontend/${value.replace(/^\.?\//, "")}`;
}

async function fetchConfig(apiUrl) {
  const target = String(apiUrl || "").trim();
  if (!target) return null;

  try {
    const url = new URL(target);
    url.searchParams.set("action", "config");
    url.searchParams.set("_ts", String(Date.now()));
    const response = await fetch(url.toString(), { cache: "no-store" });
    const json = await response.json();
    if (!response.ok || !json || !json.success) return null;
    return json.config || null;
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  const origin = getOrigin(req);
  const apiUrl = process.env.RSVP_API_URL || FALLBACK_API_URL;
  const config = await fetchConfig(apiUrl);
  const seo = normalizeConfig(config);
  const imageUrl = resolveImageUrl(seo.image, origin || "");

  const toRaw = String((req.query && req.query.to) || "").trim();
  const redirectUrl = new URL("/frontend/", origin || "https://example.com");
  if (toRaw) redirectUrl.searchParams.set("to", toRaw);

  const title = escapeHtml(seo.title);
  const desc = escapeHtml(seo.description);
  const url = escapeHtml(redirectUrl.toString());
  const image = escapeHtml(imageUrl);
  const imageMeta = imageUrl
    ? `
  <meta property="og:image" content="${image}" />
  <meta property="og:image:secure_url" content="${image}" />
  <meta name="twitter:image" content="${image}" />`
    : "";

  const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${url}" />
  ${imageMeta}
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta http-equiv="refresh" content="0;url=${url}" />
</head>
<body>
  <script>window.location.replace(${JSON.stringify(redirectUrl.toString())});</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.status(200).send(html);
}
