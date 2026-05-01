# Roadmap Companion

App desktop (Electron + React + Vite + Tailwind) que vira o entregável complementar do produto **Roadmap Dev de Oferta**. Reduz reembolso aumentando custo de saída (instalação local), uso recorrente (ferramenta diária), e barra compartilhamento entre alunos.

Plano técnico original: [`../lp-roadmapdev/roadmap-companion-plano.md`](../lp-roadmapdev/roadmap-companion-plano.md)

---

## Como rodar

```bash
npm start
```

Abre janela do Electron com hot reload. DevTools abre junto em modo dev.

## Como buildar (gerar .exe / .dmg)

```bash
npm run make
```

Gera instaladores em `out/`.

---

## Estado atual — Dia 1 ✅

- [x] Electron Forge + Vite + TypeScript inicializado
- [x] React 19 + React Router 7 instalados
- [x] Tailwind v3.4 (estável) com tokens da identidade visual da LP (Obsidian #0c0c0c + Lime #ccff00)
- [x] Estrutura de pastas: `src/main/`, `src/lib/`, `src/renderer/{pages,components,hooks,data}`
- [x] IPC completo: main handlers, preload bridge segura, `window.api` no renderer
- [x] Storage local em `app.getPath('userData')` via JSON files
- [x] Onboarding em 3 passos (nome, nicho, objetivo) com auto-redirect
- [x] Layout completo: Sidebar 5 itens, Header com saudação dinâmica
- [x] Dashboard com 4 cards estruturais (próximo passo, streak, progresso, conquista)

## Estado atual — Dia 2 ✅

- [x] `src/renderer/data/roadmap.json` com as 18 aulas reais agrupadas em 4 fases (Setup, Fundação, Construindo, Bônus)
- [x] `src/renderer/data/prompts.json` com 15 prompts validados em 6 categorias (Setup, Pagamentos, Webhooks, Frontend, Operação, Deploy)
- [x] `VideoPlayer` que embeda YouTube/Vimeo/Bunny com fallback bonito quando URL ausente
- [x] Tela **Roadmap** funcional: fases em acordeão, click em etapa abre modal com vídeo + descrição + prompts associados
- [x] Marcar/desmarcar etapa atualiza progresso real e dispara conquistas
- [x] Tela **Prompts** completa: sidebar de categorias, busca por palavra-chave, modal com variáveis editáveis em tempo real e botão copiar
- [x] **Dashboard** plugado com dado real (próxima etapa não-completa, % real do total não-bônus, streak real)
- [x] Lógica de desbloqueio automático de 8 conquistas (primeiro passo, 3 fases completas, streak 3d/7d, primeiro prompt, primeiro SaaS manual)
- [x] Tela **Conquistas** mostra desbloqueadas vs bloqueadas com instruções de "como desbloquear"

---

## Roadmap dos próximos dias

### Dia 3 — Build + distribuição básica

- [ ] URLs reais dos vídeos das 17 aulas restantes (só a aula 1 tem URL agora)
- [ ] Polimento visual + estados vazios bonitos onde precisar
- [ ] Ícone customizado (.ico Windows + .icns Mac) baseado no SVG da LP
- [ ] `npm run make` gerar `.exe` Squirrel + `.zip`/`.dmg` Mac
- [ ] Testar instalador no próprio Windows
- [ ] Gravar vídeo de 30s ensinando "Mais informações → Executar mesmo assim" (alerta SmartScreen sem code signing)
- [ ] Página de download bonita (estilo LP) com botão Windows + Mac + vídeo de instalação
- [ ] Subir builds no Kiwify ou Drive
- [ ] Comunicar pros alunos atuais ("upgrade gratuito do produto")

### Dia 4 — Anti-pirataria + autenticação via webhook ⚠️ (premium real)

**Por que importa:** hoje o app é 100% local — qualquer um instala. Aluno comprou por R$173, manda o `.exe` num grupo de WhatsApp e 50 pessoas instalam grátis. Resolve com webhook de liberação.

- [ ] **Backend mínimo** (provavelmente Vercel + Supabase)
  - Endpoint `POST /api/webhook/kiwify` recebe eventos `order_approved`, `subscription_canceled`, `refund_requested`, `chargeback`
  - Tabela `usuarios_app` (id, email, kiwify_order_id, status, criado_em, expira_em, ultima_validacao)
  - Endpoint `POST /api/auth/validar` recebe email + token de máquina, devolve `{ valido, motivo, perfil }`
  - Endpoint `POST /api/auth/registrar-maquina` (associa o `device_id` do app ao email — limita a N máquinas, ex: 2)

- [ ] **Tela de login no app** (substitui ou precede onboarding)
  - Email + token recebido por email/WhatsApp pós-compra
  - App valida online na primeira abertura, depois guarda token local + revalida a cada 7 dias
  - Se servidor responder "removido" (reembolso/chargeback), app mostra tela de bloqueio e remove dados locais
  - Se offline há mais de 14 dias, força nova validação (impede uso indefinido offline)

- [ ] **Device fingerprinting**
  - Coletar identificador estável da máquina (MAC + hostname + OS) hash
  - Limitar a 2-3 máquinas ativas por compra (PC + notebook do mesmo aluno = OK; 50 pessoas em 50 máquinas = bloqueia)
  - Se aluno tentar instalar em 4ª máquina, app pede que ele desative uma das anteriores no painel

- [ ] **Heartbeat + telemetria mínima** (com permissão)
  - App pinga servidor 1x/dia com `{ device_id, ultima_etapa_concluida, dias_de_uso }`
  - Servidor decide: continua válido? bloqueado? promo de upsell?

### Dia 5 — Termos + camadas anti-reembolso

**Por que importa:** mesmo com webhook, aluno pode pedir reembolso e levar o aprendizado. As medidas abaixo elevam o atrito psicológico e contratual de pedir reembolso.

- [ ] **Tela de Termos no primeiro login** (substitui ou precede onboarding)
  - Texto legal claro: "É expressamente proibido compartilhar seu acesso. Detecção de uso em mais de 3 máquinas pode causar suspensão imediata e perda da garantia"
  - Cláusula explícita: "Após consumir 50% ou mais do conteúdo, você abre mão do direito de reembolso, conforme cláusula X dos termos"
  - **Reforço visual de credibilidade:** mostra na tela
    - Data e hora do aceite (timestamp do servidor)
    - IP capturado pelo backend
    - Cidade/estado aproximados via IP geolocation
    - Device ID + nome do computador
  - Aluno digita o nome completo + clica "Li e aceito os termos"
  - Aceite fica salvo no servidor com hash + timestamp (prova jurídica)
  - Botão "Imprimir/salvar PDF dos termos" (transparência)

- [ ] **Bloqueio automático de reembolso após 50% de progresso**
  - Quando aluno completa 50% das aulas não-bônus (ou seja, 7 das 14 etapas core), app exibe banner: "Você atingiu 50% do conteúdo. Conforme termos aceitos, garantia de reembolso encerrada"
  - Backend recebe esse sinal e marca `usuarios_app.reembolso_disponivel = false`
  - Quando webhook do Kiwify pedir reembolso, backend pode auto-recusar (ou ao menos avisar você)
  - Aluno é informado em cada virada de fase ("Você está em 30% — ainda dentro do prazo de garantia")

- [ ] **Marca d'água sutil em screenshots/exports**
  - Footer discreto da tela mostrando email + device_id (forma reduzida, tipo `gui***@gmail.com · device a3f...`)
  - Se aluno postar screenshot do app, fica rastreável de quem é
  - Não-removível pelo aluno (renderizado fora do React, no chrome do Electron se possível)

### Dia 6+ — Polimento e features premium

- [ ] Notificações desktop (lembretes diários do diário)
- [ ] Modo de foco (full screen + esconde sidebar pra estudar)
- [ ] Player de vídeo com marcação de timestamp ("voltar pra onde parei")
- [ ] Notas em cada aula (textarea ao lado do vídeo)
- [ ] Auto-update via electron-updater (não precisa baixar versão nova manualmente)
- [ ] Code signing (~$300/ano) — quando faturamento justificar, remove o alerta SmartScreen
- [ ] Trial 7 dias + paywall mensal (separar app gratuito básico de versão premium)
- [ ] Integração com Claude API (chat dentro do app pra pergunta-resposta sobre as aulas, usando os prompts validados como contexto)

### Aba "Análise" — auditoria de oferta/LP do aluno (feature premium importante) 🔥

**Inspiração:** [destrua.me](https://destrua.me) — ferramenta gratuita que "destrói" inputs do empreendedor (LP, naming, GitHub, ideia, pitch) com humor + sarcasmo. Tom de entretenimento porque o produto é grátis e precisa de gancho viral.

**Nosso ângulo:** o aluno já pagou pelo Roadmap Dev de Oferta, então o app entrega **análise consultiva profissional** — sem humor/xingamento. Voz de "consultor sênior revisando trabalho do aluno", não de comediante.

#### Funções do destrua.me que vamos modelar

Documentado a partir do que o site realmente oferece (não inventado):

| Função original | Adaptação nossa | Tom |
|---|---|---|
| **Destrua minha LP** | "Análise de Landing Page" — cola URL, recebe parecer | Consultivo |
| **Roast Battle** (2 LPs duelam) | "Comparativo A/B" — aluno cola 2 LPs (a dele + concorrente OU 2 versões dele) e recebe análise lado a lado de qual converte mais e por quê | Consultivo |
| **Destrua meu Nome** | "Análise de Naming" — aluno cola nome do produto/oferta, recebe avaliação se é forte, fraco, genérico, com sugestões de melhoria | Consultivo |
| **Destrua minha Ideia** (pitch) | "Análise de Oferta" — aluno descreve em texto a ideia/oferta dele e recebe diagnóstico de viabilidade, mercado, posicionamento, riscos | Consultivo |
| **Destrua meu GitHub** | ❌ Não vamos modelar — fora do escopo (público é infoprodutor, não dev de carreira) | — |
| **Horóscopo Startup** | ❌ Não vamos modelar — pura piada, não cabe no tom | — |

#### Funções que NÃO estão no destrua.me, mas faz sentido adicionar (extensões nossas)

Marcadas explicitamente como **extensões** porque foram pensadas pelo recorte de mercado do Roadmap Dev de Oferta (infoprodutor brasileiro), não copiadas:

- **Análise de Checkout** (URL Kiwify, Hotmart, checkout próprio) — campos desnecessários, order bump presente, garantia visível, trust signals
- **Análise de VSL** (URL do vídeo + transcrição opcional) — hook nos primeiros 30s, estrutura PAS/AIDA, CTAs no momento certo
- **Análise de Funil completo** — aluno conecta LP + checkout + upsell + downsell e recebe parecer de oferta como um todo (anchor de preço, stack de bônus, garantia, etc)

Essas 3 podem ficar pra V2 ou V3 — começar só com as 4 modelagens diretas do destrua.me reduz escopo e foca no que tem referência validada.

#### Por que essa aba importa estrategicamente

1. **Justifica ticket maior no futuro** — uma "Análise de LP" sozinha vale R$50-100/mês como SaaS isolado (CRO Audit GPT, Roastr cobram nessa faixa)
2. **Aumenta uso recorrente** — aluno volta toda vez que cria/edita LP, naming, ideia nova → menos chance de pedir reembolso
3. **Conexão com prompts** — cada problema apontado linka pro prompt validado da biblioteca que resolve aquilo ("use o prompt 'lp-acabamento' pra reescrever sua headline")
4. **Diferencial competitivo real** — curso de Claude Code concorrente não tem analisador integrado

#### Tom e formato da análise (CRÍTICO — é o que separa nós do destrua.me)

| Eixo | destrua.me | Nosso |
|---|---|---|
| Voz | Sarcástica, humorística, xinga | Consultiva, "amigo experiente revisando" |
| Forma | Texto contínuo de roast | Score numérico por categoria + Top 5 mudanças de maior impacto + breakdown por critério |
| Output prático | Risada do aluno | Antes/depois sugerido lado a lado + link pro prompt da biblioteca |
| Persistência | Mostra na tela e some | Histórico salvo + export PDF |
| Crítica | "isso tá horrível" | "Headline atual: X. Reescreva pra Y porque [razão concreta]" |

Sem mock de severidade nem nota inflada (tipo "47/100" só pra parecer rigoroso) — usa critérios mensuráveis.

#### Stack técnica

- Backend: `POST /api/analise/lp`, `/api/analise/comparativo`, `/api/analise/naming`, `/api/analise/oferta` — cada um com prompt mestre próprio
- LLM: Claude API. Haiku 4.5 pra naming/comparativo rápidos, Sonnet 4.6 pra LP/Oferta (análise profunda)
- Cache: análise da mesma URL em <24h reusa resultado (economia de tokens)
- Limite de uso: 5-10 análises/dia por aluno (evita abuso, generoso pro uso real)
- Histórico: todas análises ficam salvas em `analises.json` local pra aluno revisar offline
- Render: para LPs, o backend pode usar Playwright pra screenshot + extração estruturada antes de mandar pro Claude

#### Onde plugar no fluxo do app

1. Item "Análise" na sidebar entre "Prompts" e "Diário"
2. Tela com 4 abas internas: **LP**, **Comparativo A/B**, **Naming**, **Oferta**
3. Cada aba tem input + histórico de análises anteriores
4. Resultado abre em modal com seções colapsáveis (Score → Top 5 → Detalhes → Prompts sugeridos)
5. Banner sutil no Dashboard quando aluno marcou aulas-chave como concluídas: "Você terminou a Fase 03. Hora de analisar sua LP antes de subir tráfego" → CTA pra Análise

#### Roadmap dessa feature em 3 versões

**V1 (mínima viável)** — Análise de LP por URL com 5-7 critérios. Output em texto estruturado, sem PDF, sem histórico fancy. Tempo: 1-2 dias de trabalho.

**V2** — Adiciona Comparativo A/B + Naming + export PDF do relatório + histórico polido. Tempo: 1-2 dias adicionais.

**V3** — Análise de Oferta completa (texto longo descrevendo o funil) + recomendação ativa de prompts da biblioteca pra cada problema apontado. Tempo: 2-3 dias adicionais.

**Total estimado:** 4-7 dias de trabalho focado pra ter as 4 funções modeladas do destrua.me funcionando bem.

#### Quando entra

Depois do **Dia 4** (autenticação online implementada — Análise consome Claude API e precisa de gating pra evitar abuso). Provavelmente **Dia 7-10**. Pode virar feature paywall do tier premium no futuro também (free tier tem 3 análises/mês, premium ilimitado).

---

## Decisões estratégicas (não-técnicas)

### Estratégia anti-reembolso (efeito composto)

Não é UMA medida que resolve, é a soma:

1. **Custo de instalação** — quem instalou .exe não fecha aba como webapp. Aversão à perda já reduz pedido de reembolso em ~20-30% (instinto)
2. **Uso diário** — se app vira ferramenta, aluno usa. Usar = progresso = razão pra não desistir
3. **Termos com geolocalização e timestamp visível** — sensação de "assinei algo sério" eleva atrito psicológico
4. **Cláusula 50% de consumo** — quem assistiu metade do conteúdo internalizou valor. Reembolso fica anti-ético na cabeça dele
5. **Webhook automático** — reembolso = perde acesso. Não é mais "comprou, baixou, cancelou e ficou com tudo"
6. **Marca d'água** — reduz vontade de printar/compartilhar pra reclamar publicamente

### Estratégia anti-pirataria

- Webhook de compra como gatekeeper (sem compra ativa, app não destrava conteúdo)
- Device fingerprint limita a 2-3 máquinas (uso pessoal não é afetado, distribuição em massa é)
- Heartbeat diário detecta uso em padrão suspeito (50 IPs diferentes em 24h = bloqueia)
- Telemetria opt-in mas comunicada nos termos
- Aceite de termos com prova jurídica (timestamp servidor + IP + device)

### Estratégia de upgrade premium (futuro)

App é pago como entregável **incluído** no produto inicial (R$173). Mas a partir do Dia 6+ podemos:

- Trial 7 dias do app pra quem ainda não comprou (vira funil de aquisição)
- Cobra mensalidade (R$27-47/mês) pra acesso continuado pós-trial
- Premium tier com features extra (Claude API integrada, suporte direto, biblioteca de prompts atualizada mensalmente)

Esse path foi mencionado pelo Guilherme como "mais pra frente" — primeiro consolida o app como entregável que zera reembolso.

---

## Estrutura de pastas atual

```
src/
├── lib/
│   └── types.ts              # tipos compartilhados main ↔ renderer
├── main/
│   └── storage.ts            # read/write JSON em userData
├── main.ts                   # entry do processo Node + IPC handlers
├── preload.ts                # bridge contextBridge → window.api
├── renderer.tsx              # entry do React
├── index.css                 # Tailwind + identidade visual
└── renderer/
    ├── App.tsx               # roteamento principal (perfil ? Layout : Onboarding)
    ├── data/
    │   ├── roadmap.json      # 18 aulas em 4 fases
    │   └── prompts.json      # 15 prompts em 6 categorias
    ├── components/
    │   ├── Layout.tsx        # sidebar + header + outlet
    │   ├── Sidebar.tsx       # navegação entre 5 páginas
    │   ├── Header.tsx        # saudação dinâmica + nicho
    │   └── VideoPlayer.tsx   # YouTube/Vimeo/Bunny embed
    ├── hooks/
    │   └── useConquistas.ts  # verifica e dispara desbloqueios
    └── pages/
        ├── Onboarding.tsx    # 3 passos, salva perfil.json
        ├── Dashboard.tsx     # próxima etapa real, streak, progresso
        ├── Roadmap.tsx       # 4 fases acordeão + modal de etapa
        ├── Prompts.tsx       # 6 categorias + busca + modal com variáveis
        ├── Journal.tsx       # diário funcional com streak
        └── Achievements.tsx  # 8 conquistas com lock/unlock visual
```

## Onde os dados ficam (local)

- Windows: `%APPDATA%\roadmap-companion\`
- Mac: `~/Library/Application Support/roadmap-companion/`
- Linux: `~/.config/roadmap-companion/`

Arquivos:
- `perfil.json` — nome, nicho, objetivo
- `progresso.json` — etapas e fases concluídas
- `diario.json` — entradas do diário
- `conquistas.json` — badges desbloqueados

Pra simular usuário novo: apaga essa pasta e abre o app de novo.

## Decisões arquiteturais (não mexer sem motivo)

- **JSON em vez de SQLite** — evita dependência nativa que quebra build (na v1; SQLite vira opção quando autenticação online entrar)
- **HashRouter em vez de BrowserRouter** — funciona em `file://` no build de produção
- **`contextIsolation: true` + preload** — segurança padrão Electron, renderer não acessa Node direto
- **Tailwind v3 (não v4)** — v4 + Vite plugin + Electron Forge no Windows tem bug `Cannot convert undefined or null to object` no parser. v3.4 é estável via PostCSS clássico sem drama. Sintaxe nos componentes igual (`bg-lime`, `text-lime/80`, etc). Tokens em `tailwind.config.cjs`
- **`postcss.config.cjs` e `tailwind.config.cjs`** (não `.js`) — package.json não tem `"type": "module"`, configs Node precisam ser CJS
- **CSP no index.html** libera apenas `youtube.com`, `vimeo.com`, `iframe.mediadelivery.net` (Bunny) e Google Fonts. Adicionar novos hosts: editar a meta tag `Content-Security-Policy`
