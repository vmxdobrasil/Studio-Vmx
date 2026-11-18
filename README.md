# Carrossel Studio

Sistema próprio para criar carrosséis de Instagram: templates por etapa do funil,
preenchimento automático de texto (IA ou colado), editor visual, Brand Kit e
exportação em PNG, ZIP e PDF.

A arquitetura e o mapa de funcionalidades estão em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Como rodar

Requisitos: Node.js 20 ou mais novo.

```bash
npm install
```

```bash
cp .env.example .env
```

Abra o `.env` e cole sua chave em `ANTHROPIC_API_KEY=` (crie em console.anthropic.com).
Sem a chave o app funciona normalmente; só os botões de IA ficam indisponíveis. Nesse caso,
use a aba **Prompt** (copia um prompt pronto para o ChatGPT/Claude) e depois **Colar texto**.

```bash
npm run dev
```

Abra http://localhost:5173. O front-end roda na porta 5173 e a API de IA na 8787.

### Produção

```bash
npm run build
```

```bash
npm start
```

Um único servidor (porta `API_PORT`, padrão 8787) entrega o app e a API.

## Como usar

1. **Início**: crie um projeto (funciona como pasta) e um carrossel escolhendo o template
   pela etapa do funil.
2. **Studio**:
   - **Criador de conteúdo**: gere com IA a partir de um briefing, cole texto pronto (uma linha
     por campo, na ordem) ou copie um prompt para usar em outra IA.
   - Clique em qualquer elemento do slide para editar no painel da direita. Arraste para
     mover; em imagens, arrastar ajusta o enquadramento (Shift + arrastar move o quadro).
   - `==palavra==` destaca e `**palavra**` deixa em negrito.
   - No "Colar texto", cada linha preenche um campo. Para quebrar parágrafo dentro do mesmo
     campo, escreva `\n` no meio da linha.
   - Ctrl+Z / Ctrl+Y desfazem e refazem, as setas movem o elemento ou trocam de slide e
     Ctrl+V cola uma imagem.
   - **Exportar**: slide atual, todos em PNG, ZIP (com a legenda) ou PDF.
3. **Brand Kit**: cores, fontes, @, avatar e logo. O kit padrão é aplicado em todo carrossel novo.

Os dados ficam salvos no navegador (IndexedDB). Limpar os dados do site apaga os carrosséis.

## Onde personalizar

| O que | Onde |
|---|---|
| Nome do app | `src/config.ts` (`APP_NAME`) |
| Fontes do seletor | `src/config.ts` (`FONT_LIST`) |
| Cores e fontes da interface | `src/index.css` (`@theme`), seguindo o `DESIGN.md` |
| Templates | `src/templates/` (copie um arquivo e registre em `index.ts`) |
| Prompts e modelo de IA | `server/ai.ts` |
| Salvamento (trocar por nuvem) | `src/lib/db.ts` |
| Renderização dos slides | `src/render/SlideView.tsx` |

### Templates incluídos

| Template | Funil | Proporção |
|---|---|---|
| Editorial Foto | Topo | 4:5 |
| Post estilo Twitter (claro e escuro) | Topo | 4:5 |
| Case Editorial | Topo | 3:4 |
| Opinião Editorial | Topo | 3:4 |
| Raio-X de Perfil | Topo | 4:5 |
| Comparativo de IAs | Topo | 4:5 |
| Notícia Explicada | Topo | 4:5 |
| Lista Condensada | Meio | 4:5 |
| Análise em Capítulos | Meio | 3:4 |
| Oferta Direta | Fundo | 4:5 |
| Playbook em Princípios | Meio | 4:5 |
| Seleção Comentada | Meio | 4:5 |
| Manifesto em Fotos | Topo | 4:5 |
| Guia Ilustrado | Meio | 3:4 |
| Minimal Didático | Meio | 4:5 |
| Princípios Anotados | Topo | 1:1 |
| Frases de Marca | Topo | 4:5 |
| História em Citação | Topo | 4:5 |
| Estudo Explicado | Meio | 4:5 |

Os três templates 3:4 (`src/templates/editorial.ts`) seguem o visual de revista: fundo
escuro, cabeçalho com assinatura (campo "Tagline"), rodapé em pílulas e cor de apoio.

Raio-X de Perfil, Comparativo de IAs e Notícia Explicada (`src/templates/adapta.ts`)
seguem o visual da Adapta: capa com título condensado, logo da marca no topo (envie o
logo em Campos globais), cartões com ícone e rodapé com perfil. Eles têm cores próprias
(verde de destaque e laranja de apoio), que ficam no campo `colors` do template e podem ser
mudadas em "Cores e destaque" no Studio.

Os nove templates mais recentes ficam em `src/templates/estudos.ts`, `guias.ts` e
`marcas.ts`. Eles usam alguns recursos extras:

- **Contador de páginas** (`counter`): "02 / 08", "02" ou quadradinhos de progresso, sempre
  atualizado quando você adiciona ou remove slides.
- **Rabiscos à mão** (`doodle`): seta curva, seta, sublinhado e círculo, com a fonte Caveat
  para anotações.
- **Texto justificado e girado**, e as marcações `_itálico_` e `~~tachado~~` direto no texto.
- **Foto em preto e branco** (opção "Cores" no painel da imagem).
- **Textura de triângulos** e borda pontilhada nas formas.
- Proporção **1:1** (1080×1080), usada em Princípios Anotados.

Os campos "Tagline / assinatura" e "Copyright" de Campos globais aparecem nos cabeçalhos e
rodapés de Minimal Didático e Frases de Marca.

### Criando um template

Um template é uma lista de slides; cada slide tem elementos posicionados num canvas de
1080×1350:

```ts
slide("Capa", "texto", [
  fullImage(1),                                   // foto de fundo (slot 1)
  gradient({ from: 0.3, to: 1, opacity: 0.9 }),   // escurece embaixo
  header("hook"),                                 // @ · marca · copyright
  stack({ x: M, y: 560, w: INNER, h: 720 }, "bottom", [
    profile(),
    text("hook", "Título da capa", { h: 330 }, { font: "titulo", size: 78, weight: 800, color: "hook" }),
    text("subhook", "Linha de apoio", { h: 95 }, { size: 30, color: "hook" }),
  ]),
]);
```

Textos com papel (`hook`, `subhook`, `titulo`, `subtitulo`, `cta`) entram no
preenchimento automático, na ordem em que aparecem. As cores usam tokens (`fundo`,
`texto`, `destaque`, `hook`…) que vêm do Brand Kit.