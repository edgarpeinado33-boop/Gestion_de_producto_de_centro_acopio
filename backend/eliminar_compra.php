<?php
include 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Verificar que el ID esté presente
    if (!isset($_POST['id'])) {
        echo "❌ Error: ID de compra no proporcionado";
        exit;
    }

    $id = $_POST['id'];

    // Validar que el ID sea numérico
    if (!is_numeric($id)) {
        echo "❌ Error: ID inválido";
        exit;
    }

    // Iniciar transacción para mayor seguridad
    $conn->begin_transaction();

    try {
        // Gracias al ON DELETE CASCADE, solo necesitamos eliminar la compra
        // y los detalles se eliminarán automáticamente
        $stmt = $conn->prepare("DELETE FROM compras WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                $conn->commit();
                echo "✅ Compra y todos sus items eliminados correctamente";
            } else {
                $conn->rollback();
                echo "❌ No se encontró la compra con ID: " . $id;
            }
        } else {
            $conn->rollback();
            echo "❌ Error al eliminar la compra: " . $conn->error;
        }

        $stmt->close();
        
    } catch (Exception $e) {
        $conn->rollback();
        echo "❌ Error en la transacción: " . $e->getMessage();
    }

    $conn->close();
    
} else {
    echo "❌ Método no permitido";
}
?>