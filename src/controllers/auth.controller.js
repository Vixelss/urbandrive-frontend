// src/controllers/auth.controller.js
const apiClient = require('../services/apiClientRest');

// =======================
// GET /login
// =======================
const mostrarLogin = (req, res) => {
  const returnUrl = req.query.returnUrl || null;

  const mensajeInfo =
    req.query.from === 'carrito'
      ? 'Inicia sesion para agregar vehiculos al carrito.'
      : null;

  res.render('auth/login', {
    titulo: 'Iniciar sesión',
    error: null,
    mensajeInfo,
    returnUrl
  });
};

// =======================
// POST /login
// =======================
async function procesarLogin(req, res) {
  const { email, password, returnUrl } = req.body;
  const destino = returnUrl && returnUrl !== '' ? returnUrl : '/vehiculos';

  if (!email || !password) {
    return res.status(400).render('auth/login', {
      titulo: 'Iniciar sesión',
      error: 'Debes ingresar correo y contraseña.',
      mensajeInfo: null,
      returnUrl: returnUrl || ''
    });
  }

  try {
    const usuario = await apiClient.loginUsuarioPorListado(email, password);

    if (!usuario) {
      return res.status(401).render('auth/login', {
        titulo: 'Iniciar sesión',
        error: 'Email o contraseña incorrectos.',
        mensajeInfo: null,
        returnUrl: returnUrl || ''
      });
    }

    req.session.usuario = {
      id: usuario.IdUsuario,
      nombres: usuario.Nombre,
      apellidos: usuario.Apellido,
      email: usuario.Email,
      rol: usuario.Rol,
      pais: usuario.Pais
    };

    if (String(usuario.Rol || '').toLowerCase() === 'admin') {
      return res.redirect('/admin');
    }

    return res.redirect(destino);
  } catch (err) {
    console.error('Error en login:', err.response?.data || err.message);
    res.status(500).render('auth/login', {
      titulo: 'Iniciar sesión',
      error: 'Ocurrió un error al iniciar sesión. Inténtalo de nuevo.',
      mensajeInfo: null,
      returnUrl: returnUrl || ''
    });
  }
}

// =======================
// GET /registro
// =======================
function mostrarRegistro(req, res) {
  res.render('auth/registro', {
    titulo: 'Crear cuenta',
    errores: [],
    valores: {}
  });
}

// =======================
// POST /registro
// =======================
async function procesarRegistro(req, res) {
  const {
    nombres,
    apellidos,
    email,
    telefono,
    pais,
    tipoIdentificacion,
    identificacion,
    edad,
    direccion,
    password,
    confirmarPassword
  } = req.body;

  const errores = [];

  const valores = {
    nombres,
    apellidos,
    email,
    telefono,
    direccion,
    pais,
    tipoIdentificacion,
    identificacion,
    edad
  };

  // ---------- Validaciones basicas ----------
  if (
    !nombres || !apellidos || !email || !telefono || !pais ||
    !tipoIdentificacion || !identificacion || !edad ||
    !direccion || !password || !confirmarPassword
  ) {
    errores.push('Todos los campos son obligatorios.');
  }

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errores.push('El correo electrónico no tiene un formato válido.');
  }

  // Edad minima 18
  const edadNum = parseInt(edad, 10);
  if (isNaN(edadNum) || edadNum < 18) {
    errores.push('Debes tener al menos 18 años para registrarte.');
  }

  // Contraseña segura
  const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passRegex.test(password || '')) {
    errores.push(
      'La contraseña debe tener mínimo 8 caracteres, con mayúsculas, minúsculas y números.'
    );
  }

  // Confirmacion de contraseña
  if (password !== confirmarPassword) {
    errores.push('Las contraseñas no coinciden.');
  }

  // Validacion de identificacion segun tipo
  if (tipoIdentificacion === 'CI') {
    if (!/^\d{10}$/.test(identificacion)) {
      errores.push('La cédula debe tener exactamente 10 dígitos numéricos.');
    }
  } else if (tipoIdentificacion === 'PASAPORTE') {
    if (!/^[A-Za-z0-9]{6,15}$/.test(identificacion)) {
      errores.push('El pasaporte debe tener entre 6 y 15 caracteres alfanuméricos.');
    }
  } else if (tipoIdentificacion === 'LICENCIA') {
    if (!/^[A-Za-z0-9-]{6,20}$/.test(identificacion)) {
      errores.push('La licencia debe tener entre 6 y 20 caracteres (letras, números o guiones).');
    }
  } else {
    errores.push('Debes seleccionar un tipo de identificación válido.');
  }

  if (errores.length > 0) {
    return res.status(400).render('auth/registro', {
      titulo: 'Crear cuenta',
      errores,
      valores
    });
  }

  // ---------- Llamada a la API ----------
  const payload = {
    Nombre: nombres,
    Apellido: apellidos,
    Email: email,
    Contrasena: password,
    Direccion: direccion,
    Pais: pais,
    Edad: edadNum,
    TipoIdentificacion: tipoIdentificacion,
    Identificacion: identificacion,
    Rol: 'Cliente',
    UsuarioCorreo: null
  };

  try {
    const resp = await apiClient.registrarUsuario(payload);
    const nuevoUsuario = resp?.data || resp;

    if (!nuevoUsuario) {
      return res.status(500).render('auth/registro', {
        titulo: 'Crear cuenta',
        errores: ['No se pudo crear el usuario en el servidor.'],
        valores
      });
    }

    req.session.usuario = {
      id: nuevoUsuario.IdUsuario || nuevoUsuario.idUsuario || nuevoUsuario.id,
      nombres: nuevoUsuario.Nombre || nombres,
      apellidos: nuevoUsuario.Apellido || apellidos,
      email: nuevoUsuario.Email || email,
      rol: nuevoUsuario.Rol || 'Cliente',
      pais: nuevoUsuario.Pais || pais
    };

    res.redirect('/vehiculos');
  } catch (err) {
    console.error('Error registrando usuario:', err.response?.data || err.message);
    res.status(500).render('auth/registro', {
      titulo: 'Crear cuenta',
      errores: ['Ocurrió un error al registrar el usuario.'],
      valores
    });
  }
}

// =======================
// POST /logout
// =======================
function cerrarSesion(req, res) {
  req.session.destroy(() => {
    res.redirect('/');
  });
}

module.exports = {
  mostrarLogin,
  procesarLogin,
  mostrarRegistro,
  procesarRegistro,
  cerrarSesion
};
