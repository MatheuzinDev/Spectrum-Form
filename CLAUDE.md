# CLAUDE.md

Guia operacional para trabalhar neste repositório: as regras que quebram em silêncio se
ignoradas, os comandos e as convenções.

**A autoridade sobre arquitetura e decisões é o [`ARQUITETURA.md`](./ARQUITETURA.md)** — ele é
versionado e é o que a próxima equipe lê. Em caso de conflito, ele vence. A
`documentacao-tecnica.md` é o documento de planejamento, não versionado (seção 10.2), e serve
como origem de requisitos, escopo e do grafo de etapas.

## Estado atual

Implementação em curso, seguindo o grafo de 56 etapas da seção 18.6. Ao criar código, criar
também a estrutura de diretórios da seção 5.2 — não improvisar outra.

**Já na `main`:** `chore/repo-workspaces` (pnpm workspaces, Turborepo, tsconfig base,
`.gitignore`, `.gitattributes`), `chore/repo-lint-format` (ESLint com as regras de camada,
Prettier, Husky, lint-staged, commitlint), `ci/verify-commits` (pipeline em push na `main`),
`feat/shared-cpf` e `feat/shared-schemas` (`packages/shared` completo) e
`docs/arquitetura-base`. Ainda não existe `apps/`.

**Ferramental local:** Node 24 e pnpm 10 instalados; **Docker ausente** — primeiro
impedimento real em `feat/api-prisma-schema`, que precisa de um Postgres para gerar a
migration. `gh` também não está instalado.

| Documento                       | O que é                                          | Status                         |
| ------------------------------- | ------------------------------------------------ | ------------------------------ |
| `ARQUITETURA.md`                | Arquitetura e ADRs — **versionado, autoridade**  | Vivo, cresce por etapa         |
| `documentacao-tecnica.md`       | Especificação, requisitos, grafo de dependências | Planejamento, não versionado   |
| `paginacao-offset-vs-cursor.md` | Comparação que sustenta a ADR-14                 | Apoio                          |
| `idempotencia.md`               | Plano da `Idempotency-Key`                       | **Proposta, não implementada** |
| `sugestoes-tecnicas.md`         | Fila de candidatas e recusadas                   | **Proposta, não implementada** |

Nada de `idempotencia.md` ou `sugestoes-tecnicas.md` está decidido. Não implementar, não
citar como se estivesse na especificação.

## O produto

Formulário público de cadastro de clientes (nome, CPF, e-mail, cor preferida do arco-íris,
observações) com persistência em PostgreSQL. Duas frases do enunciado governam tudo:

- _"preencher **uma única vez**"_ → unicidade garantida por `UNIQUE` no banco.
- _"continuar com **outra equipe**"_ → o critério de qualidade é a facilidade de assumir o
  projeto. Documentação, testes e decisões registradas não são extras.

## Stack

TypeScript `strict` · React 19, Vite, React Router, React Hook Form, TanStack Query/Table ·
Tailwind v4 com shadcn/ui · NestJS sobre **Fastify** · Zod com `nestjs-zod` · Prisma com
PostgreSQL 16 · Redis 7 (`ioredis`) · JWT com argon2 · NGINX na borda e nos estáticos ·
Docker Compose · pnpm workspaces com Turborepo · GitHub Actions e GHCR · Vitest/Jest,
Testing Library, Supertest, Testcontainers.

## Arquitetura em uma tela

```
Navegador ─:80─▶ proxy (NGINX, única porta publicada)
                   ├─ /*                      ─▶ web (NGINX, estáticos do React)
                   └─ /api /docs /health      ─▶ api (NestJS) ─▶ db (Postgres) + cache (Redis)
```

Cinco containers, **uma porta**. `web`, `api`, `db` e `cache` só existem na rede do Compose.
O navegador enxerga uma origem só — sem CORS, sem URL de API no front (ADR-06/08).

Backend: **hexágono por módulo** (`auth`, `clients`, `colors`; `health` e `shared` sem
domínio). Cada um com `domain` / `application` / `infrastructure`, e `infrastructure`
dividida em `presentation` (entrada: controllers, guards) e `persistence` (saída:
repositórios, hashers, emissores de token).

## Regras que não se negocia

Estas falham **em silêncio** quando violadas — nenhuma quebra o build por si só.

**Camadas (seção 5.3, cobradas por `no-restricted-imports` no ESLint)**

