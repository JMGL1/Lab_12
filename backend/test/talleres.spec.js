const request = require('supertest');
const express = require('express');
const talleresRoutes = require('../src/routes/talleres');

// Mockear middleware y Supabase para pruebas unitarias rápidas y limpias sin depender de la red
jest.mock('../src/middleware/authMiddleware', () => ({
  verificarToken: (req, res, next) => {
    req.usuario = { id: 1, rol: 'instructor' };
    next();
  },
  soloAdmin: (req, res, next) => {
    req.usuario = { id: 2, rol: 'administrador' };
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
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn()
  };
  return { supabase: mockDb };
});

const { supabase: mockSupabase } = require('../src/db/supabase');

const app = express();
app.use(express.json());
app.use('/api/talleres', talleresRoutes);

describe('Sprint 2: Gestión de Productos/Servicios (SDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HU-01: Registro de Producto/Servicio (Ofertante)', () => {
    it('Debe crear un taller con estado inicial "pendiente"', async () => {
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: 10, titulo: 'Curso de JS', estado_validacion: 'pendiente' },
        error: null 
      });

      const res = await request(app)
        .post('/api/talleres')
        .send({
          titulo: 'Curso de JS',
          categoria: 'Programación',
          fecha: '2026-10-10',
          precio: 100
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.taller.estado_validacion).toBe('pendiente');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Curso de JS',
          estado_validacion: 'pendiente'
        })
      );
    });
  });

  describe('HU-02: Edición de Producto/Servicio (Ofertante)', () => {
    it('Cualquier edición debe devolver el estado a "pendiente"', async () => {
      // Mock instructorPropietario middleware check
      mockSupabase.single.mockResolvedValueOnce({ data: { instructor_id: 1 } });
      
      // Mock update
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: 10, titulo: 'Curso de JS Avanzado', estado_validacion: 'pendiente' },
        error: null 
      });

      const res = await request(app)
        .put('/api/talleres/10')
        .send({
          titulo: 'Curso de JS Avanzado'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.taller.estado_validacion).toBe('pendiente');
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Curso de JS Avanzado',
          estado_validacion: 'pendiente'
        })
      );
    });
  });

  describe('HU-03: Validación de Contenido (Administrador)', () => {
    it('El administrador debe poder aprobar un taller pendiente', async () => {
      // Usamos el token mockeado pero como admin, la ruta parchea el estado
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: 10, estado_validacion: 'aprobado' },
        error: null 
      });

      const res = await request(app)
        .patch('/api/talleres/10/validacion')
        .send({ estado_validacion: 'aprobado' });

      expect(res.statusCode).toBe(200);
      expect(res.body.taller.estado_validacion).toBe('aprobado');
      expect(mockSupabase.update).toHaveBeenCalledWith({ estado_validacion: 'aprobado' });
    });

    it('El administrador debe poder rechazar un taller pendiente', async () => {
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: 10, estado_validacion: 'rechazado' },
        error: null 
      });

      const res = await request(app)
        .patch('/api/talleres/10/validacion')
        .send({ estado_validacion: 'rechazado' });

      expect(res.statusCode).toBe(200);
      expect(res.body.taller.estado_validacion).toBe('rechazado');
    });
  });

  describe('Exploración y Visibilidad (Demandante)', () => {
    it('Solo los talleres "aprobados" deben ser listados en la vista pública', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [{ id: 1, estado_validacion: 'aprobado' }],
        count: 1,
        error: null
      });

      const res = await request(app).get('/api/talleres');
      expect(res.statusCode).toBe(200);
      expect(mockSupabase.eq).toHaveBeenCalledWith('estado_validacion', 'aprobado');
    });
  });
});
