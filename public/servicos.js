document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('servicos-container');

    
    async function carregarServicos() {
        try {
            const response = await fetch('/api/servicos');
            const servicos = await response.json();

            container.innerHTML = '<h2>Escolha seu serviço e agende</h2>'; 
            
            servicos.forEach(servico => {
                const card = document.createElement('div');
                card.className = 'servico-card'; // Para estilizar no CSS
                card.innerHTML = `
                    <h3>${servico.nome}</h3>
                    <p>${servico.duracao_minutos} minutos</p>
                    <p class="preco">R$ ${parseFloat(servico.preco).toFixed(2).replace('.', ',')}</p>
                    <button class="btn-agendar" data-servico-id="${servico.id_servico}">
                        Agendar
                    </button>
                `;
                container.appendChild(card);
            });

        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
            container.innerHTML = '<h2>Erro ao conectar com o servidor. Tente novamente.</h2>';
        }
    }

    carregarServicos();

    // *Futuro: Adicionar evento de clique nos botões Agendar*
});