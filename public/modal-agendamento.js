// Variáveis do DOM do Modal
const dataInput = document.getElementById('data-escolhida');
const horariosContainer = document.getElementById('horarios-lista');
const btnConfirmar = document.getElementById('btn-confirmar-agendamento');
const agendamentoModalElement = document.getElementById('agendamentoModal'); // Referência ao elemento do modal
// Instância do modal Bootstrap
const agendamentoModalInstance = new bootstrap.Modal(agendamentoModalElement); 

let horarioSelecionado = null; // Armazena o horário selecionado pelo usuário
let userIdLogado = null; // Armazena o ID do cliente logado

// ====================================================================
// LÓGICA DE SEGURANÇA E INICIALIZAÇÃO DO USUÁRIO
// ====================================================================

/**
 * Busca o ID do cliente logado e define a data mínima para hoje no input de data.
 */
function inicializarModalAgendamento() {
    // Usa a chave 'alphaUserId' para o ID do cliente
    const userId = localStorage.getItem('alphaUserId');
    userIdLogado = parseInt(userId);

    // Define a data mínima do input date para hoje
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    dataInput.setAttribute('min', todayString);
}


// ====================================================================
// BUSCA DE HORÁRIOS DISPONÍVEIS
// ====================================================================

// Adiciona listeners para quando a data é alterada
dataInput.addEventListener('change', () => {
    horarioSelecionado = null; // Zera o horário selecionado ao mudar a data
    btnConfirmar.disabled = true; // Desabilita o botão ao mudar a data
    buscarHorariosDisponiveis();
});

/**
 * Busca os horários disponíveis na API com base na data e duração dos serviços.
 */
