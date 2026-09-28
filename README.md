# LearnHub — Expo Go + API hospedada + MySQL

O LearnHub usa autenticação e CRUD persistentes, com todos os dados importantes salvos no MySQL:

```text
Expo Go → API Express hospedada → MySQL hospedado
```

- Cadastro: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Sessão atual: `GET /api/auth/me`
- Projetos: criação, listagem, detalhes, edição e exclusão
- Interações: favoritos, apoios e comentários
- Perfil: consulta, edição e exclusão da própria conta
- Diagnóstico da API e do banco: `GET /api/health`
- Porta padrão da API: `3000`
- O backend escuta em `0.0.0.0`, portanto aceita conexões da rede local.

## Pré-requisitos

- Node.js 20.19 ou superior (requisito mínimo do Expo SDK 54)
- npm
- Expo Go atualizado no celular
- Internet disponível para acessar a API e o banco hospedados

O MySQL local é opcional e serve apenas para desenvolvimento avançado. Na máquina da escola, não é necessário instalar MySQL, copiar `.env` ou conhecer as credenciais do banco.

## Início rápido em outra máquina

1. Instale o Node.js 20.19 ou mais recente.
2. Copie ou clone a pasta completa do projeto.
3. Dê dois cliques em `INICIAR_LEARNHUB.cmd`.

O iniciador instala as dependências quando necessário, testa a API hospedada e tenta abrir um túnel para o Expo. Se a rede bloquear o túnel, ele muda automaticamente para LAN; nesse caso, conecte o computador e o celular ao mesmo Wi-Fi ou hotspot.

Também é possível usar o terminal:

```powershell
npm install
npm run escola
```

Para uma rede comum, sem túnel:

```powershell
npm run dev
```

## Estrutura relevante

```text
LearnHub/
├── app/                         # entrada e navegação Expo existentes
├── src/
│   ├── config/api.ts            # único local que resolve a URL da API
│   ├── screens/                 # telas existentes, preservadas
│   └── services/                # cliente HTTP e autenticação
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── database/database.sql
├── scripts/diagnose.js
└── package.json
```

## Passo 1 — instalar as dependências

Abra PowerShell ou Prompt de Comando na pasta raiz `LearnHub` e execute:

```powershell
npm install
```

O projeto usa npm workspaces. Esse único comando instala as dependências do Expo e do backend.

## Passo 2 — criar um banco SQL local (opcional)

O arquivo [database/database.sql](database/database.sql) cria as tabelas `usuarios`, `projetos`, `projetos_favoritos`, `projetos_apoios` e `comentarios` no banco selecionado. Ele pode ser executado várias vezes com segurança.

Ao iniciar, a API também executa uma migração idempotente: cria somente as tabelas ausentes e preserva os dados existentes. Isso mantém o banco hospedado alinhado com a versão do app.

### Opção A: MySQL Workbench

1. Inicie o serviço MySQL.
2. Abra o MySQL Workbench e conecte-se ao servidor local.
3. Abra `database/database.sql`.
4. Execute todo o script pelo ícone de raio.

### Opção B: phpMyAdmin

1. Abra o phpMyAdmin.
2. Entre na aba **Importar**.
3. Escolha `database/database.sql`.
4. Confirme a importação.

### Opção C: terminal MySQL no Windows

No Prompt de Comando (`cmd.exe`), a partir da raiz do projeto:

```cmd
mysql -u root -p < database\database.sql
```

No PowerShell:

```powershell
Get-Content database/database.sql | mysql -u root -p
```

Se o usuário `root` não tiver senha, pressione Enter quando solicitado. Se o comando `mysql` não for encontrado, use o caminho completo para `mysql.exe` ou prefira o Workbench/phpMyAdmin.

## Passo 3 — configurar o backend local (opcional)

Copie o exemplo:

```powershell
Copy-Item backend/.env.example backend/.env
```

