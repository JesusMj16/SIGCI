# SIGCI : Sistema de Gestión de Calificaciones e Información Académica

## Descripción del proyecto

SIGCI (Sistema de Gestión de Calificaciones e Información Académica) es la plataforma web pensada para que toda la comunidad de la Universidad Tecnológica de la Mixteca realice sus trámites escolares desde un mismo lugar, sin papeleo y sin tener que ir de oficina en oficina. La idea es sencilla: cada persona inicia sesión y encuentra una pantalla hecha a la medida de lo que necesita hacer ese día.

La plataforma reúne en un solo sitio actividades que antes vivían dispersas en hojas, correos y sistemas distintos. Así trabaja cada perfil dentro del sistema:

Alumnos: revisan sus calificaciones del periodo, consultan su horario semanal, descargan su credencial digital con código QR, ven qué tareas tienen pendientes, repasan su historial académico completo y gestionan sus inscripciones a materias.

Profesores: capturan las calificaciones de sus grupos, crean y publican tareas o exámenes para sus alumnos, consultan la lista de estudiantes que tienen asignados y dan seguimiento a las entregas que faltan por revisar.

Administradores y Coordinadores: son quienes mantienen el sistema "vivo": dan de alta nuevos usuarios, abren y cierran periodos académicos, arman los grupos de cada materia, administran el catálogo de carreras y supervisan que las inscripciones se hagan en orden.
Personal de Biblioteca: lleva el registro de préstamos de libros, identifica cuáles están vencidos y da seguimiento al material que aún no ha sido devuelto.

Servicios Escolares: atiende los trámites oficiales (constancias, kárdex, certificados) y prioriza la cola según el volumen de solicitudes pendientes.

En total son 10 perfiles distintos conviviendo en la misma plataforma, y cada uno ve únicamente las herramientas que le corresponden. Para lograrlo, SIGCI verifica la identidad de la persona en cada solicitud y bloquea automáticamente cualquier intento de entrar a una sección que no le pertenece a ese rol. Los datos más delicados como contraseñas, calificaciones e información personal se procesan siempre en el servidor antes de mostrarse, de modo que el navegador del usuario solo recibe lo justo y necesario para pintar la pantalla.

El resultado es una herramienta cotidiana, rápida y predecible: el alumno entra y ve sus pendientes; el profesor entra y captura calificaciones; el administrador entra y resuelve trámites. Todos en el mismo sistema, cada uno con su propio espacio

## Funcionalidad cubierta con los casos de uso implementados:

| CU    | Funcionalidad                                                                                                                      |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| CU-01 | Generar credencial digital                                                                                                         |
| CU-02 | Visualizar credencial digital con el QR y la opcion para descargar en formato PNG                                                  |
| CU-04 | Consultar calificaciones para el rol **ALUMNO**                                                                                    |
| CU-05 | Registrar calificaciones para el rol **PROFESOR**                                                                                  |
| CU-06 | Consultar horario de clases con la exportacion del fromato .ics para que el usuario tenga la facilidad de añadirlo a su calendario |
| CU-07 | Consultar historial académico                                                                                                      |
| CU-09 | Crear y publicar asignaciones                                                                                                      |
| CU-10 | Visualizar tareas pendientes                                                                                                       |

---

## Tecnologías y arquitectura de contenedores

## ¿Con qué está hecho?

Plataforma se apoya en **Next.js 16** con **React 19**, así que mayoría de pantallas se arman en servidor y llegan rápido al navegador. Todo código está escrito en **TypeScript** para evitar sorpresas en tiempo de ejecución.

Parte visual usa **Tailwind CSS v4** junto con componentes de **shadcn/ui** y íconos de **Heroicons** eso da interfaz consistente sin reinventar botones ni formularios.

Para que cada persona entre solo a lo suyo usamos **NextAuth v5** (sesiones con JWT y contraseñas guardadas con **bcrypt**). Datos viven en **PostgreSQL** y los consultamos con **Prisma**, que da tipado fuerte sobre la base.

Credenciales digitales se generan con **qrcode**, y para asegurarnos de que nada se rompa ocupamos **Playwright** para los flujos completos

