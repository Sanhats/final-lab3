const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta"

// Middleware
app.use(cors())
app.use(express.json())

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/contactos-app")
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error conectando a MongoDB:", err))

// Modelos
const contactoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  empresa: String,
  domicilio: String,
  telefonos: String,
  email: { type: String, required: true },
  propietario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
  esPublico: { type: Boolean, default: false },
  esVisible: { type: Boolean, default: true },
  esUsuario: { type: Boolean, default: false },
})

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  esUsuario: { type: Boolean, default: true },
})

const Contacto = mongoose.model("Contacto", contactoSchema)
const Usuario = mongoose.model("Usuario", usuarioSchema)

// Middleware de autenticación
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "")
    const decoded = jwt.verify(token, JWT_SECRET)
    const usuario = await Usuario.findById(decoded.id)

    if (!usuario) {
      throw new Error()
    }

    req.token = token
    req.usuario = usuario
    next()
  } catch (error) {
    res.status(401).send({ error: "Por favor autentíquese." })
  }
}

// Middleware de administrador
const adminAuth = (req, res, next) => {
  if (!req.usuario.isAdmin) {
    return res.status(403).send({ error: "Acceso denegado. Se requieren permisos de administrador." })
  }
  next()
}

// Rutas de autenticación
app.post("/auth/register", async (req, res) => {
  try {
    const { nombre, apellido, email, password } = req.body

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ email })
    if (usuarioExistente) {
      return res.status(400).send({ error: "El email ya está registrado" })
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Crear usuario
    const usuario = new Usuario({
      nombre,
      apellido,
      email,
      password: hashedPassword,
    })

    await usuario.save()

    // Crear contacto asociado al usuario
    const contacto = new Contacto({
      nombre,
      apellido,
      email,
      propietario: usuario._id,
      esUsuario: true,
    })

    await contacto.save()

    // Generar token
    const token = jwt.sign({ id: usuario._id }, JWT_SECRET, { expiresIn: "1d" })

    res.status(201).send({ token, usuario: { id: usuario._id, nombre, apellido, email, isAdmin: usuario.isAdmin } })
  } catch (error) {
    res.status(400).send({ error: error.message })
  }
})

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Buscar usuario
    const usuario = await Usuario.findOne({ email })
    if (!usuario) {
      return res.status(400).send({ error: "Credenciales inválidas" })
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, usuario.password)
    if (!isMatch) {
      return res.status(400).send({ error: "Credenciales inválidas" })
    }

    // Generar token
    const token = jwt.sign({ id: usuario._id }, JWT_SECRET, { expiresIn: "1d" })

    res.send({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        isAdmin: usuario.isAdmin,
      },
    })
  } catch (error) {
    res.status(400).send({ error: error.message })
  }
})

// Rutas de contactos
app.get("/contacts/public", async (req, res) => {
  try {
    const contactos = await Contacto.find({
      esPublico: true,
      esVisible: true,
      esUsuario: false,
    }).sort({ apellido: 1, nombre: 1 })

    res.send(contactos)
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

app.get("/contacts/mis-contactos", auth, async (req, res) => {
  try {
    const contactos = await Contacto.find({
      propietario: req.usuario._id,
      esUsuario: false,
    }).sort({ apellido: 1, nombre: 1 })

    res.send(contactos)
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

app.get("/contacts/all", auth, adminAuth, async (req, res) => {
  try {
    const contactos = await Contacto.find({ esUsuario: false }).sort({ apellido: 1, nombre: 1 })
    res.send(contactos)
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

// Endpoint para que el administrador cambie la visibilidad de un contacto público
app.put("/contacts/:id/visible", auth, adminAuth, async (req, res) => {
  try {
    const contacto = await Contacto.findById(req.params.id)
    if (!contacto) {
      return res.status(404).send({ error: "Contacto no encontrado" })
    }
    if (!contacto.esPublico) {
      return res.status(400).send({ error: "Solo se puede cambiar la visibilidad de contactos públicos" })
    }
    contacto.esVisible = !contacto.esVisible
    await contacto.save()
    res.send(contacto)
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

app.post("/contacts", auth, async (req, res) => {
  try {
    const { nombre, apellido, empresa, domicilio, telefonos, email, esPublico } = req.body

    const contacto = new Contacto({
      nombre,
      apellido,
      empresa,
      domicilio,
      telefonos,
      email,
      propietario: req.usuario._id,
      esPublico: esPublico || false,
    })

    await contacto.save()
    res.status(201).send(contacto)
  } catch (error) {
    res.status(400).send({ error: error.message })
  }
})

app.put("/contacts/:id", auth, async (req, res) => {
  try {
    const contacto = await Contacto.findOne({
      _id: req.params.id,
      propietario: req.usuario._id,
    })

    if (!contacto) {
      return res.status(404).send({ error: "Contacto no encontrado" })
    }

    const updates = Object.keys(req.body)
    const allowedUpdates = ["nombre", "apellido", "empresa", "domicilio", "telefonos", "email", "esPublico"]
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
      return res.status(400).send({ error: "Actualizaciones inválidas" })
    }

    updates.forEach((update) => (contacto[update] = req.body[update]))
    await contacto.save()

    res.send(contacto)
  } catch (error) {
    res.status(400).send({ error: error.message })
  }
})

app.delete("/contacts/:id", auth, async (req, res) => {
  try {
    const contacto = await Contacto.findOneAndDelete({
      _id: req.params.id,
      propietario: req.usuario._id,
      esUsuario: false,
    })

    if (!contacto) {
      return res.status(404).send({ error: "Contacto no encontrado" })
    }

    res.send(contacto)
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

app.put("/contacts/:id/publico", auth, async (req, res) => {
  try {
    const contacto = await Contacto.findOne({
      _id: req.params.id,
      propietario: req.usuario._id,
    })

    if (!contacto) {
      return res.status(404).send({ error: "Contacto no encontrado" })
    }

    contacto.esPublico = !contacto.esPublico
    await contacto.save()

    res.send(contacto)
  } catch (error) {
    res.status(400).send({ error: error.message })
  }
})


// Iniciar servidor
app.listen(PORT, () => {
  console.log("Servidor corriendo en el puerto " + PORT);
  // Crear usuario administrador si no existe
  (async () => {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      const adminNombre = process.env.ADMIN_NOMBRE || "Admin";
      const adminApellido = process.env.ADMIN_APELLIDO || "Principal";
      let admin = await Usuario.findOne({ email: adminEmail });
      if (!admin) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);
        admin = new Usuario({
          nombre: adminNombre,
          apellido: adminApellido,
          email: adminEmail,
          password: hashedPassword,
          isAdmin: true,
        });
        await admin.save();
        // Crear contacto asociado al admin
        const contacto = new Contacto({
          nombre: adminNombre,
          apellido: adminApellido,
          email: adminEmail,
          propietario: admin._id,
          esUsuario: true,
        });
        await contacto.save();
        console.log("Usuario administrador creado:", adminEmail);
      } else {
        console.log("Usuario administrador ya existe:", adminEmail);
      }
    } catch (err) {
      console.error("Error creando usuario administrador:", err);
    }
  })();
});