Abra somente `backend/.env` e ajuste as credenciais do MySQL:

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=learnhub
JWT_SECRET=use-aqui-uma-frase-aleatoria-com-mais-de-32-caracteres
CORS_ORIGIN=*
```

O arquivo `backend/.env` está no `.gitignore`; não envie senha real ao Git. A API nunca imprime a senha no diagnóstico ou nos erros.

## Passo 4 — iniciar o projeto

Para usar a API e o banco hospedados, basta iniciar o Expo:

```powershell
npm run dev
```

O iniciador consulta `/api/health` antes de abrir o Expo. Se quiser desenvolver com banco local, use:

```powershell
npm run dev:local
```

Nesse modo, o terminal mantém os dois processos visíveis. O backend testa o MySQL antes de começar e mostra:

```text
====================================
API INICIADA COM SUCESSO
====================================
Porta: 3000
Local: http://localhost:3000
Rede: http://192.168.X.X:3000
Health: http://192.168.X.X:3000/api/health
Banco de dados: CONECTADO
====================================
```

O Expo inicia em LAN e exibe o QR Code. Para usar dois terminais separados:

```powershell
npm run backend
```

```powershell
npm run app
```

## Passo 5 — abrir no Expo Go

1. Deixe o computador e o celular na mesma rede.
2. Permita o acesso de rede privada quando o Firewall do Windows perguntar sobre Node.js.
3. Abra o Expo Go no celular.
4. Leia o QR Code exibido no terminal.

Não há IP fixo no app. Em LAN, `src/config/api.ts` lê `Constants.expoConfig.hostUri`, fornecido pelo Metro no Expo SDK 54, e usa esse mesmo computador na porta `3000`.

A ordem de resolução é:

1. `EXPO_PUBLIC_API_URL`, se configurada;
2. `expo.extra.apiUrl` do `app.json` (API hospedada padrão);
3. IPv4 do host do Metro/Expo em LAN, somente se não houver API hospedada;
4. `http://localhost:3000` somente na versão web.

## Passo 6 — testar o cadastro

1. No Expo Go, toque em **Cadastre-se**.
2. Preencha nome, e-mail, senha e confirmação.
3. Escolha **Colaborador** ou **Diretor**.
4. Toque em **Cadastrar**.
5. O app deve mostrar **Conta criada com sucesso**.

O e-mail é normalizado e único. A senha é transformada em hash bcrypt antes de chegar à coluna `senha`.

## Passo 7 — testar o login

1. Volte à tela de login.
2. Informe o mesmo e-mail e senha.
3. Toque em **Acessar Plataforma**.
4. O app valida as credenciais no MySQL e mantém o redirecionamento original para `Principal`.

Senha errada e usuário inexistente retornam a mesma mensagem amigável: **E-mail ou senha incorretos.**

## Testar `/api/health`

Com o backend ativo, abra no navegador do computador:

```text
http://localhost:3000/api/health
```

Resposta esperada:

```json
{
  "success": true,
  "api": "online",
  "database": "connected"
}
```

No celular, use a URL de rede impressa pelo backend, por exemplo:

```text
http://192.168.0.25:3000/api/health
```

Se a API estiver online mas o banco estiver indisponível, o endpoint retorna HTTP `503` com `database: "disconnected"`.

## Provar que o cadastro foi salvo no SQL

Execute no MySQL Workbench, phpMyAdmin ou terminal:

```sql
USE learnhub;

SELECT
  id,
  nome,
  email,
  tipo_usuario,
  created_at,
  CHAR_LENGTH(senha) AS tamanho_do_hash,
  LEFT(senha, 7) AS inicio_do_hash
FROM usuarios
ORDER BY id DESC;
```

O registro recém-criado deve aparecer. A coluna `senha` terá um hash bcrypt, normalmente iniciado por `$2b$`, e nunca a senha digitada.

## Testes automatizados

Testes locais de validação, descoberta de rede e fluxo HTTP completo com repositório isolado, sem exigir MySQL:

```powershell
npm test
```

Com MySQL importado e backend em execução, rode em outro terminal:

```powershell
npm run test:auth
```

O teste real de autenticação cobre:

- `GET /api/health`;
- cadastro válido (`201`);
- persistência no MySQL e hash bcrypt;
- e-mail repetido (`409`);
- login correto (`200`);
- senha errada (`401`);
- usuário inexistente (`401`);
- sessão autenticada (`GET /api/auth/me`).

Por padrão, o usuário automático é removido ao fim do teste. Para mantê-lo temporariamente no banco e inspecioná-lo:

```powershell
$env:TEST_KEEP_USER=1; npm run test:auth
```

## Diagnóstico no computador da escola

Execute:

```powershell
npm run diagnose
```

O comando verifica e exibe:

- versão do Node.js;
- presença das dependências do Expo;
- a API hospedada definida pelo `.env` ou pelo `app.json` e a conexão do banco;
- presença de `backend/.env`;
- IPv4 local e adaptador escolhido;
- porta `3000` livre ou em uso;
- host, porta, usuário e nome do banco, sem revelar a senha;
- resposta do MySQL;
- resposta HTTP de `/api/health`.

