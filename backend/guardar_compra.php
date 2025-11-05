<?php
include("conexion.php"); // Incluye el archivo de conexión a la base de datos

$data = json_decode(file_get_contents("php://input"), true); // Decodifica el JSON recibido en el cuerpo de la solicitud

$cliente = $data["cliente"]; // Obtiene el nombre del cliente del array de datos
$totalGeneral = $data["totalGeneral"]; // Obtiene el total general de la compra
$items = $data["items"]; // Obtiene el array de items de la compra

// Inserta encabezado de compra
$sql = "INSERT INTO compras (cliente, total_general, fecha) VALUES (?, ?, NOW())"; // Consulta SQL para insertar en tabla compras
$stmt = $conn->prepare($sql); // Prepara la consulta SQL
$stmt->bind_param("sd", $cliente, $totalGeneral); // Asocia parámetros (string, double)

if ($stmt->execute()) { // Ejecuta la consulta y verifica si fue exitosa
    $id_compra = $conn->insert_id; // Obtiene el ID autogenerado de la compra insertada

    // Insertar detalles de compra
    $sql_detalle = "INSERT INTO detalle_compra (id_compra, tipo_papel, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)"; // Consulta para insertar detalles
    $stmt_detalle = $conn->prepare($sql_detalle); // Prepara la consulta de detalles
    
    foreach ($items as $item) { // Itera sobre cada item del array de items
        $tipo = $item["tipo"]; // Obtiene el tipo de papel del item
        $cantidad = $item["cantidad"]; // Obtiene la cantidad del item
        $precio = $item["precio"]; // Obtiene el precio del item
        $total = $item["total"]; // Obtiene el total del item
        
        $stmt_detalle->bind_param("isddd", $id_compra, $tipo, $cantidad, $precio, $total); // Asocia parámetros (integer, string, double, double, double)
        $stmt_detalle->execute(); // Ejecuta la inserción del detalle
    }

    $stmt_detalle->close(); // Cierra el statement de detalles
    echo "Compra registrada correctamente ✅"; // Mensaje de éxito
} else {
    echo "Error al registrar la compra ❌"; // Mensaje de error
}

$stmt->close(); // Cierra el statement principal
$conn->close(); // Cierra la conexión a la base de datos
?>