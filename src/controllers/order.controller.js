// Controlador de órdenes + integración con Mercado Pago (Checkout Pro)
//
// Flujo completo:
//  1. El cliente (autenticado) envía los productos y cantidades que quiere comprar.
//  2. Creamos la orden en nuestra DB con estado "pending" (los PRECIOS los tomamos de la DB, nunca del cliente).
//  3. Creamos una "preferencia" de pago en Mercado Pago y devolvemos su link (init_point).
//  4. El usuario paga en Mercado Pago y vuelve a nuestro frontend (back_urls).
//  5. Mercado Pago nos avisa el resultado real del pago con un webhook -> actualizamos la orden.
//
// Para ir descomentando en clase: cada bloque está numerado por pasos.

import Order from "../models/order.model.js"
import Product from "../models/product.model.js"
// import Product from "../models/product.model.js"
import { MercadoPagoConfig, Preference, Payment } from "mercadopago"


// PASO 1: Configurar el cliente de Mercado Pago con nuestro Access Token

// const mpClient = new MercadoPagoConfig({
//   accessToken: process.env.MP_ACCESS_TOKEN
// })


// ---------------------------------------------------------------------------
// Función compartida: aplica el resultado de un pago de MP sobre una orden
// La usan tanto el webhook como la verificación manual (verifyOrderPayment),
// así la lógica de estados y de stock vive en UN solo lugar.
// ---------------------------------------------------------------------------
// const syncOrderWithPayment = async (order, payment) => {

//   // Traducimos el estado de MP al de nuestra orden
//   //   approved -> completed | rejected/cancelled -> cancelled | resto (pending, in_process) -> pending
//   const statusMap = {
//     approved: "completed",
//     rejected: "cancelled",
//     cancelled: "cancelled"
//   }
//   const newStatus = statusMap[payment.status] || "pending"

//   const paymentData = {
//     ...order.paymentMethod,
//     paymentId: payment.id,
//     status: payment.status,
//     type: payment.payment_type_id,       // credit_card, debit_card, account_money...
//     method: payment.payment_method_id    // visa, master, etc.
//   }

//   if (newStatus === "completed") {
//     // Update ATÓMICO: solo actualiza si la orden todavía NO estaba completada.
//     // Si el webhook y la verificación llegan al mismo tiempo, solo UNO gana y descuenta el stock.
//     const updated = await Order.findOneAndUpdate(
//       { _id: order._id, status: { $ne: "completed" } },
//       { status: newStatus, paymentMethod: paymentData },
//       { new: true }
//     )

//     if (updated) {
//       for (const item of updated.products) {
//         await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
//       }
//       return updated
//     }

//     // Ya estaba completada: no hacemos nada y devolvemos la orden como está
//     return Order.findById(order._id)
//   }

//   // Una orden ya completada nunca vuelve hacia atrás por una notificación tardía
//   if (order.status === "completed") return order

//   order.status = newStatus
//   order.paymentMethod = paymentData
//   return order.save()
// }


// ---------------------------------------------------------------------------
// Crear orden + preferencia de pago
// POST /orders   (requiere token)
// body: { products: [ { product: "<productId>", quantity: 2 }, ... ] }
// ---------------------------------------------------------------------------
export const createOrder = async (req, res) => {

  try {

    // PASO 1: Validar el body
    const { items, total } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).send({ message: "Debes enviar al menos un producto" })
    }

  //   // PASO 2: Buscar los productos reales en la DB y calcular el total
  //   // Nunca confiamos en el precio que manda el cliente: lo leemos de la DB.
    const orderProducts = []
    let totalChecked = 0

    for (const item of items) {
      const quantity = Number(item.quantity)

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).send({ message: "Cantidad inválida" })
      }

      const dbProduct = await Product.findById(item.product)

      if (!dbProduct) {
        return res.status(404).send({ message: `Producto no encontrado: ${item.product}` })
      }

      if (dbProduct.stock < quantity) {
        return res.status(400).send({ message: `Stock insuficiente para: ${dbProduct.name}` })
      }

      if(item.price !== dbProduct.price) {
        return res.status(400).send({ message: `El precio del producto ${dbProduct.name} no coincide` })
      }

      totalChecked += dbProduct.price * quantity
    }

    if(total !== totalChecked) {
      return res.status(400).send({ message: "El total no coincide con los precios de los productos" })
    }

    // PASO 3: Guardar la orden en estado "pending"
    // req.user lo cargó el middleware authenticate (payload del JWT)
    const order = await Order.create({
      total,
      products: items,
      user: req.user._id,
      status: "pending"
    })

  // PASO 5: Crear la preferencia de pago en Mercado Pago
    // const preference = new Preference(mpClient)

    // const mpResponse = await preference.create({
    //   body: {
    //     items: orderProducts.map((p) => ({
    //       id: p.product.toString(),
    //       title: p.name,
    //       description: p.description,
    //       quantity: p.quantity,
    //       unit_price: p.price,
    //       currency_id: "ARS"
    //     })),
    //     // external_reference: el vínculo entre el pago de MP y nuestra orden
    //     external_reference: order._id.toString(),
    //     // A dónde vuelve el usuario después de pagar
    //     back_urls: {
    //       success: `${process.env.FRONTEND_URL}/orders/success`,
    //       failure: `${process.env.FRONTEND_URL}/orders/failure`,
    //       pending: `${process.env.FRONTEND_URL}/orders/pending`
    //     },
    //     // auto_return exige que back_urls.success sea una URL pública (https)
    //     // auto_return: "approved",
    //     // Mercado Pago llamará a esta URL cuando cambie el estado del pago (debe ser pública, ej: ngrok)
    //     notification_url: `${process.env.BACKEND_URL}/orders/webhook`
    //   }
    // })

    // // PASO 6: Guardar el id de la preferencia y responder con el link de pago
    // order.paymentMethod = { preferenceId: mpResponse.id }
    await order.save()

    return res.status(201).send({
      message: "Orden creada",
      order,
      // init_point = pago real | sandbox_init_point = pago de prueba
      init_point: mpResponse.init_point,
      sandbox_init_point: mpResponse.sandbox_init_point
    })

  } catch (error) {
    console.log(error)
    return res.status(500).send({ message: "Error al crear la orden" })
  }

}


