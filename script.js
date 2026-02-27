/**
 * script.js - Lógica de pantalla: sidebar, vistas, estado de conexión, avisos.
 * La lógica del formulario de reporte (buildPayload, fotos, POST) está en network.js (initReporteForm).
 * SweetAlert se usa desde network.js para mensajes de guardado/error; aquí solo se inicializa lo que toca a la UI.
 */
import { updateUI, initReporteForm, getHistorialEntries, enviarPendientes } from './network.js';

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

function getVal(id) {
    var el = document.getElementById(id);
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked ? 'X' : '';
    if (el.value !== undefined) return (el.value || '').toString().trim();
    return (el.textContent || '').toString().trim();
}

function generarPDFReporte() {
    var JsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!JsPDF) {
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

    doc.setFont(undefined, 'bold');
    doc.setFontSize(15);
    doc.setTextColor(192, 57, 43);
    doc.text('Q', m + 4.2, y + 11.4);
    doc.setTextColor(39, 174, 96);
    doc.text('Berries', m + 9.4, y + 11.4);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');

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
    doc.text(v('rep_area').substring(0, 90), xArea + 2, y + 8.8);
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
    doc.text(v('rep_lugar').substring(0, 82), m + wFecha + gap + 2, y + 5.5);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('FECHA', m + (wFecha / 2), y + 11.5, { align: 'center' });
    doc.text('LUGAR DE OCURRENCIA (ESPECIFICAR EL LUGAR EXACTO)', m + wFecha + gap + (wLugar / 2), y + 11.5, { align: 'center' });
    y += 14.5;

    doc.rect(m, y, w, 8);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text(v('rep_persona').substring(0, 95), m + 2, y + 5.5);
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
    doc.rect(m, y, wRep, 8);
    doc.rect(m + wRep + 2, y, wSig, 8);
    doc.setFontSize(7);
    doc.text(v('rep_reportante').substring(0, 70), m + 2, y + 5.2);
    doc.text(v('rep_firma').substring(0, 30), m + wRep + 4, y + 5.2);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('NOMBRE DEL REPORTANTE', m + (wRep / 2), y + 11.7, { align: 'center' });
    doc.text('FIRMA', m + wRep + 2 + (wSig / 2), y + 11.7, { align: 'center' });

    try {
        var blob = doc.output('blob');
        var url = URL.createObjectURL(blob);
        var modal = document.getElementById('modal-pdf-ver');
        var iframe = document.getElementById('modal-pdf-iframe');
        var linkDescarga = document.getElementById('modal-pdf-descargar');
        var btnCerrar = document.getElementById('modal-pdf-cerrar');
        if (modal && iframe) {
            if (window._pdfBlobUrl) URL.revokeObjectURL(window._pdfBlobUrl);
            window._pdfBlobUrl = url;
            iframe.src = url;
            if (linkDescarga) {
                linkDescarga.href = url;
                linkDescarga.download = 'Reporte-QBerries.pdf';
            }
            modal.style.display = 'flex';
            modal.classList.add('modal-pdf-abierto');
            modal.setAttribute('aria-hidden', 'false');
            function cerrarModalPdf() {
                modal.style.display = 'none';
                modal.classList.remove('modal-pdf-abierto');
                modal.setAttribute('aria-hidden', 'true');
                iframe.src = 'about:blank';
                if (window._pdfBlobUrl) {
                    URL.revokeObjectURL(window._pdfBlobUrl);
                    window._pdfBlobUrl = null;
                }
            }
            if (btnCerrar) btnCerrar.onclick = cerrarModalPdf;
            modal.onclick = function (e) { if (e.target === modal) cerrarModalPdf(); };
        } else {
            window.open(URL.createObjectURL(blob), '_blank');
        }
    } catch (e) {
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
    if (btnPdf) {
        btnPdf.addEventListener('click', () => generarPDFReporte());
    }
    if (form) {
        form.addEventListener('input', () => { window.formHasChanges = formTieneDatos(); });
        form.addEventListener('change', () => { window.formHasChanges = formTieneDatos(); });
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
