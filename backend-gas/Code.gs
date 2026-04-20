const RSVP_SHEET_NAME = 'RSVP';
const RSVP_COLUMNS = ['Waktu', 'Nama', 'Jumlah', 'Kehadiran', 'Ucapan', 'Kode Tamu'];
const CONFIG_SHEET_NAME = 'Config';
const GUESTS_SHEET_NAME = 'Guests';
const GUEST_COLUMNS = ['Waktu', 'Kode', 'Nama', 'Group', 'InviteType', 'Status', 'Phone', 'Notes', 'UpdatedAt'];
const CONFIG_COLUMNS = [
  'invitationBaseUrl',
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
  'eventStartISO',
  'backgroundMusicUrl',
  'musicPlaybackMode',
  'musicPlaylist',
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
  'story1Date',
  'story1Title',
  'story1Desc',
  'story2Date',
  'story2Title',
  'story2Desc',
  'story3Date',
  'story3Title',
  'story3Desc',
  'loveStoryPhotos',
  'galleryPhotos',
  'galleryMode',
  'galleryMaxItems',
  'galleryAutoplaySec',
  'galleryStyle',
  'galleryPhotoFocus',
  'giftEnabled',
  'giftSectionTitle',
  'giftSectionSubtitle',
  'giftAccounts',
  'seoTitle',
  'seoDescription',
  'themeName'
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
      return listGuests_(data || {});
    }

    if (action === 'updateGuest') {
      assertAdmin_(data.adminKey);
      return updateGuest_(data.code, data);
    }

    if (action === 'deleteGuest') {
      assertAdmin_(data.adminKey);
      return deleteGuest_(data.code);
    }

    if (action === 'uploadPhotos') {
      assertAdmin_(data.adminKey);
      return uploadPhotos_(data.files || []);
    }

    if (action === 'uploadMusic') {
      assertAdmin_(data.adminKey);
      return uploadMusic_(data.file || null);
    }

    if (action === 'listMusicLibrary') {
      assertAdmin_(data.adminKey);
      return listMusicLibrary_();
    }

    if (action === 'deletePhotos') {
      assertAdmin_(data.adminKey);
      return deletePhotos_(data.urls || []);
    }

    if (action === 'listRsvps') {
      assertAdmin_(data.adminKey);
      return listRsvps_(data || {});
    }

    if (action === 'deleteRsvp') {
      assertAdmin_(data.adminKey);
      return deleteRsvp_(data.rowNumber);
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
  const guestCode = sanitize(data.guestCode || data.kodeTamu || data.guest || '');
  const inviteType = normalizeInviteType_(data.inviteType);
  const guestLabel = sanitize(data.guestLabel || data.to || '');

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
  const rowValues = [
    new Date(),
    nama,
    jumlah,
    kehadiran,
    ucapan,
    guestCode
  ];

  const existingRow = guestCode && inviteType !== 'group' ? findRsvpRowByGuestCode_(sheet, guestCode) : 0;
  if (existingRow) {
    sheet.getRange(existingRow, 1, 1, RSVP_COLUMNS.length).setValues([rowValues]);
    return jsonResponse({ success: true, message: 'RSVP tamu berhasil diperbarui', updated: true });
  }

  sheet.appendRow(rowValues);

  return jsonResponse({
    success: true,
    message: inviteType === 'group'
      ? ('RSVP grup untuk ' + (guestLabel || 'undangan ini') + ' berhasil ditambahkan')
      : 'RSVP tersimpan'
  });
}

function listWishes_(params) {
  const limit = Math.min(Math.max(Number(sanitize(params && params.limit)) || 8, 1), 24);
  const sheet = getOrCreateRsvpSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return jsonResponse({ success: true, wishes: [] });
  }

  const values = sheet.getRange(2, 1, lastRow - 1, RSVP_COLUMNS.length).getValues();
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
      ucapan: ucapan,
      guestCode: sanitize(row[5] || '')
    });

    if (wishes.length >= limit) {
      break;
    }
  }

  return jsonResponse({ success: true, wishes: wishes });
}

