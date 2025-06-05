const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Preference } = require('mercadopago');
const auth = require('../middleware/auth');

// Configurar o Mercado Pago com seu token de acesso de teste
const client = new MercadoPagoConfig({ 
    accessToken: 'APP_USR-5888662978593263-060515-d0238a8030ab4aee466e24fb09969928-2473504965'
});

// Criar preferência de pagamento
router.post('/create-preference', auth, async (req, res) => {
    try {
        console.log('Recebendo requisição para criar preferência...');
        const { itens, total, endereco } = req.body;
        console.log('Dados recebidos:', { itens, total, endereco });

        if (!itens || !Array.isArray(itens) || itens.length === 0) {
            throw new Error('Itens inválidos');
        }

        // Criar os itens no formato do Mercado Pago
        const items = itens.map(item => {
            if (!item.produto || !item.produto.nome || !item.produto.preco || !item.quantidade) {
                throw new Error('Item inválido: ' + JSON.stringify(item));
            }
            return {
                title: item.produto.nome,
                unit_price: Number(item.produto.preco),
                quantity: Number(item.quantidade),
                currency_id: 'BRL',
                description: `${item.produto.nome} - Quantidade: ${item.quantidade}`
            };
        });

        console.log('Items formatados:', items);

        const preference = new Preference(client);
        const result = await preference.create({
            body: {
                items,
                statement_descriptor: "MINHA LOJA",
                payment_methods: {
                    installments: 1
                },
                binary_mode: true,
                expires: false,
                payer: {
                    name: "Test",
                    surname: "User",
                    email: "test_user_1531609086@testuser.com",
                    identification: {
                        type: "CPF",
                        number: "12345678909"
                    },
                    address: {
                        street_name: endereco.rua || '',
                        street_number: endereco.numero || '',
                        zip_code: (endereco.cep || '').replace(/\D/g, ''),
                        neighborhood: endereco.bairro || '',
                        city: endereco.cidade || 'São Paulo',
                        federal_unit: endereco.estado || 'SP'
                    }
                }
            }
        });

        console.log('Resposta do Mercado Pago:', result);
        
        // Retornar a URL do sandbox para ambiente de teste
        res.json({
            id: result.id,
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point
        });
    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook para receber notificações do Mercado Pago
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    try {
        console.log('Webhook recebido:', req.body);
        const { type, data } = req.body;
        
        if (type === 'payment') {
            const paymentId = data.id;
            // TODO: Implementar busca de pagamento com nova versão do SDK
            console.log('Pagamento recebido:', paymentId);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Erro no webhook:', error);
        res.status(500).send('Error');
    }
});

module.exports = router; 