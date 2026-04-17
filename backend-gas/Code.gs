const RSVP_SHEET_NAME = 'RSVP';
const CONFIG_SHEET_NAME = 'Config';
const GUESTS_SHEET_NAME = 'Guests';
const CONFIG_COLUMNS = [
  'brandInitials',
  'heroOverline',
  'brideShortName',
  'groomShortName',
  'brideFullName',
  'groomFullName',
  'brideParents',
  'groomParents',
  'heroDatePlace',
  'heroBackgroundPhoto',
  'footerNames',
  'weddingDateISO',
  'backgroundMusicUrl',
  'musicStartSec',
  'musicLoopStartSec',
  'musicLoopEndSec',
  'akadDate',
  'akadTime',
  'akadVenue',
  'akadMapUrl',
  'resepsiDate',
  'resepsiTime',
  'resepsiVenue',
  'resepsiMapUrl',
  'quranVerseArabic',
  'quranVerseTranslation',
  'quranVerseReference',
  'hadithText',
  'hadithReference',
  'marriageDoaText',
  'marriageDoaReference',
  'loveStoryPhotos',
  'galleryPhotos'
];

function doGet(e) {
  try {
    const action = sanitize(e && e.parameter && e.parameter.action);

    if (action === 'config') {
      const config = getSavedConfig_();
      return jsonResponse({ success: true, config: config });
    }

    if (action === 'wishes') {
      return listWishes_(e && e.parameter);
    }

    return jsonResponse({ success: true, message: 'Wedding API aktif' });
  } catch (error) {
    return jsonResponse({ success: false, message: error.message || 'Internal error' });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, message: 'Payload kosong' });
    }

    const data = JSON.parse(e.postData.contents);
    const action = sanitize(data.action) || 'rsvp';

    if (action === 'saveConfig') {
      assertAdmin_(data.adminKey);
      return saveConfig_(data.config || {});
    }

    if (action === 'importGuests') {
      assertAdmin_(data.adminKey);
      return importGuests_(data.guests || []);
    }

    if (action === 'listGuests') {
      assertAdmin_(data.adminKey);
      return listGuests_();
    }

    if (action === 'updateGuest') {
      assertAdmin_(data.adminKey);
      return updateGuest_(data.code, data.name);
    }

    if (action === 'deleteGuest') {
      assertAdmin_(data.adminKey);
      return deleteGuest_(data.code);
    }

    if (action === 'uploadPhotos') {
      assertAdmin_(data.adminKey);
      return uploadPhotos_(data.files || []);
    }

    if (action === 'deletePhotos') {
      assertAdmin_(data.adminKey);
      return deletePhotos_(data.urls || []);
    }

    return saveRsvp_(data);
  } catch (error) {
    return jsonResponse({ success: false, message: error.message || 'Internal error' });
  }
}

function saveRsvp_(data) {
  const nama = sanitize(data.nama);
  const jumlah = Number(data.jumlah || 0);
  const kehadiran = sanitize(data.kehadiran);
  const ucapan = sanitize(data.ucapan || '-');

  if (!nama) {
    return jsonResponse({ success: false, message: 'Nama wajib diisi' });
  }

  if (!['Hadir', 'Tidak Hadir'].includes(kehadiran)) {
    return jsonResponse({ success: false, message: 'Status kehadiran tidak valid' });
  }

  if (!Number.isFinite(jumlah) || jumlah < 1 || jumlah > 10) {
    return jsonResponse({ success: false, message: 'Jumlah tamu harus 1-10' });
  }

  const sheet = getOrCreateRsvpSheet_();
  sheet.appendRow([
    new Date(),
    nama,
    jumlah,
    kehadiran,
    ucapan
  ]);

  return jsonResponse({ success: true, message: 'RSVP tersimpan' });
}

function listWishes_(params) {
  const limit = Math.min(Math.max(Number(sanitize(params && params.limit)) || 8, 1), 24);
  const sheet = getOrCreateRsvpSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return jsonResponse({ success: true, wishes: [] });
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  const wishes = [];

  for (var i = values.length - 1; i >= 0; i -= 1) {
    const row = values[i];
    const ucapan = sanitize(row[4]);
    if (!ucapan || ucapan === '-') {
      continue;
    }

    wishes.push({
      waktu: row[0],
      nama: sanitize(row[1]) || 'Tamu Undangan',
      kehadiran: sanitize(row[3]) || '-',
      ucapan: ucapan
    });

    if (wishes.length >= limit) {
      break;
    }
  }

  return jsonResponse({ success: true, wishes: wishes });
}

