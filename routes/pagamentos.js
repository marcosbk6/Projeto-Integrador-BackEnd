const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Preference } = require('mercadopago');
const auth = require('../middleware/auth');
const Pedido = require('../models/Pedido');
const User = require('../models/User');

// Configurar o Mercado Pago com seu token de acesso de teste
const client = new MercadoPagoConfig({ 
    accessToken: 'APP_USR-5888662978593263-060515-d0238a8030ab4aee466e24fb09969928-2473504965'
});

// Criar preferência de pagamento
router.post('/create-preference', auth, async (req, res) => {
    try {
        console.log('Dados recebidos:', req.body);
        const { itens } = req.body;

        if (!itens || !Array.isArray(itens) || itens.length === 0) {
            throw new Error('Itens inválidos');
        }


        // Gerar um ID único para o pedido
        const externalReference = `PEDIDO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const preference = new Preference(client);
        const result = await preference.create({
            body: {
                items: itens.map(item => ({
                    id: String(item.produto._id || '1'),
                    title: item.produto.nome,
                    quantity: parseInt(item.quantidade),
                    unit_price: parseFloat(item.produto.preco),
                    currency_id: "BRL",
                    picture_url: item.produto.imagem || ""
                })),
                back_urls: {
                    success: "https://cacb-2804-4564-1a-51a-6a60-171f-cf86-5e2f.ngrok-free.app/sucesso.html",
                    failure: "https://cacb-2804-4564-1a-51a-6a60-171f-cf86-5e2f.ngrok-free.app/falha.html",
                    pending: "https://cacb-2804-4564-1a-51a-6a60-171f-cf86-5e2f.ngrok-free.app/pendente.html"
                },
                notification_url: "https://cacb-2804-4564-1a-51a-6a60-171f-cf86-5e2f.ngrok-free.app/pagamentos/webhook",
                payment_methods: {
                    installments: 12,
                    default_installments: 1
                },
                statement_descriptor: "MINHA LOJA",
                external_reference: externalReference
            }
        });

        // Salvar pedido como pendente
        const novoPedido = new Pedido({
            userId: req.userId,
            numeroPedido: externalReference,
            itens: itens,
            total: itens.reduce((total, item) => total + (parseFloat(item.produto.preco) * parseInt(item.quantidade)), 0),
            status: 'pendente',
            pagamentoId: result.id
        });

        await novoPedido.save();
        console.log('Pedido pendente salvo:', novoPedido);

        res.json({
            id: result.id,
            init_point: result.init_point
        });
    } catch (error) {
        console.error('Erro detalhado ao criar preferência:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook para receber notificações do Mercado Pago
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    try {

        const payment = req.body;
        console.log('Webhook recebido:', payment);

        // Verificar se é uma notificação de pagamento
        if (payment.type === 'payment') {
            const paymentId = payment.data.id;
            
            // Buscar informações detalhadas do pagamento
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${client.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar informações do pagamento');
            }

            const paymentInfo = await response.json();
            console.log('Informações do pagamento:', paymentInfo);

            // Atualizar o pedido com base no status do pagamento
            const pedido = await Pedido.findOne({ 
                numeroPedido: paymentInfo.external_reference 
            });

            if (pedido) {
                // Mapear status do Mercado Pago para nosso sistema
                const statusMap = {
                    'approved': 'aprovado',
                    'pending': 'pendente',
                    'in_process': 'pendente',
                    'rejected': 'cancelado',
                    'cancelled': 'cancelado',
                    'refunded': 'cancelado',
                    'charged_back': 'cancelado'
                };

                const novoStatus = statusMap[paymentInfo.status] || 'pendente';
                
                // Só atualiza se o status mudou
                if (pedido.status !== novoStatus) {
                    pedido.status = novoStatus;
                    await pedido.save();
                    console.log('Pedido atualizado:', pedido);

                    // Se o pagamento foi aprovado, podemos enviar um email de confirmação aqui
                    if (novoStatus === 'aprovado') {
                        // TODO: Implementar envio de email
                        console.log('Pagamento aprovado! Pedido:', pedido.numeroPedido);
                    }
                }
            } else {
                console.error('Pedido não encontrado para o external_reference:', paymentInfo.external_reference);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Erro no webhook:', error);
        res.status(500).send('Error');
    }
});


// Rota para listar pedidos (apenas para admin)
router.get('/pedidos', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        const pedidos = await Pedido.find().sort({ createdAt: -1 });
        res.json(pedidos);
    } catch (error) {
        console.error('Erro ao listar pedidos:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 