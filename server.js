// 1. Importando as bibliotecas necessárias
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Adicione o bcrypt no topo do arquivo
const cors = require('cors');
const perfumeFeminino = require('./routes/perfumeFeminino');
const perfumeMasculino = require('./routes/perfumeMasculino');
const rotasHidratante = require('./routes/hidratante');
const rotasMaquiagem = require('./routes/maquiagem');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // isso carrega as variáveis do .env
const jwt = require('jsonwebtoken');

// 2. Conectando ao MongoDB
mongoose.connect('mongodb+srv://marcosdev:Samara2591*@cluster0.dzjytvp.mongodb.net/meuEcommerce?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Conectado ao MongoDB Atlas!'))
  .catch((error) => console.error('Erro ao conectar ao MongoDB:', error));

// 3. Importando o modelo User
const User = require('./models/User');
const Pedido = require('./models/Pedido');

// 4. Modelo do Carrinho
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

const Carrinho = mongoose.model('Carrinho', carrinhoSchema);

// 5. Inicializando o app Express
const app = express();

// Configuração do CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// 6. Definindo a porta onde o servidor vai rodar
const PORT = 3000;

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// 7. Middleware para entender JSON no corpo da requisição
app.use(express.json());

// 8. Middleware de autenticação
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('Token recebido:', token);

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta');
    req.userId = decoded.userId;
    console.log('Token válido, userId:', req.userId);
    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(401).json({ message: 'Token inválido' });
  }
};

// 9. Rotas do carrinho
console.log('[Setup] Registrando rotas do carrinho...');

// GET /carrinho
app.get('/carrinho', authMiddleware, async (req, res) => {
  try {
    let carrinho = await Carrinho.findOne({ usuario: req.userId });
    if (!carrinho) {
      carrinho = new Carrinho({ usuario: req.userId, itens: [] });
      await carrinho.save();
    }
    res.json(carrinho.itens);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar carrinho' });
  }
});

// DELETE /carrinho
app.delete('/carrinho', authMiddleware, async (req, res) => {
  try {
    let carrinho = await Carrinho.findOne({ usuario: req.userId });
    
    if (!carrinho) {
      carrinho = new Carrinho({ usuario: req.userId, itens: [] });
    } else {
      carrinho.itens = [];
    }

    await carrinho.save();
    res.json({ message: 'Carrinho esvaziado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao limpar carrinho' });
  }
});

// POST /carrinho
app.post('/carrinho', authMiddleware, async (req, res) => {
  try {
    const { produto, quantidade } = req.body;
    let carrinho = await Carrinho.findOne({ usuario: req.userId });
    
    if (!carrinho) {
      carrinho = new Carrinho({ usuario: req.userId, itens: [] });
    }

    const itemIndex = carrinho.itens.findIndex(
      item => item.produto.nome === produto.nome
    );

    if (itemIndex > -1) {
      carrinho.itens[itemIndex].quantidade += quantidade;
    } else {
      carrinho.itens.push({ produto, quantidade });
    }

    await carrinho.save();
    res.status(201).json(carrinho.itens);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar ao carrinho' });
  }
});

// Rota para remover um item específico do carrinho
app.delete('/carrinho/:itemId', authMiddleware, async (req, res) => {
  try {
    const carrinho = await Carrinho.findOne({ usuario: req.userId });
    if (!carrinho) {
      return res.status(404).json({ message: 'Carrinho não encontrado' });
    }

    carrinho.itens.splice(req.params.itemId, 1);
    await carrinho.save();
    res.json(carrinho.itens);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover item do carrinho' });
  }
});

// Rota para atualizar a quantidade de um item específico
app.put('/carrinho/:itemId', authMiddleware, async (req, res) => {
  try {
    const { quantidade } = req.body;
    const carrinho = await Carrinho.findOne({ usuario: req.userId });
    
    if (!carrinho) {
      return res.status(404).json({ message: 'Carrinho não encontrado' });
    }

    if (quantidade > 0) {
      carrinho.itens[req.params.itemId].quantidade = quantidade;
    } else if (quantidade === 0) {
      carrinho.itens.splice(req.params.itemId, 1);
    }
    
    await carrinho.save();
    res.json(carrinho.itens);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar quantidade' });
  }
});

// 10. Rotas de autenticação
app.post('/cadastro', async (req, res) => {
  try {
    const { username, senha } = req.body;

    // Passo 2: Verificar se campos foram preenchidos
    if (!username || !senha) {
      return res.status(400).json({ message: 'Preencha username e senha.' });
    }

    // Passo 3: Verificar se o username já existe
    const usuarioExistente = await User.findOne({ username });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'Username já está em uso.' });
    }

    // Criptografar a senha
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    // Criar o novo usuário
    const novoUsuario = new User({ username, senha: senhaCriptografada });
    await novoUsuario.save();

    res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ message: 'Erro ao cadastrar usuário.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, senha } = req.body;

    if (!username || !senha) {
      return res.status(400).json({ message: 'Preencha username e senha.' });
    }

    const usuario = await User.findOne({ username });

    if (!usuario) {
      return res.status(400).json({ message: 'Usuário não encontrado!' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(400).json({ message: 'Senha inválida!' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: usuario._id },
      process.env.JWT_SECRET || 'sua_chave_secreta',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login bem-sucedido!',
      usuario: {
        _id: usuario._id,
        username: usuario.username
      },
      token
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao fazer login.' });
  }
});

// Rota para listar todos os usuários cadastrados
app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await User.find(); // Busca todos os usuários no banco
    res.status(200).json(usuarios);     // Retorna os usuários como resposta
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro ao listar usuários.' });
  }
});

// 11. Rotas de produtos
app.use('/produtos/perfumes-femininos', perfumeFeminino);
app.use('/produtos/perfumes-masculinos', perfumeMasculino);
app.use('/produtos/hidratantes', rotasHidratante);
app.use('/produtos/maquiagem', rotasMaquiagem);

app.get('/produtos', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'produtos.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler produtos.json:', err);
      return res.status(500).json({ message: 'Erro ao carregar os produtos.' });
    }

    try {
      const produtos = JSON.parse(data);
      res.json(produtos);
    } catch (parseError) {
      console.error('Erro ao converter JSON:', parseError);
      res.status(500).json({ message: 'Erro ao processar os produtos.' });
    }
  });
});

// Rotas do carrinho com autenticação
app.post('/pedidos', authMiddleware, async (req, res) => {
  try {
    const { itens, total } = req.body;
    
    const pedido = new Pedido({
      usuario: req.userId,
      itens,
      total
    });

    await pedido.save();

    // Adicionar o pedido ao usuário
    await User.findByIdAndUpdate(req.userId, {
      $push: { pedidos: pedido._id }
    });

    res.status(201).json({ message: 'Pedido criado com sucesso', pedido });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ message: 'Erro ao criar pedido' });
  }
});

// Rota para listar pedidos do usuário
app.get('/meus-pedidos', authMiddleware, async (req, res) => {
  try {
    const pedidos = await Pedido.find({ usuario: req.userId })
      .sort({ createdAt: -1 });
    
    res.json(pedidos);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ message: 'Erro ao buscar pedidos' });
  }
});

// 12. Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
