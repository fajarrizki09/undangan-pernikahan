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

async function loadServerConfig() {
  if (!RSVP_API_URL || RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
    return;
  }

  try {
    const response = await fetch(`${RSVP_API_URL}?action=config`);
    const result = await response.json();

    if (response.ok && result.success && result.config) {
      currentConfig = mergeConfig(currentConfig, result.config);
    }
  } catch (error) {
    // Fallback ke config lokal jika gagal mengambil config server.
  }
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
  }

  if (currentConfig.resepsi) {
    setText("resepsiDate", currentConfig.resepsi.date);
    setText("resepsiTime", currentConfig.resepsi.time);
    setText("resepsiVenue", currentConfig.resepsi.venue);
    setLink("resepsiMap", currentConfig.resepsi.mapUrl);
  }

  if (Array.isArray(currentConfig.galleryPhotos)) {
    currentConfig.galleryPhotos.forEach((src, index) => {
      const img = document.getElementById(`photo${index + 1}`);
      if (img && src) img.src = src;
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
  if (!leafLayer) return;

  const leaf = document.createElement("span");
  leaf.className = "leaf";
  const left = Math.random() * 100;
  const duration = 8 + Math.random() * 8;
  const delay = Math.random() * 1.5;
  const scale = 0.7 + Math.random() * 1.1;

  leaf.style.left = `${left}%`;
  leaf.style.animationDuration = `${duration}s`;
  leaf.style.animationDelay = `${delay}s`;
  leaf.style.transform = `scale(${scale})`;

  leafLayer.appendChild(leaf);
  setTimeout(() => leaf.remove(), (duration + delay) * 1000 + 200);
}

function setupLeafEffect() {
  if (!leafLayer) return;
  setInterval(createLeaf, 900);
}

function createFlower() {
  if (!flowerLayer) return;

  const flower = document.createElement("span");
  flower.className = "flower";
  const left = Math.random() * 100;
  const duration = 7 + Math.random() * 7;
  const delay = Math.random() * 1.2;
  const scale = 0.65 + Math.random() * 0.9;

  flower.style.left = `${left}%`;
  flower.style.animationDuration = `${duration}s`;
  flower.style.animationDelay = `${delay}s`;
  flower.style.transform = `scale(${scale})`;

  flowerLayer.appendChild(flower);
  setTimeout(() => flower.remove(), (duration + delay) * 1000 + 200);
}

function setupFlowerEffect() {
  if (!flowerLayer) return;
  setInterval(createFlower, 1100);
}

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
    const response = await fetch(RSVP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

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

async function initPage() {
  await loadServerConfig();
  applyWeddingConfig();
  applyGuestName();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  setupRevealAnimation();
  setupMusicControl();
  setupLeafEffect();
  setupFlowerEffect();
}

initPage();

