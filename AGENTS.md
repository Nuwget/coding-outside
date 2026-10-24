# AGENTS.md — Coding Outside

> Este arquivo define como o Coding Outside escreve, organiza e envia código.
> Vale para humanos e para agentes de IA: quem escreve aqui, segue aqui.
> Se um padrão deixar de fazer sentido, este arquivo é atualizado — não contornado.

---

## 1. Mentalidade senior

Tutorial ensina a escrever código. Engenharia decide o que vale a pena existir.

- **Entender antes de implementar.** Toda tarefa começa pelo problema, não pela solução esperada. Se o objetivo não está claro, a próxima linha de código é uma pergunta.
- **Menor mudança que resolve bem.** YAGNI sem rodeios: nada de genericidade antecipada, configuração que não é usada ou camada "para o futuro". Complexidade só entra quando o problema real pede.
- **Deixar o código-base melhor do que encontrou** — sem esconder reforma dentro de mudança de escopo. Melhoria pequena e intencional, sim; refactor que chega de surpresa no PR, não.
- **Tradeoff explícito.** Toda decisão de arquitetura é uma escolha entre custo e benefício. O porquê fica registrado (comentário, PR ou ADR leve); o como se explica sozinho no código.
- **Otimizar para o próximo leitor.** O código é lido centenas de vezes e escrito uma. Simples antes de esperto; explícito antes de mágico.
- **Falhar é melhor que ambiguar.** Preferir quebrar rápido com mensagem acionável a continuar executando em estado inválido com esperança.
- **Testes, observabilidade e segurança não são etapa final.** Fazem parte da definição de pronto.

## 2. Modo de trabalho dos agentes

Padrões específicos para agentes de IA (Codex, Claude, Copilot e afins):

- **Leia antes de escrever.** Explore a estrutura do repositório, os padrões existentes e as dependências antes de criar qualquer arquivo. Seguir o padrão local tem prioridade sobre a preferência pessoal.
- **Escopo fechado.** Resolva a tarefa pedida. Não renomeie, não reorganize e não "melhore" o que não foi pedido.
- **Nada inventado.** Confirme que a biblioteca ou API existe e se aplica à versão do projeto. Nunca invente import, nome de função ou contrato; em dúvida, pesquise — e diga o que pesquisou.
- **Ambíguo? Pare.** Antes de adivinhar, apresente as opções com custo/benefício e uma recomendação. Uma pergunta custa menos que uma resposta errada.
- **Quebra avisando.** Nome público, contrato de API e schema de banco nunca mudam silenciosamente: breaking change é comunicada, versionada e documentada.
- **Raciocínio transparente.** Ao terminar, diga o que fez, o porquê das escolhas e o que ficou de fora. Se o teste cobriu só o caminho feliz, declare o que ficou sem cobertura.

## 3. Código limpo

### Nomes

- Identificadores em **inglês**; comentários e documentação em **português**. O código é universal; a conversa do time é local.
- O nome conta sozinho: `daysUntilRenewal` vence `dias` e `d2`. Abreviação só quando é consenso do domínio (`id`, `url`, `db`).
- Booleano afirma: `isActive`, `hasPermission`, `canRetry`. Variável chamada `flag` não passa da revisão.
- Nome longo e claro vence nome curto e enigmático. `calculateMonthlyInterest` não é verboso; é legível.

### Funções e módulos

- **Uma função, um propósito.** Se você precisa de "e" para descrever o que ela faz, são duas.
- **Um nível de abstração por função.** Orquestrar em cima e calcular embaixo na mesma função torna o fluxo ilegível.
- **Early return.** Cláusulas de guarda no topo (validação, caso inválido) deixam o caminho feliz sem indentação crescente.
- **Poucos parâmetros, sem booleano que muda o comportamento.** `readFile(path, false)` pede comentário; `readFile(path, { binary: true })` dispensa.
- **Sem efeito colateral escondido.** Se a função salva e também envia e-mail "já que estava ali", são duas funções.
- **Regra dos três.** Abstraia na segunda ocorrência quando a semelhança for óbvia; na terceira, sempre. Copiar duas vezes é mais barato que abstração errada.

### Comentários e constantes

