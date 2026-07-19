-- AlterTable
ALTER TABLE "ventas" ADD COLUMN     "monto_efectivo" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "monto_tarjeta" DECIMAL(10,2) NOT NULL DEFAULT 0;
