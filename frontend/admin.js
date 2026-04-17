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
  loveStoryPhotos: document.getElementById("loveStoryPhotos"),
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
const guestSearch = document.getElementById("guestSearch");
const guestGroupFilter = document.getElementById("guestGroupFilter");
const guestStatusFilter = document.getElementById("guestStatusFilter");
const guestPageSize = document.getElementById("guestPageSize");
const guestPageInfo = document.getElementById("guestPageInfo");
const btnGuestPrev = document.getElementById("btnGuestPrev");
const btnGuestNext = document.getElementById("btnGuestNext");
const guestLinks = document.getElementById("guestLinks");
const guestTableBody = document.getElementById("guestTableBody");
const photoFilesInput = document.getElementById("photoFiles");
const deletePhotoUrlsInput = document.getElementById("deletePhotoUrls");
const musicFileInput = document.getElementById("musicFile");
const galleryPreview = document.getElementById("galleryPreview");
const deleteFromDriveInput = document.getElementById("deleteFromDrive");
const ADMIN_KEY_STORAGE_KEY = "wedding_admin_key";
const INVITATION_BASE_URL_STORAGE_KEY = "wedding_invitation_base_url";

document.getElementById("btnLoadConfig").addEventListener("click", loadConfigFromServer);
document.getElementById("btnSaveConfig").addEventListener("click", saveConfigToServer);
document.getElementById("btnUploadPhotos").addEventListener("click", uploadPhotosToDrive);
document.getElementById("btnDeletePhotos").addEventListener("click", deletePhotosFromDriveAndGallery);
document.getElementById("btnUploadMusic").addEventListener("click", uploadMusicToDrive);
document.getElementById("btnImportGuests").addEventListener("click", importGuests);
document.getElementById("btnLoadGuests").addEventListener("click", loadGuests);
document.getElementById("btnExportGuestsCsv").addEventListener("click", exportGuestsCsv);

apiUrlInput.value = RSVP_API_URL;
let currentGuests = [];
let guestState = {
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  groups: [],
  statuses: ["active", "vip", "disabled"]
};

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
  const photos = getGalleryUrls();
  const storyPhotos = fields.loveStoryPhotos.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

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
    loveStoryPhotos: storyPhotos,
    galleryPhotos: photos
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

  fields.brandInitials.value = safeConfig.brandInitials || "";
  fields.heroOverline.value = safeConfig.heroOverline || "";
  fields.brideShortName.value = safeConfig.brideShortName || "";
  fields.groomShortName.value = safeConfig.groomShortName || "";
  fields.brideFullName.value = safeConfig.brideFullName || "";
  fields.groomFullName.value = safeConfig.groomFullName || "";
  fields.brideParents.value = safeConfig.brideParents || "";
  fields.groomParents.value = safeConfig.groomParents || "";
  fields.heroDatePlace.value = safeConfig.heroDatePlace || "";
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
  fields.quranVerseArabic.value = safeConfig.quranVerseArabic || "";
  fields.quranVerseTranslation.value = safeConfig.quranVerseTranslation || "";
  fields.quranVerseReference.value = safeConfig.quranVerseReference || "";
  fields.hadithText.value = safeConfig.hadithText || "";
  fields.hadithReference.value = safeConfig.hadithReference || "";
  fields.marriageDoaText.value = safeConfig.marriageDoaText || "";
  fields.marriageDoaReference.value = safeConfig.marriageDoaReference || "";

  fields.loveStoryPhotos.value = Array.isArray(safeConfig.loveStoryPhotos) ? safeConfig.loveStoryPhotos.slice(0, 3).join("\n") : "";
  fields.galleryPhotos.value = Array.isArray(safeConfig.galleryPhotos) ? safeConfig.galleryPhotos.join("\n") : "";
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
    if (url) unique.add(url);
  });

  fields.galleryPhotos.value = Array.from(unique).join("\n");
  renderGalleryPreview();
}

function removeGalleryUrls(urls) {
  const targets = new Set(
    (urls || [])
      .map((item) => String(item || "").trim())
      .filter(Boolean)
  );

  const existing = getGalleryUrls();

  const filtered = existing.filter((url) => !targets.has(url));
  fields.galleryPhotos.value = filtered.join("\n");
  renderGalleryPreview();
}

function getGalleryUrls() {
  return fields.galleryPhotos.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizePreviewUrl(url) {
  const clean = String(url || "").trim();
  if (!clean) return "";

  const idFromQuery = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const idFromPath = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const fileId = (idFromQuery && idFromQuery[1]) || (idFromPath && idFromPath[1]);
  if (clean.includes("drive.google.com") && fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  return clean;
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
    img.src = normalizePreviewUrl(url);
    img.alt = "Preview foto galeri";
    img.loading = "lazy";

    const body = document.createElement("div");
    body.className = "gallery-item-body";

    const urlText = document.createElement("p");
    urlText.className = "gallery-item-url";
    urlText.textContent = url;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-mini";
    removeBtn.textContent = "Hapus Foto";
    removeBtn.addEventListener("click", () => {
      deleteSinglePhoto(url);
    });

    body.appendChild(urlText);
    body.appendChild(removeBtn);
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
  return `${baseUrl}?to=${encodeURIComponent(name)}`;
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

if (!RSVP_API_URL || RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
  setStatus(statusConn, "Isi RSVP_API_URL di config.js agar admin panel aktif.");
} else {
  setStatus(statusConn, "Terhubung. Konfigurasi server akan dimuat otomatis.");
}

fillForm(WEDDING_CONFIG);
loadSavedAdminKey();
loadSavedInvitationBaseUrl();
renderGalleryPreview();
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
if (RSVP_API_URL && !RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
  loadConfigFromServer();
  loadGuests();
}
