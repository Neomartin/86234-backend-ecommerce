// En el archivo app vamos a configurar y exportar la aplicación Express
import express from "express";
import productRoutes from "./routes/product.routes.js";
import userRoutes from "./routes/user.routes.js";
import orderRoutes from "./routes/order.routes.js";
import cors from "cors";

// Inicializar la aplicación Express
const app = express();

// CORS
app.use( cors({
  // origin: "http://martin-ecommerce.com" // Reemplaza con el origen de tu frontend
}) )

// Middleware para parsear el body de las solicitudes como JSON
app.use(   express.json()    );

app.use( [ productRoutes, userRoutes, orderRoutes ] )

export default app;