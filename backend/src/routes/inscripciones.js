const express = require('express');
const router  = express.Router();
const { supabase }   = require('../db/supabase');
const { verificarToken } = require('../middleware/authMiddleware');

/* ── GET /api/inscripciones/ingresos — Mis ingresos (instructor) ── */
router.get('/ingresos', verificarToken, async (req, res) => {
  try {
    if (req.usuario.rol !== 'instructor') {
      return res.status(403).json({ error: 'Solo los instructores pueden ver ingresos' });
    }

    const { data, error } = await supabase
      .from('inscripciones')
      .select('*, estudiante:usuarios!estudiante_id(id, nombre, apellido, email), taller:talleres!taller_id(id, titulo, precio, instructor_id)')
      .eq('estado_pago', 'pagado')
      .order('inscrito_en', { ascending: false });

    if (error) throw error;

    // Filtrar para asegurarse que el taller pertenece al instructor
    const ingresos = data.filter(i => String(i.taller.instructor_id) === String(req.usuario.id));

    return res.json({ ingresos });
  } catch (err) {
    console.error('❌ Error GET /inscripciones/ingresos:', err.message);
    return res.status(500).json({ error: 'Error al obtener ingresos' });
  }
});

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

    // Si el precio es 0, el pago está 'exento'
    const estado_pago = taller.precio && Number(taller.precio) > 0 ? 'pendiente' : 'exento';

    // Inscribir (con estado pendiente) y decrementar cupo preventivamente
    const { error: errInscripcion } = await supabase
      .from('inscripciones')
      .insert({ 
        taller_id, 
        estudiante_id: req.usuario.id,
        estado_solicitud: 'pendiente',
        estado_pago,
        mensaje_solicitud: mensaje_solicitud?.trim() || null,
        comprobante_pago: req.body.comprobante_pago || null
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

    // Devolver cupo y decrementar inscritos_count si estaba aceptada
    const { data: taller } = await supabase.from('talleres').select('cupos_disponibles, cupos_totales, inscritos_count').eq('id', req.params.tallerId).single();
    if (taller) {
      const updates = {};
      if (taller.cupos_disponibles < taller.cupos_totales) {
        updates.cupos_disponibles = taller.cupos_disponibles + 1;
      }
      if (inscripcion.estado_solicitud === 'aceptada' && taller.inscritos_count > 0) {
        updates.inscritos_count = taller.inscritos_count - 1;
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from('talleres').update(updates).eq('id', req.params.tallerId);
      }
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

    // Si es aceptada, incrementar inscritos_count
    // Si es rechazada, devolver cupo
    const tallerId = inscripcion.taller.id;
    const { data: currentTaller } = await supabase.from('talleres').select('cupos_disponibles, cupos_totales, inscritos_count').eq('id', tallerId).single();
    
    if (currentTaller) {
      const updates = {};
      if (estado_solicitud === 'aceptada') {
        updates.inscritos_count = (currentTaller.inscritos_count || 0) + 1;
      } else if (estado_solicitud === 'rechazada' && currentTaller.cupos_disponibles < currentTaller.cupos_totales) {
        updates.cupos_disponibles = currentTaller.cupos_disponibles + 1;
      }
      
      if (Object.keys(updates).length > 0) {
        await supabase.from('talleres').update(updates).eq('id', tallerId).select('id').single();
      }
    }

    return res.json({ message: `Solicitud ${estado_solicitud} exitosamente` });
  } catch (err) {
    console.error('❌ Error PATCH /inscripciones/:id/estado:', err.message);
    return res.status(500).json({ error: 'Error al actualizar el estado de la solicitud' });
  }
});

