<?php
include("conexion.php");

$data = json_decode(file_get_contents("php://input"), true);

$cliente = $data["cliente"];
$totalGeneral = $data["totalGeneral"];
$items = $data["items"];

// Inserta encabezado de compra
$sql = "INSERT INTO compras (cliente, total_general, fecha) VALUES (?, ?, NOW())";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sd", $cliente, $totalGeneral);

if ($stmt->execute()) {
    $id_compra = $conn->insert_id;

    // Insertar detalles de compra
    $sql_detalle = "INSERT INTO detalle_compra (id_compra, tipo_papel, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)";
    $stmt_detalle = $conn->prepare($sql_detalle);
    
    foreach ($items as $item) {
        $tipo = $item["tipo"];
        $cantidad = $item["cantidad"];
        $precio = $item["precio"];
        $total = $item["total"];
        
        $stmt_detalle->bind_param("isddd", $id_compra, $tipo, $cantidad, $precio, $total);
        $stmt_detalle->execute();
    }

    $stmt_detalle->close();
    echo "Compra registrada correctamente ✅";
} else {
    echo "Error al registrar la compra ❌";
}

$stmt->close();
$conn->close();
?>