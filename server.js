require('dotenv').config();


const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const db = require('./src/config/db');

app.use(express.static('public')); 
app.use(express.json()); 

app.get('/api/status', (req, res) => {
    res.status(200).json({ status: "ok", message: "Servidor Alpha Club Rodando!" });
});

app.get('/api/servicos', async (req, res) => {
    try {
        const [servicos] = await db.query('SELECT id_servico, nome, duracao_minutos, preco FROM Servico');

        res.status(200).json(servicos);
    } catch (error) {
        console.error('Erro ao buscar serviços:', error);
        res.status(500).json({ error: 'Falha ao buscar a lista de serviços.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('Use Ctrl+C para parar o servidor');
});
