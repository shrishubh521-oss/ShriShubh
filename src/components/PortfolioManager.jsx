import { useEffect, useState } from 'react'
import { ExternalLink, Eye, EyeOff, Monitor, Plus, Save, Trash2 } from 'lucide-react'

const API_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const EMPTY = { title: '', website_url: '', description: '', category: 'Website', technologies: '', thumbnail_url: '', is_featured: false, status: 'draft', sort_order: 0 }

function normalizeWebsiteUrl(value) {
    try {
        const url = new URL(value.trim())
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null
        const host = url.hostname.toLowerCase()
        if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host === '127.0.0.1' || host === '::1' || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null
        return url.href
    } catch { return null }
}

export default function PortfolioManager({ token }) {
    const [items, setItems] = useState([])
    const [form, setForm] = useState(EMPTY)
    const [editingId, setEditingId] = useState(null)
    const [preview, setPreview] = useState(false)
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    async function request(path, options = {}) {
        const response = await fetch(`${API_URL}${path}`, { ...options, headers: { apikey: API_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) } })
        if (!response.ok) throw new Error(await response.text() || `Request failed (${response.status})`)
        if (response.status === 204) return null
        const text = await response.text()
        return text ? JSON.parse(text) : null
    }

    async function load() {
        try {
            const rows = await request('/rest/v1/portfolio_projects?select=*&order=sort_order.asc,created_at.desc')
            setItems(Array.isArray(rows) ? rows : [])
        } catch (err) { setError(`Portfolio table not ready: ${err.message}. Run the portfolio migration in Supabase first.`) }
    }

    useEffect(() => { load() }, [token])

    function edit(item) {
        setEditingId(item.id)
        setForm({ ...EMPTY, ...item, technologies: Array.isArray(item.technologies) ? item.technologies.join(', ') : '' })
        setPreview(false)
        setError('')
        setMessage('')
    }

    function reset() {
        setEditingId(null)
        setForm(EMPTY)
        setPreview(false)
    }

    async function save(event) {
        event.preventDefault()
        setBusy(true); setError(''); setMessage('')
        const website = normalizeWebsiteUrl(form.website_url)
        const thumbnail = form.thumbnail_url.trim() ? normalizeWebsiteUrl(form.thumbnail_url) : null
        if (!website) { setError('Enter a valid public website URL beginning with https:// (or http://). Local/private network URLs are not allowed.'); setBusy(false); return }
        if (form.thumbnail_url.trim() && !thumbnail) { setError('Thumbnail must be a valid public HTTP or HTTPS image URL.'); setBusy(false); return }
        const payload = { title: form.title.trim(), website_url: website, description: form.description.trim(), category: form.category.trim(), technologies: form.technologies.split(',').map(value => value.trim()).filter(Boolean).slice(0, 12), thumbnail_url: thumbnail, is_featured: Boolean(form.is_featured), status: form.status, sort_order: Number(form.sort_order) || 0, updated_at: new Date().toISOString() }
        if (!payload.title) { setError('Project title is required.'); setBusy(false); return }
        if (payload.status === 'published' && !editingId) payload.published_at = new Date().toISOString()
        try {
            if (editingId) await request(`/rest/v1/portfolio_projects?id=eq.${encodeURIComponent(editingId)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(payload) })
            else await request('/rest/v1/portfolio_projects', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(payload) })
            setMessage(payload.status === 'published' ? 'Portfolio project saved and published.' : 'Portfolio project saved as a draft.')
            reset()
            await load()
        } catch (err) { setError(`Could not save portfolio project: ${err.message}`) }
        finally { setBusy(false) }
    }

    async function changeStatus(item, status) {
        setError(''); setMessage('')
        try {
            await request(`/rest/v1/portfolio_projects?id=eq.${encodeURIComponent(item.id)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status, updated_at: new Date().toISOString(), ...(status === 'published' ? { published_at: new Date().toISOString() } : {}) }) })
            setMessage(status === 'published' ? 'Project published.' : status === 'archived' ? 'Project archived.' : 'Project hidden as a draft.')
            await load()
        } catch (err) { setError(err.message) }
    }

    async function remove(item) {
        if (!window.confirm(`Delete "${item.title}" from the portfolio? This cannot be undone.`)) return
        try { await request(`/rest/v1/portfolio_projects?id=eq.${encodeURIComponent(item.id)}`, { method: 'DELETE' }); setMessage('Portfolio entry deleted.'); await load() }
        catch (err) { setError(err.message) }
    }

    const safePreviewUrl = normalizeWebsiteUrl(form.website_url)
    return <section className="admin-portfolio-view">
        <div className="admin-pricing-intro"><div className="admin-eyebrow">WEBSITE SHOWCASE</div><h2>Manage portfolio websites</h2><p>Add a public website URL, preview it, then publish it to the public portfolio. Websites that block embedding can still be linked directly.</p></div>
        {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
        {message && <div className="admin-alert admin-alert-success" role="status">{message}</div>}
        <div className="admin-portfolio-layout">
            <form className="admin-project-form" onSubmit={save}>
                <div className="admin-portfolio-form-head"><div><div className="admin-eyebrow">{editingId ? 'EDIT WEBSITE' : 'ADD WEBSITE'}</div><h2>{editingId ? 'Update showcase entry' : 'Add a website to showcase'}</h2></div>{editingId && <button type="button" className="admin-secondary" onClick={reset}>Cancel edit</button>}</div>
                <div className="admin-project-form-grid">
                    <label>Project / website name<input required maxLength="100" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Business website" /></label>
                    <label>Public website URL<input required type="url" inputMode="url" value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://example.com" /></label>
                    <label>Category<input maxLength="60" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Business, portfolio, store…" /></label>
                    <label>Technologies<input value={form.technologies} onChange={e => setForm({ ...form, technologies: e.target.value })} placeholder="React, WordPress, HTML/CSS" /></label>
                    <label>Thumbnail / screenshot URL<input type="url" value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://example.com/preview.jpg" /></label>
                    <label>Display order<input type="number" min="0" max="9999" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></label>
                    <label className="admin-project-notes">Description<textarea rows="3" maxLength="500" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What should visitors know about this website?" /></label>
                    <label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Draft (not public)</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
                    <label className="admin-active-toggle"><input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} /> Feature this project</label>
                </div>
                <div className="admin-portfolio-actions"><button className="admin-primary" type="submit" disabled={busy}><Save size={15} /> {busy ? 'Saving…' : editingId ? 'Save changes' : 'Save website'}</button><button type="button" className="admin-secondary" onClick={() => setPreview(value => !value)} disabled={!safePreviewUrl}><Monitor size={15} /> {preview ? 'Hide preview' : 'Preview website'}</button></div>
                {preview && safePreviewUrl && <div className="admin-portfolio-preview"><iframe title="Admin website preview" src={safePreviewUrl} sandbox="allow-scripts allow-forms" referrerPolicy="no-referrer" /><p>Some websites prevent embedding. Use the open link to check those sites.</p><a href={safePreviewUrl} target="_blank" rel="noopener noreferrer">Open website in new tab <ExternalLink size={14} /></a></div>}
                <p className="admin-help-note">Only public HTTP/HTTPS websites are accepted. Never paste passwords, private admin URLs or customer account links here.</p>
            </form>
            <aside className="admin-portfolio-list"><div className="admin-project-list-heading"><div><h2>Showcase entries</h2><p>{items.length} website{items.length === 1 ? '' : 's'}</p></div><button type="button" className="admin-secondary" onClick={load}>Refresh</button></div>
                {items.length === 0 ? <p className="admin-empty">No portfolio websites added yet.</p> : items.map(item => <article className="admin-portfolio-item" key={item.id}>
                    <div className="admin-portfolio-item-copy"><span className={`admin-status status-${item.status === 'published' ? 'completed' : item.status === 'archived' ? 'on_hold' : 'planning'}`}>{item.status}</span><h3>{item.title}</h3><a href={normalizeWebsiteUrl(item.website_url) || '#'} target="_blank" rel="noopener noreferrer">{item.website_url}</a></div>
                    <div className="admin-portfolio-item-actions"><button type="button" onClick={() => edit(item)} aria-label={`Edit ${item.title}`}>Edit</button>{item.status === 'published' ? <button type="button" onClick={() => changeStatus(item, 'draft')}><EyeOff size={14} /> Hide</button> : <button type="button" onClick={() => changeStatus(item, 'published')}><Eye size={14} /> Publish</button>}<button type="button" onClick={() => remove(item)} aria-label={`Delete ${item.title}`}><Trash2 size={14} /></button></div>
                </article>)}
            </aside>
        </div>
    </section>
}
