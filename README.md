# NA Barbearia

Aplicação de agendamento e gestão da NA Barbearia, em Santos/SP. Reúne o site público, a área do cliente, a operação do barbeiro e o painel do proprietário, integrados a uma API com persistência em SQLite.

## Tecnologias

- **Frontend:** React 19, Vite, TypeScript/JavaScript, Tailwind CSS, componentes shadcn/ui com Base UI, ícones Lucide e Framer Motion.
- **Design system:** Plus Jakarta Sans e azul `#0099FF`; áreas autenticadas claras e página pública com tema escuro isolado.
- **Backend:** Rust, Axum e SQLite, com migrações automáticas.
- **Autenticação:** sessão em cookie HttpOnly, proteção CSRF e permissões por perfil.

## Funcionalidades

### Site público

- Fotos reais do perfil oficial, catálogo por categoria e preços/durações consultados na API.
- Agendamento a partir do serviço ou do profissional escolhido, preservando a seleção no fluxo do cliente.
- Galeria, avaliação agregada com link para a Trinks, endereço, mapa e horários em Santos.
- Layout responsivo, menu acessível e animações que respeitam a preferência por movimento reduzido.

As fontes das fotografias estão em [public/images/landing/README.md](public/images/landing/README.md). Se a consulta à API falhar, o catálogo local é identificado como referência; a reserva consulta os dados atuais. A página não anuncia lembretes automáticos que ainda não estão implementados.

### Cliente

- Catálogo com pesquisa, categorias, preços e durações.
- Escolha de profissional, consulta de disponibilidade e reserva.
- Comprovante recuperável pelo ID do agendamento.
- Próximos agendamentos, histórico, cancelamento, remarcação e avaliação.
- Perfil com dados da sessão e contato com a recepção pelo WhatsApp.

Visitantes podem consultar o catálogo. Reservas e gerenciamento de agendamentos exigem autenticação e são persistidos na API.

### Barbeiro

Navegação inferior com três abas:

- **Agenda:** datas em pílulas, atendimento atual em destaque, próximos horários e histórico recolhido.
- **Meus Ganhos:** serviços concluídos, comissões calculadas e pendências da data selecionada.
- **Perfil:** dados da conta, contato com a recepção e logout.

A agenda permite iniciar/concluir atendimentos, registrar falta, cadastrar clientes presenciais e bloquear almoço ou pausas. Telefone, observações e pagamento previsto podem ser editados no card. O WhatsApp abre o contato cadastrado; sem telefone, o atalho leva à recepção.

Encaixes e bloqueios respeitam os horários e conflitos da agenda. O início do atendimento e as alterações permanecem salvos após recarregar a página.

### Proprietário

- **Financeiro:** produção por dia ou mês, taxa de faltas, comissões a pagar, formas de pagamento previstas e repasses registrados.
- **Equipe:** cadastro/edição de profissionais, escalas e regras de comissão por barbeiro e serviço.
- **Agenda Geral:** consulta por data/profissional, remanejamento e cancelamento em lote.
- **Serviços:** cadastro e edição de preço, duração, categoria e status ativo/inativo.
- **Modo híbrido:** acesso à agenda profissional do próprio dono, mantendo suas permissões de gestão.

As comissões são calculadas na conclusão sobre o valor registrado no atendimento. Salvar uma regra também regulariza pendências compatíveis, preservando comissões já calculadas. O registro de repasses vincula cada comissão ao pagamento registrado e impede duplicidade; ele não realiza transferência bancária.

Ações em lote aceitam até 100 reservas confirmadas e não iniciadas. O remanejamento mantém os horários e durações originais; qualquer conflito desfaz o lote inteiro.

## Executar localmente

O projeto é composto por duas partes integradas:
1. **Backend (API em Rust + SQLite):** roda na porta `3001` (`http://127.0.0.1:3001`).
2. **Frontend (React 19 + Vite):** roda na porta `5173` (`http://127.0.0.1:5173`) e faz proxy das requisições `/api` para a porta `3001`.

---

