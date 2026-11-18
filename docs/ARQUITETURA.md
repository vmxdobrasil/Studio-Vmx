# Arquitetura do clone — Carrossel Studio

Documento de referência do sistema próprio de criação de carrosséis, inspirado no
funcionamento da "Máquina de Carrosséis" (BrandsDecoded). O objetivo é ter a mesma
lógica central num código que é seu e que você pode personalizar.

> Identidade visual, nomes, textos e templates aqui são próprios. Nada de código,
> marca ou prompt do produto original foi copiado: o que foi reaproveitado é o
> **conceito de funcionamento**, observado usando o app.

---

## 1. O que o original faz (mapa de funcionalidades)

| Área                         | O que existe lá                                                                                                                                                | No clone (v1)                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Início                       | Checklist "Primeiros passos", projetos como pastas (capas + contagem), carrosséis por projeto, ordenar Recentes/A-Z, mover entre pastas, duplicar, lixeira     | ✅                                                                 |
| Novo carrossel               | Nome + template escolhido por **etapa do funil** (Topo / Meio), seletor de Brand Kit                                                                           | ✅ (Topo, Meio e Fundo)                                            |
| Studio — Criador de conteúdo | Link para GPTs externos (ChatGPT) + caixa "Cole o texto aqui" + **Aplicar texto** (cada linha preenche um campo do template, na ordem) + "Melhorar headline"   | ✅ + IA embutida (Claude) gerando o carrossel, headlines e legenda |
| Studio — Campos globais      | Nome da marca, @, copyright, avatar, selo verificado, reaplicar Brand Kit                                                                                      | ✅                                                                 |
| Studio — Texto               | Clicar num texto no slide e editar estilo; destaque por palavra (cor, negrito, fundo)                                                                          | ✅ (destaque com `==palavra==` e `**negrito**`)                    |
| Studio — Mídia               | Upload em lote que preenche os "slots" de imagem em ordem; colar com Ctrl+V; ajuste de enquadramento, zoom, cantos                                             | ✅                                                                 |
| Studio — Cores globais       | Tokens de cor (brand-color 1-3, hook, metadado…) que pintam todos os slides                                                                                    | ✅                                                                 |
| Studio — Fundo / Gradiente   | Fundo por slide; força do gradiente sobre foto (aplicar em todos)                                                                                              | ✅                                                                 |
| Studio — CTAs                | Botões de call-to-action (sólido, contorno, glass)                                                                                                             | ✅                                                                 |
| Studio — Proporção           | 4:5 e 9:16 (9:16 estende o fundo sem mexer no conteúdo)                                                                                                        | ✅                                                                 |
| Studio — Histórico           | Versões automáticas + restaurar                                                                                                                                | ✅                                                                 |
| Studio — Frames              | Painel de slides: selecionar, reordenar, duplicar, excluir; "Trocar capa"                                                                                      | ✅                                                                 |
| Studio — Preview             | Mockup do Instagram                                                                                                                                            | ✅                                                                 |
| Exportar                     | Slide atual, tudo em arquivos, .zip, PDF, vídeo MP4 (animações)                                                                                                | ✅ PNG/ZIP/PDF · ⏳ vídeo                                          |
| Brand Kit                    | Vários kits, kit padrão, nome/@/copyright, 3 cores (fundo, textos, destaque), fontes título/corpo (Google Fonts), logo, avatar, selo, fontes próprias (até 10) | ✅                                                                 |
| Editor Pro (admin)           | Editor de templates (feito em Polotno) que marca cada texto com um "papel"                                                                                     | ⏳ (templates são JSON editável; editor visual no roadmap)         |
| Reels                        | Gravar vídeo no navegador com teleprompter, câmera sobre o conteúdo, legendas                                                                                  | ⏳ roadmap                                                         |
| Tendências / Pautas          | Acervo de formatos virais com filtros por nicho                                                                                                                | ⏳ roadmap                                                         |
| Conquistas                   | Métricas (carrosséis, exports, tempo economizado) e medalhas                                                                                                   | ⏳ roadmap (contadores já salvos)                                  |
| Instagram                    | Publicar, agendar, analytics, concorrentes (via API do Facebook)                                                                                               | ⏳ roadmap                                                         |
| Assinatura                   | Planos via Hotmart, voucher de mentoria                                                                                                                        | ⏳ roadmap                                                         |

### Como o original funciona por dentro (o que observamos)

- **Stack deles:** React + Vite, editor em canvas com **Konva**, templates criados no
  **Polotno**, vídeo com **Remotion** renderizado no **Cloud Run**, dados no
  **Firebase** (Auth, Firestore, Storage), pagamentos Hotmart.
- **Template = N frames de 1080×1350**, cada frame é uma lista de **elementos
  posicionados** (`text`, `image`, `shape`) com x/y/largura/altura.
- Cada texto editável tem um **papel de autofill** com ordem global:
  `hook #1`, `subhook #2`, `titulo #3`, `subtitulo #4`, … `titulo #18`.
  O "Aplicar texto" pega as linhas coladas e preenche na ordem. É por isso que o GPT
  deles devolve "uma linha por campo".
- Textos com **escopo global** (`brand-name`, `copyright`, avatar) vêm dos Campos
  globais / Brand Kit e são iguais em todos os slides.
- Cores não são fixas: cada elemento aponta para um **token** (`brand-color`,
  `hook`, `metadado`…). Mudar o token repinta o carrossel inteiro.