Se a porta estiver **em uso** e `/api/health` responder `200`, isso é normal: o backend já está ativo.

## Se aparecer “Não foi possível conectar ao servidor”

Confira nesta ordem:

1. O terminal do backend mostra **Banco de dados: CONECTADO**?
2. `http://localhost:3000/api/health` funciona no computador?
3. A URL de rede impressa, como `http://192.168.X.X:3000/api/health`, abre no navegador do celular?
4. Celular e computador estão na mesma rede, sem VPN ativa?
5. O Firewall do Windows permitiu Node.js em **redes privadas**?
6. A rede da escola isola um dispositivo do outro?
7. Rode `npm run diagnose` e observe IP, porta, MySQL e health.

O erro de rede do `fetch` não é mostrado diretamente ao usuário; o app exibe orientação para verificar backend e rede. As requisições expiram após 10 segundos.

## Firewall e redes escolares

- Quando o Windows solicitar acesso para Node.js, marque **Redes privadas** e permita.
- Computador e celular precisam conseguir se comunicar diretamente para acessar uma API local por LAN.
- Algumas redes escolares usam isolamento de clientes: mesmo no mesmo Wi-Fi, o celular não consegue abrir o IP do computador.
- A alternativa mais simples é conectar computador e celular ao mesmo hotspot pessoal, quando a escola permitir.
- Outra alternativa é publicar temporariamente a porta `3000` com um túnel HTTP/HTTPS confiável (por exemplo, Cloudflare Tunnel ou ngrok), copiar `.env.example` para `.env.local` e definir a URL pública:

```dotenv
EXPO_PUBLIC_API_URL=https://url-publica-do-tunel.example
```

Depois, reinicie/recarregue completamente o Expo Go. Nunca exponha o MySQL diretamente; o túnel deve apontar somente para a API Express na porta `3000`.

## Expo em modo túnel

Se o QR/Metro em LAN for bloqueado:

```powershell
npm run start:tunnel
```

Ou use o comando equivalente que explicita o ambiente completo:

```powershell
npm run dev:tunnel
```

Esses comandos usam o Cloudflare Quick Tunnel para publicar o Metro. O executável é procurado em `tools/cloudflared.exe` no Windows, em `tools/cloudflared` nos outros sistemas ou no caminho definido por `CLOUDFLARED_PATH`. Se ele não existir, o iniciador baixa uma versão oficial fixada para a pasta local `tools`. Se o download ou o túnel for bloqueado pela rede escolar, o app continua automaticamente em LAN.

O túnel do Metro não precisa publicar o banco nem a API, pois o endereço hospedado já está no `app.json`. No modo opcional `dev:local`, o script também publica a porta `3000` por um segundo túnel quando necessário.

## Rotas da API

| Método | Rota | Resultado principal |
|---|---|---|
| `GET` | `/api/health` | Estado da API e do MySQL |
| `POST` | `/api/auth/register` | Cria usuário com hash bcrypt |
| `POST` | `/api/auth/login` | Valida e-mail/senha e retorna sessão |
| `GET` | `/api/auth/me` | Retorna o usuário da sessão JWT |
| `PUT` | `/api/auth/me` | Atualiza nome, e-mail ou senha da sessão |
| `DELETE` | `/api/auth/me` | Exclui a própria conta |
| `GET` | `/api/projects` | Lista projetos e contadores |
| `POST` | `/api/projects` | Cria projeto (diretor) |
| `GET` | `/api/projects/:id` | Retorna detalhes e comentários |
| `PUT` | `/api/projects/:id` | Edita projeto (diretor) |
| `DELETE` | `/api/projects/:id` | Exclui projeto (diretor) |
| `POST` | `/api/projects/:id/favorite` | Alterna favorito |
| `POST` | `/api/projects/:id/support` | Alterna apoio |
| `POST` | `/api/projects/:id/comments` | Adiciona comentário |
| `DELETE` | `/api/projects/comments/:id` | Exclui comentário autorizado |

## Checklist antes de apresentar

- [ ] Node.js 20.19 ou superior instalado
- [ ] `npm install` executado
- [ ] `npm run diagnose` confirma API e banco conectados
- [ ] `/api/health` funcionando
- [ ] Expo iniciado
- [ ] QR Code aparecendo
- [ ] Celular e PC na mesma rede
- [ ] Cadastro testado
- [ ] Usuário apareceu no banco
- [ ] Login testado
- [ ] Login redirecionou corretamente
