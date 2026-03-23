# Gestor de Precios

Aplicación web para gestionar listas de precios de proveedores, comparar precios y simular ganancias.

## Stack tecnológico

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Frontend | Next.js 14 + React | Routing, SSR y API en un solo proyecto |
| UI / Tablas | shadcn/ui + CSS custom | Tablas limpias, rápidas, sin dependencias pesadas |
| Base de datos | Supabase (PostgreSQL) | Gestionado, backups automáticos, gratis hasta 500 MB |
| Auth / Roles | NextAuth.js v5 | Login, sesiones JWT, 3 roles |
| ORM | Prisma | Migraciones y tipado completo |
| Archivos | Uploadthing | Subida de PDFs sin configurar S3 |
| Deploy | Vercel | Un clic, HTTPS automático, gratis |

---

## Requisitos previos

- **Node.js 18+** → [nodejs.org](https://nodejs.org)
- **Git** → [git-scm.com](https://git-scm.com)
- Cuenta gratuita en **[Supabase](https://supabase.com)**
- Cuenta gratuita en **[Vercel](https://vercel.com)** (para producción)

---

## Configuración local (paso a paso)

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd gestor-precios
npm install
```

### 2. Crear base de datos en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta gratuita
2. Creá un nuevo proyecto (elegí una contraseña segura y guardala)
3. Esperá ~2 minutos a que termine de iniciar
4. Andá a **Settings → Database → Connection string → URI**
5. Copiá la URI (se ve así):
   ```
   postgresql://postgres:[TU-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editá `.env.local` con tus datos:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
AUTH_SECRET="clave-secreta-larga-y-aleatoria"
NEXTAUTH_URL="http://localhost:3000"
```

Para generar `AUTH_SECRET` en la terminal:
```bash
openssl rand -base64 32
```
(En Windows podés usar: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)

### 4. Crear tablas e insertar datos de prueba

```bash
# Crear todas las tablas en la base de datos
npm run db:push

# Cargar datos de ejemplo (3 usuarios, 3 proveedores, listas de precios)
npm run db:seed
```

### 5. Iniciar la aplicación

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

---

## Usuarios de prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@empresa.com | admin123 | Administrador |
| maria@empresa.com | op123 | Operador |
| juan@empresa.com | juan123 | Solo lectura |

---

## Módulos disponibles

### Dashboard
Resumen con estadísticas, últimas listas y actividad reciente.

### Proveedores
Gestión de proveedores con historial de listas por proveedor.

### Listas de precios
- Ver todas las listas con filtros por estado
- Subir nueva lista manualmente (con soporte de nombre de archivo)
- Ver detalle de lista con todos los productos
- **Selección múltiple de productos para el simulador**

### Comparaciones
1. **Entre proveedores**: elegí 2 o 3 listas activas → tabla comparativa con semáforo verde/rojo, mejor precio destacado y resumen de "quién gana más"
2. **Cambios de precios**: elegí lista anterior vs nueva → tabla con subas, bajas, alertas de aumentos > X%

### Simulador de precios
- Disponible en cualquier tabla mediante checkbox
- Panel flotante siempre visible
- Configurable: márgenes (30/35/40/45%), IVA (sin IVA / 10.5% / 21%), redondeo comercial
- Muestra precio final redondeado al instante

### Historial
Auditoría de todas las acciones del sistema con usuario, fecha y detalle.

### Usuarios *(solo admin)*
Gestión de usuarios con roles.

### Configuración *(solo admin)*
Parámetros globales: márgenes por defecto, IVA, redondeo, categorías, umbral de alertas.

---

## Despliegue en producción (Vercel)

### Opción A: Deploy con un clic

1. Subí el código a GitHub
2. Entrá a [vercel.com](https://vercel.com) → **Add New Project** → conectá tu repo
3. En **Environment Variables** agregá las mismas variables que en `.env.local`:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` → acá ponés `https://tu-app.vercel.app`
4. Hacé clic en **Deploy**

### Opción B: CLI de Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

Luego en el dashboard de Vercel → Settings → Environment Variables → agregá `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`.

### Después del deploy

```bash
# Correr migraciones en producción
DATABASE_URL="tu-url-de-produccion" npm run db:push

# Cargar datos iniciales (opcional)
DATABASE_URL="tu-url-de-produccion" npm run db:seed
```

---

## Estructura del proyecto

```
gestor-precios/
├── app/
│   ├── (auth)/login/          ← Pantalla de login
│   ├── (dashboard)/           ← Layout con sidebar
│   │   ├── dashboard/         ← Inicio con estadísticas
│   │   ├── proveedores/       ← CRUD de proveedores
│   │   ├── listas/            ← Listas de precios
│   │   │   ├── [id]/          ← Detalle con simulador
│   │   │   └── nueva/         ← Carga manual
│   │   ├── comparaciones/     ← Entre proveedores / cambios
│   │   ├── simulador/         ← Simulador dedicado
│   │   ├── historial/         ← Auditoría
│   │   ├── usuarios/          ← Solo admin
│   │   └── configuracion/     ← Parámetros globales
│   └── api/                   ← API Routes (Next.js)
├── components/
│   ├── layout/                ← Sidebar, Header
│   ├── tablas/                ← Componente Tabla reutilizable
│   └── simulador/             ← PanelSimulador flotante
├── lib/
│   ├── auth.ts                ← NextAuth + helpers de roles
│   ├── calculos.ts            ← IVA, márgenes, redondeo
│   ├── prisma.ts              ← Cliente Prisma (singleton)
│   └── audit.ts               ← Log de auditoría
├── prisma/
│   ├── schema.prisma          ← Modelo de base de datos
│   └── seed.ts                ← Datos de ejemplo
└── types/index.ts             ← Tipos TypeScript centralizados
```

---

## Lógica de cálculo de precios

```
Precio final = Costo × (1 + margen%) × (1 + IVA%) → redondeado
```

**Ejemplo:**
- Costo: $1.000
- Margen: 40%
- IVA: 21%
- Precio con margen: $1.400
- Precio con IVA: $1.694
- Redondeado (terminar en 90): $1.690

**Opciones de redondeo:**
| Modo | $1.573 → |
|------|---------|
| Sin redondeo | $1.573 |
| Múltiplo de 10 | $1.580 |
| Múltiplo de 50 | $1.600 |
| Múltiplo de 100 | $1.600 |
| Terminar en 90 | $1.590 |
| Terminar en 99 | $1.599 |

---

## Roles y permisos

| Acción | Admin | Operador | Solo lectura |
|--------|-------|----------|--------------|
| Ver listas y comparaciones | ✓ | ✓ | ✓ |
| Subir nueva lista | ✓ | ✓ | — |
| Editar datos de lista | ✓ | ✓ | — |
| Simular precios | ✓ | ✓ | ✓ |
| Eliminar listas | ✓ | — | — |
| Gestionar usuarios | ✓ | — | — |
| Cambiar configuración | ✓ | — | — |
| Ver historial | ✓ | ✓ | ✓ |

---

## Próximas funcionalidades sugeridas

- [ ] Subida y extracción automática de PDFs (con revisión manual)
- [ ] Exportación a Excel y PDF
- [ ] Generación de "lista de compra optimizada"
- [ ] Productos sin coincidencia (revisión y aprendizaje)
- [ ] Alertas automáticas por email
- [ ] Historial de precios con gráfico de evolución

---

## Soporte

Para dudas sobre el código o agregar funcionalidades, revisá la documentación de:
- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [Supabase](https://supabase.com/docs)
- [NextAuth.js](https://authjs.dev)