function listRsvps_(payload) {
  const sheet = getOrCreateRsvpSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return jsonResponse({
      success: true,
      rsvps: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1
    });
  }

  const search = sanitize(payload.search).toLowerCase();
  const kehadiran = sanitize(payload.kehadiran).toLowerCase();
  const pageSize = Math.min(Math.max(Number(payload.pageSize) || 20, 5), 100);
  const page = Math.max(Number(payload.page) || 1, 1);

  const values = sheet.getRange(2, 1, lastRow - 1, RSVP_COLUMNS.length).getValues();
  const guestMap = createGuestLookupMap_();
  const rows = values.map(function(row, index) {
    const guestCode = sanitize(row[5] || '');
    const linkedGuest = guestCode ? guestMap[guestCode] : null;
    return {
      rowNumber: index + 2,
      waktu: row[0],
      nama: sanitize(row[1]),
      jumlah: Number(row[2] || 0),
      kehadiran: sanitize(row[3]),
      ucapan: sanitize(row[4]),
      guestCode: guestCode,
      guestGroup: linkedGuest ? linkedGuest.group : '',
      guestStatus: linkedGuest ? linkedGuest.status : '',
      inviteType: linkedGuest ? linkedGuest.inviteType : 'personal'
    };
  });

  const filtered = rows.filter(function(item) {
    const matchesSearch = !search || (
      item.nama.toLowerCase().indexOf(search) >= 0 ||
      item.guestCode.toLowerCase().indexOf(search) >= 0 ||
      item.guestGroup.toLowerCase().indexOf(search) >= 0 ||
      item.ucapan.toLowerCase().indexOf(search) >= 0
    );
    const matchesKehadiran = !kehadiran || kehadiran === 'all' || item.kehadiran.toLowerCase() === kehadiran;
    return matchesSearch && matchesKehadiran;
  });

  filtered.sort(function(a, b) {
    return b.rowNumber - a.rowNumber;
  });

  const total = filtered.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;
  const rsvps = filtered.slice(offset, offset + pageSize);

  return jsonResponse({
    success: true,
    rsvps: rsvps,
    total: total,
    page: safePage,
    pageSize: pageSize,
    totalPages: totalPages
  });
}

function deleteRsvp_(rowNumber) {
  const targetRow = Number(rowNumber || 0);
  if (!Number.isFinite(targetRow) || targetRow < 2) {
    return jsonResponse({ success: false, message: 'Row RSVP tidak valid' });
  }

  const sheet = getOrCreateRsvpSheet_();
  const lastRow = sheet.getLastRow();
  if (targetRow > lastRow) {
    return jsonResponse({ success: false, message: 'Data RSVP tidak ditemukan' });
  }

  sheet.deleteRow(targetRow);
  return jsonResponse({ success: true, message: 'RSVP berhasil dihapus' });
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
  const guestItems = normalizeGuestItems_(guests);
  if (!guestItems.length) {
    return jsonResponse({ success: false, message: 'Daftar tamu kosong' });
  }

  const sheet = getOrCreateGuestsSheet_();
  const existing = listGuestRows_(sheet);
  const existingKeys = {};
  existing.forEach(function(item) {
    existingKeys[(item.name + '|' + item.phone).toLowerCase()] = true;
  });

  const inserted = [];
  guestItems.forEach(function(item) {
    const key = (item.name + '|' + item.phone).toLowerCase();
    if (existingKeys[key]) return;

    const code = Utilities.getUuid().slice(0, 8);
    sheet.appendRow([
      new Date(),
      code,
      item.name,
      item.group,
      item.inviteType,
      item.status,
      item.phone,
      item.notes,
      new Date()
    ]);
    existingKeys[key] = true;
    inserted.push({
      code: code,
      name: item.name,
      group: item.group,
      inviteType: item.inviteType,
      status: item.status,
      phone: item.phone,
      notes: item.notes
    });
  });

  return jsonResponse({
    success: true,
    message: inserted.length + ' tamu berhasil diimport',
    importedCount: inserted.length,
    totalGuests: Object.keys(existingKeys).length,
    guests: inserted
  });
}

function listGuests_(payload) {
  const sheet = getOrCreateGuestsSheet_();
  const rows = listGuestRows_(sheet);

  const search = sanitize(payload.search).toLowerCase();
  const group = sanitize(payload.group).toLowerCase();
  const status = sanitize(payload.status).toLowerCase();
  const pageSize = Math.min(Math.max(Number(payload.pageSize) || 20, 5), 100);
  const page = Math.max(Number(payload.page) || 1, 1);

  const filtered = rows.filter(function(item) {
    const matchesSearch = !search || (
      item.name.toLowerCase().indexOf(search) >= 0 ||
      item.code.toLowerCase().indexOf(search) >= 0 ||
      item.phone.toLowerCase().indexOf(search) >= 0
    );
    const matchesGroup = !group || group === 'all' || item.group.toLowerCase() === group;
    const matchesStatus = !status || status === 'all' || item.status.toLowerCase() === status;
    return matchesSearch && matchesGroup && matchesStatus;
  });

  const total = filtered.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;
  const guests = filtered.slice(offset, offset + pageSize);

  const groups = uniqueValues_(rows.map(function(item) { return item.group; }));
  const statuses = uniqueValues_(rows.map(function(item) { return item.status; }));
  const inviteTypes = uniqueValues_(rows.map(function(item) { return item.inviteType; }));

  return jsonResponse({
    success: true,
    guests: guests,
    total: total,
    page: safePage,
    pageSize: pageSize,
    totalPages: totalPages,
    groups: groups,
    statuses: statuses,
    inviteTypes: inviteTypes
  });
}

