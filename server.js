// 1. DEPENDÊNCIAS, INICIALIZAÇÃO DO APP E CONSTANTES GLOBAIS

require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env

const express = require('express');
const app = express(); 

const bcrypt = require('bcryptjs'); // Para hash de senhas
const jwt = require('jsonwebtoken'); // Para JSON Web Tokens
const db = require('./src/config/db'); // Configuração do banco de dados
const authMiddleware = require('./src/middleware/auth'); // Importa o middleware de autenticação

// Constantes do App
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10; // Custo do hash bcrypt
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_padrao'; // Chave secreta JWT

// Constantes de Regra de Negócio (Horário de funcionamento da barbearia)
const HORARIO_INICIO = 9; // 9 AM
const HORARIO_FIM = 18;   // 6 PM
const ALMOCO_INICIO = 12; // 12 PM
const ALMOCO_FIM = 13;   // 1 PM
const DURACAO_MINIMA_SLOT = 15; // Slots de 15 em 15 minutos

// ID do Barbeiro Fixo (assumindo apenas um barbeiro por enquanto)
const ID_BARBEIRO_FIXO = 1;

// 2. MIDDLEWARES E CONFIGURAÇÕES

app.use(express.static('public')); // Serve arquivos estáticos da pasta 'public'
app.use(express.json()); // Habilita o parsing de JSON para requisições

// 3. ROTAS DE LEITURA (GET)

// Rota de status do servidor
app.get('/api/status', (req, res) => {
    res.status(200).json({ status: "ok", message: "Servidor Alpha Club Rodando!" });
});

// Rota para buscar todos os serviços disponíveis
app.get('/api/servicos', async (req, res) => {
    try {
        const [servicos] = await db.query('SELECT id_servico, nome, duracao_minutos, preco FROM Servico ORDER BY nome ASC');
        res.status(200).json(servicos);
    } catch (error) {
        console.error('Erro ao buscar serviços:', error);
        res.status(500).json({ error: 'Falha ao buscar a lista de serviços.' });
    }
});

// Rota para buscar horários disponíveis para agendamento
app.get('/api/horarios-disponiveis', async (req, res) => {
    const dataSelecionada = req.query.data;
    const duracaoServico = parseInt(req.query.duracao); 
    
    if (!dataSelecionada || isNaN(duracaoServico)) {
        return res.status(400).json({ error: 'Data e Duração (em minutos) são obrigatórias.' });
    }
    
    const DURACAO_TOTAL_CONSUMIDA = duracaoServico; 

    try {
        // Buscar agendamentos confirmados para o barbeiro fixo no dia
        const query = `
            SELECT data_hora_inicio, data_hora_fim 
            FROM Agendamento 
            WHERE DATE(data_hora_inicio) = ? 
            AND id_barbeiro = ? 
            AND status = 'Confirmado'
        `;
        const [agendamentosDoDia] = await db.query(query, [dataSelecionada, ID_BARBEIRO_FIXO]);

        const horariosLivres = [];
        
        let horaAtual = new Date(`${dataSelecionada}T${HORARIO_INICIO.toString().padStart(2, '0')}:00:00`);
        const fimDiario = new Date(`${dataSelecionada}T${HORARIO_FIM.toString().padStart(2, '0')}:00:00`);

        // Correção: Se a data selecionada for hoje, não mostre horários que já passaram
        const hoje = new Date();
        if (dataSelecionada === hoje.toISOString().split('T')[0]) {
            // Se a hora atual já passou o início do slot, avance para o próximo slot válido
            if (horaAtual < hoje) {
                const minutosRestantes = hoje.getMinutes() % DURACAO_MINIMA_SLOT;
                const minutosParaProximoSlot = minutosRestantes === 0 ? 0 : DURACAO_MINIMA_SLOT - minutosRestantes;
                horaAtual = new Date(hoje.getTime() + minutosParaProximoSlot * 60000);
                horaAtual.setSeconds(0);
                horaAtual.setMilliseconds(0);
            }
        }


        while (horaAtual < fimDiario) {
            const slotTotalFim = new Date(horaAtual.getTime() + DURACAO_TOTAL_CONSUMIDA * 60000); 

            // Se o fim do slot excede o horário de fechamento, pare
            if (slotTotalFim > fimDiario) {
                break;
            }

            // Lógica para o horário de almoço
            const hora = horaAtual.getHours();
            if (hora >= ALMOCO_INICIO && hora < ALMOCO_FIM) {
                // Pular para o final do almoço
                horaAtual = new Date(`${dataSelecionada}T${ALMOCO_FIM.toString().padStart(2, '0')}:00:00`);
                continue;
            }

            // Verificar se o slot proposto conflita com algum agendamento existente
            const isLivre = agendamentosDoDia.every(agendamento => {
                const agendamentoInicio = new Date(agendamento.data_hora_inicio);
                const agendamentoFim = new Date(agendamento.data_hora_fim); 
                
                // Um slot é livre se não houver sobreposição
                return (slotTotalFim <= agendamentoInicio || horaAtual >= agendamentoFim);
            });

            if (isLivre) {
                horariosLivres.push(horaAtual.toTimeString().substring(0, 5));
            }

            // Avançar para o próximo slot
            horaAtual = new Date(horaAtual.getTime() + DURACAO_MINIMA_SLOT * 60000);
        }

        res.status(200).json({ horarios: horariosLivres });

    } catch (error) {
        console.error('Erro na lógica de disponibilidade:', error);
        res.status(500).json({ error: 'Falha interna ao calcular horários.' });
    }
});

