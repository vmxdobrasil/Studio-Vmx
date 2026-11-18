/**
 * Persistência no Skip Cloud (PocketBase). Cada usuário só enxerga os próprios
 * registros: todas as coleções têm o campo `user` e regras de acesso por dono.
 *
 * O id de cada registro é derivado do id que o app já usa (ex.: "c_mvo8jvy..."),
 * então salvar é sempre "atualiza; se não existir, cria".
 */
import { ClientResponseError, type RecordModel } from 'pocketbase'
import { refreshFileToken } from '@/lib/assets'
import pb from '@/lib/pocketbase/client'
import type { BrandKit, Carousel, CustomFont, Project, Settings, Version } from '../types'

const MAX_VERSIONS = 25

function userId() {
  const id = pb.authStore.record?.id
  if (!id) throw new Error('Sessão expirada. Entre de novo.')
  return id
}

/** Converte o id do app no formato de id do PocketBase (15 caracteres, a-z e 0-9). */
export function recordId(appId: string) {
  return appId
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(-15)
    .padStart(15, '0')
}

const isStatus = (err: unknown, status: number) =>
  err instanceof ClientResponseError && err.status === status

// Uma fila por registro: a próxima gravação só começa quando a anterior termina,
// assim uma versão antiga nunca sobrescreve uma mais nova.
const queues = new Map<string, Promise<unknown>>()
function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
  const prev = queues.get(key) ?? Promise.resolve()
  const next = prev.catch(() => undefined).then(task)
  queues.set(key, next)
  void next.finally(() => queues.get(key) === next && queues.delete(key)).catch(() => undefined)
  return next
}

async function upsert(collection: string, appId: string, fields: Record<string, unknown>) {
  const id = recordId(appId)
  return enqueue(`${collection}:${id}`, async () => {
    try {
      return await pb.collection(collection).update(id, fields)
    } catch (err) {
      if (!isStatus(err, 404)) throw err
      return await pb.collection(collection).create({ id, user: userId(), ...fields })
    }
  })
}

async function remove(collection: string, appId: string) {
  const id = recordId(appId)
  return enqueue(`${collection}:${id}`, async () => {
    try {
      await pb.collection(collection).delete(id)
    } catch (err) {
      if (!isStatus(err, 404)) throw err
    }
  })
}

const listOwn = (collection: string, extra: { filter?: string; sort?: string } = {}) =>
  pb.collection(collection).getFullList({
    filter: extra.filter
      ? pb.filter(`user = {:u} && (${extra.filter})`, { u: userId() })
      : pb.filter('user = {:u}', { u: userId() }),
    sort: extra.sort ?? 'created',
  })

const dataOf = <T>(records: RecordModel[]) => records.map((r) => r.data as T).filter(Boolean)

// ---------------------------------------------------------------------------
// Carga inicial
// ---------------------------------------------------------------------------

export async function loadAll() {
  await refreshFileToken()
  const [projects, carousels, brandKits, fonts, settings] = await Promise.all([
    listOwn('projects'),
    listOwn('carousels'),
    listOwn('brand_kits'),
    listOwn('fonts'),
    pb
      .collection('user_settings')
      .getOne(userId())
      .catch((err) => {
        if (isStatus(err, 404)) return null
        throw err
      }),
  ])
  return {
    projects: dataOf<Project>(projects),
    carousels: dataOf<Carousel>(carousels),
    brandKits: dataOf<BrandKit>(brandKits),
    fonts: fonts.map(fontFromRecord),
    settings: ((settings?.data as Settings | undefined) ?? { exportsCount: 0 }) as Settings,
  }
}

// ---------------------------------------------------------------------------
// Projetos, carrosséis, brand kits e configurações
// ---------------------------------------------------------------------------

export const saveProject = (p: Project) => upsert('projects', p.id, { data: p })
export const deleteProject = (id: string) => remove('projects', id)

export const saveCarousel = (c: Carousel) => upsert('carousels', c.id, { data: c })
export async function deleteCarousel(id: string) {
  await remove('carousels', id)
  const versions = await listOwn('versions', { filter: pb.filter('carousel = {:c}', { c: id }) })
  await Promise.all(versions.map((v) => pb.collection('versions').delete(v.id)))
}

export const saveBrandKit = (k: BrandKit) => upsert('brand_kits', k.id, { data: k })
export const deleteBrandKit = (id: string) => remove('brand_kits', id)

export function saveSettings(settings: Settings) {
  const id = userId()
  return enqueue(`user_settings:${id}`, async () => {
    try {
      return await pb.collection('user_settings').update(id, { data: settings })
    } catch (err) {
      if (!isStatus(err, 404)) throw err
      return await pb.collection('user_settings').create({ id, user: id, data: settings })
    }
  })
}

// ---------------------------------------------------------------------------
// Histórico de versões
// ---------------------------------------------------------------------------

export async function loadVersions(carouselId: string): Promise<Version[]> {
  const records = await listOwn('versions', {
    filter: pb.filter('carousel = {:c}', { c: carouselId }),
    sort: '-created',
  })
  return dataOf<Version>(records)
}

export async function addVersion(carouselId: string, v: Version) {
  await pb
    .collection('versions')
    .create({ id: recordId(v.id), user: userId(), carousel: carouselId, data: v })
  // Mantém só as versões mais recentes de cada carrossel.
  const records = await listOwn('versions', {
    filter: pb.filter('carousel = {:c}', { c: carouselId }),
    sort: '-created',
  })
  await Promise.all(records.slice(MAX_VERSIONS).map((r) => pb.collection('versions').delete(r.id)))
}

// ---------------------------------------------------------------------------
// Arquivos: imagens dos slides e fontes enviadas
// ---------------------------------------------------------------------------

/** Envia uma imagem e devolve o endereço público dela. */
export async function uploadMedia(file: Blob, name = 'imagem') {
  const form = new FormData()
  form.append('user', userId())
  form.append('file', file, name)
  const record = await pb.collection('media').create(form)
  return pb.files.getURL(record, record.file as string)
}

function fontFromRecord(r: RecordModel): CustomFont {
  return { id: r.id, family: r.family as string, dataUrl: pb.files.getURL(r, r.file as string) }
}

export async function uploadFont(file: File, family: string): Promise<CustomFont> {
  const form = new FormData()
  form.append('user', userId())
  form.append('family', family)
  form.append('file', file, file.name)
  return fontFromRecord(await pb.collection('fonts').create(form))
}

export async function deleteFont(id: string) {
  try {
    await pb.collection('fonts').delete(id)
  } catch (err) {
    if (!isStatus(err, 404)) throw err
  }
}
