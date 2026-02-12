document.addEventListener('DOMContentLoaded', () => {
        
    // ========================================
    // 1. INICIALIZACIÓN DE ICONOS
    // ========================================
    if (window.lucide) {
        lucide.createIcons();
    }

    // ========================================
    // 2. CONFIGURACIÓN DE DATOS (MAPAS)
    // ========================================
    const VAR_MAP = {
        "FALL CREEK": {
            "01": "Ventura", "02": "Emerald", "03": "Biloxi", "05": "Snowchaser", 
            "12": "Jupiter Blue", "13": "Bianca Blue", "14": "Atlas Blue", 
            "15": "Biloxi Orgánico", "16": "Sekoya Beauty", "18": "Sekoya Pop", 
            "27": "Atlas Blue Orgánico", "36": "FCM17-132", "37": "FCM15-005", 
            "38": "FCM15-003", "40": "FCM14-057", "41": "Azra", 
            "49": "Sekoya Pop Orgánica", "58": "Ventura Orgánico", 
            "C0": "FCE15-087", "C1": "FCE18-012", "C2": "FCE18-015"
        },
        "DRISCOLL'S": {
            "17": "Kirra", "19": "Arana", "20": "Stella Blue", "21": "Terrapin", 
            "26": "Rosita", "28": "Arana Orgánico", "29": "Stella Blue Orgánico", 
            "30": "Kirra Orgánico", "31": "Regina", "34": "Raymi Orgánico", 
            "45": "Raymi", "50": "Rosita Orgánica"
        },
        "OZBLU": {
            "06": "Mágica", "07": "Bella", "08": "Bonita", "09": "Julieta", 
            "10": "Zila", "11": "Magnifica"
        },
        "PLANASA": {
            "22": "PLA Blue-Malibu", "23": "PLA Blue-Madeira", 
            "24": "PLA Blue-Masirah", "35": "Manila"
        },
        "IQ BERRIES": {
            "51": "Megaone", "53": "Megacrisp", "54": "Megaearly", 
            "55": "Megagem", "56": "Megagrand", "57": "Megastar"
        },
        "UNIV. FLORIDA": {
            "04": "Springhigh", "33": "Magnus", "39": "Colosus", "42": "Raven", 
            "43": "Avanti", "46": "Patrecia", "47": "Wayne", "48": "Bobolink", 
            "52": "Keecrisp", "67": "Albus (FL 11-051)", "68": "Falco (FL 17-141)", 
            "69": "FL-11-158", "70": "FL-10-179", "B9": "FL 19-006", 
            "C3": "FL09-279", "C4": "FL12-236"
        },
        "OTROS / EXPERIMENTALES": {
            "25": "Mixto", "32": "I+D", "44": "Merliah", 
            "62": "FCM15-000", "63": "FCM15-010", "64": "FCM-17010", "65": "Valentina"
        }
    };

    // ========================================
    // 3. CARGA DINÁMICA DE SELECTS
    // ========================================
    const selectVariedad = document.getElementById('reg_variedad');
    if (selectVariedad) {
        for (const [casa, variedades] of Object.entries(VAR_MAP)) {
            const group = document.createElement('optgroup');
            group.label = casa;

            for (const [id, nombre] of Object.entries(variedades)) {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = nombre;
                group.appendChild(option);
            }
            selectVariedad.appendChild(group);
        }
    }

    // ========================================
    // 4. INTERFAZ DE USUARIO (SIDEBAR)
    // ========================================
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');

    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.add('active');
        });
    }

    if (closeBtn && sidebar) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }

    document.addEventListener('click', (event) => {
        if (sidebar.classList.contains('active') && 
            !sidebar.contains(event.target) && 
            !menuBtn.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    });

    // ========================================
    // 5. VALIDACIONES DE ENTRADA
    // ========================================
    const trazLibre = document.getElementById('reg_traz_libre');
    if (trazLibre) {
        trazLibre.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    }

    // Fecha actual por defecto
    const campoFecha = document.getElementById('reg_fecha');
    if (campoFecha) {
        campoFecha.value = new Date().toISOString().split('T')[0];
    }

    // ========================================
    // 6. MANEJO DEL FORMULARIO (SUBMIT)
    // ========================================
    const cosechaForm = document.getElementById('cosecha-form');
    if (cosechaForm) {
        cosechaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            Swal.fire({
                title: '¡Registro Exitoso!',
                text: 'Los datos se han guardado localmente en la tableta.',
                icon: 'success',
                confirmButtonColor: '#2f7cc0',
                confirmButtonText: 'Entendido'
            });
        });
    }

    // ========================================
    // 7. SISTEMA DE MEDICIÓN - CONFIGURACIÓN
    // ========================================
    
    // Referencias a elementos DOM principales
    const selectMedicion = document.getElementById('tipo_medicion');
    const selectRotulo = document.getElementById('reg_rotulo_ensayo');
    
    // Wrappers de secciones (AQUÍ PUEDES AGREGAR MÁS)
    const wrappers = {
        visual: document.getElementById('wrapper_visual'),
        tiempos: document.getElementById('wrapper_tiempos'),
        acopio: document.getElementById('wrapper_acopio'),
        temperaturas: document.getElementById('wrapper_temperaturas'),
        jarras: document.getElementById('wrapper_jarras'),

        humedad: document.getElementById('wrapper_humedad'),
        tempambiente: document.getElementById('wrapper_tempambiente'),
        presionambiente: document.getElementById('wrapper_presionambiente'),
        presionfruta: document.getElementById('wrapper_presionfruta'),
        observacion: document.getElementById('wrapper_observacion')

        // AGREGAR MÁS WRAPPERS AQUÍ:
        // observaciones: document.getElementById('wrapper_observaciones'),
        // fotos: document.getElementById('wrapper_fotos'),
    };

    // Almacenamiento de datos por ensayo y tipo
    const datosEnsayos = {
        visual: {
            1: { pesos: [], tiempos: [] },
            2: { pesos: [], tiempos: [] },
            3: { pesos: [], tiempos: [] },
            4: { pesos: [], tiempos: [] }
        },
        acopio: {
            1: { pesos: [], tiempos: [] },
            2: { pesos: [], tiempos: [] },
            3: { pesos: [], tiempos: [] },
            4: { pesos: [], tiempos: [] }
        }
    };

    let tipoActual = '';
    let ensayoActual = '';

    // ========================================
    // CAMBIO DE TIPO DE MEDICIÓN
    // ========================================
    if (selectMedicion) {
        selectMedicion.addEventListener('change', function() {
            tipoActual = this.value;
            
            if (this.value === 'visual') {
                wrappers.visual.style.display = 'block';
                wrappers.tiempos.style.display = 'block';
                wrappers.temperaturas.style.display = 'block';
                wrappers.jarras.style.display = 'block';

                // wrappers. de la segunda hoja visual
                wrappers.humedad.style.display = 'block';
                wrappers.tempambiente.style.display = 'block';
                wrappers.presionambiente.style.display = 'block';
                wrappers.presionfruta.style.display = 'block';
                wrappers.observacion.style.display = 'block';

                wrappers.acopio.style.display = 'none';
                // AGREGAR MÁS WRAPPERS AQUÍ:
                // wrappers.observaciones.style.display = 'block';
                
            } else if (this.value === 'acopio') {
                wrappers.visual.style.display = 'none';
                wrappers.tiempos.style.display = 'none';
                wrappers.temperaturas.style.display = 'none';
                wrappers.jarras.style.display = 'none';

                wrappers.humedad.style.display = 'none';
                wrappers.tempambiente.style.display = 'none';
                wrappers.presionambiente.style.display = 'none';
                wrappers.presionfruta.style.display = 'none';
                wrappers.observacion.style.display = 'none';

                wrappers.acopio.style.display = 'block';
                // AGREGAR MÁS WRAPPERS AQUÍ:
                // wrappers.observaciones.style.display = 'none';
            }
            
            // Restaurar datos si hay un ensayo seleccionado
            if (ensayoActual) {
                restaurarDatosEnsayo(tipoActual, ensayoActual);
            }
        });
    }

    // ========================================
    // CAMBIO DE ENSAYO
    // ========================================
    if (selectRotulo) {
        selectRotulo.addEventListener('change', function() {
            ensayoActual = this.value;
            
            if (tipoActual) {
                restaurarDatosEnsayo(tipoActual, ensayoActual);
            }
        });
    }

    // ========================================
    // RESTAURAR DATOS DEL ENSAYO
    // ========================================
    function restaurarDatosEnsayo(tipo, ensayo) {
        if (tipo === 'visual') {
            const tbodyPesos = document.getElementById('tbody-visual');
            const tbodyTiempos = document.getElementById('tbody-tiempos');
            
            tbodyPesos.innerHTML = '';
            tbodyTiempos.innerHTML = '';
            
            const datos = datosEnsayos.visual[ensayo];
            
            // Restaurar pesos
            datos.pesos.forEach((rowData, index) => {
                agregarFilaPesos(rowData, tbodyPesos, index + 1);
            });
            
            // Restaurar tiempos
            datos.tiempos.forEach((rowData, index) => {
                agregarFilaTiempos(rowData, tbodyTiempos, index + 1);
            });
            
            abrirCollapsible('body-visual');
            abrirCollapsible('body-tiempos');
        }
    }

    // ========================================
    // AGREGAR FILA DE PESOS
    // ========================================
    function agregarFilaPesos(data, tbody, clamNum) {
        const row = document.createElement('tr');
        
        row.setAttribute('data-clam', clamNum);
        row.setAttribute('data-jarra', data.jarra);
        row.setAttribute('data-p1', data.p1);
        row.setAttribute('data-p2', data.p2);

        row.innerHTML = `
            <td class="clam-id">${clamNum}</td>
            <td>${data.jarra}</td>
            <td>${data.p1}g</td>
            <td>${data.p2}g</td>
            <td>
                <button type="button" class="btn-edit-row" data-tipo="pesos" title="Editar">
                    <i data-lucide="pencil"></i>
                </button>
                <button type="button" class="btn-delete-row" data-tipo="pesos" title="Eliminar">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        `;

        tbody.appendChild(row);
        
        if (window.lucide) lucide.createIcons();

        // Evento de editar
        row.querySelector('.btn-edit-row').addEventListener('click', () => {
            editarFilaPesos(clamNum, data);
        });

        // Evento de eliminar
        row.querySelector('.btn-delete-row').addEventListener('click', () => {
            eliminarFilaRelacionada(clamNum);
        });
    }

    // ========================================
    // AGREGAR FILA DE TIEMPOS
    // ========================================
    function agregarFilaTiempos(data, tbody, clamNum) {
        const row = document.createElement('tr');
        
        row.setAttribute('data-clam', clamNum);
        row.setAttribute('data-inicio', data.inicio || '');
        row.setAttribute('data-perdida', data.perdida || '');
        row.setAttribute('data-termino', data.termino || '');
        row.setAttribute('data-llegada', data.llegada || '');
        row.setAttribute('data-despacho', data.despacho || '');

        row.innerHTML = `
            <td class="clam-id">${clamNum}</td>
            <td>${data.inicio || '-'}</td>
            <td>${data.perdida || '-'}</td>
            <td>${data.termino || '-'}</td>
            <td>${data.llegada || '-'}</td>
            <td>${data.despacho || '-'}</td>
            <td>
                <button type="button" class="btn-edit-row" data-tipo="tiempos" title="Editar">
                    <i data-lucide="pencil"></i>
                </button>
                <button type="button" class="btn-delete-row" data-tipo="tiempos" title="Eliminar">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        `;

        tbody.appendChild(row);
        
        if (window.lucide) lucide.createIcons();

        // Evento de editar
        row.querySelector('.btn-edit-row').addEventListener('click', () => {
            editarFilaTiempos(clamNum, data);
        });

        // Evento de eliminar
        row.querySelector('.btn-delete-row').addEventListener('click', () => {
            eliminarFilaRelacionada(clamNum);
        });
    }

    // ========================================
    // EDITAR FILA DE PESOS
    // ========================================
    function editarFilaPesos(clamNum, dataActual) {
        Swal.fire({
            title: `Editar Registro #${clamNum}`,
            html: `
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <label style="display: block; text-align: left; margin-bottom: 5px;">N° Jarra:</label>
                        <input type="number" id="edit_jarra" class="swal2-input" value="${dataActual.jarra}" style="width: 90%; margin: 0;">
                    </div>
                    <div>
                        <label style="display: block; text-align: left; margin-bottom: 5px;">Peso 1 (g):</label>
                        <input type="number" id="edit_p1" class="swal2-input" step="0.1" value="${dataActual.p1}" style="width: 90%; margin: 0;">
                    </div>
                    <div>
                        <label style="display: block; text-align: left; margin-bottom: 5px;">Peso 2 (g):</label>
                        <input type="number" id="edit_p2" class="swal2-input" step="0.1" value="${dataActual.p2}" style="width: 90%; margin: 0;">
                    </div>
                </div>
            `,
            confirmButtonText: 'Guardar',
            confirmButtonColor: '#2f7cc0',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const jarra = document.getElementById('edit_jarra').value;
                const p1 = document.getElementById('edit_p1').value;
                const p2 = document.getElementById('edit_p2').value;

                if (!jarra || !p1 || !p2) {
                    Swal.showValidationMessage('Todos los campos son obligatorios');
                    return false;
                }

                return { jarra, p1, p2 };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const { jarra, p1, p2 } = result.value;
                
                // Actualizar en el almacenamiento
                datosEnsayos[tipoActual][ensayoActual].pesos[clamNum - 1] = { jarra, p1, p2 };
                
                // Recargar tabla
                restaurarDatosEnsayo(tipoActual, ensayoActual);
                
                Swal.fire({
                    title: 'Actualizado',
                    text: 'Registro actualizado correctamente',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    }

    // ========================================
    // EDITAR FILA DE TIEMPOS
    // ========================================
    function editarFilaTiempos(clamNum, dataActual) {
        Swal.fire({
            title: `Editar Tiempos #${clamNum}`,
            html: `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div>
                        <label style="display: block; text-align: left; margin-bottom: 5px;">Inicio Cosecha:</label>
                        <input type="time" id="edit_inicio" class="swal2-input" value="${dataActual.inicio || ''}" style="width: 90%; margin: 0;">
                    </div>
                    <div>
                        <label style="display: block; text-align: left; margin-bottom: 5px;">Pérdida Peso:</label>
                        <input type="time" id="edit_perdida" class="swal2-input" value="${dataActual.perdida || ''}" style="width: 90%; margin: 0;">
                    </div>
                    <div>
                        <label style="display: block; text-align: left; margin-bottom: 5px;">Término Cosecha:</label>
                        <input type="time" id="edit_termino" class="swal2-input" value="${dataActual.termino || ''}" style="width: 90%; margin: 0;">
                    </div>
                    <div>
                        <label style="display: block; text-align: left; margin-bottom: 5px;">Llegada Acopio:</label>
                        <input type="time" id="edit_llegada" class="swal2-input" value="${dataActual.llegada || ''}" style="width: 90%; margin: 0;">
                    </div>
                    <div>
                        <label style="display: block; text-align: left; margin-bottom: 5px;">Despacho Acopio:</label>
                        <input type="time" id="edit_despacho" class="swal2-input" value="${dataActual.despacho || ''}" style="width: 90%; margin: 0;">
                    </div>
                </div>
            `,
            confirmButtonText: 'Guardar',
            confirmButtonColor: '#2f7cc0',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                return {
                    inicio: document.getElementById('edit_inicio').value,
                    perdida: document.getElementById('edit_perdida').value,
                    termino: document.getElementById('edit_termino').value,
                    llegada: document.getElementById('edit_llegada').value,
                    despacho: document.getElementById('edit_despacho').value
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Actualizar en el almacenamiento
                datosEnsayos[tipoActual][ensayoActual].tiempos[clamNum - 1] = result.value;
                
                // Recargar tabla
                restaurarDatosEnsayo(tipoActual, ensayoActual);
                
                Swal.fire({
                    title: 'Actualizado',
                    text: 'Tiempos actualizados correctamente',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    }

    // ========================================
    // ELIMINAR FILA Y TODAS SUS RELACIONADAS
    // ========================================
    function eliminarFilaRelacionada(clamNum) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `Se eliminará el registro #${clamNum} de todas las tablas relacionadas`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Eliminar del almacenamiento (índice es posición - 1)
                datosEnsayos[tipoActual][ensayoActual].pesos.splice(clamNum - 1, 1);
                datosEnsayos[tipoActual][ensayoActual].tiempos.splice(clamNum - 1, 1);
                
                // Recargar tablas (esto renumerará automáticamente)
                restaurarDatosEnsayo(tipoActual, ensayoActual);
                
                Swal.fire({
                    title: 'Eliminado',
                    text: 'Registro eliminado correctamente',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    }

    // ========================================
    // SISTEMA DE TOGGLE DINÁMICO
    // ========================================
    function abrirCollapsible(bodyId) {
        const body = document.getElementById(bodyId);
        const header = document.querySelector(`[data-target="${bodyId}"]`);
        const chevron = header ? header.querySelector('.chevron') : null;
        
        if (body) body.style.display = 'block';
        if (chevron) chevron.classList.add('rotate');
    }

    function cerrarCollapsible(bodyId) {
        const body = document.getElementById(bodyId);
        const header = document.querySelector(`[data-target="${bodyId}"]`);
        const chevron = header ? header.querySelector('.chevron') : null;
        
        if (body) body.style.display = 'none';
        if (chevron) chevron.classList.remove('rotate');
    }

    function toggleCollapsible(bodyId) {
        const body = document.getElementById(bodyId);
        const isVisible = body && body.style.display === 'block';
        isVisible ? cerrarCollapsible(bodyId) : abrirCollapsible(bodyId);
    }

    // Registrar todos los toggles
    document.querySelectorAll('.collapsible-toggle').forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.getAttribute('data-target');
            if (targetId) toggleCollapsible(targetId);
        });
    });

    // ========================================
    // AÑADIR PESOS
    // ========================================
    const btnAddVisual = document.getElementById('btn-add-visual');
    if (btnAddVisual) {
        btnAddVisual.addEventListener('click', () => {
            if (!ensayoActual) {
                Swal.fire({ 
                    title: 'Atención', 
                    text: 'Primero selecciona un Rótulo de Muestra (Ensayo)', 
                    icon: 'warning' 
                });
                return;
            }
            
            const jarra = document.getElementById('v_jarra').value;
            const p1 = document.getElementById('v_peso1').value;
            const p2 = document.getElementById('v_peso2').value;

            if (jarra) {

                // Validamos p1 y p2: si están vacíos, ponemos un guion "-"
                const peso1Final = p1 ? p1 : "0";
                const peso2Final = p2 ? p2 : "0";

                const tbody = document.getElementById('tbody-visual');
                
                const rowData = {
                    jarra: jarra,
                    p1: peso1Final,
                    p2: peso2Final
                };
                
                // Agregar al almacenamiento
                datosEnsayos.visual[ensayoActual].pesos.push(rowData);
                
                // Número de clam = posición en el array
                const clamNum = datosEnsayos.visual[ensayoActual].pesos.length;
                
                // Agregar a la tabla
                agregarFilaPesos(rowData, tbody, clamNum);

                // Limpiar inputs
                document.getElementById('v_jarra').value = '';
                document.getElementById('v_peso1').value = '';
                document.getElementById('v_peso2').value = '';
                document.getElementById('v_jarra').focus();

            } else {
                Swal.fire({ title: 'Atención', text: 'Datos incompletos', icon: 'warning' });
            }
        });
    }

    // ========================================
    // AÑADIR TIEMPOS
    // ========================================
    const btnAddTiempos = document.getElementById('btn-add-tiempos');
    if (btnAddTiempos) {
        btnAddTiempos.addEventListener('click', () => {
            if (!ensayoActual) {
                Swal.fire({ 
                    title: 'Atención', 
                    text: 'Primero selecciona un Rótulo de Muestra (Ensayo)', 
                    icon: 'warning' 
                });
                return;
            }
            
            const inicio = document.getElementById('t_inicio_cosecha').value;
            const perdida = document.getElementById('t_perdida_peso').value;
            const termino = document.getElementById('t_termino_cosecha').value;
            const llegada = document.getElementById('t_llegada_acopio').value;
            const despacho = document.getElementById('t_despacho_acopio').value;

            if (inicio || perdida || termino || llegada || despacho) {
                const tbody = document.getElementById('tbody-tiempos');
                
                const rowData = {
                    inicio: inicio,
                    perdida: perdida,
                    termino: termino,
                    llegada: llegada,
                    despacho: despacho
                };
                
                // Agregar al almacenamiento
                datosEnsayos.visual[ensayoActual].tiempos.push(rowData);
                
                // Número de clam = posición en el array
                const clamNum = datosEnsayos.visual[ensayoActual].tiempos.length;
                
                // Agregar a la tabla
                agregarFilaTiempos(rowData, tbody, clamNum);

                // Limpiar inputs
                document.getElementById('t_inicio_cosecha').value = '';
                document.getElementById('t_perdida_peso').value = '';
                document.getElementById('t_termino_cosecha').value = '';
                document.getElementById('t_llegada_acopio').value = '';
                document.getElementById('t_despacho_acopio').value = '';
                document.getElementById('t_inicio_cosecha').focus();

            } else {
                Swal.fire({ title: 'Atención', text: 'Debes ingresar al menos un tiempo', icon: 'warning' });
            }
        });
    }

    // ========================================
    // 8. GUARDADO FINAL
    // ========================================
    const btnGuardarGeneral = document.getElementById('btn-guardar-registro');

    if (btnGuardarGeneral) {
        btnGuardarGeneral.addEventListener('click', () => {
            
            const form = document.getElementById('cosecha-form');
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const tipoMedicion = document.getElementById('tipo_medicion').value;
            if (!tipoMedicion) {
                Swal.fire({
                    title: 'Atención',
                    text: 'Debes seleccionar un tipo de medición',
                    icon: 'warning',
                    confirmButtonColor: '#2f7cc0'
                });
                return;
            }

            const rotuloSeleccionado = document.getElementById('reg_rotulo_ensayo').value;
            if (!rotuloSeleccionado) {
                Swal.fire({
                    title: 'Atención',
                    text: 'Debes seleccionar un Rótulo de Muestra (Ensayo)',
                    icon: 'warning',
                    confirmButtonColor: '#2f7cc0'
                });
                return;
            }

            // Validar que al menos UN ensayo tenga datos de PESOS
            let hayDatos = false;
            const datosDelTipo = datosEnsayos[tipoMedicion];
            
            for (let ensayo in datosDelTipo) {
                if (datosDelTipo[ensayo].pesos.length > 0) {
                    hayDatos = true;
                    break;
                }
            }

            if (!hayDatos) {
                Swal.fire({
                    title: 'Atención',
                    text: 'Debes agregar al menos un registro de peso en algún ensayo',
                    icon: 'warning',
                    confirmButtonColor: '#2f7cc0'
                });
                return;
            }

            // Construir array de ensayos con datos
            const ensayosConDatos = [];
            
            for (let numEnsayo in datosDelTipo) {
                const ensayo = datosDelTipo[numEnsayo];
                
                // Solo incluir ensayos que tengan datos de PESOS
                if (ensayo.pesos.length > 0) {
                    
                    // Combinar pesos y tiempos por POSICIÓN (índice del array)
                    const registrosCombinados = ensayo.pesos.map((peso, index) => {
                        // Buscar el tiempo en la MISMA POSICIÓN
                        const tiempoCorrespondiente = ensayo.tiempos[index] || {};
                        
                        return {
                            id_clam: index + 1, // El número de clam es la posición + 1
                            jarra: parseInt(peso.jarra),
                            peso_1: parseFloat(peso.p1),
                            peso_2: parseFloat(peso.p2),
                            tiempos: {
                                inicio_cosecha: tiempoCorrespondiente.inicio || null,
                                perdida_peso: tiempoCorrespondiente.perdida || null,
                                termino_cosecha: tiempoCorrespondiente.termino || null,
                                llegada_acopio: tiempoCorrespondiente.llegada || null,
                                despacho_acopio: tiempoCorrespondiente.despacho || null
                            }
                        };
                    });
                    
                    ensayosConDatos.push({
                        ensayo_numero: parseInt(numEnsayo),
                        ensayo_nombre: `Ensayo ${numEnsayo}`,
                        registros: registrosCombinados,
                        total_registros: registrosCombinados.length
                    });
                }
            }
            
            // Construcción del objeto final
            const payload = {
                fecha: document.getElementById('reg_fecha').value,
                responsable: document.getElementById('reg_responsable').value,
                guia_remision: document.getElementById('reg_guia_remision').value,
                variedad: document.getElementById('reg_variedad').value,
                placa_vehiculo: document.getElementById('reg_placa').value,
                hora_inicio: document.getElementById('reg_hora_inicio').value,
                dias_precosecha: document.getElementById('reg_dias_precosecha').value || null,
                tipo_medicion: tipoMedicion,
                trazabilidad: {
                    etapa: document.getElementById('reg_traz_etapa').value,
                    campo: document.getElementById('reg_traz_campo').value,
                    libre: document.getElementById('reg_traz_libre').value || null
                },
                ensayos: ensayosConDatos,
                resumen: {
                    total_ensayos: ensayosConDatos.length,
                    total_registros: ensayosConDatos.reduce((sum, e) => sum + e.total_registros, 0)
                }
            };

            console.log("═══════════════════════════════════════");
            console.log("📦 JSON FINAL PARA BACKEND:");
            console.log("═══════════════════════════════════════");
            console.log(JSON.stringify(payload, null, 2));
            console.log("═══════════════════════════════════════");
            
            Swal.fire({
                title: '¡Registro Exitoso!',
                text: 'Los datos se han guardado correctamente.',
                icon: 'success',
                confirmButtonColor: '#2f7cc0',
                confirmButtonText: 'Entendido'
            });
        });
    }
});