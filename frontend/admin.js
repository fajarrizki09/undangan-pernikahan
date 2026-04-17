const fields = {
  brandInitials: document.getElementById("brandInitials"),
  seoTitle: document.getElementById("seoTitle"),
  seoDescription: document.getElementById("seoDescription"),
  heroOverline: document.getElementById("heroOverline"),
  brideShortName: document.getElementById("brideShortName"),
  groomShortName: document.getElementById("groomShortName"),
  brideFullName: document.getElementById("brideFullName"),
  groomFullName: document.getElementById("groomFullName"),
  brideParents: document.getElementById("brideParents"),
  groomParents: document.getElementById("groomParents"),
  heroDatePlace: document.getElementById("heroDatePlace"),
  heroDateStart: document.getElementById("heroDateStart"),
  heroDateEnd: document.getElementById("heroDateEnd"),
  heroDateCity: document.getElementById("heroDateCity"),
  heroBackgroundPhoto: document.getElementById("heroBackgroundPhoto"),
  footerNames: document.getElementById("footerNames"),
  weddingDateTimeLocal: document.getElementById("weddingDateTimeLocal"),
  weddingTimeOffset: document.getElementById("weddingTimeOffset"),
  weddingDateISO: document.getElementById("weddingDateISO"),
  akadDate: document.getElementById("akadDate"),
  akadTime: document.getElementById("akadTime"),
  akadVenue: document.getElementById("akadVenue"),
  akadMapUrl: document.getElementById("akadMapUrl"),
  resepsiDate: document.getElementById("resepsiDate"),
  resepsiTime: document.getElementById("resepsiTime"),
  resepsiVenue: document.getElementById("resepsiVenue"),
  resepsiMapUrl: document.getElementById("resepsiMapUrl"),
  quranVerseArabic: document.getElementById("quranVerseArabic"),
  quranVerseTranslation: document.getElementById("quranVerseTranslation"),
  quranVerseReference: document.getElementById("quranVerseReference"),
  hadithText: document.getElementById("hadithText"),
  hadithReference: document.getElementById("hadithReference"),
  marriageDoaText: document.getElementById("marriageDoaText"),
  marriageDoaReference: document.getElementById("marriageDoaReference"),
  storyDate1: document.getElementById("storyDate1"),
  storyTitle1: document.getElementById("storyTitle1"),
  storyDesc1: document.getElementById("storyDesc1"),
  storyDate2: document.getElementById("storyDate2"),
  storyTitle2: document.getElementById("storyTitle2"),
  storyDesc2: document.getElementById("storyDesc2"),
  storyDate3: document.getElementById("storyDate3"),
  storyTitle3: document.getElementById("storyTitle3"),
  storyDesc3: document.getElementById("storyDesc3"),
  loveStoryPhotos: document.getElementById("loveStoryPhotos"),
  galleryPhotos: document.getElementById("galleryPhotos"),
  galleryMode: document.getElementById("galleryMode"),
  galleryMaxItems: document.getElementById("galleryMaxItems"),
  galleryAutoplaySec: document.getElementById("galleryAutoplaySec"),
  galleryStyle: document.getElementById("galleryStyle"),
  backgroundMusicUrl: document.getElementById("backgroundMusicUrl"),
  musicStartSec: document.getElementById("musicStartSec"),
  musicLoopStartSec: document.getElementById("musicLoopStartSec"),
  musicLoopEndSec: document.getElementById("musicLoopEndSec")
};

const adminKeyInput = document.getElementById("adminKey");
const apiUrlInput = document.getElementById("apiUrl");
const invitationBaseUrlInput = document.getElementById("invitationBaseUrl");

const statusConn = document.getElementById("statusConn");
const statusConfig = document.getElementById("statusConfig");
const statusGuests = document.getElementById("statusGuests");
const statusRsvps = document.getElementById("statusRsvps");

const guestInput = document.getElementById("guestInput");
const guestSearch = document.getElementById("guestSearch");
const guestGroupFilter = document.getElementById("guestGroupFilter");
const guestStatusFilter = document.getElementById("guestStatusFilter");
const guestPageSize = document.getElementById("guestPageSize");
const guestPageInfo = document.getElementById("guestPageInfo");
const btnGuestPrev = document.getElementById("btnGuestPrev");
const btnGuestNext = document.getElementById("btnGuestNext");
const guestLinks = document.getElementById("guestLinks");
const guestTableBody = document.getElementById("guestTableBody");
const rsvpSearch = document.getElementById("rsvpSearch");
const rsvpKehadiranFilter = document.getElementById("rsvpKehadiranFilter");
const rsvpPageSize = document.getElementById("rsvpPageSize");
const rsvpPageInfo = document.getElementById("rsvpPageInfo");
const btnRsvpPrev = document.getElementById("btnRsvpPrev");
const btnRsvpNext = document.getElementById("btnRsvpNext");
const rsvpTableBody = document.getElementById("rsvpTableBody");
const photoFilesInput = document.getElementById("photoFiles");
const heroPhotoFileInput = document.getElementById("heroPhotoFile");
const loveStoryPhotoFilesInput = document.getElementById("loveStoryPhotoFiles");
const deletePhotoUrlsInput = document.getElementById("deletePhotoUrls");
const musicFileInput = document.getElementById("musicFile");
const galleryPreview = document.getElementById("galleryPreview");
const loveStoryPreview = document.getElementById("loveStoryPreview");
const deleteFromDriveInput = document.getElementById("deleteFromDrive");
const btnHeroFromGallery = document.getElementById("btnHeroFromGallery");
const btnLoveStoryFromGallery = document.getElementById("btnLoveStoryFromGallery");
const ADMIN_KEY_STORAGE_KEY = "wedding_admin_key";
const INVITATION_BASE_URL_STORAGE_KEY = "wedding_invitation_base_url";

document.getElementById("btnLoadConfig").addEventListener("click", loadConfigFromServer);
document.getElementById("btnSaveConfig").addEventListener("click", saveConfigToServer);
document.getElementById("btnUploadPhotos").addEventListener("click", uploadPhotosToDrive);
document.getElementById("btnUploadHeroPhoto").addEventListener("click", uploadHeroPhotoToDrive);
document.getElementById("btnUploadLoveStoryPhotos").addEventListener("click", uploadLoveStoryPhotosToDrive);
document.getElementById("btnDeletePhotos").addEventListener("click", deletePhotosFromDriveAndGallery);
document.getElementById("btnUploadMusic").addEventListener("click", uploadMusicToDrive);
document.getElementById("btnImportGuests").addEventListener("click", importGuests);
document.getElementById("btnLoadGuests").addEventListener("click", loadGuests);
document.getElementById("btnExportGuestsCsv").addEventListener("click", exportGuestsCsv);
document.getElementById("btnLoadRsvps").addEventListener("click", loadRsvps);
document.getElementById("btnGenerateHeroDate").addEventListener("click", generateHeroDatePlaceFromInputs);
document.getElementById("btnApplyGallerySelection").addEventListener("click", applySelectedGalleryUrls);

apiUrlInput.value = RSVP_API_URL;
let currentGuests = [];
let currentRsvps = [];
let selectedGalleryUrls = new Set();
let galleryPhotoFocusMap = {};
let guestState = {
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  groups: [],
  statuses: ["active", "vip", "disabled"]
};
let rsvpState = {
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 1
};
let rsvpFullMode = true;

function getDefaultInvitationBaseUrl() {
  const fromConfig = (ADMIN_CONFIG && ADMIN_CONFIG.invitationBaseUrl) || "";
  if (fromConfig.trim()) return fromConfig.trim();
  const path = String(window.location.pathname || "/");
  if (/\/admin\.html?$/i.test(path)) {
    return `${window.location.origin}${path.replace(/admin\.html?$/i, "")}`;
  }
  if (path.endsWith("/")) {
    return `${window.location.origin}${path}`;
  }
  return `${window.location.origin}${path}/`;
}