function updateGuest_(code, payload) {
  const guestCode = sanitize(code);
  const guestName = sanitize(payload && payload.name);
  const guestGroup = normalizeGuestGroup_(payload && payload.group);
  const guestInviteType = normalizeInviteType_(payload && payload.inviteType);
  const guestStatus = normalizeGuestStatus_(payload && payload.status);
  const guestPhone = sanitize(payload && payload.phone);
  const guestNotes = sanitize(payload && payload.notes);

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

  const values = sheet.getRange(rowIndex, 1, 1, GUEST_COLUMNS.length).getValues()[0];
  values[2] = guestName;
  values[3] = guestGroup;
  values[4] = guestInviteType;
  values[5] = guestStatus;
  values[6] = guestPhone;
  values[7] = guestNotes;
  values[8] = new Date();
  sheet.getRange(rowIndex, 1, 1, GUEST_COLUMNS.length).setValues([values]);
  return jsonResponse({ success: true, message: 'Data tamu diperbarui' });
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

    var fileId = driveFile.getId();
    var resourceKey = '';
    try {
      resourceKey = sanitize(driveFile.getResourceKey());
    } catch (error) {
      resourceKey = '';
    }
    var resourceKeyParam = resourceKey ? ('&resourcekey=' + encodeURIComponent(resourceKey)) : '';

    uploaded.push({
      id: fileId,
      name: driveFile.getName(),
      webUrl: driveFile.getUrl(),
      publicUrl: 'https://drive.google.com/uc?export=view&id=' + fileId + resourceKeyParam,
      downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId + resourceKeyParam,
      audioStreamUrl: 'https://docs.google.com/uc?export=download&id=' + fileId + resourceKeyParam,
      resourceKey: resourceKey
    });
  });

  return jsonResponse({ success: true, files: uploaded });
}

function uploadMusic_(file) {
  if (!file || typeof file !== 'object') {
    return jsonResponse({ success: false, message: 'File musik kosong' });
  }

  const name = sanitize(file.name) || 'music.mp3';
  const mimeType = sanitize(file.mimeType) || 'audio/mpeg';
  const contentBase64 = sanitize(file.contentBase64);

  if (!contentBase64) {
    return jsonResponse({ success: false, message: 'Konten file musik kosong' });
  }

  if (mimeType.indexOf('audio/') !== 0) {
    return jsonResponse({ success: false, message: 'Format file harus audio' });
  }

  const folderId = sanitize(PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID'));
  let folder = null;
  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (error) {
      throw new Error('DRIVE_FOLDER_ID tidak valid');
    }
  }

  const bytes = Utilities.base64Decode(contentBase64);
  const blob = Utilities.newBlob(bytes, mimeType, name);
  const driveFile = folder ? folder.createFile(blob) : DriveApp.createFile(blob);
  driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileId = driveFile.getId();
  var resourceKey = '';
  try {
    resourceKey = sanitize(driveFile.getResourceKey());
  } catch (error) {
    resourceKey = '';
  }
  var resourceKeyParam = resourceKey ? ('&resourcekey=' + encodeURIComponent(resourceKey)) : '';

  return jsonResponse({
    success: true,
    file: buildMusicFileMeta_(driveFile, resourceKey)
  });
}

