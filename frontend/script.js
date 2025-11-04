document.addEventListener("DOMContentLoaded", () => {
    // Elementos principales
    const tabla = document.getElementById("detalle");
    const agregarItem = document.getElementById("agregarItem");
    const totalGeneralEl = document.getElementById("totalGeneral");
    const formCompra = document.getElementById("formCompra");
    const listaCompras = document.getElementById("listaCompras");
    
    // Elementos de pestañas
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");
    
    // Elementos del modal
    const modalEditar = document.getElementById("modalEditar");
    const closeModal = document.querySelector(".close");
    const formEditarCompra = document.getElementById("formEditarCompra");
    
    // Variables globales
    let totalGeneral = 0;
    let compras = [];
    let itemsEdicion = [];
    let totalGeneralEditar = 0;

    // Precios fijos por tipo de papel
    const precios = {
        "periodico": 7,
        "cuaderno": 3,
        "blanco": 9
    };

    // ===== INICIALIZACIÓN DEL MODAL =====
    function inicializarModal() {
        console.log("🔄 Inicializando modal...");
        
        // Cerrar modal
        if (closeModal) {
            closeModal.addEventListener("click", cerrarModal);
        }

        // Cerrar modal al hacer clic fuera
        window.addEventListener("click", (e) => {
            if (e.target === modalEditar) {
                cerrarModal();
            }
        });

        // Enviar formulario de edición
        if (formEditarCompra) {
            formEditarCompra.addEventListener("submit", (e) => {
                e.preventDefault();
                
                const id = document.getElementById("editarId").value;
                const cliente = document.getElementById("editarCliente").value.trim();

                if (!cliente) {
                    alert("❌ El nombre del cliente no puede estar vacío");
                    document.getElementById("editarCliente").focus();
                    return;
                }

                if (itemsEdicion.length === 0) {
                    alert("❌ La compra debe tener al menos un item");
                    return;
                }

                const datosEdicion = {
                    id: id,
                    cliente: cliente,
                    items: itemsEdicion,
                    totalGeneral: totalGeneralEditar
                };

                console.log("📤 Enviando datos de edición:", datosEdicion);

                // Mostrar loading
                const submitBtn = formEditarCompra.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
                submitBtn.disabled = true;

                fetch("../backend/editar_compra.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(datosEdicion)
                })
                .then(response => response.text())
                .then(data => {
                    console.log("📦 Datos recibidos (editar):", data);
                    
                    // Restaurar botón
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    
                    if (data.includes("Error") || data.includes("error")) {
                        alert("❌ " + data);
                    } else {
                        alert("✅ " + data);
                        cerrarModal();
                        cargarCompras(); // Recargar la lista
                    }
                })
                .catch(error => {
                    console.error("❌ Error:", error);
                    
                    // Restaurar botón
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    
                    alert("❌ Error de conexión al editar la compra");
                });
            });
        }
        
        console.log("✅ Modal inicializado correctamente");
    }

    // ===== FUNCIONALIDAD DE PESTAÑAS =====
    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            const tabId = button.getAttribute("data-tab");
            
            // Actualizar botones activos
            tabButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            
            // Actualizar contenido activo
            tabContents.forEach(content => content.classList.remove("active"));
            document.getElementById(tabId).classList.add("active");
            
            // Si se activa la pestaña de gestión, cargar las compras
            if (tabId === "gestion") {
                cargarCompras();
            }
        });
    });

    // ===== FUNCIONALIDAD DE REGISTRO DE COMPRAS =====
    
    // Agregar fila nueva
    agregarItem.addEventListener("click", () => {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>
                <select class="tipoPapel">
                    <option value="periodico">Periódico</option>
                    <option value="cuaderno">Papel de Cuaderno</option>
                    <option value="blanco">Papel Blanco</option>
                </select>
            </td>
            <td><input type="number" class="cantidad" min="1" value="1"></td>
            <td><input type="text" class="precio" readonly></td>
            <td><input type="text" class="total" readonly></td>
            <td><button type="button" class="eliminar"><i class="fas fa-trash"></i></button></td>
        `;

        tabla.appendChild(fila);
        actualizarFila(fila);

        // Eventos para recalcular al cambiar tipo o cantidad
        fila.querySelector(".tipoPapel").addEventListener("change", () => actualizarFila(fila));
        fila.querySelector(".cantidad").addEventListener("input", () => actualizarFila(fila));
        fila.querySelector(".eliminar").addEventListener("click", () => eliminarFila(fila));
    });

    // Actualiza el precio y total por fila
    function actualizarFila(fila) {
        const tipo = fila.querySelector(".tipoPapel").value;
        const cantidad = parseFloat(fila.querySelector(".cantidad").value) || 0;
        const precio = precios[tipo];
        const total = cantidad * precio;

        fila.querySelector(".precio").value = precio.toFixed(2);
        fila.querySelector(".total").value = total.toFixed(2);

        calcularTotalGeneral();
    }

    // Elimina fila y recalcula total
    function eliminarFila(fila) {
        fila.remove();
        calcularTotalGeneral();
    }

    // Calcula el total general
    function calcularTotalGeneral() {
        totalGeneral = 0;
        tabla.querySelectorAll(".total").forEach(t => {
            totalGeneral += parseFloat(t.value) || 0;
        });
        totalGeneralEl.textContent = totalGeneral.toFixed(2);
    }

    // Enviar formulario al backend
    formCompra.addEventListener("submit", e => {
        e.preventDefault();

        const cliente = document.getElementById("cliente").value;
        const items = [];

        tabla.querySelectorAll("tr").forEach(fila => {
            const tipo = fila.querySelector(".tipoPapel").value;
            const cantidad = fila.querySelector(".cantidad").value;
            const precio = fila.querySelector(".precio").value;
            const total = fila.querySelector(".total").value;
            items.push({ tipo, cantidad, precio, total });
        });

        if (items.length === 0) {
            alert("Debe agregar al menos un ítem a la compra");
            return;
        }

        fetch("../backend/guardar_compra.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cliente, items, totalGeneral })
        })
        .then(res => res.text())
        .then(data => {
            alert(data);
            formCompra.reset();
            tabla.innerHTML = "";
            totalGeneralEl.textContent = "0.00";
            
            // Si estamos en la pestaña de gestión, recargar las compras
            if (document.getElementById("gestion").classList.contains("active")) {
                cargarCompras();
            }
        })
        .catch(err => {
            console.error("Error:", err);
            alert("Error al guardar la compra");
        });
    });

    // ===== FUNCIONALIDAD DE GESTIÓN DE COMPRAS =====
    
    // Cargar compras desde el servidor
    function cargarCompras() {
        console.log("Cargando compras...");
        
        // Mostrar mensaje de carga
        listaCompras.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px;">
                    <i class="fas fa-spinner fa-spin"></i><br>
                    Cargando compras...
                </td>
            </tr>
        `;

        fetch("../backend/mostrar_compras.php")
            .then(response => {
                console.log("Respuesta del servidor:", response);
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log("Datos recibidos:", data);
                
                // Verificar si hay error en la respuesta
                if (data && data.error) {
                    throw new Error(data.error);
                }
                
                compras = data || [];
                console.log(compras.length + " compras cargadas");
                mostrarCompras();
            })
            .catch(error => {
                console.error("Error al cargar las compras:", error);
                listaCompras.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; color: #e53935; padding: 20px;">
                            <i class="fas fa-exclamation-triangle"></i><br>
                            Error al cargar las compras<br>
                            <small>${error.message}</small>
                        </td>
                    </tr>
                `;
            });
    }

    // Mostrar compras en la tabla
    function mostrarCompras() {
        console.log("Mostrando compras:", compras);
        
        if (!compras || compras.length === 0) {
            listaCompras.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        <i class="fas fa-inbox"></i><br>
                        No hay compras registradas
                    </td>
                </tr>
            `;
            return;
        }

        listaCompras.innerHTML = "";
        compras.forEach(compra => {
            // Formatear fecha
            let fechaFormateada = "Fecha no disponible";
            if (compra.fecha) {
                const fecha = new Date(compra.fecha);
                if (!isNaN(fecha)) {
                    fechaFormateada = fecha.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            }

            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${compra.id || 'N/A'}</td>
                <td>${compra.cliente || 'Sin nombre'}</td>
                <td>${fechaFormateada}</td>
                <td>${parseFloat(compra.total_general || 0).toFixed(2)} Bs</td>
                <td>
                    <button class="editar" data-id="${compra.id}" data-cliente="${compra.cliente || ''}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="eliminar" data-id="${compra.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </td>
            `;
            listaCompras.appendChild(fila);
        });

        // Agregar eventos a los botones
        asignarEventosBotones();
    }

    // Función para asignar eventos a botones
    function asignarEventosBotones() {
        // Eventos para botones editar
        document.querySelectorAll(".editar").forEach(btn => {
            // Remover event listeners anteriores
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Agregar nuevo event listener
            newBtn.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log("✅ Botón editar clickeado");
                const id = this.getAttribute("data-id");
                const cliente = this.getAttribute("data-cliente");
                console.log("ID:", id, "Cliente:", cliente);
                
                abrirModalEditar(id, cliente);
            });
        });

        // Eventos para botones eliminar
        document.querySelectorAll(".eliminar").forEach(btn => {
            btn.addEventListener("click", function(e) {
                e.preventDefault();
                const id = this.getAttribute("data-id");
                eliminarCompra(id);
            });
        });
    }

    // ===== FUNCIONALIDAD DEL MODAL DE EDICIÓN COMPLETA =====
    
    // Abrir modal de edición
    function abrirModalEditar(id, cliente) {
        console.log("🔓 Abriendo modal para editar compra ID:", id, "Cliente:", cliente);
        
        // Verificar que el modal existe
        if (!modalEditar) {
            console.error("❌ Modal no encontrado");
            return;
        }
        
        // Buscar la compra completa para mostrar más información
        const compra = compras.find(c => c.id == id);
        
        if (compra) {
            // Llenar los campos del formulario
            document.getElementById("editarId").value = id;
            document.getElementById("editarCliente").value = cliente;
            
            // Mostrar información adicional de la compra
            document.getElementById("infoId").textContent = compra.id || 'N/A';
            document.getElementById("infoFecha").textContent = compra.fecha ? 
                new Date(compra.fecha).toLocaleDateString('es-ES') : 'No disponible';
            document.getElementById("infoTotal").textContent = 
                parseFloat(compra.total_general || 0).toFixed(2);
            
            // Cargar los detalles de la compra
            cargarDetallesCompra(id);
        }
        
        // Mostrar el modal usando la clase show
        modalEditar.classList.add("show");
        console.log("✅ Modal visible con clase show");
    }

    // Función para cerrar modal
    function cerrarModal() {
        if (modalEditar) {
            modalEditar.classList.remove("show");
        }
    }

    // Cargar detalles de la compra
    function cargarDetallesCompra(idCompra) {
        console.log("📥 Cargando detalles para compra ID:", idCompra);
        
        fetch(`../backend/mostrar_detalle_compra.php?id_compra=${idCompra}`)
            .then(response => response.json())
            .then(detalles => {
                console.log("📦 Detalles cargados:", detalles);
                itemsEdicion = detalles.map(item => ({
                    id: item.id,
                    tipo: item.tipo_papel,
                    cantidad: parseFloat(item.cantidad),
                    precio: parseFloat(item.precio),
                    total: parseFloat(item.total)
                }));
                mostrarItemsEdicion();
            })
            .catch(error => {
                console.error("❌ Error cargando detalles:", error);
                itemsEdicion = [];
                mostrarItemsEdicion();
            });
    }

    // Mostrar items en la tabla de edición
    function mostrarItemsEdicion() {
        const tbody = document.getElementById("detalleEditar");
        tbody.innerHTML = '';
        totalGeneralEditar = 0;
        
        itemsEdicion.forEach((item, index) => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>
                    <select class="tipoPapelEditar" data-index="${index}">
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
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(fila);
            
            totalGeneralEditar += item.total;
        });
        
        // Actualizar total general
        document.getElementById("totalGeneralEditar").textContent = totalGeneralEditar.toFixed(2);
        
        // Asignar eventos a los nuevos elementos
        asignarEventosEdicion();
    }

    // Asignar eventos a los elementos de edición
    function asignarEventosEdicion() {
        // Eventos para selects de tipo
        document.querySelectorAll(".tipoPapelEditar").forEach(select => {
            select.addEventListener("change", (e) => {
                const index = e.target.getAttribute("data-index");
                actualizarItemEdicion(index);
            });
        });
        
        // Eventos para inputs de cantidad
        document.querySelectorAll(".cantidadEditar").forEach(input => {
            input.addEventListener("input", (e) => {
                const index = e.target.getAttribute("data-index");
                actualizarItemEdicion(index);
            });
        });
        
        // Eventos para botones eliminar
        document.querySelectorAll(".eliminarItemEditar").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const index = e.target.closest('button').getAttribute("data-index");
                eliminarItemEdicion(index);
            });
        });
    }

    // Actualizar item en edición
    function actualizarItemEdicion(index) {
        const tipo = document.querySelector(`.tipoPapelEditar[data-index="${index}"]`).value;
        const cantidad = parseFloat(document.querySelector(`.cantidadEditar[data-index="${index}"]`).value) || 0;
        const precio = precios[tipo];
        const total = cantidad * precio;
        
        // Actualizar objeto
        itemsEdicion[index].tipo = tipo;
        itemsEdicion[index].cantidad = cantidad;
        itemsEdicion[index].precio = precio;
        itemsEdicion[index].total = total;
        
        // Actualizar UI
        document.querySelector(`.precioEditar[data-index="${index}"]`).value = precio.toFixed(2);
        document.querySelector(`.totalEditar[data-index="${index}"]`).value = total.toFixed(2);
        
        // Recalcular total general
        recalcularTotalEdicion();
    }

    // Eliminar item en edición
    function eliminarItemEdicion(index) {
        if (itemsEdicion.length > 1) {
            itemsEdicion.splice(index, 1);
            mostrarItemsEdicion();
        } else {
            alert("❌ La compra debe tener al menos un item");
        }
    }

    // Recalcular total general en edición
    function recalcularTotalEdicion() {
        totalGeneralEditar = itemsEdicion.reduce((total, item) => total + item.total, 0);
        document.getElementById("totalGeneralEditar").textContent = totalGeneralEditar.toFixed(2);
    }

    // Agregar nuevo item en edición
    document.getElementById("agregarItemEditar").addEventListener("click", () => {
        itemsEdicion.push({
            id: null, // Nuevo item, no tiene ID
            tipo: "periodico",
            cantidad: 1,
            precio: precios.periodico,
            total: precios.periodico
        });
        mostrarItemsEdicion();
    });

    // ===== FUNCIONALIDAD DE ELIMINACIÓN =====
    
    function eliminarCompra(id) {
        // Buscar la compra para mostrar información
        const compra = compras.find(c => c.id == id);
        
        if (!compra) {
            alert("❌ No se encontró la compra");
            return;
        }

        const confirmacion = confirm(
            `¿Está seguro de que desea eliminar esta compra?\n\n` +
            `📋 ID: ${compra.id}\n` +
            `👤 Cliente: ${compra.cliente || 'Sin nombre'}\n` +
            `💰 Total: ${parseFloat(compra.total_general || 0).toFixed(2)} Bs\n` +
            `📅 Fecha: ${compra.fecha ? new Date(compra.fecha).toLocaleDateString('es-ES') : 'No disponible'}\n\n` +
            `⚠️ Esta acción eliminará la compra y TODOS sus items. No se puede deshacer.`
        );

        if (!confirmacion) {
            return;
        }

        const formData = new FormData();
        formData.append("id", id);

        console.log("🗑️ Eliminando compra ID:", id);

        // Mostrar loading en el botón de eliminar
        const botonesEliminar = document.querySelectorAll(`.eliminar[data-id="${id}"]`);
        botonesEliminar.forEach(btn => {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;

            fetch("../backend/eliminar_compra.php", {
                method: "POST",
                body: formData
            })
            .then(response => response.text())
            .then(data => {
                console.log("📦 Respuesta eliminación:", data);
                
                // Restaurar botón
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                
                if (data.includes("✅")) {
                    alert(data);
                    cargarCompras(); // Recargar la lista
                } else {
                    alert("❌ " + data);
                }
            })
            .catch(error => {
                console.error("❌ Error:", error);
                
                // Restaurar botón
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                
                alert("❌ Error de conexión al eliminar la compra");
            });
        });
    }

    // ===== INICIALIZACIÓN =====
    
    // Inicializar el modal al cargar la página
    inicializarModal();
    
    // Agregar una fila inicial al cargar la página
    agregarItem.click();

    // Debug: Verificar que los elementos existen
    console.log("🔍 Elementos cargados:");
    console.log("Modal editar:", modalEditar);
    console.log("Close modal:", closeModal);
    console.log("Form editar:", formEditarCompra);
});