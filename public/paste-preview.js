import assign from './vendor/lodash-es/assign.js'
import forEach from './vendor/lodash-es/forEach.js'
import get from './vendor/lodash-es/get.js'
import size from './vendor/lodash-es/size.js'
import toArray from './vendor/lodash-es/toArray.js'

const PASTE_CAPTION = 'Paste preview'

export function createPasteSession() {
  return {
    loaded: false,
    showing: false,
    compose: true,
    buffer: '',
  }
}

export function markProjectLoaded() {
  return {
    loaded: true,
    showing: false,
    compose: true,
    buffer: '',
  }
}

export function togglePaste(session) {
  if (!get(session, 'loaded')) return session
  const showing = !get(session, 'showing')
  if (!showing) return assign({}, session, { showing: false })
  return assign({}, session, {
    showing: true,
    compose: size(get(session, 'buffer', '')) === 0,
  })
}

export function leavePaste(session) {
  return assign({}, session, { showing: false })
}

export function setPasteBuffer(session, buffer) {
  return assign({}, session, { buffer })
}

export function setPasteCompose(session, compose) {
  return assign({}, session, { compose: Boolean(compose) })
}

export function pasteCaptionText(session, filePath) {
  if (!get(session, 'loaded')) return ''
  if (get(session, 'showing')) return PASTE_CAPTION
  return filePath || ''
}

export function pasteLinkKind(href) {
  if (!href) return 'empty'
  if (/^https?:/i.test(href)) return 'external'
  if (href.startsWith('#')) return 'hash'
  return 'relative'
}

export function bindPastePreviewLinks(root) {
  forEach(toArray(root.querySelectorAll('a')), (a) => {
    const href = a.getAttribute('href') || ''
    const kind = pasteLinkKind(href)
    if (kind === 'external') {
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      return
    }
    if (kind === 'hash') return
    a.addEventListener('click', (event) => event.preventDefault())
  })
}