- O comentário explica o **porquê**; o código explica o **como**. Comentário que parafraseia a linha de baixo é apagado, não polido.
- `TODO` nunca viaja sem contexto: quem abriu, a referência e o critério de conclusão.
- Nenhum valor mágico solto: vira constante nomeada com significado de negócio (`MAX_LOGIN_ATTEMPTS = 5`).

### Erros

- Falhe na hora certa, com mensagem que diga **o que falhou, onde, e qual era a expectativa**. "Algo deu errado" não ajuda ninguém.
- Erro jamais engolido silenciosamente. Ao capturar, escolha uma das três: tratar, encapsular com contexto, ou registrar — e faça da forma visível.
- Em integrações (HTTP, filas, arquivos), toda entrada externa é validada antes de virar confiança no núcleo.

## 4. Arquitetura

### Princípios

1. **As dependências apontam para dentro.** Regras de negócio no centro; framework, banco e transporte HTTP na borda. O núcleo não sabe o nome do banco nem o status code que devolve.
2. **Fronteiras por domínio, não por tipo técnico.** Pastas como `orders/`, `auth/` e `payments/` evoluem independentes. `utils/` genérico existe, mas é destino de exceção — não de tudo.
3. **A história cabe em um arquivo.** O caso de uso central de uma feature deve ser legível de cima a baixo sem pular arquivos; se o fluxo se quebra a cada salto, a estrutura precisa morder.
4. **Validar na entrada, confiar no núcleo.** Traduza transporte (DTO, schema, parser) na borda; por dentro, o negócio trabalha com objetos de negócio.
5. **Estado explícito.** Tipos claros e imutabilidade onde for natural vencem variável global "conveniente". Contexto que atravessa módulos por efeito lateral é bug agendado.

### Estrutura de referência

Organização por feature/domínio, adaptável à stack do projeto:

```
src/
├── domains/
│   └── <dominio>/
│       ├── core/        # entidades, regras, casos de uso (sem HTTP nem SQL)
│       ├── adapters/    # persistência, APIs externas, filas
│       └── transport/   # controllers, rotas, handlers
├── shared/              # genérico reutilizável, não-domínio
└── main/                # composição, configuração, bootstrap
```

Não é dogma: o formato exato acompanha framework e tamanho do projeto. O invariante é um só — negócio sem dependência de infraestrutura, e fronteiras atravessáveis em um único sentido.

### Decisão que fica

Mudança arquitetural (novo banco, padrão de mensageria, corte de camada) registra uma **ADR leve**: contexto, decisão, consequências. Dez linhas honestas valem mais que documento formal abandonado.

## 5. Conventional Commits

Formato:

```
tipo(escopo)?: descrição

corpo opcional

rodapé opcional
```

O **escopo** é a área afetada, em kebab-case (`auth`, `pagamentos`, `infra`). A **descrição**: imperativa, minúscula, sem ponto final, até ~72 caracteres.

| Tipo | Quando usar | Exemplo |
| --- | --- | --- |
| `feat` | Nova funcionalidade para o usuário | `feat(checkout): adiciona pagamento em duas etapas` |
| `fix` | Correção de bug | `fix(webhook): evita cobrança duplicada em retry` |
| `docs` | Documentação | `docs: explica escolha do cache em AGENTS.md` |
| `refactor` | Mudança interna sem alterar comportamento | `refactor(auth): extrai serviço de token` |
| `perf` | Melhoria de performance observável | `perf(listagem): substitui N+1 por join único` |
| `test` | Testes novos, ajustes ou correções | `test(pedidos): cobre estorno parcial` |
| `style` | Formatação, sem mudança lógica | `style: ordena imports` |
| `build` | Dependências e build | `build: sobe fastapi para 0.115` |
| `ci` | Pipelines de CI/CD | `ci: roda lint antes do build` |
| `chore` | Manutenção fora do código de produção | `chore: adiciona .editorconfig` |
| `revert` | Reversão de commit anterior | `revert: "feat: liga fluxo beta"` |

**Regras:**

