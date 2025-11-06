<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';
require 'conexion.php'; // conexión a la BD

if (!isset($conn) || $conn->connect_error) {
    die("Error: No se pudo conectar a la base de datos: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Limpiar y validar los datos de entrada
    $nombre = trim($_POST['nombre']);
    $email = trim($_POST['email']);
    $motivo = trim($_POST['motivo']);
    $mensaje = trim($_POST['mensaje']);

    if (empty($nombre) || empty($email) || empty($motivo) || empty($mensaje)) {
        die("<script>alert('Todos los campos son obligatorios.'); window.location='../frontend/contacto.html';</script>");
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        die("<script>alert('Por favor, ingresa un email válido.'); window.location='../frontend/contacto.html';</script>");
    }

    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'TU_CORREO@gmail.com'; // tu cuenta Gmail
        $mail->Password   = 'TU_CONTRASEÑA_APP';   // contraseña de aplicación
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        $mail->setFrom($email, $nombre);
        $mail->addAddress('TU_CORREO@gmail.com', 'Centro de Acopio');
        $mail->isHTML(true);
        $mail->Subject = "Nuevo mensaje de contacto: $motivo";
        $mail->Body = "
            <h3>Nuevo mensaje recibido</h3>
            <p><strong>Nombre:</strong> $nombre</p>
            <p><strong>Correo:</strong> $email</p>
            <p><strong>Motivo:</strong> $motivo</p>
            <p><strong>Mensaje:</strong><br>$mensaje</p>
        ";
        
        // -------- AGREGAR ARCHIVOS ADJUNTOS --------
        if (isset($_FILES['adjuntos']) && !empty($_FILES['adjuntos']['name'][0])) {
            $total_adjuntos = count($_FILES['adjuntos']['name']);
            $adjuntos_exitosos = 0;
            
            for ($i = 0; $i < $total_adjuntos; $i++) {
                if ($_FILES['adjuntos']['error'][$i] === UPLOAD_ERR_OK) {
                    $nombre_archivo = $_FILES['adjuntos']['name'][$i];
                    $ruta_temporal = $_FILES['adjuntos']['tmp_name'][$i];
                    $tipo_archivo = $_FILES['adjuntos']['type'][$i];
                    $tamaño_archivo = $_FILES['adjuntos']['size'][$i];
                    
                    // Validar tamaño del archivo (máximo 5MB)
                    if ($tamaño_archivo > 5 * 1024 * 1024) {
                        continue; // Saltar archivo si es muy grande
                    }
                    
                    // Validar tipo de archivo
                    $tipos_permitidos = [
                        'image/jpeg', 'image/png', 'image/gif', 'application/pdf',
                        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    ];
                    
                    if (in_array($tipo_archivo, $tipos_permitidos)) {
                        $mail->addAttachment($ruta_temporal, $nombre_archivo);
                        $adjuntos_exitosos++;
                    }
                }
            }
            
            if ($adjuntos_exitosos > 0) {
                $mail->Body .= "<p><strong>Archivos adjuntos:</strong> $adjuntos_exitosos archivo(s)</p>";
            }
        }
        
        
        $correo_enviado = $mail->send();
        
    } catch (Exception $e) {
        error_log("Error al enviar correo: {$mail->ErrorInfo}");
    }

    try {
        $sql = "INSERT INTO contactos (nombre, email, motivo, mensaje, fecha) 
                VALUES (?, ?, ?, ?, NOW())";
        
        $stmt = $conn->prepare($sql); 
        
        if ($stmt) {
            $stmt->bind_param("ssss", $nombre, $email, $motivo, $mensaje);
            
            if ($stmt->execute()) {
                $mensaje_exito = "Mensaje enviado correctamente.";
                
                // Verificar si el correo se envió
                if (isset($correo_enviado) && $correo_enviado) {
                    $mensaje_exito .= " Se ha enviado una confirmación por correo.";
                    
                    // Informar sobre archivos adjuntos si los hubo
                    if (isset($adjuntos_exitosos) && $adjuntos_exitosos > 0) {
                        $mensaje_exito .= " Se adjuntaron $adjuntos_exitosos archivo(s).";
                    }
                } else {
                    $mensaje_exito .= " El mensaje se guardó pero no se pudo enviar el correo de confirmación.";
                }
                
                echo "<script>alert('$mensaje_exito'); window.location='../frontend/contacto.html';</script>";
            } else {
                throw new Exception("Error al guardar en la base de datos: " . $stmt->error);
            }
            
            $stmt->close();
        } else {
            throw new Exception("Error al preparar la consulta: " . $conn->error);
        }
        
    } catch (Exception $e) {
        error_log($e->getMessage());
        echo "<script>alert('Error al procesar tu mensaje. Por favor, intenta nuevamente.'); window.location='../frontend/contacto.html';</script>";
    }

    $conn->close(); 
}
?>