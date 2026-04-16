const form = document.getElementById("rsvpForm");
const statusText = document.getElementById("formStatus");
const inputNama = document.getElementById("inputNama");

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

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmallScreen = window.matchMedia("(max-width: 860px)").matches;
const isLowPowerDevice = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || isSmallScreen;

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
  loopEndSec: null
};

let currentConfig = {
  ...WEDDING_CONFIG,
  akad: { ...(WEDDING_CONFIG.akad || {}) },
  resepsi: { ...(WEDDING_CONFIG.resepsi || {}) },
  galleryPhotos: Array.isArray(WEDDING_CONFIG.galleryPhotos) ? [...WEDDING_CONFIG.galleryPhotos] : []
};
const CONFIG_CACHE_KEY = "wedding_config_cache_v2";
const CONFIG_CACHE_TTL_MS = 1000 * 60 * 10;

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.textContent = value;
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
  if (cleanMapUrl.includes("google.com/maps/embed")) {
    return cleanMapUrl;
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

function mergeConfig(base, incoming) {
  if (!incoming || typeof incoming !== "object") return base;

  const incomingMusicUrl = String(incoming.backgroundMusicUrl || "").trim();
  const baseMusicUrl = String(base.backgroundMusicUrl || "").trim();

  return {
    ...base,
    ...incoming,
    backgroundMusicUrl: incomingMusicUrl || baseMusicUrl,
    akad: {
      ...(base.akad || {}),
      ...(incoming.akad || {})
    },
    resepsi: {
      ...(base.resepsi || {}),
      ...(incoming.resepsi || {})
    },
    galleryPhotos: Array.isArray(incoming.galleryPhotos) && incoming.galleryPhotos.length
      ? incoming.galleryPhotos
      : base.galleryPhotos
  };
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

function normalizeGalleryUrl(url) {
  const clean = String(url || "").trim();
  if (!clean) return "";

  const fileId = extractDriveFileId(clean);

  if (clean.includes("drive.google.com") && fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
  }

  return clean;
}

function extractDriveFileId(url) {
  const clean = String(url || "").trim();
  if (!clean) return "";
  const queryIdMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const pathIdMatch = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return (queryIdMatch && queryIdMatch[1]) || (pathIdMatch && pathIdMatch[1]) || "";
}

function normalizeAudioUrl(url) {
  const clean = String(url || "").trim();
  if (!clean) return "";

  const fileId = extractDriveFileId(clean);
  if (clean.includes("drive.google.com") && fileId) {
    return `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
  }

  return clean;
}

function applyHeroCloudPhoto() {
  if (!heroCloudPhoto) return;

  const gallerySource = Array.isArray(currentConfig.galleryPhotos) ? currentConfig.galleryPhotos[0] : "";
  const rawSource = String(currentConfig.heroBackgroundPhoto || gallerySource || "assets/photos/foto-1.svg").trim();
  const source = normalizeGalleryUrl(rawSource);
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
  const rangeMatch = resepsiTime.match(/(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/);
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

function applyWeddingConfig() {
  setText("brandInitials", currentConfig.brandInitials);
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

  const primaryMusicUrl = normalizeAudioUrl(currentConfig.backgroundMusicUrl);
  const fallbackMusicUrl = normalizeAudioUrl(WEDDING_CONFIG.backgroundMusicUrl);
  const resolvedMusicUrl = primaryMusicUrl || fallbackMusicUrl;
  if (resolvedMusicUrl && bgMusic) {
    bgMusic.src = resolvedMusicUrl;
  }

  if (currentConfig.akad) {
    setText("akadDate", currentConfig.akad.date);
    setText("akadTime", currentConfig.akad.time);
    setText("akadVenue", currentConfig.akad.venue);
    setLink("akadMap", currentConfig.akad.mapUrl);
    setLink("akadMapOpen", currentConfig.akad.mapUrl);
    setIframeSrc("akadMapEmbed", buildEmbedUrl(currentConfig.akad.mapUrl, currentConfig.akad.venue));
  }

  if (currentConfig.resepsi) {
    setText("resepsiDate", currentConfig.resepsi.date);
    setText("resepsiTime", currentConfig.resepsi.time);
    setText("resepsiVenue", currentConfig.resepsi.venue);
    setLink("resepsiMap", currentConfig.resepsi.mapUrl);
    setLink("resepsiMapOpen", currentConfig.resepsi.mapUrl);
    setIframeSrc("resepsiMapEmbed", buildEmbedUrl(currentConfig.resepsi.mapUrl, currentConfig.resepsi.venue));
  }

  if (Array.isArray(currentConfig.galleryPhotos)) {
    currentConfig.galleryPhotos.forEach((src, index) => {
      const img = document.getElementById(`photo${index + 1}`);
      const normalizedSrc = normalizeGalleryUrl(src);
      if (img && normalizedSrc) img.src = normalizedSrc;
    });
  }

  applyHeroCloudPhoto();
  applyCalendarLink();

  const titleNames = `${currentConfig.brideShortName || "Mempelai"} & ${currentConfig.groomShortName || "Mempelai"}`;
  document.title = `Undangan Pernikahan | ${titleNames}`;
}

function setupInvitationGate() {
  if (!invitationGate || !openInvitationBtn) {
    document.body.classList.remove("invitation-locked");
    return;
  }

  openInvitationBtn.addEventListener("click", () => {
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

function parseWeddingTimestamp() {
  const isoValue = String(currentConfig.weddingDateISO || "").trim();
  if (isoValue) {
    const isoTime = parseIsoDateTimeToMs(isoValue);
    if (!Number.isNaN(isoTime)) return isoTime;
  }

  const resepsiDate = (currentConfig.resepsi && currentConfig.resepsi.date) || "";
  const resepsiTime = (currentConfig.resepsi && currentConfig.resepsi.time) || "";
  const resepsiMs = parseIndonesianDateToMs(resepsiDate, resepsiTime);
  if (!Number.isNaN(resepsiMs)) return resepsiMs;

  const heroMs = parseIndonesianDateToMs(currentConfig.heroDatePlace || "", resepsiTime);
  if (!Number.isNaN(heroMs)) return heroMs;

  return NaN;
}

function updateCountdown() {
  const weddingDate = parseWeddingTimestamp();

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

  const primaryMusicUrl = normalizeAudioUrl(currentConfig.backgroundMusicUrl);
  const fallbackMusicUrl = normalizeAudioUrl(WEDDING_CONFIG.backgroundMusicUrl);
  const resolvedMusicUrl = primaryMusicUrl || fallbackMusicUrl;

  if (resolvedMusicUrl && !bgMusic.src) {
    bgMusic.src = resolvedMusicUrl;
  }

  const hasMusic = Boolean(resolvedMusicUrl || bgMusic.src);
  if (!hasMusic) {
    musicToggle.disabled = true;
    musicToggle.textContent = "Musik belum diatur";
    return;
  }

  function setPlayingState(isPlaying) {
    musicToggle.textContent = isPlaying ? "Pause Music" : "Play Music";
    musicToggle.classList.toggle("is-playing", isPlaying);
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
    musicState.loopStartSec !== null &&
    musicState.loopEndSec !== null &&
    musicState.loopEndSec > musicState.loopStartSec
  );
  bgMusic.loop = !hasSegmentLoop;

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

  musicToggle.addEventListener("click", async () => {
    if (bgMusic.paused) {
      try {
        await bgMusic.play();
        if ((bgMusic.currentTime || 0) <= 0.25 && musicState.startSec > 0) {
          seekAudio(musicState.startSec);
        }
        setPlayingState(true);
      } catch (error) {
        setPlayingState(false);
      }
    } else {
      bgMusic.pause();
      setPlayingState(false);
    }
  });

  bgMusic.addEventListener("ended", () => setPlayingState(false));
  bgMusic.addEventListener("error", () => {
    const fallback = normalizeAudioUrl(WEDDING_CONFIG.backgroundMusicUrl);
    if (fallback && bgMusic.src !== fallback) {
      bgMusic.src = fallback;
      bgMusic.load();
      musicToggle.textContent = "Play Music (Sumber Cadangan)";
    } else {
      musicToggle.textContent = "Musik gagal dimuat";
    }
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

  const flower = document.createElement("span");
  flower.className = "flower";
  const left = Math.random() * 100;
  const duration = (isLowPowerDevice ? 8 : 7) + Math.random() * (isLowPowerDevice ? 5 : 7);
  const delay = Math.random() * 1.2;
  const scale = 0.65 + Math.random() * 0.9;

  flower.style.left = `${left}%`;
  flower.style.animationDuration = `${duration}s`;
  flower.style.animationDelay = `${delay}s`;
  flower.style.transform = `scale(${scale})`;

  flowerLayer.appendChild(flower);
  setTimeout(() => flower.remove(), (duration + delay) * 1000 + 200);
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
    } else {
      updateCountdown();
      startTimers();
    }
  });
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!RSVP_API_URL || RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
      statusText.textContent = "URL backend belum diisi pada config.js";
      return;
    }

    const formData = new FormData(form);
    const payload = {
      nama: formData.get("nama")?.toString().trim(),
      jumlah: Number(formData.get("jumlah")),
      kehadiran: formData.get("kehadiran"),
      ucapan: formData.get("ucapan")?.toString().trim() || "-"
    };

    statusText.textContent = "Mengirim RSVP...";

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
      statusText.textContent = "RSVP berhasil dikirim. Terima kasih.";
    } catch (error) {
      statusText.textContent = `Terjadi kesalahan: ${error.message}`;
    }
  });
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
    updateCountdown();
    setupRevealAnimation();
    setupMusicControl();
    setupVisibilityOptimization();
    setupInvitationGate();
    startTimers();

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
