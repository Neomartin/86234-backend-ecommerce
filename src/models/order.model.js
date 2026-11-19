import mongoose from "mongoose"
const { Schema } = mongoose

const orderSchema = new Schema({
  total: {
    type: Number,
    required: true
  },
  products: [
    { 
      product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      price: Number,
      quantity: Number,
    }
  ],
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "inprogress",  "completed", "delivered", "shipped", "cancelled"],
    default: "pending"
  },
  paymentMethod: {},


}, { timestamps: true })

export default mongoose.model("Order", orderSchema)

/*
  ...camposOrder,
  products: [
    {
      product: 6afb95481a574c2f67adf31b,
      price: 10,
      quantity: 2,
    },
    {
      product: id2,
      price: 15,
      quantity: 1
    },
    {},
  
  ]

*/