### Resumen técnico

| Capa                | Tecnología      | Versión   |
| ------------------- | --------------- | --------- |
| Framework web       | Next.js         | 16.2.1    |
| UI                  | React           | 19.2.4    |
| Lenguaje            | TypeScript      | 5.x       |
| Estilos             | Tailwind CSS v4 | 4.x       |
| Componentes         | shadcn/ui       | —         |
| Íconos              | Heroicons       | 2.2       |
| Autenticación       | NextAuth        | 5.0 beta  |
| ORM                 | Prisma          | 7.6       |
| Base de datos       | PostgreSQL      | 16 alpine |
| Hash de contraseñas | bcryptjs        | 3.0       |
| Tests unitarios     | Vitest          | 4.1       |
| Tests E2E           | Playwright      | 1.59      |
| QR                  | qrcode          | 1.5       |

### Arquitectura de contenedores

El proyecto utiliza **Docker Compose** para orquestar la base de datos:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: utm_user
      POSTGRES_PASSWORD: utmx
      POSTGRES_DB: utm
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Imágenes ilustrativas

### Pantalla de login

![Login](docs/screenshots/login.png)

### Dashboard del alumno

![Dashboard Alumno](docs/screenshots/dashboard-alumno.png)

### Credencial digital

![Credencial](docs/screenshots/credencial.png)

### Horario de clases

![Horario](docs/screenshots/horario.png)

### Calificaciones del alumno

![Calificaciones](docs/screenshots/calificaciones.png)

### Registro de calificaciones

![Registro de calificaciones](docs/screenshots/registro-calificaciones.png)

### Tareas pendientes

![Tareas pendientes](docs/screenshots/tareas.png)

### Panel administrativo

![Admin](docs/screenshots/admin.png)

## Entrega presencial

| Integrante  
| ---------------------
| Jesús Alfonso Morales Jaimes
| Esmeralda Morales Martinez  
| Leonardo Bautista Cruz  
| Hermes Aguilar Villa
|Elvia Marlen Hernandez Garcia

### Requisitos para correr el software localmente

**Pre-requisitos:**
Estos son algunos requistios de tecnologias que deberias tomar en cuenta para el despliegue:

- Node.js ≥ 20
- npm ≥ 10
- Docker
- Git

### Pasos de instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/JesusMj16/SIGCI.git
cd SIGCI

# 2. Instalar dependencias
npm install

# 3. Levantar la base de datos en Docker
docker compose up -d

# 4. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con:
#   DATABASE_URL="postgresql://utm_user:utmx@localhost:5432/utm"
#   AUTH_SECRET="<generar con: openssl rand -base64 32>"

# 5. Aplicar migraciones de Prisma
npx prisma migrate deploy
npx prisma generate

# 6. Cargar datos de prueba con la semilla
npm run db:seed

# 7. Iniciar servidor de desarrollo
npm run dev
```

Abrir <http://localhost:3000> en el navegador.

### Comandos útiles

```bash
npm run dev              # Servidor de desarrollo (hot reload)
npm run build            # Build de producción
npm run start            # Servidor de producción
npm run lint             # ESLint
npm run test             # Tests unitarios
npm run test:e2e         # Tests E2E usando PalyWrigth
npm run db:seed          # Recargar datos de prueba
docker compose up -d     # Levantar PostgreSQL
docker compose down      # Detener PostgreSQL (datos persisten)
```

### Estructura del repositorio

```
utm-academico/
├── app/                    Rutas y páginas
│   ├── (auth)/login        Login
│   ├── (dashboard)/        Layout y dashboards por rol
│   └── api/                Handlers de API
├── components/             Componentes UI
├── lib/                    DAL, presentation, config, utilidades
├── prisma/                 Schema, migraciones, seeds
├── public/                 Assets estáticos y fuentes
├── tests/                  Tests unitarios y E2E
├── docs/                   Documentación de casos de uso + screenshots
├── docker-compose.yml      PostgreSQL contenerizado
├── proxy.ts                Middleware de protección por rol
└── auth.ts                 Configuración NextAuth
```

---
