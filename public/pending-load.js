export const PENDING_PREVIEW_COPY = 'Opening this Project.'

export const PENDING_MAP_BARS = [
  { kind: 'label', width: '38%' },
  { kind: 'heading', width: '74%' },
  { kind: 'ticket', width: '66%' },
  { kind: 'ticket', width: '58%' },
  { kind: 'label', width: '46%' },
  { kind: 'heading', width: '70%' },
  { kind: 'ticket', width: '54%' },
]

export function pendingPreviewHtml() {
  return `<p class="preview-placeholder preview-pending-text">${PENDING_PREVIEW_COPY}</p>`
}