| Camada           | Pode importar           | Nunca importa                        |
| ---------------- | ----------------------- | ------------------------------------ |
| `domain`         | nada além de si mesma   | NestJS, Prisma, Zod, `ioredis`, HTTP |
| `application`    | `domain`                | Prisma, `ioredis`                    |
| `infrastructure` | `domain`, `application` | —                                    |

**Portas são `abstract class`**, nunca `interface` — interface não existe em runtime e não
serve como token de DI. Provider: `{ provide: ClientRepositoryPort, useClass: ... }`.

**Prisma só nos arquivos `orm-*`.** Nenhum outro arquivo importa `@prisma/client`. Não existe
`orm-entity`; a forma da query vive em `clients.orm-shape.ts` via `Prisma.validator`.

**Cache é decorator sobre a porta, nunca `if (cached)` dentro do caso de uso.**
`ClientsCacheRepository` recebe o `ClientsOrmRepository` no construtor e implementa a mesma
porta. Ligar/desligar é uma linha no `*.module.ts` (`CACHE_ENABLED`).

**Cache indisponível é _miss_, não erro.** Erro do `CacheStore` nunca propaga; a escrita não
bloqueia a resposta (`void … .catch(() => {})`). `/health` reporta `cache: "down"` com
`status: "ok"`. Exceção declarada: login e refresh dependem duramente do Redis (ADR-17).

**Listagem em ordem `created_at` ASC.** Contraintuitivo de propósito (ADR-14): registro novo
é anexado no fim, então **página cheia nunca muda**. Daí: cacheia-se a página **só se veio
cheia**; `save()` não invalida nada; não existe contador de geração. Se alguém inverter para
DESC ou introduzir edição/exclusão, a estratégia de cache inteira desmonta.

**Toda dimensão que altera a resposta entra na chave de cache** — `page`, `pageSize`,
`search`, `colorId`. Esquecer um faz a busca devolver a listagem completa sem lançar erro.

**`POST /api/clients` é público.** Um guard global "protegendo tudo" descaracteriza o
requisito. Autenticado é o que **lê a coleção** (`GET /api/clients`, `/api/admin/*`).

**Não existe edição nem exclusão de cadastro.** Sem `PATCH`, sem `DELETE`, sem
`GET /api/clients/:id`. O administrador lê `clients` e escreve apenas em `colors`.

**Cores vêm do banco.** Nenhuma cor hardcoded no componente. Adicionar cor é `INSERT`.

**CPF: só dígitos** (`CHAR(11)`), validado por dígito verificador, com **rejeição explícita
de dígitos repetidos** (`111.111.111-11` passa no cálculo ingênuo). É o teste unitário mais
importante do projeto. Máscara é só exibição. E-mail normalizado para lowercase.

**CPF, e-mail, senha e cookies nunca vão para o log.** Configurado no `redact` do `pino` no
`FastifyAdapter` — a lista cresce junto com a superfície sensível. `trustProxy: true` é
obrigatório: sem ele o throttler chaveia todo mundo pelo IP do proxy e o rate limit vira
global.

**Hex dinâmico só por `style` inline.** O Tailwind varre o fonte estaticamente; `bg-[${hex}]`
não existe no CSS gerado. Tamanho/forma/contorno continuam em utilitárias, com
`ring-1 ring-black/15` (contraste do amarelo) e `aria-hidden` no quadrado + rótulo textual
ao lado.

**Zod em `packages/shared` é fonte única.** O mesmo schema valida no React (`zodResolver`),
no servidor (`createZodDto`) e gera a spec OpenAPI. Zod valida **formato na borda**; o
domínio guarda o que depende de estado (unicidade, cor ativa). Não duplicar validação.

**Violação de constraint é traduzida na infraestrutura.** `P2002` → `CpfAlreadyRegisteredError`
/ `EmailAlreadyRegisteredError` (erros de `domain/`), mapeados para `409` pelo filter global.
Nunca verificar existência antes de inserir — race condition.

## Contratos

Prefixo `/api`, docs em `/docs`.

| Rota                                                                                             | Acesso      |
| ------------------------------------------------------------------------------------------------ | ----------- |
| `POST /api/clients`, `GET /api/colors`, `POST /api/auth/login`                                   | Público     |
| `GET /api/clients`, `/api/admin/*`, `POST /api/auth/refresh\|logout`, `PATCH /api/auth/password` | Autenticado |

Erro sempre no formato `{ "error": { code, message, fields? } }`. Códigos: `VALIDATION_ERROR`
(422), `CPF_ALREADY_REGISTERED` / `EMAIL_ALREADY_REGISTERED` (409), `COLOR_NOT_FOUND` (404),
`UNAUTHORIZED` / `INVALID_CREDENTIALS` / `TOKEN_EXPIRED` / `TOKEN_REUSED` (401),
`TOO_MANY_REQUESTS` (429), `INTERNAL_ERROR` (500, sem stack trace).

