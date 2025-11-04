<?php
include 'conexion.php';

// Verificar conexión
if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

// Ejecutar consulta
$sql = "SELECT * FROM compras ORDER BY fecha DESC";
$result = $conn->query($sql);

if (!$result) {
    die(json_encode(["error" => "Error en la consulta: " . $conn->error]));
}

$compras = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $compras[] = $row;
    }
}

header('Content-Type: application/json');
echo json_encode($compras);

$conn->close();
?>