function listMusicLibrary_() {
  const folderId = sanitize(PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID'));
  if (!folderId) {
    return jsonResponse({ success: true, files: [] });
  }

  let folder = null;
  try {
    folder = DriveApp.getFolderById(folderId);
  } catch (error) {
    throw new Error('DRIVE_FOLDER_ID tidak valid');
  }

  const files = [];
  const iterator = folder.getFiles();
  while (iterator.hasNext()) {
    const driveFile = iterator.next();
    const mimeType = sanitize(driveFile.getMimeType()).toLowerCase();
    if (mimeType.indexOf('audio/') !== 0) continue;

    var resourceKey = '';
    try {
      resourceKey = sanitize(driveFile.getResourceKey());
    } catch (error) {
      resourceKey = '';
    }
    files.push(buildMusicFileMeta_(driveFile, resourceKey));
  }

  files.sort(function(a, b) {
    return String(b.createdTime || '').localeCompare(String(a.createdTime || ''));
  });

  return jsonResponse({ success: true, files: files });
}

function buildMusicFileMeta_(driveFile, resourceKey) {
  var fileId = driveFile.getId();
  var resourceKeyParam = resourceKey ? ('&resourcekey=' + encodeURIComponent(resourceKey)) : '';
  return {
    id: fileId,
    name: driveFile.getName(),
    webUrl: driveFile.getUrl(),
    publicUrl: 'https://drive.google.com/uc?export=view&id=' + fileId + resourceKeyParam,
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId + resourceKeyParam,
    audioStreamUrl: 'https://docs.google.com/uc?export=download&id=' + fileId + resourceKeyParam,
    resourceKey: resourceKey,
    mimeType: sanitize(driveFile.getMimeType()),
    createdTime: driveFile.getDateCreated() ? driveFile.getDateCreated().toISOString() : '',
    updatedTime: driveFile.getLastUpdated() ? driveFile.getLastUpdated().toISOString() : ''
  };
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

  const values = sheet.getRange(2, 1, lastRow - 1, GUEST_COLUMNS.length).getValues();
  return values
    .filter(function(row) { return sanitize(row[2]); })
    .map(function(row) {
      return {
        createdAt: row[0],
        code: sanitize(row[1]),
        name: sanitize(row[2]),
        group: normalizeGuestGroup_(row[3]),
        inviteType: normalizeInviteType_(row[4]),
        status: normalizeGuestStatus_(row[5]),
        phone: sanitize(row[6]),
        notes: sanitize(row[7]),
        updatedAt: row[8] || ''
      };
    });
}

function createGuestLookupMap_() {
  const rows = listGuestRows_(getOrCreateGuestsSheet_());
  const map = {};
  rows.forEach(function(item) {
    if (!item.code) return;
    map[item.code] = item;
  });
  return map;
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

function findRsvpRowByGuestCode_(sheet, code) {
  const guestCode = sanitize(code);
  const lastRow = sheet.getLastRow();
  if (!guestCode || lastRow < 2) return 0;

  const codeValues = sheet.getRange(2, 6, lastRow - 1, 1).getValues();
  for (var i = 0; i < codeValues.length; i += 1) {
    if (sanitize(codeValues[i][0]) === guestCode) {
      return i + 2;
    }
  }

  return 0;
}

function normalizeGuestItems_(guests) {
  if (!Array.isArray(guests)) return [];

  const map = {};
  const result = [];

  guests.forEach(function(item) {
    var payload = {};
    if (typeof item === 'object' && item) {
      payload = item;
    } else {
      const raw = sanitize(item);
      if (!raw) return;
      const parts = raw.split('|').map(function(v) { return sanitize(v); });
      payload = {
        name: parts[0],
        group: parts[1] || 'Umum',
        phone: parts[2] || '',
        inviteType: parts[3] || 'personal',
        notes: parts[4] || '',
        status: 'active'
      };
    }

    const name = sanitize(payload.name);
    if (!name) return;
    const phone = sanitize(payload.phone);
    const key = (name + '|' + phone).toLowerCase();
    if (map[key]) return;
    map[key] = true;
    result.push({
      name: name,
      group: normalizeGuestGroup_(payload.group),
      inviteType: normalizeInviteType_(payload.inviteType),
      status: normalizeGuestStatus_(payload.status),
      phone: phone,
      notes: sanitize(payload.notes)
    });
  });

  return result;
}

function normalizeGuestGroup_(value) {
  return sanitize(value) || 'Umum';
}

function normalizeInviteType_(value) {
  return sanitize(value).toLowerCase() === 'group' ? 'group' : 'personal';
}

function normalizeGuestStatus_(value) {
  const clean = sanitize(value).toLowerCase();
  if (clean === 'vip') return 'vip';
  if (clean === 'disabled') return 'disabled';
  return 'active';
}

function uniqueValues_(values) {
  const map = {};
  const result = [];
  values.forEach(function(value) {
    const clean = sanitize(value);
    if (!clean) return;
    const key = clean.toLowerCase();
    if (map[key]) return;
    map[key] = true;
    result.push(clean);
  });
  return result.sort();
}

function normalizeConfig_(config) {
  const defaults = defaultConfig_();
  const source = (config && typeof config === 'object') ? config : {};
  const akadSource = (source.akad && typeof source.akad === 'object') ? source.akad : {};
  const resepsiSource = (source.resepsi && typeof source.resepsi === 'object') ? source.resepsi : {};

  return {
    invitationBaseUrl: valueOrDefault_(source, 'invitationBaseUrl', defaults.invitationBaseUrl),
    themeName: normalizeThemeName_(valueOrDefault_(source, 'themeName', defaults.themeName)),
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
    eventStartISO: valueOrDefault_(source, 'eventStartISO', defaults.eventStartISO),
    backgroundMusicUrl: valueOrDefault_(source, 'backgroundMusicUrl', defaults.backgroundMusicUrl),
    musicPlaybackMode: normalizeMusicPlaybackMode_(valueOrDefault_(source, 'musicPlaybackMode', defaults.musicPlaybackMode)),
    musicPlaylist: normalizeMusicPlaylist_(source.musicPlaylist, defaults.musicPlaylist, defaults.backgroundMusicUrl, source.backgroundMusicUrl),
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
    quranVerseArabic: valueOrDefaultNonEmpty_(source, 'quranVerseArabic', defaults.quranVerseArabic),
    quranVerseTranslation: valueOrDefaultNonEmpty_(source, 'quranVerseTranslation', defaults.quranVerseTranslation),
    quranVerseReference: valueOrDefaultNonEmpty_(source, 'quranVerseReference', defaults.quranVerseReference),
    hadithText: valueOrDefaultNonEmpty_(source, 'hadithText', defaults.hadithText),
    hadithReference: valueOrDefaultNonEmpty_(source, 'hadithReference', defaults.hadithReference),
    marriageDoaText: valueOrDefaultNonEmpty_(source, 'marriageDoaText', defaults.marriageDoaText),
    marriageDoaReference: valueOrDefaultNonEmpty_(source, 'marriageDoaReference', defaults.marriageDoaReference),
    loveStoryItems: normalizeLoveStoryItems_(source, defaults),
    loveStoryPhotos: normalizePhotoList_(source.loveStoryPhotos, defaults.loveStoryPhotos),
    galleryPhotos: normalizePhotoList_(source.galleryPhotos, defaults.galleryPhotos),
    galleryMode: normalizeGalleryMode_(valueOrDefault_(source, 'galleryMode', defaults.galleryMode)),
    galleryMaxItems: normalizeGalleryMaxItems_(valueOrDefault_(source, 'galleryMaxItems', defaults.galleryMaxItems)),
    galleryAutoplaySec: normalizeGalleryAutoplaySec_(valueOrDefault_(source, 'galleryAutoplaySec', defaults.galleryAutoplaySec)),
    galleryStyle: normalizeGalleryStyle_(valueOrDefault_(source, 'galleryStyle', defaults.galleryStyle)),
    galleryPhotoFocus: normalizeGalleryPhotoFocus_(source.galleryPhotoFocus, defaults.galleryPhotoFocus),
    giftEnabled: normalizeBoolean_(valueOrDefault_(source, 'giftEnabled', defaults.giftEnabled)),
    giftSectionTitle: valueOrDefault_(source, 'giftSectionTitle', defaults.giftSectionTitle),
    giftSectionSubtitle: valueOrDefault_(source, 'giftSectionSubtitle', defaults.giftSectionSubtitle),
    giftAccounts: normalizeGiftAccounts_(source.giftAccounts, defaults.giftAccounts),
    seoTitle: valueOrDefault_(source, 'seoTitle', defaults.seoTitle),
    seoDescription: valueOrDefault_(source, 'seoDescription', defaults.seoDescription)
  };
}

function normalizeGalleryMode_(value) {
  var clean = sanitize(value).toLowerCase();
  return clean === 'carousel' ? 'carousel' : 'grid';
}

function normalizeGalleryStyle_(value) {
  var clean = sanitize(value).toLowerCase();
  if (clean === 'soft' || clean === 'polaroid' || clean === 'clean') return clean;
  return 'elegant';
}

function normalizeThemeName_(value) {
  var clean = sanitize(value).toLowerCase();
  if (clean === 'rose' || clean === 'royal' || clean === 'minimal') return clean;
  return 'botanical';
}

function normalizeGalleryMaxItems_(value) {
  var clean = sanitize(value);
  if (!clean) return '';
  var num = Number(clean);
  if (!isFinite(num) || num < 0) return '';
  return String(Math.floor(num));
}

function normalizeGalleryAutoplaySec_(value) {
  var clean = sanitize(value);
  if (!clean) return '';
  var num = Number(clean);
  if (!isFinite(num) || num <= 0) return '';
  return String(num);
}

function normalizeMusicPlaybackMode_(value) {
  var clean = sanitize(value).toLowerCase();
  return clean === 'shuffle' ? 'shuffle' : 'ordered';
}

function normalizeMusicPlaylist_(input, fallback, fallbackUrl, legacyUrl) {
  var source = input;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch (error) {
      source = [];
    }
  }

  if (!Array.isArray(source) || !source.length) {
    source = Array.isArray(fallback) ? fallback : [];
  }

  var normalized = source.map(function(item, index) {
    var track = (item && typeof item === 'object') ? item : {};
    var id = sanitize(track.id || track.fileId || ('track-' + (index + 1)));
    var url = sanitize(track.url || track.audioStreamUrl || track.downloadUrl || track.publicUrl || '');
    var title = sanitize(track.title || track.name || ('Track ' + (index + 1)));
    return {
      id: id,
      title: title,
      url: url,
      isActive: track.isActive === undefined ? true : normalizeBoolean_(track.isActive)
    };
  }).filter(function(item) {
    return item.url;
  });

  if (!normalized.length) {
    var fallbackTrackUrl = sanitize(legacyUrl) || sanitize(fallbackUrl);
    if (fallbackTrackUrl) {
      normalized.push({
        id: 'legacy-track-1',
        title: 'Musik Utama',
        url: fallbackTrackUrl,
        isActive: true
      });
    }
  }

  return normalized;
}

function normalizeGalleryPhotoFocus_(input, fallback) {
  var source = input;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch (error) {
      source = {};
    }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    source = {};
  }

  var normalized = {};
  Object.keys(source).forEach(function(rawKey) {
    var key = sanitize(rawKey);
    if (!key) return;
    var item = source[rawKey];
    if (!item || typeof item !== 'object') return;

    var xNum = Number(item.x);
    var yNum = Number(item.y);
    var x = (isFinite(xNum) ? Math.max(0, Math.min(100, xNum)) : 50);
    var y = (isFinite(yNum) ? Math.max(0, Math.min(100, yNum)) : 50);
    if (x === 50 && y === 50) return;
    normalized[key] = { x: x, y: y };
  });

  if (Object.keys(normalized).length) return normalized;
  if (fallback && typeof fallback === 'object' && !Array.isArray(fallback)) return fallback;
  return {};
}