function saveConfig_(config) {
  const normalized = normalizeConfig_(config);
  const sheet = getOrCreateConfigSheet_();
  const rowValues = configToRow_(normalized);
  sheet.getRange(2, 1, 1, CONFIG_COLUMNS.length).setValues([rowValues]);
  return jsonResponse({ success: true, message: 'Konfigurasi tersimpan', config: normalized });
}

function getSavedConfig_() {
  const sheet = getOrCreateConfigSheet_();
  const lastCol = Math.max(sheet.getLastColumn(), CONFIG_COLUMNS.length, 2);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(v) { return sanitize(v); });
  const row = sheet.getRange(2, 1, 1, lastCol).getValues()[0];

  const isLegacy = headers[0] === 'Key' && headers[1] === 'Value';
  if (isLegacy) {
    const raw = sanitize(row[1]);
    let legacyConfig = defaultConfig_();

    if (raw) {
      try {
        legacyConfig = normalizeConfig_(JSON.parse(raw));
      } catch (error) {
        legacyConfig = defaultConfig_();
      }
    }

    migrateConfigSheet_(sheet, legacyConfig);
    return legacyConfig;
  }

  const hasAnyValue = row.some(function(cell) { return sanitize(cell); });
  if (!hasAnyValue) {
    const defaults = defaultConfig_();
    sheet.getRange(2, 1, 1, CONFIG_COLUMNS.length).setValues([configToRow_(defaults)]);
    return defaults;
  }

  return normalizeConfig_(rowToConfig_(headers, row));
}

function importGuests_(guests) {
  const guestNames = normalizeGuestNames_(guests);
  if (!guestNames.length) {
    return jsonResponse({ success: false, message: 'Daftar tamu kosong' });
  }

  const sheet = getOrCreateGuestsSheet_();
  const existing = listGuestRows_(sheet);
  const existingNames = {};
  existing.forEach(function(item) {
    existingNames[item.name.toLowerCase()] = true;
  });

  const inserted = [];
  guestNames.forEach(function(name) {
    const key = name.toLowerCase();
    if (existingNames[key]) return;

    const code = Utilities.getUuid().slice(0, 8);
    sheet.appendRow([new Date(), code, name]);
    existingNames[key] = true;
    inserted.push({ code: code, name: name });
  });

  return jsonResponse({
    success: true,
    message: inserted.length + ' tamu berhasil diimport',
    importedCount: inserted.length,
    totalGuests: Object.keys(existingNames).length,
    guests: inserted
  });
}

function listGuests_() {
  const sheet = getOrCreateGuestsSheet_();
  const rows = listGuestRows_(sheet);
  return jsonResponse({ success: true, guests: rows });
}

function updateGuest_(code, name) {
  const guestCode = sanitize(code);
  const guestName = sanitize(name);

  if (!guestCode) {
    return jsonResponse({ success: false, message: 'Kode tamu wajib diisi' });
  }

  if (!guestName) {
    return jsonResponse({ success: false, message: 'Nama tamu wajib diisi' });
  }

  const sheet = getOrCreateGuestsSheet_();
  const rowIndex = findGuestRowByCode_(sheet, guestCode);
  if (!rowIndex) {
    return jsonResponse({ success: false, message: 'Kode tamu tidak ditemukan' });
  }

  sheet.getRange(rowIndex, 3).setValue(guestName);
  return jsonResponse({ success: true, message: 'Nama tamu diperbarui' });
}

function deleteGuest_(code) {
  const guestCode = sanitize(code);
  if (!guestCode) {
    return jsonResponse({ success: false, message: 'Kode tamu wajib diisi' });
  }

  const sheet = getOrCreateGuestsSheet_();
  const rowIndex = findGuestRowByCode_(sheet, guestCode);
  if (!rowIndex) {
    return jsonResponse({ success: false, message: 'Kode tamu tidak ditemukan' });
  }

  sheet.deleteRow(rowIndex);
  return jsonResponse({ success: true, message: 'Tamu berhasil dihapus' });
}

