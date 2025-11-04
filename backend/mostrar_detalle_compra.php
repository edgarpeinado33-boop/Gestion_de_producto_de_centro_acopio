<?php
include 'conexion.php';

if (isset($_GET['id_compra'])) {
    $id_compra = $_GET['id_compra'];
    
    $sql = "SELECT dc.* FROM detalle_compra dc WHERE dc.id_compra = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id_compra);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $detalles = [];
    while ($row = $result->fetch_assoc()) {
        $detalles[] = $row;
    }
    
    header('Content-Type: application/json');
    echo json_encode($detalles);
    
    $stmt->close();
    $conn->close();
} else {
    echo json_encode([]);
}
?>