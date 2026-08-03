import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const paths = {
  base: path.join(root, 'data', 'rolling-stone-500.json'),
  overrides: path.join(root, 'data', 'album-overrides.json'),
  cache: path.join(root, 'data', 'generated-cache.json'),
  report: path.join(root, 'data', 'generation-report.json'),
  output: path.join(root, 'public', 'albums.json'),
  covers: path.join(root, 'public', 'covers'),
}
const placeholder = '/covers/placeholder.webp'
const generatorVersion = 2
const force = process.argv.includes('--force')
const missingOnly = process.argv.includes('--missing-only')
const positionArgument = process.argv.find((argument) => argument.startsWith('--positions='))
const userAgent = 'rstop500/1.0'
let lastMusicBrainzRequest = 0

export function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

export function normalize(value = '', { ignoreArticles = false } = {}) {
  let normalized = String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[‘’`´]/g, "'")
    .toLocaleLowerCase('en')
    .replace(/&/g, ' and ')
    .replace(/[-–—]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
  if (ignoreArticles) normalized = normalized.replace(/^(the|a|an)\s+/, '')
  return normalized
}

function equivalent(left, right) {
  return normalize(left) === normalize(right) || normalize(left, { ignoreArticles: true }) === normalize(right, { ignoreArticles: true })
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, '-').slice(0, 70) || 'album'
}

function escapeLucene(value) {
  return value.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, '\\$1')
}

function artistName(candidate) {
  return (candidate['artist-credit'] || [])
    .map((credit) => `${credit.artist?.name || credit.name || ''}${credit.joinphrase || ''}`)
    .filter(Boolean)
    .join('')
    .trim()
}

function candidateDetails(candidate, album) {
  const foundArtist = artistName(candidate)
  const foundYear = Number.parseInt(candidate['first-release-date']?.slice(0, 4), 10)
  const exactTitle = candidate.title?.trim().toLocaleLowerCase('en') === album.title.trim().toLocaleLowerCase('en')
  const exactArtist = foundArtist.toLocaleLowerCase('en') === album.artist.trim().toLocaleLowerCase('en')
  return {
    exactPair: exactTitle && exactArtist,
    normalizedPair: equivalent(candidate.title, album.title) && equivalent(foundArtist, album.artist),
    yearDifference: Number.isFinite(foundYear) ? Math.abs(foundYear - album.year) : 999,
    score: Number(candidate.score) || 0,
    isAlbum: candidate['primary-type'] === 'Album',
    foundYear: Number.isFinite(foundYear) ? foundYear : null,
    foundArtist,
  }
}

function chooseCandidate(candidates, album) {
  return [...candidates]
    .map((candidate) => ({ candidate, details: candidateDetails(candidate, album) }))
    .sort((a, b) =>
      Number(b.details.exactPair) - Number(a.details.exactPair) ||
      Number(b.details.normalizedPair) - Number(a.details.normalizedPair) ||
      a.details.yearDifference - b.details.yearDifference ||
      (b.details.score + (b.details.isAlbum ? 5 : 0)) - (a.details.score + (a.details.isAlbum ? 5 : 0)),
    )[0] || null
}

const genreNames = new Map([
  ['r b', 'R&B'], ['rhythm and blues', 'R&B'], ['hip hop', 'Hip-Hop'], ['hiphop', 'Hip-Hop'],
  ['rock and roll', 'Rock & Roll'], ['rock n roll', 'Rock & Roll'], ['singer songwriter', 'Singer-Songwriter'],
  ['electronic', 'Electronic'], ['electronica', 'Electronica'], ['alternative rock', 'Alternative Rock'],
  ['country', 'Country'], ['folk', 'Folk'], ['funk', 'Funk'], ['jazz', 'Jazz'], ['pop', 'Pop'],
  ['punk', 'Punk'], ['reggae', 'Reggae'], ['rock', 'Rock'], ['soul', 'Soul'], ['disco', 'Disco'],
])

function formatGenre(name) {
  const key = normalize(name)
  return genreNames.get(key) || key.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function extractGenres(candidate) {
  const seen = new Set()
  return [...(candidate?.genres || []), ...(candidate?.tags || [])]
    .filter((tag) => (Number(tag.count) || 0) > 0 && tag.name)
    .sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0))
    .map((tag) => formatGenre(tag.name))
    .filter((genre) => {
      const key = normalize(genre)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 5)
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return fallback
    throw error
  }
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function exists(filePath) {
  return fs.access(filePath).then(() => true).catch(() => false)
}

async function fetchWithTimeout(url, options = {}, timeout = 15000) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(timeout), redirect: 'follow' })
}

async function musicBrainzQuery(query) {
  const url = new URL('https://musicbrainz.org/ws/2/release-group/')
  url.searchParams.set('query', query)
  url.searchParams.set('fmt', 'json')
  url.searchParams.set('limit', '10')
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const elapsed = Date.now() - lastMusicBrainzRequest
    const wait = Math.max(0, 1100 - elapsed, attempt > 1 ? attempt * 700 : 0)
    if (wait) await sleep(wait)
    lastMusicBrainzRequest = Date.now()
    const response = await fetchWithTimeout(url, { headers: { 'User-Agent': userAgent, Accept: 'application/json' } })
    if (response.ok) return (await response.json())['release-groups'] || []
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 3) throw new Error(`MusicBrainz HTTP ${response.status}`)
  }
  return []
}

async function musicBrainzSearch(album, searchTitle, searchArtist) {
  const identity = `releasegroup:"${escapeLucene(searchTitle)}" AND artist:"${escapeLucene(searchArtist)}"`
  const exactYear = await musicBrainzQuery(`${identity} AND firstreleasedate:${album.year}`)
  if (exactYear.length) return exactYear
  return musicBrainzQuery(identity)
}

async function coverArtUrl(musicbrainzId) {
  const response = await fetchWithTimeout(`https://coverartarchive.org/release-group/${musicbrainzId}`, {
    headers: { 'User-Agent': userAgent, Accept: 'application/json' },
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Cover Art Archive HTTP ${response.status}`)
  const data = await response.json()
  const front = data.images?.find((image) => image.front) || data.images?.[0]
  return front?.thumbnails?.large || front?.thumbnails?.['500'] || front?.image || null
}

async function downloadCover(url, destination) {
  const response = await fetchWithTimeout(url, { headers: { 'User-Agent': userAgent, Accept: 'image/*' } }, 25000)
  if (!response.ok) throw new Error(`Download da capa HTTP ${response.status}`)
  const source = Buffer.from(await response.arrayBuffer())
  await sharp(source)
    .resize(900, 900, { fit: 'contain', background: '#f5f2eb', withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(destination)
}

function parsePositions() {
  if (!positionArgument) return null
  const match = positionArgument.match(/^--positions=(\d+)(?:-(\d+))?$/)
  if (!match) throw new Error('Use --positions=início-fim, por exemplo --positions=1-20.')
  const start = Number(match[1])
  const end = Number(match[2] || match[1])
  if (start < 1 || end > 500 || start > end) throw new Error('O intervalo deve estar entre 1 e 500.')
  return { start, end }
}

function fingerprint(album, override) {
  return JSON.stringify({ generatorVersion, title: album.title, artist: album.artist, year: album.year, override })
}

function cacheIsMissing(entry) {
  return !entry?.musicbrainzId || !entry?.coverLocalPath || entry.coverLocalPath === placeholder || entry.error || entry.lowConfidence
}

function toOutput(album, override, entry) {
  return {
    id: album.id,
    position: album.position,
    title: override.displayTitle || album.title,
    artist: override.displayArtist || album.artist,
    year: album.year,
    decade: Math.floor(album.year / 10) * 10,
    genres: [...new Set(entry?.genres || [])].slice(0, 5),
    musicbrainzId: entry?.musicbrainzId || null,
    cover: entry?.coverLocalPath || placeholder,
    spotifyUrl: null,
  }
}

function newReport() {
  return {
    summary: { total: 500, automaticMatches: 0, overrideMatches: 0, missingMusicBrainz: 0, missingCovers: 0, lowConfidence: 0, networkErrors: 0 },
    automaticMatches: [], overrideMatches: [], missingMusicBrainz: [], missingCovers: [], lowConfidence: [], networkErrors: [],
  }
}

function reportEntry(album, entry) {
  return { position: album.position, title: album.title, artist: album.artist, musicbrainzId: entry?.musicbrainzId || null }
}

function buildReport(albums, cache) {
  const report = newReport()
  for (const album of albums) {
    const entry = cache.albums[album.id]
    const base = reportEntry(album, entry)
    if (entry?.method === 'override' && entry.musicbrainzId) report.overrideMatches.push(base)
    else if (entry?.musicbrainzId) report.automaticMatches.push(base)
    else report.missingMusicBrainz.push(base)
    if (!entry?.coverLocalPath || entry.coverLocalPath === placeholder) report.missingCovers.push(base)
    if (entry?.lowConfidence) {
      report.lowConfidence.push({
        position: album.position, expectedTitle: album.title, expectedArtist: album.artist,
        selectedTitle: entry.matchedTitle, selectedArtist: entry.matchedArtist,
        score: entry.score, yearDifference: entry.yearDifference, musicbrainzId: entry.musicbrainzId,
      })
    }
    if (entry?.error) report.networkErrors.push({ ...base, ...entry.error })
  }
  for (const key of Object.keys(report.summary).slice(1)) report.summary[key] = report[key].length
  return report
}

async function main() {
  const albums = await readJson(paths.base, [])
  const overrides = await readJson(paths.overrides, {})
  const storedCache = await readJson(paths.cache, { version: generatorVersion, albums: {} })
  const existingOutput = await readJson(paths.output, [])
  const cache = { version: generatorVersion, albums: storedCache.albums || {} }
  const outputById = new Map(existingOutput.map((album) => [album.id, album]))
  const range = parsePositions()
  await fs.mkdir(paths.covers, { recursive: true })
  if (!await exists(path.join(paths.covers, 'placeholder.webp'))) throw new Error('public/covers/placeholder.webp não existe.')

  const selectedAlbums = albums.filter((album) => {
    if (range && (album.position < range.start || album.position > range.end)) return false
    if (missingOnly && !cacheIsMissing(cache.albums[album.id])) return false
    return true
  })
  console.log(`Processando ${selectedAlbums.length} de ${albums.length} álbuns${force ? ' sem cache' : ''}.`)

  for (const [index, album] of selectedAlbums.entries()) {
    const override = overrides[String(album.id)] || {}
    const expectedFingerprint = fingerprint(album, override)
    let entry = cache.albums[album.id]
    const localCover = entry?.coverLocalPath && entry.coverLocalPath !== placeholder
      ? path.join(root, 'public', entry.coverLocalPath.replace(/^\//, ''))
      : null
    const validCache = !force && !(missingOnly && cacheIsMissing(entry)) && entry?.fingerprint === expectedFingerprint && (!localCover || await exists(localCover))
    if (!validCache) {
      const searchAlbum = { ...album, title: override.searchTitle || album.title, artist: override.searchArtist || album.artist }
      let selected = null
      let musicbrainzId = override.musicbrainzId || (!force && entry?.musicbrainzId && !entry.lowConfidence ? entry.musicbrainzId : null)
      let error = null
      if (!musicbrainzId && !override.ignoreAutomatic) {
        try {
          selected = chooseCandidate(await musicBrainzSearch(album, searchAlbum.title, searchAlbum.artist), searchAlbum)
          musicbrainzId = selected?.candidate.id || null
        } catch (networkError) {
          error = { source: 'MusicBrainz', message: networkError.message }
          console.error(`[${album.position}] MusicBrainz: ${networkError.message}`)
        }
      }
      const details = selected?.details
      const lowConfidence = selected
        ? !details.normalizedPair || details.yearDifference > 3 || details.score < 80
        : Boolean(entry?.lowConfidence)
      const filename = `${String(album.position).padStart(3, '0')}-${slugify(override.displayTitle || album.title)}.webp`
      const destination = path.join(paths.covers, filename)
      let coverSourceUrl = override.coverUrl || null
      let coverLocalPath = placeholder
      if (musicbrainzId || coverSourceUrl) {
        try {
          if (!coverSourceUrl) coverSourceUrl = await coverArtUrl(musicbrainzId)
          if (coverSourceUrl) {
            if (force || !await exists(destination)) await downloadCover(coverSourceUrl, destination)
            coverLocalPath = `/covers/${filename}`
          }
        } catch (networkError) {
          error ||= { source: 'Cover Art Archive', message: networkError.message }
          console.error(`[${album.position}] Capa: ${networkError.message}`)
        }
      }
      entry = {
        fingerprint: expectedFingerprint,
        musicbrainzId,
        matchedTitle: selected?.candidate.title || entry?.matchedTitle || null,
        matchedArtist: details?.foundArtist || entry?.matchedArtist || null,
        matchedYear: details?.foundYear || entry?.matchedYear || null,
        score: details?.score ?? entry?.score ?? null,
        primaryType: selected?.candidate['primary-type'] || entry?.primaryType || null,
        yearDifference: details?.yearDifference ?? entry?.yearDifference ?? null,
        coverSourceUrl,
        coverLocalPath,
        genres: selected ? extractGenres(selected.candidate) : entry?.genres || [],
        generatedAt: new Date().toISOString(),
        method: override.musicbrainzId ? 'override' : entry?.method || 'automatic',
        lowConfidence,
        error,
      }
      cache.albums[album.id] = entry
      await writeJson(paths.cache, cache)
    }
    outputById.set(album.id, toOutput(album, override, entry))
    console.log(`[${index + 1}/${selectedAlbums.length}] #${album.position} ${album.artist} — ${album.title}: ${entry?.musicbrainzId ? 'OK' : 'pendente'}`)
  }

  const output = albums.map((album) => {
    const override = overrides[String(album.id)] || {}
    return outputById.get(album.id) || toOutput(album, override, cache.albums[album.id])
  })
  const report = buildReport(albums, cache)
  await writeJson(paths.output, output)
  await writeJson(paths.cache, cache)
  await writeJson(paths.report, report)
  console.log('\nResumo da geração')
  Object.entries(report.summary).forEach(([key, value]) => console.log(`${key}: ${value}`))
}

main().catch((error) => {
  console.error('Não foi possível gerar o catálogo:', error.message)
  process.exitCode = 1
})
