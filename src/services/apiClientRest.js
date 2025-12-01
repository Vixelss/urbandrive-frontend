// src/services/apiClientRest.js
const axios = require('axios');

// Base de tus APIs de gestión
const API_BASE_URL = 'http://urbandrivegestionrest.runasp.net/api/v1';

// Creamos una instancia de axios reutilizable
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// =======================================
// Vehículos
// =======================================

async function getVehiculos() {
  try {
    const response = await api.get('/vehiculos');
    // Tu API devuelve algo tipo { data: [...] }
    return response.data;
  } catch (error) {
    console.error('Error al obtener vehículos desde la API:', error.message);
    throw error;
  }
}

async function getVehiculoPorId(idVehiculo) {
  try {
    const response = await api.get(`/vehiculos/${idVehiculo}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener vehículo por id:', error.message);
    throw error;
  }
}

// =======================================
// Usuarios (para login / registro público)
// =======================================

// 1) Traer todos los usuarios
async function obtenerUsuarios() {
  try {
    const resp = await api.get('/usuarios');
    // Según tu Swagger: { data: [ {...}, {...} ] }
    const data = resp.data && resp.data.data ? resp.data.data : [];
    return data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error.message);
    throw error;
  }
}

// 2) "Login" local: busca por email y compara contraseña
async function loginUsuarioPorListado(email, contrasena) {
  const usuarios = await obtenerUsuarios();
  const usuario = usuarios.find(
    (u) =>
      String(u.Email).toLowerCase() === String(email).toLowerCase()
  );

  if (!usuario) {
    return null;
  }

  // En tu BD las contraseñas están en texto plano (ej: "1234")
  if (String(usuario.Contrasena) !== String(contrasena)) {
    return null;
  }

  return usuario;
}

// 3) Registrar usuario público
async function registrarUsuario(payload) {
  // payload debe tener: Nombre, Apellido, Email, Contrasena, Pais, Edad,
  // TipoIdentificacion, Identificacion, Rol, etc.
  try {
    const resp = await api.post('/usuarios', payload);
    // Asumiendo respuesta: { data: { ...nuevoUsuario } }
    return resp.data && resp.data.data ? resp.data.data : null;
  } catch (error) {
    console.error(
      'Error al registrar usuario en la API:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// =======================================
// Transmisiones
// =======================================

async function getTransmisiones() {
  // Lista por defecto por si la API falla o viene rara
  const fallback = [
    { codigo: 'MT', nombre: 'Manual' },
    { codigo: 'AT', nombre: 'Automática' },
    { codigo: 'CVT', nombre: 'CVT' }
  ];

  try {
    const resp = await api.get('/categoriasvehiculo/transmisiones');
    const data = resp.data;

    if (!Array.isArray(data)) {
      return fallback;
    }

    const mapa = new Map();

    data.forEach((item) => {
      if (!item) return;

      // Caso 1: la API devuelve strings: "Manual", "Automática", "CVT"
      if (typeof item === 'string') {
        const lower = item.toLowerCase();
        if (lower.includes('man')) {
          mapa.set('MT', { codigo: 'MT', nombre: item });
        } else if (lower.includes('aut')) {
          mapa.set('AT', { codigo: 'AT', nombre: item });
        } else if (lower.includes('cvt')) {
          mapa.set('CVT', { codigo: 'CVT', nombre: item });
        }
        return;
      }

      // Caso 2: objetos { id_transmision, nombre, descripcion, ... }
      const nombre = (item.nombre || item.Nombre || '').toString();
      const desc = (item.descripcion || item.Descripcion || '').toString();
      const texto = (nombre + ' ' + desc).toLowerCase();

      let codigo = 'MT';
      if (texto.includes('aut')) codigo = 'AT';
      else if (texto.includes('cvt')) codigo = 'CVT';
      else if (texto.includes('man')) codigo = 'MT';

      const label =
        desc ||
        nombre ||
        (codigo === 'MT'
          ? 'Manual'
          : codigo === 'AT'
          ? 'Automática'
          : 'CVT');

      mapa.set(codigo, { codigo, nombre: label });
    });

    const lista = Array.from(mapa.values());
    return lista.length > 0 ? lista : fallback;
  } catch (error) {
    console.error('Error al obtener transmisiones:', error.message);
    return fallback;
  }
}

// =======================================
// Carrito
// =======================================

async function agregarItemCarrito({ idUsuario, idVehiculo, fechaInicio, fechaFin }) {
  try {
    const body = {
      IdUsuario: idUsuario,
      IdVehiculo: idVehiculo,
      FechaInicio: fechaInicio,
      FechaFin: fechaFin
    };

    const resp = await api.post('/carrito/agregar', body);
    return resp.data;
  } catch (error) {
    console.error(
      'Error al llamar a la API de carrito/agregar:',
      error.response?.data || error.message
    );
    throw error; // muy importante para que el controlador pueda leer el error
  }
}

async function obtenerDetalleCarrito(idCarrito) {
  if (!idCarrito) return null;

  try {
    const resp = await api.get(`/carrito/${idCarrito}/detalle`);
    return resp.data;
  } catch (error) {
    console.error(
      'Error al obtener detalle de carrito:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function getCarritoPorUsuario(idUsuario) {
  const resp = await api.get(`/carrito/usuario/${idUsuario}`);
  return resp.data;
}

async function eliminarItemCarrito(idItem) {
  const resp = await api.delete(`/carrito/item/${idItem}`);
  return resp.data;
}

// =========================================================
// VEHICULOS - CRUD COMPLETO (panel admin)
// =========================================================

async function crearVehiculo(data) {
  const resp = await api.post('/vehiculos', data);
  return resp.data;
}

async function actualizarVehiculo(id, data) {
  const resp = await api.put(`/vehiculos/${id}`, data);
  return resp.data;
}

async function eliminarVehiculo(id) {
  const resp = await api.delete(`/vehiculos/${id}`);
  return resp.data;
}

async function getCategoriasVehiculo() {
  try {
    const resp = await api.get('/categoriasvehiculo');
    return resp.data;
  } catch (err) {
    console.error(
      'Error al obtener categorias desde la API:',
      err.response?.status,
      err.response?.data
    );

    // ===== FALLBACK =====
    // Si la API de categorias falla,
    // armamos las categorias a partir de los vehiculos existentes.
    try {
      const vehiculos = await getVehiculos();
      const mapa = new Map();

      vehiculos.forEach((v) => {
        const id =
          v.IdCategoria ||
          v.idCategoria ||
          v.idCategoriaVehiculo ||
          v.id_categoria;

        const nombre =
          v.NombreCategoria ||
          v.nombreCategoria ||
          v.Categoria ||
          v.categoria;

        if (id != null && nombre && !mapa.has(id)) {
          mapa.set(id, { IdCategoria: id, Nombre: nombre });
        }
      });

      return Array.from(mapa.values());
    } catch (e2) {
      console.error('Error generando categorias de respaldo:', e2);
      return [];
    }
  }
}

// =========================================================
// SUCURSALES / PROMOCIONES
// =========================================================

async function getSucursales() {
  const resp = await api.get('/sucursales');
  const data = resp.data;

  // Si ya viene como arreglo, lo devolvemos tal cual
  if (Array.isArray(data)) {
    return data;
  }

  // Si viniera envuelto en alguna propiedad (por si acaso)
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.Sucursales)) return data.Sucursales;

  // Fallback: siempre devolvemos un array (aunque vacío)
  return [];
}

async function getPromociones() {
  const resp = await api.get('/promociones');
  const data = resp.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.Promociones)) return data.Promociones;

  return [];
}

// =======================
// USUARIOS (CRUD ADMIN)
// =======================

function normalizarUsuarioApi(raw) {
  if (!raw) return null;

  return {
    IdUsuario: raw.IdUsuario ?? raw.idUsuario ?? raw.id_usuario,
    Nombre: raw.Nombre ?? raw.nombre ?? '',
    Apellido: raw.Apellido ?? raw.apellido ?? '',
    Email: raw.Email ?? raw.email ?? '',
    Contrasena: raw.Contrasena ?? raw.contrasena ?? '',
    Direccion: raw.Direccion ?? raw.direccion ?? '',
    Pais: raw.Pais ?? raw.pais ?? '',
    Edad: raw.Edad ?? raw.edad ?? null,
    TipoIdentificacion:
      raw.TipoIdentificacion ?? raw.tipo_identificacion ?? '',
    Identificacion: raw.Identificacion ?? raw.identificacion ?? '',
    Rol: raw.Rol ?? raw.rol ?? ''
  };
}

async function getUsuarios() {
  try {
    const resp = await api.get('/usuarios');
    const data = resp.data;
    const lista = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
      ? data
      : [];
    return lista.map(normalizarUsuarioApi);
  } catch (err) {
    console.error(
      'Error al obtener usuarios:',
      err.response?.data || err.message
    );
    throw err;
  }
}

async function getUsuarioPorId(id) {
  try {
    const resp = await api.get(`/usuarios/${id}`);
    const data = resp.data;
    const raw = data?.data ?? data;
    return normalizarUsuarioApi(raw);
  } catch (err) {
    console.error(
      'Error al obtener usuario por id:',
      err.response?.data || err.message
    );
    throw err;
  }
}

async function crearUsuario(dto) {
  try {
    const body = {
      Nombre: dto.Nombre,
      Apellido: dto.Apellido,
      Email: dto.Email,
      Contrasena: dto.Contrasena,
      Direccion: dto.Direccion,
      Pais: dto.Pais,
      Edad: dto.Edad,
      TipoIdentificacion: dto.TipoIdentificacion,
      Identificacion: dto.Identificacion,
      Rol: dto.Rol
    };

    const resp = await api.post('/usuarios', body);
    return resp.data;
  } catch (err) {
    console.error(
      'Error al crear usuario:',
      err.response?.data || err.message
    );
    throw err;
  }
}

async function actualizarUsuario(id, dto) {
  try {
    const body = {
      IdUsuario: id,
      Nombre: dto.Nombre,
      Apellido: dto.Apellido,
      Email: dto.Email,
      Contrasena: dto.Contrasena,
      Direccion: dto.Direccion,
      Pais: dto.Pais,
      Edad: dto.Edad,
      TipoIdentificacion: dto.TipoIdentificacion,
      Identificacion: dto.Identificacion,
      Rol: dto.Rol
    };

    const resp = await api.put(`/usuarios/${id}`, body);
    return resp.data;
  } catch (err) {
    console.error(
      'Error al actualizar usuario:',
      err.response?.data || err.message
    );
    throw err;
  }
}

async function eliminarUsuario(id) {
  try {
    const resp = await api.delete(`/usuarios/${id}`);
    return resp.data;
  } catch (err) {
    console.error(
      'Error al eliminar usuario:',
      err.response?.data || err.message
    );
    throw err;
  }
}

// =========================
// RESERVAS (público + admin)
// =========================

async function crearReserva(reservaDto) {
  try {
    const resp = await api.post('/reservas', reservaDto);
    // Si la API envuelve en { data: { ... } }
    return resp.data?.data ?? resp.data;
  } catch (err) {
    console.error(
      'Error al crear reserva:',
      err.response?.data || err.message
    );
    throw err;
  }
}

async function getReservasPorUsuario(idUsuario) {
  try {
    const resp = await api.get(`/reservas/usuario/${idUsuario}`);
    const data = resp.data;

    // Puede venir como arreglo directo o en data
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch (err) {
    console.error(
      'Error al obtener reservas del usuario:',
      err.response?.data || err.message
    );
    throw err;
  }
}

async function getReservaPorId(idReserva) {
  try {
    const resp = await api.get(`/reservas/${idReserva}`);
    const data = resp.data;
    // Igual, defendemos por si viene envuelto
    return data?.data ?? data;
  } catch (err) {
    console.error(
      'Error al obtener reserva por id:',
      err.response?.data || err.message
    );
    throw err;
  }
}

async function getReservas() {
  try {
    const resp = await api.get('/reservas');
    const data = resp.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch (err) {
    console.error(
      'Error al obtener reservas:',
      err.response?.data || err.message
    );
    throw err;
  }
}

async function actualizarReserva(idReserva, reservaDto) {
  try {
    const resp = await api.put(`/reservas/${idReserva}`, reservaDto);
    return resp.data?.data ?? resp.data;
  } catch (err) {
    console.error(
      'Error al actualizar reserva:',
      err.response?.data || err.message
    );
    throw err;
  }
}

async function eliminarReserva(idReserva) {
  try {
    const resp = await api.delete(`/reservas/${idReserva}`);
    return resp.data?.data ?? resp.data;
  } catch (err) {
    console.error(
      'Error al eliminar reserva:',
      err.response?.data || err.message
    );
    throw err;
  }
}

// =======================
// RESERVAS (ADMIN)
// =======================

async function getReservasAdmin() {
  const resp = await api.get('/reservas');
  const data = resp.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}


async function getReservaPorId(idReserva) {
  const resp = await api.get(`/reservas/${idReserva}`);
  return resp.data;
}

async function crearReservaAdmin(reserva) {
  const resp = await api.post('/reservas', reserva);
  return resp.data;
}

async function actualizarReservaAdmin(idReserva, reserva) {
  const resp = await api.put(`/reservas/${idReserva}`, reserva);
  return resp.data;
}

async function eliminarReservaAdmin(idReserva) {
  const resp = await api.delete(`/reservas/${idReserva}`);
  return resp.data;
}

async function cambiarEstadoReserva(idReserva, nuevoEstado) {
  const resp = await api.patch(`/reservas/${idReserva}/estado/${nuevoEstado}`);
  return resp.data;
}

// =======================
// FACTURAS (ADMIN)
// =======================

// =======================
// FACTURAS (ADMIN)
// =======================
async function getFacturasAdmin() {
  const resp = await api.get('/facturas');
  const data = resp.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}



async function getFacturaPorId(idFactura) {
  const resp = await api.get(`/facturas/${idFactura}`);
  const data = resp.data;
  return data?.data ?? data;
}


async function crearFacturaAdmin(factura) {
  const resp = await api.post('/facturas', factura);
  return resp.data;
}

async function actualizarFacturaAdmin(idFactura, factura) {
  const resp = await api.put(`/facturas/${idFactura}`, factura);
  return resp.data;
}

async function eliminarFacturaAdmin(idFactura) {
  const resp = await api.delete(`/facturas/${idFactura}`);
  return resp.data;
}


// =======================================
// Exportar TODO
// =======================================

module.exports = {
  // vehículos (público + admin)
  getVehiculos,
  getVehiculoPorId,
  crearVehiculo,
  actualizarVehiculo,
  eliminarVehiculo,
  getCategoriasVehiculo,
  getSucursales,
  getPromociones,

  // usuarios (login / registro público)
  obtenerUsuarios,
  loginUsuarioPorListado,
  registrarUsuario,

  // usuarios (CRUD admin)
  getUsuarios,
  getUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,

  // categorías / transmisiones
  getTransmisiones,

  // carrito
  agregarItemCarrito,
  obtenerDetalleCarrito,
  getCarritoPorUsuario,
  eliminarItemCarrito,

  // reservas (público + admin)
  crearReserva,
  getReservasPorUsuario,
  getReservaPorId,
  getReservas,
  actualizarReserva,
  eliminarReserva,

  // facturas (admin)
  getReservasAdmin,
  getReservaPorId,
  crearReservaAdmin,
  actualizarReservaAdmin,
  eliminarReservaAdmin,
  cambiarEstadoReserva,
  getFacturasAdmin,
  getFacturaPorId,
  crearFacturaAdmin,
  actualizarFacturaAdmin,
  eliminarFacturaAdmin
};
