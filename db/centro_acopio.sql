CREATE DATABASE IF NOT EXISTS centro_acopio CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci; -- Crea BD si no existe con UTF8
USE centro_acopio;                                                              -- Selecciona la BD

CREATE TABLE compras (
    id INT AUTO_INCREMENT PRIMARY KEY,                                          -- ID autoincremental, clave primaria
    cliente VARCHAR(100),                                                       -- Nombre cliente (100 chars max)
    total_general DECIMAL(10,2),                                                -- Total compra (10,2 decimales)
    fecha DATETIME                                                              -- Fecha y hora compra
);

CREATE TABLE detalle_compra (
    id INT AUTO_INCREMENT PRIMARY KEY,                                          -- ID autoincremental, clave primaria
    id_compra INT,                                                              -- ID compra relacionada
    tipo_papel VARCHAR(50),                                                     -- Tipo papel (periódico/cuaderno/blanco)
    cantidad DECIMAL(10,2),                                                     -- Cantidad kg (10,2 decimales)
    precio DECIMAL(10,2),                                                       -- Precio por kg (10,2 decimales)
    total DECIMAL(10,2),                                                        -- Total item (cantidad*precio)
    FOREIGN KEY (id_compra) REFERENCES compras(id) ON DELETE CASCADE            -- FK con eliminación automática
);
CREATE TABLE contactos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  motivo VARCHAR(50) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha DATETIME NOT NULL
);
