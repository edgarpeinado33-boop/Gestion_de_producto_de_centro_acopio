<?php
// Configuración de conexión a la base de datos MySQL
$host = "localhost:3607"; // Servidor de base de datos y puerto (localhost con puerto personalizado 3607)
$user = "root"; // Usuario de la base de datos (usuario root por defecto)
$pass = ""; // Contraseña del usuario (vacía en este caso - mala práctica en producción)
$db = "centro_acopio"; // Nombre de la base de datos a la que se conectará

// Crear nueva conexión MySQLi (MySQL improved)
$conn = new mysqli($host, $user, $pass, $db); // Instancia el objeto de conexión con los parámetros proporcionados

// Verificar si hubo error en la conexión
if ($conn->connect_error) { // Si la propiedad connect_error no está vacía, significa que hay error
    die("Error de conexión: " . $conn->connect_error); // Termina el script y muestra mensaje de error específico
}
// Si no hay errores, la conexión está lista para usarse en consultas SQL
?>