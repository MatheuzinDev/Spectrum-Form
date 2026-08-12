# Arquitetura

Como este sistema está montado, e por que assim. É o documento para quem vai mexer no
código; o `README.md` responde como rodar, e `/docs` responde como chamar a API.

> **Este documento descreve a arquitetura alvo.** Nem tudo aqui existe ainda — o projeto é
> construído por etapas, e o que já foi implementado se lê no `git log`. Onde uma decisão
> ainda não tem código, está dito.

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Estrutura do repositório](#2-estrutura-do-repositório)
3. [Camadas do backend](#3-camadas-do-backend)
4. [Modelo de dados](#4-modelo-de-dados)
5. [Fluxos que valem ler](#5-fluxos-que-valem-ler)
6. [Decisões (ADRs)](#6-decisões-adrs)
7. [O que ficou de fora](#7-o-que-ficou-de-fora)

---

## 1. Visão geral

Um formulário público de cadastro de clientes, com validação de CPF, cor preferida servida
pelo banco e uma área administrativa autenticada.

```
                  ┌──────────────────────────────────────────────┐
Navegador ──:80──▶│  proxy  (NGINX)                              │
                  │  única porta publicada no host               │
                  └───────┬──────────────────────────┬───────────┘
                          │ /*                       │ /api  /docs  /health
                          ▼                          ▼
                  ┌───────────────┐          ┌───────────────────┐
                  │  web  (NGINX) │          │  api  (NestJS)    │
                  │  :8080        │          │  :3000            │
                  │  estáticos    │          └────┬─────────┬────┘
                  └───────────────┘               ▼         ▼
                                    ┌───────────────┐  ┌──────────────┐
                                    │ db (Postgres) │  │ cache (Redis)│
                                    └───────────────┘  └──────────────┘
```

Cinco containers, **uma porta**. `web`, `api`, `db` e `cache` existem apenas dentro da rede
do Compose; do host, nenhum deles é alcançável.

A consequência mais importante desse desenho é que **o navegador enxerga uma origem só**.
Uma requisição para `/api/clients` é mesma origem: não há preflight, não há
`Access-Control-Allow-Origin` e o front nunca precisa saber a URL da API — chama caminho
relativo. É o que um proxy reverso entrega: múltiplos serviços, uma origem.

O `cache` é o único serviço sem volume, de propósito: o que ele guarda é derivado do
Postgres e descartável por definição. Cache que sobrevive a restart é banco de dados
disfarçado.

`packages/shared` não é um serviço. É compilado para dentro das imagens em tempo de build e
consumido pelos dois lados.

---

## 2. Estrutura do repositório

```
.
├── apps/
│   ├── api/                  # NestJS sobre Fastify
│   └── web/                  # React + Vite
├── packages/
│   └── shared/               # schemas Zod e validação de CPF
├── infra/
│   ├── proxy/                # NGINX de borda: roteamento e rate limit
│   └── web/                  # NGINX que serve os estáticos
├── .github/workflows/
├── docker-compose.yml
├── turbo.json
├── eslint.config.js
├── ARQUITETURA.md
└── README.md
```

Hoje existem `packages/shared`, `apps/web` e a configuração da raiz. `apps/api`, `infra/` e o
`docker-compose.yml` entram nas etapas seguintes.

Duas convenções que valem saber antes de criar arquivo:

**Teste ao lado do arquivo testado.** `cpf.ts` e `cpf.test.ts` no mesmo diretório. Uma árvore
de testes espelhando a de código exige manutenção dupla a cada arquivo movido, e o teste some
de vista de quem está editando a implementação.

**Adapters seguem `<assunto>.<tecnologia>-<papel>.ts`** — `clients.orm-repository.ts`,
`clients.orm-mapper.ts`, `color-lookup.colors-module-adapter.ts`. O assunto é a **porta
implementada**, não o módulo, e vem na frente para que os arquivos de um mesmo hexágono
fiquem juntos na listagem.

---

## 3. Camadas do backend

Cada módulo do backend (`clients`, `colors`, `auth`) é um hexágono independente, dividido em
três camadas. A regra é uma só: **as dependências apontam para dentro.**

| Camada           | Responsabilidade                                               | Pode importar           | Nunca importa                      |
| ---------------- | -------------------------------------------------------------- | ----------------------- | ---------------------------------- |
| `domain`         | Entidades, invariantes, portas (interfaces) e erros de negócio | nada além de si mesma   | NestJS, Prisma, Zod, ioredis, HTTP |
| `application`    | Casos de uso; orquestra o domínio através das portas           | `domain`                | Prisma, ioredis                    |
| `infrastructure` | Adapters concretos                                             | `domain`, `application` | —                                  |

```
HTTP ──▶ infra/presentation ──▶ application ──▶ domain ◀── implementa ── infra/persistence ──▶ Prisma
                                                  ▲
                                            porta (interface)
```

`infrastructure` se divide pelo sentido do fluxo: `presentation` são os adapters que
**chamam** a aplicação (controllers, guards), `persistence` os que **são chamados** por ela
através de uma porta (repositórios, hashers, emissores de token).

**Quem cobra isso.** Não é convenção: o `eslint.config.js` tem uma regra
`no-restricted-imports` por camada, e um `import { PrismaClient }` dentro de `domain/`
reprova o lint com a mensagem apontando para esta seção. O compilador garante a fronteira de
**tipos**; o ESLint garante a de **dependências**, que é onde o hexágono apodrece primeiro.

**Portas são `abstract class`, não `interface`.** Interfaces TypeScript desaparecem em runtime
e não servem como token de injeção. Uma `abstract class` funciona como tipo e como token ao
mesmo tempo, e o provider vira
`{ provide: ClientRepositoryPort, useClass: ClientsOrmRepository }`.

**Prisma só nos arquivos `orm-*`.** Fora deles, nenhum arquivo do módulo importa
`@prisma/client` — a fronteira fica reduzida a um punhado de pontos de contato auditáveis, na
mesma pasta. O ESLint também cobra isso.

---

## 4. Modelo de dados

```sql
CREATE TABLE colors (
  id          SERIAL PRIMARY KEY,
  slug        TEXT      NOT NULL UNIQUE,
  label       TEXT      NOT NULL,
  hex         CHAR(7)   NOT NULL,
  sort_order  SMALLINT  NOT NULL,
  active      BOOLEAN   NOT NULL DEFAULT TRUE
);

CREATE TABLE clients (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   TEXT        NOT NULL,
  cpf         CHAR(11)    NOT NULL UNIQUE,
  email       TEXT        NOT NULL UNIQUE,
  color_id    INT         NOT NULL REFERENCES colors(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  email          TEXT        NOT NULL UNIQUE,
  password_hash  TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_created_at_id ON clients (created_at, id);
```

**O que cada constraint protege:**

`UNIQUE` em `cpf` e `email` é a regra "cada cliente se cadastra uma vez", e ela vive no banco
porque verificar existência antes de inserir seria vulnerável a corrida entre duas
requisições simultâneas. A aplicação tenta o `INSERT` e traduz a violação em `409`.

`cpf CHAR(11)` guarda **apenas dígitos**. Persistir `123.456.789-09` e `12345678909` como
registros distintos anularia a unicidade. O e-mail é normalizado para minúsculas antes de
persistir, pelo mesmo motivo.

`color_id` é chave estrangeira, nunca enum do Postgres: alterar um enum exige migration,
inserir uma linha não exige nada. `sort_order` deixa o front exibir na ordem do arco-íris sem
lógica própria, e `active` permite desativar uma cor sem invalidar cadastros existentes.

O índice composto `(created_at, id)` casa com a ordenação da listagem. O desempate por `id`
não é detalhe: dois cadastros no mesmo instante produziriam ordenação instável, e a paginação
passaria a repetir ou pular registros.

`admin` nunca guarda senha, só o hash argon2id. E está no singular enquanto `clients` e
`colors` são plurais — escolha deliberada, registrada aqui para não parecer descuido.

**O CPF sai da API como está no banco: onze dígitos, sem máscara.** Resposta de API é dado,
não apresentação — `123.456.789-09` embute uma convenção brasileira no contrato, e qualquer
outro consumidor precisaria desfazê-la antes de usar. Também mantém a simetria com a
requisição, que envia dígitos. A máscara é aplicada por `formatCpf`, em `packages/shared` ao
lado do `onlyDigits`, que é a função inversa, e existe para o front chamar na exibição.

---

## 5. Fluxos que valem ler

Esta seção descreve o caminho completo de três operações onde o interessante não está em
nenhum arquivo isolado: **cadastro com CPF duplicado**, **leitura com cache** e **login com
refresh**.

Ela está vazia de propósito. Nenhum dos três fluxos existe ainda, e descrevê-los agora seria
documentar código que ninguém escreveu. Cada um entra na etapa que o implementa.

---

## 6. Decisões (ADRs)

Cada decisão ocupa três parágrafos: **contexto**, **decisão** e **consequência** — incluindo a
negativa aceita. Uma ADR que só lista benefícios não é decisão, é propaganda: toda escolha de
arquitetura troca alguma coisa por outra, e a troca é o que permite julgar depois se as
condições mudaram.

Os números são identificadores estáveis, vindos do documento de planejamento, e não são
reatribuídos. **Lacunas na sequência significam decisões ainda não implementadas**, não
decisões esquecidas — elas entram junto do código que as realiza.

### ADR-01 — Monorepo com pnpm workspaces

**Contexto.** O código-fonte precisa morar em um repositório único, e três pacotes convivem
nele: a API, o front e o código compartilhado entre os dois. Sem uma ferramenta de workspace,
ou as dependências viram uma bola só na raiz, ou cada pacote exige instalação separada.

**Decisão.** pnpm workspaces, com `apps/*` e `packages/*`. Um `pnpm install` na raiz resolve
os três, com dependências isoladas por pacote e um lockfile só. Recusados: repositórios
separados, que o enunciado proíbe, e npm/yarn workspaces, pela eficiência de disco do pnpm e
pelo suporte nativo a workspaces.

**Consequência.** Um comando instala tudo, e `@repo/shared` é importado como pacote, não como
caminho relativo atravessando pastas. O custo é a dependência do pnpm estar instalado antes de
qualquer coisa funcionar, e um lockfile único que concentra conflito quando duas frentes mexem
em dependências ao mesmo tempo. E resolve apenas **instalação**: qual tarefa roda, em que
ordem e o que pode ser pulado é problema da ADR-19.

### ADR-03 — Zod como fonte única de verdade

**Contexto.** O padrão do NestJS é DTO em classe com `class-validator`, o que inviabiliza
compartilhar validação com o frontend: a mesma regra acabaria escrita duas vezes, em duas
linguagens de anotação, divergindo na primeira alteração.

**Decisão.** Os schemas vivem em `packages/shared`, escritos em Zod 4. O `nestjs-zod`
converte cada schema em DTO com `createZodDto` e gera a spec OpenAPI a partir dele; no front,
o mesmo schema alimenta o React Hook Form via `zodResolver`. Uma definição, três usos.

**Consequência.** A documentação não tem como divergir do código, porque é gerada dele. O
custo é acoplar os dois lados a uma biblioteca de validação — trocá-la depois significa
reescrever a borda inteira. E há uma armadilha registrada: no Zod 4 os validadores de formato
como `z.email()` são schemas próprios e validam **antes** de transformações encadeadas depois
deles, então `z.email().trim()` recusa um e-mail com espaços sem nunca tê-lo normalizado. A
ordem correta é `z.string().trim().toLowerCase().pipe(z.email())`, e existe teste que reprova
a inversão.

### ADR-10 — Zod na borda, invariantes no domínio

**Contexto.** A ADR-03 coloca o Zod como fonte única de verdade, mas o hexágono quer um
domínio que se valide sozinho e que não conheça biblioteca de borda. Feito sem critério, o
resultado é validação duplicada: a mesma regra no schema e na entidade, divergindo com o
tempo.

**Decisão.** Divisão por natureza da regra. **O Zod valida formato** — CPF com dígito
verificador válido, e-mail bem formado, tamanhos — na borda, antes de qualquer coisa virar
entidade. **O domínio guarda o que o Zod não alcança**: regras que dependem de estado, como a
unicidade de CPF e a existência de uma cor ativa. Se um caso de uso recebe um
`CreateClientData`, o formato já está garantido pelo tipo.

**Consequência.** Não existe validação duplicada, e `packages/shared` serve os dois lados sem
virar dependência do núcleo — `domain/` não importa Zod. O custo é que essa fronteira é
convenção sustentada por ferramenta externa: o compilador não a garante sozinho, e é o
`no-restricted-imports` da seção 3 que a cobra. Sem o lint, ela apodrece em silêncio.

### ADR-19 — Turborepo como orquestrador de tarefas

**Contexto.** A ADR-01 resolve instalação, não execução. `packages/shared` é consumido pela
API e pelo front, e `pnpm -r typecheck` ou `pnpm -r test` não sabem que ele precisa existir
antes: funcionam por acidente, porque o `tsc` alcança o fonte. É uma dependência real que não
está escrita em lugar nenhum e que quebra no dia em que o `shared` publicar `dist/`.

**Decisão.** Turborepo lendo o workspace e chamando os mesmos scripts. `dependsOn: ["^build"]`
transforma a suposição em contrato, em `build`, `typecheck` e `test`. Cache local, preservado
no CI por `actions/cache`; Remote Caching foi recusado por exigir secrets adicionais sem
segundo desenvolvedor com quem compartilhar.

**Revisão.** `lint` e `format:check` **saíram** das tarefas do Turborepo. Como tarefas por
pacote, exigiriam script e configuração em cada um e ainda assim deixariam `turbo.json`,
`eslint.config.js` e o README sem cobertura, por não pertencerem a pacote nenhum. ESLint e
Prettier rodam da raiz, em uma passada só. O `turbo.json` fica com as tarefas em que a ordem
entre pacotes realmente importa.

**Consequência.** A ordem de execução vira contrato verificável, e o `turbo prune` das imagens
Docker passa a existir. Os custos: mais um arquivo de configuração cuja correção **não é
verificável por teste** — um `outputs` incompleto entrega cache hit com artefato faltando, e
essa falha é silenciosa —, e um ganho de tempo que nesta escala é de segundos, não de minutos.
Citar velocidade como justificativa principal seria desonesto.

### ADR-20 — `packages/shared` emite CommonJS

**Contexto.** O pacote compartilhado é consumido pelos dois lados, e eles discordam de formato
de módulo: o NestJS compila para CommonJS por padrão, e o Vite trabalha em ESM.

**Decisão.** Emitir CommonJS, com declarações de tipo e sourcemaps. Um pacote só-ESM quebraria
o `require` do lado da API **em runtime**, não na compilação — o pior lugar para descobrir. O
Vite consome CommonJS sem atrito, então esse formato serve aos dois.

**Consequência.** Um formato só, sem build duplo e sem mapa de `exports` condicional para
manter. O custo é adotar o formato legado por causa do consumidor mais restrito, abrindo mão
do tree-shaking fino que o ESM permitiria — irrelevante para um pacote de dois arquivos, e o
tipo de coisa que deixa de ser irrelevante quando ele cresce. Se o Nest migrar para ESM, a
saída é build duplo, e esta ADR é revisada.

### ADR-21 — Commits direto na `main`, sem pull request

**Contexto.** O projeto tem um desenvolvedor só e prazo curto. O desenho original previa
branch curta e pull request obrigatório, com o `commitlint` interceptando antes da `main`. Sem
um segundo revisor e sem tempo para revisão deliberada, um PR aberto e mesclado pelo próprio
autor sem leitura é cerimônia sem contrapartida.

**Decisão.** Commits vão direto para a `main`. Sem branches de funcionalidade, sem teto de
diff, sem merge. O que carrega o processo passa a ser o **commit granular**: um assunto por
commit, mensagem em Conventional Commits e o corpo registrando a decisão e a consequência
aceita — o texto que iria na descrição do pull request. Uma exceção está no histórico: a
primeira etapa entrou por PR, antes desta decisão, e é o único merge commit do repositório.

**Consequência.** E ela é grande. O `commitlint` roda no CI em `push`, quando os commits já
estão na `main`: **ele reporta, não barra**. A proteção da branch cai para três regras — block
force pushes, block deletions e do not allow bypassing —, porque exigir status check em push
direto cria um impasse circular, já que o check só roda depois do commit chegar. E perde-se a
leitura por `git log --first-parent`, que agrupava commits por funcionalidade entregue; o
histórico é linear e a única compensação é a disciplina de escopo nas mensagens. Religar tudo
é barato no dia em que existir um segundo par de olhos.

### ADR-22 — Uma paleta só: os tokens do desenho, com os nomes do shadcn como apelidos

**Contexto.** O desenho define a paleta inteira — sete neutros com viés azul, um azul de ação,
verde e vermelho só como estado, e as versões claras e escuras de cada um. Os componentes do
shadcn/ui, por outro lado, referenciam nomes semânticos próprios: `background`, `foreground`,
`primary`, `border`, `ring`. Se cada lado trouxer suas cores, o repositório passa a ter duas
paletas, e a divergência entre elas é questão de tempo.

**Decisão.** Existe uma paleta, e é a do desenho. Os tokens vivem em `:root` — fora do
`@theme`, para responderem à cascata do tema — e o `@theme inline` os expõe como utilitárias
apontando para `var(--token)`, em vez de copiar o valor. Os nomes do shadcn entram no mesmo
bloco como **apelidos** sobre esses tokens. Recusada a alternativa de adotar a paleta do
shadcn e descartar a do desenho, que jogaria fora decisões já tomadas sobre contraste e
hierarquia.

**Consequência.** Um componente da biblioteca renderiza nas cores do projeto sem saber que
existe um projeto, e o modo escuro funciona sem que ele participe. Três custos, todos reais.
O primeiro: a lista de apelidos precisa cobrir **todo** nome que os componentes usarem, e um
nome faltando não gera erro nem aviso — aparece como componente sem cor, meses depois. O
segundo: alguns componentes usam `var(--nome)` bruto em `style` inline, e não como utilitária;
como o `@theme inline` gera `--color-nome`, esses precisam de um apelido adicional em `:root`,
e o `index.css` traz a instrução de como conferir ao copiar um componente novo. O terceiro é
uma colisão: `--muted` é texto secundário no desenho e fundo sutil no shadcn, então o nome
bruto pertence ao desenho e o do shadcn vive apenas como utilitária.

### ADR-23 — Tema por CSS, sem provider de React

**Contexto.** O desenho tem modo claro e escuro completos, e o mockup os alterna de duas
formas: por `prefers-color-scheme` e por um atributo `data-theme` na raiz. O componente de
notificações que a CLI do shadcn copia, porém, lê o tema por JavaScript, com o `useTheme` do
`next-themes` — o que pressupõe um provider e um framework que este projeto não usa.

**Decisão.** O tema é CSS. A paleta troca por `prefers-color-scheme` e por `data-theme`, sem
estado no React, sem provider e sem `next-themes`, que foi removido das dependências. O
componente de notificações foi adaptado para seguir a preferência do sistema pelo mesmo
critério. Adaptar é o esperado: `components/ui/` é código do projeto, não dependência.

**Consequência.** Nenhum JavaScript participa da escolha de tema, o que elimina por
construção o clarão de tema errado no primeiro quadro — o problema que os provedores de tema
existem para resolver e frequentemente não resolvem. Os custos: não há seletor de tema na
interface, apenas o atributo que um seletor futuro usaria; e todo componente copiado que
assuma um provider precisará da mesma adaptação, uma por vez, sem aviso automático de que ela
é necessária.

---

## 7. O que ficou de fora

Registrar o que **não** foi feito vale tanto quanto o que foi: sem isso, quem assume o projeto
não distingue lacuna de decisão, e reabre discussões que já foram resolvidas.

| Item                                     | Por que não                                                                                                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Papéis e permissões granulares           | Existe um único tipo de administrador. Níveis depois custam uma coluna, um claim e um parâmetro no guard — não é decisão irreversível                    |
| Edição e exclusão de cadastros           | O cadastro é o registro do que a pessoa informou sobre si; corrigi-lo por fora seria alterar declaração de terceiro                                      |
| Autocadastro de administradores          | O primeiro nasce pelo seed. Recuperação de senha por e-mail exigiria infraestrutura de envio                                                             |
| Deploy em nuvem                          | O projeto não será hospedado. O pipeline entrega as imagens no registry                                                                                  |
| TLS ativo                                | Sem domínio e sem hospedagem, só caberia certificado self-signed — um aviso de conexão insegura na primeira tela. A configuração fica documentada        |
| Filas, workers, processamento assíncrono | Não há nada no domínio que precise sair do ciclo de requisição                                                                                           |
| Kubernetes, Terraform                    | Sem ambiente de execução para orquestrar                                                                                                                 |
| Prometheus, Grafana                      | Logging estruturado com `pino` e um `reqId` por requisição cobrem a necessidade nesta escala                                                             |
| Testes end-to-end                        | O caminho completo não é exercitado por teste automatizado. O smoke test do CI prova que as imagens sobem, não que a regra de negócio funciona           |
| Serviço externo de cobertura             | O limite de `packages/shared` roda no CI e reprova; publicar o número exigiria conta e token, e um upload falhando deixaria a `main` vermelha sem motivo |
