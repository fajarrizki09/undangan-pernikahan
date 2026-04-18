const form = document.getElementById("rsvpForm");
const statusText = document.getElementById("formStatus");
const inputNama = document.getElementById("inputNama");
const submitRsvpBtn = form ? form.querySelector("button[type='submit']") : null;
const galleryGrid = document.getElementById("galleryGrid");
const wishesList = document.getElementById("wishesList");
const wishesMeta = document.getElementById("wishesMeta");

const cdDays = document.getElementById("cdDays");
const cdHours = document.getElementById("cdHours");
const cdMinutes = document.getElementById("cdMinutes");
const cdSeconds = document.getElementById("cdSeconds");
const countdownNodes = [cdDays, cdHours, cdMinutes, cdSeconds];

const musicToggle = document.getElementById("musicToggle");
const bgMusic = document.getElementById("bgMusic");
const leafLayer = document.getElementById("leafLayer");
const flowerLayer = document.getElementById("flowerLayer");
const heroCloudPhoto = document.getElementById("heroCloudPhoto");
const pageLoader = document.getElementById("pageLoader");
const loaderText = document.getElementById("loaderText");
const loaderRetry = document.getElementById("loaderRetry");
const invitationGate = document.getElementById("invitationGate");
const openInvitationBtn = document.getElementById("openInvitationBtn");
const gateNames = document.getElementById("gateNames");
const gateDatePlace = document.getElementById("gateDatePlace");
const gateGuestName = document.getElementById("gateGuestName");
const addToCalendarLink = document.getElementById("addToCalendarLink");
const giftSection = document.getElementById("giftSection");
const giftSectionTitle = document.getElementById("giftSectionTitle");
const giftSectionSubtitle = document.getElementById("giftSectionSubtitle");
const giftCategoryTabs = document.getElementById("giftCategoryTabs");
const giftAccountsList = document.getElementById("giftAccountsList");

const BANK_CATALOG = {
  bca: { code: "bca", name: "BCA", logoUrl: "assets/bank/bca.svg", aliases: ["bank central asia"] },
  bri: { code: "bri", name: "BRI", logoUrl: "assets/bank/bri.svg", aliases: ["bank rakyat indonesia"] },
  bni: { code: "bni", name: "BNI", logoUrl: "assets/bank/bni.svg", aliases: ["bank negara indonesia"] },
  mandiri: { code: "mandiri", name: "Mandiri", logoUrl: "assets/bank/mandiri.svg", aliases: ["bank mandiri"] },
  bsi: { code: "bsi", name: "BSI", logoUrl: "assets/bank/bsi.svg", aliases: ["bank syariah indonesia"] },
  cimb: { code: "cimb", name: "CIMB Niaga", logoUrl: "assets/bank/cimb.svg", aliases: ["cimb", "cimb niaga"] },
  permata: { code: "permata", name: "Permata", logoUrl: "assets/bank/permata.svg", aliases: ["permata bank"] },
  btn: { code: "btn", name: "BTN", logoUrl: "assets/bank/btn.svg", aliases: ["bank tabungan negara"] },
  danamon: { code: "danamon", name: "Danamon", logoUrl: "assets/bank/danamon.svg", aliases: ["bank danamon"] },
  panin: { code: "panin", name: "Panin", logoUrl: "assets/bank/panin.svg", aliases: ["panin bank", "bank panin"] }
};
const lightbox = document.createElement("div");
lightbox.className = "gallery-lightbox";
lightbox.setAttribute("aria-hidden", "true");
lightbox.innerHTML = `
  <button type="button" class="gallery-lightbox-close" aria-label="Tutup foto">&times;</button>
  <img class="gallery-lightbox-image" alt="Foto galeri ukuran besar" />
`;
document.body.appendChild(lightbox);
const lightboxImg = lightbox.querySelector(".gallery-lightbox-image");
const lightboxCloseBtn = lightbox.querySelector(".gallery-lightbox-close");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmallScreen = window.matchMedia("(max-width: 860px)").matches;
const isLowPowerDevice = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || isSmallScreen;
const isMobileViewport = window.matchMedia("(max-width: 768px)").matches;

const particleState = {
  leafTimer: null,
  flowerTimer: null,
  countdownTimer: null,
  maxLeaves: isLowPowerDevice ? 8 : 18,
  maxFlowers: isLowPowerDevice ? 6 : 14
};
const musicState = {
  startSec: 0,
  loopStartSec: null,
  loopEndSec: null,
  activeTracks: [],
  currentTrackIndex: 0,
  playbackMode: "ordered"
};
const giftUiState = {
  activeCategory: "",
  isExpanded: false
};
const galleryState = {
  autoplayTimer: null
};
let attemptMusicStartFromGesture = async () => false;
let wishesAutoScrollTimer = null;
let wishesAutoPauseUntil = 0;
let wishesRefreshTimer = null;

let currentConfig = {
  ...WEDDING_CONFIG,
  akad: { ...(WEDDING_CONFIG.akad || {}) },
  resepsi: { ...(WEDDING_CONFIG.resepsi || {}) },
  loveStoryPhotos: Array.isArray(WEDDING_CONFIG.loveStoryPhotos) ? [...WEDDING_CONFIG.loveStoryPhotos] : [],
  loveStoryItems: Array.isArray(WEDDING_CONFIG.loveStoryItems) ? [...WEDDING_CONFIG.loveStoryItems] : [],
  galleryPhotos: Array.isArray(WEDDING_CONFIG.galleryPhotos) ? [...WEDDING_CONFIG.galleryPhotos] : [],
  galleryPhotoFocus: {},
  eventStartISO: String(WEDDING_CONFIG.eventStartISO || WEDDING_CONFIG.weddingDateISO || "").trim(),
  backgroundMusicUrl: String(WEDDING_CONFIG.backgroundMusicUrl || "").trim(),
  musicPlaybackMode: String(WEDDING_CONFIG.musicPlaybackMode || "ordered").trim(),
  musicPlaylist: Array.isArray(WEDDING_CONFIG.musicPlaylist) ? [...WEDDING_CONFIG.musicPlaylist] : [],
  giftEnabled: Boolean(WEDDING_CONFIG.giftEnabled),
  giftSectionTitle: String(WEDDING_CONFIG.giftSectionTitle || "Wedding Gift"),
  giftSectionSubtitle: String(WEDDING_CONFIG.giftSectionSubtitle || ""),
  giftAccounts: Array.isArray(WEDDING_CONFIG.giftAccounts) ? [...WEDDING_CONFIG.giftAccounts] : []
};
const CONFIG_CACHE_KEY = "wedding_config_cache_v2";
const CONFIG_CACHE_TTL_MS = 1000 * 30;

function cleanPhotoArray(input) {
  if (!Array.isArray(input)) return [];
  return input.map((item) => String(item || "").trim()).filter(Boolean);
}

function normalizeMusicPlaybackMode(value) {
  return String(value || "").trim().toLowerCase() === "shuffle" ? "shuffle" : "ordered";
}

function isLikelyDriveFileId(value) {
  const clean = String(value || "").trim();
  return /^[a-zA-Z0-9_-]{20,}$/.test(clean);
}

function normalizeMusicTrack(item, index = 0) {
  const source = (item && typeof item === "object") ? item : {};
  const url = String(source.url || source.audioStreamUrl || source.downloadUrl || source.publicUrl || source.webUrl || "").trim();
  const title = String(source.title || source.name || `Track ${index + 1}`).trim();
  const id = String(source.id || source.fileId || `track-${index + 1}`).trim() || `track-${index + 1}`;
  return {
    id,
    title: title || `Track ${index + 1}`,
    url,
    isActive: source.isActive === undefined ? true : normalizeBoolean(source.isActive, true)
  };
}

function normalizeMusicPlaylist(input, fallbackUrl = "") {
  let source = input;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch (error) {
      source = [];
    }
  }

  let tracks = Array.isArray(source)
    ? source.map((item, index) => normalizeMusicTrack(item, index)).filter((item) => item.url)
    : [];

  const hasRealDriveTrack = tracks.some((item) => isLikelyDriveFileId(item.id) || extractDriveFileId(item.url));
  if (hasRealDriveTrack) {
    tracks = tracks.filter((item) => item.id !== "default-track-1" && item.id !== "legacy-track-1");
  }

  if (!tracks.length && fallbackUrl) {
    tracks = [{
      id: "legacy-track-1",
      title: "Musik Utama",
      url: String(fallbackUrl || "").trim(),
      isActive: true
    }];
  }

  return tracks;
}

function getActiveMusicTracks(config) {
  const playlist = normalizeMusicPlaylist(config && config.musicPlaylist, config && config.backgroundMusicUrl);
  const active = playlist.filter((item) => item.isActive && item.url);
  return active.length ? active : playlist.filter((item) => item.url);
}

function healMisplacedPhotoConfig(config) {
  const fallbackStory = cleanPhotoArray(WEDDING_CONFIG.loveStoryPhotos).slice(0, 3);
  const source = (config && typeof config === "object") ? config : {};
  const loveStory = cleanPhotoArray(source.loveStoryPhotos);
  const gallery = cleanPhotoArray(source.galleryPhotos);

  const likelyShiftedColumn = gallery.length === 0 && loveStory.length > 3;
  if (!likelyShiftedColumn) {
    return source;
  }

  return {
    ...source,
    loveStoryPhotos: fallbackStory.length ? fallbackStory : loveStory.slice(0, 3),
    galleryPhotos: loveStory
  };
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = String(value || "");
}

