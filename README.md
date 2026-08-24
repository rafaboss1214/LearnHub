# LearnHub

## Executar localmente

1. Instale as dependências: `npm install`.
2. Configure a API: copie `server/.env.example` para `server/.env` e use um `JWT_SECRET` único com pelo menos 32 caracteres. Um arquivo de desenvolvimento já é criado localmente e não é versionado.
3. Inicie frontend e API juntos: `npm start`. O Expo mantém seu terminal interativo, mostra o QR Code em LAN na porta `8081` e a API usa a porta `3333`; na primeira execução, o SQLite cria `server/data/learnhub.db` a partir de `server/schema.sql`. Para executar somente a API, use `npm run server`.
4. Em desenvolvimento no Expo Go, o app detecta automaticamente o IP da máquina pelo Metro. Para definir uma URL explicitamente, copie `.env.example` para `.env.local` e ajuste `EXPO_PUBLIC_API_URL`.
   - Web: `http://localhost:3333`
   - Android Emulator: `http://10.0.2.2:3333`
   - Aparelho físico: `http://IP-DA-SUA-MAQUINA:3333`
5. Em outro terminal, inicie o Expo com `npm start` (ou `npm run web`). Após editar `.env.local`, recarregue completamente o app.

## Autenticação

- `POST /cadastro` cria usuário no SQLite; o e-mail é único e a senha é derivada com `scrypt` e salt aleatório.
- `POST /login` valida a senha e retorna um JWT de 8 horas.
- `GET /usuario/me` exige `Authorization: Bearer <token>`.
- No dispositivo o JWT é guardado no `expo-secure-store`; no web há fallback para AsyncStorage. Os dados do perfil continuam disponíveis para as telas existentes, sem a senha.

## Testes da API

Com a API em execução, rode `npm run test:auth`. O teste cobre cadastro válido, e-mail duplicado, senha incorreta, usuário inexistente, login válido e a rota protegida `/usuario/me`.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
