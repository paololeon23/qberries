/**
 * script.js - Lógica de pantalla: sidebar, vistas, estado de conexión, avisos.
 * La lógica del formulario de reporte (buildPayload, fotos, POST) está en network.js (initReporteForm).
 * SweetAlert se usa desde network.js para mensajes de guardado/error; aquí solo se inicializa lo que toca a la UI.
 */
import { updateUI, initReporteForm, getHistorialEntries, enviarPendientes } from './network.js';
let firmaImagenDataUrl = '';
let bloquearAperturaPdfHasta = 0;
let modalPdfAbierto = false;
let generandoPdf = false;

// Estado de conexión y contador de pendientes
                        updateUI();
window.addEventListener('online', () => { updateUI(); enviarPendientes(); });
window.addEventListener('offline', () => updateUI());
window.addEventListener('pending-updated', () => updateUI());

/** Devuelve true si el formulario de reporte tiene al menos un campo con datos (para avisar antes de refrescar/salir) */
function formTieneDatos() {
    const form = document.getElementById('seguridad-form');
    if (!form) return false;
    const inputs = form.querySelectorAll('input:not([type="file"]), textarea');
    for (const el of inputs) {
        if (el.type === 'checkbox' || el.type === 'radio') {
            if (el.checked) return true;
        } else if ((el.value || '').toString().trim() !== '') {
            return true;
        }
    }
            return false;
}

function recortarFirmaDataUrl(dataUrl) {
    return new Promise((resolve) => {
        if (!dataUrl) { resolve(''); return; }
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(dataUrl); return; }
                ctx.drawImage(img, 0, 0);
                const w = canvas.width;
                const h = canvas.height;
                const pixels = ctx.getImageData(0, 0, w, h).data;
                let minX = w, minY = h, maxX = -1, maxY = -1;
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const i = ((y * w) + x) * 4;
                        const r = pixels[i];
                        const g = pixels[i + 1];
                        const b = pixels[i + 2];
                        const a = pixels[i + 3];
                        const isInk = a > 10 && !(r > 245 && g > 245 && b > 245);
                        if (!isInk) continue;
                        if (x < minX) minX = x;
                        if (y < minY) minY = y;
                        if (x > maxX) maxX = x;
                        if (y > maxY) maxY = y;
                    }
                }
                if (maxX < minX || maxY < minY) { resolve(dataUrl); return; }
                const pad = 6;
                minX = Math.max(0, minX - pad);
                minY = Math.max(0, minY - pad);
                maxX = Math.min(w - 1, maxX + pad);
                maxY = Math.min(h - 1, maxY + pad);
                const outW = maxX - minX + 1;
                const outH = maxY - minY + 1;
                const out = document.createElement('canvas');
                out.width = outW;
                out.height = outH;
                const outCtx = out.getContext('2d');
                if (!outCtx) { resolve(dataUrl); return; }
                outCtx.drawImage(canvas, minX, minY, outW, outH, 0, 0, outW, outH);
                resolve(out.toDataURL('image/png'));
            } catch (_) {
                resolve(dataUrl);
            }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

function getVal(id) {
    var el = document.getElementById(id);
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked ? 'X' : '';
    if (el.value !== undefined) return (el.value || '').toString().trim();
    return (el.textContent || '').toString().trim();
}