// ---------------------------------------------------------------------------
// Webhook de Mercado Pago
// POST /orders/webhook   (SIN authenticate: lo llama Mercado Pago, no un usuario)
// ---------------------------------------------------------------------------
export const receiveWebhook = async (req, res) => {

  // try {

  //   // PASO 7: Mercado Pago envía { type: "payment", data: { id: "123" } }
  //   // (o por query: ?type=payment&data.id=123). Solo nos interesan los pagos.
  //   const type = req.body?.type || req.query?.type || req.query?.topic
  //   const paymentId = req.body?.data?.id || req.query?.["data.id"] || req.query?.id

  //   // Respondemos 200 rápido para que MP no reintente notificaciones que no nos sirven
  //   if (type !== "payment" || !paymentId) {
  //     return res.sendStatus(200)
  //   }

  //   // PASO 8: NO confiamos en el body del webhook: consultamos el pago a Mercado Pago directamente
  //   const payment = await new Payment(mpClient).get({ id: paymentId })

  //   // PASO 9: Buscamos nuestra orden con el external_reference que mandamos al crear la preferencia
  //   const order = await Order.findById(payment.external_reference)

  //   if (!order) {
  //     return res.sendStatus(200)
  //   }

  //   // Reutilizamos la misma función que usa la verificación manual (ver syncOrderWithPayment)
  //   await syncOrderWithPayment(order, payment)

  //   return res.sendStatus(200)

  // } catch (error) {
  //   console.log(error)
  //   // Si devolvemos error, Mercado Pago reintentará la notificación más tarde
  //   return res.sendStatus(500)
  // }

}


// ---------------------------------------------------------------------------
// Verificar el pago de una orden consultando a Mercado Pago (alternativa al webhook)
// POST /orders/:id/verify   (requiere token)
// El front lo llama cuando el usuario vuelve de Mercado Pago (back_urls) o al entrar a "Mis órdenes".
// NO recibe ningún dato del pago por body: el servidor le pregunta a MP, así el cliente no puede falsear el resultado.
// ---------------------------------------------------------------------------
export const verifyOrderPayment = async (req, res) => {

  // try {

  //   // PASO 13: Buscar la orden y comprobar que sea del usuario (o que sea admin)
  //   const order = await Order.findById(req.params.id)

  //   if (!order) {
  //     return res.status(404).send({ message: "Orden no encontrada" })
  //   }

  //   const isAdminUser = req.user.role === "admin" || req.user.role === "god"
  //   if (!isAdminUser && order.user.toString() !== req.user._id) {
  //     return res.status(403).send({ message: "No tienes acceso a esta orden" })
  //   }

  //   // Si ya está completada no hace falta volver a consultar
  //   if (order.status === "completed") {
  //     return res.send({ order })
  //   }

  //   // PASO 14: Pedirle a MP los pagos asociados a esta orden usando el external_reference
  //   const result = await new Payment(mpClient).search({
  //     options: {
  //       external_reference: order._id.toString(),
  //       sort: "date_created",
  //       criteria: "desc"
  //     }
  //   })

  //   const payments = result.results || []

  //   // Sin pagos todavía: el usuario abrió el checkout pero no pagó (o aún no se registró)
  //   if (payments.length === 0) {
  //     return res.send({ order, message: "Todavía no hay pagos para esta orden" })
  //   }

  //   // PASO 15: Si hay alguno aprobado nos quedamos con ese; si no, con el más reciente
  //   const payment = payments.find((p) => p.status === "approved") || payments[0]

  //   // PASO 16: Actualizar la orden con la misma lógica que el webhook
  //   const updatedOrder = await syncOrderWithPayment(order, payment)

  //   return res.send({ order: updatedOrder })

  // } catch (error) {
  //   console.log(error)
  //   return res.status(500).send({ message: "Error al verificar el pago" })
  // }

}


// ---------------------------------------------------------------------------
// Obtener órdenes
// GET /orders   (requiere token)
//  - usuario normal: solo ve SUS órdenes
//  - admin / god: ve todas
// ---------------------------------------------------------------------------
export const getOrders = async (req, res) => {

  // try {

  //   // PASO 12: Filtrar según el rol (req.user viene del middleware authenticate)
  //   const isAdminUser = req.user.role === "admin" || req.user.role === "god"
  //   const filter = isAdminUser ? {} : { user: req.user._id }

  //   // populate reemplaza los ObjectId por los documentos reales
  //   const orders = await Order.find(filter)
  //     .populate("products.product", "name image")
  //     .populate("user", "name email")
  //     .sort({ createdAt: -1 })

  //   return res.send({ orders })

  // } catch (error) {
  //   console.log(error)
  //   return res.status(500).send({ message: "Error al obtener las órdenes" })
  // }

}
