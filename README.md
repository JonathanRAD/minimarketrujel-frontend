# Sistema Minimarket — POS + Inventario

Proyecto full-stack para gestionar un minimarket/abarrotes: catálogo de productos,
punto de venta con lector de código de barras, control de stock y ventas.

## Estructura del proyecto

```
minimarket-project/
├── backend/          → API REST (Express + TypeScript + Prisma + PostgreSQL)
└── frontend/          → App web (Angular 18, standalone components)
```

## Arquitectura

**Backend** — arquitectura por capas dentro de cada módulo:
```
src/modules/<modulo>/
  ├── <modulo>.routes.ts       (definición de endpoints)
  ├── <modulo>.controller.ts   (traduce HTTP <-> servicio)
  ├── <modulo>.service.ts      (lógica de negocio)
  ├── <modulo>.repository.ts   (única capa que toca Prisma)
  └── <modulo>.validator.ts    (esquemas Zod / DTOs)
```
El módulo `productos` y `ventas` están completos y sirven de plantilla para
implementar el resto (categorias, clientes, proveedores, compras, inventario,
turnos-caja, reportes) siguiendo el mismo patrón.

**Frontend** — organizado por features, con carga perezosa (lazy loading):
```
src/app/
  ├── core/            (servicios globales, guards, interceptors, modelos)
  ├── shared/           (componentes/pipes reutilizables)
  ├── layouts/          (admin-layout, pos-layout)
  └── features/
      ├── auth/          (login)
      ├── pos/            (pantalla de venta + modo offline con IndexedDB)
      └── admin/          (back office: productos, ventas, reportes, etc.)
```

## Requisitos previos

- Node.js 20+
- PostgreSQL 14+ (local o en la nube, ej. Railway/Render)
- Angular CLI: `npm install -g @angular/cli`

## Puesta en marcha — Backend

```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tus credenciales reales de PostgreSQL y un JWT_SECRET propio

npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed   # crea un usuario admin de prueba

npm run dev            # arranca en http://localhost:3000
```

**Usuario de prueba creado por el seed:**
- Email: `admin@minimarket.com`
- Password: `admin123`
- PIN (para login rápido en el POS): `1234`

## Puesta en marcha — Frontend

```bash
cd frontend
npm install
npm start               # arranca en http://localhost:4200
```

> Nota: este proyecto fue armado con la estructura de archivos ya lista para
> Angular CLI, pero si partes de cero con `ng new`, copia estos archivos
> dentro del proyecto generado (reemplazando `src/app` y `src/environments`).

## Flujo de trabajo diario

1. **Back office** (`/admin`, desde la laptop): dar de alta productos,
   escanear el código de barras con la pistola conectada a la PC para
   llenar el campo automáticamente, ver stock.
2. **Punto de venta** (`/pos`, desde tablet/celular con Chrome): el input de
   escaneo queda siempre enfocado — solo escaneas con la pistola y el
   producto se agrega solo al carrito, sin tocar nada.
3. **Modo offline**: si se corta internet durante una venta, esta se guarda
   en IndexedDB (vía Dexie) y se sincroniza sola con el backend en cuanto
   vuelve la conexión — no se pierden ventas.

## Próximos pasos sugeridos (roadmap)

- [ ] Completar módulos restantes en el backend (categorías, clientes,
      proveedores, compras, turnos de caja, reportes) siguiendo el patrón
      de `productos`/`ventas`.
- [ ] Completar las páginas admin correspondientes en el frontend.
- [ ] Login con PIN en pantalla táctil para cajeros (endpoint ya existe:
      `POST /api/auth/login-pin`).
- [ ] Apertura/cierre de turno de caja.
- [ ] Reportes de ventas por día/semana/mes y productos más vendidos.
- [ ] Impresión de tickets (ESC/POS).
