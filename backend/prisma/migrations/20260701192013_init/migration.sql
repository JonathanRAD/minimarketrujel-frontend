-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'CAJERO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'MIXTO', 'FIADO');

-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('COMPLETADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoCompra" AS ENUM ('PENDIENTE', 'RECIBIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "UnidadMedida" AS ENUM ('UNIDAD', 'KG', 'G', 'LITRO', 'ML');

-- CreateEnum
CREATE TYPE "TipoMovimientoInventario" AS ENUM ('VENTA', 'COMPRA', 'AJUSTE', 'MERMA', 'DEVOLUCION');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('ABIERTO', 'CERRADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "pin" TEXT,
    "rol" "RolUsuario" NOT NULL DEFAULT 'CAJERO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria_id" TEXT,
    "codigo_barras" TEXT NOT NULL,
    "precio_venta" DECIMAL(10,2) NOT NULL,
    "costo" DECIMAL(10,2) NOT NULL,
    "stock_actual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stock_minimo" DECIMAL(10,2) NOT NULL DEFAULT 5,
    "unidad_medida" "UnidadMedida" NOT NULL DEFAULT 'UNIDAD',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoCompra" NOT NULL DEFAULT 'PENDIENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compra_detalle" (
    "id" TEXT NOT NULL,
    "compra_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "costo_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "compra_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "limite_credito" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiados" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_limite" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "cliente_id" TEXT,
    "turno_id" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(10,2) NOT NULL,
    "metodo_pago" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',
    "estado" "EstadoVenta" NOT NULL DEFAULT 'COMPLETADA',
    "sincronizado" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta_detalle" (
    "id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "venta_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "tipo" "TipoMovimientoInventario" NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "motivo" TEXT,
    "usuario_id" TEXT NOT NULL,
    "referencia_id" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos_caja" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "fecha_apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMP(3),
    "monto_inicial" DECIMAL(10,2) NOT NULL,
    "monto_final_esperado" DECIMAL(10,2),
    "monto_final_real" DECIMAL(10,2),
    "diferencia" DECIMAL(10,2),
    "estado" "EstadoTurno" NOT NULL DEFAULT 'ABIERTO',

    CONSTRAINT "turnos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_pin_key" ON "usuarios"("pin");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_barras_key" ON "productos"("codigo_barras");

-- CreateIndex
CREATE INDEX "productos_codigo_barras_idx" ON "productos"("codigo_barras");

-- CreateIndex
CREATE INDEX "productos_categoria_id_idx" ON "productos"("categoria_id");

-- CreateIndex
CREATE INDEX "compras_proveedor_id_idx" ON "compras"("proveedor_id");

-- CreateIndex
CREATE INDEX "compras_fecha_idx" ON "compras"("fecha");

-- CreateIndex
CREATE INDEX "compra_detalle_compra_id_idx" ON "compra_detalle"("compra_id");

-- CreateIndex
CREATE UNIQUE INDEX "fiados_venta_id_key" ON "fiados"("venta_id");

-- CreateIndex
CREATE INDEX "fiados_cliente_id_idx" ON "fiados"("cliente_id");

-- CreateIndex
CREATE INDEX "ventas_fecha_idx" ON "ventas"("fecha");

-- CreateIndex
CREATE INDEX "ventas_usuario_id_idx" ON "ventas"("usuario_id");

-- CreateIndex
CREATE INDEX "ventas_turno_id_idx" ON "ventas"("turno_id");

-- CreateIndex
CREATE INDEX "venta_detalle_venta_id_idx" ON "venta_detalle"("venta_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_producto_id_idx" ON "movimientos_inventario"("producto_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_fecha_idx" ON "movimientos_inventario"("fecha");

-- CreateIndex
CREATE INDEX "turnos_caja_usuario_id_idx" ON "turnos_caja"("usuario_id");

-- CreateIndex
CREATE INDEX "turnos_caja_estado_idx" ON "turnos_caja"("estado");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_detalle" ADD CONSTRAINT "compra_detalle_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_detalle" ADD CONSTRAINT "compra_detalle_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiados" ADD CONSTRAINT "fiados_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiados" ADD CONSTRAINT "fiados_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turnos_caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalle" ADD CONSTRAINT "venta_detalle_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalle" ADD CONSTRAINT "venta_detalle_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos_caja" ADD CONSTRAINT "turnos_caja_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
