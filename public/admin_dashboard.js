// Arquivo: public/admin_dashboard.js

// Variáveis DOM para a Agenda
const dataAgendaInput = document.getElementById('data-agenda');
const agendaBarbeiroContainer = document.getElementById('agenda-barbeiro-container');
const messageArea = document.getElementById('message-area');
const logoutLink = document.getElementById('logout-link');

// Variáveis DOM para Adicionar Serviço
const formNovoServico = document.getElementById('form-novo-servico');
const servicoNomeInput = document.getElementById('servico-nome');
const servicoDuracaoInput = document.getElementById('servico-duracao');
const servicoPrecoInput = document.getElementById('servico-preco');
const servicoMessageArea = document.getElementById('servico-message-area');

// Variável DOM para Listar Serviços Existentes
const listaServicosContainer = document.getElementById('lista-servicos-container');


// Variáveis DOM para Clientes Cadastrados
const clientesContainer = document.getElementById('clientes-container');

// Variáveis DOM para Renda Mensal
const mesRendaSelect = document.getElementById('mes-renda');
const anoRendaSelect = document.getElementById('ano-renda');
const btnBuscarRenda = document.getElementById('btn-buscar-renda');
const valorRendaSpan = document.getElementById('valor-renda');
const rendaMessageArea = document.getElementById('renda-message-area');


// ====================================================================
// LÓGICA DE CARREGAMENTO INICIAL E EVENT LISTENERS
// ====================================================================

let userIdLogado = null; // Variável para armazenar o ID do admin logado
let adminToken = null; // Variável para armazenar o token JWT do admin

document.addEventListener('DOMContentLoaded', () => {
    // Verificação de Autenticação e Autorização (Admin ID = 1)
    const userId = localStorage.getItem('alphaUserId');
    const token = localStorage.getItem('alphaToken');

    // Redirecionamento de Segurança: Apenas Admin (ID 1) pode acessar
    if (!userId || parseInt(userId) !== 1 || !token) { 
        alert('Acesso negado. Você precisa ser um administrador para acessar esta página.');
        localStorage.removeItem('alphaUserId'); 
        localStorage.removeItem('alphaToken');
        window.location.href = 'index.html'; 
        return;
    }

    userIdLogado = parseInt(userId); // Define o ID do admin logado
    adminToken = token; // Define o token do admin logado

    // Carrega a agenda para a data atual por padrão
    const hoje = new Date();
    const hojeString = hoje.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    dataAgendaInput.value = hojeString;
    buscarAgenda(hojeString);

    // Carrega todas as outras seções do dashboard
    carregarDashboardAdmin();

    // Event Listeners para a Agenda
    dataAgendaInput.addEventListener('change', (e) => {
        buscarAgenda(e.target.value);
    });

    // Logout
    if (logoutLink) { 
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('alphaUserId'); 
            localStorage.removeItem('alphaToken'); 
            alert('Você foi desconectado do painel administrativo.');
            window.location.href = 'index.html';
        });
    }

    // Event Listener para Adicionar Serviço
    if (formNovoServico) {
        formNovoServico.addEventListener('submit', handleNovoServico);
    }

    // Preencher selects de Mês e Ano para Renda Mensal
    preencherSelectsRenda();
    if (btnBuscarRenda) {
        btnBuscarRenda.addEventListener('click', buscarRendaMensal);
    }
});


/**
 * Função principal para carregar os dados do dashboard do admin.
 */
async function carregarDashboardAdmin() {
    await carregarClientes(); // Carrega a lista de clientes ao iniciar
    await carregarServicos(); // Carrega a lista de serviços ao iniciar
    await buscarRendaMensal(); // Carrega a renda do mês atual por padrão
}

/**
 * Busca e exibe a agenda do barbeiro para uma data específica.
 * @param {string} data - Data no formato YYYY-MM-DD.
 */
async function buscarAgenda(data) {
    if (!data) {
        if (agendaBarbeiroContainer) agendaBarbeiroContainer.innerHTML = '<p class="text-warning">Selecione uma data para ver a agenda.</p>';
        return;
    }

    try {
        if (agendaBarbeiroContainer) agendaBarbeiroContainer.innerHTML = '<p class="text-info">Carregando agenda...</p>';

        const response = await fetch(`/api/barbeiro/agenda?data=${data}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}` // Adiciona o token na requisição
            }
        });
        const result = await response.json();

        if (response.ok) {
            renderizarAgenda(result.agenda);
        } else {
            console.error('Erro ao buscar agenda:', result.error);
            if (agendaBarbeiroContainer) agendaBarbeiroContainer.innerHTML = `<p class="text-danger">Erro: ${result.error}</p>`;
        }
    } catch (error) {
        console.error('Falha na requisição da agenda:', error);
        if (agendaBarbeiroContainer) agendaBarbeiroContainer.innerHTML = '<p class="text-danger">Erro de conexão com o servidor.</p>';
    }
}