function setBrandMonogram(value) {
  const el = document.getElementById("brandInitials");
  if (!el) return;

  const raw = String(value || "").trim();
  if (!raw) {
    el.textContent = "";
    return;
  }

  const cleaned = raw.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(/&|dan|\+/i).map((item) => item.trim()).filter(Boolean);

  if (parts.length >= 2) {
    const left = parts[0].charAt(0).toUpperCase();
    const right = parts[1].charAt(0).toUpperCase();
    el.innerHTML = `<span class="brand-letter">${left}</span><span class="brand-sep">&amp;</span><span class="brand-letter">${right}</span>`;
    el.setAttribute("aria-label", cleaned);
    return;
  }

  el.textContent = cleaned;
  el.setAttribute("aria-label", cleaned);
}

function setAnimatedName(id, value, baseDelayMs = 0) {
  const el = document.getElementById(id);
  if (!el) return;

  const text = String(value || "").trim();
  if (!text) {
    el.textContent = "";
    return;
  }

  if (prefersReducedMotion) {
    el.textContent = text;
    return;
  }

  if (el.dataset.animatedText === text) return;
  el.dataset.animatedText = text;
  el.setAttribute("aria-label", text);
  el.textContent = "";
  el.classList.add("hero-name");

  const fragment = document.createDocumentFragment();
  Array.from(text).forEach((char, idx) => {
    const letter = document.createElement("span");
    letter.className = char === " " ? "char is-space" : "char";
    letter.style.animationDelay = `${(baseDelayMs + (idx * 45)) / 1000}s`;
    letter.textContent = char === " " ? "\u00A0" : char;
    fragment.appendChild(letter);
  });

  el.appendChild(fragment);
}

function setLink(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.href = value;
}

function setInternalAnchorLink(id, hashTarget) {
  const el = document.getElementById(id);
  if (!el) return;
  el.href = hashTarget || "#";
  el.removeAttribute("target");
  el.removeAttribute("rel");
}

function setHtml(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.innerHTML = value;
}

function setIframeSrc(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.src = value;
}

function buildEmbedUrl(mapUrl, venue) {
  const cleanMapUrl = (mapUrl || "").trim();
  if (cleanMapUrl.includes("google.com/maps/embed") || cleanMapUrl.includes("output=embed")) {
    return cleanMapUrl;
  }

  const coordMatch = cleanMapUrl.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (coordMatch && coordMatch[1] && coordMatch[2]) {
    const q = `${coordMatch[1]},${coordMatch[2]}`;
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=17&ie=UTF8&iwloc=&output=embed`;
  }

  const queryFromUrlMatch = cleanMapUrl.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?(?:%2C|,)-?\d+(?:\.\d+)?)/i);
  if (queryFromUrlMatch && queryFromUrlMatch[1]) {
    const q = decodeURIComponent(queryFromUrlMatch[1]);
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=17&ie=UTF8&iwloc=&output=embed`;
  }

  if (cleanMapUrl) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(cleanMapUrl)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  const query = encodeURIComponent((venue || "").trim());
  if (query) {
    return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  return "https://maps.google.com/maps?q=Indonesia&t=&z=5&ie=UTF8&iwloc=&output=embed";
}

function getGuestNameFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("to") || params.get("tamu") || params.get("nama");
  if (!raw) return "Bapak/Ibu/Saudara/i";
  return raw.replace(/\+/g, " ").trim() || "Bapak/Ibu/Saudara/i";
}

function clampPercent(value, fallback = 50) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, num));
}

function normalizeGalleryPhotoFocusMap(input) {
  let source = input;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch (error) {
      source = {};
    }
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};

  const normalized = {};
  Object.keys(source).forEach((rawKey) => {
    const key = String(rawKey || "").trim();
    if (!key) return;
    const item = source[rawKey];
    if (!item || typeof item !== "object") return;
    normalized[key] = {
      x: clampPercent(item.x, 50),
      y: clampPercent(item.y, 50)
    };
  });

  return normalized;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const text = String(value || "").trim().toLowerCase();
  if (!text) return fallback;
  return ["1", "true", "yes", "y", "on"].includes(text);
}

function normalizeGiftAccounts(input) {
  let source = input;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch (error) {
      source = [];
    }
  }
  if (!Array.isArray(source)) return [];

  return source
    .map((item) => ({
      bankCode: String(item && item.bankCode || "").trim().toLowerCase(),
      bankName: String(item && item.bankName || "").trim(),
      accountNumber: String(item && item.accountNumber || "").replace(/\D+/g, ""),
      accountHolder: String(item && item.accountHolder || "").trim(),
      logoUrl: String(item && item.logoUrl || "").trim(),
      isActive: normalizeBoolean(item && item.isActive, true)
    }))
    .filter((item) => item.accountNumber);
}

function getGalleryObjectPosition(photoUrl) {
  const key = String(photoUrl || "").trim();
  const map = normalizeGalleryPhotoFocusMap(currentConfig.galleryPhotoFocus);
  const item = map[key];
  if (!item) return "50% 50%";
  return `${clampPercent(item.x, 50)}% ${clampPercent(item.y, 50)}%`;
}

function mergeConfig(base, incoming) {
  if (!incoming || typeof incoming !== "object") return base;

  const incomingMusicUrl = String(incoming.backgroundMusicUrl || "").trim();
  const baseMusicUrl = String(base.backgroundMusicUrl || "").trim();
  const incomingMusicPlaylist = incoming.musicPlaylist !== undefined
    ? incoming.musicPlaylist
    : (base.musicPlaylist !== undefined ? base.musicPlaylist : WEDDING_CONFIG.musicPlaylist);
  const merged = {
    ...base,
    ...incoming,
    backgroundMusicUrl: incomingMusicUrl || baseMusicUrl,
    musicPlaybackMode: normalizeMusicPlaybackMode(
      incoming.musicPlaybackMode || base.musicPlaybackMode || WEDDING_CONFIG.musicPlaybackMode || "ordered"
    ),
    musicPlaylist: normalizeMusicPlaylist(
      incomingMusicPlaylist,
      incomingMusicUrl || baseMusicUrl || WEDDING_CONFIG.backgroundMusicUrl
    ),
    akad: {
      ...(base.akad || {}),
      ...(incoming.akad || {})
    },
    resepsi: {
      ...(base.resepsi || {}),
      ...(incoming.resepsi || {})
    },
    loveStoryPhotos: Array.isArray(incoming.loveStoryPhotos) && incoming.loveStoryPhotos.length
      ? incoming.loveStoryPhotos
      : base.loveStoryPhotos,
    loveStoryItems: Array.isArray(incoming.loveStoryItems) && incoming.loveStoryItems.length
      ? incoming.loveStoryItems
      : base.loveStoryItems,
    galleryPhotos: Array.isArray(incoming.galleryPhotos) && incoming.galleryPhotos.length
      ? incoming.galleryPhotos
      : base.galleryPhotos,
    galleryPhotoFocus: normalizeGalleryPhotoFocusMap(
      incoming.galleryPhotoFocus || base.galleryPhotoFocus || WEDDING_CONFIG.galleryPhotoFocus || {}
    ),
    eventStartISO: String(
      incoming.eventStartISO ||
      base.eventStartISO ||
      WEDDING_CONFIG.eventStartISO ||
      incoming.weddingDateISO ||
      base.weddingDateISO ||
      WEDDING_CONFIG.weddingDateISO ||
      ""
    ).trim(),
    giftEnabled: normalizeBoolean(
      (incoming.giftEnabled !== undefined ? incoming.giftEnabled : base.giftEnabled),
      normalizeBoolean(WEDDING_CONFIG.giftEnabled, false)
    ),
    giftSectionTitle: String(incoming.giftSectionTitle || base.giftSectionTitle || WEDDING_CONFIG.giftSectionTitle || "Wedding Gift").trim(),
    giftSectionSubtitle: String(incoming.giftSectionSubtitle || base.giftSectionSubtitle || WEDDING_CONFIG.giftSectionSubtitle || "").trim(),
    giftAccounts: normalizeGiftAccounts(
      incoming.giftAccounts !== undefined
        ? incoming.giftAccounts
        : (base.giftAccounts !== undefined ? base.giftAccounts : WEDDING_CONFIG.giftAccounts)
    )
  };

  merged.galleryMode = normalizeGalleryMode(incoming.galleryMode || base.galleryMode || WEDDING_CONFIG.galleryMode);
  merged.galleryStyle = normalizeGalleryStyle(incoming.galleryStyle || base.galleryStyle || WEDDING_CONFIG.galleryStyle);
  merged.galleryMaxItems = normalizeCountString(incoming.galleryMaxItems || base.galleryMaxItems || WEDDING_CONFIG.galleryMaxItems);
  merged.galleryAutoplaySec = normalizePositiveNumberString(
    incoming.galleryAutoplaySec || base.galleryAutoplaySec || WEDDING_CONFIG.galleryAutoplaySec
  );

  merged.quranVerseArabic = String(merged.quranVerseArabic || "").trim() || String(base.quranVerseArabic || "").trim();
  merged.quranVerseTranslation = String(merged.quranVerseTranslation || "").trim() || String(base.quranVerseTranslation || "").trim();
  merged.quranVerseReference = String(merged.quranVerseReference || "").trim() || String(base.quranVerseReference || "").trim();
  merged.hadithText = String(merged.hadithText || "").trim() || String(base.hadithText || "").trim();
  merged.hadithReference = String(merged.hadithReference || "").trim() || String(base.hadithReference || "").trim();
  merged.marriageDoaText = String(merged.marriageDoaText || "").trim() || String(base.marriageDoaText || "").trim();
  merged.marriageDoaReference = String(merged.marriageDoaReference || "").trim() || String(base.marriageDoaReference || "").trim();

  return healMisplacedPhotoConfig(merged);
}

