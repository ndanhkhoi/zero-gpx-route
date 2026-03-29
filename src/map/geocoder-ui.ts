import maplibregl from 'maplibre-gl'
import { searchPlace, debounce, type GeocodeResult } from './geocoder'

export function createGeocoderControl(map: maplibregl.Map, containerId: string) {
  const container = document.getElementById(containerId)
  if (!container) return

  const input = container.querySelector<HTMLInputElement>('.geocoder-input')!
  const results = container.querySelector<HTMLDivElement>('.geocoder-results')!
  const clearBtn = container.querySelector<HTMLButtonElement>('.geocoder-clear')!

  let activeIndex = -1

  function renderResults(items: GeocodeResult[]) {
    results.innerHTML = ''
    activeIndex = -1

    if (items.length === 0) {
      results.classList.remove('open')
      return
    }

    items.forEach((item) => {
      const el = document.createElement('div')
      el.className = 'geocoder-item'
      el.textContent = item.display_name
      el.addEventListener('click', () => selectResult(item))
      results.appendChild(el)
    })

    results.classList.add('open')
  }

  function selectResult(item: GeocodeResult) {
    const lat = parseFloat(item.lat)
    const lon = parseFloat(item.lon)
    map.flyTo({ center: [lon, lat], zoom: 16 })
    input.value = item.display_name
    results.classList.remove('open')
    results.innerHTML = ''
    input.blur()
  }

  function navigateResults(direction: number) {
    const items = results.querySelectorAll('.geocoder-item')
    if (items.length === 0) return

    items.forEach((el) => el.classList.remove('active'))
    activeIndex = (activeIndex + direction + items.length) % items.length
    items[activeIndex].classList.add('active')
    items[activeIndex].scrollIntoView({ block: 'nearest' })
  }

  const debouncedSearch = debounce((query: string) => {
    searchPlace(query).then(renderResults)
  }, 300)

  input.addEventListener('input', () => {
    clearBtn.style.display = input.value.length > 0 ? 'flex' : 'none'
    debouncedSearch(input.value.trim())
  })

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      navigateResults(1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      navigateResults(-1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const activeItem = results.querySelector<HTMLDivElement>('.geocoder-item.active')
      activeItem?.click()
    } else if (e.key === 'Escape') {
      results.classList.remove('open')
      input.blur()
    }
  })

  input.addEventListener('focus', () => {
    if (results.children.length > 0) {
      results.classList.add('open')
    }
  })

  clearBtn.addEventListener('click', () => {
    input.value = ''
    results.innerHTML = ''
    results.classList.remove('open')
    clearBtn.style.display = 'none'
    input.focus()
  })

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target as Node)) {
      results.classList.remove('open')
    }
  })
}
