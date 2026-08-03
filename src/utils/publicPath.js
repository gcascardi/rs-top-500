export function publicPath(assetPath) {
  return `${import.meta.env.BASE_URL}${assetPath.replace(/^\/+/, '')}`
}