// Rota para buscar agendamentos de um cliente específico (agora protegida)
app.get('/api/agendamentos/me', authMiddleware, async (req, res) => {
    const clienteId = req.userId; 

    try {
        // Query para buscar todos os agendamentos do cliente, agrupando serviços por agendamento
        const query = `
            SELECT 
                A.id_agendamento,      
                A.data_hora_inicio, 
                A.status, 
                S.nome AS nome_servico,
                S.duracao_minutos,
                S.preco AS preco_servico,
                B.nome AS nome_barbeiro 
            FROM Agendamento A 
            JOIN Servico S ON A.id_servico = S.id_servico 
            JOIN Barbeiro B ON A.id_barbeiro = B.id_barbeiro 
            WHERE A.id_cliente = ?
            ORDER BY A.data_hora_inicio ASC;
        `;
        const [agendamentosRaw] = await db.query(query, [clienteId]);
        
        // Estruturar os agendamentos para agrupar múltiplos serviços (se aplicável, mas o DB atual é 1:1)
        const agendamentosAgrupados = {};

        agendamentosRaw.forEach(row => {
            if (!agendamentosAgrupados[row.id_agendamento]) {
                agendamentosAgrupados[row.id_agendamento] = {
                    id: row.id_agendamento,
                    data_hora_inicio: row.data_hora_inicio,
                    status: row.status,
                    barbeiro: row.nome_barbeiro,
                    servicos: [],
                    total: 0,
                    duracaoTotal: 0
                };
            }
            agendamentosAgrupados[row.id_agendamento].servicos.push({
                id: row.id_servico,
                nome: row.nome_servico,
                preco: row.preco_servico,
                duracao_minutos: row.duracao_minutos
            });
            agendamentosAgrupados[row.id_agendamento].total += parseFloat(row.preco_servico);
            agendamentosAgrupados[row.id_agendamento].duracaoTotal += row.duracao_minutos;
        });

        const agendamentosFormatados = {
            futuros: [],
            historico: [],
        };

        const hoje = new Date();
        // Zera a hora para comparar apenas a data
        hoje.setHours(0, 0, 0, 0); 
        
        Object.values(agendamentosAgrupados).forEach(agendamento => {
            const dataInicioOriginal = new Date(agendamento.data_hora_inicio); 
            // Zera a hora da data de início para comparar apenas a data
            const dataInicioApenasData = new Date(dataInicioOriginal);
            dataInicioApenasData.setHours(0, 0, 0, 0);

            const item = {
                id: agendamento.id,
                servicos: agendamento.servicos.map(s => ({
                    id: s.id,
                    nome: s.nome,
                    preco: parseFloat(s.preco).toFixed(2)
                })),
                barbeiro: agendamento.barbeiro, 
                data: dataInicioOriginal.toISOString().split('T')[0], // YYYY-MM-DD
                hora: dataInicioOriginal.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), 
                duracao: agendamento.duracaoTotal,
                status: agendamento.status,
                total: agendamento.total.toFixed(2) 
            };

            if (dataInicioApenasData >= hoje) { 
                agendamentosFormatados.futuros.push(item);
            } else {
                agendamentosFormatados.historico.push(item);
            }
        });
        
        // Ordena os agendamentos futuros por data/hora
        agendamentosFormatados.futuros.sort((a, b) => new Date(`${a.data}T${a.hora}`) - new Date(`${b.data}T${b.hora}`));
        // Ordena o histórico por data/hora (mais recentes primeiro)
        agendamentosFormatados.historico.sort((a, b) => new Date(`${b.data}T${b.hora}`) - new Date(`${a.data}T${a.hora}`));

        res.status(200).json(agendamentosFormatados.futuros); // Retorna apenas os futuros por padrão

    } catch (error) {
        console.error('Erro ao buscar agendamentos do cliente:', error);
        res.status(500).json({ error: 'Falha interna ao buscar dados do cliente.' });
    }
});

