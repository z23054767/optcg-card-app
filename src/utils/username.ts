export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30
export const USERNAME_RULES_HINT =
  '使用 3 到 30 個小寫英文字母、數字、底線或句點，且不能以句點開頭、結尾或連續使用句點'

const USERNAME_ALLOWED_CHARACTERS_RE = /^[a-z0-9._]+$/

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

export function validateUsername(value: string): string {
  if (!value) {
    return ''
  }

  if (value.length < USERNAME_MIN_LENGTH) {
    return `Username 長度至少需要 ${USERNAME_MIN_LENGTH} 碼`
  }

  if (value.length > USERNAME_MAX_LENGTH) {
    return `Username 長度不可超過 ${USERNAME_MAX_LENGTH} 碼`
  }

  if (!USERNAME_ALLOWED_CHARACTERS_RE.test(value)) {
    return 'Username 僅能包含小寫英文字母、數字、底線與句點'
  }

  if (value.startsWith('.') || value.endsWith('.')) {
    return 'Username 不可使用句點作為開頭或結尾'
  }

  if (value.includes('..')) {
    return 'Username 不可連續使用句點'
  }

  return ''
}
