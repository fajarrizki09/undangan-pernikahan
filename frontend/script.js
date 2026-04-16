const form = document.getElementById("rsvpForm");
const statusText = document.getElementById("formStatus");
const inputNama = document.getElementById("inputNama");

const cdDays = document.getElementById("cdDays");
const cdHours = document.getElementById("cdHours");
const cdMinutes = document.getElementById("cdMinutes");
const cdSeconds = document.getElementById("cdSeconds");

const musicToggle = document.getElementById("musicToggle");
const bgMusic = document.getElementById("bgMusic");
const leafLayer = document.getElementById("leafLayer");
const flowerLayer = document.getElementById("flowerLayer");

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

let currentConfig = {
  ...WEDDING_CONFIG,
  akad: { ...(WEDDING_CONFIG.akad || {}) },
  resepsi: { ...(WEDDING_CONFIG.resepsi || {}) },
  galleryPhotos: Array.isArray(WEDDING_CONFIG.galleryPhotos) ? [...WEDDING_CONFIG.galleryPhotos] : []
};

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.textContent = value;
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

  return {
    ...base,
    ...incoming,
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
  if (!RSVP_API_URL || RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
    return;
  }

  try {
    const url = new URL(RSVP_API_URL);
    url.searchParams.set("action", "config");
    url.searchParams.set("_ts", String(Date.now()));

    const response = await fetchWithTimeout(url.toString(), {
      cache: "no-store"
    }, 6000);
    const result = await response.json();

    if (response.ok && result.success && result.config) {
      currentConfig = mergeConfig(currentConfig, result.config);
    }
  } catch (error) {
    // Fallback ke config lokal jika gagal mengambil config server.
  }
}

function normalizeGalleryUrl(url) {
  const clean = String(url || "").trim();
  if (!clean) return "";

  const queryIdMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const pathIdMatch = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const fileId = (queryIdMatch && queryIdMatch[1]) || (pathIdMatch && pathIdMatch[1]);

  if (clean.includes("drive.google.com") && fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
  }

  return clean;
}

function applyWeddingConfig() {
  setText("brandInitials", currentConfig.brandInitials);
  setText("heroBrideShort", currentConfig.brideShortName);
  setText("heroGroomShort", currentConfig.groomShortName);
  setText("heroDatePlace", currentConfig.heroDatePlace);

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

  if (currentConfig.backgroundMusicUrl && bgMusic) {
    bgMusic.src = currentConfig.backgroundMusicUrl;
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

  const titleNames = `${currentConfig.brideShortName || "Mempelai"} & ${currentConfig.groomShortName || "Mempelai"}`;
  document.title = `Undangan Pernikahan | ${titleNames}`;
}

function applyGuestName() {
  const guestName = getGuestNameFromUrl();
  setText("guestName", guestName);
  if (inputNama && guestName !== "Bapak/Ibu/Saudara/i") {
    inputNama.value = guestName;
  }
}

function updateCountdown() {
  const dateISO = currentConfig.weddingDateISO || "2026-12-20T08:00:00+07:00";
  const weddingDate = new Date(dateISO).getTime();

  if (Number.isNaN(weddingDate)) {
    cdDays.textContent = "-";
    cdHours.textContent = "-";
    cdMinutes.textContent = "-";
    cdSeconds.textContent = "-";
    return;
  }

  const now = Date.now();
  const distance = weddingDate - now;

  if (distance <= 0) {
    cdDays.textContent = "0";
    cdHours.textContent = "0";
    cdMinutes.textContent = "0";
    cdSeconds.textContent = "0";
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  cdDays.textContent = String(days);
  cdHours.textContent = String(hours).padStart(2, "0");
  cdMinutes.textContent = String(minutes).padStart(2, "0");
  cdSeconds.textContent = String(seconds).padStart(2, "0");
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

  const hasMusic = Boolean(currentConfig.backgroundMusicUrl);
  if (!hasMusic) {
    musicToggle.disabled = true;
    musicToggle.textContent = "Musik belum diatur";
    return;
  }

  function setPlayingState(isPlaying) {
    musicToggle.textContent = isPlaying ? "Pause Music" : "Play Music";
    musicToggle.classList.toggle("is-playing", isPlaying);
  }

  setPlayingState(false);

  musicToggle.addEventListener("click", async () => {
    if (bgMusic.paused) {
      try {
        await bgMusic.play();
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
  await loadServerConfig();
  applyWeddingConfig();
  applyGuestName();
  updateCountdown();
  setupRevealAnimation();
  setupMusicControl();
  setupVisibilityOptimization();
  startTimers();
}

initPage();
