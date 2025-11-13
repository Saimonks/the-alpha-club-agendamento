document.addEventListener('DOMContentLoaded', () => {
    const userId = parseInt(localStorage.getItem('alphaUserId'));
    const agendaContainer = document.getElementById('agenda-lista');
    const dataInput = document.getElementById('data-agenda');
    const totalSpan = document.getElementById('total-agendamentos');

    if (!userId || userId !== 1) {
        alert('Acesso negado. Faça login como Barbeiro/Admin.');
        window.location.href = 'login.html';
        return;
    }

    // Define a data atual como padrão no input
    const hoje = new Date().toISOString().substring(0, 10);
    dataInput.value = hoje; 
    
    // Dispara a busca quando a página carrega e quando a data muda
    dataInput.addEventListener('change', buscarAgenda);
    
    // Adiciona o listener de logout
    document.getElementById('btn-logout-admin').addEventListener('click', () => {
        // Lógica de logout limpar cookies
        localStorage.removeItem('alphaUserId');
        window.location.href = 'login.html'; 
    });

    // FUNÇÃO PRINCIPAL: BUSCAR AGENDA
    async function buscarAgenda() {
        const dataConsulta = dataInput.value;
        agendaContainer.innerHTML = '<p class="lead text-info">Buscando agendamentos para esta data...</p>';
        
        try {
            const response = await fetch(`/api/admin/agenda?data=${dataConsulta}`);
            const data = await response.json();
            
            agendaContainer.innerHTML = '';
            
            if (!response.ok) {
                agendaContainer.innerHTML = `<p class="text-danger">Erro ao buscar agenda: ${data.error}</p>`;
                return;
            }

            if (data.agenda.length === 0) {
                agendaContainer.innerHTML = '<p class="lead text-warning">🎉 Agenda vazia para esta data!</p>';
            } else {
                data.agenda.forEach(item => {
                    agendaContainer.appendChild(criarCardAgendamento(item));
                });
            }
            
            totalSpan.textContent = data.agenda.length;

        } catch (error) {
            console.error('Erro de rede/servidor:', error);
            agendaContainer.innerHTML = '<p class="text-danger">Falha de conexão com o servidor.</p>';
        }
    }
    

    // FUNÇÃO PARA CRIAR O CARD VISUAL

    function criarCardAgendamento(item) {
        const cardCol = document.createElement('div');
        cardCol.className = 'col-lg-4 col-md-6 mb-4'; 
        
        const cardHtml = `
            <div class="card h-100 p-3 shadow-sm agendamento-card-admin">
                <div class="card-body">
                    <h5 class="card-title fw-bold">${item.inicio} - ${item.fim}</h5>
                    <p class="card-text mb-1">
                        👤 Cliente: ${item.cliente} (${item.telefone})
                    </p>
                    <p class="card-text">
                        ✂️ Serviço: ${item.servico} (${item.duracao} min)
                    </p>
                    <span class="badge bg-success">${item.status}</span>
                </div>
            </div>
        `;
        cardCol.innerHTML = cardHtml;
        return cardCol;
    }

    // Iniciar a primeira busca ao carregar a página
    buscarAgenda();
});