export interface GeocodeResult {
  display_name: string
  lat: string
  lon: string
}

export async function searchPlace(query: string): Promise<GeocodeResult[]> {
  if (query.length < 2) return []

  const params = new URLSearchParams({
    format: 'json',
    q: query,
    limit: '5',
    'accept-language': 'vi',
  })

  let res: Response
  try {
    res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'ZeroGPXRoute/1.0' },
    })
  } catch {
    return []
  }

  if (!res.ok) return []

  try {
    return await res.json()
  } catch {
    return []
  }
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
