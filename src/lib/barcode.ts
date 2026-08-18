export function generateRandomBarcode(): string {
  const base = '779' + Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('')
  const digits = base.split('').map(Number)
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0)
  const check = (10 - (sum % 10)) % 10
  return base + check
}