Login: e-mail inexistente e senha errada devolvem **exatamente a mesma resposta**. Token em
cookie `httpOnly; Secure; SameSite=Strict` — o front nunca lê credencial, nada de
`localStorage`. Sem dado pessoal no payload do JWT.

## Comandos

```bash
docker compose up --build      # stack completa em http://localhost (sem porta na URL)
docker compose up db cache     # dependências para desenvolver com hot reload
pnpm dev                       # api + web (o NGINX não participa do dev; o Vite faz o proxy)
```

| Comando                            | O que faz                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `pnpm check`                       | `lint` + `format:check` + `typecheck` + `build` — **o mesmo que o CI roda** |
| `pnpm verify`                      | `pnpm check && pnpm test` — o ritual antes de abrir PR                      |
| `pnpm test`                        | unitários + integração (Testcontainers)                                     |
| `pnpm db:migrate` / `pnpm db:seed` | nunca cacheados pelo Turborepo                                              |
| `turbo run build --dry=json`       | depurar hash/cache quando algo "rodou" instantaneamente                     |

Scripts da raiz delegam ao `turbo run`. Em _cache hit_ o Turborepo **reproduz o log anterior**
— o build parece ter rodado e não rodou; confira o resumo (`FULL TURBO`) ou use `--force`.

## Convenções

- Arquivos em kebab-case com o papel no sufixo: `.use-case.ts`, `.port.ts`, `.entity.ts`,
  `.dto.ts`. Adapters: `<assunto>.<tecnologia>-<papel>.ts` — o assunto é a **porta**, não o
  módulo (`color-lookup.colors-module-adapter.ts`).
- Testes unitários **colocados** ao lado do arquivo testado. Dublês em memória ficam em
  `application/use-cases/in-memory/`, nunca em `infrastructure/`.
- `strict: true`, sem `any`, sem `@ts-ignore`.
- **Sem comentários no código.** Nenhum: nem inline, nem JSDoc, nem em arquivo de
  configuração. O _porquê_ mora no `ARQUITETURA.md` e no corpo do commit — os dois lugares
  que a próxima equipe lê. Comentário no fonte é uma terceira cópia da mesma afirmação, que
  ninguém atualiza junto do código, e é exatamente o que a regra de "cada afirmação mora em
  um lugar só" recusa. Quando um trecho parecer precisar de explicação, a saída é renomear,
  extrair uma função ou registrar a decisão no `ARQUITETURA.md` — não comentar.
  **Única exceção: os cabeçalhos de seção do `.gitignore`**, de uma palavra e em inglês
  (`# Dependencies`, `# Env`). Ali não há nome de variável nem função para carregar o
  sentido, e o arquivo é uma lista plana que só se lê varrendo — o cabeçalho é estrutura,
  não explicação.
- Conventional Commits com `scope-enum` **fechado**: `repo`, `shared`, `api`, `web`, `colors`,
  `clients`, `auth`, `health`, `cache`, `infra`, `proxy`, `ci`, `docs`, `deps`.
- **Commits pequenos, um assunto cada.** Sem pull request, é o `git log` que precisa contar a
  história — ver Fluxo de trabalho com git. Um commit grande com o dia inteiro de trabalho é
  a versão diária do `initial commit` que a seção 15 chama de sinal negativo.
- ADR nova entra no `ARQUITETURA.md` no mesmo commit que implementa a decisão, ou em um
  commit imediatamente anterior.
- Toda ADR registra a **consequência negativa aceita** — ADR só com benefício é propaganda.

### Commits com emoji

Formato: `<tipo>(<escopo>): <emoji> <descrição no imperativo>`.

| Tipo       | Emoji | Quando usar                                                                                                             |
| ---------- | ----- | ----------------------------------------------------------------------------------------------------------------------- |
| `feat`     | ✨    | Comportamento observável novo. Vale para o caso de uso testado antes de existir endpoint — ele entrega regra de negócio |
| `fix`      | 🐛    | Correção de comportamento observável                                                                                    |
| `refactor` | ♻️    | Mudança interna sem alterar comportamento                                                                               |
| `test`     | ✅    | Teste novo ou ajustado, sem tocar em código de produção                                                                 |
| `docs`     | 📝    | `README.md`, `ARQUITETURA.md`, ADR, comentário de spec                                                                  |
| `chore`    | 🔧    | Andaime: configuração, dependências, bootstrap de pacote                                                                |
| `ci`       | 👷    | Workflows, cache do CI, proteção de branch                                                                              |