function normalizeBoolean_(value) {
  if (typeof value === 'boolean') return value;
  var text = sanitize(value).toLowerCase();
  if (!text) return false;
  return text === '1' || text === 'true' || text === 'yes' || text === 'y' || text === 'on';
}

function normalizeGiftAccounts_(input, fallback) {
  var source = input;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch (error) {
      source = [];
    }
  }
  if (!Array.isArray(source)) {
    source = Array.isArray(fallback) ? fallback : [];
  }

  return source.map(function(item) {
    var providerCode = sanitize(item && (item.providerCode || item.bankCode)).toLowerCase();
    var providerName = sanitize(item && (item.providerName || item.bankName));
    var type = normalizeGiftType_(item && (item.type || item.category), providerCode, providerName);
    return {
      type: type,
      category: type,
      providerCode: providerCode,
      providerName: providerName,
      bankCode: providerCode,
      bankName: providerName,
      accountNumber: sanitize(item && item.accountNumber).replace(/\D+/g, ''),
      accountHolder: sanitize(item && item.accountHolder),
      logoUrl: sanitize(item && item.logoUrl),
      isActive: normalizeBoolean_(item && item.isActive)
    };
  }).filter(function(item) {
    return item.accountNumber;
  });
}

function normalizeGiftType_(value, providerCode, providerName) {
  var explicit = sanitize(value).toLowerCase();
  var source = (sanitize(providerCode) + ' ' + sanitize(providerName)).toLowerCase();
  var ewalletKeywords = ['dana', 'ovo', 'gopay', 'go-pay', 'shopeepay', 'shopee pay', 'linkaja', 'link aja', 'sakuku'];
  for (var i = 0; i < ewalletKeywords.length; i += 1) {
    if (source.indexOf(ewalletKeywords[i]) !== -1) return 'ewallet';
  }
  return explicit === 'ewallet' ? 'ewallet' : 'bank';
}

