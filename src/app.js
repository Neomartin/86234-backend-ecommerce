// En el archivo app vamos a configurar y exportar la aplicación Express
import express from "express";
import productRoutes from "./routes/product.routes.js";

// Inicializar la aplicación Express
const app = express();

// Middleware para parsear el body de las solicitudes como JSON
app.use(   express.json()    );

app.use(productRoutes);  // Endpoint para las rutas de productos

export default app;