function formatStoryDateDisplay(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(value);
  }

  const text = String(value || "").trim();
  if (!text) return "";

  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  return text;
}

function cleanStoryDescription(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^InvalidA1\s*:/i.test(text)) {
    return text.replace(/^InvalidA1\s*:\s*/i, "").trim();
  }
  return text;
}

function setMetaDescription(content) {
  const text = String(content || "").trim();
  if (!text) return;

  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", text);
}

function normalizeGalleryMode(value) {
  return String(value || "").toLowerCase() === "carousel" ? "carousel" : "grid";
}

function normalizeGalleryStyle(value) {
  const style = String(value || "").toLowerCase();
  if (["elegant", "soft", "polaroid", "clean"].includes(style)) return style;
  return "elegant";
}

function normalizeCountString(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const num = Number(text);
  if (!Number.isFinite(num) || num < 0) return "";
  return String(Math.floor(num));
}

function normalizePositiveNumberString(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const num = Number(text);
  if (!Number.isFinite(num) || num <= 0) return "";
  return String(num);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 7000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function loadServerConfig() {
  let hasSheetConfig = false;
  const cachedConfig = readCachedConfig();
  if (cachedConfig) {
    currentConfig = mergeConfig(currentConfig, cachedConfig);
    hasSheetConfig = true;
  }

  if (!RSVP_API_URL || RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
    return true;
  }

  const url = new URL(RSVP_API_URL);
  url.searchParams.set("action", "config");
  url.searchParams.set("_ts", String(Date.now()));

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url.toString(), {
        cache: "no-store"
      }, 10000);

      const result = await response.json();
      if (response.ok && result.success && result.config) {
        currentConfig = mergeConfig(currentConfig, result.config);
        writeCachedConfig(result.config);
        return true;
      }
    } catch (error) {
      // Retry 1x jika koneksi awal lambat.
    }
  }

  return hasSheetConfig;
}

function readCachedConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.savedAt || !parsed.data) return null;
    if (Date.now() - Number(parsed.savedAt) > CONFIG_CACHE_TTL_MS) return null;
    return parsed.data;
  } catch (error) {
    return null;
  }
}

function writeCachedConfig(config) {
  try {
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({
      savedAt: Date.now(),
      data: config
    }));
  } catch (error) {
    // Abaikan jika storage penuh/terblokir.
  }
}

function setLoaderMessage(message, allowRetry) {
  if (loaderText && message) loaderText.textContent = message;
  if (loaderRetry) loaderRetry.hidden = !allowRetry;
}

function setFormStatus(message, type) {
  if (!statusText) return;
  statusText.textContent = message || "";
  statusText.classList.remove("is-loading", "is-success", "is-error");
  if (type) statusText.classList.add(type);
}

function stopWishesAutoScroll() {
  if (!wishesAutoScrollTimer) return;
  clearInterval(wishesAutoScrollTimer);
  wishesAutoScrollTimer = null;
}

function startWishesAutoScroll() {
  if (!wishesList || prefersReducedMotion) return;
  stopWishesAutoScroll();

  const maxScroll = wishesList.scrollHeight - wishesList.clientHeight;
  if (maxScroll <= 10) return;

  wishesAutoScrollTimer = window.setInterval(() => {
    if (!wishesList || document.hidden) return;
    if (Date.now() < wishesAutoPauseUntil) return;
    if (wishesList.matches(":hover")) return;

    const max = wishesList.scrollHeight - wishesList.clientHeight;
    if (max <= 10) return;

    const next = wishesList.scrollTop + 1;
    wishesList.scrollTop = next >= max ? 0 : next;
  }, 46);
}

function refreshWishesAutoScroll() {
  stopWishesAutoScroll();
  window.setTimeout(startWishesAutoScroll, 380);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatWishTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  } catch (error) {
    return "";
  }
}

function renderWishes(wishes) {
  if (!wishesList) return;

  const rows = Array.isArray(wishes) ? wishes : [];
  if (!rows.length) {
    wishesList.innerHTML = '<p class="wishes-empty">Belum ada ucapan. Jadilah yang pertama mengirim doa terbaik.</p>';
    if (wishesMeta) wishesMeta.textContent = "0 ucapan ditampilkan";
    stopWishesAutoScroll();
    return;
  }

  wishesList.innerHTML = rows.map((wish) => {
    const name = escapeHtml(wish.nama || "Tamu Undangan");
    const ucapan = escapeHtml(wish.ucapan || "-");
    const hadir = String(wish.kehadiran || "").toLowerCase() === "hadir";
    const hadirText = hadir ? "Hadir" : "Tidak Hadir";
    const hadirClass = hadir ? "" : " absent";
    const waktu = formatWishTime(wish.waktu);

    return `
      <article class="wishes-item">
        <div class="wishes-item-head">
          <strong>${name}</strong>
          <span class="wish-presence${hadirClass}">${hadirText}</span>
        </div>
        <p class="wish-text">${ucapan}</p>
        ${waktu ? `<p class="wish-time">${escapeHtml(waktu)}</p>` : ""}
      </article>
    `;
  }).join("");

  if (wishesMeta) wishesMeta.textContent = `${rows.length} ucapan terbaru`;
  refreshWishesAutoScroll();
}

async function loadWishes() {
  if (!wishesList) return;

  if (!RSVP_API_URL || RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
    renderWishes([]);
    if (wishesMeta) wishesMeta.textContent = "Sambungkan backend untuk menampilkan ucapan";
    return;
  }

  if (wishesMeta) wishesMeta.textContent = "Memuat ucapan...";

  try {
    const timeouts = [9000, 16000, 26000];
    let result = null;
    let loaded = false;

    for (let i = 0; i < timeouts.length; i += 1) {
      const url = new URL(RSVP_API_URL);
      url.searchParams.set("action", "wishes");
      url.searchParams.set("limit", "8");
      url.searchParams.set("_ts", String(Date.now()));

      try {
        const response = await fetchWithTimeout(url.toString(), { cache: "no-store" }, timeouts[i]);
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.message || "Gagal memuat ucapan");
        }
        result = json;
        loaded = true;
        break;
      } catch (error) {
        if (i === timeouts.length - 1) throw error;
      }
    }

    if (loaded) {
      renderWishes((result && result.wishes) || []);
    }
  } catch (error) {
    if (wishesMeta) wishesMeta.textContent = "Ucapan belum bisa dimuat saat ini";
  }
}

function startWishesRefresh() {
  if (wishesRefreshTimer) {
    clearInterval(wishesRefreshTimer);
    wishesRefreshTimer = null;
  }
  wishesRefreshTimer = window.setInterval(() => {
    if (document.hidden) return;
    loadWishes();
  }, 45000);
}

function normalizeGalleryUrl(url, purpose = "gallery") {
  const clean = String(url || "").trim();
  if (!clean) return "";

  const fileId = extractDriveFileId(clean);

  if (clean.includes("drive.google.com") && fileId) {
    return getDriveImageCandidates(fileId, purpose)[0];
  }

  return clean;
}

function getImageSizeByPurpose(purpose) {
  if (purpose === "full") return 2400;
  if (purpose === "hero") return isMobileViewport ? 1280 : 1800;
  if (purpose === "story") return isMobileViewport ? 720 : 980;
  return isMobileViewport ? 960 : 1400;
}

function getDriveImageCandidates(fileId, purpose = "gallery") {
  const size = getImageSizeByPurpose(purpose);
  return [
    `https://lh3.googleusercontent.com/d/${fileId}=w${size}`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`,
    `https://drive.google.com/uc?export=view&id=${fileId}`
  ];
}

function applyImageWithFallback(img, rawUrl, options = {}) {
  if (!img) return;

  const fallbackSrc = options.fallbackSrc || "";
  const purpose = options.purpose || "gallery";
  const cleanUrl = String(rawUrl || "").trim();
  if (!cleanUrl) {
    if (fallbackSrc) img.src = fallbackSrc;
    return;
  }

  const fileId = extractDriveFileId(cleanUrl);
  const candidates = (cleanUrl.includes("drive.google.com") && fileId)
    ? getDriveImageCandidates(fileId, purpose)
    : [cleanUrl];

  let index = 0;
  const applyNext = () => {
    const nextUrl = String(candidates[index] || "").trim();
    if (!nextUrl) {
      img.onerror = null;
      if (fallbackSrc) img.src = fallbackSrc;
      return;
    }

    index += 1;
    img.src = nextUrl;
  };

  img.onerror = () => {
    if (index >= candidates.length) {
      img.onerror = null;
      if (fallbackSrc) img.src = fallbackSrc;
      return;
    }
    applyNext();
  };

  applyNext();
}