function uploadPhotos_(files) {
  if (!Array.isArray(files) || !files.length) {
    return jsonResponse({ success: false, message: 'File upload kosong' });
  }

  if (files.length > 10) {
    return jsonResponse({ success: false, message: 'Maksimal 10 file per upload' });
  }

  const uploaded = [];
  const folderId = sanitize(PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID'));
  let folder = null;

  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (error) {
      throw new Error('DRIVE_FOLDER_ID tidak valid');
    }
  }

  files.forEach(function(file, index) {
    const name = sanitize(file.name) || ('photo-' + (index + 1) + '.jpg');
    const mimeType = sanitize(file.mimeType) || 'application/octet-stream';
    const contentBase64 = sanitize(file.contentBase64);

    if (!contentBase64) {
      throw new Error('Konten file kosong: ' + name);
    }

    const bytes = Utilities.base64Decode(contentBase64);
    const blob = Utilities.newBlob(bytes, mimeType, name);
    const driveFile = folder ? folder.createFile(blob) : DriveApp.createFile(blob);
    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    uploaded.push({
      id: driveFile.getId(),
      name: driveFile.getName(),
      webUrl: driveFile.getUrl(),
      publicUrl: 'https://drive.google.com/uc?export=view&id=' + driveFile.getId()
    });
  });

  return jsonResponse({ success: true, files: uploaded });
}

function deletePhotos_(urls) {
  if (!Array.isArray(urls) || !urls.length) {
    return jsonResponse({ success: false, message: 'URL foto yang dihapus kosong' });
  }

  const failed = [];
  const deletedIds = [];
  const uniqueIds = {};

  urls.forEach(function(url) {
    const fileId = extractDriveFileId_(url);
    if (!fileId) {
      failed.push({ url: sanitize(url), reason: 'ID file Drive tidak ditemukan di URL' });
      return;
    }

    if (uniqueIds[fileId]) return;
    uniqueIds[fileId] = true;

    try {
      const driveFile = DriveApp.getFileById(fileId);
      driveFile.setTrashed(true);
      deletedIds.push(fileId);
    } catch (error) {
      failed.push({ url: sanitize(url), reason: error.message || 'Gagal menghapus file' });
    }
  });

  return jsonResponse({
    success: true,
    deletedCount: deletedIds.length,
    deletedIds: deletedIds,
    failed: failed
  });
}

function extractDriveFileId_(url) {
  const text = sanitize(url);
  if (!text) return '';

  const idFromQuery = text.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idFromQuery && idFromQuery[1]) return idFromQuery[1];

  const idFromPath = text.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (idFromPath && idFromPath[1]) return idFromPath[1];

  return '';
}

function listGuestRows_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  return values
    .filter(function(row) { return sanitize(row[2]); })
    .map(function(row) {
      return {
        createdAt: row[0],
        code: sanitize(row[1]),
        name: sanitize(row[2])
      };
    });
}

function findGuestRowByCode_(sheet, code) {
  const guestCode = sanitize(code);
  const lastRow = sheet.getLastRow();
  if (!guestCode || lastRow < 2) return 0;

  const codeValues = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (var i = 0; i < codeValues.length; i += 1) {
    if (sanitize(codeValues[i][0]) === guestCode) {
      return i + 2;
    }
  }

  return 0;
}

function normalizeGuestNames_(guests) {
  if (!Array.isArray(guests)) return [];

  const map = {};
  const result = [];

  guests.forEach(function(item) {
    const name = sanitize(item);
    if (!name) return;
    const key = name.toLowerCase();
    if (map[key]) return;
    map[key] = true;
    result.push(name);
  });

  return result;
}

