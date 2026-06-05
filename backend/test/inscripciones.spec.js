const request = require('supertest');
const express = require('express');
const inscripcionesRoutes = require('../src/routes/inscripciones');

// Mockear middleware
jest.mock('../src/middleware/authMiddleware', () => ({
  verificarToken: (req, res, next) => {
    req.usuario = { id: 1, rol: 'estudiante' };
    next();
  }
}));

jest.mock('../src/db/supabase', () => {
  const mockDb = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn()
  };
  return { supabase: mockDb };
});

const { supabase: mockSupabase } = require('../src/db/supabase');

const app = express();
app.use(express.json());
app.use('/api/inscripciones', inscripcionesRoutes);

describe('Sprint 3: Búsqueda y Solicitud (SDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Solicitar Producto o Servicio (Demandante)', () => {
    it('Debe crear una inscripción con estado "pendiente" y mensaje', async () => {
      // Mock taller existe y tiene cupos
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: 10, titulo: 'Curso de JS', cupos_disponibles: 5, activo: true, fecha: '2026-10-10' },
        error: null 
      });

      // Mock no existe inscripción previa
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      // Mock insert().select().single()
      mockSupabase.single.mockResolvedValueOnce({ error: null });
      // Mock update().eq().select().single()
      mockSupabase.single.mockResolvedValueOnce({ error: null });

      const res = await request(app)
        .post('/api/inscripciones')
        .send({
          taller_id: 10,
          mensaje_solicitud: 'Quiero aprender mucho'
        });

      expect(res.statusCode).toBe(201);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          estado_solicitud: 'pendiente',
          mensaje_solicitud: 'Quiero aprender mucho'
        })
      );
    });
  });

  describe('Confirmación de la Solicitud (Ofertante)', () => {
    it('El instructor puede rechazar una solicitud y devolver el cupo', async () => {
      // Para probar la ruta de instructor, cambiamos el rol temporalmente en la prueba
      jest.mock('../src/middleware/authMiddleware', () => ({
        verificarToken: (req, res, next) => {
          req.usuario = { id: 2, rol: 'instructor' };
          next();
        }
      }));

      // Mock inscripción existe, pertenece al instructor (id=1)
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { 
          id: 5, 
          estado_solicitud: 'pendiente',
          taller: { id: 10, instructor_id: 1, cupos_disponibles: 4, cupos_totales: 5 } 
        },
        error: null 
      });

      // Como nuestro mock en este test tiene req.usuario.id = 1 (del require original), coincidirá.
      // Mock update estado
      mockSupabase.single.mockResolvedValueOnce({ error: null });

      // Mock get taller
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { cupos_disponibles: 4, cupos_totales: 5 },
        error: null 
      });
      // Mock update cupos return
      mockSupabase.single.mockResolvedValueOnce({ error: null });

      const res = await request(app)
        .patch('/api/inscripciones/5/estado')
        .send({ estado_solicitud: 'rechazada', motivo_rechazo: 'No cumples los requisitos' });

      expect(res.statusCode).toBe(200);
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          estado_solicitud: 'rechazada',
          motivo_rechazo: 'No cumples los requisitos'
        })
      );
    });
  });
});
