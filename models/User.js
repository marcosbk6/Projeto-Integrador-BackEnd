// models/User.js

const mongoose = require('mongoose');

// 1. Criar o schema do usuário
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true // Não pode ter dois usernames iguais
  },
  senha: {
    type: String,
    required: true
  }
});

// 2. Criar o modelo baseado no schema
const User = mongoose.model('User', userSchema);

// 3. Exportar o modelo
module.exports = User;