function loadSavedInvitationBaseUrl() {
  try {
    const saved = localStorage.getItem(INVITATION_BASE_URL_STORAGE_KEY);
    if (saved && saved.trim()) {
      invitationBaseUrlInput.value = saved.trim();
      return;
    }
  } catch (error) {
    // Ignore localStorage access issues.
  }

  invitationBaseUrlInput.value = getDefaultInvitationBaseUrl();
}

function saveInvitationBaseUrl(value) {
  try {
    const clean = (value || "").trim();
    if (!clean) {
      localStorage.removeItem(INVITATION_BASE_URL_STORAGE_KEY);
      return;
    }
    localStorage.setItem(INVITATION_BASE_URL_STORAGE_KEY, clean);
  } catch (error) {
    // Ignore localStorage access issues.
  }
}

function loadSavedAdminKey() {
  try {
    const saved = localStorage.getItem(ADMIN_KEY_STORAGE_KEY);
    if (saved) {
      adminKeyInput.value = saved;
    }
  } catch (error) {
    // Ignore localStorage access issues.
  }
}

function saveAdminKey(value) {
  try {
    if (!value) {
      localStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
      return;
    }
    localStorage.setItem(ADMIN_KEY_STORAGE_KEY, value);
  } catch (error) {
    // Ignore localStorage access issues.
  }
}

function getAdminKeyOrThrow() {
  const fromInput = adminKeyInput.value.trim();
  if (fromInput) {
    saveAdminKey(fromInput);
    return fromInput;
  }

  try {
    const stored = (localStorage.getItem(ADMIN_KEY_STORAGE_KEY) || "").trim();
    if (stored) {
      adminKeyInput.value = stored;
      return stored;
    }
  } catch (error) {
    // Ignore localStorage access issues.
  }

  throw new Error("Admin key wajib diisi");
}

function setStatus(el, message) {
  el.textContent = message;
}

function normalizeBaseUrl(value) {
  const clean = (value || "").trim();
  if (!clean) return "";

  const withProtocol = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;

  try {
    const parsed = new URL(withProtocol, window.location.origin);
    let pathname = parsed.pathname || "/";

    pathname = pathname.replace(/\/admin\.html?$/i, "/");
    if (parsed.hostname && pathname.toLowerCase().includes(parsed.hostname.toLowerCase())) {
      pathname = pathname.replace(new RegExp(`/${parsed.hostname.replace(/\./g, "\\.")}/?`, "ig"), "/");
    }
    pathname = pathname.replace(/\/{2,}/g, "/");
    if (!pathname.endsWith("/")) pathname += "/";

    parsed.pathname = pathname;
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch (error) {
    return clean.endsWith("/") ? clean : `${clean}/`;
  }
}

function parseWeddingIso(isoString) {
  const fallback = {
    localDateTime: "",
    offset: "+07:00"
  };

  const value = (isoString || "").trim();
  if (!value) return fallback;

  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?(Z|[+\-]\d{2}:\d{2})?$/);
  if (!match) return fallback;

  return {
    localDateTime: `${match[1]}T${match[2]}`,
    offset: match[3] === "Z" ? "+00:00" : (match[3] || "+07:00")
  };
}

function buildWeddingIsoFromInputs() {
  const dateTime = fields.weddingDateTimeLocal.value.trim();
  const offset = fields.weddingTimeOffset.value || "+07:00";
  if (!dateTime) return "";
  return `${dateTime}:00${offset}`;
}

function updateWeddingIsoPreview() {
  fields.weddingDateISO.value = buildWeddingIsoFromInputs();
}

function parseDateInput(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const date = new Date(`${text}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatHeroDatePlace(startDate, endDate, city) {
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const start = startDate;
  const end = endDate || startDate;
  const sameDay = (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  );

  const location = String(city || "").trim();

  if (sameDay) {
    const line = `${dayNames[start.getDay()]}, ${start.getDate()} ${monthNames[start.getMonth()]} ${start.getFullYear()}`;
    return location ? `${line} • ${location}` : line;
  }

  const dayLine = `${dayNames[start.getDay()]} - ${dayNames[end.getDay()]}`;
  let dateLine = "";
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    dateLine = `${start.getDate()} - ${end.getDate()} ${monthNames[start.getMonth()]} ${start.getFullYear()}`;
  } else if (start.getFullYear() === end.getFullYear()) {
    dateLine = `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]} ${start.getFullYear()}`;
  } else {
    dateLine = `${start.getDate()} ${monthNames[start.getMonth()]} ${start.getFullYear()} - ${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
  }

  const line = `${dayLine}, ${dateLine}`;
  return location ? `${line} • ${location}` : line;
}

function generateHeroDatePlaceFromInputs() {
  const start = parseDateInput(fields.heroDateStart.value);
  if (!start) {
    setStatus(statusConfig, "Isi Tanggal Hero Mulai dulu.");
    return;
  }

  const endRaw = parseDateInput(fields.heroDateEnd.value);
  const end = endRaw && endRaw.getTime() >= start.getTime() ? endRaw : start;
  const result = formatHeroDatePlace(start, end, fields.heroDateCity.value);
  fields.heroDatePlace.value = result;
  const dateOnly = result.split("•")[0].trim();
  fields.resepsiDate.value = dateOnly;
  setStatus(statusConfig, "Tanggal hero berhasil digenerate.");
}

function parseNonNegativeNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return "";
  return String(num);
}

function parseNonNegativeInteger(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return "";
  return String(Math.floor(num));
}

function parsePositiveNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "";
  return String(num);
}

function normalizeGalleryMode(value) {
  return String(value || "").toLowerCase() === "carousel" ? "carousel" : "grid";
}

