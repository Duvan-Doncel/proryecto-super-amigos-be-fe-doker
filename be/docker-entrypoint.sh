#!/usr/bin/env sh
# ¿Qué? Entrypoint del contenedor backend.
# ¿Para qué? Aplicar las migraciones de Prisma pendientes antes de arrancar el servidor.
# ¿Impacto? Sin esto, un contenedor nuevo arrancaría contra una BD sin las tablas creadas.
set -e

echo "→ Aplicando migraciones de Prisma..."
# ¿Qué? Llamar al CLI de Prisma ya instalado en node_modules, sin pasar por pnpm.
# ¿Para qué? Con USER node, `pnpm` intenta descargarse (corepack) y reinstalar dependencias
#   antes de ejecutar: falla por permisos y exige internet al arrancar el contenedor.
# ¿Impacto? El arranque queda sin errores y funciona sin conexión a internet.
PRISMA_HIDE_UPDATE_MESSAGE=1 ./node_modules/.bin/prisma migrate deploy

echo "→ Iniciando servidor..."
exec node dist/index.js