// Rota: GET /api/barbeiro/agenda?data=YYYY-MM-DD (para o painel do administrador)
app.get('/api/barbeiro/agenda', async (req, res) => {
    const dataSelecionada = req.query.data;
    
    if (!dataSelecionada) {
        return res.status(400).json({ error: 'Data não fornecida.' });
    }

    try {
        const dataPartes = dataSelecionada.split('-').map(Number);
        const ano = dataPartes[0];
        const mesIndex = dataPartes[1] - 1; // Mês é 0-indexado para Date
        const dia = dataPartes[2];

        // Definir o início e fim do dia para a consulta
        const dataInicio = new Date(ano, mesIndex, dia, 0, 0, 0, 0); 
        const dataFim = new Date(ano, mesIndex, dia, 23, 59, 59, 999); 

        const [rows] = await db.query(
            `SELECT 
                a.id_agendamento,
                a.data_hora_inicio, 
                a.data_hora_fim,     
                a.status,
                c.nome AS nome_cliente,
                c.telefone AS telefone_cliente,
                b.nome AS nome_barbeiro,
                s.nome AS nome_servico,
                s.preco AS preco_servico,
                s.duracao_minutos AS duracao_servico
            FROM agendamento a
            JOIN cliente c ON a.id_cliente = c.id_cliente
            JOIN barbeiro b ON a.id_barbeiro = b.id_barbeiro
            JOIN servico s ON a.id_servico = s.id_servico 
            WHERE a.data_hora_inicio BETWEEN ? AND ? 
            ORDER BY a.data_hora_inicio ASC`,
            [dataInicio, dataFim]
        );

        // Agrupar serviços por agendamento se o modelo do frontend for esse
        const agendaAgrupada = {};
        rows.forEach(row => {
            if (!agendaAgrupada[row.id_agendamento]) {
                agendaAgrupada[row.id_agendamento] = {
                    id: row.id_agendamento,
                    data_hora_inicio: row.data_hora_inicio,
                    data_hora_fim: row.data_hora_fim,
                    status: row.status,
                    cliente: {
                        nome: row.nome_cliente,
                        telefone: row.telefone_cliente
                    },
                    barbeiro: row.nome_barbeiro,
                    servicos: [],
                    total: 0,
                    duracaoTotal: 0
                };
            }
            agendaAgrupada[row.id_agendamento].servicos.push({
                nome: row.nome_servico,
                preco: parseFloat(row.preco_servico),
                duracao_minutos: row.duracao_servico
            });
            agendaAgrupada[row.id_agendamento].total += parseFloat(row.preco_servico);
            agendaAgrupada[row.id_agendamento].duracaoTotal += row.duracao_servico;
        });

        res.json({ agenda: Object.values(agendaAgrupada) });
        
    } catch (error) {
        console.error('Erro ao buscar agenda do barbeiro:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar agenda.' });
    }
});

// Rota para buscar detalhes de um cliente (nome e telefone)
app.get('/api/cliente/me', authMiddleware, async (req, res) => {
    const clienteId = req.userId;

    try {
        const query = `
            SELECT 
                id_cliente AS id, 
                nome,
                email,
                telefone
            FROM Cliente
            WHERE id_cliente = ?;
        `;
        const [detalhes] = await db.query(query, [clienteId]);
        
        if (detalhes.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }

        res.status(200).json(detalhes[0]);

    } catch (error) {
        console.error('Erro ao buscar detalhes do cliente:', error);
        res.status(500).json({ error: 'Falha interna ao buscar dados do cliente.' });
    }
});


