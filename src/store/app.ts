import { create } from 'zustand'
import * as db from '../services/cloud'
import { cloneSlides, renumber } from '../lib/elements'
import { registerCustomFonts } from '../lib/fonts'
import { uid } from '../lib/id'
import { instantiateTemplate } from '../lib/templateOps'
import { getTemplate } from '../templates'
import type { BrandKit, Carousel, CustomFont, Project, Settings, VersionReason } from '../types'
import { DEFAULT_KIT_COLORS } from '../lib/colors'

type SaveState = 'salvo' | 'salvando' | 'erro'

interface AppState {
  ready: boolean
  /** Erro ao carregar os dados do usuário (sem conexão, por exemplo). */
  loadError: string | null
  saveState: SaveState
  projects: Project[]
  carousels: Record<string, Carousel>
  brandKits: BrandKit[]
  fonts: CustomFont[]
  settings: Settings

  hydrate: () => Promise<void>
  /** Limpa tudo da memória (ao sair da conta). */
  reset: () => void

  createProject: (name: string) => Project
  renameProject: (id: string, name: string) => void
  deleteProject: (id: string) => void

  createCarousel: (opts: {
    name: string
    projectId: string
    templateId: string
    brandKitId?: string
  }) => Carousel
  putCarousel: (c: Carousel) => void
  duplicateCarousel: (id: string) => Carousel | undefined
  trashCarousel: (id: string) => void
  restoreCarousel: (id: string) => void
  purgeCarousel: (id: string) => void
  moveCarousel: (id: string, projectId: string) => void
  reorderCarousels: (projectId: string, orderedIds: string[]) => void

  saveBrandKit: (kit: BrandKit) => void
  deleteBrandKit: (id: string) => void
  setDefaultKit: (id: string) => void

  addFont: (file: File, family: string) => Promise<void>
  removeFont: (id: string) => void

  bumpExports: () => void
  dismissOnboarding: () => void

  addVersion: (carouselId: string, reason: VersionReason, label: string) => Promise<void>
}

const EMPTY = {
  ready: false,
  loadError: null,
  saveState: 'salvo' as SaveState,
  projects: [],
  carousels: {},
  brandKits: [],
  fonts: [],
  settings: { exportsCount: 0 },
}

// Salvamento com debounce por carrossel.
const pending = new Map<string, ReturnType<typeof setTimeout>>()
let inFlight = 0

