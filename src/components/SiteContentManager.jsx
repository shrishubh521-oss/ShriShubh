import { useEffect, useState } from 'react'
import { Archive, Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react'

const API_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const TYPES = [
    { value: 'service', label: 'Services' },
    { value: 'faq', label: 'FAQs' },
    { value: 'testimonial', label: 'Testimonials' },
    { value: 'promotion', label: 'Promotions' },
    { value: 'blog_post', label: 'Blog posts' },
]
const EMPTY = { content_type: 'service', title: '', description: '', label: '', status: 'draft', sort_order: 0 }

export default function SiteContentManager({ token }) {
    const [type, setType] = useState('service')
    const [items, setItems] = useState([])
    const [form, setForm] = useState(EMPTY)
    const [editingId, setEditingId] = useState(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    async function request(path, options = {}) {
        const response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: { apikey: API_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
        })
        if (!response.ok) throw new Error(await response.text() || `Request failed (${response.status})`)
        if (response.status === 204) return null
        const body = await response.text()
        return body ? JSON.parse(body) : null
    }

    async function load() {
        setError('')
        try {
            const rows = await request(`/rest/v1/site_content?select=*&content_type=eq.${type}&order=sort_order.asc,created_at.desc`)
            setItems(Array.isArray(rows) ? rows : [])
        } catch (err) {
            setError(`Content table not ready. Run supabase/site-content.sql first. ${err.message}`)
        }
    }

    useEffect(() => { load() }, [token, type])

    function edit(item) {
        setEditingId(item.id)
        setForm({ content_type: item.content_type, title: item.title, description: item.description || '', label: item.label || '', status: item.status, sort_order: item.sort_order || 0 })
        setNotice('')
        setError('')
    }

    function reset() {
        setEditingId(null)
        setForm({ ...EMPTY, content_type: type })
    }

    async function save(event) {
        event.preventDefault()
        setBusy(true)
        setError('')
        setNotice('')
        try {
            const payload = { ...form, sort_order: Number(form.sort_order), updated_at: new Date().toISOString(), published_at: form.status === 'published' ? new Date().toISOString() : null }
            if (editingId) {
                await request(`/rest/v1/site_content?id=eq.${editingId}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(payload) })
                setNotice('Content updated.')
            } else {
                await request('/rest/v1/site_content', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(payload) })
                setNotice('Content created.')
            }
            reset()
            await load()
        } catch (err) { setError(err.message) }
        finally { setBusy(false) }
    }

    async function changeStatus(item, status) {
        try {
            await request(`/rest/v1/site_content?id=eq.${item.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status, updated_at: new Date().toISOString(), published_at: status === 'published' ? new Date().toISOString() : null }) })
            setNotice(status === 'published' ? 'Content published.' : status === 'archived' ? 'Content archived.' : 'Content moved to draft.')
            await load()
        } catch (err) { setError(err.message) }
    }

    async function remove(item) {
        if (!window.confirm(`Delete "${item.title}" permanently?`)) return
        try {
            await request(`/rest/v1/site_content?id=eq.${item.id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } })
            setNotice('Content deleted.')
            if (editingId === item.id) reset()
            await load()
        } catch (err) { setError(err.message) }
    }

    const selected = TYPES.find(item => item.value === type)
    return (
        <section className="admin-content-manager">
            <div className="admin-content-manager-heading">
                <div><div className="admin-eyebrow">WEBSITE CONTENT STUDIO</div><h2>Manage public content</h2><p>Publish content here to update the matching public website sections. Draft and archived entries stay hidden from visitors.</p></div>
                <button type="button" className="admin-secondary" onClick={reset}><Plus size={14} /> New {selected?.label.slice(0, -1) || 'item'}</button>
            </div>
            <div className="admin-content-type-tabs" role="tablist" aria-label="Content types">
                {TYPES.map(item => <button type="button" role="tab" aria-selected={type === item.value} className={type === item.value ? 'active' : ''} key={item.value} onClick={() => { setType(item.value); reset(); setNotice('') }}>{item.label}</button>)}
            </div>
            {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
            {notice && <div className="admin-alert admin-alert-success" role="status">{notice}</div>}
            <div className="admin-content-manager-grid">
                <form className="admin-content-editor" onSubmit={save}>
                    <div className="admin-eyebrow">{editingId ? 'EDIT ENTRY' : 'NEW ENTRY'}</div>
                    <h3>{editingId ? 'Update content' : 'Create content'}</h3>
                    <label>Title / question<input required minLength="2" maxLength="160" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label>
                    <label>{type === 'faq' ? 'Answer' : type === 'service' ? 'Description' : 'Body / description'}<textarea rows="5" maxLength="5000" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
                    <label>{type === 'faq' ? 'Category (optional)' : 'Label / category'}<input maxLength="120" value={form.label} onChange={event => setForm({ ...form, label: event.target.value })} /></label>
                    <div className="admin-content-editor-row">
                        <label>Display order<input type="number" min="0" max="9999" value={form.sort_order} onChange={event => setForm({ ...form, sort_order: event.target.value })} /></label>
                        <label>Visibility<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
                    </div>
                    <div className="admin-content-editor-actions"><button className="admin-primary" type="submit" disabled={busy}><Save size={15} /> {busy ? 'Saving…' : editingId ? 'Save changes' : 'Create entry'}</button>{editingId && <button type="button" className="admin-secondary" onClick={reset}>Cancel edit</button>}</div>
                </form>
                <div className="admin-content-list">
                    <div className="admin-project-list-heading"><div><h3>{selected?.label}</h3><p>{items.length} entries</p></div></div>
                    {items.length === 0 ? <div className="admin-empty">No entries yet. Create one to get started.</div> : items.map(item => (
                        <article className="admin-content-item" key={item.id}>
                            <div className="admin-content-item-top"><span className={`admin-status status-${item.status}`}>{item.status}</span><small>Order {item.sort_order}</small></div>
                            <h4>{item.title}</h4><p>{item.description}</p>{item.label && <small>{item.label}</small>}
                            <div className="admin-content-item-actions"><button type="button" onClick={() => edit(item)}>Edit</button>{item.status !== 'published' && <button type="button" onClick={() => changeStatus(item, 'published')}><Eye size={13} /> Publish</button>}{item.status === 'published' && <button type="button" onClick={() => changeStatus(item, 'draft')}><EyeOff size={13} /> Hide</button>}{item.status !== 'archived' && <button type="button" onClick={() => changeStatus(item, 'archived')}><Archive size={13} /> Archive</button>}<button type="button" onClick={() => remove(item)}><Trash2 size={13} /> Delete</button></div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}