function normalizeLoveStoryItems_(source, defaults) {
  var items = (source && source.loveStoryItems && Array.isArray(source.loveStoryItems))
    ? source.loveStoryItems
    : null;

  var fromColumns = [
    {
      date: valueOrDefault_(source, 'story1Date', defaults.loveStoryItems[0].date),
      title: valueOrDefault_(source, 'story1Title', defaults.loveStoryItems[0].title),
      description: valueOrDefault_(source, 'story1Desc', defaults.loveStoryItems[0].description)
    },
    {
      date: valueOrDefault_(source, 'story2Date', defaults.loveStoryItems[1].date),
      title: valueOrDefault_(source, 'story2Title', defaults.loveStoryItems[1].title),
      description: valueOrDefault_(source, 'story2Desc', defaults.loveStoryItems[1].description)
    },
    {
      date: valueOrDefault_(source, 'story3Date', defaults.loveStoryItems[2].date),
      title: valueOrDefault_(source, 'story3Title', defaults.loveStoryItems[2].title),
      description: valueOrDefault_(source, 'story3Desc', defaults.loveStoryItems[2].description)
    }
  ];

  var merged = items && items.length ? items : fromColumns;
  return [0, 1, 2].map(function(index) {
    var item = merged[index] || {};
    var fallback = defaults.loveStoryItems[index] || { date: '', title: '', description: '' };
    return {
      date: sanitize(item.date || fallback.date),
      title: sanitize(item.title || fallback.title),
      description: sanitize(item.description || fallback.description)
    };
  });
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

function valueOrDefaultNonEmpty_(obj, key, fallback) {
  var value = valueOrDefault_(obj, key, fallback);
  return sanitize(value) || sanitize(fallback);
}

function defaultConfig_() {
  return {
    invitationBaseUrl: 'https://username.github.io/nama-repo/',
    themeName: 'botanical',
    brandInitials: 'A & F',
    heroOverline: 'Wedding Invitation',
    brideShortName: 'Alya',
    groomShortName: 'Fajar',
    brideFullName: 'Alya Putri Ramadhani',
    groomFullName: 'Fajar Maulana Pratama',
    brideParents: 'Putri dari Bapak Ahmad & Ibu Nurhayati',
    groomParents: 'Putra dari Bapak Hadi & Ibu Siti Aminah',
    heroDatePlace: 'Minggu, 20 Desember 2026 � Surabaya',
    heroBackgroundPhoto: 'assets/photos/foto-1.svg',
    footerNames: 'Alya & Fajar',
    weddingDateISO: '2026-12-20T08:00:00+07:00',
    eventStartISO: '2026-12-20T08:00:00+07:00',
    quranVerseArabic: '&#x648;&#x64E;&#x645;&#x650;&#x646;&#x652; &#x622;&#x64A;&#x64E;&#x627;&#x62A;&#x650;&#x647;&#x650; &#x623;&#x64E;&#x646;&#x652; &#x62E;&#x64E;&#x644;&#x64E;&#x642;&#x64E; &#x644;&#x64E;&#x643;&#x64F;&#x645;&#x652; &#x645;&#x650;&#x646;&#x652; &#x623;&#x64E;&#x646;&#x652;&#x641;&#x64F;&#x633;&#x650;&#x643;&#x64F;&#x645;&#x652; &#x623;&#x64E;&#x632;&#x652;&#x648;&#x64E;&#x627;&#x62C;&#x64B;&#x627; &#x644;&#x650;&#x62A;&#x64E;&#x633;&#x652;&#x643;&#x64F;&#x646;&#x64F;&#x648;&#x627; &#x625;&#x650;&#x644;&#x64E;&#x64A;&#x652;&#x647;&#x64E;&#x627; &#x648;&#x64E;&#x62C;&#x64E;&#x639;&#x64E;&#x644;&#x64E; &#x628;&#x64E;&#x64A;&#x652;&#x646;&#x64E;&#x643;&#x64F;&#x645;&#x652; &#x645;&#x64E;&#x648;&#x64E;&#x62F;&#x64E;&#x651;&#x629;&#x64B; &#x648;&#x64E;&#x631;&#x64E;&#x62D;&#x652;&#x645;&#x64E;&#x629;&#x64B;',
    quranVerseTranslation: 'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.',
    quranVerseReference: 'QS. Ar-Rum: 21',
    hadithText: '"Sebaik-baik kalian adalah yang paling baik kepada istrinya, dan aku adalah yang paling baik kepada istriku."',
    hadithReference: 'HR. Tirmidzi',
    marriageDoaText: '"Barakallahu laka, wa baraka \'alaika, wa jama\'a bainakuma fii khair."',
    marriageDoaReference: 'Semoga Allah memberkahimu, memberkahi atasmu, dan mengumpulkan kalian berdua dalam kebaikan.',
    backgroundMusicUrl: 'assets/music/akad-payung-teduh.mp3',
    musicPlaybackMode: 'ordered',
    musicPlaylist: [
      {
        id: 'default-track-1',
        title: 'Akad Payung Teduh',
        url: 'assets/music/akad-payung-teduh.mp3',
        isActive: true
      }
    ],
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
    loveStoryItems: [
      {
        date: '2021',
        title: 'Pertama Bertemu',
        description: 'Kami bertemu dalam sebuah kegiatan komunitas dan mulai saling mengenal lebih dekat.'
      },
      {
        date: '2023',
        title: 'Lamaran',
        description: 'Dengan restu keluarga, kami melangkah ke tahap yang lebih serius untuk masa depan bersama.'
      },
      {
        date: '2026',
        title: 'Hari Pernikahan',
        description: 'InsyaAllah kami menyempurnakan separuh agama dan memulai perjalanan rumah tangga.'
      }
    ],
    galleryMode: 'grid',
    galleryMaxItems: '',
    galleryAutoplaySec: '3.5',
    galleryStyle: 'elegant',
    galleryPhotoFocus: {},
    giftEnabled: false,
    giftSectionTitle: 'Wedding Gift',
    giftSectionSubtitle: 'Doa restu Anda adalah hadiah terindah. Jika berkenan, Anda dapat mengirimkan tanda kasih melalui rekening berikut.',
    giftAccounts: [
      {
        bankCode: 'bca',
        bankName: 'BCA',
        accountNumber: '',
        accountHolder: '',
        logoUrl: 'https://logo.clearbit.com/bca.co.id',
        isActive: true
      }
    ],
    seoTitle: 'Undangan Pernikahan',
    seoDescription: 'Undangan pernikahan digital dengan RSVP online.',
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
    sheet.appendRow(RSVP_COLUMNS);
    sheet.getRange(1, 1, 1, RSVP_COLUMNS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return sheet;
  }

  const headerValues = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), RSVP_COLUMNS.length)).getValues()[0];
  const isHeaderAligned = RSVP_COLUMNS.every(function(columnName, idx) {
    return sanitize(headerValues[idx]) === columnName;
  });

  if (!isHeaderAligned) {
    sheet.getRange(1, 1, 1, RSVP_COLUMNS.length).setValues([RSVP_COLUMNS]);
    sheet.getRange(1, 1, 1, RSVP_COLUMNS.length).setFontWeight('bold');
  }

  sheet.setFrozenRows(1);

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
  }

  sheet.getRange(1, 1, 1, GUEST_COLUMNS.length).setValues([GUEST_COLUMNS]);
  sheet.getRange(1, 1, 1, GUEST_COLUMNS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  return sheet;
}