function clearGalleryAutoplay() {
  if (!galleryState.autoplayTimer) return;
  window.clearInterval(galleryState.autoplayTimer);
  galleryState.autoplayTimer = null;
}

function openGalleryLightbox(src, index) {
  if (!lightbox || !lightboxImg) return;
  const clean = String(src || "").trim();
  if (!clean) return;

  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("gallery-lightbox-open");
  lightboxImg.alt = `Foto galeri ${index + 1} ukuran besar`;
  applyImageWithFallback(lightboxImg, clean, { purpose: "full", fallbackSrc: clean });
}

function closeGalleryLightbox() {
  if (!lightbox || !lightboxImg) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("gallery-lightbox-open");
  lightboxImg.removeAttribute("src");
}

function createGalleryCard(src, index) {
  const card = document.createElement("article");
  card.className = "gallery-item";
  card.classList.add("is-clickable");

  const img = document.createElement("img");
  img.alt = `Foto galeri ${index + 1}`;
  img.decoding = "async";
  img.loading = index < 4 ? "eager" : "lazy";
  if (index < 2) img.fetchPriority = "high";
  img.style.objectPosition = getGalleryObjectPosition(src);
  img.addEventListener("click", () => openGalleryLightbox(src, index));

  applyImageWithFallback(img, src, {
    purpose: "gallery",
    fallbackSrc: `assets/photos/foto-${(index % 6) + 1}.svg`
  });

  card.appendChild(img);
  return card;
}

function renderGalleryCarousel(photos, autoplaySec) {
  const carousel = document.createElement("div");
  carousel.className = "gallery-carousel";

  const track = document.createElement("div");
  track.className = "gallery-carousel-track";
  carousel.appendChild(track);

  const dots = document.createElement("div");
  dots.className = "gallery-dots";
  carousel.appendChild(dots);

  let activeIndex = 0;
  const maxIndex = photos.length - 1;
  const dotButtons = [];

  function updateSlide(nextIndex) {
    activeIndex = Math.max(0, Math.min(nextIndex, maxIndex));
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
    dotButtons.forEach((dot, idx) => dot.classList.toggle("is-active", idx === activeIndex));
  }

  photos.forEach((src, index) => {
    const slide = document.createElement("div");
    slide.className = "gallery-slide";
    slide.appendChild(createGalleryCard(src, index));
    track.appendChild(slide);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "gallery-dot";
    dot.setAttribute("aria-label", `Foto ${index + 1}`);
    dot.addEventListener("click", () => updateSlide(index));
    dots.appendChild(dot);
    dotButtons.push(dot);
  });

  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "gallery-nav gallery-nav-prev";
  prev.textContent = "<";
  prev.setAttribute("aria-label", "Foto sebelumnya");
  prev.addEventListener("click", () => updateSlide(activeIndex <= 0 ? maxIndex : activeIndex - 1));

  const next = document.createElement("button");
  next.type = "button";
  next.className = "gallery-nav gallery-nav-next";
  next.textContent = ">";
  next.setAttribute("aria-label", "Foto berikutnya");
  next.addEventListener("click", () => updateSlide(activeIndex >= maxIndex ? 0 : activeIndex + 1));

  if (photos.length > 1) {
    carousel.appendChild(prev);
    carousel.appendChild(next);
  }

  updateSlide(0);
  galleryGrid.appendChild(carousel);

  if (photos.length > 1 && autoplaySec > 0) {
    galleryState.autoplayTimer = window.setInterval(() => {
      updateSlide(activeIndex >= maxIndex ? 0 : activeIndex + 1);
    }, autoplaySec * 1000);

    carousel.addEventListener("mouseenter", clearGalleryAutoplay);
    carousel.addEventListener("mouseleave", () => {
      clearGalleryAutoplay();
      galleryState.autoplayTimer = window.setInterval(() => {
        updateSlide(activeIndex >= maxIndex ? 0 : activeIndex + 1);
      }, autoplaySec * 1000);
    });
  }
}

function renderGalleryGrid(photos) {
  if (!galleryGrid) return;
  clearGalleryAutoplay();
  galleryGrid.innerHTML = "";

  const fallbackPhotos = Array.isArray(WEDDING_CONFIG.galleryPhotos) ? WEDDING_CONFIG.galleryPhotos : [];
  const sourcePhotos = Array.isArray(photos) && photos.length ? photos : fallbackPhotos;
  const cleanPhotosRaw = sourcePhotos
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  const maxItems = Number(normalizeCountString(currentConfig.galleryMaxItems));
  const cleanPhotos = (Number.isFinite(maxItems) && maxItems > 0)
    ? cleanPhotosRaw.slice(0, maxItems)
    : cleanPhotosRaw;
  const mode = normalizeGalleryMode(currentConfig.galleryMode || WEDDING_CONFIG.galleryMode);
  const style = normalizeGalleryStyle(currentConfig.galleryStyle || WEDDING_CONFIG.galleryStyle);

  galleryGrid.dataset.mode = mode;
  galleryGrid.dataset.style = style;

  if (!cleanPhotos.length) {
    galleryGrid.innerHTML = '<p class="gallery-empty">Belum ada foto galeri.</p>';
    return;
  }

  if (mode === "carousel") {
    const autoplaySec = Number(normalizePositiveNumberString(currentConfig.galleryAutoplaySec || WEDDING_CONFIG.galleryAutoplaySec || "3.5")) || 3.5;
    renderGalleryCarousel(cleanPhotos, autoplaySec);
    return;
  }

  cleanPhotos.forEach((src, index) => {
    galleryGrid.appendChild(createGalleryCard(src, index));
  });
}

function extractDriveFileId(url) {
  const clean = String(url || "").trim();
  if (!clean) return "";
  const queryIdMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const pathIdMatch = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return (queryIdMatch && queryIdMatch[1]) || (pathIdMatch && pathIdMatch[1]) || "";
}

function extractDriveResourceKey(url) {
  const clean = String(url || "").trim();
  if (!clean) return "";
  const keyMatch = clean.match(/[?&]resourcekey=([a-zA-Z0-9._-]+)/i);
  return (keyMatch && keyMatch[1]) || "";
}

function buildMusicProxyUrl(fileId, resourceKey, sourceUrl) {
  const rawFileId = String(fileId || "").trim();
  const cleanFileId = isLikelyDriveFileId(rawFileId) ? rawFileId : "";
  const cleanResourceKey = String(resourceKey || "").trim();
  const cleanSourceUrl = String(sourceUrl || "").trim();
  const params = new URLSearchParams();

  if (cleanFileId) params.set("fileId", cleanFileId);
  if (cleanResourceKey) params.set("resourceKey", cleanResourceKey);
  if (!cleanFileId && cleanSourceUrl) params.set("src", cleanSourceUrl);
  if (!params.toString()) return "";

  return `/api/music?${params.toString()}`;
}

function normalizeAudioUrl(url) {
  const candidates = getAudioSourceCandidates(url);
  return candidates[0] || "";
}

function getAudioSourceCandidates(url) {
  const clean = String(url || "").trim();
  if (!clean) return [];

  const fileId = extractDriveFileId(clean);
  const resourceKey = extractDriveResourceKey(clean);
  const resourceKeySuffix = resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : "";
  const isDriveHost = /(?:^|\/\/)(?:drive|docs)\.google\.com/i.test(clean)
    || /(?:^|\/\/)drive\.usercontent\.google\.com/i.test(clean);

  if (/^\/api\/music(?:\?|$)/i.test(clean)) {
    return [clean];
  }

  if (isDriveHost && fileId) {
    const proxyUrl = buildMusicProxyUrl(fileId, resourceKey, clean);
    const candidates = [
      proxyUrl,
      clean,
      `https://drive.google.com/uc?export=download&id=${fileId}${resourceKeySuffix}`,
      `https://docs.google.com/uc?export=download&id=${fileId}${resourceKeySuffix}`,
      `https://drive.google.com/uc?export=view&id=${fileId}${resourceKeySuffix}`,
      `https://drive.usercontent.google.com/download?id=${fileId}&export=download${resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : ""}`
    ];

    const unique = [];
    const seen = new Set();
    candidates.forEach((item) => {
      const value = String(item || "").trim();
      if (!value || seen.has(value)) return;
      seen.add(value);
      unique.push(value);
    });
    return unique;
  }

  if (fileId) {
    const proxyUrl = buildMusicProxyUrl(fileId, resourceKey, clean);
    if (proxyUrl) return [proxyUrl, clean].filter(Boolean);
  }

  return [clean];
}