async function generarPDFReporte(openerEl) {
    if (generandoPdf || modalPdfAbierto) return;
    generandoPdf = true;

    var JsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!JsPDF) {
        generandoPdf = false;
        if (typeof Swal !== 'undefined') Swal.fire({ title: 'Error', text: 'No se pudo cargar la librería PDF.', icon: 'error', confirmButtonColor: '#27ae60' });
        else alert('No se pudo cargar la librería PDF.');
        return;
    }
    var doc = new JsPDF('p', 'mm', 'a4');
    var m = 10;
    var w = 190;
    var y = 10;
    var gray = [118, 118, 118];
    var border = [95, 95, 95];
    var photoBlue = [58, 79, 167];

    function v(id) { return (getVal(id) || '').toString().trim(); }
    function drawCheck(x, yTop, checked, size) {
        var s = size || 4.2;
        doc.rect(x, yTop, s, s);
        if (checked) doc.text('X', x + (s * 0.26), yTop + (s * 0.76));
    }
    function drawBar(titleText, fontSize, barHeight) {
        var fz = fontSize || 7.5;
        var bh = barHeight || 6;
        doc.setFillColor(gray[0], gray[1], gray[2]);
        doc.rect(m, y, w, bh, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(fz);
        doc.text(titleText, m + (w / 2), y + (bh * 0.68), { align: 'center' });
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        y += bh;
    }
    function drawWrappedInBox(text, x, yTop, boxWidth, boxHeight, lineHeight) {
        var raw = (text || '').toString().trim();
        if (!raw) return;
        var lh = lineHeight || 3.4;
        var maxLines = Math.max(1, Math.floor((boxHeight - 4) / lh));
        var lines = doc.splitTextToSize(raw, boxWidth);
        var drawLines = lines.slice(0, maxLines);
        for (var i = 0; i < drawLines.length; i++) {
            doc.text(drawLines[i], x, yTop + 4 + (i * lh), { maxWidth: boxWidth, align: 'justify' });
        }
        if (lines.length > maxLines) {
            doc.text('...', x + boxWidth - 4, yTop + boxHeight - 1.8, { align: 'right' });
        }
    }
    function toCompressedPdfImageFromFile(file) {
        return new Promise((resolve) => {
            if (!file) { resolve(''); return; }
            var reader = new FileReader();
            reader.onload = () => {
                var src = typeof reader.result === 'string' ? reader.result : '';
                if (!src) { resolve(''); return; }
                var img = new Image();
                img.onload = () => {
                    try {
                        var maxSide = 1600;
                        var quality = 0.78;
                        var w = img.naturalWidth || img.width;
                        var h = img.naturalHeight || img.height;
                        if (!w || !h) { resolve(src); return; }
                        var scale = Math.min(1, maxSide / Math.max(w, h));
                        var tw = Math.max(1, Math.round(w * scale));
                        var th = Math.max(1, Math.round(h * scale));
                        var canvas = document.createElement('canvas');
                        canvas.width = tw;
                        canvas.height = th;
                        var ctx = canvas.getContext('2d');
                        if (!ctx) { resolve(src); return; }
                        // Fondo blanco para soportar conversiones desde PNG/WebP con transparencia.
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, tw, th);
                        ctx.drawImage(img, 0, 0, tw, th);
                        resolve(canvas.toDataURL('image/jpeg', quality));
                    } catch (_) {
                        resolve(src);
                    }
                };
                img.onerror = () => resolve(src);
                img.src = src;
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
        });
    }
    function readInputImageAsDataUrl(inputId) {
        return new Promise((resolve) => {
            var input = document.getElementById(inputId);
            if (!input || !input.files || !input.files[0]) { resolve(''); return; }
            toCompressedPdfImageFromFile(input.files[0]).then(resolve).catch(() => resolve(''));
        });
    }
    function drawImageContain(dataUrl, x, yTop, boxW, boxH) {
        if (!dataUrl) return false;
        try {
            var format = 'PNG';
            if (/^data:image\/jpe?g/i.test(dataUrl)) format = 'JPEG';
            if (/^data:image\/webp/i.test(dataUrl)) format = 'WEBP';
            var props = doc.getImageProperties(dataUrl);
            var imgW = (props && props.width) ? props.width : boxW;
            var imgH = (props && props.height) ? props.height : boxH;
            var ratio = imgW / imgH;
            var drawW = boxW;
            var drawH = drawW / ratio;
            if (drawH > boxH) {
                drawH = boxH;
                drawW = drawH * ratio;
            }
            var drawX = x + ((boxW - drawW) / 2);
            var drawY = yTop + ((boxH - drawH) / 2);
            doc.addImage(dataUrl, format, drawX, drawY, drawW, drawH, undefined, 'MEDIUM');
            return true;
        } catch (_) {
            return false;
        }
    }
    var fotosAnexo = await Promise.all([
        readInputImageAsDataUrl('rep_foto_descripcion'),
        readInputImageAsDataUrl('rep_foto_accion'),
        readInputImageAsDataUrl('rep_foto_recomendacion')
    ]);
    function drawFirmaImagen(x, yTop, boxW, boxH) {
        if (!firmaImagenDataUrl) return false;
        try {
            var format = 'PNG';
            if (/^data:image\/jpe?g/i.test(firmaImagenDataUrl)) format = 'JPEG';
            if (/^data:image\/webp/i.test(firmaImagenDataUrl)) format = 'WEBP';
            var pad = 0.1;
            var innerW = Math.max(1, boxW - (pad * 2));
            var innerH = Math.max(1, boxH - (pad * 2));
            var props = doc.getImageProperties(firmaImagenDataUrl);
            var imgW = (props && props.width) ? props.width : innerW;
            var imgH = (props && props.height) ? props.height : innerH;
            var ratio = imgW / imgH;
            var drawW = innerW;
            var drawH = drawW / ratio;
            if (drawH > innerH) {
                drawH = innerH;
                drawW = drawH * ratio;
            }
            // Efecto "z-index": se dibuja un poco más grande para sobresalir
            // y parecer una firma real estampada sobre el cuadro.
            var overflowScale = 1.32;
            drawW *= overflowScale;
            drawH *= overflowScale;
            var drawX = x + pad + ((innerW - drawW) / 2);
            var drawY = yTop + pad + ((innerH - drawH) / 2) + 1.0;
            doc.addImage(firmaImagenDataUrl, format, drawX, drawY, drawW, drawH, undefined, 'MEDIUM');
            return true;
        } catch (_) {
            return false;
        }
    }

    doc.setLineWidth(0.25);
    doc.setDrawColor(border[0], border[1], border[2]);

    var hHeader = 18;
    var wLogo = 31;
    var wTitle = 98;
    var wMeta = w - wLogo - wTitle;
    doc.rect(m, y, w, hHeader);
    doc.line(m + wLogo, y, m + wLogo, y + hHeader);
    doc.line(m + wLogo + wTitle, y, m + wLogo + wTitle, y + hHeader);
    doc.line(m + wLogo + wTitle, y + 6, m + w, y + 6);
    doc.line(m + wLogo + wTitle, y + 12, m + w, y + 12);

    var logoDibujado = false;
    try {
        var logoEl = document.querySelector('.sidebar-logo-image') || document.querySelector('.menu-logo-image');
        if (logoEl && logoEl.complete) {
            doc.addImage(logoEl, 'PNG', m + 4.6, y + 4.0, 22.8, 9.4, undefined, 'FAST');
            logoDibujado = true;
        }
    } catch (_) {}
    if (!logoDibujado) {
        doc.setFont(undefined, 'bold');
        doc.setFontSize(15);
        doc.setTextColor(192, 57, 43);
        doc.text('Q', m + 4.2, y + 11.4);
        doc.setTextColor(39, 174, 96);
        doc.text('Berries', m + 9.4, y + 11.4);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
    }

    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.text('REPORTE DE ACTOS Y/O CONDICIONES INSEGURAS', m + wLogo + (wTitle / 2), y + 10, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    var xMeta = m + wLogo + wTitle;
    var wMetaCell = wMeta;
    doc.setFont(undefined, 'bold');
    doc.text('Código:', xMeta + 1.5, y + 4.2);
    doc.setFont(undefined, 'normal');
    doc.text(v('rep_codigo'), xMeta + (wMetaCell / 2), y + 4.2, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.text('Versión:', xMeta + 1.5, y + 10.2);
    doc.setFont(undefined, 'normal');
    doc.text(v('rep_version'), xMeta + (wMetaCell / 2), y + 10.2, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.text('Aprobación:', xMeta + 1.5, y + 16.2);
    doc.setFont(undefined, 'normal');
    doc.text(v('rep_aprobacion'), xMeta + (wMetaCell / 2), y + 16.2, { align: 'center' });
    y += hHeader + 5;

    doc.setFontSize(8);
    var yTercero = y + 5.0;
    var yPropio = y + 13.0;
    doc.text('TERCERO', m + 9, yTercero);
    drawCheck(m + 26, yTercero - 3.6, v('rep_tercero') === 'X');
    doc.text('PROPIO', m + 10, yPropio);
    drawCheck(m + 26, yPropio - 3.6, v('rep_propio') === 'X');

    var xArea = m + 36;
    var hArea = 14;
    doc.rect(xArea, y, w - 36, hArea);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text(v('rep_area').substring(0, 90), xArea + ((w - 36) / 2), y + 8.8, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('NOMBRE DE LA EMPRESA CONTRATISTA / ÁREA', xArea + ((w - 36) / 2), y + hArea + 3.2, { align: 'center' });
    doc.setFont(undefined, 'normal');
    y += hArea + 5.5;

    var wFecha = 32;
    var gap = 4;
    var wLugar = w - wFecha - gap;
    doc.rect(m, y, wFecha, 8);
    doc.rect(m + wFecha + gap, y, wLugar, 8);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text(v('rep_fecha_display') || v('rep_fecha'), m + (wFecha / 2), y + 5.5, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.text(v('rep_lugar').substring(0, 82), m + wFecha + gap + (wLugar / 2), y + 5.5, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('FECHA', m + (wFecha / 2), y + 11.5, { align: 'center' });
    doc.text('LUGAR DE OCURRENCIA (ESPECIFICAR EL LUGAR EXACTO)', m + wFecha + gap + (wLugar / 2), y + 11.5, { align: 'center' });
    y += 14.5;

    doc.rect(m, y, w, 8);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text(v('rep_persona').substring(0, 95), m + (w / 2), y + 5.5, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('NOMBRE DE LA PERSONA REPORTADA', m + (w / 2), y + 11.3, { align: 'center' });
    y += 14;

    drawBar('CLASIFICACIÓN', 11, 8);
    y += 1;
    var wHalf = (w - 2) / 2;
    var yClassTitles = y + 3.8;
    var yClassBoxes = y + 6.2;
    var hClass = 10.8;
    doc.rect(m, yClassBoxes, wHalf, hClass);
    doc.rect(m + wHalf + 2, yClassBoxes, wHalf, hClass);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('SEGURIDAD Y SALUD', m + (wHalf / 2), yClassTitles, { align: 'center' });
    doc.text('MEDIO AMBIENTE', m + wHalf + 2 + (wHalf / 2), yClassTitles, { align: 'center' });
    doc.setFontSize(8);
    function drawOption(label, centerX, baselineY, checked) {
        var tw = doc.getTextWidth(label);
        var tx = centerX - (tw / 2);
        doc.text(label, tx, baselineY - 0.8);
        drawCheck(tx + tw + 1.8, baselineY - 3.8, checked, 4.2);
    }
    var yOpt = yClassBoxes + 6.9;
    var xl = m;
    drawOption('ACTO', xl + 14, yOpt, v('rep_acto') === 'X');
    drawOption('CONDICIÓN', xl + 43, yOpt, v('rep_condicion') === 'X');
    drawOption('INCIDENTE', xl + 73, yOpt, v('rep_incidente') === 'X');
    var xr = m + wHalf + 2;
    drawOption('ASPECTO', xr + 26, yOpt, v('rep_aspecto') === 'X');
    drawOption('IMPACTO', xr + 56, yOpt, v('rep_impacto') === 'X');
    doc.setFont(undefined, 'normal');
    y = yClassBoxes + hClass + 3;

    doc.setFillColor(gray[0], gray[1], gray[2]);
    doc.rect(m, y, w, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('CAUSA', m + (w / 2), y + 5.4, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 9;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    var leftRows = [
        ['Orden y Limpieza', 'rep_causa_orden'],
        ['Herramientas, Materiales y Equipos', 'rep_causa_herramientas'],
        ['Ergonomía', 'rep_causa_ergonomia'],
        ['Productos Peligrosos', 'rep_causa_productos'],
        ['Segregación de residuos', 'rep_causa_residuos'],
        ['Otros', 'rep_causa_otros']
    ];
    var rightRows = [
        ['Análisis de tareas', 'rep_causa_analisis'],
        ['Equipo de Protección Personal', 'rep_causa_epp'],
        ['Conducción de vehículos', 'rep_causa_conduccion'],
        ['Infraestructura', 'rep_causa_infra'],
        ['Práctica Ambiental Inadecuada', 'rep_causa_ambiental']
    ];
    var rowY = y + 5.6;
    var rowStep = 7.1;
    var colLeftStart = m + 1;
    var colLeftEnd = m + (w / 2) - 3;
    var colRightStart = m + (w / 2) + 3;
    var colRightEnd = m + w - 1;
    var leftCheckX = colLeftEnd - 8;
    var rightCheckX = colRightEnd - 8;
    doc.setFontSize(8);
    for (var li = 0; li < leftRows.length; li++) {
        var yl = rowY + (li * rowStep);
        doc.text(leftRows[li][0], leftCheckX - 2.2, yl, { align: 'right' });
        drawCheck(leftCheckX, yl - 4.5, v(leftRows[li][1]) === 'X', 5.0);
    }
    doc.setFontSize(8);
    for (var ri = 0; ri < rightRows.length; ri++) {
        var yr = rowY + (ri * rowStep);
        doc.text(rightRows[ri][0], rightCheckX - 2.2, yr, { align: 'right' });
        drawCheck(rightCheckX, yr - 4.5, v(rightRows[ri][1]) === 'X', 5.0);
    }
    doc.setFont(undefined, 'normal');
    y += 47;

    drawBar('DESCRIPCIÓN DEL EVENTO (¿Qué pasó?)');
    var gapBox = 1.2;
    var yDescBox = y + gapBox;
    var hDesc = 25;
    doc.line(m, yDescBox, m + w, yDescBox);
    doc.line(m, yDescBox, m, yDescBox + hDesc);
    doc.line(m + w, yDescBox, m + w, yDescBox + hDesc);
    doc.line(m, yDescBox + hDesc, m + w, yDescBox + hDesc);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    drawWrappedInBox(v('rep_descripcion'), m + 2, yDescBox, w - 6, hDesc, 3.3);
    doc.setTextColor(photoBlue[0], photoBlue[1], photoBlue[2]);
    doc.text('FOTO', m + w - 9, yDescBox + hDesc - 1.8);
    doc.setTextColor(0, 0, 0);
    y = yDescBox + hDesc + 3;

    drawBar('ACCIÓN INMEDIATA (¿Qué se hizo en el momento para reducir el riesgo?)');
    var yAccionBox = y + gapBox;
    var hAccion = 17;
    doc.line(m, yAccionBox, m + w, yAccionBox);
    doc.line(m, yAccionBox, m, yAccionBox + hAccion);
    doc.line(m + w, yAccionBox, m + w, yAccionBox + hAccion);
    doc.line(m, yAccionBox + hAccion, m + w, yAccionBox + hAccion);
    drawWrappedInBox(v('rep_accion'), m + 2, yAccionBox, w - 6, hAccion, 3.3);
    doc.setTextColor(photoBlue[0], photoBlue[1], photoBlue[2]);
    doc.text('FOTO', m + w - 9, yAccionBox + hAccion - 1.8);
    doc.setTextColor(0, 0, 0);
    y = yAccionBox + hAccion + 3;

    drawBar('RECOMENDACIÓN (¿Qué se debería hacer para evitar su repetición?)');
    var yRecoBox = y + gapBox;
    var hReco = 28;
    doc.line(m, yRecoBox, m + w, yRecoBox);
    doc.line(m, yRecoBox, m, yRecoBox + hReco);
    doc.line(m + w, yRecoBox, m + w, yRecoBox + hReco);
    doc.line(m, yRecoBox + hReco, m + w, yRecoBox + hReco);
    drawWrappedInBox(v('rep_recomendacion'), m + 2, yRecoBox, w - 6, hReco, 3.3);
    doc.setTextColor(photoBlue[0], photoBlue[1], photoBlue[2]);
    doc.text('FOTO', m + w - 9, yRecoBox + hReco - 1.8);
    doc.setTextColor(0, 0, 0);
    y = yRecoBox + hReco + 3;

    var wRep = 132;
    var wSig = w - wRep - 2;
    var hFirmaRow = 16;
    doc.rect(m, y, wRep, hFirmaRow);
    doc.rect(m + wRep + 2, y, wSig, hFirmaRow);
    doc.setFontSize(7);
    doc.text(v('rep_reportante').substring(0, 70), m + (wRep / 2), y + 9.3, { align: 'center' });
    var firmaBoxX = m + wRep + 2;
    var firmaDibujada = drawFirmaImagen(firmaBoxX, y, wSig, hFirmaRow);
    if (!firmaDibujada) {
        doc.text(v('rep_firma').substring(0, 30), m + wRep + 4, y + 9.5);
    }
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('NOMBRE DEL REPORTANTE', m + (wRep / 2), y + 21.4, { align: 'center' });
    doc.text('FIRMA', m + wRep + 2 + (wSig / 2), y + 21.4, { align: 'center' });

    var anexos = [
        { titulo: 'DESCRIPCION DEL EVENTO', dataUrl: fotosAnexo[0] },
        { titulo: 'ACCION INMEDIATA', dataUrl: fotosAnexo[1] },
        { titulo: 'RECOMENDACION', dataUrl: fotosAnexo[2] }
    ].filter(a => !!a.dataUrl);

    if (anexos.length > 0) {
        doc.addPage('a4', 'p');
        var ax = 12;
        var aw = 186;
        var ay = 12;
        var cardGap = 7;
        var cardH = 84;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(13);
        doc.setTextColor(70, 70, 70);
        doc.text('ANEXO FOTOGRAFICO', 105, ay + 3, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        ay += 8;

        for (var ai = 0; ai < anexos.length; ai++) {
            var cardY = ay + (ai * (cardH + cardGap));
            doc.setDrawColor(120, 120, 120);
            doc.rect(ax, cardY, aw, cardH);
            doc.setFillColor(118, 118, 118);
            doc.rect(ax, cardY, aw, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
            doc.setFontSize(9);
            doc.text(anexos[ai].titulo, ax + (aw / 2), cardY + 5.4, { align: 'center' });
            doc.setTextColor(0, 0, 0);

            var imgPadX = 4;
            var imgPadY = 11;
            var imgW = aw - (imgPadX * 2);
            var imgH = cardH - imgPadY - 3;
            drawImageContain(anexos[ai].dataUrl, ax + imgPadX, cardY + imgPadY, imgW, imgH);
        }
    }

    try {
        var blob = doc.output('blob');
        var url = URL.createObjectURL(blob);
        var modal = document.getElementById('modal-pdf-ver');
        var iframe = document.getElementById('modal-pdf-iframe');
        var linkDescarga = document.getElementById('modal-pdf-descargar');
        var btnCerrar = document.getElementById('modal-pdf-cerrar');
        var focusBackEl = openerEl || document.activeElement;
        if (modal && iframe) {
            if (window._pdfBlobUrl) URL.revokeObjectURL(window._pdfBlobUrl);
            window._pdfBlobUrl = url;
            iframe.src = url + '#page=1&zoom=page-width';
            if (linkDescarga) {
                linkDescarga.href = url;
                linkDescarga.download = 'Reporte-QBerries.pdf';
            }
            modal.style.display = 'flex';
            modal.classList.add('modal-pdf-abierto');
            modal.setAttribute('aria-hidden', 'false');
            modalPdfAbierto = true;
            generandoPdf = false;
            if (btnCerrar && typeof btnCerrar.focus === 'function') {
                setTimeout(() => btnCerrar.focus(), 0);
            }
            function cerrarModalPdf() {
                bloquearAperturaPdfHasta = Date.now() + 900;
                var activeEl = document.activeElement;
                if (activeEl && modal.contains(activeEl) && typeof activeEl.blur === 'function') {
                    activeEl.blur();
                }
                modal.style.display = 'none';
                modal.classList.remove('modal-pdf-abierto');
                modal.setAttribute('aria-hidden', 'true');
                modalPdfAbierto = false;
                iframe.src = 'about:blank';
                if (window._pdfBlobUrl) {
                    URL.revokeObjectURL(window._pdfBlobUrl);
                    window._pdfBlobUrl = null;
                }
                if (focusBackEl && typeof focusBackEl.focus === 'function') {
                    setTimeout(() => focusBackEl.focus(), 0);
                }
            }
            if (btnCerrar) {
                btnCerrar.onclick = function (e) {
                    if (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    cerrarModalPdf();
                };
            }
            modal.onclick = function (e) { if (e.target === modal) cerrarModalPdf(); };
        } else {
            generandoPdf = false;
            window.open(URL.createObjectURL(blob), '_blank');
        }
    } catch (e) {
        generandoPdf = false;
        doc.save('Reporte-QBerries.pdf');
    }
}

window.addEventListener('beforeunload', (e) => {
    if (formTieneDatos()) {
        e.preventDefault();
        e.returnValue = '¿Estás seguro? Se va a perder la información no guardada si refrescas o cierras.';
    }
});

if ('serviceWorker' in navigator && !window.location.hostname.match(/127\.0\.0\.1|localhost/)) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
    initReporteForm();

        if (window.lucide) lucide.createIcons();

    const form = document.getElementById('seguridad-form');
    const btnPdf = document.getElementById('btn-ver-pdf');
    const firmaFotoInput = document.getElementById('rep_firma_foto');
    const firmaFotoNombre = document.getElementById('rep_firma_foto_nombre');
    if (btnPdf) {
        btnPdf.addEventListener('click', (e) => {
            if (Date.now() < bloquearAperturaPdfHasta) return;
            if (modalPdfAbierto || generandoPdf) return;
            generarPDFReporte(e.currentTarget);
        });
    }
    if (firmaFotoInput) {
        firmaFotoInput.addEventListener('change', () => {
            const file = firmaFotoInput.files && firmaFotoInput.files[0];
            if (!file) {
                firmaImagenDataUrl = '';
                if (firmaFotoNombre) firmaFotoNombre.textContent = 'Sin imagen';
                return;
            }
            const reader = new FileReader();
            reader.onload = async () => {
                const raw = typeof reader.result === 'string' ? reader.result : '';
                firmaImagenDataUrl = await recortarFirmaDataUrl(raw);
                if (firmaFotoNombre) firmaFotoNombre.textContent = file.name || 'Firma cargada';
            };
            reader.onerror = () => {
                firmaImagenDataUrl = '';
                if (firmaFotoNombre) firmaFotoNombre.textContent = 'Sin imagen';
            };
            reader.readAsDataURL(file);
        });
    }
    if (form) {
        form.addEventListener('input', () => { window.formHasChanges = formTieneDatos(); });
        form.addEventListener('change', () => { window.formHasChanges = formTieneDatos(); });
        form.addEventListener('reset', () => {
            firmaImagenDataUrl = '';
            if (firmaFotoNombre) firmaFotoNombre.textContent = 'Sin imagen';
            if (firmaFotoInput) firmaFotoInput.value = '';
        });
    }

    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const viewHistorial = document.getElementById('view-historial');
    const viewRecomendaciones = document.getElementById('view-recomendaciones');

    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => sidebar.classList.add('active'));
    }
    if (closeBtn && sidebar) {
        closeBtn.addEventListener('click', () => sidebar.classList.remove('active'));
    }
    // Cerrar sidebar al tocar fuera (móvil y desktop)
    document.addEventListener('click', (e) => {
        if (!sidebar || !sidebar.classList.contains('active')) return;
        const clickedInsideSidebar = sidebar.contains(e.target);
        const clickedMenuBtn = menuBtn && menuBtn.contains(e.target);
        if (!clickedInsideSidebar && !clickedMenuBtn) {
            sidebar.classList.remove('active');
        }
    });

    function renderHistorialTable() {
        const tbody = document.getElementById('historial-tabla-body');
        const sinDatos = document.getElementById('historial-sin-datos');
        const wrapper = document.querySelector('.historial-table-wrapper');
        if (!tbody) return;
        const entries = getHistorialEntries();
        tbody.innerHTML = '';
        if (entries.length === 0) {
            if (sinDatos) sinDatos.style.display = 'block';
            if (wrapper) wrapper.style.display = 'none';
                } else {
            if (sinDatos) sinDatos.style.display = 'none';
            if (wrapper) wrapper.style.display = 'block';
            entries.forEach(e => {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td>' + (e.fechaHora || '') + '</td><td>' + (e.dispositivo || '') + '</td>';
                tbody.appendChild(tr);
            });
        }
        if (window.lucide) window.lucide.createIcons();
    }

    function showView(viewId) {
        if (form) form.style.display = viewId === 'nueva' ? '' : 'none';
        if (viewHistorial) {
            viewHistorial.style.display = viewId === 'historial' ? 'block' : 'none';
            if (viewId === 'historial') renderHistorialTable();
        }
        if (viewRecomendaciones) viewRecomendaciones.style.display = viewId === 'recomendaciones' ? 'block' : 'none';
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-view') === viewId);
        });
        if (sidebar) sidebar.classList.remove('active');
    }

    window.addEventListener('historial-updated', renderHistorialTable);

    // Acordeón Recomendaciones: abrir/cerrar cada tarjeta
    document.querySelectorAll('.recom-card-header').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.recom-card');
            if (!card) return;
            const isClosed = card.classList.toggle('recom-card--closed');
            btn.setAttribute('aria-expanded', !isClosed);
        });
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.getAttribute('data-view');
            if (view) showView(view);
        });
    });
});