function normalizeGalleryStyle(value) {
  const style = String(value || "").toLowerCase();
  if (["elegant", "soft", "polaroid", "clean"].includes(style)) return style;
  return "elegant";
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

function getGalleryPhotoFocus(url) {
  const key = String(url || "").trim();
  const item = galleryPhotoFocusMap[key];
  if (!item) return { x: 50, y: 50 };
  return {
    x: clampPercent(item.x, 50),
    y: clampPercent(item.y, 50)
  };
}

function setGalleryPhotoFocus(url, x, y) {
  const key = String(url || "").trim();
  if (!key) return;
  galleryPhotoFocusMap[key] = {
    x: clampPercent(x, 50),
    y: clampPercent(y, 50)
  };
}

function updateGalleryModeFields() {
  const isCarousel = normalizeGalleryMode(fields.galleryMode.value) === "carousel";
  fields.galleryAutoplaySec.disabled = !isCarousel;
  if (!isCarousel) {
    fields.galleryAutoplaySec.value = "";
  }
}

function decodeHtmlEntities(value) {
  const source = String(value || "");
  if (!source) return "";
  const textarea = document.createElement("textarea");
  textarea.innerHTML = source;
  return textarea.value;
}

function readConfigFromForm() {
  const allPhotos = getGalleryUrls();
  const photos = allPhotos.filter((url) => selectedGalleryUrls.has(url));
  const galleryPhotosToSave = photos.length ? photos : allPhotos;
  const sanitizedFocusMap = {};
  galleryPhotosToSave.forEach((url) => {
    const focus = getGalleryPhotoFocus(url);
    if (focus.x !== 50 || focus.y !== 50) {
      sanitizedFocusMap[url] = focus;
    }
  });
  const storyPhotos = fields.loveStoryPhotos.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
  const loveStoryItems = [1, 2, 3].map((index) => ({
    date: fields[`storyDate${index}`].value.trim(),
    title: fields[`storyTitle${index}`].value.trim(),
    description: fields[`storyDesc${index}`].value.trim()
  }));

  return {
    brandInitials: fields.brandInitials.value.trim(),
    seoTitle: fields.seoTitle.value.trim(),
    seoDescription: fields.seoDescription.value.trim(),
    heroOverline: fields.heroOverline.value.trim(),
    brideShortName: fields.brideShortName.value.trim(),
    groomShortName: fields.groomShortName.value.trim(),
    brideFullName: fields.brideFullName.value.trim(),
    groomFullName: fields.groomFullName.value.trim(),
    brideParents: fields.brideParents.value.trim(),
    groomParents: fields.groomParents.value.trim(),
    heroDatePlace: fields.heroDatePlace.value.trim(),
    heroBackgroundPhoto: fields.heroBackgroundPhoto.value.trim(),
    footerNames: fields.footerNames.value.trim(),
    backgroundMusicUrl: fields.backgroundMusicUrl.value.trim(),
    musicStartSec: parseNonNegativeNumber(fields.musicStartSec.value.trim()),
    musicLoopStartSec: parseNonNegativeNumber(fields.musicLoopStartSec.value.trim()),
    musicLoopEndSec: parseNonNegativeNumber(fields.musicLoopEndSec.value.trim()),
    weddingDateISO: buildWeddingIsoFromInputs(),
    akad: {
      date: fields.akadDate.value.trim(),
      time: fields.akadTime.value.trim(),
      venue: fields.akadVenue.value.trim(),
      mapUrl: fields.akadMapUrl.value.trim()
    },
    resepsi: {
      date: fields.resepsiDate.value.trim(),
      time: fields.resepsiTime.value.trim(),
      venue: fields.resepsiVenue.value.trim(),
      mapUrl: fields.resepsiMapUrl.value.trim()
    },
    quranVerseArabic: fields.quranVerseArabic.value.trim(),
    quranVerseTranslation: fields.quranVerseTranslation.value.trim(),
    quranVerseReference: fields.quranVerseReference.value.trim(),
    hadithText: fields.hadithText.value.trim(),
    hadithReference: fields.hadithReference.value.trim(),
    marriageDoaText: fields.marriageDoaText.value.trim(),
    marriageDoaReference: fields.marriageDoaReference.value.trim(),
    loveStoryItems,
    loveStoryPhotos: storyPhotos,
    galleryPhotos: galleryPhotosToSave,
    galleryMode: normalizeGalleryMode(fields.galleryMode.value),
    galleryMaxItems: parseNonNegativeInteger(fields.galleryMaxItems.value.trim()),
    galleryAutoplaySec: parsePositiveNumber(fields.galleryAutoplaySec.value.trim()),
    galleryStyle: normalizeGalleryStyle(fields.galleryStyle.value),
    galleryPhotoFocus: sanitizedFocusMap
  };
}

function cleanPhotoArray(input) {
  if (!Array.isArray(input)) return [];
  return input.map((item) => String(item || "").trim()).filter(Boolean);
}

function healMisplacedPhotoConfig(config) {
  const source = (config && typeof config === "object") ? config : {};
  const storyRaw = cleanPhotoArray(source.loveStoryPhotos);
  const galleryRaw = cleanPhotoArray(source.galleryPhotos);
  const defaultStory = cleanPhotoArray((WEDDING_CONFIG && WEDDING_CONFIG.loveStoryPhotos) || []).slice(0, 3);

  const likelyShiftedColumn = galleryRaw.length === 0 && storyRaw.length > 3;
  if (!likelyShiftedColumn) return source;

  return {
    ...source,
    loveStoryPhotos: defaultStory.length ? defaultStory : storyRaw.slice(0, 3),
    galleryPhotos: storyRaw
  };
}

function fillForm(config) {
  const safeConfig = healMisplacedPhotoConfig(config || {});
  galleryPhotoFocusMap = normalizeGalleryPhotoFocusMap(
    safeConfig.galleryPhotoFocus || (WEDDING_CONFIG && WEDDING_CONFIG.galleryPhotoFocus) || {}
  );

  fields.brandInitials.value = safeConfig.brandInitials || "";
  fields.seoTitle.value = safeConfig.seoTitle || "";
  fields.seoDescription.value = safeConfig.seoDescription || "";
  fields.heroOverline.value = safeConfig.heroOverline || "";
  fields.brideShortName.value = safeConfig.brideShortName || "";
  fields.groomShortName.value = safeConfig.groomShortName || "";
  fields.brideFullName.value = safeConfig.brideFullName || "";
  fields.groomFullName.value = safeConfig.groomFullName || "";
  fields.brideParents.value = safeConfig.brideParents || "";
  fields.groomParents.value = safeConfig.groomParents || "";
  fields.heroDatePlace.value = safeConfig.heroDatePlace || "";
  fields.heroDateCity.value = String(safeConfig.heroDatePlace || "").split("•")[1]?.trim() || "";
  fields.heroDateStart.value = "";
  fields.heroDateEnd.value = "";
  fields.heroBackgroundPhoto.value = safeConfig.heroBackgroundPhoto || "";
  fields.footerNames.value = safeConfig.footerNames || "";
  fields.backgroundMusicUrl.value = safeConfig.backgroundMusicUrl || "";
  fields.musicStartSec.value = safeConfig.musicStartSec || "";
  fields.musicLoopStartSec.value = safeConfig.musicLoopStartSec || "";
  fields.musicLoopEndSec.value = safeConfig.musicLoopEndSec || "";

  const parsedWeddingDate = parseWeddingIso(safeConfig.weddingDateISO || "");
  fields.weddingDateTimeLocal.value = parsedWeddingDate.localDateTime;
  fields.weddingTimeOffset.value = parsedWeddingDate.offset;
  updateWeddingIsoPreview();

  fields.akadDate.value = (safeConfig.akad && safeConfig.akad.date) || "";
  fields.akadTime.value = (safeConfig.akad && safeConfig.akad.time) || "";
  fields.akadVenue.value = (safeConfig.akad && safeConfig.akad.venue) || "";
  fields.akadMapUrl.value = (safeConfig.akad && safeConfig.akad.mapUrl) || "";

  fields.resepsiDate.value = (safeConfig.resepsi && safeConfig.resepsi.date) || "";
  fields.resepsiTime.value = (safeConfig.resepsi && safeConfig.resepsi.time) || "";
  fields.resepsiVenue.value = (safeConfig.resepsi && safeConfig.resepsi.venue) || "";
  fields.resepsiMapUrl.value = (safeConfig.resepsi && safeConfig.resepsi.mapUrl) || "";
  fields.quranVerseArabic.value = decodeHtmlEntities(safeConfig.quranVerseArabic || "");
  fields.quranVerseTranslation.value = safeConfig.quranVerseTranslation || "";
  fields.quranVerseReference.value = safeConfig.quranVerseReference || "";
  fields.hadithText.value = safeConfig.hadithText || "";
  fields.hadithReference.value = safeConfig.hadithReference || "";
  fields.marriageDoaText.value = safeConfig.marriageDoaText || "";
  fields.marriageDoaReference.value = safeConfig.marriageDoaReference || "";
  const fallbackStoryItems = Array.isArray(WEDDING_CONFIG.loveStoryItems) ? WEDDING_CONFIG.loveStoryItems : [];
  const storyItems = Array.isArray(safeConfig.loveStoryItems) && safeConfig.loveStoryItems.length
    ? safeConfig.loveStoryItems
    : fallbackStoryItems;
  [1, 2, 3].forEach((index) => {
    const item = storyItems[index - 1] || {};
    fields[`storyDate${index}`].value = String(item.date || "");
    fields[`storyTitle${index}`].value = String(item.title || "");
    fields[`storyDesc${index}`].value = String(item.description || "");
  });

  fields.loveStoryPhotos.value = Array.isArray(safeConfig.loveStoryPhotos) ? safeConfig.loveStoryPhotos.slice(0, 3).join("\n") : "";
  fields.galleryPhotos.value = Array.isArray(safeConfig.galleryPhotos) ? safeConfig.galleryPhotos.join("\n") : "";
  syncSelectedGalleryUrls(getGalleryUrls());
  fields.galleryMode.value = normalizeGalleryMode(safeConfig.galleryMode || (WEDDING_CONFIG.galleryMode || "grid"));
  fields.galleryMaxItems.value = safeConfig.galleryMaxItems || "";
  fields.galleryAutoplaySec.value = safeConfig.galleryAutoplaySec || "";
  fields.galleryStyle.value = normalizeGalleryStyle(safeConfig.galleryStyle || (WEDDING_CONFIG.galleryStyle || "elegant"));
  updateGalleryModeFields();
  renderGalleryPreview();
}

async function postApi(payload) {
  if (!RSVP_API_URL || RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
    throw new Error("Isi RSVP_API_URL di config.js terlebih dahulu");
  }

  const response = await fetch(RSVP_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Request gagal");
  }

  return result;
}

async function loadConfigFromServer() {
  try {
    if (!RSVP_API_URL || RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
      throw new Error("Isi RSVP_API_URL di config.js terlebih dahulu");
    }

    setStatus(statusConfig, "Memuat konfigurasi...");
    const url = new URL(RSVP_API_URL);
    url.searchParams.set("action", "config");
    url.searchParams.set("_ts", String(Date.now()));

    const response = await fetch(url.toString(), {
      cache: "no-store"
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Gagal mengambil config");
    }

    fillForm(result.config || {});
    setStatus(statusConfig, "Konfigurasi berhasil dimuat");
  } catch (error) {
    setStatus(statusConfig, `Error: ${error.message}`);
  }
}

async function saveConfigToServer() {
  try {
    const adminKey = getAdminKeyOrThrow();

    setStatus(statusConfig, "Menyimpan konfigurasi...");
    await postApi({
      action: "saveConfig",
      adminKey,
      config: readConfigFromForm()
    });

    setStatus(statusConfig, "Konfigurasi berhasil disimpan");
  } catch (error) {
    setStatus(statusConfig, `Error: ${error.message}`);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const parts = result.split(",");
      if (parts.length < 2) {
        reject(new Error(`Format file tidak valid: ${file.name}`));
        return;
      }
      resolve(parts[1]);
    };
    reader.onerror = () => reject(new Error(`Gagal membaca file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function appendGalleryUrls(urls) {
  const existing = getGalleryUrls();

  const unique = new Set(existing);
  urls.forEach((url) => {
    if (url) {
      unique.add(url);
      selectedGalleryUrls.add(url);
    }
  });

  fields.galleryPhotos.value = Array.from(unique).join("\n");
  renderGalleryPreview();
}

function getLoveStoryUrls() {
  return fields.loveStoryPhotos.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function setLoveStoryUrls(urls) {
  const clean = Array.isArray(urls) ? urls.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 3) : [];
  fields.loveStoryPhotos.value = clean.join("\n");
  renderLoveStoryPreview();
}

function setHeroFromGallery(url) {
  const target = String(url || "").trim();
  if (!target) return false;
  fields.heroBackgroundPhoto.value = target;
  return true;
}

function appendOneLoveStoryUrl(url) {
  const target = String(url || "").trim();
  if (!target) return false;
  const current = getLoveStoryUrls();
  if (current.includes(target)) return false;
  if (current.length >= 3) return false;
  current.push(target);
  setLoveStoryUrls(current);
  return true;
}

function fillLoveStoryFromGallery() {
  const galleryUrls = getGalleryUrls();
  if (!galleryUrls.length) return 0;
  const merged = [];
  galleryUrls.forEach((url) => {
    if (merged.length < 3) merged.push(url);
  });
  setLoveStoryUrls(merged);
  return merged.length;
}

function removeGalleryUrls(urls) {
  const targets = new Set(
    (urls || [])
      .map((item) => String(item || "").trim())
      .filter(Boolean)
  );

  const existing = getGalleryUrls();

  const filtered = existing.filter((url) => !targets.has(url));
  targets.forEach((url) => selectedGalleryUrls.delete(url));
  targets.forEach((url) => {
    const key = String(url || "").trim();
    if (!key) return;
    delete galleryPhotoFocusMap[key];
  });
  fields.galleryPhotos.value = filtered.join("\n");
  renderGalleryPreview();
}

function getGalleryUrls() {
  return fields.galleryPhotos.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function syncSelectedGalleryUrls(urls) {
  const available = Array.isArray(urls) ? urls : [];
  if (!selectedGalleryUrls.size) {
    selectedGalleryUrls = new Set(available);
    return;
  }

  const next = new Set();
  available.forEach((url) => {
    if (selectedGalleryUrls.has(url)) next.add(url);
  });

  if (!next.size && available.length) {
    available.forEach((url) => next.add(url));
  }

  selectedGalleryUrls = next;
}

function applySelectedGalleryUrls() {
  const allUrls = getGalleryUrls();
  const selected = allUrls.filter((url) => selectedGalleryUrls.has(url));
  const finalUrls = selected.length ? selected : allUrls;
  const nextFocusMap = {};
  finalUrls.forEach((url) => {
    const focus = galleryPhotoFocusMap[String(url || "").trim()];
    if (focus) nextFocusMap[String(url || "").trim()] = focus;
  });
  galleryPhotoFocusMap = nextFocusMap;
  fields.galleryPhotos.value = finalUrls.join("\n");
  syncSelectedGalleryUrls(finalUrls);
  renderGalleryPreview();
  setStatus(statusConfig, `${finalUrls.length} foto dipilih untuk ditampilkan di galeri.`);
}

function extractDriveFileId(url) {
  const clean = String(url || "").trim();
  if (!clean) return "";

  const idFromQuery = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idFromQuery && idFromQuery[1]) return idFromQuery[1];

  const idFromPath = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (idFromPath && idFromPath[1]) return idFromPath[1];

  return "";
}

function getDrivePreviewCandidates(fileId) {
  return [
    `https://lh3.googleusercontent.com/d/${fileId}=w1200`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
    `https://drive.google.com/uc?export=view&id=${fileId}`
  ];
}

function getPreviewCandidates(url) {
  const clean = String(url || "").trim();
  if (!clean) return [];

  const fileId = extractDriveFileId(clean);
  if (clean.includes("drive.google.com") && fileId) {
    return getDrivePreviewCandidates(fileId);
  }

  return [clean];
}

function applyPreviewImageWithFallback(img, rawUrl) {
  if (!img) return;

  const candidates = getPreviewCandidates(rawUrl);
  if (!candidates.length) {
    img.removeAttribute("src");
    return;
  }

  let index = 0;
  const applyNext = () => {
    const next = String(candidates[index] || "").trim();
    if (!next) {
      img.onerror = null;
      return;
    }
    index += 1;
    img.src = next;
  };

  img.onerror = () => {
    if (index >= candidates.length) {
      img.onerror = null;
      return;
    }
    applyNext();
  };

  applyNext();
}

function getLoveStoryPreviewUrls() {
  return fields.loveStoryPhotos.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function renderLoveStoryPreview() {
  if (!loveStoryPreview) return;

  const urls = getLoveStoryPreviewUrls();
  loveStoryPreview.innerHTML = "";

  if (!urls.length) {
    const empty = document.createElement("p");
    empty.className = "preview-empty";
    empty.textContent = "Preview foto Love Story akan muncul di sini.";
    loveStoryPreview.appendChild(empty);
    return;
  }

  urls.forEach((url, index) => {
    const item = document.createElement("article");
    item.className = "story-preview-item";

    const img = document.createElement("img");
    img.alt = `Preview Love Story ${index + 1}`;
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    applyPreviewImageWithFallback(img, url);

    item.appendChild(img);
    loveStoryPreview.appendChild(item);
  });
}

async function deleteSinglePhoto(url) {
  const targetUrl = String(url || "").trim();
  if (!targetUrl) return;

  const alsoDeleteDrive = Boolean(deleteFromDriveInput && deleteFromDriveInput.checked);
  const confirmText = alsoDeleteDrive
    ? "Hapus foto ini dari galeri dan Google Drive?"
    : "Hapus foto ini dari galeri undangan?";
  if (!window.confirm(confirmText)) return;

  try {
    const adminKey = getAdminKeyOrThrow();
    setStatus(statusConfig, "Menghapus foto...");

    if (alsoDeleteDrive) {
      const result = await postApi({
        action: "deletePhotos",
        adminKey,
        urls: [targetUrl]
      });
      if (Number(result.deletedCount || 0) < 1) {
        const reason = result.failed && result.failed[0] && result.failed[0].reason;
        throw new Error(reason || "Gagal menghapus file dari Google Drive");
      }
    }

    removeGalleryUrls([targetUrl]);
    await postApi({
      action: "saveConfig",
      adminKey,
      config: readConfigFromForm()
    });

    setStatus(statusConfig, alsoDeleteDrive
      ? "Foto berhasil dihapus dari Drive dan galeri."
      : "Foto berhasil dihapus dari galeri.");
  } catch (error) {
    setStatus(statusConfig, `Error: ${error.message}`);
  }
}

function renderGalleryPreview() {
  if (!galleryPreview) return;
  const urls = getGalleryUrls();
  syncSelectedGalleryUrls(urls);

  galleryPreview.innerHTML = "";
  if (!urls.length) {
    const empty = document.createElement("p");
    empty.className = "preview-empty";
    empty.textContent = "Belum ada foto di galeri.";
    galleryPreview.appendChild(empty);
    return;
  }

  urls.forEach((url) => {
    const card = document.createElement("article");
    card.className = "gallery-item";

    const img = document.createElement("img");
    const focus = getGalleryPhotoFocus(url);
    img.style.objectPosition = `${focus.x}% ${focus.y}%`;
    img.alt = "Preview foto galeri";
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    applyPreviewImageWithFallback(img, url);

    const body = document.createElement("div");
    body.className = "gallery-item-body";

    const urlText = document.createElement("p");
    urlText.className = "gallery-item-url";
    urlText.textContent = url;

    const selectWrap = document.createElement("label");
    selectWrap.className = "gallery-item-select";
    const selectInput = document.createElement("input");
    selectInput.type = "checkbox";
    selectInput.checked = selectedGalleryUrls.has(url);
    selectInput.addEventListener("change", () => {
      if (selectInput.checked) {
        selectedGalleryUrls.add(url);
      } else {
        selectedGalleryUrls.delete(url);
      }
    });
    const selectText = document.createElement("span");
    selectText.textContent = "Tampilkan di undangan";
    selectWrap.appendChild(selectInput);
    selectWrap.appendChild(selectText);

    const actions = document.createElement("div");
    actions.className = "gallery-item-actions";

    const heroBtn = document.createElement("button");
    heroBtn.type = "button";
    heroBtn.className = "btn-mini";
    heroBtn.textContent = "Set Hero";
    heroBtn.addEventListener("click", () => {
      if (setHeroFromGallery(url)) {
        setStatus(statusConfig, "Foto dipilih untuk background hero.");
      }
    });

    const storyBtn = document.createElement("button");
    storyBtn.type = "button";
    storyBtn.className = "btn-mini";
    storyBtn.textContent = "Set Love Story";
    storyBtn.addEventListener("click", () => {
      const ok = appendOneLoveStoryUrl(url);
      if (ok) {
        setStatus(statusConfig, "Foto ditambahkan ke Love Story.");
      } else {
        setStatus(statusConfig, "Love Story sudah penuh (maksimal 3) atau foto sudah ada.");
      }
    });

    const editPosBtn = document.createElement("button");
    editPosBtn.type = "button";
    editPosBtn.className = "btn-mini";
    editPosBtn.textContent = "Edit Posisi";
    editPosBtn.addEventListener("click", () => {
      const current = getGalleryPhotoFocus(url);
      const input = window.prompt(
        "Atur posisi foto (X,Y) 0-100. Contoh: 50,35",
        `${current.x},${current.y}`
      );
      if (input === null) return;
      const parts = String(input).split(",").map((item) => item.trim());
      if (parts.length !== 2) {
        setStatus(statusConfig, "Format posisi harus X,Y. Contoh: 50,35");
        return;
      }
      const x = Number(parts[0]);
      const y = Number(parts[1]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        setStatus(statusConfig, "Nilai posisi harus angka 0 sampai 100.");
        return;
      }
      setGalleryPhotoFocus(url, x, y);
      const next = getGalleryPhotoFocus(url);
      img.style.objectPosition = `${next.x}% ${next.y}%`;
      setStatus(statusConfig, `Posisi foto diatur ke X:${next.x}% Y:${next.y}%. Klik Simpan Konfigurasi untuk permanen.`);
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-mini";
    removeBtn.textContent = "Hapus Foto";
    removeBtn.addEventListener("click", () => {
      deleteSinglePhoto(url);
    });

    actions.appendChild(heroBtn);
    actions.appendChild(storyBtn);
    actions.appendChild(editPosBtn);
    actions.appendChild(removeBtn);

    body.appendChild(selectWrap);
    body.appendChild(urlText);
    body.appendChild(actions);
    card.appendChild(img);
    card.appendChild(body);
    galleryPreview.appendChild(card);
  });
}

async function uploadPhotosToDrive() {
  try {
    const adminKey = getAdminKeyOrThrow();
    const files = Array.from(photoFilesInput.files || []);
    if (!files.length) throw new Error("Pilih minimal 1 foto dulu");

    const tooLarge = files.find((file) => file.size > 8 * 1024 * 1024);
    if (tooLarge) throw new Error(`Ukuran file maksimal 8MB per foto. Terlalu besar: ${tooLarge.name}`);

    setStatus(statusConfig, `Mengupload ${files.length} foto...`);

    const payloadFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        contentBase64: await fileToBase64(file)
      }))
    );

    const result = await postApi({
      action: "uploadPhotos",
      adminKey,
      files: payloadFiles
    });

    const uploadedUrls = (result.files || []).map((item) => item.publicUrl).filter(Boolean);
    appendGalleryUrls(uploadedUrls);

    let autoHero = false;
    let autoStoryCount = 0;

    if (!fields.heroBackgroundPhoto.value.trim() && uploadedUrls[0]) {
      fields.heroBackgroundPhoto.value = uploadedUrls[0];
      autoHero = true;
    }

    const currentStory = getLoveStoryUrls();
    if (currentStory.length < 3 && uploadedUrls.length) {
      const mergedStory = [...currentStory];
      uploadedUrls.forEach((url) => {
        if (mergedStory.length >= 3) return;
        if (!mergedStory.includes(url)) mergedStory.push(url);
      });
      autoStoryCount = Math.max(mergedStory.length - currentStory.length, 0);
      setLoveStoryUrls(mergedStory);
    }

    // Auto-save config setelah upload agar galeri publik langsung ikut update.
    await postApi({
      action: "saveConfig",
      adminKey,
      config: readConfigFromForm()
    });

    photoFilesInput.value = "";
    const autoNotes = [];
    if (autoHero) autoNotes.push("Hero background terisi otomatis");
    if (autoStoryCount > 0) autoNotes.push(`Love Story +${autoStoryCount} foto`);
    const tail = autoNotes.length ? ` (${autoNotes.join(", ")})` : "";
    setStatus(statusConfig, `${uploadedUrls.length} foto berhasil diupload dan konfigurasi galeri otomatis disimpan${tail}`);
  } catch (error) {
    setStatus(statusConfig, `Error: ${error.message}`);
  }
}

async function uploadHeroPhotoToDrive() {
  try {
    const adminKey = getAdminKeyOrThrow();
    const file = (heroPhotoFileInput && heroPhotoFileInput.files && heroPhotoFileInput.files[0]) || null;
    if (!file) throw new Error("Pilih 1 foto hero dulu");
    if (file.size > 8 * 1024 * 1024) throw new Error("Ukuran file hero maksimal 8MB");

    setStatus(statusConfig, "Mengupload foto hero...");

    const result = await postApi({
      action: "uploadPhotos",
      adminKey,
      files: [{
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        contentBase64: await fileToBase64(file)
      }]
    });

    const uploadedUrl = (result.files && result.files[0] && result.files[0].publicUrl) || "";
    if (!uploadedUrl) throw new Error("URL foto hero dari server kosong");

    fields.heroBackgroundPhoto.value = uploadedUrl;
    appendGalleryUrls([uploadedUrl]);

    await postApi({
      action: "saveConfig",
      adminKey,
      config: readConfigFromForm()
    });

    if (heroPhotoFileInput) heroPhotoFileInput.value = "";
    setStatus(statusConfig, "Foto hero berhasil diupload, diset, dan disimpan.");
  } catch (error) {
    setStatus(statusConfig, `Error: ${error.message}`);
  }
}

async function uploadLoveStoryPhotosToDrive() {
  try {
    const adminKey = getAdminKeyOrThrow();
    const files = Array.from((loveStoryPhotoFilesInput && loveStoryPhotoFilesInput.files) || []);
    if (!files.length) throw new Error("Pilih foto love story dulu");
    if (files.length > 3) throw new Error("Maksimal upload 3 foto love story");

    const tooLarge = files.find((file) => file.size > 8 * 1024 * 1024);
    if (tooLarge) throw new Error(`Ukuran file maksimal 8MB per foto. Terlalu besar: ${tooLarge.name}`);

    setStatus(statusConfig, `Mengupload ${files.length} foto love story...`);

    const payloadFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        contentBase64: await fileToBase64(file)
      }))
    );

    const result = await postApi({
      action: "uploadPhotos",
      adminKey,
      files: payloadFiles
    });

    const uploadedUrls = (result.files || []).map((item) => item.publicUrl).filter(Boolean).slice(0, 3);
    if (!uploadedUrls.length) throw new Error("URL foto love story dari server kosong");

    setLoveStoryUrls(uploadedUrls);
    appendGalleryUrls(uploadedUrls);

    await postApi({
      action: "saveConfig",
      adminKey,
      config: readConfigFromForm()
    });

    if (loveStoryPhotoFilesInput) loveStoryPhotoFilesInput.value = "";
    setStatus(statusConfig, `${uploadedUrls.length} foto love story berhasil diupload, diset, dan disimpan.`);
  } catch (error) {
    setStatus(statusConfig, `Error: ${error.message}`);
  }
}

