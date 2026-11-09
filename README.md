<p align="center">
  <img src="./assets/images/icon.png" width="120" alt="Ícone do LearnHub">
</p>

<h1 align="center">LearnHub</h1>

<p align="center">
  Uma plataforma mobile que aproxima escolas e colaboradores para transformar necessidades reais em projetos, parcerias e impacto na comunidade.
</p>

<p align="center">
  <img alt="Expo SDK 58" src="https://img.shields.io/badge/Expo_SDK-58-000020?style=for-the-badge&logo=expo&logoColor=white">
  <img alt="React Native 0.88" src="https://img.shields.io/badge/React_Native-0.88-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img alt="Node.js 22" src="https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white">
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-Hospedado-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
</p>

<p align="center">
  <a href="#-sobre-o-projeto">Sobre</a>&nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#-funcionalidades">Funcionalidades</a>&nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#-arquitetura">Arquitetura</a>&nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#-instalação">Instalação</a>&nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#-comandos">Comandos</a>&nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#-api">API</a>
</p>

---

## 💡 Sobre o projeto

O **LearnHub** é um aplicativo de colaboração educacional. Diretores publicam projetos e informam as categorias de apoio necessárias; colaboradores encontram oportunidades, enviam solicitações e acompanham toda a parceria pelo aplicativo.

A solução inclui autenticação, CRUD completo de projetos, chat privado, notificações, moderação, progressão por XP e certificados. Os dados são persistidos em um MySQL hospedado por meio de uma API Express, sem expor o banco diretamente ao aplicativo.

```text
Expo Go / aplicativo
        ↓ HTTPS
API REST — Node.js + Express
        ↓ conexão autenticada com TLS em hospedagem
MySQL hospedado
```

## ✅ Status do projeto

- [x] Cadastro, login e sessão persistente
- [x] CRUD completo de usuários e projetos
- [x] Favoritos, apoios e comentários
- [x] Solicitações de colaboração
- [x] Chat privado após aceite
- [x] Encerramento bilateral da colaboração
- [x] XP, níveis e certificados
- [x] Notificações e moderação
- [x] API e MySQL hospedados
- [x] Inicialização simplificada para computadores escolares
- [x] Compatibilidade com Expo SDK 58

## ✨ Funcionalidades

### Para diretores e escolas

- Criar, consultar, editar e excluir os próprios projetos;
- selecionar as categorias de ajuda necessárias;
- acompanhar favoritos, apoios e comentários;
- receber, aceitar ou recusar solicitações com justificativa;
- conversar com o colaborador após o aceite;
- confirmar a conclusão e emitir certificados.

### Para colaboradores

- Explorar e pesquisar projetos publicados;
- favoritar, apoiar e comentar;
- enviar solicitações de colaboração por categoria;
- acompanhar o estado de cada solicitação;
- usar o chat privado das parcerias aceitas;
- acumular XP, subir de nível e consultar certificados.

### Para administradores

- Visualizar indicadores de usuários, projetos e interações;
- consultar projetos cadastrados;
- excluir conteúdo após confirmação;
- analisar denúncias na fila de moderação;
- manter o cadastro público protegido contra criação de administradores.

### Recursos gerais

- Tema claro e escuro;
- perfil editável e exclusão da própria conta;
- senhas protegidas com hash bcrypt;
- notificações de solicitações, mensagens e certificados;
- diagnóstico de API e banco pelo endpoint `/api/health`;
- funcionamento por túnel ou rede local no Expo Go.

## 🧱 Arquitetura

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Aplicativo | Expo SDK 58, React Native 0.88 e TypeScript | Interface, navegação e consumo da API |
| API | Node.js e Express | Regras de negócio, autenticação e endpoints REST |
| Banco | MySQL | Persistência de usuários, projetos e interações |
| Autenticação | JWT e bcrypt | Sessões autenticadas e proteção de senhas |
| Hospedagem | Render e MySQL gerenciado | API e banco disponíveis pela internet |

O aplicativo resolve a API nesta ordem:

1. `EXPO_PUBLIC_API_URL`, quando definida;
2. `expo.extra.apiUrl` no `app.json`;
3. endereço do computador detectado pelo Metro em desenvolvimento local;
4. `http://localhost:3000` na versão web.

## 📁 Estrutura do projeto

