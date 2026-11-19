import Product from "../models/product.model.js"
import { v2 as cloudinary } from "cloudinary"


// const { CLOUDINARY_KEY, CLOUDINARY_SECRET, CLOUDINARY_CLOUD_NAME } = process.env

//  Función para obtener todos los productos
export async function getProducts(req, res) {
  // TODO: Implementar filtros, ordenamiento y paginación
  try {
    // Paginación opcional: /products?page=2&limit=8
    // Si no llega "limit" se devuelven todos los productos (comportamiento anterior)
    // const limit = parseInt(req.query.limit)

    // if (limit > 0) {
    //   const page = Math.max(parseInt(req.query.page) || 1, 1)

    //   const [productos, total] = await Promise.all([
    //     Product.find().skip((page - 1) * limit).limit(limit),
    //     Product.countDocuments()
    //   ])

    // }
    // const productos = await Product.find();

    //   return res.status(200).send({
    //     success: true,
    //     products: productos,
    //     pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    //     message: "Productos obtenidos correctamente"
    //   })k

    // =======================================================================
    // EJEMPLOS DIDÁCTICOS: qué podemos hacer con find() (solo para mostrar)
    // =======================================================================

    // 1) FILTRO SIMPLE: igualdad exacta
    //    GET /products?name=Remera   ->   find({ name: "Remera" })
    // const productos = await Product.find({ name: "Remera" })

    // 2) OPERADORES DE COMPARACIÓN: $gt, $gte, $lt, $lte, $ne, $in, $nin
    //    Productos entre $1000 y $5000
    // const productos = await Product.find({ price: { $gte: 1000, $lte: 5000 } })
    //    Productos con stock distinto de 0
    // const productos = await Product.find({ stock: { $ne: 0 } })
    //    Productos cuyo nombre sea uno de la lista
    // const productos = await Product.find({ name: { $in: ["Remera", "Pantalón"] } })

    // 3) AND (implícito): todas las condiciones en el mismo objeto se cumplen a la vez
    //    precio <= 5000 Y stock > 0
    // const productos = await Product.find({ price: { $lte: 5000 }, stock: { $gt: 0 } })
    //    AND explícito (necesario cuando repetís el mismo campo o combinás con $or)
    // const productos = await Product.find({ $and: [{ price: { $gte: 1000 } }, { price: { $lte: 5000 } }] })

    // 4) OR: se cumple al menos una condición
    //    Baratos O con mucho stock
    // const productos = await Product.find({
    //   $or: [{ price: { $lt: 1000 } }, { stock: { $gt: 100 } }]
    // })

    // 5) AND + OR combinados
    //    (stock > 0) Y (precio < 1000 O nombre "Remera")
    // const productos = await Product.find({
    //   stock: { $gt: 0 },
    //   $or: [{ price: { $lt: 1000 } }, { name: "Remera" }]
    // })

    // 6) BÚSQUEDA DE TEXTO con REGEX: "contiene" y sin distinguir mayúsculas ($options: "i")
    //    GET /products?search=rem   ->   encuentra "Remera", "REMERA azul", "Premium"...
    // const { search } = req.query
    // const productos = await Product.find({ name: { $regex: search, $options: "i" } })
    //    Buscar en nombre O descripción
    // const productos = await Product.find({
    //   $or: [
    //     { name: { $regex: search, $options: "i" } },
    //     { description: { $regex: search, $options: "i" } }
    //   ]
    // })
    //    OJO: si el texto viene del usuario, escapá los caracteres especiales de regex
    //    (ej: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) para evitar errores o ReDoS.

    // 7) EXISTENCIA DE CAMPO: $exists
    //    Productos que tienen imagen cargada
    // const productos = await Product.find({ image: { $exists: true, $ne: "" } })

    // 8) SORT: 1 = ascendente, -1 = descendente
    //    Más caros primero; si empatan, por nombre A-Z
    // const productos = await Product.find().sort({ price: -1, name: 1 })
    //    Más nuevos primero (gracias a timestamps: true)
    // const productos = await Product.find().sort({ createdAt: -1 })

    // 9) SELECT (proyección): traer solo algunos campos (el _id viene siempre salvo que lo excluyas)
    // const productos = await Product.find().select("name price")          // solo name y price
    // const productos = await Product.find().select("-description -__v")   // todo MENOS esos campos

    // 10) SKIP + LIMIT: paginación
    //    Página 3 con 10 productos por página -> salteo 20 y traigo 10
    // const productos = await Product.find().skip(20).limit(10)

    // 11) countDocuments: contar sin traer los documentos (útil para el total de la paginación)
    // const total = await Product.countDocuments({ stock: { $gt: 0 } })

    // 12) ENCADENAR TODO: lo que llega por query string se transforma en un filtro dinámico
    //    GET /products?search=rem&minPrice=1000&maxPrice=5000&inStock=true&sort=price&order=desc&page=1&limit=8
    // const { search, minPrice, maxPrice, inStock, sort = "createdAt", order = "desc", page = 1, limit = 8 } = req.query
    //
    // const filter = {}
    // if (search) filter.name = { $regex: search, $options: "i" }
    // if (minPrice || maxPrice) {
    //   filter.price = {}
    //   if (minPrice) filter.price.$gte = Number(minPrice)
    //   if (maxPrice) filter.price.$lte = Number(maxPrice)
    // }
    // if (inStock === "true") filter.stock = { $gt: 0 }
    //
    // const productos = await Product.find(filter)
    //   .sort({ [sort]: order === "asc" ? 1 : -1 })   // clave dinámica con [ ]
    //   .skip((Number(page) - 1) * Number(limit))
    //   .limit(Number(limit))
    //   .select("-__v")
    //   .lean()                                        // devuelve objetos JS planos (más rápido, sin métodos de Mongoose)

    // 13) OTROS MÉTODOS ÚTILES DEL MODELO
    // await Product.findOne({ name: "Remera" })                 // el primer documento que coincida (o null)
    // await Product.findById(id)                                // atajo de findOne({ _id: id })
    // await Product.distinct("name")                            // valores únicos de un campo
    // await Product.exists({ name: "Remera" })                  // ¿existe? devuelve { _id } o null
    // await Product.aggregate([                                 // consultas avanzadas: agrupar, sumar, promediar
    //   { $match: { stock: { $gt: 0 } } },
    //   { $group: { _id: null, precioPromedio: { $avg: "$price" }, stockTotal: { $sum: "$stock" } } }
    // ])

    const searchName = req.query.qName //undefined
    const queryName = searchName ? { name: { $regex: searchName, $options: "i" }} : {}

    const limit = Number(req.query.limit) || 10
    const page = Number(req.query.page)-1 || 0
    

    // Obtener todos los productos desde la base de datos
    const productos = await Product.find(queryName)
                                    .limit(limit)
                                    .skip(page * limit)
                                    .select("-stock")
                                    .collation({ locale: "es" }) // Me asegura que la ordenación respete las reglas del idioma español
                                    .sort({ name: -1 })
                                    .lean() // Devuelve objetos JS planos (más rápido, sin métodos de Mongoose)

    // return res.status(200).send(productos)      //  axios response:   response.data

    return res.status(200).send({                  // axios response    response.data.products
      success: true,
      products: productos,
      message: "Productos obtenidos correctamente"
    })
    
  } catch (error) {

    console.log(error)
    return res.status(500).send({
      success: false,
      message: "Error al obtener los productos",
    })
    
  }

}


