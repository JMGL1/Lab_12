require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcryptjs');

const { supabase }       = require('./db/supabase');
const authRoutes         = require('./routes/auth');
const usuariosRoutes     = require('./routes/usuarios');
const talleresRoutes     = require('./routes/talleres');
const inscripcionesRoutes = require('./routes/inscripciones');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares globales ──────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Rutas ────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/usuarios',      usuariosRoutes);
app.use('/api/talleres',      talleresRoutes);
app.use('/api/inscripciones', inscripcionesRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', proyecto: 'LearnUp', timestamp: new Date().toISOString() });
});

const path = require('path');

// ── Servir Frontend (React) en Producción ─────────────────────
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Error handler global ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('💥 Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Seed: asegurar que el administrador por defecto exista ────
async function seedAdmin() {
  try {
    const { data: existe } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', 'admin@learnup.bo')
      .maybeSingle();

    if (!existe) {
      const hash = await bcrypt.hash('Admin123!', 12);
      await supabase.from('usuarios').insert({
        nombre:   'Administrador',
        apellido: 'LearnUp',
        email:    'admin@learnup.bo',
        password: hash,
        rol:      'administrador'
      });
      console.log('✅ Admin creado: admin@learnup.bo / Admin123!');
    } else {
      console.log('ℹ️  Admin ya existe en la base de datos');
    }
  } catch (err) {
    console.error('❌ Error en seed admin:', err.message);
  }
}

// ── Iniciar servidor ──────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🚀 LearnUp API corriendo en http://localhost:${PORT}`);
  console.log('─────────────────────────────────────────');
  console.log('📋 Endpoints disponibles:');
  console.log('   POST   /api/auth/login');
  console.log('   POST   /api/auth/register');
  console.log('   GET    /api/auth/me');
  console.log('   GET    /api/usuarios          (admin)');
  console.log('   GET    /api/usuarios/stats     (admin)');
  console.log('   GET    /api/usuarios/:id       (admin/propio)');
  console.log('   POST   /api/usuarios           (admin)');
  console.log('   PUT    /api/usuarios/:id       (admin/propio)');
  console.log('   PATCH  /api/usuarios/:id/toggle (admin)');
  console.log('   DELETE /api/usuarios/:id       (admin)');
  console.log('─────────────────────────────────────────\n');
  await seedAdmin();
});
