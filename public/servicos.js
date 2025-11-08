document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('servicos-container');
    
    async function carregarServicos() {
        try {
            const response = await fetch('/api/servicos');
            const servicos = await response.json();

            container.innerHTML = '';
            
            servicos.forEach(servico => {
                const colDiv = document.createElement('div');
                colDiv.className = 'col-lg-4 col-md-6 mb-4';

                const card = document.createElement('div');
                card.className = 'card h-100 text-center servico-card-custom'; 
                card.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">${servico.nome}</h5>
                        <p class="card-text text-muted">${servico.duracao_minutos} minutos</p>
                        <p class="h4 fw-bold mb-3">R$ ${parseFloat(servico.preco).toFixed(2).replace('.', ',')}</p>
                        <button class="btn btn-dark btn-agendar" data-servico-id="${servico.id_servico}">
                            Agendar
                        </button>
                    </div>
                `;
                
                colDiv.appendChild(card);
                container.appendChild(colDiv); 
            });

        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
            container.innerHTML = '<p class="text-danger">Erro ao conectar com o servidor ou processar dados.</p>';
        }
    }

    carregarServicos();

    // Adicionar evento de clique nos botões Agendar
    
});