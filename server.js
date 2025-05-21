// 1. Importando as bibliotecas necessárias
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Adicione o bcrypt no topo do arquivo
const cors = require('cors');
const rotasPerfume = require('./routes/perfume');
const rotasHidratante = require('./routes/hidratante');
const rotasMaquiagem = require('./routes/maquiagem');

// 2. Importando o modelo User
const User = require('./models/User');

// 3. Inicializando o app Express
const app = express();

// 4. Definindo a porta onde o servidor vai rodar
const PORT = 3000;

app.use(cors());

// 5. Middleware para entender JSON no corpo da requisição
app.use(express.json());

// 6. Rota inicial (só pra testar se o servidor está rodando)
app.get('/', (req, res) => {
  res.send('API do E-commerce funcionando!');
});

// 7. Conectar ao MongoDB
mongoose.connect('mongodb+srv://marcosdev:Samara2591*@cluster0.dzjytvp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Conectado ao MongoDB Atlas!'))
  .catch((error) => console.error('Erro ao conectar ao MongoDB:', error));

// 8. Rota de cadastro



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

    // Passo 2: Validar campos
    if (!username || !senha) {
      return res.status(400).json({ message: 'Preencha username e senha.' });
    }

    // Buscar o usuário pelo nome
    const usuario = await User.findOne({ username });

    if (!usuario) {
      console.log('Usuário não encontrado:', username);
      return res.status(400).json({ message: 'Usuário não encontrado!' });
    }

    // Verificar a senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(400).json({ message: 'Senha inválida!' });
    }

    // Para depuração: Verificando o objeto 'usuario'
    console.log('Usuário encontrado:', usuario);

    // Passo 1: Remover a senha da resposta
    const { _id, username: usuarioNome } = usuario; // Mudando o nome da variável 'username' para 'usuarioNome'

    // Retornar a resposta com _id e username
    res.status(200).json({
      message: 'Login bem-sucedido!',
      usuario: { _id, username: usuarioNome } // Enviando os dados corretos
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


app.use('/produtos/perfumes', rotasPerfume);
app.use('/produtos/hidratantes', rotasHidratante);
app.use('/produtos/maquiagem', rotasMaquiagem);


// 9. Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
