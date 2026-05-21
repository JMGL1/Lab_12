const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

const { supabase }      = require('../db/supabase');
const { verificarToken } = require('../middleware/authMiddleware');

const SECRET      = process.env.JWT_SECRET || 'learnup_secret';
const TOKEN_EXPIRY = '24h';

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/register
   Registro público: solo estudiante o instructor
   El administrador se crea desde el panel o el seed inicial
───────────────────────────────────────────────────────────── */
router.post('/register', async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono, rol } = req.body;

    // Validaciones de campos obligatorios
    if (!nombre?.trim() || !apellido?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Nombre, apellido, email y contraseña son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Solo estudiante e instructor en registro público
    const rolesPublicos = ['estudiante', 'instructor'];
    const rolFinal = rolesPublicos.includes(rol) ? rol : 'estudiante';

    // Verificar email único
    const { data: existe } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existe) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo electrónico' });
    }

    // Hashear contraseña
    const hash = await bcrypt.hash(password, 12);

    // Construir datos para insertar (telefono es opcional)
    const insertData = {
      nombre:   nombre.trim(),
      apellido: apellido.trim(),
      email:    email.toLowerCase().trim(),
      password: hash,
      rol:      rolFinal
    };
    // Solo incluir telefono si tiene valor (evita error si la columna no existe)
    if (telefono?.trim()) insertData.telefono = telefono.trim();

    // Insertar usuario
    const { data: rawNuevo, error } = await supabase
      .from('usuarios')
      .insert(insertData)
      .select('*')
      .single();

    if (error) throw error;

    // Eliminar password de la respuesta
    const { password: _, ...nuevo } = rawNuevo;

    // Generar token JWT
    const token = jwt.sign(
      { id: nuevo.id, email: nuevo.email, rol: nuevo.rol, nombre: nuevo.nombre },
      SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.status(201).json({
      message: `Cuenta de ${rolFinal} creada exitosamente`,
      token,
      usuario: nuevo
    });

  } catch (err) {
    console.error('❌ Error en /register:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/login
   Login con email + contraseña → devuelve JWT y datos del usuario
───────────────────────────────────────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario por email
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) throw error;

    // Mensaje genérico para no revelar si el email existe
    if (!usuario) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }
    if (!usuario.activo) {
      return res.status(403).json({
        error: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
      });
    }

    // Verificar contraseña
    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
      SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // Devolver usuario sin la contraseña
    const { password: _, ...usuarioSinPass } = usuario;

    return res.json({
      message: 'Inicio de sesión exitoso',
      token,
      usuario: usuarioSinPass
    });

  } catch (err) {
    console.error('❌ Error en /login:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/auth/me
   Devuelve el perfil completo del usuario autenticado
───────────────────────────────────────────────────────────── */
router.get('/me', verificarToken, async (req, res) => {
  try {
    const { data: rawUsuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', req.usuario.id)
      .single();

    if (error || !rawUsuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Eliminar password de la respuesta
    const { password: _, ...usuario } = rawUsuario;
    return res.json({ usuario });

  } catch (err) {
    console.error('❌ Error en /me:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
