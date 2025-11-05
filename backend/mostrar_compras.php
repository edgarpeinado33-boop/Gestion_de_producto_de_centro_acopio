<?php
include 'conexion.php'; // Incluye el archivo de conexión a la base de datos

// Verificar si se solicita una compra específica con sus detalles
if (isset($_GET['id_compra'])) { // Comprueba si se proporcionó el parámetro id_compra en la URL
    // Devolver detalles de una compra específica
    $id_compra = $_GET['id_compra']; // Obtiene el ID de la compra desde el parámetro GET
    
    $sql = "SELECT dc.* FROM detalle_compra dc WHERE dc.id_compra = ?"; // Consulta para obtener detalles de la compra
    $stmt = $conn->prepare($sql); // Prepara la consulta SQL
    $stmt->bind_param("i", $id_compra); // Asocia el parámetro ID (tipo integer)
    $stmt->execute(); // Ejecuta la consulta
    $result = $stmt->get_result(); // Obtiene el resultado de la consulta
    
    $detalles = []; // Inicializa array vacío para almacenar los detalles
    while ($row = $result->fetch_assoc()) { // Itera sobre cada fila del resultado
        $detalles[] = $row; // Agrega cada fila al array de detalles
    }
    
    header('Content-Type: application/json'); // Establece el header para respuesta JSON
    echo json_encode($detalles); // Convierte el array a JSON y lo imprime
    
    $stmt->close(); // Cierra el statement preparado
    
} else { // Si no se proporcionó id_compra
    // Devolver lista de todas las compras (comportamiento original)
    $result = $conn->query("SELECT * FROM compras ORDER BY fecha DESC"); // Consulta todas las compras ordenadas por fecha descendente

    $compras = []; // Inicializa array vacío para almacenar las compras
    while ($row = $result->fetch_assoc()) { // Itera sobre cada fila del resultado
        $compras[] = $row; // Agrega cada fila al array de compras
    }

    header('Content-Type: application/json'); // Establece el header para respuesta JSON
    echo json_encode($compras); // Convierte el array a JSON y lo imprime
}

$conn->close(); // Cierra la conexión a la base de datos
?>