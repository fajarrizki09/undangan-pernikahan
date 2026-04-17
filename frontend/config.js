// Ganti URL ini dengan URL Web App Google Apps Script Anda setelah deploy.
const RSVP_API_URL = "https://script.google.com/macros/s/AKfycbxzlazLkS5hXUtj4dg7UiZESPEsCx8sBUQawgWlTsS3lXsGuO7W6plCavPqNp6-YQsw/exec";

// Pengaturan untuk halaman admin.
const ADMIN_CONFIG = {
  invitationBaseUrl: "https://username.github.io/nama-repo/"
};

// Konfigurasi fallback (dipakai jika server belum punya data config).
const WEDDING_CONFIG = {
  brandInitials: "A & F",
  seoTitle: "Undangan Pernikahan",
  seoDescription: "Undangan pernikahan digital dengan RSVP online.",
  heroOverline: "Wedding Invitation",
  brideShortName: "Alya",
  groomShortName: "Fajar",
  brideFullName: "Alya Putri Ramadhani",
  groomFullName: "Fajar Maulana Pratama",
  brideParents: "Putri dari Bapak Ahmad & Ibu Nurhayati",
  groomParents: "Putra dari Bapak Hadi & Ibu Siti Aminah",
  heroDatePlace: "Minggu, 20 Desember 2026 • Surabaya",
  heroBackgroundPhoto: "assets/photos/foto-1.svg",
  footerNames: "Alya & Fajar",
  weddingDateISO: "2026-12-20T08:00:00+07:00",
  eventStartISO: "2026-12-20T08:00:00+07:00",
  quranVerseArabic: "&#x648;&#x64E;&#x645;&#x650;&#x646;&#x652; &#x622;&#x64A;&#x64E;&#x627;&#x62A;&#x650;&#x647;&#x650; &#x623;&#x64E;&#x646;&#x652; &#x62E;&#x64E;&#x644;&#x64E;&#x642;&#x64E; &#x644;&#x64E;&#x643;&#x64F;&#x645;&#x652; &#x645;&#x650;&#x646;&#x652; &#x623;&#x64E;&#x646;&#x652;&#x641;&#x64F;&#x633;&#x650;&#x643;&#x64F;&#x645;&#x652; &#x623;&#x64E;&#x632;&#x652;&#x648;&#x64E;&#x627;&#x62C;&#x64B;&#x627; &#x644;&#x650;&#x62A;&#x64E;&#x633;&#x652;&#x643;&#x64F;&#x646;&#x64F;&#x648;&#x627; &#x625;&#x650;&#x644;&#x64E;&#x64A;&#x652;&#x647;&#x64E;&#x627; &#x648;&#x64E;&#x62C;&#x64E;&#x639;&#x64E;&#x644;&#x64E; &#x628;&#x64E;&#x64A;&#x652;&#x646;&#x64E;&#x643;&#x64F;&#x645;&#x652; &#x645;&#x64E;&#x648;&#x64E;&#x62F;&#x64E;&#x651;&#x629;&#x64B; &#x648;&#x64E;&#x631;&#x64E;&#x62D;&#x652;&#x645;&#x64E;&#x629;&#x64B;",
  quranVerseTranslation: "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.",
  quranVerseReference: "QS. Ar-Rum: 21",
  hadithText: "\"Sebaik-baik kalian adalah yang paling baik kepada istrinya, dan aku adalah yang paling baik kepada istriku.\"",
  hadithReference: "HR. Tirmidzi",
  marriageDoaText: "\"Barakallahu laka, wa baraka 'alaika, wa jama'a bainakuma fii khair.\"",
  marriageDoaReference: "Semoga Allah memberkahimu, memberkahi atasmu, dan mengumpulkan kalian berdua dalam kebaikan.",
  backgroundMusicUrl: "assets/music/akad-payung-teduh.mp3",
  musicStartSec: "",
  musicLoopStartSec: "",
  musicLoopEndSec: "",
  akad: {
    date: "Minggu, 20 Desember 2026",
    time: "08.00 WIB",
    venue: "Masjid Al-Ikhlas, Surabaya",
    mapUrl: "https://maps.google.com"
  },
  resepsi: {
    date: "Minggu, 20 Desember 2026",
    time: "11.00 - 14.00 WIB",
    venue: "Graha Puspita, Surabaya",
    mapUrl: "https://maps.google.com"
  },
  loveStoryPhotos: [
    "assets/photos/foto-1.svg",
    "assets/photos/foto-2.svg",
    "assets/photos/foto-3.svg"
  ],
  loveStoryItems: [
    {
      date: "2021",
      title: "Pertama Bertemu",
      description: "Kami bertemu dalam sebuah kegiatan komunitas dan mulai saling mengenal lebih dekat."
    },
    {
      date: "2023",
      title: "Lamaran",
      description: "Dengan restu keluarga, kami melangkah ke tahap yang lebih serius untuk masa depan bersama."
    },
    {
      date: "2026",
      title: "Hari Pernikahan",
      description: "InsyaAllah kami menyempurnakan separuh agama dan memulai perjalanan rumah tangga."
    }
  ],
  galleryMode: "grid",
  galleryMaxItems: "",
  galleryAutoplaySec: "3.5",
  galleryStyle: "elegant",
  galleryPhotoFocus: {},
  giftEnabled: false,
  giftSectionTitle: "Wedding Gift",
  giftSectionSubtitle: "Doa restu Anda adalah hadiah terindah. Jika berkenan, Anda dapat mengirimkan tanda kasih melalui rekening berikut.",
  giftAccounts: [
    {
      bankCode: "bca",
      bankName: "BCA",
      accountNumber: "",
      accountHolder: "",
      logoUrl: "https://logo.clearbit.com/bca.co.id",
      isActive: true
    }
  ],
  galleryPhotos: [
    "assets/photos/foto-1.svg",
    "assets/photos/foto-2.svg",
    "assets/photos/foto-3.svg",
    "assets/photos/foto-4.svg",
    "assets/photos/foto-5.svg",
    "assets/photos/foto-6.svg"
  ]
};
