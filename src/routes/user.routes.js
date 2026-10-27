import { Router } from "express";
import { createUser, login } from "../controllers/user.controller.js";

const router = Router();


// Crear usuario (Register) 
router.post("/users", createUser)
// Login
router.post("/users/login", login)
// Borrar usuario por ID
// Obtener usuario por ID
// Actualizar usuario por ID
// Obtener todos los usuarios
// Logout


export default router;