/**
 * Renderiza a tabela da agenda do barbeiro.
 * @param {Array} agenda - Lista de agendamentos.
 */
function renderizarAgenda(agenda) {
    if (!agendaBarbeiroContainer) return; 

    if (agenda.length === 0) {
        agendaBarbeiroContainer.innerHTML = '<p class="text-info">Nenhum agendamento para esta data.</p>';
        return;
    }

    let tableHtml = `
        <table class="table table-hover table-striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Início</th>
                    <th>Fim</th>
                    <th>Cliente</th>
                    <th>Telefone</th>
                    <th>Serviço(s)</th> 
                    <th>Status</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
    `;

    agenda.forEach(item => {
        const dataHoraInicio = new Date(item.data_hora_inicio);
        const dataHoraFim = new Date(item.data_hora_fim);

        const inicioFormatado = dataHoraInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const fimFormatado = dataHoraFim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let statusClass = '';
        switch (item.status) {
            case 'Confirmado': statusClass = 'badge bg-success'; break;
            case 'Cancelado': statusClass = 'badge bg-danger'; break;
            case 'Concluído': statusClass = 'badge bg-info'; break;
            default: statusClass = 'badge bg-secondary'; break;
        }

        // Adiciona botões de ação para admin
        let acoesHtml = '';
        if (item.status === 'Confirmado') {
            acoesHtml = `<button class="btn btn-sm btn-danger btn-cancelar-agendamento" data-id="${item.id}">Cancelar</button>`;
        } else if (item.status === 'Cancelado') {
            acoesHtml = `<span class="text-muted">Cancelado</span>`;
        } else if (item.status === 'Concluído') {
            acoesHtml = `<span class="text-muted">Concluído</span>`;
        }

        // Formatar os serviços
        const servicosFormatados = item.servicos.map(s => s.nome).join(', ');

        tableHtml += `
            <tr>
                <td>${item.id}</td>
                <td>${inicioFormatado}</td>
                <td>${fimFormatado}</td>
                <td>${item.cliente.nome}</td>
                <td>${item.cliente.telefone}</td>
                <td>${servicosFormatados}</td> 
                <td><span class="${statusClass}">${item.status}</span></td>
                <td>${acoesHtml}</td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;

    agendaBarbeiroContainer.innerHTML = tableHtml;

    // Adiciona event listeners aos botões de cancelar
    agendaBarbeiroContainer.querySelectorAll('.btn-cancelar-agendamento').forEach(button => {
        button.addEventListener('click', (e) => {
            const agendamentoId = e.target.dataset.id;
            cancelarAgendamentoAdmin(agendamentoId, dataAgendaInput.value); // Passa a data para recarregar
        });
    });
}


/**
 * Cancela um agendamento (função do admin).
 * @param {number} id - ID do agendamento a ser cancelado.
 * @param {string} dataParaRecarregar - Data para recarregar a agenda após o cancelamento.
 */
async function cancelarAgendamentoAdmin(id, dataParaRecarregar) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch(`/api/agendamentos/${id}/cancelar`, { 
            method: 'PATCH', // Deve ser PATCH para atualizar o status
            headers: {
                'Authorization': `Bearer ${adminToken}` // Adiciona o token aqui
            }
        });

        if (response.ok) {
            showMessage('Agendamento cancelado com sucesso!', 'success');
            buscarAgenda(dataParaRecarregar); // Recarrega a agenda da data atual
        } else {
            const errorData = await response.json();
            showMessage(`Erro ao cancelar: ${errorData.error || 'Erro desconhecido.'}`, 'danger');
        }
    } catch (e) {
        console.error('Erro de rede/servidor ao cancelar agendamento:', e);
        showMessage('Erro de conexão com o servidor. Tente novamente mais tarde.', 'danger');
    }
}


/**
 * Exibe uma mensagem na área de mensagens principal.
 * @param {string} msg - Mensagem a ser exibida.
 * @param {string} type - Tipo da mensagem (success, danger, info, warning).
 */
function showMessage(msg, type = 'info') {
    if (messageArea) {
        messageArea.textContent = msg;
        messageArea.className = `alert alert-${type}`;
        messageArea.classList.remove('d-none'); // Garante que a mensagem esteja visível
        // Opcional: Esconder mensagem após alguns segundos
        setTimeout(() => {
            messageArea.classList.add('d-none');
        }, 5000);
    }
}

// ====================================================================
// LÓGICA PARA ADICIONAR E REMOVER SERVIÇOS
// ====================================================================

/**
 * Lida com o envio do formulário para adicionar um novo serviço.
 * @param {Event} e - Evento de submit.
 */
async function handleNovoServico(e) {
    e.preventDefault(); 

    const nome = servicoNomeInput.value;
    const duracao_minutos = parseInt(servicoDuracaoInput.value);
    const preco = parseFloat(servicoPrecoInput.value);

    // Validação básica
    if (!nome || isNaN(duracao_minutos) || isNaN(preco) || duracao_minutos <= 0 || preco < 0) {
        renderServicoMessage('Por favor, preencha todos os campos corretamente.', 'danger');
        return;
    }

    try {
        const response = await fetch('/api/servicos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}` // Adiciona o token aqui
            },
            body: JSON.stringify({ nome, duracao_minutos, preco }),
        });

        const result = await response.json();

        if (response.ok) {
            renderServicoMessage(result.message, 'success');
            formNovoServico.reset(); // Limpa o formulário
            carregarServicos(); // Recarrega a lista de serviços
        } else {
            renderServicoMessage(`Erro: ${result.error || 'Falha ao adicionar serviço.'}`, 'danger');
        }
    } catch (error) {
        console.error('Erro ao adicionar serviço:', error);
        renderServicoMessage('Erro de conexão com o servidor.', 'danger');
    }
}

