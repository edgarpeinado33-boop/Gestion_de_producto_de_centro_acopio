<?php
$host = "localhost:3607";
$user = "root";
$pass = "";
$db = "centro_acopio";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}
?>