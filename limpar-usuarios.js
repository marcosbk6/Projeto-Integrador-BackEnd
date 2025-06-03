const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function limparECriarAdmin() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect('mongodb+srv://marcosdev:Samara2591*@cluster0.dzjytvp.mongodb.net/meuEcommerce?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Conectado ao MongoDB');

    // Deletar todos os usuários
    await User.deleteMany({});
    console.log('Todos os usuários foram deletados');

    // Criar o novo admin
    const senhaCriptografada = await bcrypt.hash('admin124', 10);
    const admin = new User({
      username: 'admin',
      senha: senhaCriptografada,
      isAdmin: true
    });

    await admin.save();
    console.log('Administrador criado com sucesso!');
    console.log('Username: admin');
    console.log('Senha: admin124');

    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

limparECriarAdmin(); 