import { Router } from "express";

import {  
          getProducts, 
          getProductById,
          createProduct,
          updateProduct,
          deleteProduct
       } from "../controllers/product.controller.js"

import { authenticate, isAdmin } from "../middleware/auth.js";

const router = Router();

// Obtener todos los productos
// #Vamos a proteger la lectura de productos solo para usuarios autenticados
router.get("/products", getProducts);



// Obtener un producto específico por su ID
router.get("/products/:id", getProductById);


// Crear un nuevo producto
router.post("/products", authenticate, isAdmin, createProduct);
// Actualizar un producto específico por su ID

router.put("/products/:id", authenticate, isAdmin, updateProduct); 
// Eliminar un producto específico por su ID

router.delete("/products/:id", authenticate, isAdmin, deleteProduct);


export default router;