const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'learnup_secret';

/* ── Verifica JWT en el header Authorization: Bearer <token> ── */
function verificarToken(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado: token no proporcionado' });
  }

  const token = auth.split(' ')[1];

  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'La sesión ha expirado, inicia sesión nuevamente'
      : 'Token inválido';
    return res.status(401).json({ error: msg });
  }
}

/* ── Solo administrador ── */
function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'administrador') {
    return res.status(403).json({
      error: 'Acceso denegado: se requiere rol de administrador'
    });
  }
  next();
}

/* ── Admin o el propio usuario ── */
function adminOPropietario(req, res, next) {
  const esAdmin = req.usuario?.rol === 'administrador';
  const esPropietario = String(req.usuario?.id) === String(req.params.id);

  if (esAdmin || esPropietario) return next();

  return res.status(403).json({
    error: 'No tienes permiso para acceder a este recurso'
  });
}

module.exports = { verificarToken, soloAdmin, adminOPropietario };
