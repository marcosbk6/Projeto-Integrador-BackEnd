const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itens: [{
    produto: {
      nome: String,
      preco: Number,
      imagem: String,
      categoria: String
    },
    quantidade: Number
  }],
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pendente', 'confirmado', 'enviado', 'entregue'],
    default: 'pendente'
  }
}, {
  timestamps: true
});

const Pedido = mongoose.model('Pedido', pedidoSchema);

module.exports = Pedido; 