### Requisitos prévios

- **Node.js 20+** (v24 recomendada) e **npm**.
- **Rust estável e Cargo** (versão 1.85+ com suporte à edição 2024).
  - Se ainda não tiver o Rust instalado:
    - **Linux/macOS:** `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
    - **Windows:** Baixe o instalador pelo site oficial [rustup.rs](https://rustup.rs).
  - Após instalar, reinicie o terminal para que o comando `cargo` fique disponível no seu `PATH`.
- **Compilador C/C++** básico (ex: `build-essential` no Ubuntu/Debian, Xcode Command Line Tools no macOS) para compilar o SQLite integrado.

---

### Passo a passo rápido (Modo Desenvolvimento)

#### 1. Instalar as dependências do Frontend

Na raiz do projeto:

```bash
npm install
# ou se preferir uma instalação limpa e idêntica ao lockfile:
npm ci
```

#### 2. Iniciar a API Backend (Terminal 1)

Abra o primeiro terminal na raiz do projeto e execute:

```bash
npm run dev:backend
```

> **O que esse comando faz?**
> - Ele executa o script `scripts/dev-backend.mjs`.
> - Cria automaticamente o arquivo `backend/.env` caso não exista, gerando um token seguro (`NABARBEARIA_BOOTSTRAP_TOKEN`).
> - Aplica automaticamente as migrações do banco de dados SQLite local (`backend/data/nabarbearia.db`).
> - Inicia a API HTTP na porta **3001**.

Para testar se o backend subiu corretamente, abra outro terminal ou navegador:
```bash
curl http://127.0.0.1:3001/api/v1/health
# Resposta esperada: {"status":"ok"}
```

#### 3. Iniciar o Frontend Vite (Terminal 2)

Abra um segundo terminal na raiz do projeto e execute:

```bash
npm run dev
```

Acesse no navegador:
👉 **[http://127.0.0.1:5173](http://127.0.0.1:5173)**

---

### Modo Produção / Build Único (Opcional)

Se preferir rodar a aplicação completa servida diretamente pelo executável do backend (sem precisar do servidor de desenvolvimento do Vite):

```bash
# 1. Compila o frontend para a pasta dist/
npm run build