function applyHeroCloudPhoto() {
  if (!heroCloudPhoto) return;

  const gallerySource = Array.isArray(currentConfig.galleryPhotos) ? currentConfig.galleryPhotos[0] : "";
  const rawSource = String(currentConfig.heroBackgroundPhoto || gallerySource || "assets/photos/foto-1.svg").trim();
  const source = normalizeGalleryUrl(rawSource, "hero");
  if (!source) return;

  const safeUrl = source.replace(/"/g, '\\"');
  heroCloudPhoto.style.backgroundImage = `linear-gradient(145deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.08)), url("${safeUrl}")`;
}

function formatGoogleCalendarDate(ms) {
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

function buildCalendarEndTime(startMs) {
  const resepsiTime = String((currentConfig.resepsi && currentConfig.resepsi.time) || "").trim();
  const rangeMatch = resepsiTime.match(/(\d{1,2})[.:](\d{2})\s*[-\u2013]\s*(\d{1,2})[.:](\d{2})/);
  if (!rangeMatch) return startMs + (2 * 60 * 60 * 1000);

  const startHour = Number(rangeMatch[1]);
  const startMinute = Number(rangeMatch[2]);
  const endHour = Number(rangeMatch[3]);
  const endMinute = Number(rangeMatch[4]);
  const durationMs = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) * 60 * 1000;

  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return startMs + (2 * 60 * 60 * 1000);
  }

  return startMs + durationMs;
}

function applyCalendarLink() {
  if (!addToCalendarLink) return;

  const startMs = parseWeddingTimestamp();
  if (!Number.isFinite(startMs)) {
    addToCalendarLink.style.display = "none";
    return;
  }

  const endMs = buildCalendarEndTime(startMs);
  const title = `${currentConfig.brideShortName || "Mempelai"} & ${currentConfig.groomShortName || "Mempelai"} - Resepsi Pernikahan`;
  const location = String((currentConfig.resepsi && currentConfig.resepsi.venue) || "").trim();
  const detailParts = [
    "Undangan digital pernikahan.",
    location ? `Lokasi: ${location}` : "",
    String((currentConfig.resepsi && currentConfig.resepsi.mapUrl) || "").trim()
  ].filter(Boolean);

  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", title);
  url.searchParams.set("dates", `${formatGoogleCalendarDate(startMs)}/${formatGoogleCalendarDate(endMs)}`);
  if (detailParts.length) url.searchParams.set("details", detailParts.join("\n"));
  if (location) url.searchParams.set("location", location);

  addToCalendarLink.href = url.toString();
  addToCalendarLink.style.display = "inline-flex";
}

function getBankMeta(account) {
  const code = String(account && account.bankCode || "").trim().toLowerCase();
  if (code && BANK_CATALOG[code]) return BANK_CATALOG[code];
  const bankName = String(account && account.bankName || "").trim().toLowerCase();
  if (bankName) {
    const byName = Object.values(BANK_CATALOG).find((item) =>
      item.name.toLowerCase() === bankName
      || (Array.isArray(item.aliases) && item.aliases.some((alias) => alias.toLowerCase() === bankName))
    );
    if (byName) return byName;
  }
  return null;
}

function getGiftLogoUrl(account, bankMeta) {
  if (bankMeta && bankMeta.logoUrl) return bankMeta.logoUrl;
  return String(account && account.logoUrl || "").trim();
}

function getGiftAccountCategory(account) {
  const source = `${account && account.bankCode || ""} ${account && account.bankName || ""}`.toLowerCase();
  const ewalletKeywords = ["dana", "ovo", "gopay", "go-pay", "shopeepay", "shopee pay", "linkaja", "link aja", "sakuku"];
  return ewalletKeywords.some((keyword) => source.includes(keyword)) ? "ewallet" : "bank";
}

function createGiftHead(bankName, logoUrl) {
  const head = document.createElement("div");
  head.className = "gift-bank-brand";

  const bankCodeText = String(bankName || "").trim().slice(0, 6).toUpperCase() || "BANK";
  const fallback = document.createElement("div");
  fallback.className = "gift-bank-fallback";
  fallback.textContent = bankCodeText;
  head.appendChild(fallback);

  if (logoUrl) {
    const logo = document.createElement("img");
    logo.className = "gift-bank-logo";
    logo.alt = `${bankName} logo`;
    logo.loading = "lazy";
    logo.src = logoUrl;
    logo.addEventListener("load", () => {
      fallback.classList.add("is-hidden");
    });
    logo.onerror = () => {
      logo.remove();
      fallback.classList.remove("is-hidden");
    };
    head.insertBefore(logo, fallback);
  }

  const bankText = document.createElement("p");
  bankText.className = "gift-bank-name";
  bankText.textContent = bankName;
  head.appendChild(bankText);

  return head;
}

function renderGiftCategoryTabs(categoryEntries, activeCategory) {
  if (!giftCategoryTabs) return;
  giftCategoryTabs.innerHTML = "";
  giftCategoryTabs.style.display = categoryEntries.length > 1 ? "flex" : (categoryEntries.length === 1 ? "grid" : "none");

  categoryEntries.forEach(([key, items]) => {
    if (!items.length) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gift-category-tab";
    const isActive = key === activeCategory && giftUiState.isExpanded;
    if (isActive) button.classList.add("is-active");
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", isActive ? "true" : "false");
    button.setAttribute("aria-expanded", isActive ? "true" : "false");
    button.textContent = key === "ewallet" ? "E-Wallet" : "Transfer Bank";

    const chevron = document.createElement("span");
    chevron.className = "gift-category-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "▾";
    button.appendChild(chevron);

    button.addEventListener("click", () => {
      if (giftUiState.activeCategory === key) {
        giftUiState.isExpanded = !giftUiState.isExpanded;
      } else {
        giftUiState.activeCategory = key;
        giftUiState.isExpanded = true;
      }
      renderGiftSection();
    });
    giftCategoryTabs.appendChild(button);
  });
}

function renderGiftSection() {
  if (!giftSection || !giftAccountsList) return;

  const enabled = normalizeBoolean(currentConfig.giftEnabled, false);
  const accounts = normalizeGiftAccounts(currentConfig.giftAccounts).filter((item) => item.isActive);
  if (!enabled || !accounts.length) {
    giftSection.style.display = "none";
    if (giftCategoryTabs) giftCategoryTabs.innerHTML = "";
    return;
  }

  giftSection.style.display = "";
  let sectionTitleText = String(currentConfig.giftSectionTitle || "Wedding Gift").trim() || "Wedding Gift";
  let sectionSubtitleText = String(currentConfig.giftSectionSubtitle || "").trim();
  if (sectionTitleText.length > 60 && !sectionSubtitleText) {
    sectionSubtitleText = sectionTitleText;
    sectionTitleText = "Wedding Gift";
  }

  if (giftSectionTitle) {
    giftSectionTitle.textContent = sectionTitleText;
  }
  if (giftSectionSubtitle) {
    giftSectionSubtitle.textContent = sectionSubtitleText || "Doa restu Anda adalah hadiah terindah.";
  }

  const groupedAccounts = {
    bank: accounts.filter((account) => getGiftAccountCategory(account) === "bank"),
    ewallet: accounts.filter((account) => getGiftAccountCategory(account) === "ewallet")
  };
  const categoryEntries = Object.entries(groupedAccounts).filter(([, items]) => items.length);
  const defaultCategory = categoryEntries[0] ? categoryEntries[0][0] : "";
  const activeCategory = groupedAccounts[giftUiState.activeCategory] && groupedAccounts[giftUiState.activeCategory].length
    ? giftUiState.activeCategory
    : defaultCategory;
  giftUiState.activeCategory = activeCategory;
  renderGiftCategoryTabs(categoryEntries, activeCategory);

  giftAccountsList.innerHTML = "";
  giftAccountsList.classList.toggle("is-hidden", !giftUiState.isExpanded);
  if (!giftUiState.isExpanded) return;
  giftAccountsList.classList.toggle("is-single", (groupedAccounts[activeCategory] || []).length === 1);
  (groupedAccounts[activeCategory] || []).forEach((account) => {
    const bankMeta = getBankMeta(account);
    const bankName = String(account.bankName || (bankMeta && bankMeta.name) || "Bank").trim();
    const logoUrl = getGiftLogoUrl(account, bankMeta);
    const card = document.createElement("article");
    card.className = "gift-account-card";

    const head = createGiftHead(bankName, logoUrl);

    const body = document.createElement("div");
    body.className = "gift-account-body";

    const holder = document.createElement("p");
    holder.className = "gift-account-holder";
    holder.textContent = account.accountHolder ? `a/n ${account.accountHolder}` : "-";

    const accountNumber = document.createElement("p");
    accountNumber.className = "gift-account-number";
    accountNumber.textContent = account.accountNumber;

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "gift-copy-btn";
    copyBtn.textContent = "Salin Rekening";
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(account.accountNumber);
        copyBtn.textContent = "Tersalin";
        window.setTimeout(() => {
          copyBtn.textContent = "Salin Rekening";
        }, 1200);
      } catch (error) {
        copyBtn.textContent = "Gagal Salin";
        window.setTimeout(() => {
          copyBtn.textContent = "Salin Rekening";
        }, 1400);
      }
    });

    body.appendChild(head);
    body.appendChild(holder);
    body.appendChild(accountNumber);
    body.appendChild(copyBtn);
    card.appendChild(body);
    giftAccountsList.appendChild(card);
  });
}

