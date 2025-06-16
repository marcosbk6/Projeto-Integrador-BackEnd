const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  // ID é gerado automaticamente pelo MongoDB (_id)

  // Referência ao usuário que fez o pedido
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Número do pedido (mais amigável que o _id)
  numeroPedido: {
    type: String,
    unique: true
  },

  // Lista de itens no pedido
  itens: [{
    // Referência ao produto
    produto: {
      nome: String,
      preco: Number,
      imagem: String,
      categoria: String
    },
    quantidade: Number
  }],

  // Valor total do pedido
  total: {
    type: Number,
    required: true
  },

  // Status do pedido
  status: {
    type: String,
    enum: ['pendente', 'aprovado', 'cancelado'],
    default: 'pendente'
  },

  // Data de criação do pedido
  createdAt: {
    type: Date,
    default: Date.now
  },

  // Endereço de entrega
  endereco: {
    rua: String,
    numero: String,
    complemento: String,
    bairro: String,
    cidade: String,
    estado: String,
    cep: String
  },

  // ID do pagamento associado ao pedido
  pagamentoId: {
    type: String,
    required: true
  }
}, {
  timestamps: true // Cria automaticamente createdAt e updatedAt
});

// Middleware para gerar número do pedido antes de salvar
pedidoSchema.pre('save', async function(next) {
  if (!this.numeroPedido) {
    // Conta quantos pedidos existem e adiciona 1
    const count = await mongoose.model('Pedido').countDocuments();
    // Formato: PED + ano atual + número sequencial com 6 dígitos
    this.numeroPedido = `PED${new Date().getFullYear()}${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

const Pedido = mongoose.model('Pedido', pedidoSchema);

module.exports = Pedido; 