const express = require('express');
const router  = express.Router();
const { supabase }   = require('../db/supabase');
const { verificarToken } = require('../middleware/authMiddleware');

/* ── GET /api/inscripciones/mis — Mis inscripciones (estudiante) ── */
router.get('/mis', verificarToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inscripciones')
      .select('*, taller:talleres!taller_id(*, instructor:usuarios!instructor_id(id, nombre, apellido, email, telefono))')
      .eq('estudiante_id', req.usuario.id)
      .order('inscrito_en', { ascending: false });

    if (error) throw error;
    return res.json({ inscripciones: data || [] });
  } catch (err) {
    console.error('❌ Error GET /inscripciones/mis:', err.message);
    return res.status(500).json({ error: 'Error al obtener tus inscripciones' });
  }
});

/* ── POST /api/inscripciones — Solicitar inscripción a un taller ── */
router.post('/', verificarToken, async (req, res) => {
  try {
    if (req.usuario.rol !== 'estudiante') {
      return res.status(403).json({ error: 'Solo los estudiantes pueden inscribirse en talleres' });
    }
    const { taller_id, mensaje_solicitud } = req.body;
    if (!taller_id) return res.status(400).json({ error: 'El ID del taller es obligatorio' });

    // Verificar que el taller existe y tiene cupos
    const { data: taller, error: errTaller } = await supabase
      .from('talleres')
      .select('id, titulo, cupos_disponibles, activo, fecha')
      .eq('id', taller_id)
      .single();

    if (errTaller || !taller) return res.status(404).json({ error: 'Taller no encontrado' });
    if (!taller.activo) return res.status(400).json({ error: 'Este taller no está disponible' });
    if (taller.cupos_disponibles <= 0) return res.status(400).json({ error: 'No hay cupos disponibles en este taller' });

    // Verificar si ya está inscrito
    const { data: existente } = await supabase
      .from('inscripciones')
      .select('id')
      .eq('taller_id', taller_id)
      .eq('estudiante_id', req.usuario.id)
      .maybeSingle();

    if (existente) return res.status(409).json({ error: 'Ya enviaste una solicitud para este taller' });

    // Inscribir (con estado pendiente) y decrementar cupo preventivamente
    const { error: errInscripcion } = await supabase
      .from('inscripciones')
      .insert({ 
        taller_id, 
        estudiante_id: req.usuario.id,
        estado_solicitud: 'pendiente',
        mensaje_solicitud: mensaje_solicitud?.trim() || null
      }).select('id').single();

    if (errInscripcion) throw errInscripcion;

    await supabase.from('talleres').update({ cupos_disponibles: taller.cupos_disponibles - 1 }).eq('id', taller_id).select('id').single();

    return res.status(201).json({ message: `Solicitud enviada exitosamente a "${taller.titulo}"` });
  } catch (err) {
    console.error('❌ Error POST /inscripciones:', err.message);
    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

/* ── DELETE /api/inscripciones/:tallerId — Cancelar inscripción ── */
router.delete('/:tallerId', verificarToken, async (req, res) => {
  try {
    const { data: inscripcion } = await supabase
      .from('inscripciones')
      .select('id')
      .eq('taller_id', req.params.tallerId)
      .eq('estudiante_id', req.usuario.id)
      .maybeSingle();

    if (!inscripcion) return res.status(404).json({ error: 'No estás inscrito en este taller' });

    await supabase.from('inscripciones').delete().eq('id', inscripcion.id);

    // Devolver cupo
    const { data: taller } = await supabase.from('talleres').select('cupos_disponibles, cupos_totales').eq('id', req.params.tallerId).single();
    if (taller && taller.cupos_disponibles < taller.cupos_totales) {
      await supabase.from('talleres').update({ cupos_disponibles: taller.cupos_disponibles + 1 }).eq('id', req.params.tallerId);
    }

    return res.json({ message: 'Inscripción cancelada exitosamente' });
  } catch (err) {
    console.error('❌ Error DELETE /inscripciones:', err.message);
    return res.status(500).json({ error: 'Error al cancelar la inscripción' });
  }
});

/* ── PATCH /api/inscripciones/:id/estado — Aceptar o rechazar solicitud ── */
router.patch('/:id/estado', verificarToken, async (req, res) => {
  try {
    const { estado_solicitud, motivo_rechazo } = req.body;
    
    if (!['aceptada', 'rechazada'].includes(estado_solicitud)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    // Buscar la inscripción y verificar permisos del instructor
    const { data: inscripcion } = await supabase
      .from('inscripciones')
      .select('*, taller:talleres!taller_id(id, instructor_id, cupos_disponibles, cupos_totales)')
      .eq('id', req.params.id)
      .single();

    if (!inscripcion) return res.status(404).json({ error: 'Solicitud no encontrada' });
    
    // Verificar que el usuario sea el instructor de este taller
    if (String(inscripcion.taller.instructor_id) !== String(req.usuario.id)) {
      return res.status(403).json({ error: 'No tienes permiso para gestionar esta solicitud' });
    }

    if (inscripcion.estado_solicitud !== 'pendiente') {
      return res.status(400).json({ error: 'Esta solicitud ya fue procesada' });
    }

    // Actualizar estado
    const { error: errUpdate } = await supabase
      .from('inscripciones')
      .update({
        estado_solicitud,
        motivo_rechazo: estado_solicitud === 'rechazada' ? (motivo_rechazo || null) : null
      })
      .eq('id', req.params.id).select('id').single();

    if (errUpdate) throw errUpdate;

    // Si es rechazada, devolver cupo
    if (estado_solicitud === 'rechazada') {
      const tallerId = inscripcion.taller.id;
      const { data: currentTaller } = await supabase.from('talleres').select('cupos_disponibles, cupos_totales').eq('id', tallerId).single();
      if (currentTaller && currentTaller.cupos_disponibles < currentTaller.cupos_totales) {
        await supabase.from('talleres').update({ cupos_disponibles: currentTaller.cupos_disponibles + 1 }).eq('id', tallerId).select('id').single();
      }
    }

    return res.json({ message: `Solicitud ${estado_solicitud} exitosamente` });
  } catch (err) {
    console.error('❌ Error PATCH /inscripciones/:id/estado:', err.message);
    return res.status(500).json({ error: 'Error al actualizar el estado de la solicitud' });
  }
});

module.exports = router;