// Rota para buscar todos os clientes cadastrados
// TODO: Adicionar authMiddleware para rota de admin
app.get('/api/clientes', async (req, res) => {
    try {
        const [clientes] = await db.query('SELECT id_cliente, nome, email, telefone FROM Cliente ORDER BY nome ASC');
        res.status(200).json(clientes);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({ error: 'Falha ao buscar a lista de clientes.' });
    }
});

// Rota para calcular a renda mensal
// TODO: Adicionar authMiddleware para rota de admin
app.get('/api/renda-mensal', async (req, res) => {
    const mes = parseInt(req.query.mes);
    const ano = parseInt(req.query.ano);

    if (isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12) {
        return res.status(400).json({ error: 'Mês e ano válidos são obrigatórios.' });
    }

    try {
        const [result] = await db.query(
            `SELECT 
                SUM(S.preco) AS rendaTotal
            FROM Agendamento A
            JOIN Servico S ON A.id_servico = S.id_servico
            WHERE MONTH(A.data_hora_inicio) = ? 
              AND YEAR(A.data_hora_inicio) = ?
              AND A.status = 'Concluído'`,
            [mes, ano]
        );

        const rendaTotal = result[0].rendaTotal || 0;
        res.status(200).json({ mes, ano, rendaTotal: parseFloat(rendaTotal).toFixed(2) });

    } catch (error) {
        console.error('Erro ao calcular renda mensal:', error);
        res.status(500).json({ error: 'Falha ao calcular a renda mensal.' });
    }
});


// 4. ROTAS DE ESCRITA E SEGURANÇA (POST, DELETE, PUT/PATCH)

// Rota para cadastro de novos clientes
app.post('/api/cadastro', async (req, res) => {
    const { nome, email, telefone, senha } = req.body;

    if (!email || !senha || !nome) { 
        return res.status(400).json({ error: 'Nome, Email e Senha são obrigatórios.' });
    }

    try {
        const [existingUser] = await db.query('SELECT id_cliente FROM Cliente WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
        }

        const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

        const insertQuery = 'INSERT INTO Cliente (nome, email, telefone, senha_hash) VALUES (?, ?, ?, ?)';
        await db.query(insertQuery, [nome, email, telefone, senhaHash]);

        res.status(201).json({ message: 'Cadastro realizado com sucesso! Pode fazer login.' });

    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ error: 'Falha interna ao cadastrar usuário.' });
    }
});

// Rota para login de clientes
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        const [users] = await db.query('SELECT id_cliente, senha_hash FROM Cliente WHERE email = ?', [email]);
        
        const user = users[0];

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(senha, user.senha_hash);

        if (isMatch) {
            // Gerar token JWT
            const payload = { userId: user.id_cliente }; // Inclui o ID do cliente no token
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Expira em 1 hora

            res.status(200).json({ message: 'Login realizado com sucesso!', token, userId: user.id_cliente });
        } else {
            res.status(401).json({ error: 'Credenciais inválidas.' });
        }

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Falha interna ao tentar login.' });
    }
});

