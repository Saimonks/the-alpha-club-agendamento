<h1>💈 The Alpha Club - Sistema de Agendamento Online</h1>
<p>Projeto Full-Stack (Backend/Frontend) para agendamento de barbearia.</p>

<hr>

<h2>🚀 Visão Geral do Projeto</h2>
<p>
Este é o backend e frontend de um sistema web completo de agendamento online para barbearias, desenvolvido para aprimorar a experiência de clientes e gerenciar eficientemente os horários dos barbeiros. 
</p>
<p>
O foco principal é na **segurança** (uso de **JWT** e **bcryptjs**) e na **modularidade** entre as camadas de apresentação, lógica e dados.
</p>

<hr>

<h2>🛠️ Tecnologias Utilizadas</h2>
<p>O projeto foi construído utilizando o ecossistema JavaScript (Node.js/Express) para o backend e tecnologias web padrão para o frontend.</p>

<table>
    <thead>
        <tr>
            <td>Camada</td>
            <td>Tecnologia</td>
            <td>Função</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Backend (API)</strong></td>
            <td>Node.js, Express.js</td>
            <td>Lógica de negócios e construção da API RESTful.</td>
        </tr>
        <tr>
            <td><strong>Banco de Dados</strong></td>
            <td>MySQL, node-mysql2</td>
            <td>Sistema de gerenciamento de dados relacional.</td>
        </tr>
        <tr>
            <td><strong>Segurança</strong></td>
            <td>bcryptjs, jsonwebtoken (JWT)</td>
            <td><span>Hash de senhas e autenticação via tokens.</span></td>
        </tr>
        <tr>
            <td><strong>Frontend</strong></td>
            <td>HTML5, JavaScript (Vanilla JS)</td>
            <td>Interface de usuário e interatividade.</td>
        </tr>
        <tr>
            <td><strong>Design/UI</strong></td>
            <td>Bootstrap 5</td>
            <td>Design responsivo e componentes de interface.</td>
        </tr>
    </tbody>
</table>

<hr>

<h2>✨ Funcionalidades Principais</h2>
<div>
    <p>O sistema atende a dois perfis principais de usuários:</p>
    <ul>
        <li><strong>Para Clientes:</strong> Autenticação Segura, Dashboard, Agendamento de Serviços, Gestão e Cancelamento de Agendamentos.</li>
        <li><strong>Para Administradores/Barbeiros:</strong> Gerenciamento de Serviços, Gerenciamento de Barbeiros, Gestão de Horários e Visualização de Agendamentos.</li>
    </ul>
</div>

<hr>

<h2>💾 Estrutura do Banco de Dados (MySQL)</h2>
<p>O <code>schema</code> relacional estabelece as entidades e a integridade de dados através de Chaves Estrangeiras (FKs).</p>

<table>
    <thead>
        <tr>
            <td>Tabela</td>
            <td>Chave Primária (PK)</td>
            <td>Chaves Estrangeiras (FK)</td>
            <td>Função</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Cliente</strong></td>
            <td>id</td>
            <td>-</td>
            <td>Armazena credenciais e dados de contato.</td>
        </tr>
        <tr>
            <td><strong>Servico</strong></td>
            <td>id</td>
            <td>-</td>
            <td>Define nome, preço e duração.</td>
        </tr>
        <tr>
            <td><strong>Barbeiro</strong></td>
            <td>id</td>
            <td>-</td>
            <td>Armazena perfis dos prestadores de serviço.</td>
        </tr>
        <tr>
            <td><strong>Agendamento</strong></td>
            <td>id</td>
            <td>cliente_id, servico_id, barbeiro_id</td>
            <td><span>Registro central que liga cliente, serviço e barbeiro.</span></td>
        </tr>
    </tbody>
</table>

<hr>

<h2>📁 Estrutura do Projeto</h2>
<p>O projeto segue a seguinte estrutura modular:</p>
<pre>
the-alpha-club/
├── node_modules/             
├── public/                   // Arquivos estáticos do Frontend
│   ├── css/                  
│   ├── js/                   
│   └── index.html            // Página inicial
├── .env                      // Variáveis de ambiente (IGNORAR NO GIT!)
├── package.json              
├── server.js                 // Ponto de Entrada do Backend (Express)
├── authMiddleware.js         // Middleware de autenticação JWT
└── db.js                     // Lógica de Conexão MySQL
</pre>

<hr>

<h2>▶️ Como Executar</h2>
<div>
    <ol>
        <li><strong>Pré-requisitos:</strong></li>
        <p><span>Certifique-se de ter Node.js e MySQL instalados.</span></p> 
        <li><strong>Configuração e Instalação:</strong></li>
        <pre><code>git clone (https://github.com/Saimonks/the-alpha-club-agendamento)</code></pre>
        <pre><code>cd the-alpha-club</code></pre>
        <pre><code>npm install</code></pre>
        <li><strong>Configuração do Banco de Dados:</strong></li>
        <p><span>Crie o banco de dados e as tabelas usando o <code>schema</code> SQL.</span></p>
        <li><strong>Variáveis de Ambiente:</strong></li>
        <p><span>Crie o arquivo <code>.env</code> com as credenciais do DB e a chave secreta JWT.</span></p>
        <li><strong>Inicie o servidor:</strong></li>
        <pre><code>npm start</code></pre>
        <p><small>O servidor estará rodando em <code>http://localhost:3000</code>.</small></p>
    </ol>
</div>

<hr>

<h2>👥 Autoria</h2>
<div>
    <ul>
        <li><span>DANILO JOSÉ NUNES PEREIRA</span></li>
        <li><span>GABRIEL VASCONCELOS DA SILVA</span></li>
        <li><span>JOSÉ MURILO ARAÚJO BRITO</span></li>
        <li><span>LUIZ FERNANDO SILVA ESPÍRITO SANTO</span></li>
        <li><span>RYAN ÁDRIAN GOMES LEITE</span></li>
        <li><span>SAIMON RUAN ALVES MOREIRA</span></li>
        <li><span>VICTOR GABRIEL BARRETO ALVES</span></li>
    </ul>
</div>

<footer>
    <p><strong>Orientação:</strong> Professor LUIZ FELIPE CIRQUEIRA DOS SANTOS</p>
</footer>