function configToRow_(config) {
  return [
    config.invitationBaseUrl,
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
    config.eventStartISO,
    config.backgroundMusicUrl,
    config.musicPlaybackMode,
    JSON.stringify(config.musicPlaylist || []),
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
    (config.loveStoryItems && config.loveStoryItems[0] && config.loveStoryItems[0].date) || '',
    (config.loveStoryItems && config.loveStoryItems[0] && config.loveStoryItems[0].title) || '',
    (config.loveStoryItems && config.loveStoryItems[0] && config.loveStoryItems[0].description) || '',
    (config.loveStoryItems && config.loveStoryItems[1] && config.loveStoryItems[1].date) || '',
    (config.loveStoryItems && config.loveStoryItems[1] && config.loveStoryItems[1].title) || '',
    (config.loveStoryItems && config.loveStoryItems[1] && config.loveStoryItems[1].description) || '',
    (config.loveStoryItems && config.loveStoryItems[2] && config.loveStoryItems[2].date) || '',
    (config.loveStoryItems && config.loveStoryItems[2] && config.loveStoryItems[2].title) || '',
    (config.loveStoryItems && config.loveStoryItems[2] && config.loveStoryItems[2].description) || '',
    (config.loveStoryPhotos || []).join('|'),
    (config.galleryPhotos || []).join('|'),
    config.galleryMode,
    config.galleryMaxItems,
    config.galleryAutoplaySec,
    config.galleryStyle,
    JSON.stringify(config.galleryPhotoFocus || {}),
    String(Boolean(config.giftEnabled)),
    config.giftSectionTitle,
    config.giftSectionSubtitle,
    JSON.stringify(config.giftAccounts || []),
    config.seoTitle,
    config.seoDescription,
    config.themeName
  ];
}