function applyWeddingConfig() {
  setBrandMonogram(currentConfig.brandInitials);
  setText("heroOverline", currentConfig.heroOverline || "Wedding Invitation");
  setAnimatedName("heroBrideShort", currentConfig.brideShortName, 140);
  setAnimatedName("heroGroomShort", currentConfig.groomShortName, 420);
  setText("heroDatePlace", currentConfig.heroDatePlace);
  setText("gateNames", `${currentConfig.brideShortName || "Mempelai"} & ${currentConfig.groomShortName || "Mempelai"}`);
  setText("gateDatePlace", currentConfig.heroDatePlace);

  setText("avatarBride", (currentConfig.brideShortName || "A").charAt(0).toUpperCase());
  setText("avatarGroom", (currentConfig.groomShortName || "F").charAt(0).toUpperCase());

  setText("brideFullName", currentConfig.brideFullName);
  setText("groomFullName", currentConfig.groomFullName);
  setText("brideParents", currentConfig.brideParents);
  setText("groomParents", currentConfig.groomParents);
  setText("footerNames", currentConfig.footerNames);

  setHtml("quranAyatArab", currentConfig.quranVerseArabic);
  setText("quranAyatTrans", currentConfig.quranVerseTranslation);
  setText("quranAyatRef", currentConfig.quranVerseReference);
  setText("hadithText", currentConfig.hadithText);
  setText("hadithReference", currentConfig.hadithReference);
  setText("marriageDoaText", currentConfig.marriageDoaText);
  setText("marriageDoaReference", currentConfig.marriageDoaReference);

  const quranBlock = document.getElementById("quranBlock");
  const hadithBlock = document.getElementById("hadithBlock");
  const doaBlock = document.getElementById("doaBlock");

  const hasQuran = Boolean(
    String(currentConfig.quranVerseArabic || "").trim() ||
    String(currentConfig.quranVerseTranslation || "").trim() ||
    String(currentConfig.quranVerseReference || "").trim()
  );
  const hasHadith = Boolean(
    String(currentConfig.hadithText || "").trim() ||
    String(currentConfig.hadithReference || "").trim()
  );
  const hasDoa = Boolean(
    String(currentConfig.marriageDoaText || "").trim() ||
    String(currentConfig.marriageDoaReference || "").trim()
  );

  if (quranBlock) quranBlock.style.display = hasQuran ? "" : "none";
  if (hadithBlock) hadithBlock.style.display = hasHadith ? "" : "none";
  if (doaBlock) doaBlock.style.display = hasDoa ? "" : "none";

  const activeTracks = getActiveMusicTracks(currentConfig);
  const firstTrack = activeTracks[0];
  const resolvedMusicUrl = firstTrack ? normalizeAudioUrl(firstTrack.url) : "";
  if (resolvedMusicUrl && bgMusic) {
    bgMusic.src = resolvedMusicUrl;
  }

  const akadCard = document.getElementById("akadCard");
  const resepsiCard = document.getElementById("resepsiCard");

  if (currentConfig.akad) {
    setText("akadDate", currentConfig.akad.date);
    setText("akadTime", currentConfig.akad.time);
    setText("akadVenue", currentConfig.akad.venue);
    setLink("akadMap", currentConfig.akad.mapUrl);
    setLink("akadMapOpen", currentConfig.akad.mapUrl);
    setIframeSrc("akadMapEmbed", buildEmbedUrl(currentConfig.akad.mapUrl, currentConfig.akad.venue));

    const hasAkadValue = Boolean(
      String(currentConfig.akad.date || "").trim() ||
      String(currentConfig.akad.time || "").trim() ||
      String(currentConfig.akad.venue || "").trim()
    );
    if (akadCard) akadCard.classList.toggle("is-hidden", !hasAkadValue);
  } else if (akadCard) {
    akadCard.classList.add("is-hidden");
  }

  if (currentConfig.resepsi) {
    setText("resepsiDate", currentConfig.resepsi.date);
    setText("resepsiTime", currentConfig.resepsi.time);
    setText("resepsiVenue", currentConfig.resepsi.venue);
    setInternalAnchorLink("resepsiMap", "#peta");
    setLink("resepsiMapOpen", currentConfig.resepsi.mapUrl);
    setIframeSrc("resepsiMapEmbed", buildEmbedUrl(currentConfig.resepsi.mapUrl, currentConfig.resepsi.venue));

    const hasResepsiValue = Boolean(
      String(currentConfig.resepsi.date || "").trim() ||
      String(currentConfig.resepsi.time || "").trim() ||
      String(currentConfig.resepsi.venue || "").trim()
    );
    if (resepsiCard) resepsiCard.classList.toggle("is-hidden", !hasResepsiValue);
  } else if (resepsiCard) {
    resepsiCard.classList.add("is-hidden");
  }

  renderGalleryGrid(currentConfig.galleryPhotos);
  renderGiftSection();

  if (Array.isArray(currentConfig.loveStoryPhotos)) {
    currentConfig.loveStoryPhotos.slice(0, 3).forEach((src, index) => {
      const img = document.getElementById(`storyPhoto${index + 1}`);
      applyImageWithFallback(img, src, {
        purpose: "story",
        fallbackSrc: `assets/photos/foto-${index + 1}.svg`
      });
    });
  }

  const storyItems = Array.isArray(currentConfig.loveStoryItems) && currentConfig.loveStoryItems.length
    ? currentConfig.loveStoryItems
    : (Array.isArray(WEDDING_CONFIG.loveStoryItems) ? WEDDING_CONFIG.loveStoryItems : []);
  storyItems.slice(0, 3).forEach((item, index) => {
    const i = index + 1;
    setText(`storyYear${i}`, formatStoryDateDisplay(item && item.date));
    setText(`storyTitle${i}`, item && item.title);
    setText(`storyDesc${i}`, cleanStoryDescription(item && item.description));
  });

  applyHeroCloudPhoto();
  applyCalendarLink();

  const titleNames = `${currentConfig.brideShortName || "Mempelai"} & ${currentConfig.groomShortName || "Mempelai"}`;
  const seoTitle = String(currentConfig.seoTitle || "").trim();
  const seoDescription = String(currentConfig.seoDescription || "").trim();
  document.title = seoTitle || `Undangan Pernikahan | ${titleNames}`;
  setMetaDescription(seoDescription || "Undangan pernikahan digital dengan RSVP online.");
}

function setupInvitationGate() {
  if (!invitationGate || !openInvitationBtn) {
    document.body.classList.remove("invitation-locked");
    return;
  }

  openInvitationBtn.addEventListener("click", () => {
    attemptMusicStartFromGesture().catch(() => {});
    invitationGate.classList.add("is-opening");
    openInvitationBtn.disabled = true;

    window.setTimeout(() => {
      document.body.classList.remove("invitation-locked");
      invitationGate.setAttribute("aria-hidden", "true");
      invitationGate.classList.remove("is-opening");
      openInvitationBtn.disabled = false;
    }, 620);
  });
}

function applyGuestName() {
  const guestName = getGuestNameFromUrl();
  setText("guestName", guestName);
  setText("gateGuestName", guestName);
  if (inputNama && guestName !== "Bapak/Ibu/Saudara/i") {
    inputNama.value = guestName;
  }
}

function setCountdownNumber(el, value) {
  if (!el) return;
  const nextValue = String(value);
  if (el.textContent === nextValue) return;
  el.textContent = nextValue;
  el.classList.remove("tick");
  void el.offsetWidth;
  el.classList.add("tick");
}

function parseIsoDateTimeToMs(value) {
  const clean = String(value || "").trim();
  if (!clean) return NaN;

  const match = clean.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(Z|[+\-]\d{2}:\d{2})?$/
  );
  if (!match) return NaN;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || 0);
  const tz = match[7] || "+07:00";

  let offsetMinutes = 0;
  if (tz === "Z") {
    offsetMinutes = 0;
  } else {
    const sign = tz.startsWith("-") ? -1 : 1;
    const parts = tz.slice(1).split(":");
    const tzHour = Number(parts[0] || 0);
    const tzMinute = Number(parts[1] || 0);
    offsetMinutes = sign * (tzHour * 60 + tzMinute);
  }

  return Date.UTC(year, month - 1, day, hour, minute, second) - (offsetMinutes * 60 * 1000);
}

