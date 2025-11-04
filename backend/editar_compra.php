<?php
include 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Verificar si es JSON (edición completa) o FormData (solo cliente)
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    
    if (strpos($contentType, 'application/json') !== false) {
        // Es una edición completa (JSON)
        $data = json_decode(file_get_contents("php://input"), true);
        
        $id = $data["id"];
        $cliente = $data["cliente"];
        $totalGeneral = $data["totalGeneral"];
        $items = $data["items"];
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            // 1. Actualizar encabezado de compra
            $sqlCompra = "UPDATE compras SET cliente = ?, total_general = ? WHERE id = ?";
            $stmtCompra = $conn->prepare($sqlCompra);
            $stmtCompra->bind_param("sdi", $cliente, $totalGeneral, $id);
            
            if (!$stmtCompra->execute()) {
                throw new Exception("Error al actualizar compra: " . $conn->error);
            }
            
            // 2. Eliminar detalles antiguos
            $sqlEliminar = "DELETE FROM detalle_compra WHERE id_compra = ?";
            $stmtEliminar = $conn->prepare($sqlEliminar);
            $stmtEliminar->bind_param("i", $id);
            
            if (!$stmtEliminar->execute()) {
                throw new Exception("Error al eliminar detalles: " . $conn->error);
            }
            
            // 3. Insertar nuevos detalles
            $sqlInsertar = "INSERT INTO detalle_compra (id_compra, tipo_papel, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)";
            $stmtInsertar = $conn->prepare($sqlInsertar);
            
            foreach ($items as $item) {
                $tipo = $item["tipo"];
                $cantidad = $item["cantidad"];
                $precio = $item["precio"];
                $total = $item["total"];
                
                $stmtInsertar->bind_param("isddd", $id, $tipo, $cantidad, $precio, $total);
                if (!$stmtInsertar->execute()) {
                    throw new Exception("Error al insertar detalle: " . $conn->error);
                }
            }
            
            // Confirmar transacción
            $conn->commit();
            echo "✅ Compra actualizada correctamente";
            
        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $conn->rollback();
            echo "❌ Error: " . $e->getMessage();
        }
        
        $stmtCompra->close();
        $stmtEliminar->close();
        $stmtInsertar->close();
        
    } else {
        // Es una edición simple (solo cliente - FormData)
        // Verificar que los datos necesarios estén presentes
        if (!isset($_POST['id']) || !isset($_POST['cliente'])) {
            echo "❌ Error: Datos incompletos";
            exit;
        }

        $id = $_POST['id'];
        $cliente = trim($_POST['cliente']);

        // Validar datos
        if (empty($cliente)) {
            echo "❌ Error: El nombre del cliente no puede estar vacío";
            exit;
        }

        // Escapar caracteres especiales para seguridad
        $cliente = $conn->real_escape_string($cliente);

        // Preparar y ejecutar la consulta
        $stmt = $conn->prepare("UPDATE compras SET cliente = ? WHERE id = ?");
        $stmt->bind_param("si", $cliente, $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo "✅ Cliente actualizado correctamente";
            } else {
                echo "ℹ️ No se realizaron cambios (el cliente ya tenía ese nombre)";
            }
        } else {
            echo "❌ Error al actualizar: " . $conn->error;
        }

        $stmt->close();
    }
    
    $conn->close();
    
} else {
    echo "❌ Método no permitido";
}
?>