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

/* ── POST /api/inscripciones — Inscribirse a un taller ── */
router.post('/', verificarToken, async (req, res) => {
  try {
    if (req.usuario.rol !== 'estudiante') {
      return res.status(403).json({ error: 'Solo los estudiantes pueden inscribirse en talleres' });
    }
    const { taller_id } = req.body;
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

    if (existente) return res.status(409).json({ error: 'Ya estás inscrito en este taller' });

    // Inscribir y decrementar cupo
    const { error: errInscripcion } = await supabase
      .from('inscripciones')
      .insert({ taller_id, estudiante_id: req.usuario.id });

    if (errInscripcion) throw errInscripcion;

    await supabase.from('talleres').update({ cupos_disponibles: taller.cupos_disponibles - 1 }).eq('id', taller_id);

    return res.status(201).json({ message: `Te has inscrito exitosamente en "${taller.titulo}"` });
  } catch (err) {
    console.error('❌ Error POST /inscripciones:', err.message);
    return res.status(500).json({ error: 'Error al procesar la inscripción' });
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

module.exports = router;