function parseIndonesianDateToMs(dateText, timeText) {
  const rawDate = String(dateText || "").trim();
  if (!rawDate) return NaN;

  const normalized = rawDate
    .toLowerCase()
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const monthMap = {
    januari: 1,
    februari: 2,
    maret: 3,
    april: 4,
    mei: 5,
    juni: 6,
    juli: 7,
    agustus: 8,
    september: 9,
    oktober: 10,
    november: 11,
    desember: 12
  };

  let day = null;
  let month = null;
  let year = null;

  const rangeSameMonthMatch = normalized.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (rangeSameMonthMatch && monthMap[rangeSameMonthMatch[3]]) {
    day = Number(rangeSameMonthMatch[1]);
    month = Number(monthMap[rangeSameMonthMatch[3]]);
    year = Number(rangeSameMonthMatch[4]);
  } else {
    const rangeTwoMonthMatch = normalized.match(/(\d{1,2})\s+([a-z]+)\s*-\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
    if (rangeTwoMonthMatch && monthMap[rangeTwoMonthMatch[2]]) {
      day = Number(rangeTwoMonthMatch[1]);
      month = Number(monthMap[rangeTwoMonthMatch[2]]);
      year = Number(rangeTwoMonthMatch[5]);
    }
  }

  if (!day || !month || !year) {
    const idMatch = normalized.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
    if (idMatch && monthMap[idMatch[2]]) {
      day = Number(idMatch[1]);
      month = Number(monthMap[idMatch[2]]);
      year = Number(idMatch[3]);
    } else {
      const slashMatch = normalized.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (slashMatch) {
        day = Number(slashMatch[1]);
        month = Number(slashMatch[2]);
        year = Number(slashMatch[3]);
      }
    }
  }

  if (!day || !month || !year) {
    const anyDateMatch = normalized.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/g);
    if (anyDateMatch && anyDateMatch.length) {
      const first = anyDateMatch[0].match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
      if (first && monthMap[first[2]]) {
        day = Number(first[1]);
        month = Number(monthMap[first[2]]);
        year = Number(first[3]);
      }
    }
  }

  if (!day || !month || !year) return NaN;

  let hour = 8;
  let minute = 0;
  const rawTime = String(timeText || "").trim().toLowerCase();
  if (rawTime) {
    const timeMatch = rawTime.match(/(\d{1,2})[.:](\d{2})/);
    if (timeMatch) {
      hour = Number(timeMatch[1]);
      minute = Number(timeMatch[2]);
    }
  }

  return Date.UTC(year, month - 1, day, hour, minute, 0) - (7 * 60 * 60 * 1000);
}

function parsePrimaryWeddingTimestamp() {
  const resepsiDate = (currentConfig.resepsi && currentConfig.resepsi.date) || "";
  const resepsiTime = (currentConfig.resepsi && currentConfig.resepsi.time) || "";
  const resepsiMs = parseIndonesianDateToMs(resepsiDate, resepsiTime);
  if (!Number.isNaN(resepsiMs)) return resepsiMs;

  const akadDate = (currentConfig.akad && currentConfig.akad.date) || "";
  const akadTime = (currentConfig.akad && currentConfig.akad.time) || "";
  const akadMs = parseIndonesianDateToMs(akadDate, akadTime);
  if (!Number.isNaN(akadMs)) return akadMs;

  const heroMs = parseIndonesianDateToMs(currentConfig.heroDatePlace || "", resepsiTime);
  if (!Number.isNaN(heroMs)) return heroMs;

  const eventStartIso = String(currentConfig.eventStartISO || "").trim();
  if (eventStartIso) {
    const eventStartMs = parseIsoDateTimeToMs(eventStartIso);
    if (!Number.isNaN(eventStartMs)) return eventStartMs;
  }

  const isoValue = String(currentConfig.weddingDateISO || "").trim();
  if (isoValue) {
    const isoTime = parseIsoDateTimeToMs(isoValue);
    if (!Number.isNaN(isoTime)) return isoTime;
  }

  return NaN;
}

function parseWeddingTimestamp() {
  return parsePrimaryWeddingTimestamp();
}

function parseCountdownTimestamp() {
  const primary = parsePrimaryWeddingTimestamp();
  if (Number.isNaN(primary)) return NaN;

  const eventStartIso = String(currentConfig.eventStartISO || "").trim();
  const weddingIso = String(currentConfig.weddingDateISO || "").trim();
  const sourceIso = eventStartIso || weddingIso;
  const resepsiTime = String((currentConfig.resepsi && currentConfig.resepsi.time) || "").trim();
  const akadTime = String((currentConfig.akad && currentConfig.akad.time) || "").trim();
  const hasExplicitEventTime = Boolean(
    /(\d{1,2})[.:](\d{2})/.test(resepsiTime) ||
    /(\d{1,2})[.:](\d{2})/.test(akadTime)
  );
  const isoLooksMidnight = /T00:00(?::00)?(?:Z|[+\-]\d{2}:\d{2})?$/i.test(sourceIso);

  // Jika admin hanya memilih tanggal tanpa jam, countdown terasa lebih natural
  // bila diarahkan ke akhir hari itu, bukan tepat jam 00:00.
  if (sourceIso && isoLooksMidnight && !hasExplicitEventTime) {
    return primary + ((24 * 60 * 60 * 1000) - 1000);
  }

  return primary;
}

