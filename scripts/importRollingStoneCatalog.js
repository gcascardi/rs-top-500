import fs from 'node:fs/promises'
import path from 'node:path'

const sourceUrl = 'https://raw.githubusercontent.com/mminute/RollingStone500GreatestAlbums2020/main/rollingStone500GreatestAlbums2020.csv'
const outputPath = path.join(process.cwd(), 'data', 'rolling-stone-500.json')
const verifiedCorrections = new Map([
  [211, { artist: 'Joy Division', year: 1979 }],
  [263, { title: "A Hard Day's Night" }],
  [289, { artist: 'Björk' }],
  [309, { artist: 'Joy Division' }],
  [315, { artist: 'Rosalía' }],
  [338, { year: 1975 }],
  [435, { year: 1987 }],
])

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') quoted = false
      else field += character
    } else if (character === '"') quoted = true
    else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''))
      rows.push(row)
      row = []
      field = ''
    } else field += character
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

async function main() {
  const response = await fetch(sourceUrl, { headers: { 'User-Agent': 'rstop500/1.0', Accept: 'text/csv' } })
  if (!response.ok) throw new Error(`Fonte do catálogo respondeu HTTP ${response.status}`)
  const rows = parseCsv(await response.text())
  const headers = rows.shift().map((header) => header.replace(/^\uFEFF/, '').trim())
  const column = (name) => headers.indexOf(name)
  const albums = rows
    .filter((row) => row.some(Boolean))
    .map((row) => {
      const position = Number(row[column('Ranking')])
      return {
        id: position,
        position,
        title: row[column('Title')].trim().replace(/^\uFEFF/, ''),
        artist: row[column('Artist')].trim(),
        year: Number(row[column('Year')]),
        ...verifiedCorrections.get(position),
      }
    })
    .sort((a, b) => a.position - b.position)

  const positions = new Set(albums.map((album) => album.position))
  if (albums.length !== 500 || positions.size !== 500 || albums.some((album) => album.id !== album.position)) {
    throw new Error('A fonte não produziu um catálogo íntegro de 500 posições.')
  }
  for (let position = 1; position <= 500; position += 1) {
    if (!positions.has(position)) throw new Error(`Posição ausente na fonte: ${position}`)
  }

  await fs.writeFile(outputPath, `${JSON.stringify(albums, null, 2)}\n`, 'utf8')
  console.log(`Catálogo importado: ${albums.length} registros da revisão de 2020.`)
  console.log(`Fonte: ${sourceUrl}`)
}

main().catch((error) => {
  console.error('Falha ao importar o catálogo:', error.message)
  process.exitCode = 1
})
