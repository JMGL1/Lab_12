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
    const { categoria, buscar, orden, page = 1, limit = 12 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('talleres')
      .select('*, instructor:usuarios!instructor_id(id, nombre, apellido, email, telefono)', { count: 'exact' })
      .eq('activo', true)
      .eq('estado_validacion', 'aprobado')
      .gte('fecha', new Date().toISOString().split('T')[0]);

    if (orden === 'recientes') {
      query = query.order('creado_en', { ascending: false });
    } else if (orden === 'populares') {
      query = query.order('inscritos_count', { ascending: false });
    } else if (orden === 'mejor_calificados') {
      query = query.order('calificacion_promedio', { ascending: false });
    } else {
      query = query.order('fecha', { ascending: true });
    }

    query = query.range(offset, offset + Number(limit) - 1);

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

/* ── GET /api/talleres/pendientes — Solo Administrador ── */
router.get('/pendientes', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('talleres')
      .select('*, instructor:usuarios!instructor_id(id, nombre, apellido, email, telefono)')
      .eq('estado_validacion', 'pendiente')
      .order('creado_en', { ascending: true });

    if (error) throw error;
    return res.json({ talleres: data || [] });
  } catch (err) {
    console.error('❌ Error GET /talleres/pendientes:', err.message);
    return res.status(500).json({ error: 'Error al obtener talleres pendientes' });
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
    const { titulo, descripcion, categoria, fecha, hora, duracion, precio, modalidad, ubicacion, cupos_totales, metodo_pago, qr_imagen, enlace_comunicacion } = req.body;

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
        metodo_pago: metodo_pago || 'efectivo',
        qr_imagen: qr_imagen || null,
        enlace_comunicacion: enlace_comunicacion?.trim() || null,
        instructor_id: req.usuario.id,
        estado_validacion: 'pendiente'
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
    const { titulo, descripcion, categoria, fecha, hora, duracion, precio, modalidad, ubicacion, cupos_totales, activo, metodo_pago, qr_imagen, enlace_comunicacion } = req.body;
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
    if (metodo_pago !== undefined) campos.metodo_pago = metodo_pago;
    if (qr_imagen !== undefined) campos.qr_imagen = qr_imagen || null;
    if (enlace_comunicacion !== undefined) campos.enlace_comunicacion = enlace_comunicacion?.trim() || null;
    if (cupos_totales !== undefined) {
      campos.cupos_totales = Number(cupos_totales);
      campos.cupos_disponibles = Number(cupos_totales);
    }
    if (activo !== undefined) campos.activo = activo;
    
    // Cualquier edición por parte del ofertante devuelve el producto a estado pendiente
    campos.estado_validacion = 'pendiente';
    campos.motivo_rechazo = null; // Limpiamos el motivo de rechazo al editar

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

/* ── PATCH /api/talleres/:id/validacion — Validar contenido (Admin) ── */
router.patch('/:id/validacion', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { estado_validacion, motivo_rechazo } = req.body;
    if (!['aprobado', 'rechazado', 'pendiente'].includes(estado_validacion)) {
      return res.status(400).json({ error: 'Estado de validación inválido' });
    }

    const { data, error } = await supabase
      .from('talleres')
      .update({ 
        estado_validacion,
        motivo_rechazo: estado_validacion === 'rechazado' ? motivo_rechazo : null 
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;
    return res.json({ message: `Taller actualizado a ${estado_validacion}`, taller: data });
  } catch (err) {
    console.error('❌ Error PATCH /talleres/:id/validacion:', err.message);
    return res.status(500).json({ error: 'Error al actualizar validación del taller' });
  }
});

module.exports = router;
