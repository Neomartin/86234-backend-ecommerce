import User from "../models/user.model.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

// Número de rondas de sal para el hash de la contraseña
const SALT_ROUNDS = 10
// Clave secreta para firmar los tokens JWT - SECRET - SEMILLA - SEED
const JWT_SECRET = "clave_secreta"


async function createUser(req, res) {
  
  try {
    // Controlamos que no se puedan enviar los campos createdAt y updatedAt desde el cliente ya que sino los podría manipular entonces directamente los eliminamos del body
    // delete req.body.createdAt
    // delete req.body.updatedAt
    
    const { name, password, email, image } = req.body

    const newUser = new User.create({ name, password, email, image })
    
    newUser.password = await bcrypt.hash(newUser.password, SALT_ROUNDS)

    // Poder guardar un usuario en la base de datos
    await newUser.save()

    return res.send({
      success: true,
      message: "Usuario creado correctamente"
    })
    
  } catch (error) {
    console.log(error)
    return res.status(500).send({
      success: false,
      message: "Error al crear el usuario"
    })
  }

}



async function deleteUser(req, res) {
  // Si yo uso el id del usuario para eliminarlo
  // await User.findByIdAndDelete()   --> Borrado físico del usuario en la base de datos
  // Si quiero hacer un borrado lógico, podría actualizar un campo como "isDeleted" en lugar de eliminar el registro físicamente.
}




async function login(req, res) {

  try {
    
    // Necesitamos obtener el email y la contraseña del body que envía el cliente
    const { email, password } = req.body

    if(!email || !password) {
      // Devolver un error indicando que faltan campos obligatorios
      return res.status(400).send({
        success: false,
        message: "Faltan campos obligatorios"
      })
    }

    // Buscar el usuario en la base de datos por su email
    const usuario = await User.findOne( { email } );

    // Si findOne no encuentra un usuario con ese email, me devuelve null, y por lo tanto debemos manejar ese caso devolviendo un error
    if(!usuario) {
      return res.status(400).send({
        success: false,
        message: "Credenciales incorrectas"
      })
    }

    // Comparar la contraseña proporcionada con la contraseña almacenada en la base de datos
    const isValidPassword =  await bcrypt.compare(password, usuario.password);

    if(!isValidPassword) {
      return res.status(400).send({
        success: false,
        message: "Credenciales incorrectas"
      })
    }

    usuario.password = undefined

    // Para la que data original del usuario no pueda ser adulterada, vamos a crear un token de autenticación (JWT)
    const token = jwt.sign(usuario.toObject(), JWT_SECRET)


    return res.send({
      success: true,
      message: "Login exitoso",
      user: usuario,
      token
    })


  } catch (error) {
    console.log(error)
    return res.status(500).send({
      success: false,
      message: "Error al hacer login"
    })
  }

}


export {
  createUser,
  login,
  deleteUser
}