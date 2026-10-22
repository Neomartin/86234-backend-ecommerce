import mongoose from "mongoose"
const { Schema, model } = mongoose


const userSchema = new Schema({

  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  email: {
    type: String,
    unique: true, // Garantiza que no haya dos usuarios con el mismo email
    index: true, // El indice nos sirve para mejorar la velocidad de las consultas por email
    required: true,
    minlength: 2,
    maxlength: 150,
    trim: true,
    lowercase: true,   // "PePe_MAx@gmail.com" -> pepe_max@
    // Valida que el email tenga un formato correcto
    match: [/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/, "Por favor ingresa un email válido"]
  },
  password: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 128,
    trim: true,
  },
  role: {
    type: String,
    default: "user",
    enum: ["user", "client", "admin", "god"],
  },
  bornDate: {
    type: Date,
    // required: true,
    validate: {
      validator: function(valor) {
        if (!valor) return true;

        const diezAñosAtras = new Date().getTime() - 10 * 365 * 24 * 60 * 60 * 1000

        return valor < diezAñosAtras
      },
      message: "La fecha de nacimiento debe ser anterior a hace 10 años"
    }
  },
  image: {
    type: String,
  },
  // pets: [
  //   { type: String }
  // ],
  // address: {
  //     street: { type: String },
  //     city: { type: String },
  //     state: { type: String },
  //     zip: { type: String },
  //     country: { type: String }
  // }


}, { timestamps: true })



const User = model("User", userSchema);

export default User;


// Schema
/*
  name
  email
  password
  passwordConfirmation*
  role
  bornDate
  createdAt
  updatedAt
  image
*/