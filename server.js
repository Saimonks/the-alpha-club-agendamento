
// 1. DEPENDÊNCIAS, INICIALIZAÇÃO DO APP E CONSTANTES GLOBAIS


require('dotenv').config();

const express = require('express');

const app = express(); 

const bcrypt = require('bcryptjs'); 
const db = require('./src/config/db');

// Constantes do App
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10; 

// Constantes de Regra de Negócio
const HORARIO_INICIO = 9; 
const HORARIO_FIM = 18;
const ALMOCO_INICIO = 12; 
const ALMOCO_FIM = 13; 
const DURACAO_MINIMA_SLOT = 15;

const ID_BARBEIRO_FIXO = 1;

// 2. MIDDLEWARES E CONFIGURAÇÕES

app.use(express.static('public')); 
app.use(express.json());

// 3. ROTAS DE LEITURA (GET)

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

app.get('/api/horarios-disponiveis', async (req, res) => {
    const dataSelecionada = req.query.data;
    const duracaoServico = parseInt(req.query.duracao); 
    
    if (!dataSelecionada || isNaN(duracaoServico)) {
        return res.status(400).json({ error: 'Data e Duração (em minutos) são obrigatórias.' });
    }
    
    // Calcula o tempo total que o slot consumirá do Barbeiro
    const DURACAO_TOTAL_CONSUMIDA = duracaoServico; 

    try {
        // Buscar Agendamentos Ocupados
        const query = 'SELECT data_hora_inicio, data_hora_fim FROM Agendamento WHERE DATE(data_hora_inicio) = ? AND status = \'Confirmado\'';
        const [agendamentosDoDia] = await db.query(query, [dataSelecionada]);

        const horariosLivres = [];
        let horaAtual = new Date(`${dataSelecionada}T${HORARIO_INICIO.toString().padStart(2, '0')}:00:00`);
        const fimDiario = new Date(`${dataSelecionada}T${HORARIO_FIM.toString().padStart(2, '0')}:00:00`);

        while (horaAtual < fimDiario) {
            
            const slotTotalFim = new Date(horaAtual.getTime() + DURACAO_TOTAL_CONSUMIDA * 60000); 

            if (slotTotalFim > fimDiario) {
                break;
            }

            const hora = horaAtual.getHours();
            if (hora >= ALMOCO_INICIO && hora < ALMOCO_FIM) {
                horaAtual = new Date(`${dataSelecionada}T${ALMOCO_FIM.toString().padStart(2, '0')}:00:00`);
                continue; 
            }
            
            const isLivre = agendamentosDoDia.every(agendamento => {
                const agendamentoInicio = new Date(agendamento.data_hora_inicio);
                const agendamentoFim = new Date(agendamento.data_hora_fim); 
                return (slotTotalFim <= agendamentoInicio || horaAtual >= agendamentoFim);
            });

            if (isLivre) {
                horariosLivres.push(horaAtual.toTimeString().substring(0, 5));
            }

            horaAtual = new Date(horaAtual.getTime() + DURACAO_MINIMA_SLOT * 60000);
        }


        // Retornar os horários livres
        res.status(200).json({ horarios: horariosLivres });

    } catch (error) {
        console.error('Erro na lógica de disponibilidade:', error);
        res.status(500).json({ error: 'Falha interna ao calcular horários.' });
    }
});

app.get('/api/cliente/agendamentos', async (req, res) => {
    const clienteId = req.query.userId; 

    if (!clienteId) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    try {
        // Query para buscar todos os agendamentos, juntando dados do Serviço
        const query = `
            SELECT 
                A.data_hora_inicio, 
                A.status, 
                S.nome AS nome_servico,
                S.duracao_minutos
            FROM Agendamento A
            JOIN Servico S ON A.id_servico = S.id_servico
            WHERE A.id_cliente = ?
            ORDER BY A.data_hora_inicio ASC;
        `;
        const [agendamentos] = await db.query(query, [clienteId]);
        
        // Classificar em Futuros e Histórico (no Backend, para simplificar o Front)
        const hoje = new Date();
        const agendamentosFormatados = {
            futuros: [],
            historico: [],
            nomeCliente: "Cliente da Alpha Club" // Placeholder
        };

        agendamentos.forEach(agendamento => {
            const dataInicio = new Date(agendamento.data_hora_inicio);
            
            // Adicionar formatação de data mais amigável para o Frontend
            const dataFormatada = dataInicio.toLocaleDateString('pt-BR', { dateStyle: 'medium' });
            const horaFormatada = dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            const item = {
                servico: agendamento.nome_servico,
                data: dataFormatada,
                hora: horaFormatada,
                duracao: agendamento.duracao_minutos,
                status: agendamento.status
            };

            if (dataInicio >= hoje) {
                agendamentosFormatados.futuros.push(item);
            } else {
                agendamentosFormatados.historico.push(item);
            }
        });

        res.status(200).json(agendamentosFormatados);

    } catch (error) {
        console.error('Erro ao buscar agendamentos do cliente:', error);
        res.status(500).json({ error: 'Falha interna ao buscar dados do cliente.' });
    }
});

