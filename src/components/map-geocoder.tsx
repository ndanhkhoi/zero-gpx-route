import maplibregl from 'maplibre-gl'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { searchPlace, type GeocodeResult } from '../map/geocoder'

interface MapGeocoderProps {
  map: maplibregl.Map | null
}

const DEBOUNCE_MS = 300

export function MapGeocoder({ map }: MapGeocoderProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }
    debounceRef.current = window.setTimeout(async () => {
      const items = await searchPlace(trimmed)
      setResults(items)
      setActiveIndex(-1)
      setIsOpen(items.length > 0)
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    }
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', onClickOutside)
    return () => document.removeEventListener('click', onClickOutside)
  }, [])

  function selectResult(item: GeocodeResult) {
    if (!map) return
    const lat = parseFloat(item.lat)
    const lon = parseFloat(item.lon)
    map.flyTo({ center: [lon, lat], zoom: 16 })
    setQuery(item.display_name)
    setIsOpen(false)
    setResults([])
    inputRef.current?.blur()
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0) selectResult(results[activeIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className="geocoder-control">
      <div className="geocoder-wrapper">
        <i className="fas fa-magnifying-glass geocoder-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          className="geocoder-input"
          placeholder="Tìm địa điểm..."
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={onKeyDown}
        />
        {query.length > 0 && (
          <button
            type="button"
            className="geocoder-clear"
            style={{ display: 'flex' }}
            aria-label="Xóa"
            onClick={() => {
              setQuery('')
              setResults([])
              setIsOpen(false)
              inputRef.current?.focus()
            }}
          >
            <i className="fas fa-xmark" />
          </button>
        )}
      </div>
      <div className={`geocoder-results${isOpen ? ' open' : ''}`}>
        {results.map((item, idx) => (
          <div
            key={`${item.lat}-${item.lon}-${idx}`}
            className={`geocoder-item${idx === activeIndex ? ' active' : ''}`}
            onClick={() => selectResult(item)}
          >
            {item.display_name}
          </div>
        ))}
      </div>
    </div>
  )
}