// Rota para criar um novo agendamento
app.post('/api/agendamentos', authMiddleware, async (req, res) => { // Agendamento requer autenticação
    const { dataHoraInicio, servicosSelecionados } = req.body;
    const userId = req.userId; // Pega o ID do cliente do token JWT

    if (!dataHoraInicio || !servicosSelecionados || servicosSelecionados.length === 0) {
        return res.status(400).json({ error: 'Dados de agendamento incompletos.' });
    }

    const connection = await db.getConnection(); // Obtém uma conexão para a transação
    try {
        await connection.beginTransaction(); // Inicia a transação

        let duracaoTotalEmMinutos = 0;
        let servicosComDuracao = [];

        // Primeiro, obter a duração de todos os serviços selecionados
        for (const servico of servicosSelecionados) {
            const [servicoData] = await connection.query('SELECT duracao_minutos FROM Servico WHERE id_servico = ?', [servico.id]);
            if (servicoData.length > 0) {
                duracaoTotalEmMinutos += servicoData[0].duracao_minutos;
                servicosComDuracao.push({ id: servico.id, duracao: servicoData[0].duracao_minutos });
            } else {
                await connection.rollback();
                return res.status(400).json({ error: `Serviço com ID ${servico.id} não encontrado.` });
            }
        }

        if (duracaoTotalEmMinutos === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Nenhum serviço válido encontrado no carrinho para agendar.' });
        }

        const inicio = new Date(dataHoraInicio);
        const fim = new Date(inicio.getTime() + duracaoTotalEmMinutos * 60000);

        // Re-verificar a disponibilidade do slot no momento da confirmação (segurança extra)
        const checkQuery = `
            SELECT COUNT(*) AS count 
            FROM Agendamento 
            WHERE id_barbeiro = ? 
            AND status = 'Confirmado' 
            AND (
                (data_hora_inicio < ? AND data_hora_fim > ?) OR
                (data_hora_inicio >= ? AND data_hora_inicio < ?)
            )
        `;
        const [conflitos] = await connection.query(checkQuery, [ID_BARBEIRO_FIXO, fim, inicio, inicio, fim]);

        if (conflitos[0].count > 0) {
            await connection.rollback();
            return res.status(409).json({ error: 'O horário selecionado não está mais disponível.' });
        }
        
        for (const servico of servicosComDuracao) {
            const insertQuery = `
                INSERT INTO Agendamento (id_cliente, id_servico, id_barbeiro, data_hora_inicio, data_hora_fim, status) 
                VALUES (?, ?, ?, ?, ?, 'Confirmado')
            `;
            await connection.query(insertQuery, [
                userId, 
                servico.id,
                ID_BARBEIRO_FIXO, 
                inicio, 
                fim 
            ]);
        }

        await connection.commit(); // Confirma a transação
        res.status(201).json({ message: 'Agendamento confirmado com sucesso!', dataHora: inicio });

    } catch (error) {
        await connection.rollback(); // Desfaz a transação em caso de erro
        console.error('Erro ao salvar agendamento:', error);
        res.status(500).json({ error: 'Falha interna ao agendar serviço.' });
    } finally {
        connection.release(); // Libera a conexão
    }
});

// Rota para adicionar um novo serviço
app.post('/api/servicos', async (req, res) => {
    const { nome, duracao_minutos, preco } = req.body;

    if (!nome || isNaN(duracao_minutos) || isNaN(preco)) {
        return res.status(400).json({ error: 'Nome, duração e preço são obrigatórios e devem ser válidos.' });
    }

    try {
        const insertQuery = 'INSERT INTO Servico (nome, duracao_minutos, preco) VALUES (?, ?, ?)';
        await db.query(insertQuery, [nome, duracao_minutos, preco]);
        res.status(201).json({ message: 'Serviço adicionado com sucesso!' });
    } catch (error) {
        console.error('Erro ao adicionar serviço:', error);
        res.status(500).json({ error: 'Falha interna ao adicionar serviço.' });
    }
});

