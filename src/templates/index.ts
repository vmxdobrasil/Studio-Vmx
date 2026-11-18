import type { Template } from '../types'
import { adaptaComparativo, adaptaNoticia, adaptaRaioX } from './adapta'
import { analiseCapitulos, caseEditorial, opiniaoEditorial } from './editorial'
import { editorialFoto } from './editorialFoto'
import { manifestoFotos, playbookPrincipios, selecaoComentada } from './estudos'
import { guiaIlustrado, minimalDidatico, principiosAnotados } from './guias'
import { listaDaMorte } from './listaDaMorte'
import { listaCondensada } from './listaCondensada'
import { adaptaEstudo, adaptaHistoria, frasesDeMarca } from './marcas'
import { ofertaDireta } from './ofertaDireta'
import { twitterClaro, twitterEscuro } from './twitter'

/** Registro de templates. Para criar um novo, copie um arquivo desta pasta e adicione aqui. */
export const TEMPLATES: Template[] = [
  editorialFoto,
  twitterClaro,
  twitterEscuro,
  caseEditorial,
  opiniaoEditorial,
  adaptaRaioX,
  adaptaComparativo,
  adaptaNoticia,
  listaCondensada,
  listaDaMorte,
  analiseCapitulos,
  ofertaDireta,
  playbookPrincipios,
  selecaoComentada,
  manifestoFotos,
  guiaIlustrado,
  minimalDidatico,
  principiosAnotados,
  frasesDeMarca,
  adaptaHistoria,
  adaptaEstudo,
]

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}

export const FUNNEL_INFO = {
  topo: {
    label: 'Topo de funil',
    hint: 'Para quem ainda não te conhece. Ganchos curtos, polêmica, frases de impacto. Foco em alcance.',
  },
  meio: {
    label: 'Meio de funil',
    hint: 'Para quem já te segue. Listas, tutoriais, comparações. Foco em aprofundar e gerar confiança.',
  },
  fundo: {
    label: 'Fundo de funil',
    hint: 'Para quem está pronto para comprar. Problema, solução, prova e oferta. Foco em conversão.',
  },
} as const