function normalizeConfig_(config) {
  const defaults = defaultConfig_();
  const source = (config && typeof config === 'object') ? config : {};
  const akadSource = (source.akad && typeof source.akad === 'object') ? source.akad : {};
  const resepsiSource = (source.resepsi && typeof source.resepsi === 'object') ? source.resepsi : {};

  return {
    brandInitials: valueOrDefault_(source, 'brandInitials', defaults.brandInitials),
    heroOverline: valueOrDefault_(source, 'heroOverline', defaults.heroOverline),
    brideShortName: valueOrDefault_(source, 'brideShortName', defaults.brideShortName),
    groomShortName: valueOrDefault_(source, 'groomShortName', defaults.groomShortName),
    brideFullName: valueOrDefault_(source, 'brideFullName', defaults.brideFullName),
    groomFullName: valueOrDefault_(source, 'groomFullName', defaults.groomFullName),
    brideParents: valueOrDefault_(source, 'brideParents', defaults.brideParents),
    groomParents: valueOrDefault_(source, 'groomParents', defaults.groomParents),
    heroDatePlace: valueOrDefault_(source, 'heroDatePlace', defaults.heroDatePlace),
    heroBackgroundPhoto: valueOrDefault_(source, 'heroBackgroundPhoto', defaults.heroBackgroundPhoto),
    footerNames: valueOrDefault_(source, 'footerNames', defaults.footerNames),
    weddingDateISO: valueOrDefault_(source, 'weddingDateISO', defaults.weddingDateISO),
    backgroundMusicUrl: valueOrDefault_(source, 'backgroundMusicUrl', defaults.backgroundMusicUrl),
    musicStartSec: valueOrDefault_(source, 'musicStartSec', defaults.musicStartSec),
    musicLoopStartSec: valueOrDefault_(source, 'musicLoopStartSec', defaults.musicLoopStartSec),
    musicLoopEndSec: valueOrDefault_(source, 'musicLoopEndSec', defaults.musicLoopEndSec),
    akad: {
      date: valueOrDefault_(akadSource, 'date', valueOrDefault_(source, 'akadDate', defaults.akad.date)),
      time: valueOrDefault_(akadSource, 'time', valueOrDefault_(source, 'akadTime', defaults.akad.time)),
      venue: valueOrDefault_(akadSource, 'venue', valueOrDefault_(source, 'akadVenue', defaults.akad.venue)),
      mapUrl: valueOrDefault_(akadSource, 'mapUrl', valueOrDefault_(source, 'akadMapUrl', defaults.akad.mapUrl))
    },
    resepsi: {
      date: valueOrDefault_(resepsiSource, 'date', valueOrDefault_(source, 'resepsiDate', defaults.resepsi.date)),
      time: valueOrDefault_(resepsiSource, 'time', valueOrDefault_(source, 'resepsiTime', defaults.resepsi.time)),
      venue: valueOrDefault_(resepsiSource, 'venue', valueOrDefault_(source, 'resepsiVenue', defaults.resepsi.venue)),
      mapUrl: valueOrDefault_(resepsiSource, 'mapUrl', valueOrDefault_(source, 'resepsiMapUrl', defaults.resepsi.mapUrl))
    },
    quranVerseArabic: valueOrDefault_(source, 'quranVerseArabic', defaults.quranVerseArabic),
    quranVerseTranslation: valueOrDefault_(source, 'quranVerseTranslation', defaults.quranVerseTranslation),
    quranVerseReference: valueOrDefault_(source, 'quranVerseReference', defaults.quranVerseReference),
    hadithText: valueOrDefault_(source, 'hadithText', defaults.hadithText),
    hadithReference: valueOrDefault_(source, 'hadithReference', defaults.hadithReference),
    marriageDoaText: valueOrDefault_(source, 'marriageDoaText', defaults.marriageDoaText),
    marriageDoaReference: valueOrDefault_(source, 'marriageDoaReference', defaults.marriageDoaReference),
    loveStoryPhotos: normalizePhotoList_(source.loveStoryPhotos, defaults.loveStoryPhotos),
    galleryPhotos: normalizePhotoList_(source.galleryPhotos, defaults.galleryPhotos)
  };
}

function normalizePhotoList_(input, fallback) {
  if (input === undefined || input === null) {
    return fallback;
  }

  if (typeof input === 'string') {
    const parsed = input
      .split(/[,\n|]+/)
      .map(function(item) { return sanitize(item); })
      .filter(function(item) { return !!item; });
    return parsed;
  }

  if (!Array.isArray(input)) {
    return fallback;
  }

  const cleaned = input.map(function(item) { return sanitize(item); }).filter(function(item) { return !!item; });
  return cleaned;
}

function valueOrDefault_(obj, key, fallback) {
  if (!obj || typeof obj !== 'object' || !Object.prototype.hasOwnProperty.call(obj, key)) {
    return fallback;
  }

  const value = obj[key];
  if (value === undefined || value === null) {
    return fallback;
  }

  return sanitize(value);
}

