const mongoose = require('mongoose');

const carrinhoSchema = new mongoose.Schema({
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
        quantidade: {
            type: Number,
            default: 1
        }
    }]
});

module.exports = mongoose.model('Carrinho', carrinhoSchema); 