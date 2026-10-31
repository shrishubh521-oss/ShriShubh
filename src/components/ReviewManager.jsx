import { useCallback, useEffect, useState } from 'react'
import { Star, Trash2, RefreshCw } from 'lucide-react'

const API_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const STATUSES = ['pending', 'approved', 'rejected']

async function api(path, token, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: { apikey: API_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
    })
    if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`)
    if (response.status === 204) return null
    const body = await response.text()
    return body ? JSON.parse(body) : null
}

export default function ReviewManager({ token }) {
    const [reviews, setReviews] = useState([])
    const [filter, setFilter] = useState('pending')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState('')
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [form, setForm] = useState({ name: '', rating: 5, review: '' })

    const loadReviews = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const rows = await api('/rest/v1/reviews?select=*&order=created_at.desc&limit=300', token)
            setReviews(Array.isArray(rows) ? rows : [])
        } catch (err) {
            setError(err.message || 'Could not load reviews. Run the reviews SQL migration and check admin permissions.')
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => { loadReviews() }, [loadReviews])

    async function addManualReview(event) {
        event.preventDefault()
        setSaving('new')
        setError('')
        setNotice('')
        try {
            const created = await api('/rest/v1/reviews?select=*', token, {
                method: 'POST',
                headers: { Prefer: 'return=representation' },
                body: JSON.stringify({ name: form.name.trim(), rating: Number(form.rating), review: form.review.trim(), source: 'admin', status: 'approved' }),
            })
            setReviews(current => [...(Array.isArray(created) ? created : []), ...current])
            setForm({ name: '', rating: 5, review: '' })
            setNotice('Review added and published.')
        } catch (err) {
            setError(err.message || 'Could not add this review.')
        } finally {
            setSaving('')
        }
    }

    async function setStatus(item, status) {
        setSaving(item.id)
        setError('')
        setNotice('')
        try {
            await api(`/rest/v1/reviews?id=eq.${encodeURIComponent(item.id)}`, token, {
                method: 'PATCH', headers: { Prefer: 'return=minimal' },
                body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
            })
            setReviews(current => current.map(row => row.id === item.id ? { ...row, status, updated_at: new Date().toISOString() } : row))
            setNotice(status === 'approved' ? 'Review approved and published.' : status === 'rejected' ? 'Review rejected.' : 'Review moved to pending.')
        } catch (err) {
            setError(err.message || 'Could not update review status.')
        } finally {
            setSaving('')
        }
    }

    async function deleteReview(item) {
        if (!window.confirm(`Delete the review from ${item.name}? This cannot be undone.`)) return
        setSaving(item.id)
        setError('')
        setNotice('')
        try {
            await api(`/rest/v1/reviews?id=eq.${encodeURIComponent(item.id)}`, token, { method: 'DELETE', headers: { Prefer: 'return=minimal' } })
            setReviews(current => current.filter(row => row.id !== item.id))
            setNotice('Review deleted.')
        } catch (err) {
            setError(err.message || 'Could not delete review.')
        } finally {
            setSaving('')
        }
    }

    const visible = reviews.filter(item => filter === 'all' || item.status === filter)
    return (
        <section className="admin-reviews-view">
            <div className="admin-pricing-intro"><div className="admin-eyebrow">CUSTOMER FEEDBACK</div><h2>Manage reviews</h2><p>Approve customer-submitted feedback before it appears publicly, or add a review manually when a customer shares feedback with you directly.</p></div>
            {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
            {notice && <div className="admin-alert admin-alert-success" role="status">{notice}</div>}
            <form className="admin-review-create" onSubmit={addManualReview}>
                <div><div className="admin-eyebrow">ADMIN-ADDED REVIEW</div><h3>Add a customer review</h3><p>Only add feedback that the customer genuinely provided and that you have permission to publish.</p></div>
                <label>Customer name<input required maxLength="80" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Customer name" /></label>
                <label>Rating<select value={form.rating} onChange={event => setForm({ ...form, rating: event.target.value })}>{[5,4,3,2,1].map(value => <option key={value} value={value}>{value} / 5 stars</option>)}</select></label>
                <label>Review<textarea required minLength="8" maxLength="1200" rows="4" value={form.review} onChange={event => setForm({ ...form, review: event.target.value })} placeholder="Enter the customer's feedback" /></label>
                <button className="admin-primary" type="submit" disabled={saving === 'new' || !form.name.trim() || form.review.trim().length < 8}>{saving === 'new' ? 'Adding…' : 'Add and publish review'}</button>
            </form>
            <div className="admin-review-list-heading"><div><h3>Submitted reviews</h3><p>{reviews.length} total review{reviews.length === 1 ? '' : 's'}</p></div><button className="admin-secondary" type="button" onClick={loadReviews} disabled={loading}><RefreshCw size={14} /> Refresh</button></div>
            <div className="admin-review-filters">{['pending','approved','rejected','all'].map(value => <button type="button" key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value[0].toUpperCase()+value.slice(1)} ({value === 'all' ? reviews.length : reviews.filter(item => item.status === value).length})</button>)}</div>
            {loading && reviews.length === 0 ? <p className="admin-empty">Loading reviews…</p> : visible.length === 0 ? <p className="admin-empty">No {filter === 'all' ? '' : filter + ' '}reviews yet.</p> : <div className="admin-review-list">{visible.map(item => <article className="admin-review-item" key={item.id}>
                <div className="admin-review-item-top"><div><strong>{item.name}</strong><span className={`admin-status status-${item.status}`}>{item.status}</span></div><small>{new Date(item.created_at).toLocaleDateString('en-IN')}</small></div>
                <div className="review-stars" aria-label={`${item.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill={index < item.rating ? 'currentColor' : 'none'} />)}</div>
                <p>{item.review}</p><small className="admin-review-source">Added by {item.source === 'admin' ? 'admin' : 'customer'}</small>
                <div className="admin-review-actions">{STATUSES.filter(status => status !== item.status).map(status => <button type="button" key={status} onClick={() => setStatus(item, status)} disabled={saving === item.id}>{status === 'approved' ? 'Approve & publish' : status === 'rejected' ? 'Reject' : 'Move to pending'}</button>)}<button type="button" className="danger" onClick={() => deleteReview(item)} disabled={saving === item.id}><Trash2 size={13} /> Delete</button></div>
            </article>)}</div>}
        </section>
    )
}
