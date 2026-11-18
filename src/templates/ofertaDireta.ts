import type { Template, TextElement } from '../types'
import { cta, H, header, img, INNER, M, profile, rect, slide, stack, text } from './builders'

const SERIF = { font: 'titulo', weight: 600, lineHeight: 1.06, letterSpacing: -0.015 } as const
const label = (t: string, color: 'destaque' | 'texto' = 'destaque') =>
  text(
    undefined,
    t,
    { y: 140, h: 40 },
    { size: 22, weight: 700, letterSpacing: 0.14, uppercase: true, color },
  )

/** Título + subtítulo empilhados (o subtítulo acompanha a altura do título). */
const block = (h: number, ...children: TextElement[]) =>
  stack({ x: M, y: 220, w: INNER, h }, 'top', children, 30)

export const ofertaDireta: Template = {
  id: 'oferta-direta',
  name: 'Oferta Direta',
  description:
    'Problema, custo, solução, prova e oferta. Estrutura de venda em carrossel, com títulos serifados.',
  funnel: 'fundo',
  mode: 'claro',
  fonts: { titulo: 'Fraunces', corpo: 'Inter' },
  slides: [
    slide('Capa', 'texto', [
      header('fundo'),
      stack(
        { x: M, y: 200, w: INNER, h: H - 320 },
        'bottom',
        [
          rect({ x: 0, y: 0, w: 120, h: 12 }, 'destaque', 6),
          text(
            'hook',
            'Você não precisa de mais seguidores. Precisa de ==clientes==.',
            { h: 480 },
            { ...SERIF, size: 92, color: 'fundo' },
          ),
          text(
            'subhook',
            'Como transformar o perfil que você já tem numa máquina de conversas de venda.',
            { h: 100 },
            { size: 32, color: 'fundo' },
            { opacity: 0.8 },
          ),
          profile({ avatarSize: 48, fontSize: 24, color: 'fundo' }),
        ],
        36,
      ),
    ]),
    slide('Problema', 'fundo', [
      header('meta'),
      label('O problema'),
      block(
        1000,
        text('titulo', 'Muito alcance, ==pouca conversa==', { h: 300 }, { ...SERIF, size: 78 }),
        text(
          'subtitulo',
          'Os posts até performam, mas o direct fica vazio. O conteúdo atrai curiosos, não compradores.',
          { h: 220 },
          { size: 34, color: 'texto-suave' },
        ),
      ),
    ]),
    slide('Custo', 'fundo-alt', [
      header('meta'),
      label('O custo de ignorar'),
      block(
        1000,
        text(
          'titulo',
          'Cada mês assim é ==faturamento== que fica na mesa',
          { h: 380 },
          { ...SERIF, size: 74 },
        ),
        text(
          'subtitulo',
          'E a sensação de trabalhar muito no Instagram sem saber o que realmente traz resultado.',
          { h: 220 },
          { size: 34, color: 'texto-suave' },
        ),
      ),
    ]),
    slide('Solução', 'fundo', [
      header('meta'),
      label('A solução'),
      block(
        540,
        text(
          'titulo',
          'Conteúdo com ==intenção== em cada etapa do funil',
          { h: 280 },
          { ...SERIF, size: 66 },
        ),
        text(
          'subtitulo',
          'Topo para atrair, meio para gerar confiança e fundo para convidar para a conversa.',
          { h: 160 },
          { size: 32, color: 'texto-suave' },
        ),
      ),
      img(1, { y: 790, h: 490 }, { radius: 28 }),
    ]),
    slide('Prova', 'texto', [
      header('fundo'),
      label('Prova'),
      block(
        480,
        text(
          'titulo',
          'Resultados de quem ==aplicou== o método',
          { h: 250 },
          { ...SERIF, size: 66, color: 'fundo' },
        ),
        text(
          'subtitulo',
          'Coloque aqui um print de depoimento, um número real do seu cliente ou um antes e depois.',
          { h: 160 },
          { size: 32, color: 'fundo' },
          { opacity: 0.78 },
        ),
      ),
      img(2, { y: 730, h: 550 }, { radius: 28 }),
    ]),
    slide('Oferta', 'destaque', [
      header('texto'),
      label('A oferta', 'texto'),
      block(
        1000,
        text(
          'titulo',
          'Mentoria de 8 semanas para montar seu ==funil de conteúdo==',
          { h: 420 },
          { ...SERIF, size: 74, lineHeight: 1.18, highlight: 'texto', highlightMode: 'fundo' },
        ),
        text(
          'subtitulo',
          'Encontros semanais, revisão dos seus posts e um plano de 90 dias pronto para executar.',
          { h: 220 },
          { size: 34 },
        ),
      ),
    ]),
    slide('CTA', 'fundo', [
      header('meta'),
      stack(
        { x: M, y: 160, w: INNER, h: H - 320 },
        'center',
        [
          profile({
            avatarSize: 112,
            fontSize: 32,
            showName: true,
            color: 'texto',
            align: 'center',
            h: 130,
          }),
          text(
            'cta',
            'Comente ==FUNIL== que eu te chamo no direct',
            { h: 260 },
            { ...SERIF, size: 66, align: 'center' },
          ),
          text(
            'subtitulo',
            'Vagas limitadas para manter o acompanhamento próximo.',
            { h: 60 },
            { size: 30, color: 'texto-suave', align: 'center' },
          ),
          cta('Quero participar', { icon: 'seta', align: 'center' }),
        ],
        34,
      ),
    ]),
  ],
}
