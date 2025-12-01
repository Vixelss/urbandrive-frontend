// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');

// Middleware para proteger TODAS las rutas de este router
router.use(adminController.requireAdmin);

// =======================
// Dashboard  (/admin)
// =======================
router.get('/', adminController.dashboard);

// =======================
// Vehículos  (/admin/vehiculos/...)
// =======================
router.get('/vehiculos', adminController.listaVehiculos);
router.get('/vehiculos/nuevo', adminController.formNuevoVehiculo);
router.post('/vehiculos/nuevo', adminController.crearVehiculo);

router.get('/vehiculos/:id/editar', adminController.formEditarVehiculo);
router.post('/vehiculos/:id/editar', adminController.actualizarVehiculo);

router.post('/vehiculos/:id/eliminar', adminController.eliminarVehiculo);

// =======================
// Usuarios  (/admin/usuarios/...)
// =======================
router.get('/usuarios', adminController.listaUsuarios);
router.get('/usuarios/nuevo', adminController.formNuevoUsuario);
router.post('/usuarios/nuevo', adminController.crearUsuario);

router.get('/usuarios/:id/editar', adminController.formEditarUsuario);
router.post('/usuarios/:id/editar', adminController.actualizarUsuario);

router.post('/usuarios/:id/eliminar', adminController.eliminarUsuario);

// =======================
// Reservas (admin)
// =======================
router.get('/reservas', adminController.listaReservas);
router.get('/reservas/nueva', adminController.formNuevaReserva);
router.post('/reservas/nueva', adminController.crearReserva);
router.get('/reservas/:id/editar', adminController.formEditarReserva);
router.post('/reservas/:id/editar', adminController.actualizarReserva);
router.post('/reservas/:id/eliminar', adminController.eliminarReserva);
router.post('/reservas/:id/cambiar-estado', adminController.cambiarEstadoReservaController);

// =======================
// Facturas (admin)
// =======================
router.get('/facturas', adminController.listaFacturas);
router.get('/facturas/nueva', adminController.formNuevaFactura);
router.post('/facturas/nueva', adminController.crearFactura);
router.get('/facturas/:id/editar', adminController.formEditarFactura);
router.post('/facturas/:id/editar', adminController.actualizarFactura);
router.post('/facturas/:id/eliminar', adminController.eliminarFactura);

module.exports = router;
