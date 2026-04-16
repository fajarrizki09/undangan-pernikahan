const fields = {
  brandInitials: document.getElementById("brandInitials"),
  heroOverline: document.getElementById("heroOverline"),
  brideShortName: document.getElementById("brideShortName"),
  groomShortName: document.getElementById("groomShortName"),
  brideFullName: document.getElementById("brideFullName"),
  groomFullName: document.getElementById("groomFullName"),
  brideParents: document.getElementById("brideParents"),
  groomParents: document.getElementById("groomParents"),
  heroDatePlace: document.getElementById("heroDatePlace"),
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
  galleryPhotos: document.getElementById("galleryPhotos"),
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

const guestInput = document.getElementById("guestInput");
const guestLinks = document.getElementById("guestLinks");
const photoFilesInput = document.getElementById("photoFiles");
const deletePhotoUrlsInput = document.getElementById("deletePhotoUrls");
const musicFileInput = document.getElementById("musicFile");
const ADMIN_KEY_STORAGE_KEY = "wedding_admin_key";
const INVITATION_BASE_URL_STORAGE_KEY = "wedding_invitation_base_url";

document.getElementById("btnLoadConfig").addEventListener("click", loadConfigFromServer);
document.getElementById("btnSaveConfig").addEventListener("click", saveConfigToServer);
document.getElementById("btnUploadPhotos").addEventListener("click", uploadPhotosToDrive);
document.getElementById("btnDeletePhotos").addEventListener("click", deletePhotosFromDriveAndGallery);
document.getElementById("btnUploadMusic").addEventListener("click", uploadMusicToDrive);
document.getElementById("btnImportGuests").addEventListener("click", importGuests);
document.getElementById("btnLoadGuests").addEventListener("click", loadGuests);

apiUrlInput.value = RSVP_API_URL;

function getDefaultInvitationBaseUrl() {
  const fromConfig = (ADMIN_CONFIG && ADMIN_CONFIG.invitationBaseUrl) || "";
  if (fromConfig.trim()) return fromConfig.trim();
  return `${window.location.origin}/`;
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
  return clean.endsWith("/") ? clean : clean + "/";
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

function parseNonNegativeNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return "";
  return String(num);
}

function readConfigFromForm() {
  const photos = fields.galleryPhotos.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    brandInitials: fields.brandInitials.value.trim(),
    heroOverline: fields.heroOverline.value.trim(),
    brideShortName: fields.brideShortName.value.trim(),
    groomShortName: fields.groomShortName.value.trim(),
    brideFullName: fields.brideFullName.value.trim(),
    groomFullName: fields.groomFullName.value.trim(),
    brideParents: fields.brideParents.value.trim(),
    groomParents: fields.groomParents.value.trim(),
    heroDatePlace: fields.heroDatePlace.value.trim(),
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
    galleryPhotos: photos
  };
}

function fillForm(config) {
  fields.brandInitials.value = config.brandInitials || "";
  fields.heroOverline.value = config.heroOverline || "";
  fields.brideShortName.value = config.brideShortName || "";
  fields.groomShortName.value = config.groomShortName || "";
  fields.brideFullName.value = config.brideFullName || "";
  fields.groomFullName.value = config.groomFullName || "";
  fields.brideParents.value = config.brideParents || "";
  fields.groomParents.value = config.groomParents || "";
  fields.heroDatePlace.value = config.heroDatePlace || "";
  fields.footerNames.value = config.footerNames || "";
  fields.backgroundMusicUrl.value = config.backgroundMusicUrl || "";
  fields.musicStartSec.value = config.musicStartSec || "";
  fields.musicLoopStartSec.value = config.musicLoopStartSec || "";
  fields.musicLoopEndSec.value = config.musicLoopEndSec || "";

  const parsedWeddingDate = parseWeddingIso(config.weddingDateISO || "");
  fields.weddingDateTimeLocal.value = parsedWeddingDate.localDateTime;
  fields.weddingTimeOffset.value = parsedWeddingDate.offset;
  updateWeddingIsoPreview();

  fields.akadDate.value = (config.akad && config.akad.date) || "";
  fields.akadTime.value = (config.akad && config.akad.time) || "";
  fields.akadVenue.value = (config.akad && config.akad.venue) || "";
  fields.akadMapUrl.value = (config.akad && config.akad.mapUrl) || "";

  fields.resepsiDate.value = (config.resepsi && config.resepsi.date) || "";
  fields.resepsiTime.value = (config.resepsi && config.resepsi.time) || "";
  fields.resepsiVenue.value = (config.resepsi && config.resepsi.venue) || "";
  fields.resepsiMapUrl.value = (config.resepsi && config.resepsi.mapUrl) || "";

  fields.galleryPhotos.value = Array.isArray(config.galleryPhotos) ? config.galleryPhotos.join("\n") : "";
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
  const existing = fields.galleryPhotos.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const unique = new Set(existing);
  urls.forEach((url) => {
    if (url) unique.add(url);
  });

  fields.galleryPhotos.value = Array.from(unique).join("\n");
}

function removeGalleryUrls(urls) {
  const targets = new Set(
    (urls || [])
      .map((item) => String(item || "").trim())
      .filter(Boolean)
  );

  const existing = fields.galleryPhotos.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const filtered = existing.filter((url) => !targets.has(url));
  fields.galleryPhotos.value = filtered.join("\n");
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

    // Auto-save config setelah upload agar galeri publik langsung ikut update.
    await postApi({
      action: "saveConfig",
      adminKey,
      config: readConfigFromForm()
    });

    photoFilesInput.value = "";
    setStatus(statusConfig, `${uploadedUrls.length} foto berhasil diupload dan konfigurasi galeri otomatis disimpan`);
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
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildGuestLink(baseUrl, name) {
  return `${baseUrl}?to=${encodeURIComponent(name)}`;
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
    const result = await postApi({ action: "listGuests", adminKey });
    renderGuestLinks(result.guests || []);
    setStatus(statusGuests, `Berhasil memuat ${result.guests.length} tamu`);
  } catch (error) {
    setStatus(statusGuests, `Error: ${error.message}`);
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
adminKeyInput.addEventListener("change", () => {
  saveAdminKey(adminKeyInput.value.trim());
});
invitationBaseUrlInput.addEventListener("change", () => {
  saveInvitationBaseUrl(invitationBaseUrlInput.value);
});
invitationBaseUrlInput.addEventListener("input", () => {
  saveInvitationBaseUrl(invitationBaseUrlInput.value);
});
fields.weddingDateTimeLocal.addEventListener("input", updateWeddingIsoPreview);
fields.weddingTimeOffset.addEventListener("change", updateWeddingIsoPreview);
if (RSVP_API_URL && !RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
  loadConfigFromServer();
}
