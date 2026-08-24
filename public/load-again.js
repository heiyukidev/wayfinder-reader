import get from './vendor/lodash-es/get.js'
import { isReadablePreviewPath } from './walk.js'

export function canLoadAgain(state) {
  if (get(state, 'alwaysOn')) return Boolean(get(state, 'projectPath'))
  return Boolean(get(state, 'hostedHandleLoad') && get(state, 'rootHandle'))
}

export function shouldKeepPreview(relPath, languagePaths = []) {
  return Boolean(relPath) && isReadablePreviewPath(relPath, languagePaths)
}
