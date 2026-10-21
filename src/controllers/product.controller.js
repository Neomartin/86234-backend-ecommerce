import Product from "../models/product.model.js"

//  Función para obtener todos los productos
export async function getProducts(req, res) {
  // TODO: Implementar filtros, ordenamiento y paginación
  try {
    // Obtener todos los productos desde la base de datos
    const productos = await Product.find();

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
    // req.body.createdAt = '2020-01-01T00:00:00.000Z'
    req.body.createdAt = undefined
    
    // Aquí normalmente se recibirían los datos del producto desde req.body
    // const producto = req.body;

    // Aquí normalmente se guardaría el producto en la base de datos, al crear una nueva instancia del modelo estamos preparando el documento para ser guardado.
    const nuevoProducto = new Product(req.body);

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

