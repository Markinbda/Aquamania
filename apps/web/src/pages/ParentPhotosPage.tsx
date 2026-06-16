import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'

type Group = {
  id: string
  name: string
}

type FilterSwimmer = {
  id: string
  firstName: string
  lastName: string
  groupId: string | null
}

type PhotoTag = {
  swimmer: {
    id: string
    firstName: string
    lastName: string
  }
}

type Photo = {
  id: string
  url: string
  caption: string | null
  createdAt: string
  group: Group
  tags: PhotoTag[]
}

type PhotoResponse = {
  data: Photo[]
  filters: {
    groups: Group[]
    swimmers: FilterSwimmer[]
  }
}

export function ParentPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [swimmers, setSwimmers] = useState<FilterSwimmer[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedSwimmerId, setSelectedSwimmerId] = useState('')
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null)

  async function load() {
    const params = new URLSearchParams()
    if (selectedGroupId) params.set('groupId', selectedGroupId)
    if (selectedSwimmerId) params.set('swimmerId', selectedSwimmerId)

    const response = await fetch(`${API_BASE_URL}/api/parent/photos?${params.toString()}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      setPhotos([])
      return
    }

    const body = (await response.json()) as PhotoResponse
    setPhotos(body.data)
    setGroups(body.filters.groups)
    setSwimmers(body.filters.swimmers)
  }

  useEffect(() => {
    void load()
  }, [selectedGroupId, selectedSwimmerId])

  const swimmerOptions = useMemo(() => {
    if (!selectedGroupId) return swimmers
    return swimmers.filter((item) => item.groupId === selectedGroupId)
  }, [selectedGroupId, swimmers])

  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Photo Gallery</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Browse all class photos and filter by group or tagged swimmer.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <select
            className="min-h-12 rounded-2xl border border-[var(--border)] px-4"
            value={selectedGroupId}
            onChange={(event) => {
              const next = event.target.value
              setSelectedGroupId(next)
              if (next && selectedSwimmerId) {
                const selectedSwimmer = swimmers.find((item) => item.id === selectedSwimmerId)
                if (selectedSwimmer?.groupId !== next) {
                  setSelectedSwimmerId('')
                }
              }
            }}
          >
            <option value="">All groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>

          <select
            className="min-h-12 rounded-2xl border border-[var(--border)] px-4"
            value={selectedSwimmerId}
            onChange={(event) => setSelectedSwimmerId(event.target.value)}
          >
            <option value="">All tagged swimmers</option>
            {swimmerOptions.map((swimmer) => (
              <option key={swimmer.id} value={swimmer.id}>
                {swimmer.firstName} {swimmer.lastName}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="min-h-12 rounded-2xl border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text-primary)]"
            onClick={() => {
              setSelectedGroupId('')
              setSelectedSwimmerId('')
            }}
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <article key={photo.id} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
            <button type="button" className="block w-full" onClick={() => setActivePhotoUrl(photo.url)}>
              <img src={photo.url} alt={photo.caption ?? 'Class photo'} className="h-56 w-full object-cover" loading="lazy" />
            </button>
            <div className="grid gap-2 p-4">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{photo.caption ?? 'Class moment'}</p>
              <p className="text-xs text-[var(--text-muted)]">Group: {photo.group.name}</p>
              <div className="flex flex-wrap gap-2">
                {photo.tags.map((tag) => (
                  <span key={`${photo.id}-${tag.swimmer.id}`} className="rounded-full bg-[var(--primary)]/10 px-2 py-1 text-xs text-[var(--primary-dark)]">
                    {tag.swimmer.firstName} {tag.swimmer.lastName}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      {photos.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--text-muted)]">
          No photos match your current filters yet.
        </div>
      ) : null}

      {activePhotoUrl ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" onClick={() => setActivePhotoUrl(null)}>
          <img src={activePhotoUrl} alt="Selected gallery photo" className="max-h-[90vh] w-auto max-w-[95vw] rounded-2xl" />
        </div>
      ) : null}
    </section>
  )
}