function updateCountdown() {
  const weddingDate = parseCountdownTimestamp();

  if (Number.isNaN(weddingDate)) {
    countdownNodes.forEach((node) => setCountdownNumber(node, "-"));
    return;
  }

  const now = Date.now();
  const distance = weddingDate - now;

  if (distance <= 0) {
    countdownNodes.forEach((node) => setCountdownNumber(node, "0"));
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  setCountdownNumber(cdDays, String(days));
  setCountdownNumber(cdHours, String(hours).padStart(2, "0"));
  setCountdownNumber(cdMinutes, String(minutes).padStart(2, "0"));
  setCountdownNumber(cdSeconds, String(seconds).padStart(2, "0"));
}

function setupRevealAnimation() {
  const sections = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  sections.forEach((section) => observer.observe(section));
}

function setupMusicControl() {
  if (!musicToggle || !bgMusic) return;

  const activeTracks = getActiveMusicTracks(currentConfig);
  musicState.activeTracks = activeTracks;
  musicState.playbackMode = normalizeMusicPlaybackMode(currentConfig.musicPlaybackMode || "ordered");
  musicState.currentTrackIndex = 0;
  let allMusicCandidates = [];
  let primaryCandidateCount = 0;
  let currentMusicCandidateIndex = -1;

  function rebuildCandidateList(trackIndex) {
    const track = musicState.activeTracks[trackIndex];
    const primaryCandidates = track ? getAudioSourceCandidates(track.url) : [];
    const fallbackCandidates = getAudioSourceCandidates(WEDDING_CONFIG.backgroundMusicUrl);
    const nextCandidates = [];
    const seenCandidate = new Set();
    [...primaryCandidates, ...fallbackCandidates].forEach((item) => {
      const value = String(item || "").trim();
      if (!value || seenCandidate.has(value)) return;
      seenCandidate.add(value);
      nextCandidates.push(value);
    });
    primaryCandidateCount = primaryCandidates.length;
    allMusicCandidates = nextCandidates;
    currentMusicCandidateIndex = -1;
    return nextCandidates;
  }

  function pickNextTrackIndex() {
    if (!musicState.activeTracks.length) return -1;
    if (musicState.playbackMode === "shuffle" && musicState.activeTracks.length > 1) {
      let nextIndex = musicState.currentTrackIndex;
      while (nextIndex === musicState.currentTrackIndex) {
        nextIndex = Math.floor(Math.random() * musicState.activeTracks.length);
      }
      return nextIndex;
    }
    const orderedIndex = musicState.currentTrackIndex + 1;
    return orderedIndex >= musicState.activeTracks.length ? 0 : orderedIndex;
  }

  function loadTrack(trackIndex) {
    const candidates = rebuildCandidateList(trackIndex);
    if (!candidates.length) return false;
    musicState.currentTrackIndex = trackIndex;
    currentMusicCandidateIndex = 0;
    bgMusic.src = candidates[0];
    bgMusic.load();
    return true;
  }

  const hasMusic = Boolean(activeTracks.length);
  if (!hasMusic) {
    musicToggle.disabled = true;
    musicToggle.textContent = "Audio";
    return;
  }

  function setPlayingState(isPlaying) {
    musicToggle.textContent = isPlaying ? "Pause" : "Music";
    musicToggle.classList.toggle("is-playing", isPlaying);
  }

  function useMusicCandidate(index) {
    if (index < 0 || index >= allMusicCandidates.length) return false;
    const target = allMusicCandidates[index];
    if (!target) return false;

    currentMusicCandidateIndex = index;
    if (bgMusic.src !== target) {
      bgMusic.src = target;
      bgMusic.load();
    }

    if (index >= primaryCandidateCount) {
      musicToggle.textContent = "Music";
    }
    return true;
  }

  loadTrack(0);

  async function startMusicFromGesture(recursionDepth = 0) {
    if (!bgMusic.src && allMusicCandidates.length) {
      useMusicCandidate(0);
    }

    if (!bgMusic.paused) {
      setPlayingState(true);
      return true;
    }

    try {
      await bgMusic.play();
      if ((bgMusic.currentTime || 0) <= 0.25 && musicState.startSec > 0) {
        seekAudio(musicState.startSec);
      }
      setPlayingState(true);
      return true;
    } catch (error) {
      const switched = useMusicCandidate(currentMusicCandidateIndex + 1);
      if (switched && recursionDepth < allMusicCandidates.length) {
        return startMusicFromGesture(recursionDepth + 1);
      }
      const nextTrackIndex = pickNextTrackIndex();
      if (nextTrackIndex >= 0 && nextTrackIndex !== musicState.currentTrackIndex) {
        const loaded = loadTrack(nextTrackIndex);
        if (loaded && recursionDepth < (allMusicCandidates.length + musicState.activeTracks.length)) {
          return startMusicFromGesture(recursionDepth + 1);
        }
      }
      setPlayingState(false);
      musicToggle.textContent = "Audio";
      return false;
    }
  }

  function parseAudioSecond(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return null;
    return num;
  }

  const parsedStart = parseAudioSecond(currentConfig.musicStartSec);
  const parsedLoopStart = parseAudioSecond(currentConfig.musicLoopStartSec);
  const parsedLoopEnd = parseAudioSecond(currentConfig.musicLoopEndSec);

  musicState.startSec = parsedStart ?? (parsedLoopStart ?? 0);
  musicState.loopStartSec = parsedLoopStart;
  musicState.loopEndSec = parsedLoopEnd;

  const hasSegmentLoop = (
    musicState.activeTracks.length <= 1 &&
    musicState.loopStartSec !== null &&
    musicState.loopEndSec !== null &&
    musicState.loopEndSec > musicState.loopStartSec
  );
  bgMusic.loop = musicState.activeTracks.length <= 1 && !hasSegmentLoop;

  function seekAudio(second) {
    const target = Number(second);
    if (!Number.isFinite(target) || target <= 0) return;
    try {
      const maxDuration = Number.isFinite(bgMusic.duration) ? bgMusic.duration : null;
      const safeTarget = maxDuration
        ? Math.min(target, Math.max(0, maxDuration - 0.25))
        : target;
      if (safeTarget > 0) bgMusic.currentTime = safeTarget;
    } catch (error) {
      // Skip seek jika metadata belum siap / browser menolak seek saat ini.
    }
  }

  const applyInitialOffset = () => seekAudio(musicState.startSec);

  bgMusic.addEventListener("loadedmetadata", applyInitialOffset);
  if (bgMusic.readyState >= 1) applyInitialOffset();

  bgMusic.addEventListener("timeupdate", () => {
    if (!hasSegmentLoop) return;

    const loopStart = Math.max(0, musicState.loopStartSec || 0);
    const loopEnd = Math.max(loopStart + 0.1, musicState.loopEndSec || 0);
    const current = bgMusic.currentTime || 0;

    if (current >= loopEnd) {
      bgMusic.currentTime = loopStart;
      if (bgMusic.paused) {
        bgMusic.play().catch(() => {});
      }
    }
  });

  setPlayingState(false);

  attemptMusicStartFromGesture = startMusicFromGesture;

  musicToggle.addEventListener("click", async () => {
    if (bgMusic.paused) {
      await startMusicFromGesture();
    } else {
      bgMusic.pause();
      setPlayingState(false);
    }
  });

  bgMusic.addEventListener("ended", async () => {
    if (musicState.activeTracks.length > 1) {
      const nextTrackIndex = pickNextTrackIndex();
      if (nextTrackIndex >= 0) {
        const loaded = loadTrack(nextTrackIndex);
        if (loaded) {
          const started = await startMusicFromGesture();
          if (started) return;
        }
      }
    }
    setPlayingState(false);
  });
  bgMusic.addEventListener("error", () => {
    const nextIndex = currentMusicCandidateIndex + 1;
    const switched = useMusicCandidate(nextIndex);
    musicToggle.textContent = switched ? musicToggle.textContent : "Audio";
  });
}

function createLeaf() {
  if (!leafLayer || leafLayer.childElementCount >= particleState.maxLeaves) return;

  const leaf = document.createElement("span");
  leaf.className = "leaf";
  const left = Math.random() * 100;
  const duration = (isLowPowerDevice ? 9 : 8) + Math.random() * (isLowPowerDevice ? 6 : 8);
  const delay = Math.random() * 1.2;
  const scale = 0.7 + Math.random() * 1.1;

  leaf.style.left = `${left}%`;
  leaf.style.animationDuration = `${duration}s`;
  leaf.style.animationDelay = `${delay}s`;
  leaf.style.transform = `scale(${scale})`;

  leafLayer.appendChild(leaf);
  setTimeout(() => leaf.remove(), (duration + delay) * 1000 + 200);
}

function createFlower() {
  if (!flowerLayer || flowerLayer.childElementCount >= particleState.maxFlowers) return;

  const petalCount = isLowPowerDevice ? 1 : (Math.random() < 0.45 ? 2 : 1);

  for (let i = 0; i < petalCount; i += 1) {
    if (flowerLayer.childElementCount >= particleState.maxFlowers) break;

    const flower = document.createElement("span");
    flower.className = "flower";
    const left = Math.random() * 100;
    const duration = (isLowPowerDevice ? 9 : 7.5) + Math.random() * (isLowPowerDevice ? 4.5 : 6);
    const delay = Math.random() * 1.1;
    const scale = 0.6 + Math.random() * 0.85;
    const driftX = (Math.random() < 0.5 ? -1 : 1) * (16 + Math.random() * 44);
    const spinDeg = (Math.random() < 0.5 ? -1 : 1) * (220 + Math.random() * 240);

    flower.style.left = `${left}%`;
    flower.style.animationDuration = `${duration}s`;
    flower.style.animationDelay = `${delay}s`;
    flower.style.setProperty("--petal-scale", scale.toFixed(3));
    flower.style.setProperty("--drift-x", `${driftX.toFixed(2)}px`);
    flower.style.setProperty("--spin-deg", `${spinDeg.toFixed(1)}deg`);

    flowerLayer.appendChild(flower);
    setTimeout(() => flower.remove(), (duration + delay) * 1000 + 220);
  }
}

function startTimers() {
  if (!particleState.countdownTimer) {
    particleState.countdownTimer = window.setInterval(updateCountdown, 1000);
  }

  if (prefersReducedMotion) return;

  if (!particleState.leafTimer && leafLayer) {
    particleState.leafTimer = window.setInterval(createLeaf, isLowPowerDevice ? 1300 : 900);
  }

  if (!particleState.flowerTimer && flowerLayer) {
    particleState.flowerTimer = window.setInterval(createFlower, isLowPowerDevice ? 1600 : 1100);
  }
}

function stopTimers() {
  if (particleState.countdownTimer) {
    clearInterval(particleState.countdownTimer);
    particleState.countdownTimer = null;
  }

  if (particleState.leafTimer) {
    clearInterval(particleState.leafTimer);
    particleState.leafTimer = null;
  }

  if (particleState.flowerTimer) {
    clearInterval(particleState.flowerTimer);
    particleState.flowerTimer = null;
  }
}

function setupVisibilityOptimization() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopTimers();
      clearGalleryAutoplay();
    } else {
      updateCountdown();
      startTimers();
      renderGalleryGrid(currentConfig.galleryPhotos);
    }
  });
}

if (lightbox) {
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeGalleryLightbox();
    }
  });
}

if (lightboxCloseBtn) {
  lightboxCloseBtn.addEventListener("click", closeGalleryLightbox);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox && lightbox.classList.contains("is-open")) {
    closeGalleryLightbox();
  }
});

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!RSVP_API_URL || RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
      setFormStatus("URL backend belum diisi pada config.js", "is-error");
      return;
    }

    const formData = new FormData(form);
    const payload = {
      nama: formData.get("nama")?.toString().trim(),
      jumlah: Number(formData.get("jumlah")),
      kehadiran: formData.get("kehadiran"),
      ucapan: formData.get("ucapan")?.toString().trim() || "-"
    };

    setFormStatus("Mengirim RSVP...", "is-loading");
    if (submitRsvpBtn) submitRsvpBtn.disabled = true;

    try {
      const response = await fetchWithTimeout(RSVP_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      }, 10000);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengirim data");
      }

      form.reset();
      applyGuestName();
      setFormStatus("RSVP berhasil dikirim. Terima kasih.", "is-success");
      loadWishes();
    } catch (error) {
      setFormStatus(`Terjadi kesalahan: ${error.message}`, "is-error");
    } finally {
      if (submitRsvpBtn) submitRsvpBtn.disabled = false;
    }
  });
}

if (wishesList) {
  const pauseAutoScroll = () => {
    wishesAutoPauseUntil = Date.now() + 4500;
  };

  wishesList.addEventListener("wheel", pauseAutoScroll, { passive: true });
  wishesList.addEventListener("touchstart", pauseAutoScroll, { passive: true });
  wishesList.addEventListener("touchmove", pauseAutoScroll, { passive: true });
}

async function initPage() {
  setLoaderMessage("Memuat data undangan dari Sheet...", false);

  try {
    const ready = await loadServerConfig();
    const shouldUseServer = RSVP_API_URL && !RSVP_API_URL.includes("PASTE_WEB_APP_URL");

    if (shouldUseServer && !ready) {
      setLoaderMessage("Gagal memuat data Sheet. Periksa Apps Script lalu coba lagi.", true);
      return;
    }
  } finally {
    const shouldKeepLoading = loaderRetry && !loaderRetry.hidden;
    if (shouldKeepLoading) return;

    applyWeddingConfig();
    applyGuestName();
    loadWishes();
    updateCountdown();
    setupRevealAnimation();
    setupMusicControl();
    setupVisibilityOptimization();
    setupInvitationGate();
    startTimers();
    startWishesRefresh();

    window.requestAnimationFrame(() => {
      document.body.classList.remove("is-loading");
      document.body.removeAttribute("aria-busy");
      if (pageLoader) pageLoader.setAttribute("aria-hidden", "true");
    });
  }
}

initPage();

if (loaderRetry) {
  loaderRetry.addEventListener("click", () => {
    loaderRetry.hidden = true;
    initPage();
  });
}

