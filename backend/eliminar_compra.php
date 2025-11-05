<?php
include 'conexion.php'; // Incluye el archivo de conexión a la base de datos

if ($_SERVER['REQUEST_METHOD'] === 'POST') { // Verifica si la solicitud es de tipo POST
    
    // Verificar que el ID esté presente
    if (!isset($_POST['id'])) { // Comprueba si el parámetro 'id' existe en POST
        echo "❌ Error: ID de compra no proporcionado"; // Mensaje de error
        exit; // Termina la ejecución del script
    }

    $id = $_POST['id']; // Obtiene el ID de la compra desde los datos POST

    // Validar que el ID sea numérico
    if (!is_numeric($id)) { // Verifica si el ID es un valor numérico
        echo "❌ Error: ID inválido"; // Mensaje de error si no es numérico
        exit; // Termina la ejecución
    }

    // Iniciar transacción para mayor seguridad
    $conn->begin_transaction(); // Inicia una transacción de base de datos

    try {
        // Gracias al ON DELETE CASCADE, solo necesitamos eliminar la compra
        // y los detalles se eliminarán automáticamente
        $stmt = $conn->prepare("DELETE FROM compras WHERE id = ?"); // Prepara consulta para eliminar compra
        $stmt->bind_param("i", $id); // Asocia el parámetro ID (tipo integer)

        if ($stmt->execute()) { // Ejecuta la consulta de eliminación
            if ($stmt->affected_rows > 0) { // Verifica si se eliminó alguna fila
                $conn->commit(); // Confirma la transacción
                echo "✅ Compra y todos sus items eliminados correctamente"; // Mensaje de éxito
            } else {
                $conn->rollback(); // Revierte la transacción
                echo "❌ No se encontró la compra con ID: " . $id; // Mensaje de no encontrado
            }
        } else {
            $conn->rollback(); // Revierte la transacción por error de ejecución
            echo "❌ Error al eliminar la compra: " . $conn->error; // Mensaje de error con detalles
        }

        $stmt->close(); // Cierra el statement preparado
        
    } catch (Exception $e) { // Captura cualquier excepción
        $conn->rollback(); // Revierte la transacción en caso de excepción
        echo "❌ Error en la transacción: " . $e->getMessage(); // Muestra mensaje de error de la excepción
    }

    $conn->close(); // Cierra la conexión a la base de datos
    
} else { // Si el método no es POST
    echo "❌ Método no permitido"; // Mensaje de error
}
?>