/**
 * Exibe uma mensagem na área específica para adicionar serviço.
 * @param {string} msg - Mensagem a ser exibida.
 * @param {string} type - Tipo da mensagem (success, danger, info, warning).
 */
function renderServicoMessage(msg, type = 'info') {
    if (servicoMessageArea) {
        servicoMessageArea.innerHTML = `<div class="alert alert-${type}" role="alert">${msg}</div>`;
        setTimeout(() => {
            servicoMessageArea.innerHTML = '';
        }, 5000);
    }
}

/**
 * Busca e exibe todos os serviços cadastrados para gerenciamento.
 */
async function carregarServicos() {
    if (!listaServicosContainer) return;

    listaServicosContainer.innerHTML = '<p class="text-info">Carregando serviços...</p>';

    try {
        const response = await fetch('/api/servicos', {
            headers: {
                'Authorization': `Bearer ${adminToken}` // Adiciona o token aqui
            }
        });
        const servicos = await response.json();

        if (response.ok) {
            renderizarServicos(servicos);
        } else {
            console.error('Erro ao buscar serviços para gerenciamento:', servicos.error);
            listaServicosContainer.innerHTML = `<p class="text-danger">Erro: ${servicos.error}</p>`;
        }
    } catch (error) {
        console.error('Falha na requisição de serviços para gerenciamento:', error);
        listaServicosContainer.innerHTML = '<p class="text-danger">Erro de conexão com o servidor.</p>';
    }
}

/**
 * Renderiza a tabela de serviços.
 * @param {Array} servicos - Lista de objetos de serviços.
 */
