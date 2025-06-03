const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        // Pegar o token do header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }

        // Verificar o token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta');
        
        // Buscar o usuário
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ message: 'Usuário não encontrado' });
        }

        // Adicionar o usuário e userId ao objeto da requisição
        req.user = user;
        req.userId = decoded.userId;
        
        next();
    } catch (error) {
        console.error('Erro de autenticação:', error);
        res.status(401).json({ message: 'Token inválido' });
    }
}; 