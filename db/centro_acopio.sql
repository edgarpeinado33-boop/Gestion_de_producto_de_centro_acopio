CREATE DATABASE IF NOT EXISTS centro_acopio CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE centro_acopio;

CREATE TABLE compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente VARCHAR(100),
    total_general DECIMAL(10,2),
    fecha DATETIME
);

CREATE TABLE detalle_compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_compra INT,
    tipo_papel VARCHAR(50),
    cantidad DECIMAL(10,2),
    precio DECIMAL(10,2),
    total DECIMAL(10,2),
    FOREIGN KEY (id_compra) REFERENCES compras(id) ON DELETE CASCADE
);
