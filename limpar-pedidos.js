const mongoose = require('mongoose');
const Pedido = require('./models/Pedido');

async function limparPedidos() {
    try {
        // Conectar ao MongoDB
        await mongoose.connect('mongodb+srv://marcosdev:Samara2591*@cluster0.dzjytvp.mongodb.net/meuEcommerce?retryWrites=true&w=majority&appName=Cluster0');
        console.log('Conectado ao MongoDB');

        // Deletar todos os pedidos
        await Pedido.deleteMany({});
        console.log('Todos os pedidos foram deletados');

        process.exit(0);
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
}

limparPedidos(); 