function rowToConfig_(headers, row) {
  const values = {};
  headers.forEach(function(header, index) {
    if (!header) return;
    values[header] = sanitize(row[index]);
  });

  return {
    invitationBaseUrl: values.invitationBaseUrl,
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
    eventStartISO: values.eventStartISO,
    backgroundMusicUrl: values.backgroundMusicUrl,
    musicPlaybackMode: values.musicPlaybackMode,
    musicPlaylist: values.musicPlaylist,
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
    story1Date: values.story1Date,
    story1Title: values.story1Title,
    story1Desc: values.story1Desc,
    story2Date: values.story2Date,
    story2Title: values.story2Title,
    story2Desc: values.story2Desc,
    story3Date: values.story3Date,
    story3Title: values.story3Title,
    story3Desc: values.story3Desc,
    loveStoryPhotos: values.loveStoryPhotos,
    galleryPhotos: values.galleryPhotos,
    galleryMode: values.galleryMode,
    galleryMaxItems: values.galleryMaxItems,
    galleryAutoplaySec: values.galleryAutoplaySec,
    galleryStyle: values.galleryStyle,
    galleryPhotoFocus: values.galleryPhotoFocus,
    giftEnabled: values.giftEnabled,
    giftSectionTitle: values.giftSectionTitle,
    giftSectionSubtitle: values.giftSectionSubtitle,
    giftAccounts: values.giftAccounts,
    seoTitle: values.seoTitle,
    seoDescription: values.seoDescription,
    themeName: values.themeName
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