- Um commit, um propósito. Refactor misturado com fix é revert esperando para acontecer.
- O assunto diz **o que muda**; o corpo diz **o porquê** — contexto da decisão, alternativas descartadas, risco percebido.
- Incompatibilidade: `!` no tipo + rodapé `BREAKING CHANGE: <o que exige ação de quem consome>`.
- Se o commit não cabe em um tipo, não era um commit: quebre.

### Bons vs. ruins

```text
❌ fix: ajustes                     # nem diz o que foi consertado
❌ update code                      # "atualizar código" não é medida
❌ feat: refactor completo do módulo  # tipo não combina com conteúdo
✅ fix(auth): evita token expirado durante refresh concorrente
   Tokens gerados no mesmo refresh compartilhavam cache sem
   sincronização (race). Agora: lock por usuário. Refs: #142
```

## 6. Branches, PRs e revisão

- **Trunk-based:** `main` sempre saudável. Branch temático vive dias, não semanas: `feat/<assunto>`, `fix/<assunto>`, `docs/<assunto>` em kebab-case.
- **PR pequeno.** Ideal até ~400 linhas alteradas. Passou disso, quebre em PRs sequenciais — ou justifique.
- **O PR conta a história:** título como conventional commit; corpo com o problema, a mudança, o risco e como testar.
- **Auto-revisão antes de pedir revisão.** `console.log` de debug, arquivo esquecido e comentário desatualizado se despem aqui — não consumem o tempo de quem revisa.
- **Draft cedo se quiser input.** PR aberto com 30% feito orienta o rumo antes do custo da retrabalho.
- **Revise design primeiro.** Nome de variável importa, mas a pergunta-chave é "isso precisa existir?" — as duas conversas cabem no review.

## 7. Testes

- **Regra mínima:** nova funcionalidade entra com teste que falharia sem ela; correção de bug entra com teste que reproduz o bug — e vira regressão permanente.
- **Teste comportamento, não implementação.** Se um refactor quebra testes sem mudar comportamento, o teste estava acoplado a detalhe.
- **AAA (Arrange–Act–Assert)** com nome que narra o cenário: `estoura quando parcela duplica`.
- **Determinístico e rápido:** nada de `sleep`, tempo real ou rede sem mock na borda. Teste intermitente é teste que ninguém confia.
- **Pirâmide:** muitos testes de unidade, alguns de integração, pouquíssimos de ponta a ponta. Cobertura é indicador, não meta de vaidade.

## 8. Segurança e produção

- **Segredo nunca entra no repositório.** `.env` versionado só como `.env.example`. Credencial commitada é credencial vazada — rotação é obrigação, não opção.
- **Toda entrada externa é validada** (HTTP, webhook, arquivo, payload de fila). Whitelist vence blacklist.
- **Log estruturado com contexto** (request-id, usuário, chave de correlação) e **sem dado sensível** — PII em log é incidente, não diagnóstico.
- **Integração = timeout + retry + idempotência + observabilidade.** Toda chamada de saída assume que falhar é cenário normal.
- **Permissão mínima.** Token de deploy não lê produção; acesso de debug não vira permanente.

## 9. Documentação viva

- Todo projeto tem **README** que responde: para que serve, como rodar, como testar e onde estão as decisões importantes.
- O difícil merece explicação perto: comentário de porquê, doc de módulo ou parágrafo no PR. O fácil se explica com um nome bom.
- Documentação que ninguém atualiza é ruído: escreva menos, mantenha verdadeiro. Página que não ajuda quem trabalha não se escreve.

## 10. Checklist de entrega

Antes de dar por pronto (humano ou agente):

- [ ] O escopo da tarefa foi respeitado (nada a mais, nada a menos)?
- [ ] Existe teste que falharia sem esta mudança?
- [ ] Cada commit é atômico, convencional e conta uma história?
- [ ] Os nomes se explicam numa passada de olhos?
- [ ] Nenhum debug (`console`/`print`/`TODO` vazio) foi esquecido?
- [ ] Nenhum segredo ou credencial entrou na mudança?
- [ ] README e documentação acompanham a mudança de comportamento?
- [ ] Se breaking change, foi anunciada (`!` + `BREAKING CHANGE`)?

**Um "sim" em todas as perguntas é o padrão mínimo para merge.**
