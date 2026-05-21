# LearnUp — Gestión de Usuarios

Módulo de autenticación y CRUD de usuarios para la plataforma **LearnUp**.

## Stack Tecnológico
- **Frontend**: React 19 + Vite 6 + React Router v6
- **Backend**: Node.js + Express
- **Base de datos**: Supabase (PostgreSQL)
- **Auth**: JWT + bcryptjs

---

## ⚙️ CONFIGURACIÓN INICIAL (HACER PRIMERO)

### Paso 1 — Crear tabla en Supabase

Ve a tu proyecto Supabase → **SQL Editor** → New query → pega y ejecuta:

```sql
CREATE TABLE IF NOT EXISTS usuarios (
  id          BIGSERIAL    PRIMARY KEY,
  nombre      TEXT         NOT NULL,
  apellido    TEXT         NOT NULL,
  email       TEXT         NOT NULL UNIQUE,
  password    TEXT         NOT NULL,
  rol         TEXT         NOT NULL DEFAULT 'estudiante'
                           CHECK (rol IN ('administrador', 'instructor', 'estudiante')),
  activo      BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### Paso 2 — Configurar credenciales

Edita el archivo `backend/.env`:

```
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_SERVICE_KEY=eyJ...TU_SERVICE_ROLE_KEY
```

Para obtener estas credenciales: Supabase → Settings → API

---

## ▶️ Cómo ejecutarlo

### Terminal 1 — Backend
```powershell
cd "c:\Users\X13\Desktop\1-2026\Ing de Software\trabajo_final\backend"
npm run dev
```
→ Corre en `http://localhost:3001`
→ Crea automáticamente el admin: `admin@learnup.bo / Admin123!`

### Terminal 2 — Frontend
```powershell
cd "c:\Users\X13\Desktop\1-2026\Ing de Software\trabajo_final\frontend"
npm run dev
```
→ Abre `http://localhost:5173`

---

## 👥 Usuarios del sistema

| Rol | Acceso | Credenciales demo |
|-----|--------|-------------------|
| **Administrador** | Panel completo + CRUD usuarios | admin@learnup.bo / Admin123! |
| **Instructor** | Dashboard + perfil propio | Crear desde panel admin |
| **Estudiante** | Dashboard + perfil propio | Registrarse o crear desde admin |

---

## 📋 Endpoints del API

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/api/auth/login` | Login | Público |
| POST | `/api/auth/register` | Registro | Público |
| GET | `/api/auth/me` | Mi perfil | JWT |
| GET | `/api/usuarios` | Listar usuarios | Admin |
| GET | `/api/usuarios/stats` | Estadísticas | Admin |
| POST | `/api/usuarios` | Crear usuario | Admin |
| PUT | `/api/usuarios/:id` | Actualizar | Admin/Propio |
| PATCH | `/api/usuarios/:id/rol` | Cambiar rol | Admin |
| DELETE | `/api/usuarios/:id` | Eliminar | Admin |
