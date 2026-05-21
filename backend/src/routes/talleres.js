const express  = require('express');
const router   = express.Router();
const { supabase }    = require('../db/supabase');
const { verificarToken, soloAdmin } = require('../middleware/authMiddleware');

/* ── Middleware: instructor propietario o admin ── */
async function instructorPropietario(req, res, next) {
  const { data: taller } = await supabase.from('talleres').select('instructor_id').eq('id', req.params.id).single();
  if (!taller) return res.status(404).json({ error: 'Taller no encontrado' });
  if (String(taller.instructor_id) !== String(req.usuario.id) && req.usuario.rol !== 'administrador') {
    return res.status(403).json({ error: 'No tienes permiso para modificar este taller' });
  }
  next();
}

/* ── GET /api/talleres — Listado público con filtros ── */
router.get('/', async (req, res) => {
  try {
    const { categoria, buscar, page = 1, limit = 12 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('talleres')
      .select('*, instructor:usuarios!instructor_id(id, nombre, apellido, email, telefono)', { count: 'exact' })
      .eq('activo', true)
      .gte('fecha', new Date().toISOString().split('T')[0])
      .order('fecha', { ascending: true })
      .range(offset, offset + Number(limit) - 1);

    if (categoria && categoria !== 'Todos') query = query.eq('categoria', categoria);
    if (buscar?.trim()) query = query.ilike('titulo', `%${buscar.trim()}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.json({ talleres: data || [], total: count || 0, page: Number(page), totalPages: Math.ceil((count || 0) / Number(limit)) });
  } catch (err) {
    console.error('❌ Error GET /talleres:', err.message);
    return res.status(500).json({ error: 'Error al obtener talleres' });
  }
});

/* ── GET /api/talleres/mis-talleres — Talleres del instructor autenticado ── */
router.get('/mis-talleres', verificarToken, async (req, res) => {
  try {
    if (req.usuario.rol !== 'instructor' && req.usuario.rol !== 'administrador') {
      return res.status(403).json({ error: 'Solo los instructores pueden ver sus talleres' });
    }
    const { data, error } = await supabase
      .from('talleres')
      .select('*, inscripciones(count)')
      .eq('instructor_id', req.usuario.id)
      .order('creado_en', { ascending: false });

    if (error) throw error;
    return res.json({ talleres: data || [] });
  } catch (err) {
    console.error('❌ Error GET /talleres/mis-talleres:', err.message);
    return res.status(500).json({ error: 'Error al obtener mis talleres' });
  }
});

/* ── GET /api/talleres/:id — Detalle de un taller ── */
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('talleres')
      .select('*, instructor:usuarios!instructor_id(id, nombre, apellido, email, telefono)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Taller no encontrado' });
    return res.json({ taller: data });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener el taller' });
  }
});

/* ── GET /api/talleres/:id/inscritos — Lista de estudiantes inscritos ── */
router.get('/:id/inscritos', verificarToken, instructorPropietario, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inscripciones')
      .select('*, estudiante:usuarios!estudiante_id(id, nombre, apellido, email, telefono)')
      .eq('taller_id', req.params.id)
      .order('inscrito_en', { ascending: true });

    if (error) throw error;
    return res.json({ inscritos: data || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener inscritos' });
  }
});

/* ── POST /api/talleres — Crear taller (instructor) ── */
router.post('/', verificarToken, async (req, res) => {
  try {
    if (req.usuario.rol !== 'instructor' && req.usuario.rol !== 'administrador') {
      return res.status(403).json({ error: 'Solo los instructores pueden crear talleres' });
    }
    const { titulo, descripcion, categoria, fecha, hora, duracion, precio, modalidad, ubicacion, cupos_totales } = req.body;

    if (!titulo?.trim() || !categoria || !fecha) {
      return res.status(400).json({ error: 'Título, categoría y fecha son obligatorios' });
    }

    const cupos = Number(cupos_totales) || 10;
    const { data: rawTaller, error } = await supabase
      .from('talleres')
      .insert({
        titulo: titulo.trim(),
        descripcion: descripcion?.trim() || null,
        categoria,
        fecha,
        hora: hora || null,
        duracion: duracion?.trim() || null,
        precio: Number(precio) || 0,
        modalidad: modalidad || 'presencial',
        ubicacion: ubicacion?.trim() || null,
        cupos_totales: cupos,
        cupos_disponibles: cupos,
        instructor_id: req.usuario.id
      })
      .select('*')
      .single();

    if (error) throw error;
    return res.status(201).json({ message: 'Taller creado exitosamente', taller: rawTaller });
  } catch (err) {
    console.error('❌ Error POST /talleres:', err.message);
    return res.status(500).json({ error: 'Error al crear el taller' });
  }
});

/* ── PUT /api/talleres/:id — Editar taller ── */
router.put('/:id', verificarToken, instructorPropietario, async (req, res) => {
  try {
    const { titulo, descripcion, categoria, fecha, hora, duracion, precio, modalidad, ubicacion, cupos_totales, activo } = req.body;
    const campos = {};
    if (titulo)       campos.titulo       = titulo.trim();
    if (descripcion !== undefined) campos.descripcion = descripcion?.trim() || null;
    if (categoria)    campos.categoria    = categoria;
    if (fecha)        campos.fecha        = fecha;
    if (hora !== undefined) campos.hora   = hora || null;
    if (duracion !== undefined) campos.duracion = duracion?.trim() || null;
    if (precio !== undefined) campos.precio = Number(precio) || 0;
    if (modalidad)    campos.modalidad    = modalidad;
    if (ubicacion !== undefined) campos.ubicacion = ubicacion?.trim() || null;
    if (cupos_totales !== undefined) {
      campos.cupos_totales = Number(cupos_totales);
      campos.cupos_disponibles = Number(cupos_totales);
    }
    if (activo !== undefined) campos.activo = activo;

    const { data, error } = await supabase.from('talleres').update(campos).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    return res.json({ message: 'Taller actualizado', taller: data });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar el taller' });
  }
});

/* ── DELETE /api/talleres/:id — Eliminar taller ── */
router.delete('/:id', verificarToken, instructorPropietario, async (req, res) => {
  try {
    const { error } = await supabase.from('talleres').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Taller eliminado exitosamente' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al eliminar el taller' });
  }
});

module.exports = router;
