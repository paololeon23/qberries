document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar Iconos de Lucide
    if (window.lucide) {
        lucide.createIcons();
    }

    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');

    // Abrir Sidebar
    menuBtn.addEventListener('click', () => {
        sidebar.classList.add('active');
    });

    // Cerrar Sidebar
    closeBtn.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    const trazLibre = document.getElementById('traz-libre');
    if (trazLibre) {
        trazLibre.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    }

    const inputHora = document.getElementById('hora-inicio');

    // Función para poner la hora actual en formato 24h
    const establecerHoraActual = () => {
        const ahora = new Date();
        const horas = String(ahora.getHours()).padStart(2, '0');
        const minutos = String(ahora.getMinutes()).padStart(2, '0');
        inputHora.value = `${horas}:${minutos}`;
    };

    // Ejecutar al cargar la página
    establecerHoraActual();

    // Manejo del Formulario con SweetAlert2
    document.getElementById('cosecha-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Alerta moderna Offline
        Swal.fire({
            title: '¡Registro Exitoso!',
            text: 'Los datos se han guardado localmente en la tableta.',
            icon: 'success',
            confirmButtonColor: '#2f7cc0',
            confirmButtonText: 'Entendido'
        });

        // Aquí puedes añadir tu lógica de LocalStorage o sincronización
    });
});