`chore` e `ci` não estavam no pedido, mas o grafo da seção 18 tem branches `chore/` e `ci/` —
sem eles metade das branches ficaria sem tipo. `feat` e `fix` descrevem comportamento
observável; andaime é `chore`.

```
feat(clients): ✨ traduz P2002 em CpfAlreadyRegisteredError
fix(cache): 🐛 inclui colorId na chave da listagem
refactor(colors): ♻️ extrai mapper do repositório
test(shared): ✅ rejeita CPF com dígitos repetidos
docs(repo): 📝 registra a ADR-14 no ARQUITETURA.md
```

**O emoji vai depois dos dois-pontos, nunca no início.** O job `commits` do CI roda o
`commitlint` com o parser convencional, que exige o header começando em `<tipo>(<escopo>):` —
um emoji na frente faz o PR falhar em `type-empty`. Para colocá-lo antes seria preciso
sobrescrever o `headerPattern` do `parserPreset`, e aí o `scope-enum` fechado acima passa a
depender de uma regex mantida à mão. Não vale o risco.

O `dependabot.yml` continua com `commit-message.prefix: "chore(deps)"`, sem emoji — a
automação não passa por esta convenção e forçá-la ali só quebraria os PRs de dependência.

## Fluxo de trabalho com git

**Nunca rodar `git add` nem `git commit` por iniciativa própria.** Escrever e editar arquivos
é livre; levá-los para o índice ou para o histórico só mediante pedido explícito do usuário.
Quando um trabalho terminar, dizer o que mudou e parar — sem commitar, sem sugerir que
commite como se fosse o passo seguinte automático. Vale também para `git push`, `git switch
-c` e qualquer coisa que altere o histórico.

**Trabalho direto na `main`.** Não haverá revisão de código, então o processo de branch curta

- pull request da seção 18 foi abandonado por decisão do usuário. Sem branches de
  funcionalidade, sem teto de 500 linhas por diff, sem rebase antes do merge.

A única exceção é `chore/repo-workspaces`, a primeira branch, que já existe e entra por pull
request. Depois dela, tudo direto na `main`.

O grafo da seção 18.6 **continua valendo como ordem de trabalho** — o que ele registra são
dependências técnicas, e elas não mudaram por não haver mais PR. Cada linha daquelas tabelas
vira um ou mais commits na `main`, na mesma sequência.

**O que o commit granular passa a carregar sozinho.** Sem PR, o `git log` é o único registro
do que foi feito e por quê. Então commits pequenos, um assunto cada, com mensagem no formato
convencional deixam de ser boa prática e viram a documentação do processo. O corpo do commit
é o lugar de registrar decisão e consequência aceita — o que antes ia na descrição do PR.

**Três consequências dessa mudança, para não descobrir depois:**

- O job `commits` do CI roda apenas em `pull_request` e **nunca mais vai rodar**. O
  `commitlint` fica valendo só pelo gancho `commit-msg` do Husky, que se contorna com
  `--no-verify`. Se a convenção importa, o `ci.yml` precisa ganhar gatilho de `push` na
  `main` quando `ci/verify-commits` for escrito.
- **Não ligar "Require a pull request before merging"** na proteção da `main` — ela bloquearia
  todo push direto. As demais regras (status checks, block force push, no bypass) continuam
  compatíveis e valem a pena.
- A política de merge commit da seção 15 fica sem função: sem PR não há merge, e
  `git log --first-parent` deixa de separar funcionalidades. O histórico vira linear.

## Documentação

Cada afirmação mora em **um lugar só**. `README.md` responde "como eu rodo", `ARQUITETURA.md`
responde "como está montado e por quê", `/docs` (OpenAPI) responde "como eu chamo".
A `documentacao-tecnica.md` é artefato de planejamento e **não é versionada no repositório
final** — o que sobrevive à entrega é o `ARQUITETURA.md`, que cresce uma seção por branch, não
no último dia.

## Escopo fechado

Fora, por decisão: papéis/permissões granulares, edição e exclusão de cadastros, autocadastro
de administradores, deploy em nuvem, TLS ativo (documentado na seção 11), filas/workers,
Kubernetes/Terraform, Prometheus/Grafana, E2E. Antes de propor qualquer um, ler a seção 3.2 —
a justificativa já está escrita.
