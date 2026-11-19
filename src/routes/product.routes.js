import { Router } from "express";

import {  
          getProducts, 
          getProductById,
          createProduct,
          updateProduct,
          deleteProduct
       } from "../controllers/product.controller.js"

import { authenticate, isAdmin } from "../middleware/auth.js";

import upload from "../middleware/upload.js";
// import { uploadSingleImage } from "../middleware/upload.js";

const router = Router();

// Obtener todos los productos
// #Vamos a proteger la lectura de productos solo para usuarios autenticados
router.get("/products", getProducts);



// Obtener un producto específico por su ID
router.get("/products/:id", getProductById);


// Crear un nuevo producto
// uploadSingleImage recibe la imagen opcional en el campo "image" (form-data), max 5MB, JPG/PNG/WEBP
// #CRAMOS PRODUCTO
router.post("/products", authenticate, isAdmin, upload, createProduct);
// Actualizar un producto específico por su ID

router.put("/products/:id", authenticate, isAdmin, upload, updateProduct); 
// Eliminar un producto específico por su ID

router.delete("/products/:id", authenticate, isAdmin, deleteProduct);


export default router;