async function buscarHorariosDisponiveis() {
    // Verifica se o usuário está logado antes de chamar a API
    if (!userIdLogado) {
        alert('Por favor, faça login para verificar horários.');
        // Fecha o modal antes de redirecionar
        if (agendamentoModalInstance) agendamentoModalInstance.hide();
        window.location.href = 'login.html';
        return;
    }
    
    const dataSelecionada = dataInput.value; 
    
    // Verifica se a duração total do carrinho e a data estão definidas
    if (window.duracaoTotalCarrinho === undefined || window.duracaoTotalCarrinho === 0 || !dataSelecionada) {
        horariosContainer.innerHTML = '<p class="text-warning">Selecione uma data e adicione serviços ao carrinho para ver os horários.</p>';
        btnConfirmar.disabled = true; // Desabilita o botão se não houver duração/data
        return;
    }

    horariosContainer.innerHTML = '<p>Buscando horários...</p>';
    
    // Monta a URL com a duração total
    const url = `/api/horarios-disponiveis?data=${dataSelecionada}&duracao=${window.duracaoTotalCarrinho}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao buscar horários.');
        }
        
        const data = await response.json();
        renderizarHorarios(data.horarios);

    } catch (error) {
        console.error('Erro ao carregar horários:', error);
        horariosContainer.innerHTML = `<p class="text-danger">Erro: ${error.message}</p>`;
        btnConfirmar.disabled = true; // Desabilita o botão em caso de erro
    }
}

/**
 * Renderiza os botões de horário disponíveis.
 * @param {Array<string>} horarios - Lista de strings de horários (HH:MM).
 */
function renderizarHorarios(horarios) {
    horariosContainer.innerHTML = ''; 
    horarioSelecionado = null; 
    btnConfirmar.disabled = true; // Desabilita até um horário ser selecionado

    if (horarios.length === 0) {
        horariosContainer.innerHTML = '<p>Nenhum horário disponível para esta data e duração.</p>';
        return;
    }

    horarios.forEach(horario => {
        const botao = document.createElement('button');
        botao.className = 'btn btn-outline-dark m-1 slot-horario'; 
        botao.innerText = horario;
        botao.onclick = () => selecionarHorario(horario, botao);
        horariosContainer.appendChild(botao);
    });
}

/**
 * Marca o horário selecionado visualmente e armazena o valor.
 * @param {string} horario - Horário selecionado (HH:MM).
 * @param {HTMLElement} botao - O botão HTML clicado.
 */
function selecionarHorario(horario, botao) {
    // Limpa a classe de todos os botões e volta para outline-dark
    document.querySelectorAll('.slot-horario').forEach(btn => {
        btn.classList.remove('active', 'btn-dark'); 
        btn.classList.add('btn-outline-dark'); 
    });

    // Marca o botão selecionado
    botao.classList.remove('btn-outline-dark'); 
    botao.classList.add('active', 'btn-dark'); 
    horarioSelecionado = horario;

    // HABILITA O BOTÃO DE CONFIRMAR
    btnConfirmar.disabled = false;
}

// ----------------------------------------------------
// ENVIO DO AGENDAMENTO (POST)
// ----------------------------------------------------

// O evento agora será direto no botão de confirmar agendamento
btnConfirmar.addEventListener('click', confirmarAgendamento);

/**
 * Envia a requisição POST para o backend para confirmar o agendamento.
 */
async function confirmarAgendamento() {
    // 1. Validação de Sessão e Duração
    if (!userIdLogado) {
        alert('Por favor, faça login para completar o agendamento.');
        if (agendamentoModalInstance) agendamentoModalInstance.hide();
        window.location.href = 'login.html';
        return;
    }
    if (!horarioSelecionado || window.duracaoTotalCarrinho === undefined || window.duracaoTotalCarrinho <= 0) {
        alert('Selecione um horário e adicione um serviço ao carrinho.');
        return;
    }
    
    // 2. Coleta de Dados e Formatação
    const dataSelecionada = dataInput.value;
    const [hora, minuto] = horarioSelecionado.split(':'); 
    const dataHoraInicio = `${dataSelecionada}T${hora}:${minuto}:00`; 

    // Mapeia o carrinho (que é global) para o formato que o Backend espera
    const servicosParaBackend = window.carrinho.map(servico => ({ id: servico.id }));
    
    const dadosAgendamento = {
        dataHoraInicio: dataHoraInicio,
        servicosSelecionados: servicosParaBackend,
    };
    
    btnConfirmar.disabled = true; // Desabilita o botão para evitar cliques duplos

    // Obtém o token JWT do localStorage
    const token = localStorage.getItem('alphaToken'); 
    
    if (!token) {
        alert('Token de autenticação não encontrado. Por favor, faça login novamente.');
        if (agendamentoModalInstance) agendamentoModalInstance.hide();
        window.location.href = 'login.html';
        return;
    }

    // 3. Enviar a Requisição POST
    try {
        const response = await fetch('/api/agendamentos', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                // Envia o token no cabeçalho
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(dadosAgendamento)
        });

        if (response.status === 201) {
            alert('Agendamento confirmado com sucesso!');
            
            // Lógica de Limpeza
            if (typeof limparCarrinho === 'function') {
                limparCarrinho(); // Limpa o carrinho
            } else {
                // Alternativa de limpeza se 'limparCarrinho' não for global
                localStorage.removeItem('carrinhoServicos');
                const carrinhoItensContainer = document.getElementById('carrinho-itens');
                if (carrinhoItensContainer) carrinhoItensContainer.innerHTML = '<p class="text-muted">Seu carrinho está vazio.</p>';
                const carrinhoTotalSpan = document.getElementById('carrinho-total');
                if (carrinhoTotalSpan) carrinhoTotalSpan.textContent = 'R$ 0,00';
                const carrinhoSection = document.getElementById('carrinho-servicos');
                if (carrinhoSection) carrinhoSection.style.display = 'none';
                const btnAbrirAgendamento = document.getElementById('btn-abrir-agendamento');
                if (btnAbrirAgendamento) btnAbrirAgendamento.disabled = true;
            }
            
            // Fechar modal
            if (agendamentoModalInstance) agendamentoModalInstance.hide();
            
            // Recarrega a página para atualizar a UI
            window.location.reload(); 
            
        } else {
            const erro = await response.json();
            alert(`Falha no agendamento: ${erro.error || 'Erro desconhecido.'}`);
        }

    } catch (error) {
        console.error('Erro de rede/servidor ao confirmar agendamento:', error);
        alert('Erro de conexão com o servidor. Tente novamente mais tarde.');
    } finally {
        btnConfirmar.disabled = false; // Reabilita o botão
    }
}


// ====================================================================
// INICIALIZAÇÃO E EVENTOS DO MODAL
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    inicializarModalAgendamento(); 
});

// Listener para quando o modal de agendamento for exibido
agendamentoModalElement.addEventListener('show.bs.modal', () => {
    // Ao abrir o modal, resetamos o estado para garantir consistência
    horarioSelecionado = null;
    btnConfirmar.disabled = true;
    dataInput.value = ''; // Limpa a data selecionada
    horariosContainer.innerHTML = '<p class="text-warning">Selecione uma data para ver a agenda.</p>';
    
    // Garante que o userIdLogado esteja atualizado
    const userId = localStorage.getItem('alphaUserId');
    userIdLogado = parseInt(userId);

    // Tenta buscar horários imediatamente se o carrinho já estiver carregado e a data definida
    if (window.duracaoTotalCarrinho > 0 && dataInput.value) {
        buscarHorariosDisponiveis();
    }
});