export const useApp = create<AppState>((set, get) => {
  /** Acompanha uma gravação na nuvem e mostra "Salvando / Salvo / Erro ao salvar". */
  const track = (save: Promise<unknown>) => {
    inFlight++
    set({ saveState: 'salvando' })
    save
      .then(() => {
        inFlight--
        if (inFlight === 0 && pending.size === 0 && get().saveState !== 'erro')
          set({ saveState: 'salvo' })
      })
      .catch((err) => {
        inFlight--
        console.error(err)
        set({ saveState: 'erro' })
      })
  }

  const persistCarousel = (c: Carousel) => {
    clearTimeout(pending.get(c.id))
    set({ saveState: 'salvando' })
    pending.set(
      c.id,
      setTimeout(() => {
        pending.delete(c.id)
        const latest = get().carousels[c.id]
        if (latest) track(db.saveCarousel(latest))
      }, 800),
    )
  }

  const setCarousel = (c: Carousel) => {
    set((s) => ({ carousels: { ...s.carousels, [c.id]: c } }))
    persistCarousel(c)
  }

  /** Grava só os kits que mudaram e apaga os que saíram da lista. */
  const setKits = (brandKits: BrandKit[]) => {
    const before = new Map(get().brandKits.map((k) => [k.id, JSON.stringify(k)]))
    set({ brandKits })
    brandKits
      .filter((k) => before.get(k.id) !== JSON.stringify(k))
      .forEach((k) => track(db.saveBrandKit(k)))
    const ids = new Set(brandKits.map((k) => k.id))
    ;[...before.keys()].filter((id) => !ids.has(id)).forEach((id) => track(db.deleteBrandKit(id)))
  }

  const setSettings = (settings: Settings) => {
    set({ settings })
    track(db.saveSettings(settings))
  }

  return {
    ...EMPTY,

    hydrate: async () => {
      set({ loadError: null })
      let data: Awaited<ReturnType<typeof db.loadAll>>
      try {
        data = await db.loadAll()
      } catch (err) {
        console.error(err)
        set({
          loadError:
            'Não foi possível carregar seus carrosséis. Verifique a conexão e tente de novo.',
        })
        return
      }
      let brandKits = data.brandKits
      if (brandKits.length === 0) {
        const kit: BrandKit = {
          id: uid('k_'),
          name: 'Minha marca',
          brandName: 'Sua Marca',
          handle: '@seuperfil',
          copyright: `© ${new Date().getFullYear()}`,
          colors: { ...DEFAULT_KIT_COLORS },
          fonts: { titulo: 'Inter', corpo: 'Inter' },
          verified: true,
          isDefault: true,
        }
        brandKits = [kit]
        track(db.saveBrandKit(kit))
      }
      registerCustomFonts(data.fonts)
      set({
        ready: true,
        projects: [...data.projects].sort((a, b) => a.createdAt - b.createdAt),
        brandKits,
        fonts: data.fonts,
        settings: data.settings,
        carousels: Object.fromEntries(data.carousels.map((c) => [c.id, c])),
      })
    },

    reset: () => {
      pending.forEach((t) => clearTimeout(t))
      pending.clear()
      registerCustomFonts([])
      set({ ...EMPTY })
    },

    createProject: (name) => {
      const p: Project = {
        id: uid('p_'),
        name: name.trim() || 'Novo projeto',
        createdAt: Date.now(),
      }
      set({ projects: [...get().projects, p] })
      track(db.saveProject(p))
      return p
    },
    renameProject: (id, name) => {
      const projects = get().projects.map((p) => (p.id === id ? { ...p, name } : p))
      set({ projects })
      const p = projects.find((x) => x.id === id)
      if (p) track(db.saveProject(p))
    },
    deleteProject: (id) => {
      // Os carrosséis do projeto vão para a lixeira (dá para restaurar em outro projeto).
      const now = Date.now()
      Object.values(get().carousels)
        .filter((c) => c.projectId === id && !c.deletedAt)
        .forEach((c) => setCarousel({ ...c, deletedAt: now }))
      set({ projects: get().projects.filter((p) => p.id !== id) })
      track(db.deleteProject(id))
    },

    createCarousel: ({ name, projectId, templateId, brandKitId }) => {
      const kit = get().brandKits.find((k) => k.id === brandKitId)
      const c = instantiateTemplate(getTemplate(templateId), { projectId, name, kit })
      setCarousel(c)
      return c
    },
    putCarousel: (c) => setCarousel({ ...c, updatedAt: Date.now() }),
    duplicateCarousel: (id) => {
      const src = get().carousels[id]
      if (!src) return
      const now = Date.now()
      const copy: Carousel = {
        ...structuredClone(src),
        id: uid('c_'),
        name: `${src.name} (cópia)`,
        slides: renumber(cloneSlides(src.slides)),
        createdAt: now,
        updatedAt: now,
        deletedAt: undefined,
      }
      setCarousel(copy)
      return copy
    },
    trashCarousel: (id) => {
      const c = get().carousels[id]
      if (c) setCarousel({ ...c, deletedAt: Date.now() })
    },
    restoreCarousel: (id) => {
      const c = get().carousels[id]
      if (!c) return
      const projectExists = get().projects.some((p) => p.id === c.projectId)
      const projectId = projectExists
        ? c.projectId
        : (get().projects[0]?.id ?? get().createProject('Recuperados').id)
      setCarousel({ ...c, deletedAt: undefined, projectId })
    },
    purgeCarousel: (id) => {
      clearTimeout(pending.get(id))
      pending.delete(id)
      const { [id]: _removed, ...rest } = get().carousels
      set({ carousels: rest })
      track(db.deleteCarousel(id))
    },
    moveCarousel: (id, projectId) => {
      const c = get().carousels[id]
      if (c) setCarousel({ ...c, projectId, position: undefined, updatedAt: Date.now() })
    },
    reorderCarousels: (projectId, orderedIds) => {
      orderedIds.forEach((id, position) => {
        const c = get().carousels[id]
        if (c && c.projectId === projectId && c.position !== position)
          setCarousel({ ...c, position })
      })
    },

    saveBrandKit: (kit) => {
      const kits = get().brandKits
      const exists = kits.some((k) => k.id === kit.id)
      let next = exists ? kits.map((k) => (k.id === kit.id ? kit : k)) : [...kits, kit]
      if (kit.isDefault) next = next.map((k) => ({ ...k, isDefault: k.id === kit.id }))
      if (!next.some((k) => k.isDefault) && next[0]) next[0] = { ...next[0], isDefault: true }
      setKits(next)
    },
    deleteBrandKit: (id) => {
      let next = get().brandKits.filter((k) => k.id !== id)
      if (!next.some((k) => k.isDefault) && next[0])
        next = next.map((k, i) => ({ ...k, isDefault: i === 0 }))
      setKits(next)
    },
    setDefaultKit: (id) => setKits(get().brandKits.map((k) => ({ ...k, isDefault: k.id === id }))),

    addFont: async (file, family) => {
      // Uma fonte com o mesmo nome é substituída; o limite é 10.
      const same = get().fonts.filter((x) => x.family === family)
      const font = await db.uploadFont(file, family)
      same.forEach((f) => track(db.deleteFont(f.id)))
      const fonts = [...get().fonts.filter((x) => x.family !== family), font]
      fonts.slice(0, Math.max(0, fonts.length - 10)).forEach((f) => track(db.deleteFont(f.id)))
      const kept = fonts.slice(-10)
      registerCustomFonts(kept)
      set({ fonts: kept })
    },
    removeFont: (id) => {
      const fonts = get().fonts.filter((f) => f.id !== id)
      registerCustomFonts(fonts)
      set({ fonts })
      track(db.deleteFont(id))
    },

    bumpExports: () =>
      setSettings({ ...get().settings, exportsCount: get().settings.exportsCount + 1 }),
    dismissOnboarding: () => setSettings({ ...get().settings, onboardingDismissed: true }),

    addVersion: async (carouselId, reason, label) => {
      const c = get().carousels[carouselId]
      if (!c) return
      // O histórico é uma rede de segurança: se falhar, a edição segue normalmente.
      await db
        .addVersion(carouselId, {
          id: uid('v_'),
          at: Date.now(),
          reason,
          label,
          snapshot: {
            slides: c.slides,
            palette: c.palette,
            fonts: c.fonts,
            globals: c.globals,
            highlight: c.highlight,
            templateId: c.templateId,
            format: c.format,
            baseFormat: c.baseFormat,
          },
        })
        .catch((err) => console.error(err))
    },
  }
})

export function activeCarousels(carousels: Record<string, Carousel>) {
  return Object.values(carousels).filter((c) => !c.deletedAt)
}
