const API_URL = String(process.env.LEARNHUB_API_URL || "https://learnhub-api-zxym.onrender.com").replace(/\/+$/, "");

const accounts = [
  {
    nome: "Escola Horizonte Samambaia",
    email: "escola.horizonte.samambaia@learnhub.demo",
    senha: "Escola12345",
    tipo: "diretor",
    address: { cep: "11712991", rua: "Rua Educacional Horizonte", bairro: "Samambaia", cidade: "Praia Grande", estado: "SP", numero: "100", complemento: "Unidade demonstrativa", latitudeAprox: -24.0049, longitudeAprox: -46.404 },
    project: { titulo: "Horta comunitária do Samambaia", descricao: "Criação de uma horta educativa para aproximar estudantes, famílias e moradores do bairro Samambaia.", categoria: "Meio ambiente", supportCategories: ["Mão de obra", "Recursos materiais", "Conhecimento"] },
  },
  {
    nome: "Escola Caminhos do Futuro",
    email: "escola.caminhos.samambaia@learnhub.demo",
    senha: "Escola12345",
    tipo: "diretor",
    address: { cep: "11712992", rua: "Rua Educacional Caminhos", bairro: "Samambaia", cidade: "Praia Grande", estado: "SP", numero: "200", complemento: "Unidade demonstrativa", latitudeAprox: -24.0066, longitudeAprox: -46.4017 },
    project: { titulo: "Biblioteca aberta para a comunidade", descricao: "Organização de um espaço de leitura compartilhado com oficinas e doações de livros para estudantes e moradores próximos.", categoria: "Educação", supportCategories: ["Recursos materiais", "Conhecimento", "Serviços"] },
  },
  {
    nome: "Marina Colaboradora",
    email: "marina.samambaia@learnhub.demo",
    senha: "Colabora12345",
    tipo: "colaborador",
    communityType: "comunidade",
    address: { cep: "11712993", rua: "Rua Comunitária Samambaia", bairro: "Samambaia", cidade: "Praia Grande", estado: "SP", numero: "300", complemento: "Endereço demonstrativo", latitudeAprox: -24.0058, longitudeAprox: -46.4028 },
  },
];

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
}

async function login(account) {
  const result = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: account.email, senha: account.senha }) });
  return result.response.ok ? result.body : null;
}

async function ensureAccount(account) {
  let session = await login(account);
  if (!session) {
    const registration = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ nome: account.nome, email: account.email, senha: account.senha, tipo: account.tipo, communityType: account.communityType, ...account.address }),
    });
    if (!registration.response.ok && registration.response.status !== 409) throw new Error(`${account.email}: ${registration.body?.error || registration.response.status}`);
    session = await login(account);
  }
  if (!session?.token) throw new Error(`Não foi possível validar o login ${account.email}.`);
  const authorization = { Authorization: `Bearer ${session.token}` };
  const updated = await api("/api/auth/me", { method: "PUT", headers: authorization, body: JSON.stringify({ nome: account.nome, endereco: account.address }) });
  if (!updated.response.ok) throw new Error(`${account.email}: ${updated.body?.error || "perfil não atualizado"}`);

  if (account.project) {
    const listed = await api("/api/projects", { headers: authorization });
    const exists = listed.body?.projects?.some((project) => project.titulo === account.project.titulo && Number(project.criador?.id) === Number(session.user.id));
    if (!exists) {
      const created = await api("/api/projects", { method: "POST", headers: authorization, body: JSON.stringify({ ...account.project, status: "publicado" }) });
      if (!created.response.ok) throw new Error(`${account.email}: ${created.body?.error || "projeto não criado"}`);
    }
  }
  return { email: account.email, senha: account.senha, tipo: account.tipo };
}

async function run() {
  const health = await api("/api/health");
  if (!health.response.ok || health.body?.database !== "connected") throw new Error("API ou banco hospedado indisponível.");
  const verified = [];
  for (const account of accounts) verified.push(await ensureAccount(account));
  for (const account of verified) {
    if (!await login(account)) throw new Error(`Falha ao verificar ${account.email}.`);
  }
  console.log(JSON.stringify({ success: true, accounts: verified }, null, 2));
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
