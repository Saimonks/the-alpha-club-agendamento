// Variáveis do DOM do Modal
const dataInput = document.getElementById('data-escolhida');
const horariosContainer = document.getElementById('horarios-lista');
const formAgendamentoFinal = document.getElementById('form-agendamento-final');
const btnConfirmar = document.getElementById('btn-confirmar-agendamento');
const nomeClienteInput = document.getElementById('nome-cliente'); // Campo Nome
const telefoneClienteInput = document.getElementById('tel-cliente'); // Campo Telefone

let horarioSelecionado = null; // Armazena o horário selecionado pelo usuário
let userIdLogado = null; // Armazena o ID do cliente logado

// ====================================================================
// 1. LÓGICA DE SEGURANÇA E PRÉ-PREENCHIMENTO
// ====================================================================

/**
 * Busca os dados do cliente logado e pré-preenche os campos do modal.
 */
async function carregarDadosCliente() {
    // Tenta obter o ID do LocalStorage (definido na página de login)
    const userId = localStorage.getItem('alphaUserId');
    userIdLogado = parseInt(userId);

    // Se o usuário não estiver logado, retornamos (a página servicos.html deve redirecionar)
    if (!userIdLogado) {
        return; 
    }

    try {
        // Chama a API de detalhes do cliente que você acabou de validar
        const response = await fetch(`/api/cliente/detalhes?userId=${userIdLogado}`);
        const dadosCliente = await response.json();

        if (response.ok) {
            // 1. Pré-preenche os campos
            if (nomeClienteInput) {
                nomeClienteInput.value = dadosCliente.nome || '';
                nomeClienteInput.readOnly = true; // 2. Bloqueia para edição
            }
            if (telefoneClienteInput) {
                telefoneClienteInput.value = dadosCliente.telefone || '';
                telefoneClienteInput.readOnly = true; // 2. Bloqueia para edição
            }
        } else {
            console.error('Erro ao buscar dados do cliente:', dadosCliente.error);
        }
    } catch (error) {
        console.error('Falha na API de detalhes do cliente:', error);
    }
}


// ====================================================================
// A. BUSCA DE HORÁRIOS DISPONÍVEIS
// ====================================================================

dataInput.addEventListener('change', buscarHorariosDisponiveis); 
dataInput.addEventListener('change', () => { horarioSelecionado = null; }); 


async function buscarHorariosDisponiveis() {
    const dataSelecionada = dataInput.value; 
    
    // 💡 CHAVE: Usa a variável global do carrinho para a duração
    // 'window.duracaoTotalCarrinho' deve ser definida em carrinho.js
    if (window.duracaoTotalCarrinho === 0 || !dataSelecionada) {
        horariosContainer.innerHTML = '<p class="text-warning">Selecione data e serviços.</p>';
        btnConfirmar.disabled = true;
        return;
    }

    horariosContainer.innerHTML = '<p>Buscando horários...</p>';
    
    // Monta a URL com a duração total
    const url = `/api/horarios-disponiveis?data=${dataSelecionada}&duracao=${window.duracaoTotalCarrinho}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Falha ao buscar horários.');
        
        const data = await response.json();
        renderizarHorarios(data.horarios);

    } catch (error) {
        console.error('Erro ao carregar horários:', error);
        horariosContainer.innerHTML = '<p class="text-danger">Erro ao carregar horários disponíveis.</p>';
    }
}


function renderizarHorarios(horarios) {
    horariosContainer.innerHTML = ''; 
    horarioSelecionado = null; 
    formAgendamentoFinal.style.display = 'none'; // Esconde o form final
    btnConfirmar.disabled = true;

    if (horarios.length === 0) {
        horariosContainer.innerHTML = '<p>Nenhum horário disponível.</p>';
        return;
    }

    horarios.forEach(horario => {
        const botao = document.createElement('button');
        botao.className = 'btn btn-outline-primary m-1 slot-horario'; 
        botao.innerText = horario;
        botao.onclick = () => selecionarHorario(horario, botao);
        horariosContainer.appendChild(botao);
    });
}


function selecionarHorario(horario, botao) {
    // Limpa a classe de todos os botões
    document.querySelectorAll('.slot-horario').forEach(btn => {
        btn.classList.remove('active');
    });

    // Marca o botão selecionado
    botao.classList.add('active');
    horarioSelecionado = horario;

    // 💡 MOSTRA O FORMULÁRIO FINAL E HABILITA O BOTÃO
    formAgendamentoFinal.style.display = 'block'; 
    btnConfirmar.disabled = false;
}

// ----------------------------------------------------
// B. ENVIO DO AGENDAMENTO (POST)
// ----------------------------------------------------

if (formAgendamentoFinal) {
    formAgendamentoFinal.addEventListener('submit', (e) => {
        e.preventDefault(); 
        confirmarAgendamento(); 
    });
}


async function confirmarAgendamento() {
    // 1. Validação de Sessão e Duração
    if (!userIdLogado) {
         alert('Por favor, faça login para completar o agendamento.');
         return;
    }
    if (!horarioSelecionado || window.duracaoTotalCarrinho <= 0) {
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
        userId: userIdLogado, // ⬅️ CHAVE FINAL DE SEGURANÇA (ID DO CLIENTE LOGADO)
        dataHoraInicio: dataHoraInicio,
        servicosSelecionados: servicosParaBackend,
    };
    
    btnConfirmar.disabled = true; // Desabilita o botão

    // 3. Enviar a Requisição POST
    try {
        const response = await fetch('/api/agendamentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAgendamento)
        });

        if (response.status === 201) {
            alert('Agendamento confirmado com sucesso!');
            
            // Lógica de Limpeza (assumindo que existe no carrinho.js)
            if (typeof limparCarrinho === 'function') {
                limparCarrinho(); 
            }
            
            // Fechar modal
            const modalElement = document.getElementById('agendamentoModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide(); 
            
        } else {
            const erro = await response.json();
            alert(`Falha no agendamento: ${erro.error || 'Erro desconhecido.'}`);
        }

    } catch (error) {
        console.error('Erro de rede/servidor:', error);
        alert('Erro de conexão com o servidor. Tente novamente mais tarde.');
    } finally {
        btnConfirmar.disabled = false; // Reabilita o botão
    }
}


// ====================================================================
// 3. INICIALIZAÇÃO E CHAMADA DOS DADOS DO CLIENTE
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 💡 Chama a função de pré-preenchimento e verificação de login
    carregarDadosCliente(); 
});