```text
LearnHub/
├── App.tsx                       # entrada e navegação principal
├── app.json                      # configuração do Expo e URL hospedada
├── assets/                       # ícones e imagens do aplicativo
├── src/
│   ├── components/               # componentes compartilhados
│   ├── config/                   # resolução da URL da API
│   ├── navigation/               # abas, drawer e stacks
│   ├── screens/                  # telas do aplicativo
│   ├── services/                 # autenticação e clientes HTTP
│   └── theme/                    # temas claro e escuro
├── backend/
│   ├── scripts/                  # provisionamento administrativo
│   ├── src/
│   │   ├── config/               # ambiente, banco e schema
│   │   ├── controllers/          # entrada das requisições
│   │   ├── middleware/           # autenticação e erros
│   │   ├── repositories/         # acesso ao MySQL
│   │   ├── routes/               # rotas REST
│   │   └── services/             # regras de negócio
│   └── tests/                    # testes locais e hospedados
├── database/database.sql         # estrutura SQL reproduzível
├── scripts/start.js              # inicializador completo
├── scripts/diagnose.js           # diagnóstico do ambiente
└── INICIAR_LEARNHUB.cmd          # atalho para Windows
```

## 💻 Pré-requisitos

Antes de começar, verifique se você possui:

- **Node.js 22.13 ou superior**;
- **npm**;
- **Expo Go atualizado** no celular;
- conexão com a internet para acessar a API e o banco hospedados.

> O MySQL local é opcional. Para usar o ambiente hospedado, não é necessário instalar banco de dados nem copiar credenciais para a máquina.

## 🚀 Instalação

Clone o repositório e instale as dependências:

```powershell
git clone https://github.com/rafaboss1214/LearnHub.git
cd LearnHub
npm install
```

O projeto usa npm workspaces. Um único `npm install` prepara o aplicativo e o backend.

### Início rápido no Windows

Dê dois cliques em:

```text
INICIAR_LEARNHUB.cmd
```

Ou execute no Prompt de Comando/PowerShell:

```powershell
npm start
```

O inicializador:

1. verifica a API hospedada e a conexão com o banco;
2. inicia o Metro na porta `8081`;
3. abre o túnel compatível do Expo;
4. valida o manifesto público;
5. exibe o QR Code e a mensagem **LEARNHUB PRONTO**.

Abra o Expo Go e leia o QR Code mostrado no terminal.

### Desenvolvimento em rede local

Com o computador e o celular no mesmo Wi-Fi ou hotspot:

```powershell
npm run dev
```

Se a rede escolar impedir a comunicação entre dispositivos, use `npm start`, que abre o túnel, ou conecte ambos ao mesmo hotspot permitido pela instituição.

## ⚙️ Ambiente local opcional

Para trabalhar com uma API e um MySQL locais, copie o arquivo de exemplo:

```powershell
Copy-Item backend/.env.example backend/.env
```

