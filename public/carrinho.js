// Armazena os serviços selecionados
window.carrinho = [];

window.duracaoTotalCarrinho = 0; 

// Elementos do DOM
const carrinhoContainer = document.getElementById('carrinho-servicos');
const carrinhoItensLista = document.getElementById('carrinho-itens');
const carrinhoTotalSpan = document.getElementById('carrinho-total');
const btnAgendar = document.getElementById('btn-abrir-agendamento');
const servicosContainer = document.getElementById('servicos-container');

// FUNÇÃO DE RECALCULAR COM DURAÇÃO
function recalcularDuracao() {
    // Recalcula a Duração Total
    window.duracaoTotalCarrinho = carrinho.reduce((total, item) => {
        // Garantir que a duração existe e é um número
        return total + (parseInt(item.duracao_minutos) || 0); 
    }, 0);

    // NOTIFICAR O MODAL DE AGENDAMENTO
    // Se o modal estiver aberto, ele precisa de novos horários
    if (typeof buscarHorariosDisponiveis === 'function') {
        buscarHorariosDisponiveis();
    }
}

// Função principal para atualizar a interface (Carrinho)
function atualizarInterfaceCarrinho() {
    carrinhoItensLista.innerHTML = '';
    let total = 0;

    if (carrinho.length === 0) {
        carrinhoContainer.style.display = 'none';
        btnAgendar.disabled = true;
        recalcularDuracao();
        return;
    }

    carrinhoContainer.style.display = 'block';

    carrinho.forEach((item, index) => {
        total += parseFloat(item.preco);

        const itemElement = document.createElement('div');
        itemElement.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        itemElement.innerHTML = `
            <div>
                <h6 class="mb-0">${item.nome}</h6>
                <small class="text-muted">R$ ${parseFloat(item.preco).toFixed(2).replace('.', ',')} (${item.duracao_minutos} min)</small>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger btn-remover-carrinho" data-index="${index}">
                Remover
            </button>
        `;
        carrinhoItensLista.appendChild(itemElement);
    });

    carrinhoTotalSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    btnAgendar.disabled = false;
    
    // CHAMAR RECALCULAR DURAÇÃO APÓS A INTERFACE
    recalcularDuracao(); 
}


// Função para adicionar um serviço ao carrinho
function adicionarAoCarrinho(servico) {
    if (!servico.duracao_minutos) {
        console.error("Erro: O serviço precisa da propriedade 'duracao_minutos'.");
        alert("Erro: Serviço faltando informação de duração.");
        return;
    }
    
    const servicoExistente = carrinho.find(item => item.id === servico.id);

    if (servicoExistente) {
        alert(`O serviço "${servico.nome}" já foi adicionado ao carrinho.`);
        return;
    }
    
    carrinho.push(servico);
    atualizarInterfaceCarrinho();
}

// Função para remover um serviço do carrinho
function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarInterfaceCarrinho();
}

function limparCarrinho() {
    carrinho = []; // Esvazia o array principal
    atualizarInterfaceCarrinho(); // Redesenha o carrinho na tela (ele vai sumir)
}


// Event Listener para lidar com todos os cliques
document.addEventListener('click', (event) => {
    // Lógica para o botão "Adicionar" no card de serviço
    if (event.target.classList.contains('btn-adicionar-carrinho')) {
        const btn = event.target;
        const servico = {
            id: btn.dataset.servicoId,
            nome: btn.dataset.servicoNome,
            preco: btn.dataset.servicoPreco,
            duracao_minutos: parseInt(btn.dataset.servicoDuracao)
        };
        adicionarAoCarrinho(servico);
    }
    
    // Lógica para o botão "Remover" dentro do Carrinho
    if (event.target.classList.contains('btn-remover-carrinho')) {
        const index = event.target.dataset.index;
        removerDoCarrinho(index);
    }
});

// Inicialização
atualizarInterfaceCarrinho();