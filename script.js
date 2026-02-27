/**
 * script.js - Lógica de pantalla: sidebar, vistas, estado de conexión, avisos.
 * La lógica del formulario de reporte (buildPayload, fotos, POST) está en network.js (initReporteForm).
 * SweetAlert se usa desde network.js para mensajes de guardado/error; aquí solo se inicializa lo que toca a la UI.
 */
import { updateUI, initReporteForm, getHistorialEntries } from './network.js';

// Estado de conexión y reintentos
updateUI();
window.addEventListener('online', () => updateUI());
window.addEventListener('offline', () => updateUI());

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
