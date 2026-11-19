// Middleware para recibir imágenes (multipart/form-data) usando multer.
// Valida:
//   1. Formato: solo JPG, PNG y WEBP (por mimetype Y por extensión)
//   2. Tamaño: máximo 5MB
//
// El archivo se guarda en MEMORIA (req.file.buffer), no en disco, porque luego
// lo vamos a enviar directamente a Cloudinary.
import multer from "multer";
import path from "node:path";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB en bytes
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

// Filtro de formato: se ejecuta ANTES de leer el archivo completo
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
    // Creamos un MulterError propio para manejarlo junto a los demás en handleUploadError
    const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname);
    error.code = "INVALID_FILE_FORMAT";
    error.message = "Formato no permitido. Solo se aceptan JPG, PNG o WEBP";
    return cb(error);
  }

  cb(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_SIZE, // Si se supera, multer lanza LIMIT_FILE_SIZE
    files: 1,           // Solo una imagen por solicitud
  },
  fileFilter,
});

// Middleware que espera UN archivo en el campo "image" del form-data
const uploadSingleImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (!err) return next();

    // Errores de multer (tamaño, formato, campo inesperado, etc.)
    if (err instanceof multer.MulterError) {
      let message = "Error al subir la imagen";

      if (err.code === "LIMIT_FILE_SIZE") {
        message = "La imagen supera el tamaño máximo de 5MB";
      } else if (err.code === "INVALID_FILE_FORMAT") {
        message = err.message;
      } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
        message = 'Campo de archivo inesperado. Usa el campo "image"';
      }

      return res.status(400).send({ success: false, message });
    }

    // Cualquier otro error inesperado
    console.log(err);
    return res.status(500).send({
      success: false,
      message: "Error al procesar la imagen",
    });
  });
};

export { uploadSingleImage };


/* ============================================================================
   CÓMO SUBIR LA IMAGEN A CLOUDINARY
   ============================================================================

   1. Instalar el SDK:
        npm install cloudinary

   2. Agregar las credenciales al .env (las encuentras en el Dashboard de Cloudinary):
        CLOUDINARY_CLOUD_NAME=tu_cloud_name
        CLOUDINARY_API_KEY=tu_api_key
        CLOUDINARY_API_SECRET=tu_api_secret

   3. Crear src/config/cloudinary.js:

        import { v2 as cloudinary } from "cloudinary";

        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        export default cloudinary;

      (Importarlo después de dotenv, para que process.env ya esté cargado.)

   4. Como usamos memoryStorage, tenemos un Buffer (req.file.buffer), no una ruta.
      Cloudinary lo recibe con upload_stream:

        import cloudinary from "../config/cloudinary.js";

        function uploadToCloudinary(buffer) {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "ecommerce/products" },   // carpeta en Cloudinary
              (error, result) => (error ? reject(error) : resolve(result))
            );
            stream.end(buffer);
          });
        }

   5. Usarlo en el controlador createProduct (src/controllers/product.controller.js):

        export async function createProduct(req, res) {
          try {
            req.body.createdAt = undefined;

            // Si llegó una imagen, la subimos y guardamos la URL en el campo "image"
            if (req.file) {
              const result = await uploadToCloudinary(req.file.buffer);
              req.body.image = result.secure_url;   // URL https de la imagen
              // Opcional: guardar result.public_id en el modelo para poder
              // borrarla después con cloudinary.uploader.destroy(public_id)
            }

            const nuevoProducto = new Product(req.body);
            await nuevoProducto.save();
            ...
          }
        }

   6. En la ruta (src/routes/product.routes.js), el orden importa:
        router.post("/products", authenticate, isAdmin, uploadSingleImage, createProduct);

      authenticate/isAdmin van ANTES para no procesar archivos de usuarios sin permiso.

   NOTA: con multipart/form-data los campos de texto (name, price, ...) llegan
   en req.body como strings; Mongoose los convierte a Number automáticamente.
   Desde Postman/Thunder: Body -> form-data, campo "image" tipo File.
   ============================================================================ */


/* ============================================================================
   CÓMO ENVIAR LA IMAGEN DESDE EL FRONT
   ============================================================================

   Hay que usar FormData (NO JSON). El campo del archivo debe llamarse "image",
   igual que en upload.single("image").

   --- HTML ---
        <form id="productForm">
          <input type="text"   name="name"        required />
          <input type="number" name="price"       required />
          <input type="text"   name="description" required />
          <input type="number" name="stock" />
          <input type="file"   name="image" accept="image/png, image/jpeg, image/webp" />
          <button type="submit">Crear producto</button>
        </form>

   --- JavaScript con fetch ---
        const form = document.getElementById("productForm");

        form.addEventListener("submit", async (e) => {
          e.preventDefault();

          // Validación previa en el front (mejor UX, el back igual vuelve a validar)
          const file = form.image.files[0];
          if (file) {
            const allowed = ["image/jpeg", "image/png", "image/webp"];
            if (!allowed.includes(file.type)) return alert("Formato no permitido");
            if (file.size > 5 * 1024 * 1024)  return alert("La imagen supera los 5MB");
          }

          // FormData toma todos los campos del form (incluido el archivo)
          const formData = new FormData(form);

          const response = await fetch("http://localhost:3000/products", {
            method: "POST",
            headers: {
              // Nuestro middleware auth lee el token directo (sin "Bearer ")
              Authorization: localStorage.getItem("token"),
              // ¡NO poner "Content-Type"! El navegador lo agrega solo con el
              // "boundary" correcto (multipart/form-data; boundary=...).
              // Si lo pones a mano, multer no podrá leer el body.
            },
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) return alert(data.message); // ej: "La imagen supera el tamaño máximo de 5MB"

          console.log(data.product.image); // URL de Cloudinary
        });

   --- Con axios ---
        const formData = new FormData();
        formData.append("name", "Zapatillas");
        formData.append("price", 15000);
        formData.append("description", "Zapatillas deportivas");
        formData.append("image", fileInput.files[0]); // ← el archivo

        const { data } = await axios.post("http://localhost:3000/products", formData, {
          headers: { Authorization: token }, // axios también arma el Content-Type solo
        });

   --- React (input controlado) ---
        const [file, setFile] = useState(null);

        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />

        // al enviar:
        const formData = new FormData();
        formData.append("name", name);
        formData.append("price", price);
        formData.append("description", description);
        if (file) formData.append("image", file);

   NOTAS:
   - Cambia el puerto/URL (3000) por el de tu servidor.
   - Si el campo "image" se agrega al FormData antes o después de los demás
     da igual; multer procesa todos los campos de texto en req.body.
   - Para mostrar una vista previa antes de subir:
        img.src = URL.createObjectURL(file);
   ============================================================================ */
