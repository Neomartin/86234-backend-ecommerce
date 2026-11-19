import { Router } from "express";

import { createOrder, getOrders, receiveWebhook, verifyOrderPayment } from "../controllers/order.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Crear una orden y generar el link de pago de Mercado Pago
router.post("/orders", authenticate, createOrder);

// Webhook: lo llama Mercado Pago, por eso NO lleva authenticate
router.post("/orders/webhook", receiveWebhook);

// Verificar el pago consultando directamente a Mercado Pago (alternativa al webhook)
router.post("/orders/:id/verify", authenticate, verifyOrderPayment);

// Listar órdenes (las propias, o todas si es admin)
router.get("/orders", authenticate, getOrders);

export default router;