// Función para obtener un producto por su ID
export async function getProductById(req, res) {
  try {
    
    // Primero que debemos obtener el el id del producto que la persona que hace la solicitud está buscando
    const id = req.params.id;

    const product = await Product.findById(id); // Si no lo encuentra, product será null

    if(!product) {
      return res.status(404).send({
        success: false,
        message: "Producto no encontrado"
      })
    }
    
    return res.status(200).send({
      success: true,
      product,
      message: "Producto obtenido correctamente"
    })

  } catch (error) {
    console.log(error)
    return res.status(500).send({
      success: false,
      message: "Error al obtener el producto",
    })
  }
}



// Función para crear un nuevo producto
export async function createProduct(req, res) {


  try {
    console.log("REQ BODY SIN ARCHIVO", req.body)

    const imageUrl = req.file ? await uploadProductImage(req, res) : undefined


    // req.body.createdAt = '2020-01-01T00:00:00.000Z'
    req.body.createdAt = undefined
    
    // Aquí normalmente se recibirían los datos del producto desde req.body
    // const producto = req.body;

    // Aquí normalmente se guardaría el producto en la base de datos, al crear una nueva instancia del modelo estamos preparando el documento para ser guardado.
    const nuevoProducto =  Product({
      ...req.body,
      image: imageUrl
    });

    console.log(nuevoProducto);

    //# Guardar el producto en la base de datos
    await nuevoProducto.save()

    // ! SIEMPRE: Devolver la respuesta al cliente


    return res.status(201).send({
      success: true,
      product: nuevoProducto,
      message: "Producto creado correctamente"
    })

  } catch (error) {

    console.log(error)  // Hacemos un console log del error para depuración interna

    if(error.name === "ValidationError") {
      return res.status(400).send({
        success: false,
        message: "Error de validación",
      })
    }

    return res.status(500).send({
      success: false,
      message: "Error al crear el producto",
    }) // Al usuario le dejamos un mensaje genérico, sin exponer detalles internos

  }

  
}


async function uploadProductImage(req, res) {
  const file = req.file;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
  });

  return new Promise((resolve, reject) => {

    const stream = cloudinary.uploader.upload_stream({ disable_promises: true }, function(error, result) {
      if(error) {
        // Rechazar la promesa en caso de error
        console.log("Error al subir la imagen a Cloudinary", error) // ❌
        
        return reject(error)
      }
      if (!result?.secure_url) {
        return reject(new Error("Cloudinary no devolvió la URL de la imagen"));
      }
      console.log("resultado de cloudinary", result) // ✅
      return resolve(result.secure_url);
    })
    stream.on("error", reject);
    stream.end(file.buffer);
    
  })
    
  
    

    
 

}












// Función para actualizar un producto por su ID
export async function updateProduct(req, res) {
  try {
    // Obtenemos el ID del producto desde los parámetros de la URL
    const id = req.params.id;

    // Actualizar el producto 
                                        // findByIdAndUpdate recibe tres argumentos: 
                                        // el ID del producto, 
                                        // los datos a actualizar 
                                        // un objeto de opciones (opcional)
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
    //    a. El producto exista y se actualice
    //    b. El producto no exista y se devuelva un error 404
    // Dar una respuesta
    if(!updatedProduct) {
      return res.status(404).send({
        success: false,
        message: "Producto no encontrado"
      })
    }

    return res.status(200).send({
      success: true,
      product: updatedProduct,
      message: "Producto actualizado correctamente"
    })


  } catch (error) {
    console.log(error)
    return res.status(500).send({
      success: false,
      message: "Error al actualizar el producto",
    })
  }
}











// Función para eliminar un producto por su ID
export async function deleteProduct(req, res) {
  
  try {

    const id = req.params.id;

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).send({
        success: false,
        message: "Producto no encontrado"
      })
    }

    return res.status(200).send({
      success: true,
      message: "Producto eliminado correctamente",
    })

    
  } catch (error) {
    console.log(error)
    return res.status(500).send({
      success: false,
      message: "Error al eliminar el producto",
    })
  }



}

