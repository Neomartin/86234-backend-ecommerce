// Middleware de autenticación para verificar el token JWT
// Vamos a tener 2 funcionalidades principales:
// 1. Verificar que el usuario esté autenticado mediante el token JWT
// 2. Permitir el acceso a rutas de mayor privilegio solo si el usuario tiene los roles necesarios
import jwt from "jsonwebtoken";

function authenticate(req, res, next) {

  const SECRET = process.env.JWT_SECRET;

  // Ex: Authorization: "Bearer d90asd890as8d9sa908d"
  // const token = req.headers?.authorization?.split(" ")[1]
  const token = req.headers?.authorization

  if(!token) {
    // [401]Unauthorized: no token provided
    return res.status(401).send({
      message: "Token no proporcionado"
    })
  }

  try {
    // Verificamos el token y obtenemos el payload
    const payload = jwt.verify(token, SECRET);
    // Guardamos el payload en req.user para que esté disponible en las siguientes funciones(middlewares o controladores)
    req.user = payload;
    // Continuamos con la ejecución del siguiente middleware o controlador
    next()
    
  } catch (error) {

    console.log(error)
    return res.status(401).send({
      message: "Token inválido"
    })

  }

}


function isAdmin(req, res, next) {
  // En la function authenticate guardamos el payload del token en req.user
  const role = req.user?.role;

  if(role !== "admin" && role !== "god") {
    return res.status(403).send({
      message: "Acceso denegado: se requieren privilegios de administrador"
    });
  }

  next();

}



export { authenticate, isAdmin }