function renderizarServicos(servicos) {
    if (!listaServicosContainer) return;

    if (servicos.length === 0) {
        listaServicosContainer.innerHTML = '<p class="text-info">Nenhum serviço cadastrado.</p>';
        return;
    }

    let tableHtml = `
        <table class="table table-hover table-striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Duração (min)</th>
                    <th>Preço (R$)</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
    `;

    servicos.forEach(servico => {
        tableHtml += `
            <tr>
                <td>${servico.id_servico}</td>
                <td>${servico.nome}</td>
                <td>${servico.duracao_minutos}</td>
                <td>${parseFloat(servico.preco).toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-danger btn-remover-servico" data-id="${servico.id_servico}">Remover</button>
                </td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;

    listaServicosContainer.innerHTML = tableHtml;

    // Adiciona event listeners aos botões de remover
    listaServicosContainer.querySelectorAll('.btn-remover-servico').forEach(button => {
        button.addEventListener('click', (e) => {
            const servicoId = e.target.dataset.id;
            removerServico(servicoId);
        });
    });
}

/**
 * Lida com a remoção de um serviço.
 * @param {number} servicoId - ID do serviço a ser removido.
 */
async function removerServico(servicoId) {
    if (!confirm('Tem certeza que deseja remover este serviço? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch(`/api/servicos/${servicoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}` // Adiciona o token aqui
            }
        });

        const result = await response.json();

        if (response.ok) {
            renderServicoMessage(result.message, 'success');
            carregarServicos(); // Recarrega a lista de serviços após a remoção
        } else {
            renderServicoMessage(`Erro ao remover serviço: ${result.error || 'Erro desconhecido.'}`, 'danger');
        }
    } catch (error) {
        console.error('Erro na requisição de remoção de serviço:', error);
        renderServicoMessage('Erro de conexão com o servidor.', 'danger');
    }
}


// ====================================================================
// LÓGICA PARA VISUALIZAR CLIENTES CADASTRADOS
// ====================================================================

/**
 * Busca e exibe todos os clientes cadastrados.
 */
async function carregarClientes() {
    if (!clientesContainer) return;

    clientesContainer.innerHTML = '<p class="text-info">Carregando clientes...</p>';

    try {
        const response = await fetch('/api/clientes', {
            headers: {
                'Authorization': `Bearer ${adminToken}` // Adiciona o token aqui
            }
        });
        const clientes = await response.json();

        if (response.ok) {
            renderizarClientes(clientes);
        } else {
            console.error('Erro ao buscar clientes:', clientes.error);
            clientesContainer.innerHTML = `<p class="text-danger">Erro: ${clientes.error}</p>`;
        }
    } catch (error) {
        console.error('Falha na requisição de clientes:', error);
        clientesContainer.innerHTML = '<p class="text-danger">Erro de conexão com o servidor.</p>';
    }
}

/**
 * Renderiza a tabela de clientes.
 * @param {Array} clientes - Lista de objetos de clientes.
 */
function renderizarClientes(clientes) {
    if (!clientesContainer) return;

    if (clientes.length === 0) {
        clientesContainer.innerHTML = '<p class="text-info">Nenhum cliente cadastrado.</p>';
        return;
    }

    let tableHtml = `
        <table class="table table-hover table-striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Telefone</th>
                </tr>
            </thead>
            <tbody>
    `;

    clientes.forEach(cliente => {
        tableHtml += `
            <tr>
                <td>${cliente.id_cliente}</td>
                <td>${cliente.nome}</td>
                <td>${cliente.email}</td>
                <td>${cliente.telefone}</td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;

    clientesContainer.innerHTML = tableHtml;
}


// ====================================================================
// LÓGICA PARA CALCULAR E EXIBIR RENDA MENSAL
// ====================================================================

/**
 * Preenche os selects de mês e ano para a busca de renda.
 */
function preencherSelectsRenda() {
    if (!mesRendaSelect || !anoRendaSelect) return;

    // Preencher meses
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const mesAtual = new Date().getMonth(); // 0-11
    meses.forEach((mes, index) => {
        const option = document.createElement('option');
        option.value = index + 1; // Mês no banco de dados é 1-12
        option.textContent = mes;
        if (index === mesAtual) {
            option.selected = true;
        }
        mesRendaSelect.appendChild(option);
    });

    // Preencher anos
    const anoAtual = new Date().getFullYear();
    for (let i = anoAtual - 2; i <= anoAtual + 1; i++) { // Últimos 2 anos, atual e próximo
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === anoAtual) {
            option.selected = true;
        }
        anoRendaSelect.appendChild(option);
    }
}

/**
 * Busca a renda mensal do backend e exibe o resultado.
 */
async function buscarRendaMensal() {
    if (!mesRendaSelect || !anoRendaSelect || !valorRendaSpan) return;

    const mes = mesRendaSelect.value;
    const ano = anoRendaSelect.value;

    rendaMessageArea.innerHTML = ''; // Limpa mensagens anteriores
    valorRendaSpan.textContent = '0.00'; // Reseta o valor enquanto carrega

    try {
        const response = await fetch(`/api/renda-mensal?mes=${mes}&ano=${ano}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}` // Adiciona o token aqui
            }
        });
        const result = await response.json();

        if (response.ok) {
            valorRendaSpan.textContent = result.rendaTotal;
        } else {
            console.error('Erro ao buscar renda mensal:', result.error);
            rendaMessageArea.innerHTML = `<div class="alert alert-danger" role="alert">Erro: ${result.error}</div>`;
        }
    } catch (error) {
        console.error('Falha na requisição de renda mensal:', error);
        rendaMessageArea.innerHTML = '<div class="alert alert-danger" role="alert">Erro de conexão com o servidor.</div>';
    }
}