function defaultConfig_() {
  return {
    brandInitials: 'A & F',
    heroOverline: 'Wedding Invitation',
    brideShortName: 'Alya',
    groomShortName: 'Fajar',
    brideFullName: 'Alya Putri Ramadhani',
    groomFullName: 'Fajar Maulana Pratama',
    brideParents: 'Putri dari Bapak Ahmad & Ibu Nurhayati',
    groomParents: 'Putra dari Bapak Hadi & Ibu Siti Aminah',
    heroDatePlace: 'Minggu, 20 Desember 2026 • Surabaya',
    heroBackgroundPhoto: 'assets/photos/foto-1.svg',
    footerNames: 'Alya & Fajar',
    weddingDateISO: '2026-12-20T08:00:00+07:00',
    quranVerseArabic: '&#x648;&#x64E;&#x645;&#x650;&#x646;&#x652; &#x622;&#x64A;&#x64E;&#x627;&#x62A;&#x650;&#x647;&#x650; &#x623;&#x64E;&#x646;&#x652; &#x62E;&#x64E;&#x644;&#x64E;&#x642;&#x64E; &#x644;&#x64E;&#x643;&#x64F;&#x645;&#x652; &#x645;&#x650;&#x646;&#x652; &#x623;&#x64E;&#x646;&#x652;&#x641;&#x64F;&#x633;&#x650;&#x643;&#x64F;&#x645;&#x652; &#x623;&#x64E;&#x632;&#x652;&#x648;&#x64E;&#x627;&#x62C;&#x64B;&#x627; &#x644;&#x650;&#x62A;&#x64E;&#x633;&#x652;&#x643;&#x64F;&#x646;&#x64F;&#x648;&#x627; &#x625;&#x650;&#x644;&#x64E;&#x64A;&#x652;&#x647;&#x64E;&#x627; &#x648;&#x64E;&#x62C;&#x64E;&#x639;&#x64E;&#x644;&#x64E; &#x628;&#x64E;&#x64A;&#x652;&#x646;&#x64E;&#x643;&#x64F;&#x645;&#x652; &#x645;&#x64E;&#x648;&#x64E;&#x62F;&#x64E;&#x651;&#x629;&#x64B; &#x648;&#x64E;&#x631;&#x64E;&#x62D;&#x652;&#x645;&#x64E;&#x629;&#x64B;',
    quranVerseTranslation: 'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.',
    quranVerseReference: 'QS. Ar-Rum: 21',
    hadithText: '"Sebaik-baik kalian adalah yang paling baik kepada istrinya, dan aku adalah yang paling baik kepada istriku."',
    hadithReference: 'HR. Tirmidzi',
    marriageDoaText: '"Barakallahu laka, wa baraka \'alaika, wa jama\'a bainakuma fii khair."',
    marriageDoaReference: 'Semoga Allah memberkahimu, memberkahi atasmu, dan mengumpulkan kalian berdua dalam kebaikan.',
    backgroundMusicUrl: 'assets/music/akad-payung-teduh.mp3',
    musicStartSec: '',
    musicLoopStartSec: '',
    musicLoopEndSec: '',
    akad: {
      date: 'Minggu, 20 Desember 2026',
      time: '08.00 WIB',
      venue: 'Masjid Al-Ikhlas, Surabaya',
      mapUrl: 'https://maps.google.com'
    },
    resepsi: {
      date: 'Minggu, 20 Desember 2026',
      time: '11.00 - 14.00 WIB',
      venue: 'Graha Puspita, Surabaya',
      mapUrl: 'https://maps.google.com'
    },
    loveStoryPhotos: [
      'assets/photos/foto-1.svg',
      'assets/photos/foto-2.svg',
      'assets/photos/foto-3.svg'
    ],
    galleryPhotos: [
      'assets/photos/foto-1.svg',
      'assets/photos/foto-2.svg',
      'assets/photos/foto-3.svg',
      'assets/photos/foto-4.svg',
      'assets/photos/foto-5.svg',
      'assets/photos/foto-6.svg'
    ]
  };
}

function getOrCreateRsvpSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(RSVP_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(RSVP_SHEET_NAME);
    sheet.appendRow(['Waktu', 'Nama', 'Jumlah', 'Kehadiran', 'Ucapan']);
    sheet.getRange('A1:E1').setFontWeight('bold');
  }

  return sheet;
}

function getOrCreateConfigSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG_SHEET_NAME);
    sheet.getRange(1, 1, 1, CONFIG_COLUMNS.length).setValues([CONFIG_COLUMNS]);
    sheet.getRange(1, 1, 1, CONFIG_COLUMNS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return sheet;
  }

  const headerValues = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 2)).getValues()[0];
  const hasLegacyHeader = sanitize(headerValues[0]) === 'Key' && sanitize(headerValues[1]) === 'Value';

  if (!hasLegacyHeader) {
    const isHeaderAligned = CONFIG_COLUMNS.every(function(columnName, idx) {
      return sanitize(headerValues[idx]) === columnName;
    });

    if (!isHeaderAligned) {
      sheet.getRange(1, 1, 1, CONFIG_COLUMNS.length).setValues([CONFIG_COLUMNS]);
      sheet.getRange(1, 1, 1, CONFIG_COLUMNS.length).setFontWeight('bold');
    }
  }

  sheet.setFrozenRows(1);
  return sheet;
}

function getOrCreateGuestsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(GUESTS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(GUESTS_SHEET_NAME);
    sheet.appendRow(['Waktu', 'Kode', 'Nama']);
    sheet.getRange('A1:C1').setFontWeight('bold');
  }

  return sheet;
}

function configToRow_(config) {
  return [
    config.brandInitials,
    config.heroOverline,
    config.brideShortName,
    config.groomShortName,
    config.brideFullName,
    config.groomFullName,
    config.brideParents,
    config.groomParents,
    config.heroDatePlace,
    config.heroBackgroundPhoto,
    config.footerNames,
    config.weddingDateISO,
    config.backgroundMusicUrl,
    config.musicStartSec,
    config.musicLoopStartSec,
    config.musicLoopEndSec,
    config.akad.date,
    config.akad.time,
    config.akad.venue,
    config.akad.mapUrl,
    config.resepsi.date,
    config.resepsi.time,
    config.resepsi.venue,
    config.resepsi.mapUrl,
    config.quranVerseArabic,
    config.quranVerseTranslation,
    config.quranVerseReference,
    config.hadithText,
    config.hadithReference,
    config.marriageDoaText,
    config.marriageDoaReference,
    (config.loveStoryPhotos || []).join('|'),
    (config.galleryPhotos || []).join('|')
  ];
}

function rowToConfig_(headers, row) {
  const values = {};
  headers.forEach(function(header, index) {
    if (!header) return;
    values[header] = sanitize(row[index]);
  });

  return {
    brandInitials: values.brandInitials,
    heroOverline: values.heroOverline,
    brideShortName: values.brideShortName,
    groomShortName: values.groomShortName,
    brideFullName: values.brideFullName,
    groomFullName: values.groomFullName,
    brideParents: values.brideParents,
    groomParents: values.groomParents,
    heroDatePlace: values.heroDatePlace,
    heroBackgroundPhoto: values.heroBackgroundPhoto,
    footerNames: values.footerNames,
    weddingDateISO: values.weddingDateISO,
    backgroundMusicUrl: values.backgroundMusicUrl,
    musicStartSec: values.musicStartSec,
    musicLoopStartSec: values.musicLoopStartSec,
    musicLoopEndSec: values.musicLoopEndSec,
    akadDate: values.akadDate,
    akadTime: values.akadTime,
    akadVenue: values.akadVenue,
    akadMapUrl: values.akadMapUrl,
    resepsiDate: values.resepsiDate,
    resepsiTime: values.resepsiTime,
    resepsiVenue: values.resepsiVenue,
    resepsiMapUrl: values.resepsiMapUrl,
    quranVerseArabic: values.quranVerseArabic,
    quranVerseTranslation: values.quranVerseTranslation,
    quranVerseReference: values.quranVerseReference,
    hadithText: values.hadithText,
    hadithReference: values.hadithReference,
    marriageDoaText: values.marriageDoaText,
    marriageDoaReference: values.marriageDoaReference,
    loveStoryPhotos: values.loveStoryPhotos,
    galleryPhotos: values.galleryPhotos
  };
}

function migrateConfigSheet_(sheet, config) {
  sheet.clear();
  sheet.getRange(1, 1, 1, CONFIG_COLUMNS.length).setValues([CONFIG_COLUMNS]);
  sheet.getRange(1, 1, 1, CONFIG_COLUMNS.length).setFontWeight('bold');
  sheet.getRange(2, 1, 1, CONFIG_COLUMNS.length).setValues([configToRow_(config)]);
  sheet.setFrozenRows(1);
}

function assertAdmin_(adminKey) {
  const configuredKey = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!configuredKey) {
    throw new Error('ADMIN_KEY belum diset di Script Properties');
  }

  if (sanitize(adminKey) !== sanitize(configuredKey)) {
    throw new Error('Admin key tidak valid');
  }
}

function sanitize(value) {
  return String(value || '').trim();
}

function jsonResponse(obj) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
