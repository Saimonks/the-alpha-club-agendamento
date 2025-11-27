const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Obter token do cabeçalho da requisição
    const authHeader = req.header('Authorization');

    // Se não houver cabeçalho de autorização, ou se não for "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Nenhum token fornecido, autorização negada.' });
    }

    // Extrair o token da string "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token não formatado corretamente.' });
    }

    // Verificar o token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Anexar o userId (id_cliente) à requisição para uso nas rotas protegidas
        req.userId = decoded.userId; 
        next(); // Passa para a próxima função middleware/rota
    } catch (error) {
        console.error('Erro de verificação do token:', error.message);
        res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
};