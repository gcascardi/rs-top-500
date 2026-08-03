import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const albumsPath = path.join(root, 'public', 'albums.json')
const allowedFields = new Set(['id', 'position', 'title', 'artist', 'year', 'decade', 'genres', 'musicbrainzId', 'cover', 'spotifyUrl'])
const errors = []

async function exists(filePath) {
  return fs.access(filePath).then(() => true).catch(() => false)
}

function error(message) {
  errors.push(message)
}

async function main() {
  const file = await fs.readFile(albumsPath)
  if (file.byteLength > 2_000_000) error(`public/albums.json excede 2 MB (${file.byteLength} bytes).`)
  const albums = JSON.parse(file.toString('utf8'))
  if (!Array.isArray(albums)) throw new Error('public/albums.json deve conter um array.')
  if (albums.length !== 500) error(`Esperados exatamente 500 registros; encontrados ${albums.length}.`)
  const ids = new Set()
  const positions = new Set()

  for (const [index, album] of albums.entries()) {
    const label = `Registro ${index + 1}`
    if (album.position !== index + 1) error(`${label}: catálogo não está ordenado por posição.`)
    if (!Number.isInteger(album.id)) error(`${label}: ID deve ser inteiro.`)
    if (!Number.isInteger(album.position) || album.position < 1 || album.position > 500) error(`${label}: posição inválida.`)
    if (ids.has(album.id)) error(`${label}: ID duplicado ${album.id}.`)
    if (positions.has(album.position)) error(`${label}: posição duplicada ${album.position}.`)
    ids.add(album.id)
    positions.add(album.position)
    if (album.id !== album.position) error(`${label}: id deve ser igual à posição.`)
    if (typeof album.title !== 'string' || !album.title.trim()) error(`${label}: título ausente.`)
    if (typeof album.artist !== 'string' || !album.artist.trim()) error(`${label}: artista ausente.`)
    if (!Number.isInteger(album.year) || album.year < 1900 || album.year > new Date().getFullYear()) error(`${label}: ano inválido.`)
    if (album.decade !== Math.floor(album.year / 10) * 10) error(`${label}: década incoerente.`)
    if (!Array.isArray(album.genres) || album.genres.length > 5 || new Set(album.genres).size !== album.genres.length) error(`${label}: gêneros inválidos.`)
    const privateFields = Object.keys(album).filter((field) => !allowedFields.has(field))
    if (privateFields.length) error(`${label}: campos não permitidos: ${privateFields.join(', ')}.`)
    if ('listened' in album || 'rating' in album || 'progress' in album) error(`${label}: contém progresso.`)
    if (typeof album.cover !== 'string' || /^https?:/i.test(album.cover) || !album.cover.startsWith('/covers/')) {
      error(`${label}: capa deve usar caminho público local.`)
    } else {
      const coverPath = path.join(root, 'public', album.cover.replace(/^\//, ''))
      if (!await exists(coverPath)) error(`${label}: capa não encontrada (${album.cover}).`)
      else if ((await fs.stat(coverPath)).size > 2_000_000) error(`${label}: capa excede 2 MB.`)
    }
  }
  for (let position = 1; position <= 500; position += 1) if (!positions.has(position)) error(`Posição ausente: ${position}.`)

  if (errors.length) {
    console.error(`Validação falhou com ${errors.length} erro(s):`)
    errors.forEach((message) => console.error(`- ${message}`))
    process.exitCode = 1
    return
  }
  console.log(`Validação concluída: 500 álbuns ordenados, IDs estáveis e recursos locais válidos (${file.byteLength} bytes).`)
}

main().catch((failure) => {
  console.error('Não foi possível validar os álbuns:', failure.message)
  process.exitCode = 1
})