Configure apenas o arquivo local `backend/.env`:

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=learnhub
DB_SSL=false
DB_SSL_CA_BASE64=
JWT_SECRET=use-uma-frase-aleatoria-com-pelo-menos-32-caracteres
CORS_ORIGIN=*
```

Importe [database/database.sql](./database/database.sql) pelo MySQL Workbench, phpMyAdmin ou terminal e inicie:

```powershell
npm run dev:local
```

> Nunca envie arquivos `.env`, senhas, tokens ou credenciais do banco para o Git. O repositório já ignora essas configurações locais.

## ☕ Comandos

| Comando | Descrição |
|---|---|
| `npm start` | Verifica a API/banco e inicia o Expo por túnel |
| `npm run dev` | Inicia o Expo pela rede local usando a API hospedada |
| `npm run dev:local` | Inicia aplicativo e backend locais |
| `npm run backend` | Inicia somente a API Express |
| `npm run app` | Inicia somente o Expo em LAN |
| `npm run diagnose` | Verifica Node, rede, API, banco e portas |
| `npm run typecheck` | Valida os tipos TypeScript |
| `npm run lint` | Executa o ESLint |
| `npm test` | Executa os testes isolados do backend |
| `npm run test:auth` | Testa autenticação em um MySQL configurado |
| `npm run test:hosted` | Testa o CRUD contra a API hospedada |
| `npm run test:hosted:community` | Testa o fluxo hospedado de colaboração |
| `npm run admin:create` | Cria uma conta administrativa com variáveis locais |

`npm run escola`, `npm run start:tunnel` e `npm run dev:tunnel` continuam disponíveis como aliases do modo túnel.

## 🔌 API

### Autenticação e perfil

| Método | Rota | Ação |
|---|---|---|
| `POST` | `/api/auth/register` | Cadastra diretor ou colaborador |
| `POST` | `/api/auth/login` | Autentica e retorna a sessão |
| `GET` | `/api/auth/me` | Consulta o usuário autenticado |
| `PUT` | `/api/auth/me` | Atualiza nome, e-mail ou senha |
| `DELETE` | `/api/auth/me` | Exclui a própria conta |

### Projetos e interações

| Método | Rota | Ação |
|---|---|---|
| `GET/POST` | `/api/projects` | Lista ou cria projetos |
| `GET/PUT/DELETE` | `/api/projects/:id` | Consulta, edita ou exclui um projeto |
| `POST` | `/api/projects/:id/favorite` | Alterna o favorito |
| `POST` | `/api/projects/:id/support` | Alterna o apoio |
| `POST` | `/api/projects/:id/comments` | Adiciona comentário |
| `DELETE` | `/api/projects/comments/:id` | Exclui comentário autorizado |
| `POST` | `/api/projects/:id/reports` | Envia uma denúncia |

### Colaborações e comunidade

| Método | Rota | Ação |
|---|---|---|
| `POST` | `/api/projects/:id/requests` | Solicita colaboração |
| `GET` | `/api/collaborations` | Lista solicitações enviadas/recebidas |
| `PUT` | `/api/collaborations/:id` | Aceita ou recusa uma solicitação |
| `POST` | `/api/collaborations/:id/closure` | Gerencia o encerramento bilateral |
| `GET/POST` | `/api/collaborations/:id/messages` | Consulta ou envia mensagens |
| `PUT` | `/api/collaborations/:id/messages/read` | Marca mensagens como lidas |
| `GET` | `/api/conversations` | Lista conversas disponíveis |
| `POST` | `/api/collaborations/:id/certificate` | Emite certificado de conclusão |
| `GET` | `/api/certificates/:code` | Consulta certificado autorizado |
| `GET` | `/api/progress` | Retorna XP, nível e certificados |
| `GET` | `/api/notifications` | Retorna notificações e contadores |

### Administração e diagnóstico

| Método | Rota | Ação |
|---|---|---|
| `GET` | `/api/health` | Informa o estado da API e do MySQL |
| `GET` | `/api/admin/dashboard` | Retorna indicadores administrativos |
| `GET` | `/api/admin/moderation/dashboard` | Retorna indicadores de moderação |
| `GET` | `/api/admin/moderation/reports` | Lista denúncias para moderação |
| `PUT` | `/api/admin/moderation/reports/:id` | Atualiza uma denúncia |

Resposta esperada de `/api/health`:

```json
{
  "success": true,
  "api": "online",
  "database": "connected"
}
```

## 🧪 Qualidade e testes

Antes de enviar alterações, execute:

```powershell
npm run typecheck
npm run lint
npm test
npx expo-doctor@latest
```

A suíte local usa repositórios isolados e não altera o banco hospedado. Os testes `test:hosted` e `test:hosted:community` criam dados temporários na API real e fazem a limpeza ao concluir.

## 🩺 Solução de problemas

### O aplicativo não inicia

```powershell
npm install
npm run diagnose
npm start
```

Confirme que está usando Node.js 22.13 ou superior e que o antivírus/firewall não bloqueou o Node.js.

### O QR Code não abre

- Atualize o Expo Go;
- leia o novo QR Code a cada reinício;
- tente `npm start` para usar o túnel;
- como alternativa, conecte celular e computador ao mesmo hotspot e rode `npm run dev`.

### Banco de dados indisponível

Abra o endpoint `/api/health`. Quando a API está online, mas o banco não responde, o endpoint retorna HTTP `503` com `database: "disconnected"`. Nesse caso, verifique o serviço MySQL hospedado e reinicie a API após a recuperação.

### Porta em uso

Se `/api/health` responder normalmente, a API provavelmente já está ativa. Caso contrário, execute `npm run diagnose` para identificar o processo e a porta afetada.

## 📫 Contribuindo

Para contribuir com o LearnHub:

1. Faça um fork deste repositório;
2. crie uma branch: `git checkout -b feature/minha-melhoria`;
3. implemente e valide a alteração;
4. faça o commit: `git commit -m "feat: minha melhoria"`;
5. envie a branch: `git push origin feature/minha-melhoria`;
6. abra um Pull Request descrevendo o que foi alterado.

---

<p align="center">
  Desenvolvido para aproximar educação, tecnologia e colaboração comunitária.
</p>

<p align="center">
  <sub>Estrutura inspirada no <a href="https://github.com/iuricode/readme-template">readme-template</a>.</sub>
</p>
