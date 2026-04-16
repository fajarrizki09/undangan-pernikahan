const fields = {
  brandInitials: document.getElementById("brandInitials"),
  brideShortName: document.getElementById("brideShortName"),
  groomShortName: document.getElementById("groomShortName"),
  brideFullName: document.getElementById("brideFullName"),
  groomFullName: document.getElementById("groomFullName"),
  brideParents: document.getElementById("brideParents"),
  groomParents: document.getElementById("groomParents"),
  heroDatePlace: document.getElementById("heroDatePlace"),
  footerNames: document.getElementById("footerNames"),
  weddingDateISO: document.getElementById("weddingDateISO"),
  akadDate: document.getElementById("akadDate"),
  akadTime: document.getElementById("akadTime"),
  akadVenue: document.getElementById("akadVenue"),
  akadMapUrl: document.getElementById("akadMapUrl"),
  resepsiDate: document.getElementById("resepsiDate"),
  resepsiTime: document.getElementById("resepsiTime"),
  resepsiVenue: document.getElementById("resepsiVenue"),
  resepsiMapUrl: document.getElementById("resepsiMapUrl"),
  galleryPhotos: document.getElementById("galleryPhotos")
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
const ADMIN_KEY_STORAGE_KEY = "wedding_admin_key";

document.getElementById("btnLoadConfig").addEventListener("click", loadConfigFromServer);
document.getElementById("btnSaveConfig").addEventListener("click", saveConfigToServer);
document.getElementById("btnUploadPhotos").addEventListener("click", uploadPhotosToDrive);
document.getElementById("btnImportGuests").addEventListener("click", importGuests);
document.getElementById("btnLoadGuests").addEventListener("click", loadGuests);

apiUrlInput.value = RSVP_API_URL;
invitationBaseUrlInput.value = (ADMIN_CONFIG && ADMIN_CONFIG.invitationBaseUrl) || window.location.origin + window.location.pathname.replace(/admin\.html$/, "");

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

function readConfigFromForm() {
  const photos = fields.galleryPhotos.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    brandInitials: fields.brandInitials.value.trim(),
    brideShortName: fields.brideShortName.value.trim(),
    groomShortName: fields.groomShortName.value.trim(),
    brideFullName: fields.brideFullName.value.trim(),
    groomFullName: fields.groomFullName.value.trim(),
    brideParents: fields.brideParents.value.trim(),
    groomParents: fields.groomParents.value.trim(),
    heroDatePlace: fields.heroDatePlace.value.trim(),
    footerNames: fields.footerNames.value.trim(),
    weddingDateISO: fields.weddingDateISO.value.trim(),
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
  fields.brideShortName.value = config.brideShortName || "";
  fields.groomShortName.value = config.groomShortName || "";
  fields.brideFullName.value = config.brideFullName || "";
  fields.groomFullName.value = config.groomFullName || "";
  fields.brideParents.value = config.brideParents || "";
  fields.groomParents.value = config.groomParents || "";
  fields.heroDatePlace.value = config.heroDatePlace || "";
  fields.footerNames.value = config.footerNames || "";
  fields.weddingDateISO.value = config.weddingDateISO || "";

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
adminKeyInput.addEventListener("change", () => {
  saveAdminKey(adminKeyInput.value.trim());
});
if (RSVP_API_URL && !RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
  loadConfigFromServer();
}
