# Email Address Extractor

Aplicación web para **extraer, validar y comparar direcciones de correo**. Pegás un texto o una lista, y la app encuentra los emails, los valida y marca los dudosos. También expone una API para validar desde otros programas.

## Qué hace

- **Extraer y validar:** detecta las direcciones dentro de un texto y analiza cada una: formato, dominio (registros MX), dominios descartables o en lista negra, y una evaluación de riesgo con un puntaje.
- **Comparar listas:** cruza dos listas e identifica duplicados y diferencias.
- **Validación en lote** y filtro para ver solo los válidos, con búsqueda dentro de los resultados.
- **Detalle por email** en una ventana y ajustes para elegir qué verificaciones se aplican.
- **Caché** de resultados para no repetir validaciones.
- Modo claro y oscuro.

## API

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/validate?email=user@example.com` | Valida una dirección |
| `POST` | `/api/validate/bulk` | Valida varias direcciones en una sola llamada |

Los ejemplos de uso están en la documentación de la propia app (`components/api-docs.tsx`).

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS y componentes de shadcn/ui.

## Ejecutar

```bash
pnpm install     # o npm install
pnpm dev         # http://localhost:3000
```

## Estructura

```
app/api/validate/       rutas de la API (una y en lote)
components/             interfaz: extractor, lote, detalle, ajustes, documentación de la API
lib/email-validator.ts  validación por etapas, con opciones y caché
lib/*-domains.ts        listas de dominios descartables y bloqueados
lib/company-data.ts     tabla local con datos de empresas
```

## Notas

- Las listas de dominios y los datos de empresa son locales y no están completos. Es un validador de apoyo, no una garantía de entregabilidad.
- El proyecto se generó con v0 y después se modificó a mano.

## Créditos

- [Next.js](https://nextjs.org), [React](https://react.dev) y [Tailwind CSS](https://tailwindcss.com) (MIT)
- [shadcn/ui](https://ui.shadcn.com) y [Radix UI](https://www.radix-ui.com) (MIT)
- Generado inicialmente con [v0](https://v0.app) (Vercel).

## Licencia

Código bajo [licencia MIT](LICENSE). © 2026 Nahuel Emiliano Diaz.
