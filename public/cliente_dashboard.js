document.addEventListener('DOMContentLoaded', () => {
    // 1. LÓGICA DE VERIFICAÇÃO DE SESSÃO (MVP)
    const userId = parseInt(localStorage.getItem('alphaUserId'));
    
    // Se não houver ID logado, redireciona imediatamente
    if (!userId) {
        window.location.href = 'login.html';
        return; // Interrompe o restante da execução
    }

    const CLIENTE_ID = userId; 

    // Elementos do DOM
    const nomeClienteSpan = document.getElementById('cliente-nome');
    const futurosContainer = document.getElementById('lista-agendamentos-futuros');
    const historicoContainer = document.getElementById('lista-historico');
    
    // Configura o botão de Logout (adicionando o listener)
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('alphaUserId');
            window.location.href = 'login.html';
        });
    }

    // FUNÇÃO PARA CRIAR O CARD VISUAL
    function criarCardAgendamento(item) {
        const cardCol = document.createElement('div');
        cardCol.className = 'col-md-6 mb-3'; 
        
        // Classes Bootstrap e CSS customizado para o card
        const cardHtml = `
            <div class="card h-100 p-3 shadow-sm agendamento-card-custom">
                <div class="card-body">
                    <h5 class="card-title fw-bold">${item.servico}</h5>
                    <p class="card-text mb-1">
                        🗓️ Data: ${item.data} às ${item.hora}
                    </p>
                    <p class="card-text text-muted">
                        ⏳ Duração: ${item.duracao} min
                    </p>
                    <span class="badge bg-primary">${item.status}</span>
                </div>
            </div>
        `;
        cardCol.innerHTML = cardHtml;
        return cardCol;
    }

    // FUNÇÃO PRINCIPAL: BUSCAR DADOS

    async function carregarDashboard() {
        try {
            // CHAMA A API USANDO O ID DO CLIENTE LOGADO
            const response = await fetch(`/api/cliente/agendamentos?userId=${CLIENTE_ID}`);
            const dados = await response.json();

            // Atualiza o nome do cliente
            if (nomeClienteSpan) {
                // Usando um placeholder, mas no usar dados.nomeCliente
                nomeClienteSpan.textContent = `Olá, ${dados.nomeCliente || 'Cliente Alpha'}`; 
            }

            // Limpa e Renderiza Agendamentos FUTUROS
            futurosContainer.innerHTML = '';
            if (dados.futuros.length === 0) {
                futurosContainer.innerHTML = '<p class="alert alert-info">Nenhum agendamento futuro encontrado.</p>';
            } else {
                dados.futuros.forEach(item => {
                    futurosContainer.appendChild(criarCardAgendamento(item));
                });
            }

            // Limpa e Renderiza HISTÓRICO
            historicoContainer.innerHTML = '';
            if (dados.historico.length === 0) {
                historicoContainer.innerHTML = '<p class="text-muted">Nenhum histórico de serviço.</p>';
            } else {
                dados.historico.forEach(item => {
                    historicoContainer.appendChild(criarCardAgendamento(item));
                });
            }

        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            futurosContainer.innerHTML = '<p class="text-danger">Não foi possível carregar os dados. Servidor offline?</p>';
        }
    }

    // Só carrega o dashboard se o userId for válido
    carregarDashboard();
});