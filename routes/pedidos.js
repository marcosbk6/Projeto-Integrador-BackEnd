const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido');
const auth = require('../middleware/auth');

// Rota para listar todos os pedidos (apenas admin)
router.get('/admin/pedidos', auth, async (req, res) => {
    try {
        // Verifica se o usuário é admin usando a propriedade isAdmin do modelo
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        // Busca todos os pedidos e popula as informações do usuário e produtos
        const pedidos = await Pedido.find()
            .populate('usuario', 'username')
            .populate('itens.produto')
            .sort({ createdAt: -1 }); // Ordena do mais recente para o mais antigo

        // Se não houver pedidos, retorna um array vazio
        if (!pedidos || pedidos.length === 0) {
            return res.json([]);
        }

        res.json(pedidos);
    } catch (error) {
        console.error('Erro ao listar pedidos:', error);
        res.status(500).json({ message: 'Erro ao listar pedidos' });
    }
});

// Rota para atualizar o status de um pedido (apenas admin)
router.put('/admin/pedidos/:id', auth, async (req, res) => {
    try {
        // Verifica se o usuário é admin usando a propriedade isAdmin do modelo
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        const { status } = req.body;
        const pedido = await Pedido.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('usuario', 'username');

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        res.json(pedido);
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error);
        res.status(500).json({ message: 'Erro ao atualizar pedido' });
    }
});

module.exports = router; 