async function deletePhotosFromDriveAndGallery() {
  try {
    const adminKey = getAdminKeyOrThrow();
    const targetUrls = deletePhotoUrlsInput.value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!targetUrls.length) throw new Error("Isi minimal 1 URL foto yang ingin dihapus");

    setStatus(statusConfig, `Menghapus ${targetUrls.length} foto dari Drive...`);
    const result = await postApi({
      action: "deletePhotos",
      adminKey,
      urls: targetUrls
    });

    removeGalleryUrls(targetUrls);

    await postApi({
      action: "saveConfig",
      adminKey,
      config: readConfigFromForm()
    });

    deletePhotoUrlsInput.value = "";
    const deletedCount = Number(result.deletedCount || 0);
    const failedCount = Array.isArray(result.failed) ? result.failed.length : 0;
    if (failedCount > 0) {
      setStatus(statusConfig, `${deletedCount} foto dihapus. ${failedCount} foto gagal dihapus (cek izin/link).`);
    } else {
      setStatus(statusConfig, `${deletedCount} foto berhasil dihapus dari Drive dan galeri.`);
    }
  } catch (error) {
    setStatus(statusConfig, `Error: ${error.message}`);
  }
}

async function uploadMusicToDrive() {
  try {
    const adminKey = getAdminKeyOrThrow();
    const file = (musicFileInput.files || [])[0];
    if (!file) throw new Error("Pilih 1 file musik dulu");

    const allowedAudio = /^audio\//.test(file.type || "");
    if (!allowedAudio) throw new Error("File harus format audio (mp3/m4a/wav, dll)");
    if (file.size > 15 * 1024 * 1024) throw new Error("Ukuran file musik maksimal 15MB");

    setStatus(statusConfig, "Mengupload musik...");

    const result = await postApi({
      action: "uploadPhotos",
      adminKey,
      files: [{
        name: file.name,
        mimeType: file.type || "audio/mpeg",
        contentBase64: await fileToBase64(file)
      }]
    });

    const uploadedUrl = (result.files && result.files[0] && result.files[0].publicUrl) || "";
    if (!uploadedUrl) throw new Error("URL musik dari server kosong");

    fields.backgroundMusicUrl.value = uploadedUrl;

    await postApi({
      action: "saveConfig",
      adminKey,
      config: readConfigFromForm()
    });

    musicFileInput.value = "";
    setStatus(statusConfig, "Musik berhasil diupload dan konfigurasi tersimpan");
  } catch (error) {
    setStatus(statusConfig, `Error: ${error.message}`);
  }
}

