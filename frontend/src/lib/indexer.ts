// Lightweight localStorage-backed incremental log indexer.
// Bump VERSION to invalidate all cached indexes after breaking changes.
const VERSION = 1

type IndexStore<T> = {
  items: T[]
  lastBlock: string  // BigInt serialized as string
  version: number
}

function storageKey(key: string) {
  return `ramelax_v${VERSION}_${key}`
}

function emptyStore<T>(fromBlock: bigint): IndexStore<T> {
  return { items: [], lastBlock: (fromBlock - 1n).toString(), version: VERSION }
}

export function loadIndex<T>(key: string, fromBlock: bigint): IndexStore<T> {
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (!raw) return emptyStore(fromBlock)
    const stored = JSON.parse(raw) as IndexStore<T>
    if (stored.version !== VERSION) return emptyStore(fromBlock)
    return stored
  } catch {
    return emptyStore(fromBlock)
  }
}

export function saveIndex<T>(key: string, items: T[], lastBlock: bigint): void {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify({ items, lastBlock: lastBlock.toString(), version: VERSION }))
  } catch { /* quota exceeded or storage unavailable — silent no-op */ }
}
