// URL Web App Google Apps Script yang menjadi sumber utama data undangan.
const RSVP_API_URL = "https://script.google.com/macros/s/AKfycbxzlazLkS5hXUtj4dg7UiZESPEsCx8sBUQawgWlTsS3lXsGuO7W6plCavPqNp6-YQsw/exec";

// Pengaturan lokal khusus admin. Data undangan tetap diambil dari server.
const ADMIN_CONFIG = {
  invitationBaseUrl: "https://username.github.io/nama-repo/"
};

// Fallback minimal agar halaman tidak rusak saat server belum tersambung.
// Jangan isi data undangan utama di sini; kelola konten lewat admin/server.
const WEDDING_CONFIG = {
  brandInitials: "",
  seoTitle: "Undangan Pernikahan",
  seoDescription: "Undangan pernikahan digital dengan RSVP online.",
  heroOverline: "Wedding Invitation",
  brideShortName: "",
  groomShortName: "",
  brideFullName: "",
  groomFullName: "",
  brideParents: "",
  groomParents: "",
  heroDatePlace: "",
  heroBackgroundPhoto: "",
  footerNames: "",
  weddingDateISO: "",
  eventStartISO: "",
  quranVerseArabic: "",
  quranVerseTranslation: "",
  quranVerseReference: "",
  hadithText: "",
  hadithReference: "",
  marriageDoaText: "",
  marriageDoaReference: "",
  backgroundMusicUrl: "",
  musicPlaybackMode: "ordered",
  musicPlaylist: [],
  musicStartSec: "",
  musicLoopStartSec: "",
  musicLoopEndSec: "",
  akad: {
    date: "",
    time: "",
    venue: "",
    mapUrl: ""
  },
  resepsi: {
    date: "",
    time: "",
    venue: "",
    mapUrl: ""
  },
  loveStoryPhotos: [],
  loveStoryItems: [],
  galleryPhotos: [],
  galleryPhotoFocus: {},
  galleryMode: "grid",
  galleryMaxItems: "",
  galleryAutoplaySec: "",
  galleryStyle: "elegant",
  giftEnabled: false,
  giftSectionTitle: "Wedding Gift",
  giftSectionSubtitle: "",
  giftAccounts: []
};
