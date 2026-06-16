import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from '../config'

type Photo = {
  id: string
  groupId: string
  url: string
  thumbnailUrl?: string | null
  caption: string | null
  group: { id: string; name: string }
  tags: Array<{ swimmer: { id: string; firstName: string; lastName: string; groupId: string | null } }>
}

type Group = { id: string; name: string }
type Swimmer = { id: string; firstName: string; lastName: string; groupId: string | null }

export function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [form, setForm] = useState({ groupId: '', url: '', caption: '', taggedSwimmerIds: [] as string[] })
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedSwimmerId, setSelectedSwimmerId] = useState('')
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const photoParams = new URLSearchParams()
    if (selectedGroupId) photoParams.set('groupId', selectedGroupId)
    if (selectedSwimmerId) photoParams.set('swimmerId', selectedSwimmerId)

    const [photosRes, groupsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/photos?${photoParams.toString()}`, { credentials: 'include' }),
      fetch(`${API_BASE_URL}/api/groups`, { credentials: 'include' })
    ])
    const swimmersRes = await fetch(`${API_BASE_URL}/api/swimmers?status=APPROVED`, { credentials: 'include' })
    const photosBody = (await photosRes.json()) as { data: Photo[] }
    const groupsBody = (await groupsRes.json()) as { data: Group[] }
    const swimmersBody = (await swimmersRes.json()) as {
      data: Array<{ id: string; firstName: string; lastName: string; groupName: string | null }>
    }

    const fullSwimmers = await Promise.all(
      swimmersBody.data.map(async (item) => {
        const response = await fetch(`${API_BASE_URL}/api/swimmers/${item.id}`, { credentials: 'include' })
        if (!response.ok) return null
        const body = (await response.json()) as { data: { id: string; firstName: string; lastName: string; groupId: string | null } }
        return body.data
      })
    )

    setPhotos(photosBody.data)
    setGroups(groupsBody.data)
    setSwimmers(fullSwimmers.filter(Boolean) as Swimmer[])
  }

  useEffect(() => {
    void load()
  }, [selectedGroupId, selectedSwimmerId])

  async function upload(event: FormEvent) {
    event.preventDefault()

    const response = await fetch(`${API_BASE_URL}/api/photos/upload`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    if (response.ok) {
      setMessage('Photo registered')
      setForm({ groupId: '', url: '', caption: '', taggedSwimmerIds: [] })
      await load()
    }
  }

  async function remove(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/photos/${id}`, { method: 'DELETE', credentials: 'include' })
    if (response.ok) {
      setMessage('Photo deleted')
      await load()
    }
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Photo Management</h1>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={upload}>
          <select className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={form.groupId} onChange={(e) => setForm((p) => ({ ...p, groupId: e.target.value }))} required>
            <option value="">Group</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Photo URL" value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} required />
          <select
            multiple
            className="min-h-32 rounded-2xl border border-[var(--border)] px-4 py-2 md:col-span-2"
            value={form.taggedSwimmerIds}
            onChange={(event) => {
              const values = Array.from(event.target.selectedOptions).map((option) => option.value)
              setForm((prev) => ({ ...prev, taggedSwimmerIds: values }))
            }}
          >
            {swimmers
              .filter((swimmer) => !form.groupId || swimmer.groupId === form.groupId)
              .map((swimmer) => (
                <option key={swimmer.id} value={swimmer.id}>
                  {swimmer.firstName} {swimmer.lastName}
                </option>
              ))}
          </select>
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4 md:col-span-2" placeholder="Caption" value={form.caption} onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))} />
          <button type="submit" className="min-h-12 rounded-2xl bg-[var(--primary)] px-4 text-white">Add photo</button>
        </form>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <div className="grid gap-3 md:grid-cols-3">
          <select className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
            <option value="">All groups</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
          <select className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={selectedSwimmerId} onChange={(e) => setSelectedSwimmerId(e.target.value)}>
            <option value="">All tagged swimmers</option>
            {swimmers
              .filter((swimmer) => !selectedGroupId || swimmer.groupId === selectedGroupId)
              .map((swimmer) => (
                <option key={swimmer.id} value={swimmer.id}>{swimmer.firstName} {swimmer.lastName}</option>
              ))}
          </select>
          <button type="button" className="min-h-12 rounded-2xl border border-[var(--border)] px-4 text-sm font-semibold" onClick={() => { setSelectedGroupId(''); setSelectedSwimmerId('') }}>
            Clear filters
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
            <button type="button" className="block w-full" onClick={() => setActivePhotoUrl(photo.url)}>
              <img
                src={photo.thumbnailUrl ?? photo.url}
                alt={photo.caption ?? 'Swim class photo'}
                loading="lazy"
                className="h-24 w-full object-cover"
              />
            </button>
            <div className="p-4">
            <p className="text-sm text-[var(--text-muted)]">Group: {photo.group.name}</p>
            <a href={photo.url} target="_blank" rel="noreferrer" className="font-semibold text-[var(--primary-dark)]">Open photo</a>
            <p className="text-sm text-[var(--text-muted)]">{photo.caption ?? 'No caption'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {photo.tags.map((tag) => (
                <span key={`${photo.id}-${tag.swimmer.id}`} className="rounded-full bg-[var(--primary)]/10 px-2 py-1 text-xs text-[var(--primary-dark)]">
                  {tag.swimmer.firstName} {tag.swimmer.lastName}
                </span>
              ))}
            </div>
            <button type="button" className="mt-3 min-h-12 rounded-2xl bg-[var(--error)] px-4 text-sm font-semibold text-white" onClick={() => void remove(photo.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {activePhotoUrl ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" onClick={() => setActivePhotoUrl(null)}>
          <img src={activePhotoUrl} alt="Selected gallery photo" className="max-h-[90vh] w-auto max-w-[95vw] rounded-2xl" />
        </div>
      ) : null}

      {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
    </section>
  )
}
