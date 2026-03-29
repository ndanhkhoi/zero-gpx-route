export function createRng(seed: number) {
  let s = Math.max(1, Math.abs(Math.floor(seed)) % 2147483646 + 1)
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}
