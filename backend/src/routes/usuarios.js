const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');

const { supabase } = require('../db/supabase');
const {
  verificarToken,
  soloAdmin,
  adminOPropietario
} = require('../middleware/authMiddleware');

/* ─────────────────────────────────────────────────────────────
   GET /api/usuarios
   Lista todos los usuarios con filtros y paginación (solo admin)
   Query params: ?rol= &activo= &buscar= &page= &limit=
───────────────────────────────────────────────────────────── */
router.get('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { rol, activo, buscar, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('usuarios')
      .select('*', { count: 'exact' })
      .order('creado_en', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (rol && rol !== 'todos') {
      query = query.eq('rol', rol);
    }
    if (activo !== undefined && activo !== '' && activo !== 'todos') {
      query = query.eq('activo', activo === 'true');
    }
    if (buscar?.trim()) {
      const b = buscar.trim();
      query = query.or(`nombre.ilike.%${b}%,apellido.ilike.%${b}%,email.ilike.%${b}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Filtrar el campo password de cada usuario
    const usuarios = (data || []).map(({ password: _, ...u }) => u);

    return res.json({
      usuarios,
      total:      count,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil(count / Number(limit))
    });

  } catch (err) {
    console.error('❌ Error GET /usuarios:', err.message);
    return res.status(500).json({ error: 'Error al obtener la lista de usuarios' });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/usuarios/stats
   Estadísticas rápidas de usuarios (solo admin)
───────────────────────────────────────────────────────────── */
router.get('/stats', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { data: todos, error } = await supabase
      .from('usuarios')
      .select('rol, activo');

    if (error) throw error;

    const stats = {
      total:           todos.length,
      activos:         todos.filter(u => u.activo).length,
      inactivos:       todos.filter(u => !u.activo).length,
      administradores: todos.filter(u => u.rol === 'administrador').length,
      instructores:    todos.filter(u => u.rol === 'instructor').length,
      estudiantes:     todos.filter(u => u.rol === 'estudiante').length,
    };

    return res.json({ stats });

  } catch (err) {
    console.error('❌ Error GET /usuarios/stats:', err.message);
    return res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/usuarios/:id
   Obtener un usuario por ID (admin o el propio usuario)
───────────────────────────────────────────────────────────── */
router.get('/:id', verificarToken, adminOPropietario, async (req, res) => {
  try {
    const { data: rawUsuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', req.params.id)
      .single();

    const { password: _, ...usuario } = rawUsuario || {};

    if (error || !usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({ usuario });

  } catch (err) {
    console.error('❌ Error GET /usuarios/:id:', err.message);
    return res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/usuarios
   Crear usuario desde el panel admin (puede asignar cualquier rol)
───────────────────────────────────────────────────────────── */
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono, rol } = req.body;

    if (!nombre?.trim() || !apellido?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Nombre, apellido, email y contraseña son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const rolesValidos = ['estudiante', 'instructor', 'administrador'];
    const rolFinal = rolesValidos.includes(rol) ? rol : 'estudiante';

    // Verificar email único
    const { data: existe } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existe) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo electrónico' });
    }

    const hash = await bcrypt.hash(password, 12);

    const insertData = { nombre: nombre.trim(), apellido: apellido.trim(), email: email.toLowerCase().trim(), password: hash, rol: rolFinal };
    if (telefono?.trim()) insertData.telefono = telefono.trim();

    const { data: rawNuevo, error } = await supabase
      .from('usuarios')
      .insert(insertData)
      .select('*')
      .single();

    const { password: _, ...nuevo } = rawNuevo || {};

    if (error) throw error;

    return res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: nuevo
    });

  } catch (err) {
    console.error('❌ Error POST /usuarios:', err.message);
    return res.status(500).json({ error: 'Error al crear el usuario' });
  }
});

/* ─────────────────────────────────────────────────────────────
   PUT /api/usuarios/:id
   Actualizar usuario:
   - Admin puede cambiar cualquier campo (nombre, apellido, email, rol, activo, telefono, password)
   - Propietario solo puede cambiar nombre, apellido, telefono, password
───────────────────────────────────────────────────────────── */
router.put('/:id', verificarToken, adminOPropietario, async (req, res) => {
  try {
    const esAdmin = req.usuario.rol === 'administrador';
    const { nombre, apellido, email, password, telefono, rol, activo } = req.body;

    const campos = {};

    if (nombre?.trim())   campos.nombre   = nombre.trim();
    if (apellido?.trim()) campos.apellido = apellido.trim();
    if (telefono !== undefined) campos.telefono = telefono?.trim() || null;

    // Solo admin puede cambiar email, rol y estado activo
    if (esAdmin) {
      if (email?.trim())           campos.email  = email.toLowerCase().trim();
      if (rol)                     campos.rol    = rol;
      if (activo !== undefined)    campos.activo = activo;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }
      campos.password = await bcrypt.hash(password, 12);
    }

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    // Si cambia el email, verificar que no esté en uso
    if (campos.email) {
      const { data: existe } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', campos.email)
        .neq('id', req.params.id)
        .maybeSingle();

      if (existe) {
        return res.status(409).json({ error: 'Ese correo electrónico ya está en uso' });
      }
    }

    const { data: rawActualizado, error } = await supabase
      .from('usuarios')
      .update(campos)
      .eq('id', req.params.id)
      .select('*')
      .single();

    const { password: _, ...actualizado } = rawActualizado || {};

    if (error || !actualizado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({
      message: 'Usuario actualizado exitosamente',
      usuario: actualizado
    });

  } catch (err) {
    console.error('❌ Error PUT /usuarios/:id:', err.message);
    return res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});

/* ─────────────────────────────────────────────────────────────
   PATCH /api/usuarios/:id/toggle
   Activar / Desactivar cuenta (solo admin)
───────────────────────────────────────────────────────────── */
router.patch('/:id/toggle', verificarToken, soloAdmin, async (req, res) => {
  try {
    // No puede desactivar su propia cuenta
    if (String(req.usuario.id) === String(req.params.id)) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    }

    // Obtener estado actual
    const { data: actual, error: errGet } = await supabase
      .from('usuarios')
      .select('activo, nombre, apellido')
      .eq('id', req.params.id)
      .single();

    if (errGet || !actual) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const nuevoEstado = !actual.activo;

    const { data: rawAct, error } = await supabase
      .from('usuarios')
      .update({ activo: nuevoEstado })
      .eq('id', req.params.id)
      .select('*')
      .single();

    const { password: _, ...actualizado } = rawAct || {};

    if (error) throw error;

    return res.json({
      message: nuevoEstado
        ? `Cuenta de ${actual.nombre} activada exitosamente`
        : `Cuenta de ${actual.nombre} desactivada exitosamente`,
      usuario: actualizado
    });

  } catch (err) {
    console.error('❌ Error PATCH /usuarios/:id/toggle:', err.message);
    return res.status(500).json({ error: 'Error al cambiar el estado del usuario' });
  }
});

/* ─────────────────────────────────────────────────────────────
   DELETE /api/usuarios/:id
   Eliminar usuario permanentemente (solo admin)
   No puede eliminarse a sí mismo
───────────────────────────────────────────────────────────── */
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    if (String(req.usuario.id) === String(req.params.id)) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador' });
    }

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    return res.json({ message: 'Usuario eliminado exitosamente' });

  } catch (err) {
    console.error('❌ Error DELETE /usuarios/:id:', err.message);
    return res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});

module.exports = router;
