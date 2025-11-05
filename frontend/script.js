// ===== FUNCIONES GLOBALES =====

// Función para cerrar modal - GLOBAL
function cerrarModal() {
    const modalEditar = document.getElementById("modalEditar"); // Obtiene el elemento del modal de edición
    if (modalEditar) { // Verifica si el modal existe
        modalEditar.classList.remove("show"); // Remueve la clase 'show' para ocultar el modal
    }
}

// Función para cerrar modal de artículos
function cerrarModalArticulos() {
    const modal = document.getElementById("modalArticulos"); // Obtiene el elemento del modal de artículos
    if (modal) { // Verifica si el modal existe
        modal.remove(); // Elimina completamente el modal del DOM
    }
}

// Espera a que el DOM esté completamente cargado antes de ejecutar el código
document.addEventListener("DOMContentLoaded", () => {
    // Elementos principales
    const tabla = document.getElementById("detalle"); // Tabla donde se muestran los items de la compra
    const agregarItem = document.getElementById("agregarItem"); // Botón para agregar nuevos items
    const totalGeneralEl = document.getElementById("totalGeneral"); // Elemento que muestra el total general
    const formCompra = document.getElementById("formCompra"); // Formulario principal para registrar compras
    const listaCompras = document.getElementById("listaCompras"); // Tabla donde se listan las compras registradas
    
    // Elementos de pestañas
    const tabButtons = document.querySelectorAll(".tab-button"); // Todos los botones de pestañas
    const tabContents = document.querySelectorAll(".tab-content"); // Todos los contenidos de pestañas
    
    // Elementos del modal
    const modalEditar = document.getElementById("modalEditar"); // Modal para editar compras
    const closeModal = document.querySelector(".close"); // Botón para cerrar el modal
    const formEditarCompra = document.getElementById("formEditarCompra"); // Formulario dentro del modal de edición
    
    // Variables globales
    let totalGeneral = 0; // Almacena el total general de la compra actual
    let compras = []; // Array para almacenar todas las compras cargadas
    let itemsEdicion = []; // Array para los items durante la edición
    let totalGeneralEditar = 0; // Total general durante el proceso de edición

    // Precios fijos por tipo de papel - objeto con los precios predefinidos
    const precios = {
        "periodico": 7, // Periódico cuesta 7 Bs/kg
        "cuaderno": 3,  // Papel de cuaderno cuesta 3 Bs/kg
        "blanco": 9     // Papel blanco cuesta 9 Bs/kg
    };

    // ===== INICIALIZACIÓN DEL MODAL =====
    function inicializarModal() {
        console.log("🔄 Inicializando modal..."); // Mensaje de debug
        
        // Cerrar modal al hacer clic en la X
        if (closeModal) { // Verifica si el botón de cerrar existe
            closeModal.addEventListener("click", cerrarModal); // Asigna evento click para cerrar modal
        }

        // Cerrar modal al hacer clic fuera del contenido
        window.addEventListener("click", (e) => { // Evento click en toda la ventana
            if (e.target === modalEditar) { // Si se hizo click en el fondo del modal
                cerrarModal(); // Cierra el modal
            }
        });

        // Enviar formulario de edición
        if (formEditarCompra) { // Verifica si el formulario de edición existe
            formEditarCompra.addEventListener("submit", (e) => { // Evento al enviar el formulario
                e.preventDefault(); // Previene el envío normal del formulario
                
                // Obtiene los valores del formulario
                const id = document.getElementById("editarId").value; // ID de la compra
                const cliente = document.getElementById("editarCliente").value.trim(); // Nombre del cliente (sin espacios)

                // Validaciones
                if (!cliente) { // Si el cliente está vacío
                    alert("❌ El nombre del cliente no puede estar vacío"); // Muestra alerta
                    document.getElementById("editarCliente").focus(); // Enfoca el campo cliente
                    return; // Detiene la ejecución
                }

                if (itemsEdicion.length === 0) { // Si no hay items
                    alert("❌ La compra debe tener al menos un item"); // Muestra alerta
                    return; // Detiene la ejecución
                }

                // Prepara los datos para enviar al servidor
                const datosEdicion = {
                    id: id, // ID de la compra
                    cliente: cliente, // Nombre del cliente
                    items: itemsEdicion, // Array de items
                    totalGeneral: totalGeneralEditar // Total general
                };

                console.log("📤 Enviando datos de edición:", datosEdicion); // Debug

                // Mostrar loading en el botón de enviar
                const submitBtn = formEditarCompra.querySelector('button[type="submit"]'); // Obtiene el botón
                const originalText = submitBtn.innerHTML; // Guarda el texto original
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'; // Muestra spinner
                submitBtn.disabled = true; // Deshabilita el botón

                // Envía los datos al servidor
                fetch("../backend/editar_compra.php", { // Hace petición al backend
                    method: "POST", // Método POST
                    headers: { "Content-Type": "application/json" }, // Cabeceras JSON
                    body: JSON.stringify(datosEdicion) // Convierte datos a JSON
                })
                .then(response => response.text()) // Convierte respuesta a texto
                .then(data => { // Procesa la respuesta
                    console.log("📦 Datos recibidos (editar):", data); // Debug
                    
                    // Restaurar botón a su estado original
                    submitBtn.innerHTML = originalText; // Restaura el texto
                    submitBtn.disabled = false; // Habilita el botón
                    
                    if (data.includes("Error") || data.includes("error")) { // Si hay error
                        alert("❌ " + data); // Muestra alerta de error
                    } else { // Si fue exitoso
                        alert("✅ " + data); // Muestra alerta de éxito
                        cerrarModal(); // Cierra el modal
                        cargarCompras(); // Recarga la lista de compras
                    }
                })
                .catch(error => { // Manejo de errores
                    console.error("❌ Error:", error); // Debug del error
                    
                    // Restaurar botón
                    submitBtn.innerHTML = originalText; // Restaura el texto
                    submitBtn.disabled = false; // Habilita el botón
                    
                    alert("❌ Error de conexión al editar la compra"); // Muestra alerta
                });
            });
        }
        
        console.log("✅ Modal inicializado correctamente"); // Debug
    }

    // ===== FUNCIONALIDAD DE PESTAÑAS =====
    tabButtons.forEach(button => { // Itera sobre cada botón de pestaña
        button.addEventListener("click", () => { // Evento click en cada botón
            const tabId = button.getAttribute("data-tab"); // Obtiene el ID de la pestaña a mostrar
            
            // Actualizar botones activos - remueve la clase active de todos
            tabButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active"); // Agrega active al botón clickeado
            
            // Actualizar contenido activo - oculta todos los contenidos
            tabContents.forEach(content => content.classList.remove("active"));
            document.getElementById(tabId).classList.add("active"); // Muestra el contenido correspondiente
            
            // Si se activa la pestaña de gestión, cargar las compras
            if (tabId === "gestion") {
                cargarCompras(); // Carga las compras desde el servidor
            }
        });
    });

    // ===== FUNCIONALIDAD DE REGISTRO DE COMPRAS =====
    
    // Agregar fila nueva a la tabla de items
    agregarItem.addEventListener("click", () => { // Evento click en botón "Agregar Ítem"
        const fila = document.createElement("tr"); // Crea nueva fila de tabla

        // HTML de la nueva fila con inputs y selects
        fila.innerHTML = `
            <td>
                <select class="tipoPapel"> <!-- Selector del tipo de papel -->
                    <option value="periodico">Periódico</option>
                    <option value="cuaderno">Papel de Cuaderno</option>
                    <option value="blanco">Papel Blanco</option>
                </select>
            </td>
            <td><input type="number" class="cantidad" min="1" value="1"></td> <!-- Input para cantidad -->
            <td><input type="text" class="precio" readonly></td> <!-- Precio (solo lectura) -->
            <td><input type="text" class="total" readonly></td> <!-- Total (solo lectura) -->
            <td><button type="button" class="eliminar"><i class="fas fa-trash"></i></button></td> <!-- Botón eliminar -->
        `;

        tabla.appendChild(fila); // Agrega la fila a la tabla
        actualizarFila(fila); // Calcula y muestra precio y total

        // Eventos para recalcular al cambiar tipo o cantidad
        fila.querySelector(".tipoPapel").addEventListener("change", () => actualizarFila(fila)); // Al cambiar tipo
        fila.querySelector(".cantidad").addEventListener("input", () => actualizarFila(fila)); // Al cambiar cantidad
        fila.querySelector(".eliminar").addEventListener("click", () => eliminarFila(fila)); // Al eliminar
    });

    // Actualiza el precio y total por fila
    function actualizarFila(fila) {
        const tipo = fila.querySelector(".tipoPapel").value; // Obtiene el tipo seleccionado
        const cantidad = parseFloat(fila.querySelector(".cantidad").value) || 0; // Obtiene cantidad (0 si no es número)
        const precio = precios[tipo]; // Obtiene precio del tipo seleccionado
        const total = cantidad * precio; // Calcula total

        // Actualiza los campos en la interfaz
        fila.querySelector(".precio").value = precio.toFixed(2); // Muestra precio con 2 decimales
        fila.querySelector(".total").value = total.toFixed(2); // Muestra total con 2 decimales

        calcularTotalGeneral(); // Recalcula el total general
    }

    // Elimina fila y recalcula total
    function eliminarFila(fila) {
        fila.remove(); // Elimina la fila del DOM
        calcularTotalGeneral(); // Recalcula el total general
    }

    // Calcula el total general sumando todos los items
    function calcularTotalGeneral() {
        totalGeneral = 0; // Reinicia el total
        tabla.querySelectorAll(".total").forEach(t => { // Itera sobre todos los campos de total
            totalGeneral += parseFloat(t.value) || 0; // Suma cada total (0 si no es número)
        });
        totalGeneralEl.textContent = totalGeneral.toFixed(2); // Actualiza el elemento en la interfaz
    }

    // Enviar formulario al backend
    formCompra.addEventListener("submit", e => { // Evento al enviar el formulario
        e.preventDefault(); // Previene envío normal

        const cliente = document.getElementById("cliente").value; // Obtiene nombre del cliente
        const items = []; // Array para almacenar los items

        // Recorre todas las filas de la tabla
        tabla.querySelectorAll("tr").forEach(fila => {
            const tipo = fila.querySelector(".tipoPapel").value; // Tipo de papel
            const cantidad = fila.querySelector(".cantidad").value; // Cantidad
            const precio = fila.querySelector(".precio").value; // Precio
            const total = fila.querySelector(".total").value; // Total
            items.push({ tipo, cantidad, precio, total }); // Agrega item al array
        });

        if (items.length === 0) { // Validación: debe haber al menos un item
            alert("Debe agregar al menos un ítem a la compra");
            return;
        }

        // Envía datos al servidor
        fetch("../backend/guardar_compra.php", { // Petición al backend
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cliente, items, totalGeneral }) // Datos en JSON
        })
        .then(res => res.text()) // Convierte respuesta a texto
        .then(data => {
            alert(data); // Muestra respuesta del servidor
            formCompra.reset(); // Limpia el formulario
            tabla.innerHTML = ""; // Limpia la tabla de items
            totalGeneralEl.textContent = "0.00"; // Reinicia el total
            
            // Si estamos en la pestaña de gestión, recargar las compras
            if (document.getElementById("gestion").classList.contains("active")) {
                cargarCompras(); // Recarga la lista
            }
        })
        .catch(err => {
            console.error("Error:", err); // Debug del error
            alert("Error al guardar la compra"); // Alerta de error
        });
    });

    // ===== FUNCIONALIDAD DE GESTIÓN DE COMPRAS =====
    
    // Cargar compras desde el servidor
    function cargarCompras() {
        console.log("Cargando compras..."); // Debug
        
        // Mostrar mensaje de carga en la tabla
        listaCompras.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px;">
                    <i class="fas fa-spinner fa-spin"></i><br> <!-- Spinner de carga -->
                    Cargando compras...
                </td>
            </tr>
        `;

        // Hace petición al servidor para obtener las compras
        fetch("../backend/mostrar_compras.php")
            .then(response => {
                console.log("Respuesta del servidor:", response); // Debug
                if (!response.ok) { // Si la respuesta no es exitosa
                    throw new Error('Error en la respuesta del servidor: ' + response.status);
                }
                return response.json(); // Convierte respuesta a JSON
            })
            .then(data => {
                console.log("Datos recibidos:", data); // Debug
                
                // Verificar si hay error en la respuesta
                if (data && data.error) {
                    throw new Error(data.error); // Lanza error si existe
                }
                
                compras = data || []; // Almacena las compras o array vacío si no hay datos
                console.log(compras.length + " compras cargadas"); // Debug
                mostrarCompras(); // Muestra las compras en la tabla
            })
            .catch(error => {
                console.error("Error al cargar las compras:", error); // Debug
                // Muestra mensaje de error en la tabla
                listaCompras.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; color: #e53935; padding: 20px;">
                            <i class="fas fa-exclamation-triangle"></i><br>
                            Error al cargar las compras<br>
                            <small>${error.message}</small> <!-- Muestra el mensaje de error -->
                        </td>
                    </tr>
                `;
            });
    }

    // Mostrar compras en la tabla
    function mostrarCompras() {
        console.log("Mostrando compras:", compras); // Debug
        
        if (!compras || compras.length === 0) { // Si no hay compras
            listaCompras.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        <i class="fas fa-inbox"></i><br> <!-- Icono de vacío -->
                        No hay compras registradas
                    </td>
                </tr>
            `;
            return;
        }

        listaCompras.innerHTML = ""; // Limpia la tabla
        compras.forEach(compra => { // Itera sobre cada compra
            // Formatear fecha
            let fechaFormateada = "Fecha no disponible"; // Valor por defecto
            if (compra.fecha) { // Si hay fecha
                const fecha = new Date(compra.fecha); // Crea objeto Date
                if (!isNaN(fecha)) { // Si la fecha es válida
                    fechaFormateada = fecha.toLocaleDateString('es-ES', { // Formatea fecha en español
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            }

            const fila = document.createElement("tr"); // Crea fila para la compra
            fila.innerHTML = `
                <td>${compra.id || 'N/A'}</td> <!-- ID de compra -->
                <td>${compra.cliente || 'Sin nombre'}</td> <!-- Nombre del cliente -->
                <td>${fechaFormateada}</td> <!-- Fecha formateada -->
                <td>${parseFloat(compra.total_general || 0).toFixed(2)} Bs</td> <!-- Total con 2 decimales -->
                <td>
                    <!-- Botones de acciones -->
                    <button class="editar" data-id="${compra.id}" data-cliente="${compra.cliente || ''}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="articulos" data-id="${compra.id}">
                        <i class="fas fa-list"></i> Artículos
                    </button>
                    <button class="eliminar" data-id="${compra.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </td>
            `;
            listaCompras.appendChild(fila); // Agrega fila a la tabla
        });

        // Agregar eventos a los botones
        asignarEventosBotones();
    }

    // Función para asignar eventos a botones
    function asignarEventosBotones() {
        // Eventos para botones editar
        document.querySelectorAll(".editar").forEach(btn => {
            // Remover event listeners anteriores (para evitar duplicados)
            const newBtn = btn.cloneNode(true); // Clona el botón
            btn.parentNode.replaceChild(newBtn, btn); // Reemplaza el botón original
            
            // Agregar nuevo event listener al botón clonado
            newBtn.addEventListener("click", function(e) {
                e.preventDefault(); // Previene comportamiento por defecto
                e.stopPropagation(); // Evita propagación del evento
                
                console.log("✅ Botón editar clickeado"); // Debug
                const id = this.getAttribute("data-id"); // Obtiene ID de la compra
                const cliente = this.getAttribute("data-cliente"); // Obtiene nombre del cliente
                console.log("ID:", id, "Cliente:", cliente); // Debug
                
                abrirModalEditar(id, cliente); // Abre modal de edición
            });
        });

        // Eventos para botones artículos (misma lógica que editar)
        document.querySelectorAll(".articulos").forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log("✅ Botón artículos clickeado");
                const id = this.getAttribute("data-id");
                console.log("ID:", id);
                
                abrirModalArticulos(id); // Abre modal de artículos
            });
        });

        // Eventos para botones eliminar
        document.querySelectorAll(".eliminar").forEach(btn => {
            btn.addEventListener("click", function(e) {
                e.preventDefault(); // Previene comportamiento por defecto
                const id = this.getAttribute("data-id"); // Obtiene ID de la compra
                eliminarCompra(id); // Llama función para eliminar
            });
        });
    }

    // ===== FUNCIONALIDAD DEL BOTÓN ARTÍCULOS =====

    // Función para abrir modal de artículos
    function abrirModalArticulos(idCompra) {
        console.log("📦 Abriendo modal de artículos para compra ID:", idCompra); // Debug
        
        // Buscar la compra en el array de compras
        const compra = compras.find(c => c.id == idCompra);
        
        if (!compra) { // Si no se encuentra la compra
            alert("❌ No se encontró la compra");
            return;
        }
        
        // Crear modal dinámico para artículos
        crearModalArticulos(compra);
    }

    // Función para crear y mostrar modal de artículos
    function crearModalArticulos(compra) {
        // Cerrar modal existente si hay uno
        const modalExistente = document.getElementById('modalArticulos');
        if (modalExistente) {
            modalExistente.remove(); // Elimina modal existente
        }
        
        // Crear elemento modal
        const modal = document.createElement('div'); // Crea div para el modal
        modal.id = 'modalArticulos'; // Asigna ID
        modal.className = 'modal show'; // Asigna clases
        // HTML completo del modal
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2><i class="fas fa-list"></i> Artículos Comprados</h2>
                    <span class="close" onclick="cerrarModalArticulos()">&times;</span> <!-- Botón cerrar -->
                </div>
                <div class="modal-body">
                    <div class="info-compra">
                        <h4><i class="fas fa-receipt"></i> Información de la Compra</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <strong>ID Compra:</strong> <span>${compra.id || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <strong>Cliente:</strong> <span>${compra.cliente || 'Sin nombre'}</span>
                            </div>
                            <div class="info-item">
                                <strong>Fecha:</strong> <span>${compra.fecha ? new Date(compra.fecha).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) : 'No disponible'}</span>
                            </div>
                            <div class="info-item">
                                <strong>Total General:</strong> <span>${parseFloat(compra.total_general || 0).toFixed(2)} Bs</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <table id="tablaArticulos">
                            <thead>
                                <tr>
                                    <th>Tipo de Papel</th>
                                    <th>Cantidad (kg)</th>
                                    <th>Precio Unitario (Bs/kg)</th>
                                    <th>Total (Bs)</th>
                                </tr>
                            </thead>
                            <tbody id="listaArticulos">
                                <tr>
                                    <td colspan="4" style="text-align: center; padding: 20px;">
                                        <i class="fas fa-spinner fa-spin"></i><br>
                                        Cargando artículos...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="resumen-articulos">
                        <h3>Total de Artículos: <span id="totalArticulos">0</span></h3>
                        <h3>Suma Total: <span id="sumaTotalArticulos">0.00</span> Bs</h3>
                    </div>
                    
                    <div class="actions" style="justify-content: center; margin-top: 20px;">
                        <button type="button" class="btn-primary" onclick="cerrarModalArticulos()">
                            <i class="fas fa-times"></i> Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal); // Agrega el modal al body
        
        // Cargar los artículos de la compra
        cargarArticulosCompra(compra.id);
        
        // Agregar evento para cerrar modal al hacer clic fuera
        modal.addEventListener('click', function(e) {
            if (e.target === modal) { // Si se hace click en el fondo
                cerrarModalArticulos(); // Cierra el modal
            }
        });
    }

    // Función para cargar artículos de la compra desde el servidor
    function cargarArticulosCompra(idCompra) {
        fetch(`../backend/mostrar_compras.php?id_compra=${idCompra}`) // Petición con parámetro
            .then(response => response.json()) // Convierte a JSON
            .then(articulos => {
                console.log("📦 Artículos cargados:", articulos); // Debug
                mostrarArticulos(articulos); // Muestra los artículos
            })
            .catch(error => {
                console.error("❌ Error cargando artículos:", error); // Debug
                // Muestra error en la tabla
                document.getElementById('listaArticulos').innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; color: #e53935; padding: 20px;">
                            <i class="fas fa-exclamation-triangle"></i><br>
                            Error al cargar los artículos<br>
                            <small>${error.message}</small>
                        </td>
                    </tr>
                `;
            });
    }

    // Función para mostrar artículos en la tabla
    function mostrarArticulos(articulos) {
        const tbody = document.getElementById('listaArticulos'); // Obtiene el tbody
        
        if (!articulos || articulos.length === 0) { // Si no hay artículos
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 20px;">
                        <i class="fas fa-inbox"></i><br>
                        No hay artículos registrados para esta compra
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = ''; // Variable para acumular HTML
        let totalArticulos = 0; // Contador de artículos
        let sumaTotal = 0; // Acumulador del total
        
        articulos.forEach(articulo => { // Itera sobre cada artículo
            const cantidad = parseFloat(articulo.cantidad || 0); // Cantidad del artículo
            const precio = parseFloat(articulo.precio || 0); // Precio unitario
            const total = parseFloat(articulo.total || 0); // Total del artículo
            
            // Obtener nombre del tipo de papel
            let tipoNombre = 'Desconocido'; // Valor por defecto
            switch(articulo.tipo_papel) { // Evalúa el tipo de papel
                case 'periodico':
                    tipoNombre = 'Periódico';
                    break;
                case 'cuaderno':
                    tipoNombre = 'Papel de Cuaderno';
                    break;
                case 'blanco':
                    tipoNombre = 'Papel Blanco';
                    break;
                default:
                    tipoNombre = articulo.tipo_papel; // Usa el valor original si no coincide
            }
            
            // Agrega fila para el artículo
            html += `
                <tr>
                    <td><strong>${tipoNombre}</strong></td>
                    <td>${cantidad.toFixed(2)} kg</td> <!-- Cantidad con 2 decimales -->
                    <td>${precio.toFixed(2)} Bs/kg</td> <!-- Precio con 2 decimales -->
                    <td><strong>${total.toFixed(2)} Bs</strong></td> <!-- Total con 2 decimales -->
                </tr>
            `;
            
            totalArticulos++; // Incrementa contador
            sumaTotal += total; // Suma al total general
        });
        
        tbody.innerHTML = html; // Inserta el HTML en la tabla
        
        // Actualizar resumen con los totales calculados
        document.getElementById('totalArticulos').textContent = totalArticulos;
        document.getElementById('sumaTotalArticulos').textContent = sumaTotal.toFixed(2);
    }

    // ===== FUNCIONALIDAD DEL MODAL DE EDICIÓN COMPLETA =====
    
    // Abrir modal de edición
    function abrirModalEditar(id, cliente) {
        console.log("🔓 Abriendo modal para editar compra ID:", id, "Cliente:", cliente); // Debug
        
        // Verificar que el modal existe
        if (!modalEditar) {
            console.error("❌ Modal no encontrado");
            return;
        }
        
        // Buscar la compra completa en el array
        const compra = compras.find(c => c.id == id);
        
        if (compra) {
            // Llenar los campos del formulario con los datos de la compra
            document.getElementById("editarId").value = id; // ID oculto
            document.getElementById("editarCliente").value = cliente; // Nombre del cliente
            
            // Mostrar información adicional de la compra
            document.getElementById("infoId").textContent = compra.id || 'N/A'; // ID visible
            document.getElementById("infoFecha").textContent = compra.fecha ? 
                new Date(compra.fecha).toLocaleDateString('es-ES') : 'No disponible'; // Fecha formateada
            document.getElementById("infoTotal").textContent = 
                parseFloat(compra.total_general || 0).toFixed(2); // Total general
            
            // Cargar los detalles (items) de la compra
            cargarDetallesCompra(id);
        }
        
        // Mostrar el modal agregando la clase 'show'
        modalEditar.classList.add("show");
        console.log("✅ Modal visible con clase show"); // Debug
    }

    // Cargar detalles de la compra (items) desde el servidor
    function cargarDetallesCompra(idCompra) {
        console.log("📥 Cargando detalles para compra ID:", idCompra); // Debug
        
        // Usar mostrar_compras.php con parámetro id_compra
        fetch(`../backend/mostrar_compras.php?id_compra=${idCompra}`)
            .then(response => response.json()) // Convierte a JSON
            .then(detalles => {
                console.log("📦 Detalles cargados:", detalles); // Debug
                // Mapea los detalles al formato necesario para la edición
                itemsEdicion = detalles.map(item => ({
                    id: item.id, // ID del item
                    tipo: item.tipo_papel, // Tipo de papel
                    cantidad: parseFloat(item.cantidad), // Cantidad como número
                    precio: parseFloat(item.precio), // Precio como número
                    total: parseFloat(item.total) // Total como número
                }));
                mostrarItemsEdicion(); // Muestra los items en el modal
            })
            .catch(error => {
                console.error("❌ Error cargando detalles:", error); // Debug
                itemsEdicion = []; // Array vacío en caso de error
                mostrarItemsEdicion(); // Muestra tabla vacía
            });
    }

    // Mostrar items en la tabla de edición
    function mostrarItemsEdicion() {
        const tbody = document.getElementById("detalleEditar"); // Obtiene el tbody
        tbody.innerHTML = ''; // Limpia la tabla
        totalGeneralEditar = 0; // Reinicia el total
        
        itemsEdicion.forEach((item, index) => { // Itera sobre cada item con su índice
            const fila = document.createElement("tr"); // Crea fila
            // HTML de la fila con datos del item
            fila.innerHTML = `
                <td>
                    <select class="tipoPapelEditar" data-index="${index}"> <!-- Select con índice -->
                        <option value="periodico" ${item.tipo === 'periodico' ? 'selected' : ''}>Periódico</option>
                        <option value="cuaderno" ${item.tipo === 'cuaderno' ? 'selected' : ''}>Papel de Cuaderno</option>
                        <option value="blanco" ${item.tipo === 'blanco' ? 'selected' : ''}>Papel Blanco</option>
                    </select>
                </td>
                <td><input type="number" class="cantidadEditar" data-index="${index}" min="0.1" step="0.1" value="${item.cantidad}"></td>
                <td><input type="text" class="precioEditar" data-index="${index}" value="${item.precio.toFixed(2)}" readonly></td>
                <td><input type="text" class="totalEditar" data-index="${index}" value="${item.total.toFixed(2)}" readonly></td>
                <td>
                    <button type="button" class="eliminarItemEditar" data-index="${index}">
                        <i class="fas fa-trash"></i> <!-- Icono de basura -->
                    </button>
                </td>
            `;
            tbody.appendChild(fila); // Agrega fila a la tabla
            
            totalGeneralEditar += item.total; // Suma al total general
        });
        
        // Actualizar total general en la interfaz
        document.getElementById("totalGeneralEditar").textContent = totalGeneralEditar.toFixed(2);
        
        // Asignar eventos a los nuevos elementos
        asignarEventosEdicion();
    }

    // Asignar eventos a los elementos de edición
    function asignarEventosEdicion() {
        // Eventos para selects de tipo
        document.querySelectorAll(".tipoPapelEditar").forEach(select => {
            select.addEventListener("change", (e) => { // Al cambiar tipo
                const index = e.target.getAttribute("data-index"); // Obtiene índice
                actualizarItemEdicion(index); // Actualiza el item
            });
        });
        
        // Eventos para inputs de cantidad
        document.querySelectorAll(".cantidadEditar").forEach(input => {
            input.addEventListener("input", (e) => { // Al cambiar cantidad
                const index = e.target.getAttribute("data-index"); // Obtiene índice
                actualizarItemEdicion(index); // Actualiza el item
            });
        });
        
        // Eventos para botones eliminar
        document.querySelectorAll(".eliminarItemEditar").forEach(btn => {
            btn.addEventListener("click", (e) => { // Al hacer click en eliminar
                const index = e.target.closest('button').getAttribute("data-index"); // Obtiene índice del botón
                eliminarItemEdicion(index); // Elimina el item
            });
        });
    }

    // Actualizar item en edición
    function actualizarItemEdicion(index) {
        // Obtiene valores actuales de los inputs
        const tipo = document.querySelector(`.tipoPapelEditar[data-index="${index}"]`).value;
        const cantidad = parseFloat(document.querySelector(`.cantidadEditar[data-index="${index}"]`).value) || 0;
        const precio = precios[tipo]; // Obtiene precio según tipo
        const total = cantidad * precio; // Calcula nuevo total
        
        // Actualizar objeto en el array
        itemsEdicion[index].tipo = tipo;
        itemsEdicion[index].cantidad = cantidad;
        itemsEdicion[index].precio = precio;
        itemsEdicion[index].total = total;
        
        // Actualizar UI (interfaz de usuario)
        document.querySelector(`.precioEditar[data-index="${index}"]`).value = precio.toFixed(2);
        document.querySelector(`.totalEditar[data-index="${index}"]`).value = total.toFixed(2);
        
        // Recalcular total general
        recalcularTotalEdicion();
    }

    // Eliminar item en edición
    function eliminarItemEdicion(index) {
        if (itemsEdicion.length > 1) { // Verifica que quede al menos un item
            itemsEdicion.splice(index, 1); // Elimina el item del array
            mostrarItemsEdicion(); // Vuelve a mostrar los items
        } else {
            alert("❌ La compra debe tener al menos un item"); // Alerta si es el último
        }
    }

    // Recalcular total general en edición
    function recalcularTotalEdicion() {
        // Suma todos los totales de los items usando reduce
        totalGeneralEditar = itemsEdicion.reduce((total, item) => total + item.total, 0);
        document.getElementById("totalGeneralEditar").textContent = totalGeneralEditar.toFixed(2); // Actualiza UI
    }

    // Agregar nuevo item en edición
    document.getElementById("agregarItemEditar").addEventListener("click", () => {
        // Agrega nuevo item con valores por defecto
        itemsEdicion.push({
            id: null, // Nuevo item, no tiene ID en la base de datos
            tipo: "periodico", // Tipo por defecto
            cantidad: 1, // Cantidad por defecto
            precio: precios.periodico, // Precio según tipo
            total: precios.periodico // Total inicial
        });
        mostrarItemsEdicion(); // Muestra los items actualizados
    });

    // ===== FUNCIONALIDAD DE ELIMINACIÓN =====
    
    function eliminarCompra(id) {
        // Buscar la compra en el array para mostrar información
        const compra = compras.find(c => c.id == id);
        
        if (!compra) { // Si no se encuentra
            alert("❌ No se encontró la compra");
            return;
        }

        // Confirmación con detalles de la compra
        const confirmacion = confirm(
            `¿Está seguro de que desea eliminar esta compra?\n\n` +
            `📋 ID: ${compra.id}\n` +
            `👤 Cliente: ${compra.cliente || 'Sin nombre'}\n` +
            `💰 Total: ${parseFloat(compra.total_general || 0).toFixed(2)} Bs\n` +
            `📅 Fecha: ${compra.fecha ? new Date(compra.fecha).toLocaleDateString('es-ES') : 'No disponible'}\n\n` +
            `⚠️ Esta acción eliminará la compra y TODOS sus items. No se puede deshacer.`
        );

        if (!confirmacion) { // Si el usuario cancela
            return;
        }

        const formData = new FormData(); // Crea FormData para enviar
        formData.append("id", id); // Agrega ID al formulario

        console.log("🗑️ Eliminando compra ID:", id); // Debug

        // Mostrar loading en el botón de eliminar
        const botonesEliminar = document.querySelectorAll(`.eliminar[data-id="${id}"]`); // Todos los botones de esta compra
        botonesEliminar.forEach(btn => { // Itera sobre cada botón
            const originalHTML = btn.innerHTML; // Guarda HTML original
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; // Muestra spinner
            btn.disabled = true; // Deshabilita el botón

            // Envía petición de eliminación
            fetch("../backend/eliminar_compra.php", {
                method: "POST",
                body: formData // Envía FormData (no JSON)
            })
            .then(response => response.text()) // Convierte respuesta a texto
            .then(data => {
                console.log("📦 Respuesta eliminación:", data); // Debug
                
                // Restaurar botón a su estado original
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                
                if (data.includes("✅")) { // Si la respuesta indica éxito
                    alert(data); // Muestra mensaje
                    cargarCompras(); // Recarga la lista
                } else {
                    alert("❌ " + data); // Muestra error
                }
            })
            .catch(error => {
                console.error("❌ Error:", error); // Debug
                
                // Restaurar botón
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                
                alert("❌ Error de conexión al eliminar la compra"); // Alerta de error
            });
        });
    }

    // ===== INICIALIZACIÓN =====
    
    // Inicializar el modal al cargar la página
    inicializarModal();
    
    // Agregar una fila inicial al cargar la página
    agregarItem.click(); // Simula click en el botón agregar

    // Debug: Verificar que los elementos existen
    console.log("🔍 Elementos cargados:");
    console.log("Modal editar:", modalEditar);
    console.log("Close modal:", closeModal);
    console.log("Form editar:", formEditarCompra);
});