// Rota para remover um serviço
app.delete('/api/servicos/:id', async (req, res) => {
    const servicoId = req.params.id;

    try {
        const [agendamentosFuturos] = await db.query(
            'SELECT COUNT(*) AS count FROM Agendamento WHERE id_servico = ? AND data_hora_inicio > NOW() AND status = \'Confirmado\'',
            [servicoId]
        );

        if (agendamentosFuturos[0].count > 0) {
            return res.status(400).json({ error: 'Não é possível remover este serviço. Existem agendamentos futuros associados a ele.' });
        }

        const [result] = await db.query('DELETE FROM Servico WHERE id_servico = ?', [servicoId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado.' });
        }

        res.status(200).json({ message: 'Serviço removido com sucesso!' });
    } catch (error) {
        console.error('Erro ao remover serviço:', error);
        res.status(500).json({ error: 'Falha interna ao remover serviço.' });
    }
});

// Rota: PATCH /api/agendamentos/:id/cancelar - PARA CANCELAMENTO DE AGENDAMENTO (ADMIN OU CLIENTE)
app.patch('/api/agendamentos/:id/cancelar', authMiddleware, async (req, res) => {
    const agendamentoId = req.params.id;
    const userIdLogado = req.userId; // ID do usuário logado (pode ser cliente ou admin)
    const isUserAdmin = req.userRole === 'admin' || userIdLogado === 1; // Ou outra forma de verificar se é admin

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verificar se o agendamento existe e qual seu status atual
        const [agendamentoExistente] = await connection.query('SELECT id_cliente, status FROM Agendamento WHERE id_agendamento = ?', [agendamentoId]);

        if (agendamentoExistente.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Agendamento não encontrado.' });
        }

        // 2. Verificar permissão para cancelar
        const idClienteDoAgendamento = agendamentoExistente[0].id_cliente;

        // PERMISSÃO: Se não for admin E o ID do agendamento não pertence ao usuário logado, então nega.
        if (!isUserAdmin && idClienteDoAgendamento !== userIdLogado) {
            await connection.rollback();
            return res.status(403).json({ error: 'Você não tem permissão para cancelar este agendamento.' });
        }
        
        // 3. Impedir o cancelamento de agendamentos já cancelados ou concluídos
        const statusAtual = agendamentoExistente[0].status;
        if (statusAtual === 'Cancelado') {
            await connection.rollback();
            return res.status(400).json({ error: 'Este agendamento já foi cancelado.' });
        }
        if (statusAtual === 'Concluído') {
            await connection.rollback();
            return res.status(400).json({ error: 'Agendamentos concluídos não podem ser cancelados.' });
        }
        
        // 4. Atualiza o status no banco de dados para 'Cancelado'
        const query = 'UPDATE Agendamento SET status = ?, data_atualizacao = NOW() WHERE id_agendamento = ?';
        const [result] = await connection.query(query, ['Cancelado', agendamentoId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(500).json({ error: 'Falha ao atualizar o status do agendamento.' });
        }

        await connection.commit();
        res.status(200).json({ message: 'Agendamento cancelado com sucesso.' });
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao cancelar agendamento:', error);
        res.status(500).json({ error: 'Falha interna ao cancelar o agendamento.' });
    } finally {
        connection.release();
    }
});

app.put('/api/cliente/mudar-senha', authMiddleware, async (req, res) => {

    const clienteId = req.userId; // ID do cliente do token JWT
    const { currentPassword, newPassword } = req.body;

    // 1. Validação dos dados de entrada
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    try {
        // 2. Buscar a senha hash atual do cliente no DB
        const [users] = await db.query('SELECT senha_hash FROM Cliente WHERE id_cliente = ?', [clienteId]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }
        const user = users[0];

        // 3. Comparar a senha atual fornecida com a senha hash do DB
        const isMatch = await bcrypt.compare(currentPassword, user.senha_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Senha atual incorreta.' });
        }

        // 4. Gerar hash para a nova senha
        const novaSenhaHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // 5. Atualizar a senha no banco de dados
        const updateQuery = 'UPDATE Cliente SET senha_hash = ?, data_atualizacao = NOW() WHERE id_cliente = ?';
        await db.query(updateQuery, [novaSenhaHash, clienteId]);

        console.log('Backend: Senha alterada com sucesso para ID:', clienteId); // ADD
        res.status(200).json({ message: 'Senha alterada com sucesso!' });

    } catch (error) {
        console.error('Backend: Erro ao mudar a senha:', error); // ADD
        res.status(500).json({ error: 'Falha interna ao mudar a senha.' });
    }
});

// NOVA ROTA: PUT /api/cliente/:id - Para o cliente atualizar seus próprios dados
app.put('/api/cliente/:id', authMiddleware, async (req, res) => {
    const clienteIdParam = parseInt(req.params.id); // ID do cliente na URL
    const clienteIdToken = req.userId; // ID do cliente do token JWT

    const { nome, telefone } = req.body;

    // 1. Verificação de Autorização: O cliente só pode atualizar seus próprios dados
    if (clienteIdParam !== clienteIdToken) {
        return res.status(403).json({ error: 'Você não tem permissão para atualizar os dados de outro cliente.' });
    }

    // 2. Validação dos dados de entrada
    if (!nome) {
        return res.status(400).json({ error: 'O nome é obrigatório.' });
    }
    // O email não está sendo alterado aqui, mas se fosse, você precisaria de validação de formato e unicidade.

    try {
        const updateQuery = 'UPDATE Cliente SET nome = ?, telefone = ?, data_atualizacao = NOW() WHERE id_cliente = ?';
        const [result] = await db.query(updateQuery, [nome, telefone, clienteIdToken]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado ou nenhum dado para atualizar.' });
        }

        res.status(200).json({ message: 'Dados do cliente atualizados com sucesso!' })

    } catch (error) {
        console.error('Erro ao atualizar dados do cliente:', error);
        res.status(500).json({ error: 'Falha interna ao atualizar dados do cliente.' });
    }
});

// 5. INICIALIZAÇÃO DO SERVIDOR

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('Use Ctrl+C para parar o servidor');
});