- **Slots de imagem** numerados; o upload em lote preenche slot 1, 2, 3…
- Camadas de **gradiente** sobre foto com força ajustável.
- Grupos (avatar + @ + selo) se alinham sozinhos em linha.

---

## 2. Arquitetura do clone

```
┌───────────────────────── Navegador ─────────────────────────┐
│  React 19 + Vite + TypeScript + Tailwind                     │
│                                                              │
│  pages/        Home · Studio · BrandKits                     │
│  render/       SlideView  ← renderizador único (editor,      │
│                miniaturas, preview e export usam o mesmo)    │
│  templates/    templates em TypeScript (dados, não telas)    │
│  lib/          autofill · export (PNG/ZIP/PDF) · fontes ·    │
│                imagens · operações de template               │
│  store/        Zustand: dados do app + estado do editor      │
│                (undo/redo)                                   │
│  lib/db.ts     IndexedDB (idb-keyval)  ← trocar por          │
│                Supabase/Firebase quando quiser nuvem         │
└───────────────┬──────────────────────────────────────────────┘
                │ /api (fetch)
┌───────────────▼──────────── Servidor (Node) ────────────────┐
│  Express · server/index.ts                                   │
│  server/ai.ts → Claude (Anthropic SDK), saída JSON validada  │
│    POST /api/ai/carousel   gera as linhas do carrossel       │
│    POST /api/ai/headlines  10 opções de hook                 │
│    POST /api/ai/caption    legenda + hashtags                │
│  A chave ANTHROPIC_API_KEY fica só no servidor (.env)        │
└──────────────────────────────────────────────────────────────┘
```

### Por que essas escolhas

- **Renderização em HTML/CSS (não canvas):** fontes, gradientes, destaque por palavra
  e quebras de linha saem de graça; o mesmo componente desenha editor, miniatura,
  preview e export (`html-to-image`). Fica muito mais fácil de personalizar.
- **Templates como dados:** um template é um objeto com slides e elementos, igual ao
  original. Criar um template novo = escrever um arquivo em `src/templates/`.
  Um editor visual de templates (o "Editor Pro") pode ser construído em cima disso.
- **IA no servidor:** a chave da API nunca vai para o navegador. Sem chave, o app
  continua funcionando: o botão "Copiar prompt" gera um prompt para usar no
  ChatGPT/Claude e a caixa "Colar texto" aplica o resultado.
- **IndexedDB primeiro:** roda sem conta, sem backend de dados, sem custo. Toda
  leitura/escrita passa por `src/lib/db.ts`, então migrar para nuvem é trocar um
  arquivo.

### Modelo de dados (`src/types.ts`)

```
Project        { id, name, createdAt }
BrandKit       { id, name, brandName, handle, copyright,
                 colors {fundo, texto, destaque}, fonts {titulo, corpo},
                 logo?, avatar?, verified, isDefault }
Carousel       { id, projectId, name, templateId, funnel, format (4:5|9:16),
                 palette {token → cor}, fonts {titulo, corpo},
                 globals {brandName, handle, copyright, avatar?, verified},
                 highlight {modo, token}, slides[], caption, deletedAt? }
Slide          { id, name, background (token|cor), gradientStrength, elements[] }
Element        text    { texto, papel+ordem (autofill) | campo global, estilo }
               image   { slot nº, src, zoom, enquadramento, cantos, fullBleed }
               shape   { cor ou gradiente }
               profile { avatar + @ + selo, alinhados em linha }
               header  { @ · marca · copyright no topo }
               cta     { botão com ícone (sólido / contorno / glass) }
               stack   { coluna que empilha filhos ancorada embaixo/cima }
```

Tokens de cor: `fundo`, `fundo-alt`, `texto`, `texto-suave`, `destaque`, `hook`,
`meta`. O Brand Kit (3 cores) gera a paleta completa.

### Fluxos principais

1. **Criar carrossel:** escolhe template → `instantiateTemplate()` clona os slides com
   ids novos e aplica o Brand Kit padrão (paleta, fontes, campos globais).
2. **Preencher texto:** `getSlots()` lista os textos com papel em ordem →
   - IA: o servidor recebe a lista de slots (papel + limite de caracteres) e devolve
     exatamente uma linha por slot;
   - Manual: "Colar texto" → `applyLines()` preenche na ordem.
     Antes de aplicar, uma versão é salva no histórico.
3. **Editar:** clicar num elemento abre o inspetor; arrastar move (em imagem,
   arrastar ajusta o enquadramento; Shift+arrastar move); Ctrl+Z/Ctrl+Y.
4. **Trocar template:** extrai as linhas atuais e as imagens por slot e reaplica
   no novo template.
5. **Exportar:** renderiza cada slide fora da tela em 1080 px, embute fontes,
   gera PNG → ZIP (JSZip) ou PDF (jsPDF).

---

## 3. Roadmap sugerido (próximas versões)

1. **Nuvem e login:** Supabase (Auth + Postgres + Storage) implementando a mesma
   interface de `db.ts`; compartilhar projeto com equipe.
2. **Exportar vídeo:** animações de entrada por elemento + transições entre slides
   (Remotion no servidor, ou `ffmpeg.wasm` no navegador).
3. **Editor de templates** visual (arrastar elementos, marcar papéis de autofill).
4. **Banco de imagens/IA de imagem** para preencher slots a partir de uma
   descrição.
5. **Publicar/agendar no Instagram** (Graph API) e analytics.
6. **Reels com teleprompter**, Tendências e Conquistas.
7. **Planos e pagamentos** (Stripe ou Hotmart) se for vender o sistema.
