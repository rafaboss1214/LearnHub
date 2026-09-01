# Hospedagem gratuita do LearnHub

Arquitetura preservada:

`Expo/React Native -> API Express no Render -> MySQL no Aiven`

## Banco MySQL — Aiven Free

1. Crie um serviço MySQL no plano Free.
2. Importe `database/database.sql` no banco remoto.
3. Copie host, porta, usuário, senha, nome do banco e certificado CA.
4. Converta o certificado CA para Base64 antes de cadastrá-lo como segredo na API.

## API Node.js — Render Free

Conecte este repositório usando o arquivo `render.yaml`. O serviço usa:

- diretório de trabalho: raiz do repositório;
- comando de build: `npm ci`;
- comando de execução: `npm run backend`;
- health check: `/api/health`;
- porta HTTP: valor fornecido pela variável `PORT` do Render.

Variáveis secretas:

```text
DB_HOST=<host do Aiven>
DB_PORT=<porta do Aiven>
DB_USER=<usuário do Aiven>
DB_PASSWORD=<senha do Aiven>
DB_NAME=<database do Aiven>
DB_SSL=true
DB_SSL_CA_BASE64=<certificado CA convertido para Base64>
JWT_SECRET=<frase aleatória com pelo menos 32 caracteres>
CORS_ORIGIN=*
```

Depois do deploy, teste `https://ENDERECO-DA-API/api/health`. A resposta deve indicar `database: "connected"`.

## Aplicativo

Inicie o Expo informando o endereço permanente da API:

```powershell
$env:EXPO_PUBLIC_API_URL="https://ENDERECO-DA-API"
npx expo start --tunnel
```

Nenhuma rota ou tela muda. Apenas o endereço da API deixa de ser temporário.
