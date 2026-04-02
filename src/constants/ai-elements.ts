export const ICON_SIZE = 18

export const ATTACHMENT_TYPES = {
  IMAGE: 'image',
  PDF: 'pdf',
  DOC: 'document',
} as const

export const CHAT_ANIMATIONS = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}
