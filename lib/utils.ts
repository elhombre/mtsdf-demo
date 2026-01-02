/**
 * Lightweight class name merge helper (shadcn-style)
 */

type ClassValue = string | number | null | false | undefined | ClassValue[] | Record<string, boolean | null | undefined>

export function cn(...inputs: ClassValue[]): string {
  const classNames: string[] = []

  const append = (value: ClassValue): void => {
    if (!value) return

    if (typeof value === 'string' || typeof value === 'number') {
      classNames.push(String(value))
      return
    }

    if (Array.isArray(value)) {
      value.forEach(append)
      return
    }

    Object.entries(value).forEach(([key, condition]) => {
      if (condition) {
        classNames.push(key)
      }
    })
  }

  inputs.forEach(append)
  return classNames.join(' ')
}
