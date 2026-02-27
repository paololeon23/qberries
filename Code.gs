/**
 * Code.gs - Reporte de Actos y/o Condiciones Inseguras (QBerries)
 * Solo POST. Recibe JSON del formulario, escribe una fila en la hoja y guarda fotos en Drive.
 *
 * Desplegar como "Aplicación web": Ejecutar como "Yo", Quién tiene acceso "Cualquier usuario".
 * POST con Content-Type: application/json o text/plain; body = JSON.
 *
 * Columnas de la hoja (orden fijo):
 * código, versión, aprobación, origen, nombre_empresa, fecha, lugar_ocurrencia, nombre_persona,
 * seguridad_salud, medio_ambiente, causa,
 * descripcion_evento_texto, descripcion_evento_foto, accion_inmediata_texto, accion_inmediata_foto,
 * recomendacion_texto, recomendacion_foto, nombre_reportante,
 * fecha_hora_envio, estado
 */

var CONFIG = {
  MAX_BODY_LENGTH: 15000000,
  MAX_STRING_LENGTH: 5000,
  MAX_PHOTO_BASE64_LENGTH: 8000000,
  // Usar la primera hoja del libro (p. ej. "BERRIES"). Si quieres otra, pon su nombre: 'Reportes'
  SHEET_NAME: 'BERRIES',
  FOLDER_NAME: 'Reportes QBerries Fotos'
};

/** Encabezados de la hoja (celdas a llenar) */
var HEADERS = [
  'código', 'versión', 'aprobación', 'origen', 'nombre_empresa', 'fecha', 'lugar_ocurrencia', 'nombre_persona',
  'seguridad_salud', 'medio_ambiente', 'causa',
  'descripcion_evento_texto', 'descripcion_evento_foto',
  'accion_inmediata_texto', 'accion_inmediata_foto',
  'recomendacion_texto', 'recomendacion_foto',
  'nombre_reportante',
  'fecha_hora_envio', 'estado'
];

function doPost(e) {
  var output = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  try {
    if (!e || !e.postData || !e.postData.contents) {
      output.setContent(JSON.stringify({ ok: false, error: 'Sin datos POST' }));
      return output;
    }
    var data = JSON.parse(e.postData.contents);
    if (typeof data !== 'object' || data === null) {
      output.setContent(JSON.stringify({ ok: false, error: 'JSON inválido' }));
      return output;
    }
    var sheet = getOrCreateSheet();
    var isnInter = 'QB-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    var row = buildRow(data, isnInter);
    sheet.appendRow(row);
    output.setContent(JSON.stringify({ ok: true, message: 'Guardado correctamente' }));
    return output;
  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    output.setContent(JSON.stringify({ ok: false, error: err.toString() }));
    return output;
  }
}

/**
 * Construye la fila en el orden de HEADERS.
 * Fotos en base64 se guardan en Drive y en la celda se escribe el enlace.
 */
function buildRow(data, isnInter) {
  var n = HEADERS.length;
  var row = [];
  for (var i = 0; i < n; i++) row.push('');

  row[0] = sanitize(val(data.rep_codigo));
  row[1] = sanitize(val(data.rep_version));
  row[2] = sanitize(val(data.rep_aprobacion));
  row[3] = sanitize(val(data.rep_origen));
  row[4] = sanitize(val(data.rep_area));
  row[5] = sanitize(val(data.rep_fecha));
  row[6] = sanitize(val(data.rep_lugar));
  row[7] = sanitize(val(data.rep_persona));
  row[8] = sanitize(val(data.rep_clasificacion_seguridad));
  row[9] = sanitize(val(data.rep_medio_ambiente));
  row[10] = sanitize(val(data.rep_causa));
  row[11] = sanitize(val(data.rep_descripcion));
  row[13] = sanitize(val(data.rep_accion));
  row[15] = sanitize(val(data.rep_recomendacion));
  row[17] = sanitize(val(data.rep_reportante));

  var now = new Date();
  var tz = Session.getScriptTimeZone() || 'UTC';
  row[18] = Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm:ss');
  row[19] = (data.envio_con_inter === true || data.envio_con_inter === 'true') ? 'CON INTER' : 'SIN INTER';

  var fotoDesc = data.rep_foto_descripcion_base64;
  var fotoAccion = data.rep_foto_accion_base64;
  var fotoRecom = data.rep_foto_recomendacion_base64;
  if (fotoDesc && typeof fotoDesc === 'string' && fotoDesc.length > 0) {
    row[12] = savePhotoToDrive(fotoDesc, isnInter, 'descripcion') || '';
  }
  if (fotoAccion && typeof fotoAccion === 'string' && fotoAccion.length > 0) {
    row[14] = savePhotoToDrive(fotoAccion, isnInter, 'accion') || '';
  }
  if (fotoRecom && typeof fotoRecom === 'string' && fotoRecom.length > 0) {
    row[16] = savePhotoToDrive(fotoRecom, isnInter, 'recomendacion') || '';
  }

  return row;
}

function val(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function sanitize(str) {
  if (str.length > CONFIG.MAX_STRING_LENGTH) str = str.slice(0, CONFIG.MAX_STRING_LENGTH);
  return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
}

function savePhotoToDrive(base64Data, isnInter, suffix) {
  try {
    var mime = 'image/jpeg';
    var ext = 'jpg';
    var base64 = base64Data;
    if (base64.indexOf('base64,') !== -1) {
      var prefix = base64.split('base64,')[0].toLowerCase();
      if (prefix.indexOf('image/png') !== -1) { mime = 'image/png'; ext = 'png'; }
      base64 = base64.split('base64,')[1];
    }
    if (!base64 || base64.length > CONFIG.MAX_PHOTO_BASE64_LENGTH) return '';

    var blob = Utilities.newBlob(Utilities.base64Decode(base64), mime, isnInter + '_' + suffix + '.' + ext);
    var folder = getOrCreateFotoFolder();
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    Logger.log('savePhotoToDrive error: ' + e.toString());
    return '';
  }
}

function getOrCreateFotoFolder() {
  var iter = DriveApp.getRootFolder().getFoldersByName(CONFIG.FOLDER_NAME);
  if (iter.hasNext()) return iter.next();
  return DriveApp.getRootFolder().createFolder(CONFIG.FOLDER_NAME);
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
  }
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#27ae60').setFontColor('#fff');
  }
  return sheet;
}
