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

const T = { font: 'titulo', weight: 800, lineHeight: 1.04, letterSpacing: -0.02 } as const

const photoSlide = (name: string, slot: number, title: string, sub: string) =>
  slide(name, 'texto', [
    fullImage(slot),
    gradient({ from: 0.25, to: 0.95, opacity: 0.92 }),
    header('hook'),
    stack(
      { x: M, y: 520, w: INNER, h: 740 },
      'bottom',
      [
        text('titulo', title, { h: 300 }, { ...T, size: 66, color: 'hook' }),
        text('subtitulo', sub, { h: 170 }, { size: 31, color: 'hook' }, { opacity: 0.86 }),
      ],
      26,
    ),
  ])

const splitSlide = (
  name: string,
  bg: 'fundo' | 'fundo-alt',
  slot: number,
  title: string,
  sub: string,
  imageTop = false,
) =>
  slide(name, bg, [
    header('meta'),
    img(slot, { y: imageTop ? 120 : 712, h: imageTop ? 560 : 566 }, { radius: 28 }),
    stack(
      { x: M, y: imageTop ? 730 : 128, w: INNER, h: 540 },
      'top',
      [
        text('titulo', title, { h: 270 }, { ...T, size: 60 }),
        text('subtitulo', sub, { h: 200 }, { size: 31, color: 'texto-suave' }),
      ],
      28,
    ),
  ])

export const editorialFoto: Template = {
  id: 'editorial-foto',
  name: 'Editorial Foto',
  description: 'Capa com foto e gradiente, alternando slides de foto cheia e texto + imagem.',
  funnel: 'topo',
  mode: 'claro',
  slides: [
    slide('Capa', 'texto', [
      fullImage(1),
      gradient({ from: 0.3, to: 1, opacity: 0.94 }),
      header('hook'),
      stack(
        { x: M, y: 560, w: INNER, h: 720 },
        'bottom',
        [
          profile({ avatarSize: 50, fontSize: 25 }),
          text(
            'hook',
            'O ==home office== não acabou. Ele só mudou de endereço',
            { h: 330 },
            { ...T, size: 78, color: 'hook' },
          ),
          text(
            'subhook',
            'As empresas que voltaram ao presencial descobriram um custo que não estava na planilha.',
            { h: 95 },
            { size: 30, color: 'hook' },
            { opacity: 0.86 },
          ),
        ],
        24,
      ),
    ]),
    splitSlide(
      'Slide 2',
      'fundo',
      2,
      'Em 2020, trabalhar de casa era ==sobrevivência==',
      'Ninguém planejou. O escritório virou a mesa da cozinha e as reuniões viraram janelas de vídeo empilhadas.',
    ),
    photoSlide(
      'Slide 3',
      3,
      'O problema nunca foi o ==lugar==',
      'Foi a falta de rituais. Sem eles, a casa vira escritório e o escritório vira lugar nenhum.',
    ),
    splitSlide(
      'Slide 4',
      'fundo-alt',
      4,
      'Quem acertou trocou ==controle== por clareza',
      'Metas visíveis, combinados escritos e menos reuniões de status. Presença deixou de ser métrica.',
      true,
    ),
    slide('Slide 5', 'destaque', [
      header('texto'),
      stack(
        { x: M, y: 140, w: INNER, h: 1100 },
        'center',
        [
          text(
            'titulo',
            'Escritório virou ==ponto de encontro==, não de expediente',
            { h: 520 },
            {
              ...T,
              size: 90,
              weight: 900,
              lineHeight: 1.16,
              color: 'texto',
              highlight: 'texto',
              highlightMode: 'fundo',
            },
          ),
          text(
            'subtitulo',
            'As pessoas vão quando faz sentido: para criar junto, decidir e celebrar.',
            { h: 160 },
            { size: 34, color: 'texto' },
          ),
        ],
        40,
      ),
    ]),
    photoSlide(
      'Slide 6',
      5,
      'O novo luxo é ==escolher== onde render',
      'Times maduros combinam dias de foco em casa com dias de troca no escritório, e combinam isso por escrito.',
    ),
    slide('Slide 7', 'texto', [
      header('fundo'),
      stack(
        { x: M, y: 140, w: INNER, h: 1100 },
        'center',
        [
          text(
            'titulo',
            'A pergunta certa não é ==onde==, é como',
            { h: 420 },
            { ...T, size: 76, color: 'fundo' },
          ),
          text(
            'subtitulo',
            'Se o trabalho só acontece quando alguém está olhando, o problema não é o modelo. É a gestão.',
            { h: 200 },
            { size: 34, color: 'fundo' },
            { opacity: 0.78 },
          ),
        ],
        36,
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
            'Salve para ==lembrar== na próxima reunião de planejamento',
            { h: 260 },
            { ...T, size: 58, align: 'center' },
          ),
          text(
            'subtitulo',
            'E mande para aquele gestor que ainda mede produtividade por cadeira ocupada.',
            { h: 120 },
            { size: 30, color: 'texto-suave', align: 'center' },
          ),
          cta('Salvar post', { icon: 'salvar', align: 'center' }),
        ],
        34,
      ),
    ]),
  ],
}