/* ── POST /api/inscripciones/:id/calificar — Calificar un taller inscrito ── */
router.post('/:id/calificar', verificarToken, async (req, res) => {
  try {
    const { calificacion, comentario_calificacion } = req.body;
    const nota = parseInt(calificacion);
    
    if (isNaN(nota) || nota < 1 || nota > 5) {
      return res.status(400).json({ error: 'La calificación debe ser un número entre 1 y 5' });
    }

    // Buscar inscripción y verificar que le pertenezca y esté aceptada
    const { data: inscripcion, error: errInsc } = await supabase
      .from('inscripciones')
      .select('*, taller:talleres!taller_id(id)')
      .eq('id', req.params.id)
      .eq('estudiante_id', req.usuario.id)
      .single();

    if (errInsc || !inscripcion) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    if (inscripcion.estado_solicitud !== 'aceptada') {
      return res.status(400).json({ error: 'Solo puedes calificar los talleres en los que fuiste aceptado' });
    }

    if (inscripcion.calificacion) {
      return res.status(400).json({ error: 'Ya has calificado este taller' });
    }

    // Actualizar la inscripción con la calificación
    const { error: errUpdateInsc } = await supabase
      .from('inscripciones')
      .update({ calificacion: nota, comentario_calificacion: comentario_calificacion?.trim() || null })
      .eq('id', req.params.id);

    if (errUpdateInsc) throw errUpdateInsc;

    // Recalcular promedio del taller
    const tallerId = inscripcion.taller.id;
    const { data: calificaciones } = await supabase
      .from('inscripciones')
      .select('calificacion')
      .eq('taller_id', tallerId)
      .not('calificacion', 'is', null);

    let num_calificaciones = calificaciones?.length || 0;
    let suma = calificaciones?.reduce((acc, curr) => acc + curr.calificacion, 0) || 0;
    let promedio = num_calificaciones > 0 ? (suma / num_calificaciones).toFixed(1) : 5.0;

    // Actualizar taller
    await supabase.from('talleres')
      .update({ calificacion_promedio: promedio, num_calificaciones })
      .eq('id', tallerId);

    return res.json({ message: 'Calificación enviada con éxito', calificacion: nota, promedio_actual: promedio });
  } catch (err) {
    console.error('❌ Error POST /inscripciones/:id/calificar:', err.message);
    return res.status(500).json({ error: 'Error al enviar la calificación' });
  }
});

/* ── POST /api/inscripciones/:id/comprobante — Subir comprobante de pago ── */
router.post('/:id/comprobante', verificarToken, async (req, res) => {
  try {
    const { comprobante_pago } = req.body;
    if (!comprobante_pago) return res.status(400).json({ error: 'El comprobante es obligatorio' });

    // Verificar que la inscripción exista y pertenezca al estudiante
    const { data: inscripcion, error: errInsc } = await supabase
      .from('inscripciones')
      .select('id')
      .eq('id', req.params.id)
      .eq('estudiante_id', req.usuario.id)
      .single();

    if (errInsc || !inscripcion) return res.status(404).json({ error: 'Inscripción no encontrada' });

    // Actualizar comprobante
    const { error: errUpdate } = await supabase
      .from('inscripciones')
      .update({ comprobante_pago })
      .eq('id', req.params.id);

    if (errUpdate) throw errUpdate;

    return res.json({ message: 'Comprobante subido exitosamente' });
  } catch (err) {
    console.error('❌ Error POST /inscripciones/:id/comprobante:', err.message);
    return res.status(500).json({ error: 'Error al subir el comprobante' });
  }
});

/* ── PATCH /api/inscripciones/:id/pago — Verificar pago (Instructor) ── */
router.patch('/:id/pago', verificarToken, async (req, res) => {
  try {
    const { estado_pago } = req.body; // 'pagado' o 'rechazado'
    if (!['pagado', 'rechazado'].includes(estado_pago)) return res.status(400).json({ error: 'Estado de pago inválido' });

    // Buscar inscripción y taller
    const { data: inscripcion, error: errInsc } = await supabase
      .from('inscripciones')
      .select('*, taller:talleres!taller_id(instructor_id)')
      .eq('id', req.params.id)
      .single();

    if (errInsc || !inscripcion) return res.status(404).json({ error: 'Inscripción no encontrada' });

    // Solo el instructor del taller puede verificar el pago
    if (String(inscripcion.taller.instructor_id) !== String(req.usuario.id)) {
      return res.status(403).json({ error: 'No tienes permiso para verificar este pago' });
    }

    // Actualizar estado de pago. Si es rechazado, opcionalmente podrías borrar el comprobante_pago,
    // pero lo dejamos para que el alumno suba uno nuevo y reemplace el anterior
    const updateData = { estado_pago };
    
    // Si queremos, si el instructor rechaza el pago, lo volvemos a poner como pendiente
    // para que el alumno pueda volver a subir, pero marcamos una bandera de rechazado.
    // Para simplificar, usaremos estado_pago = 'pendiente' y borramos el comprobante para que suba de nuevo,
    // o simplemente marcamos como rechazado. 
    if (estado_pago === 'rechazado') {
      updateData.estado_pago = 'pendiente'; // vuelve a estar pendiente
      updateData.comprobante_pago = null;   // se borra el comprobante inválido
    }

    const { error: errUpdate } = await supabase
      .from('inscripciones')
      .update(updateData)
      .eq('id', req.params.id);

    if (errUpdate) throw errUpdate;

    return res.json({ message: estado_pago === 'pagado' ? 'Pago verificado exitosamente' : 'Pago rechazado, se le pedirá al estudiante que vuelva a subirlo' });
  } catch (err) {
    console.error('❌ Error PATCH /inscripciones/:id/pago:', err.message);
    return res.status(500).json({ error: 'Error al actualizar el pago' });
  }
});

module.exports = router;