// Rota: GET /api/admin/agenda?data=YYYY-MM-DD
app.get('/api/admin/agenda', async (req, res) => {
    // 1. Recebe a data para filtrar (se o Frontend não enviar, usa a data de hoje)
    const dataFiltrada = req.query.data || new Date().toISOString().substring(0, 10); 

    try {
        // Query: Buscar TODOS os agendamentos da data, juntando dados essenciais
        const query = `
            SELECT 
                A.id_agendamento,
                A.data_hora_inicio,
                A.data_hora_fim,
                A.status, 
                S.nome AS nome_servico,
                S.duracao_minutos,
                C.nome AS nome_cliente,
                C.telefone AS telefone_cliente
            FROM Agendamento A
            JOIN Servico S ON A.id_servico = S.id_servico
            JOIN Cliente C ON A.id_cliente = C.id_cliente
            WHERE DATE(A.data_hora_inicio) = ?
            ORDER BY A.data_hora_inicio ASC;
        `;
        const [agendamentos] = await db.query(query, [dataFiltrada]);
        
        // Formatar os dados para o Frontend
        const agendaFormatada = agendamentos.map(agendamento => {
            const dataInicio = new Date(agendamento.data_hora_inicio);
            
            return {
                id: agendamento.id_agendamento,
                cliente: agendamento.nome_cliente,
                telefone: agendamento.telefone_cliente,
                servico: agendamento.nome_servico,
                duracao: agendamento.duracao_minutos,
                inicio: dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                fim: new Date(agendamento.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                status: agendamento.status
            };
        });

        res.status(200).json({ 
            agenda: agendaFormatada,
            dataConsulta: dataFiltrada
        });

    } catch (error) {
        console.error('Erro ao buscar agenda do admin:', error);
        res.status(500).json({ error: 'Falha interna ao buscar a agenda.' });
    }
});

app.get('/api/cliente/detalhes', async (req, res) => {
    // Recebe o ID do cliente logado via query parameter
    const clienteId = req.query.userId; 

    if (!clienteId) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    try {
        // Query para buscar NOME e TELEFONE
        const query = `
            SELECT 
                nome,
                telefone
            FROM Cliente
            WHERE id_cliente = ?;
        `;
        const [detalhes] = await db.query(query, [clienteId]);
        
        if (detalhes.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }

        // Retorna os detalhes do cliente
        res.status(200).json(detalhes[0]);

    } catch (error) {
        console.error('Erro ao buscar detalhes do cliente:', error);
        res.status(500).json({ error: 'Falha interna ao buscar dados do cliente.' });
    }
});

// 4. ROTAS DE ESCRITA E SEGURANÇA (POST)

app.post('/api/cadastro', async (req, res) => {
    const { nome, email, telefone, senha } = req.body;

    if (!email || !senha || !nome || !telefone) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        // Verificar se o email já existe
        const [existingUser] = await db.query('SELECT id_cliente FROM Cliente WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
        }

        // Hashing da Senha (Segurança!)
        const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

        // Inserir Novo Cliente
        const insertQuery = 'INSERT INTO Cliente (nome, email, telefone, senha_hash) VALUES (?, ?, ?, ?)';

        await db.query(insertQuery, [nome, email, telefone, senhaHash]);

        res.status(201).json({ message: 'Cadastro realizado com sucesso! Pode fazer login.' });

    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ error: 'Falha interna ao cadastrar usuário.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        // Buscar o Cliente pelo Email
        const [users] = await db.query('SELECT id_cliente, senha_hash FROM Cliente WHERE email = ?', [email]);
        
        const user = users[0];

        if (!user) {
            // Se o usuário não existir, retorne erro
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Comparar a Senha (Usa o hash salvo)
        const isMatch = await bcrypt.compare(senha, user.senha_hash);

        if (isMatch) {
            res.status(200).json({ message: 'Login realizado com sucesso!', userId: user.id_cliente });
        } else {
            // Senha errada
            res.status(401).json({ error: 'Credenciais inválidas.' });
        }

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Falha interna ao tentar login.' });
    }
});

app.post('/api/agendamentos', async (req, res) => {
    // Receber os dados do Frontend (Modal)
    const { userId, dataHoraInicio, servicosSelecionados } = req.body;

    if (!dataHoraInicio || !servicosSelecionados || servicosSelecionados.length === 0) {
        return res.status(400).json({ error: 'Dados de agendamento incompletos.' });
    }

    let duracaoTotalEmMinutos = 0;
    const idServicoPrincipal = servicosSelecionados[0].id;

    try {
        // Cálculo da Duração Total do Carrinho
        for (const servico of servicosSelecionados) {
            const [servicoData] = await db.query('SELECT duracao_minutos FROM Servico WHERE id_servico = ?', [servico.id]);
            
            if (servicoData.length > 0) {
                duracaoTotalEmMinutos += servicoData[0].duracao_minutos; 
            }
        }

        if (duracaoTotalEmMinutos === 0) {
            return res.status(400).json({ error: 'Nenhum serviço válido encontrado no carrinho.' });
        }

        // CÁLCULO DA DATA/HORA FIM CORRETA 
        const inicio = new Date(dataHoraInicio);
        const duracaoTotalOcupada = duracaoTotalEmMinutos;
        const fim = new Date(inicio.getTime() + duracaoTotalOcupada * 60000); 

        // Inserir o Agendamento no MySQL
        const insertQuery = "INSERT INTO Agendamento (id_cliente, id_servico, id_barbeiro, data_hora_inicio, data_hora_fim, status) VALUES (?, ?, ?, ?, ?, 'Confirmado')";
        
        await db.query(insertQuery, [
            userId, 
            idServicoPrincipal, 
            ID_BARBEIRO_FIXO, 
            inicio, 
            fim 
        ]);

        res.status(201).json({ message: 'Agendamento confirmado com sucesso!', dataHora: inicio });

    } catch (error) {
        console.error('Erro ao salvar agendamento:', error);
        res.status(500).json({ error: 'Falha interna ao agendar serviço.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
 console.log('Use Ctrl+C para parar o servidor');
});