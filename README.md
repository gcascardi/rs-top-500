# RS Top 500

Aplicação React para ouvir, avaliar e acompanhar os **500 Greatest Albums of All Time**, na revisão publicada pela Rolling Stone em 2020. Projeto independente, sem associação oficial com a publicação.

O catálogo funciona inteiramente com arquivos locais. A aplicação não consulta Rolling Stone, MusicBrainz ou Cover Art Archive em tempo de execução.

## Tecnologias

- React 19 e Vite 8
- JavaScript e CSS puro
- Supabase para progresso público, sem autenticação
- `localStorage` como fallback
- MusicBrainz e Cover Art Archive somente no gerador
- Sharp para conversão e otimização das capas em WebP

## Instalação e execução

```bash
npm install
npm run dev
```

Por causa de `base: '/rstop500/'`, o endereço local normalmente é `http://localhost:5173/rstop500/`.

## Configuração do Supabase

Copie `.env.example` para `.env.local` ou crie `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-anon
```

Execute [`supabase/schema.sql`](supabase/schema.sql) em uma instalação nova. Não use `service_role` ou chaves secretas no frontend.

Não há contas ou perfis: todos os visitantes leem e alteram o mesmo progresso de `album_progress`. Sem variáveis de ambiente, o progresso fica apenas neste dispositivo em `rstop500-user-data`.

## Origem e estrutura do catálogo

[`data/rolling-stone-500.json`](data/rolling-stone-500.json) contém exatamente 500 registros da edição de 2020:

```json
{
  "id": 1,
  "position": 1,
  "title": "What's Going On",
  "artist": "Marvin Gaye",
  "year": 1971
}
```

`id` é sempre igual à posição e identifica o progresso no Supabase; portanto, não deve ser alterado.

A fonte utilizada foi o snapshot público [`mminute/RollingStone500GreatestAlbums2020`](https://github.com/mminute/RollingStone500GreatestAlbums2020), cruzado com [`nussbaum596/Rolling-Stone-EDA`](https://github.com/nussbaum596/Rolling-Stone-EDA). Somente posição, título, artista e ano foram importados. Resenhas, descrições e demais textos editoriais foram descartados. Fonte e correções verificadas estão registradas em [`data/catalog-source.json`](data/catalog-source.json).

Para reproduzir a importação da fonte versionada:

```bash
npm run import:catalog
```

## Geração dos metadados

```bash
npm run generate:albums
```

[`scripts/generateAlbums.js`](scripts/generateAlbums.js) pesquisa `release-group` por título, artista e ano no MusicBrainz, sem requisições paralelas e com intervalo mínimo de 1,1 segundo. O candidato considera título, créditos de artista, normalização, ano, score e tipo principal. Compilações, trilhas, álbuns ao vivo e coletâneas não são excluídos.

Até cinco gêneros são derivados das tags disponíveis. A capa frontal é obtida do Cover Art Archive, limitada a 900 × 900 sem deformação, convertida para WebP e salva em `public/covers/`. Falhas usam `/covers/placeholder.webp` e não interrompem a geração.

O resultado consumido pela aplicação é [`public/albums.json`](public/albums.json), sem dados de progresso ou URLs externas de imagem.

### Cache

[`data/generated-cache.json`](data/generated-cache.json) guarda associação MusicBrainz, candidato, score, capa, gêneros, data e estado de confiança. Entradas válidas não são consultadas ou baixadas novamente.

```bash
npm run generate:albums:force    # ignora o cache
npm run generate:albums:missing  # tenta apenas pendências e baixa confiança
node scripts/generateAlbums.js --positions=1-20
```

A opção por intervalo preserva todos os demais registros já gerados.

### Overrides

Corrija associações em [`data/album-overrides.json`](data/album-overrides.json):

```json
{
  "1": {
    "musicbrainzId": "release-group-id-correto",
    "searchTitle": "termo alternativo",
    "searchArtist": "artista alternativo",
    "coverUrl": "https://capa-verificada",
    "displayTitle": "título exibido",
    "displayArtist": "artista exibido",
    "ignoreAutomatic": false
  }
}
```

Todos os campos são opcionais. `ignoreAutomatic: true` mantém o item sem associação automática. Alterar um override invalida apenas o cache daquele álbum.

### Relatório e validação

[`data/generation-report.json`](data/generation-report.json) separa associações automáticas, overrides, IDs ou capas ausentes, baixa confiança e erros de rede.

```bash
npm run validate:albums
```

O validador exige 500 posições ordenadas, IDs estáveis, anos e décadas coerentes, apenas campos públicos, capas locais existentes e arquivo de tamanho razoável. Qualquer erro crítico encerra o processo com código diferente de zero.

## Avaliação de 1 a 5 estrelas

A avaliação aceita somente `null` ou estrelas inteiras de 1 a 5. É possível avaliar sem marcar como ouvido, remover a avaliação clicando novamente na estrela selecionada ou pelo botão textual, e alterar o status de ouvido sem apagar estrelas.

### Migração do Supabase

Antes de publicar esta versão sobre um banco que ainda usa notas de 0 a 10, execute no SQL Editor:

[`supabase/migrations/convert-rating-to-stars.sql`](supabase/migrations/convert-rating-to-stars.sql)

A migração converte, arredonda e limita valores a 1–5, substitui a constraint e preserva IDs, status e datas. O script detecta a nova constraint para evitar uma segunda conversão.

### Migração do localStorage

O formato atual usa versão 2:

```json
{
  "version": 2,
  "albums": {
    "1": { "listened": true, "rating": 5 }
  }
}
```

Dados da versão 1 são convertidos automaticamente de 0–10 para 1–5 e regravados no mesmo dispositivo, preservando status e registros não avaliados.

## Descoberta de álbuns

- **Sortear álbum:** considera todos os filtros ativos, prioriza não ouvidos, evita os últimos cinco resultados da sessão e não muda a ordenação.
- **Somente não ouvidos:** ativado por padrão; se todos os elegíveis já foram ouvidos, o sorteio informa o fallback e considera todos.
- **Álbum do dia:** escolha determinística pela data local, igual durante todo o dia e sem chamadas externas.

Ambos permitem marcar como ouvido, avaliar e navegar até o item na lista.

## Paginação

A lista renderiza até 100 álbuns por página. Busca, filtros, ordenação e sorteio continuam considerando todo o conjunto elegível; a seleção de itens visíveis considera somente a página atual. Links vindos do sorteio e do álbum do dia abrem automaticamente a página correspondente.

Ao clicar em um álbum, a aplicação abre um painel editorial com capa, posição, metadados, status e estrelas. O painel reutiliza as mesmas ações do sorteio e pode ser fechado pelo botão, pelo fundo ou pela tecla Escape.

## Scripts

```bash
npm run import:catalog
npm run generate:albums
npm run generate:albums:force
npm run generate:albums:missing
npm run validate:albums
npm run lint
npm run build
npm run preview
```

## Build e GitHub Pages

```bash
npm run build
npm run preview
```

O build é gerado em `dist/`. Capas e JSON respeitam `import.meta.env.BASE_URL` e a configuração `/rstop500/` do Vite.
