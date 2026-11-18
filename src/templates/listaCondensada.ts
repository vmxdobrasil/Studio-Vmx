import type { Template } from '../types'
import {
  cta,
  fullImage,
  gradient,
  H,
  header,
  img,
  INNER,
  M,
  profile,
  slide,
  stack,
  text,
} from './builders'

const HEAD = {
  font: 'titulo',
  weight: 400,
  lineHeight: 0.98,
  letterSpacing: 0,
  uppercase: true,
} as const

const item = (n: number, slot: number | undefined, title: string, sub: string) =>
  slide(`Item ${n}`, n % 2 ? 'fundo' : 'fundo-alt', [
    header('meta'),
    text(
      undefined,
      String(n).padStart(2, '0'),
      { y: 120, h: 190 },
      { ...HEAD, size: 170, color: 'destaque' },
    ),
    stack(
      { x: M, y: 330, w: INNER, h: slot ? 540 : 900 },
      'top',
      [
        text('titulo', title, { h: slot ? 250 : 380 }, { ...HEAD, size: 76 }),
        text('subtitulo', sub, { h: slot ? 200 : 320 }, { size: 32, color: 'texto-suave' }),
      ],
      28,
    ),
    ...(slot ? [img(slot, { y: 900, h: 380 }, { radius: 24 })] : []),
  ])

export const listaCondensada: Template = {
  id: 'lista-condensada',
  name: 'Lista Condensada',
  description:
    'Listas numeradas com títulos em caixa alta condensada. Ideal para passo a passo e erros comuns.',
  funnel: 'meio',
  mode: 'escuro',
  fonts: { titulo: 'Anton', corpo: 'Inter' },
  slides: [
    slide('Capa', 'fundo', [
      fullImage(1),
      gradient({ color: 'fundo', from: 0.2, to: 0.78, opacity: 1 }),
      header('hook'),
      stack(
        { x: M, y: 520, w: INNER, h: 760 },
        'bottom',
        [
          profile({ avatarSize: 48, fontSize: 24 }),
          text(
            'hook',
            '5 erros que ==travam== o seu perfil no Instagram',
            { h: 380 },
            { ...HEAD, size: 108, color: 'hook' },
          ),
          text(
            'subhook',
            'O terceiro é o que mais separa post de cliente.',
            { h: 60 },
            { size: 30, color: 'hook' },
            { opacity: 0.85 },
          ),
        ],
        24,
      ),
    ]),
    item(
      1,
      2,
      'Postar sem ==saber para quem==',
      'Se o post serve para todo mundo, não prende ninguém. Escreva pensando em uma pessoa específica.',
    ),
    item(
      2,
      undefined,
      'Gancho fraco na capa',
      'A capa é o anúncio do carrossel. Se ela não cria tensão nos primeiros dois segundos, ninguém desliza.',
    ),
    item(
      3,
      3,
      'Conteúdo sem ==próximo passo==',
      'Todo post precisa dizer o que fazer depois: salvar, comentar, chamar no direct ou ir para o link.',
    ),
    item(
      4,
      undefined,
      'Copiar formato sem copiar a lógica',
      'Tendência funciona pela mecânica, não pela estética. Entenda por que viralizou antes de adaptar.',
    ),
    item(
      5,
      4,
      'Medir só curtidas',
      'Salvamentos, compartilhamentos e mensagens dizem muito mais sobre intenção de compra.',
    ),
    slide('Resumo', 'destaque', [
      header('fundo'),
      stack(
        { x: M, y: 140, w: INNER, h: 1100 },
        'center',
        [
          text(
            'titulo',
            'Corrija ==um por semana==, não todos de uma vez',
            { h: 520 },
            {
              ...HEAD,
              size: 104,
              lineHeight: 1.16,
              color: 'fundo',
              highlight: 'fundo',
              highlightMode: 'fundo',
            },
          ),
          text(
            'subtitulo',
            'Consistência ganha de perfeição. Escolha o erro que mais aparece no seu perfil e comece por ele.',
            { h: 220 },
            { size: 34, color: 'fundo' },
          ),
        ],
        40,
      ),
    ]),
    slide('CTA', 'fundo', [
      header('meta'),
      stack(
        { x: M, y: 180, w: INNER, h: H - 360 },
        'center',
        [
          text(
            'cta',
            'Qual desses ==você comete==? Conta nos comentários',
            { h: 360 },
            { ...HEAD, size: 86, align: 'center' },
          ),
          text(
            'subtitulo',
            'Salve para revisar antes do próximo post.',
            { h: 60 },
            { size: 32, color: 'texto-suave', align: 'center' },
          ),
          cta('Comentar', { icon: 'comentar', align: 'center', textColor: 'fundo' }),
        ],
        40,
      ),
    ]),
  ],
}
