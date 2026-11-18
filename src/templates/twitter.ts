import type { LeafElement, Template } from '../types'
import { H, img, profile, slide, stack, text } from './builders'

const PAD = 88
const WIDTH = 1080 - PAD * 2

const who = () =>
  profile({
    x: PAD,
    w: WIDTH,
    avatarSize: 108,
    fontSize: 38,
    showName: true,
    color: 'texto',
    h: 116,
  })
const title = (role: 'hook' | 'titulo' | 'cta', t: string, h = 220) =>
  text(role, t, { x: PAD, w: WIDTH, h }, { size: 54, weight: 700, lineHeight: 1.26 })
const body = (role: 'subhook' | 'subtitulo', t: string, h = 220) =>
  text(role, t, { x: PAD, w: WIDTH, h }, { size: 45, lineHeight: 1.34 })
const photo = (slot: number, h = 470) => img(slot, { x: PAD, w: WIDTH, h }, { radius: 26 })

const post = (name: string, children: LeafElement[]) =>
  slide(name, 'fundo', [
    stack({ x: PAD, y: 0, w: WIDTH, h: H }, 'center', [who(), ...children], 34),
  ])

function build(mode: 'claro' | 'escuro'): Template {
  return {
    id: mode === 'claro' ? 'twitter-claro' : 'twitter-escuro',
    name: mode === 'claro' ? 'Post estilo Twitter' : 'Post estilo Twitter (escuro)',
    description:
      'Visual de tweet: foto de perfil, nome, selo e texto. Leve, direto e muito compartilhável.',
    funnel: 'topo',
    mode,
    highlight: { mode: 'fundo', color: 'destaque' },
    slides: [
      post('Capa', [
        title(
          'hook',
          'Como vender ==1 milhão de livros== em um dia quando o livro é o produto menos importante',
          260,
        ),
        body(
          'subhook',
          'O que se vende de verdade é acesso. E isso muda como você deveria lançar qualquer coisa.',
        ),
        photo(1),
      ]),
      post('Slide 2', [
        title('titulo', 'O lançamento foi desenhado ao contrário'),
        body(
          'subtitulo',
          'Primeiro vieram a comunidade e o evento ao vivo. O livro foi só o ingresso para entrar.',
        ),
      ]),
      post('Slide 3', [
        title('titulo', 'O preço baixo ==não era desconto=='),
        photo(2, 420),
        body(
          'subtitulo',
          'Era aquisição de cliente. Cada comprador entrou numa lista que vale muito mais que o livro.',
          180,
        ),
      ]),
      post('Slide 4', [
        title('titulo', 'Escassez de verdade, não de mentira'),
        body(
          'subtitulo',
          'Bônus que só existiam naquele dia, ao vivo. Quem perdeu, perdeu. Por isso as pessoas compraram na hora.',
        ),
      ]),
      post('Slide 5', [title('titulo', 'O conteúdo veio ==antes== da venda', 160), photo(3, 520)]),
      post('Slide 6', [
        title('titulo', 'A lição para negócios pequenos'),
        body(
          'subtitulo',
          'Você não precisa de um milhão de seguidores. Precisa de um motivo forte para alguém entrar na sua lista hoje.',
        ),
      ]),
      post('CTA', [
        title('cta', 'Salva esse post e usa no seu ==próximo lançamento==.'),
        body(
          'subtitulo',
          'Comenta LANÇAMENTO que eu te mando o checklist que uso com meus clientes.',
        ),
      ]),
    ],
  }
}

export const twitterClaro = build('claro')
export const twitterEscuro = build('escuro')
