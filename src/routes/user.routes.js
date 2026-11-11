import { Router } from "express";
import { createUser, login, getUserById } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.js"
const router = Router();


// Crear usuario (Register) 
router.post("/users", createUser)
// Login
router.post("/users/login", login)
// Borrar usuario por ID
// Obtener usuario por ID
router.get("/users/:id", authenticate, getUserById)
// Actualizar usuario por ID
// router.put("/users/:id", authenticate, updateUserById)
// A partir del token si un usuario quiere actualizar los datos primero voy a verificar su autenticidad/que este logueado y luego permitir la actualización

// Obtener todos los usuarios
// Logout


export default router;