function parseGuestInput() {
  return guestInput.value
    .split(/\r?\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      return {
        name: parts[0] || "",
        group: parts[1] || "Umum",
        phone: parts[2] || "",
        notes: parts[3] || "",
        status: "active"
      };
    })
    .filter((item) => item.name);
}

function buildGuestLink(baseUrl, name) {
  const safeBase = normalizeBaseUrl(baseUrl);
  if (!safeBase) return "";
  const url = new URL(safeBase, window.location.origin);
  url.searchParams.set("to", name || "");
  return url.toString();
}

function toCsvCell(value) {
  const text = String(value || "");
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function renderGuestLinks(guests) {
  const baseUrl = normalizeBaseUrl(invitationBaseUrlInput.value);
  if (!baseUrl) {
    guestLinks.value = "Isi Base URL Undangan terlebih dahulu.";
    return;
  }

  guestLinks.value = guests
    .map((guest) => `${guest.name} => ${buildGuestLink(baseUrl, guest.name)}`)
    .join("\n");
}

function renderGuestMeta() {
  if (guestPageInfo) {
    guestPageInfo.textContent = `Halaman ${guestState.page} / ${guestState.totalPages} (${guestState.total} tamu)`;
  }

  if (btnGuestPrev) btnGuestPrev.disabled = guestState.page <= 1;
  if (btnGuestNext) btnGuestNext.disabled = guestState.page >= guestState.totalPages;
}

function renderGuestFilterOptions() {
  if (!guestGroupFilter) return;
  const current = guestGroupFilter.value || "all";
  const groups = Array.isArray(guestState.groups) ? guestState.groups : [];
  guestGroupFilter.innerHTML = `<option value="all">Semua Group</option>${groups.map((group) => `<option value="${group}">${group}</option>`).join("")}`;
  guestGroupFilter.value = groups.includes(current) ? current : "all";
}

async function updateGuestName(code, payload) {
  try {
    const adminKey = getAdminKeyOrThrow();
    const cleanName = String((payload && payload.name) || "").trim();
    if (!cleanName) throw new Error("Nama tamu tidak boleh kosong");

    setStatus(statusGuests, "Menyimpan perubahan tamu...");
    await postApi({
      action: "updateGuest",
      adminKey,
      code,
      name: cleanName,
      group: String((payload && payload.group) || "Umum").trim() || "Umum",
      status: String((payload && payload.status) || "active").trim() || "active",
      phone: String((payload && payload.phone) || "").trim(),
      notes: String((payload && payload.notes) || "").trim()
    });
    setStatus(statusGuests, "Data tamu berhasil diperbarui");
    await loadGuests();
  } catch (error) {
    setStatus(statusGuests, `Error: ${error.message}`);
  }
}

async function deleteGuestByCode(code) {
  try {
    const adminKey = getAdminKeyOrThrow();
    if (!window.confirm("Hapus tamu ini?")) return;

    setStatus(statusGuests, "Menghapus tamu...");
    await postApi({
      action: "deleteGuest",
      adminKey,
      code
    });
    setStatus(statusGuests, "Tamu berhasil dihapus");
    await loadGuests();
  } catch (error) {
    setStatus(statusGuests, `Error: ${error.message}`);
  }
}

function renderGuestTable(guests) {
  if (!guestTableBody) return;

  guestTableBody.innerHTML = "";
  if (!guests.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.textContent = "Belum ada data tamu.";
    row.appendChild(cell);
    guestTableBody.appendChild(row);
    return;
  }

  const baseUrl = normalizeBaseUrl(invitationBaseUrlInput.value);
  guests.forEach((guest) => {
    const row = document.createElement("tr");

    const codeCell = document.createElement("td");
    codeCell.textContent = guest.code || "-";

    const nameCell = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.className = "guest-name-input";
    nameInput.type = "text";
    nameInput.value = guest.name || "";
    nameCell.appendChild(nameInput);

    const groupCell = document.createElement("td");
    const groupInput = document.createElement("input");
    groupInput.className = "guest-inline-input";
    groupInput.type = "text";
    groupInput.value = guest.group || "Umum";
    groupCell.appendChild(groupInput);

    const statusCell = document.createElement("td");
    const statusSelect = document.createElement("select");
    statusSelect.className = "guest-inline-input";
    ["active", "vip", "disabled"].forEach((statusValue) => {
      const option = document.createElement("option");
      option.value = statusValue;
      option.textContent = statusValue.toUpperCase();
      if ((guest.status || "active") === statusValue) option.selected = true;
      statusSelect.appendChild(option);
    });
    statusCell.appendChild(statusSelect);

    const phoneCell = document.createElement("td");
    const phoneInput = document.createElement("input");
    phoneInput.className = "guest-inline-input";
    phoneInput.type = "text";
    phoneInput.value = guest.phone || "";
    phoneCell.appendChild(phoneInput);

    const linkCell = document.createElement("td");
    if (baseUrl && guest.name) {
      const link = document.createElement("a");
      link.className = "guest-link-mini";
      link.href = buildGuestLink(baseUrl, guest.name);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Buka Link";
      linkCell.appendChild(link);
    } else {
      linkCell.textContent = "-";
    }

    const actionCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "guest-actions";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn-mini";
    saveBtn.textContent = "Simpan";
    saveBtn.addEventListener("click", () => updateGuestName(guest.code, {
      name: nameInput.value,
      group: groupInput.value,
      status: statusSelect.value,
      phone: phoneInput.value
    }));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-mini";
    deleteBtn.textContent = "Hapus";
    deleteBtn.addEventListener("click", () => deleteGuestByCode(guest.code));

    actions.appendChild(saveBtn);
    actions.appendChild(deleteBtn);
    actionCell.appendChild(actions);

    row.appendChild(codeCell);
    row.appendChild(nameCell);
    row.appendChild(groupCell);
    row.appendChild(statusCell);
    row.appendChild(phoneCell);
    row.appendChild(linkCell);
    row.appendChild(actionCell);
    guestTableBody.appendChild(row);
  });
}

function refreshGuestViews() {
  renderGuestTable(currentGuests);
  renderGuestLinks(currentGuests);
  renderGuestMeta();
}

function exportGuestsCsv() {
  const guests = [...currentGuests];
  if (!guests.length) {
    setStatus(statusGuests, "Belum ada data tamu untuk diexport.");
    return;
  }

  const baseUrl = normalizeBaseUrl(invitationBaseUrlInput.value);
  const lines = [
    "code,nama,group,status,telepon,link_undangan",
    ...guests.map((guest) => {
      const link = baseUrl ? buildGuestLink(baseUrl, guest.name || "") : "";
      return [
        toCsvCell(guest.code),
        toCsvCell(guest.name),
        toCsvCell(guest.group || "Umum"),
        toCsvCell(guest.status || "active"),
        toCsvCell(guest.phone || ""),
        toCsvCell(link)
      ].join(",");
    })
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "daftar-tamu-undangan.csv";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  setStatus(statusGuests, `CSV berhasil diexport (${guests.length} tamu).`);
}

async function importGuests() {
  try {
    const adminKey = getAdminKeyOrThrow();

    const guests = parseGuestInput();
    if (!guests.length) throw new Error("Daftar tamu kosong");

    setStatus(statusGuests, "Mengimport tamu...");
    const result = await postApi({
      action: "importGuests",
      adminKey,
      guests
    });

    setStatus(statusGuests, `${result.importedCount} tamu baru diimport. Total: ${result.totalGuests}`);
    await loadGuests();
  } catch (error) {
    setStatus(statusGuests, `Error: ${error.message}`);
  }
}

async function loadGuests() {
  try {
    const adminKey = getAdminKeyOrThrow();

    setStatus(statusGuests, "Memuat daftar tamu...");
    const result = await postApi({
      action: "listGuests",
      adminKey,
      search: String((guestSearch && guestSearch.value) || "").trim(),
      group: String((guestGroupFilter && guestGroupFilter.value) || "all").trim(),
      status: String((guestStatusFilter && guestStatusFilter.value) || "all").trim(),
      page: guestState.page,
      pageSize: Number((guestPageSize && guestPageSize.value) || guestState.pageSize || 20)
    });
    currentGuests = Array.isArray(result.guests) ? result.guests : [];
    guestState.total = Number(result.total || currentGuests.length);
    guestState.page = Number(result.page || 1);
    guestState.pageSize = Number(result.pageSize || guestState.pageSize || 20);
    guestState.totalPages = Number(result.totalPages || 1);
    guestState.groups = Array.isArray(result.groups) ? result.groups : [];
    guestState.statuses = Array.isArray(result.statuses) ? result.statuses : guestState.statuses;
    renderGuestFilterOptions();
    refreshGuestViews();
    setStatus(statusGuests, `Berhasil memuat ${currentGuests.length} tamu (total ${guestState.total})`);
  } catch (error) {
    setStatus(statusGuests, `Error: ${error.message}`);
  }
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  } catch (error) {
    return String(value);
  }
}

function renderRsvpMeta() {
  if (!rsvpPageInfo) return;
  rsvpPageInfo.textContent = `Halaman ${rsvpState.page} / ${rsvpState.totalPages} (${rsvpState.total} RSVP)`;
  if (btnRsvpPrev) btnRsvpPrev.disabled = rsvpState.page <= 1;
  if (btnRsvpNext) btnRsvpNext.disabled = rsvpState.page >= rsvpState.totalPages;
}

async function deleteRsvpByRow(rowNumber) {
  try {
    if (!rsvpFullMode) {
      throw new Error("Hapus RSVP butuh update Code.gs terbaru terlebih dahulu");
    }
    const adminKey = getAdminKeyOrThrow();
    if (!window.confirm("Hapus data RSVP ini?")) return;

    setStatus(statusRsvps, "Menghapus RSVP...");
    await postApi({
      action: "deleteRsvp",
      adminKey,
      rowNumber
    });

    setStatus(statusRsvps, "RSVP berhasil dihapus");
    await loadRsvps();
  } catch (error) {
    setStatus(statusRsvps, `Error: ${error.message}`);
  }
}

function renderRsvpTable(rows) {
  if (!rsvpTableBody) return;
  rsvpTableBody.innerHTML = "";

  if (!rows.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = "Belum ada data RSVP.";
    row.appendChild(cell);
    rsvpTableBody.appendChild(row);
    return;
  }

  rows.forEach((item) => {
    const row = document.createElement("tr");

    const waktuCell = document.createElement("td");
    waktuCell.textContent = formatDateTime(item.waktu);

    const namaCell = document.createElement("td");
    namaCell.textContent = item.nama || "-";

    const jumlahCell = document.createElement("td");
    jumlahCell.textContent = String(item.jumlah || 0);

    const kehadiranCell = document.createElement("td");
    kehadiranCell.textContent = item.kehadiran || "-";

    const ucapanCell = document.createElement("td");
    ucapanCell.textContent = item.ucapan || "-";

    const actionCell = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-mini";
    deleteBtn.textContent = rsvpFullMode ? "Hapus" : "Read Only";
    deleteBtn.disabled = !rsvpFullMode;
    if (rsvpFullMode) {
      deleteBtn.addEventListener("click", () => deleteRsvpByRow(item.rowNumber));
    }
    actionCell.appendChild(deleteBtn);

    row.appendChild(waktuCell);
    row.appendChild(namaCell);
    row.appendChild(jumlahCell);
    row.appendChild(kehadiranCell);
    row.appendChild(ucapanCell);
    row.appendChild(actionCell);
    rsvpTableBody.appendChild(row);
  });
}

function refreshRsvpViews() {
  renderRsvpTable(currentRsvps);
  renderRsvpMeta();
}

async function loadRsvps() {
  try {
    rsvpFullMode = true;
    const adminKey = getAdminKeyOrThrow();
    setStatus(statusRsvps, "Memuat RSVP...");

    const result = await postApi({
      action: "listRsvps",
      adminKey,
      search: String((rsvpSearch && rsvpSearch.value) || "").trim(),
      kehadiran: String((rsvpKehadiranFilter && rsvpKehadiranFilter.value) || "all").trim(),
      page: rsvpState.page,
      pageSize: Number((rsvpPageSize && rsvpPageSize.value) || rsvpState.pageSize || 20)
    });

    currentRsvps = Array.isArray(result.rsvps) ? result.rsvps : [];
    rsvpState.total = Number(result.total || currentRsvps.length);
    rsvpState.page = Number(result.page || 1);
    rsvpState.pageSize = Number(result.pageSize || rsvpState.pageSize || 20);
    rsvpState.totalPages = Number(result.totalPages || 1);
    refreshRsvpViews();
    setStatus(statusRsvps, `Berhasil memuat ${currentRsvps.length} data RSVP (total ${rsvpState.total})`);
  } catch (error) {
    try {
      const fallbackUrl = new URL(RSVP_API_URL);
      fallbackUrl.searchParams.set("action", "wishes");
      fallbackUrl.searchParams.set("limit", String(Number((rsvpPageSize && rsvpPageSize.value) || 20)));
      fallbackUrl.searchParams.set("_ts", String(Date.now()));

      const response = await fetch(fallbackUrl.toString(), { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal memuat fallback ucapan");
      }

      currentRsvps = (result.wishes || []).map((item, index) => ({
        rowNumber: index + 2,
        waktu: item.waktu,
        nama: item.nama,
        jumlah: "-",
        kehadiran: item.kehadiran || "-",
        ucapan: item.ucapan || "-"
      }));
      rsvpState.total = currentRsvps.length;
      rsvpState.page = 1;
      rsvpState.totalPages = 1;
      rsvpFullMode = false;
      refreshRsvpViews();
      setStatus(statusRsvps, "Mode fallback aktif: menampilkan data ucapan. Update Code.gs untuk manajemen RSVP penuh.");
    } catch (fallbackError) {
      setStatus(statusRsvps, `Error: ${error.message}`);
    }
  }
}

if (!RSVP_API_URL || RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
  setStatus(statusConn, "Isi RSVP_API_URL di config.js agar admin panel aktif.");
} else {
  setStatus(statusConn, "Terhubung. Konfigurasi server akan dimuat otomatis.");
}

fillForm(WEDDING_CONFIG);
loadSavedAdminKey();
loadSavedInvitationBaseUrl();
renderGalleryPreview();
renderLoveStoryPreview();
adminKeyInput.addEventListener("change", () => {
  saveAdminKey(adminKeyInput.value.trim());
});
invitationBaseUrlInput.addEventListener("change", () => {
  saveInvitationBaseUrl(invitationBaseUrlInput.value);
});
invitationBaseUrlInput.addEventListener("input", () => {
  saveInvitationBaseUrl(invitationBaseUrlInput.value);
  refreshGuestViews();
});
fields.weddingDateTimeLocal.addEventListener("input", updateWeddingIsoPreview);
fields.weddingTimeOffset.addEventListener("change", updateWeddingIsoPreview);
fields.galleryPhotos.addEventListener("input", renderGalleryPreview);
fields.loveStoryPhotos.addEventListener("input", renderLoveStoryPreview);
if (fields.heroDateStart) {
  fields.heroDateStart.addEventListener("change", generateHeroDatePlaceFromInputs);
}
if (fields.heroDateEnd) {
  fields.heroDateEnd.addEventListener("change", generateHeroDatePlaceFromInputs);
}
if (fields.heroDateCity) {
  fields.heroDateCity.addEventListener("input", () => {
    if (!fields.heroDateStart.value) return;
    generateHeroDatePlaceFromInputs();
  });
}
if (fields.galleryMode) {
  fields.galleryMode.addEventListener("change", updateGalleryModeFields);
}
if (guestSearch) {
  guestSearch.addEventListener("input", () => {
    guestState.page = 1;
    loadGuests();
  });
}
if (guestGroupFilter) {
  guestGroupFilter.addEventListener("change", () => {
    guestState.page = 1;
    loadGuests();
  });
}
if (guestStatusFilter) {
  guestStatusFilter.addEventListener("change", () => {
    guestState.page = 1;
    loadGuests();
  });
}
if (guestPageSize) {
  guestPageSize.addEventListener("change", () => {
    guestState.page = 1;
    loadGuests();
  });
}
if (btnGuestPrev) {
  btnGuestPrev.addEventListener("click", () => {
    guestState.page = Math.max(guestState.page - 1, 1);
    loadGuests();
  });
}
if (btnGuestNext) {
  btnGuestNext.addEventListener("click", () => {
    guestState.page = Math.min(guestState.page + 1, guestState.totalPages || 1);
    loadGuests();
  });
}
if (rsvpSearch) {
  rsvpSearch.addEventListener("input", () => {
    rsvpState.page = 1;
    loadRsvps();
  });
}
if (rsvpKehadiranFilter) {
  rsvpKehadiranFilter.addEventListener("change", () => {
    rsvpState.page = 1;
    loadRsvps();
  });
}
if (rsvpPageSize) {
  rsvpPageSize.addEventListener("change", () => {
    rsvpState.page = 1;
    loadRsvps();
  });
}
if (btnRsvpPrev) {
  btnRsvpPrev.addEventListener("click", () => {
    rsvpState.page = Math.max(rsvpState.page - 1, 1);
    loadRsvps();
  });
}
if (btnRsvpNext) {
  btnRsvpNext.addEventListener("click", () => {
    rsvpState.page = Math.min(rsvpState.page + 1, rsvpState.totalPages || 1);
    loadRsvps();
  });
}
if (btnHeroFromGallery) {
  btnHeroFromGallery.addEventListener("click", () => {
    const galleryUrls = getGalleryUrls();
    if (!galleryUrls.length) {
      setStatus(statusConfig, "Galeri kosong. Upload foto dulu.");
      return;
    }
    setHeroFromGallery(galleryUrls[0]);
    setStatus(statusConfig, "Hero background diisi dari foto galeri pertama.");
  });
}
if (btnLoveStoryFromGallery) {
  btnLoveStoryFromGallery.addEventListener("click", () => {
    const count = fillLoveStoryFromGallery();
    if (!count) {
      setStatus(statusConfig, "Galeri kosong. Upload foto dulu.");
      return;
    }
    setStatus(statusConfig, `${count} foto Love Story diisi dari galeri.`);
  });
}
if (RSVP_API_URL && !RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
  loadConfigFromServer();
  loadGuests();
  loadRsvps();
}