# 2. Inicia o backend (ele detectará e servirá a pasta dist)
npm run dev:backend
```

Acesse diretamente em:
👉 **[http://127.0.0.1:3001](http://127.0.0.1:3001)**

## Rotas e acesso

| Perfil | Rota | Conteúdo |
| --- | --- | --- |
| Público | `/` | Apresentação da barbearia e localização |
| Público | `/login`, `/entrar`, `/cadastro` | Autenticação e cadastro de cliente |
| Cliente | `/home` | Catálogo de serviços |
| Cliente | `/servico`, `/detalhes` | Seleção de profissional |
| Cliente | `/horarios` | Seleção de data e horário |
| Cliente | `/confirmacao?id=...` | Comprovante da reserva salva |
| Cliente | `/meus-agendamentos`, `/perfil` | Agendamentos e conta |
| Barbeiro | `/barbeiro` | Agenda, ganhos e perfil |
| Proprietário | `/gestao/financeiro` | Indicadores financeiros |
| Proprietário | `/gestao/barbeiros` | Equipe, escalas, comissões e repasses |
| Proprietário | `/gestao/agenda-geral` | Agenda de toda a equipe |
| Proprietário | `/gestao/servicos` | Catálogo e preços |
| Proprietário | `/gestao/minha-agenda` | Agenda no modo híbrido |
| Desenvolvimento | `/styleguide` | Referência visual dos componentes |

`/painel` e `/agendar` direcionam a conta autenticada ao módulo correspondente: cliente → Home, barbeiro → agenda e proprietário → gestão. O acesso direto às áreas protegidas também verifica a sessão e as permissões.

Não há credenciais universais de acesso. Para o banco de demonstração existente, solicite uma conta à equipe responsável. Em um banco novo, o primeiro proprietário deve ser criado pelo endpoint de configuração; consulte o [README do backend](backend/README.md#primeiro-proprietário).

## Dados e configuração

- `src/data/barbershopData.ts`: catálogo local, profissionais e informações institucionais fornecidas para o projeto.
- `src/services/api.ts`: comunicação entre a interface e a API.
- `backend/data/`: banco SQLite local; o snapshot já versionado é destinado à demonstração.
- `backend/migrations/`: estrutura do banco e atualizações aplicadas na inicialização.
- `backend/.env.example`: referência das variáveis de ambiente.

Nos fluxos integrados, serviços, profissionais, disponibilidade, agendamentos e comissões vêm da API. Os dados locais não substituem os cadastros persistidos no backend.

Para receber reservas, cadastre serviços ativos, profissionais ativos e suas escalas no painel do proprietário. Ao ativar o modo híbrido, configure também a escala do dono.

O arquivo `portable/NA-Barbearia.zip` é um pacote previamente versionado; ele não é atualizado automaticamente pelos comandos de build. Para executar o código atual, use o procedimento acima.

## Testes e verificações

```bash
npm test
npm run build
cargo fmt --manifest-path backend/Cargo.toml --check
cargo test --manifest-path backend/Cargo.toml
cargo clippy --manifest-path backend/Cargo.toml -- -D warnings
git diff --check
```

Para os fluxos completos no navegador:

```bash
npm run test:client-flow
npm run test:owner-flow
```

- **Cliente/barbeiro:** login, reserva, comprovante, remarcação, avaliação, cancelamento, encaixe, observações, início/conclusão, falta, pausas e navegação entre abas.
- **Proprietário:** serviços ativos/inativos, edição de equipe, escalas, comissões, repasses, remanejamento/cancelamento em lote, rollback de conflitos e modo híbrido.

Os testes de navegador requerem Google Chrome/Chromium e Rust. A variável `CHROME_BIN` permite indicar outro executável compatível. Eles iniciam uma API e um banco temporários nas portas **3011** e **9224**, sem alterar o banco local da barbearia. Execute um fluxo por vez.

## Limites das integrações atuais

- Os links de WhatsApp abrem o contato; envio automático de comprovantes e lembretes ainda não está integrado.
- Edição dos dados pessoais do cliente, recuperação de senha e login Google dependem de integrações próprias; a interface não simula sucesso dessas operações.
- Forma de pagamento prevista não comprova recebimento. O faturamento exibido representa o valor dos serviços concluídos.
- O saldo de comissões a pagar é acumulado; a produção financeira segue o período selecionado. O resultado após comissões é exibido, mas o lucro líquido permanece não apurado sem despesas e impostos.

## Problemas comuns

| Sintoma | Como resolver |
| --- | --- |
| `Address already in use` / `AddrInUse` ao iniciar a API | A porta 3001 já está ocupada. Verifique o endpoint de saúde; se a API responder, ela já está em execução. Para reiniciar, use `Ctrl+C` no terminal da instância atual e execute novamente `npm run dev:backend`. |
| Frontend abre, mas não carrega os dados | Confirme que a API responde em `http://127.0.0.1:3001/api/v1/health` e que o frontend foi aberto pela URL permitida na configuração. |
| Nenhum horário disponível | Verifique serviço/profissional ativos, escala cadastrada, pausas e reservas existentes. |
| Comissão pendente | Cadastre a regra do profissional/serviço na aba Equipe. Não há percentual padrão presumido. |
| `cargo` não encontrado | Instale o Rust e reabra o terminal para carregar o PATH. |

## Segurança e colaboração

Sessões usam cookies HttpOnly, CSRF e validação de Origin. O backend aplica permissões por negócio e perfil e usa transações para proteger reservas, comissões e repasses.

Não versione tokens, senhas, arquivos `.env` reais ou arquivos temporários `*.db-wal`/`*.db-shm`. O banco local em uso não faz parte da atualização de código preparada nesta branch. Para produção, configure HTTPS, cookies seguros, origens permitidas e backups conforme a [documentação do backend](backend/README.md).
