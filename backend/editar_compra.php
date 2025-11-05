<?php
include 'conexion.php'; // Incluye el archivo de conexión a la base de datos

if ($_SERVER['REQUEST_METHOD'] === 'POST') { // Verifica si la solicitud es de tipo POST
    
    // Verificar si es JSON (edición completa) o FormData (solo cliente)
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : ''; // Obtiene y limpia el tipo de contenido de la solicitud
    
    if (strpos($contentType, 'application/json') !== false) { // Si el contenido es JSON
        // Es una edición completa (JSON)
        $data = json_decode(file_get_contents("php://input"), true); // Decodifica el JSON recibido a array PHP
        
        $id = $data["id"]; // Obtiene el ID de la compra
        $cliente = $data["cliente"]; // Obtiene el nombre del cliente
        $totalGeneral = $data["totalGeneral"]; // Obtiene el total general
        $items = $data["items"]; // Obtiene el array de items
        
        // Iniciar transacción
        $conn->begin_transaction(); // Inicia transacción para operaciones atómicas
        
        try {
            // 1. Actualizar encabezado de compra
            $sqlCompra = "UPDATE compras SET cliente = ?, total_general = ? WHERE id = ?"; // Query para actualizar compra
            $stmtCompra = $conn->prepare($sqlCompra); // Prepara la consulta
            $stmtCompra->bind_param("sdi", $cliente, $totalGeneral, $id); // Asocia parámetros (string, double, integer)
            
            if (!$stmtCompra->execute()) { // Ejecuta y verifica si falla
                throw new Exception("Error al actualizar compra: " . $conn->error); // Lanza excepción si hay error
            }
            
            // 2. Eliminar detalles antiguos
            $sqlEliminar = "DELETE FROM detalle_compra WHERE id_compra = ?"; // Query para eliminar detalles antiguos
            $stmtEliminar = $conn->prepare($sqlEliminar); // Prepara la consulta
            $stmtEliminar->bind_param("i", $id); // Asocia parámetro (integer)
            
            if (!$stmtEliminar->execute()) { // Ejecuta y verifica si falla
                throw new Exception("Error al eliminar detalles: " . $conn->error); // Lanza excepción si hay error
            }
            
            // 3. Insertar nuevos detalles
            $sqlInsertar = "INSERT INTO detalle_compra (id_compra, tipo_papel, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)"; // Query para insertar nuevos detalles
            $stmtInsertar = $conn->prepare($sqlInsertar); // Prepara la consulta
            
            foreach ($items as $item) { // Itera sobre cada item del array
                $tipo = $item["tipo"]; // Obtiene tipo de papel
                $cantidad = $item["cantidad"]; // Obtiene cantidad
                $precio = $item["precio"]; // Obtiene precio
                $total = $item["total"]; // Obtiene total
                
                $stmtInsertar->bind_param("isddd", $id, $tipo, $cantidad, $precio, $total); // Asocia parámetros (integer, string, double, double, double)
                if (!$stmtInsertar->execute()) { // Ejecuta y verifica si falla
                    throw new Exception("Error al insertar detalle: " . $conn->error); // Lanza excepción si hay error
                }
            }
            
            // Confirmar transacción
            $conn->commit(); // Confirma todos los cambios en la base de datos
            echo "✅ Compra actualizada correctamente"; // Mensaje de éxito
            
        } catch (Exception $e) { // Captura cualquier excepción
            // Revertir transacción en caso de error
            $conn->rollback(); // Revierte todos los cambios en caso de error
            echo "❌ Error: " . $e->getMessage(); // Muestra mensaje de error
        }
        
        $stmtCompra->close(); // Cierra el statement de compra
        $stmtEliminar->close(); // Cierra el statement de eliminación
        $stmtInsertar->close(); // Cierra el statement de inserción
        
    } else { // Si no es JSON, asume que es FormData
        // Es una edición simple (solo cliente - FormData)
        // Verificar que los datos necesarios estén presentes
        if (!isset($_POST['id']) || !isset($_POST['cliente'])) { // Verifica que existan los parámetros requeridos
            echo "❌ Error: Datos incompletos"; // Mensaje de error
            exit; // Termina la ejecución
        }

        $id = $_POST['id']; // Obtiene ID desde POST
        $cliente = trim($_POST['cliente']); // Obtiene y limpia nombre del cliente

        // Validar datos
        if (empty($cliente)) { // Verifica que el cliente no esté vacío
            echo "❌ Error: El nombre del cliente no puede estar vacío"; // Mensaje de error
            exit; // Termina la ejecución
        }

        // Escapar caracteres especiales para seguridad
        $cliente = $conn->real_escape_string($cliente); // Escapa caracteres especiales para prevenir inyecciones

        // Preparar y ejecutar la consulta
        $stmt = $conn->prepare("UPDATE compras SET cliente = ? WHERE id = ?"); // Prepara consulta para actualizar solo el cliente
        $stmt->bind_param("si", $cliente, $id); // Asocia parámetros (string, integer)

        if ($stmt->execute()) { // Ejecuta la consulta
            if ($stmt->affected_rows > 0) { // Verifica si se afectaron filas
                echo "✅ Cliente actualizado correctamente"; // Mensaje de éxito
            } else {
                echo "ℹ️ No se realizaron cambios (el cliente ya tenía ese nombre)"; // Mensaje informativo
            }
        } else {
            echo "❌ Error al actualizar: " . $conn->error; // Mensaje de error
        }

        $stmt->close(); // Cierra el statement
    }
    
    $conn->close(); // Cierra la conexión a la base de datos
    
} else { // Si no es método POST
    echo "❌ Método no permitido"; // Mensaje de error
}
?>