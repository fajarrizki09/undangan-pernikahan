const FALLBACK_TITLE = "Undangan Pernikahan";
const FALLBACK_DESC = "Undangan pernikahan digital dengan RSVP online.";
const CONFIG_FETCH_TIMEOUT_MS = 9000;
const SEO_CACHE_TTL_MS = 1000 * 60 * 5;

let seoCache = {
  expiresAt: 0,
  data: null
};

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
  const image = heroBackgroundPhoto || fallbackGalleryPhoto || String(process.env.SHARE_DEFAULT_IMAGE || "").trim();
  return { title, description, image };
}

function resolveImageUrl(raw, origin) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (!origin) return "";
  if (value.startsWith("/")) return `${origin}${value}`;
  return `${origin}/frontend/${value.replace(/^\.?\//, "")}`;
}

async function fetchConfig(apiUrl) {
  const target = String(apiUrl || "").trim();
  if (!target) return null;

  const url = new URL(target);
  url.searchParams.set("action", "config");
  url.searchParams.set("_ts", String(Date.now()));

  async function tryFetch(withTimeout) {
    const options = {
      cache: "no-store",
      headers: { Accept: "application/json" }
    };

    let timeoutId = null;
    if (withTimeout) {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), CONFIG_FETCH_TIMEOUT_MS);
      options.signal = controller.signal;
    }

    try {
      const response = await fetch(url.toString(), options);
      const json = await response.json();
      if (!response.ok || !json || !json.success) return null;
      return json.config || null;
    } catch (error) {
      return null;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  const fastAttempt = await tryFetch(true);
  if (fastAttempt) return fastAttempt;
  return tryFetch(false);
}

async function getSeoConfig(apiUrl) {
  const now = Date.now();
  if (seoCache.data && seoCache.expiresAt > now) return seoCache.data;

  const config = await fetchConfig(apiUrl);
  if (config) {
    const normalized = normalizeConfig(config);
    seoCache = {
      data: normalized,
      expiresAt: now + SEO_CACHE_TTL_MS
    };
    return normalized;
  }

  if (seoCache.data) return seoCache.data;
  return normalizeConfig({});
}

export default async function handler(req, res) {
  const origin = getOrigin(req);
  const apiUrl = String(process.env.RSVP_API_URL || "").trim();
  const seo = await getSeoConfig(apiUrl);
  const imageUrl = resolveImageUrl(seo.image, origin);

  const toRaw = String((req.query && req.query.to) || "").trim();
  const redirectUrl = new URL("/frontend/", origin || "https://example.com");
  if (toRaw) redirectUrl.searchParams.set("to", toRaw);
  const shareUrl = new URL("/", origin || "https://example.com");
  if (toRaw) shareUrl.searchParams.set("to", toRaw);

  const title = escapeHtml(seo.title);
  const desc = escapeHtml(seo.description);
  const url = escapeHtml(shareUrl.toString());
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
  <meta name="twitter:card" content="${imageUrl ? "summary_large_image" : "summary"}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(redirectUrl.toString())}" />
</head>
<body>
  <script>window.location.replace(${JSON.stringify(redirectUrl.toString())});</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.status(200).send(html);
}
