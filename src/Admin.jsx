import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, LogOut, RefreshCw, Search, Mail, ShieldCheck, Inbox, Clock3, Globe } from 'lucide-react'
import PortfolioManager from './components/PortfolioManager.jsx'
import SiteContentManager from './components/SiteContentManager.jsx'

const API_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const STATUSES = ['new', 'contacted', 'in_progress', 'closed', 'spam']
const PROJECT_STATUSES = ['enquiry', 'planning', 'in_progress', 'review', 'completed', 'on_hold']
const DEFAULT_PACKAGES = [
    { id: 'starter', name: 'Starter', price_inr: 3999, description: 'For individuals and small businesses getting online.', features: ['Up to 5 website pages', 'Mobile-responsive design', 'Contact form layout', 'Basic on-page SEO setup', 'Social media links'], is_active: true },
    { id: 'professional', name: 'Professional', price_inr: 5999, description: 'For growing businesses ready for a stronger online presence.', features: ['Up to 10 website pages', 'Custom premium design', 'Responsive on all devices', 'Contact and enquiry forms', 'SEO-ready page structure', 'Performance optimization'], is_active: true },
    { id: 'business-plus', name: 'Business Plus', price_inr: 13999, description: 'For businesses that need more features and flexibility.', features: ['Up to 15 website pages', 'Advanced custom sections', 'CMS or product catalogue setup', 'Analytics integration setup', 'Advanced enquiry experience', 'Priority launch support'], is_active: true },
]

async function api(path, token, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            apikey: API_KEY,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    })
    if (!response.ok) {
        const details = await response.text()
        throw new Error(details || `Request failed (${response.status})`)
    }
    if (response.status === 204) return null
    const text = await response.text()
    return text ? JSON.parse(text) : null
}

function dateLabel(value) {
    return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function Admin() {
    // Keep administrator tokens in memory only; a page reload requires a fresh sign-in.
    const [session, setSession] = useState(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [enquiries, setEnquiries] = useState([])
    const [projects, setProjects] = useState([])
    const [packages, setPackages] = useState(DEFAULT_PACKAGES)
    const [savingPackageId, setSavingPackageId] = useState('')
    const [creatingPackage, setCreatingPackage] = useState(false)
    const [newPackage, setNewPackage] = useState({ name: '', price_inr: '', description: '', features: '', is_active: true })
    const [activeView, setActiveView] = useState('enquiries')
    const [projectForm, setProjectForm] = useState({ client_name: '', client_email: '', project_name: '', status: 'enquiry', progress: 0, due_date: '', notes: '' })
    const [savingProject, setSavingProject] = useState(false)
    const [selectedId, setSelectedId] = useState(null)
    const [query, setQuery] = useState('')
    const [filter, setFilter] = useState('all')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    const loadPackages = useCallback(async (token) => {
        try {
            const data = await api('/rest/v1/pricing_packages?select=*&order=price_inr.asc', token)
            if (Array.isArray(data) && data.length) setPackages(data.map(row => ({ ...row, features: Array.isArray(row.features) ? row.features : [] })))
        } catch (err) {
            setError(err.message || 'Could not load pricing packages. Check the pricing_packages table and policies.')
        }
    }, [])

    const loadProjects = useCallback(async (token) => {
        try {
            const data = await api('/rest/v1/projects?select=*&order=created_at.desc&limit=200', token)
            setProjects(Array.isArray(data) ? data : [])
        } catch (err) {
            setError(err.message || 'Could not load projects. Check the Supabase projects table and admin policies.')
        }
    }, [])

    const loadEnquiries = useCallback(async (token) => {
        setLoading(true)
        setError('')
        try {
            const data = await api('/rest/v1/enquiries?select=*&order=created_at.desc&limit=200', token)
            setEnquiries(Array.isArray(data) ? data : [])
        } catch (err) {
            setError(err.message || 'Could not load enquiries. Check the Supabase policies and connection.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (session?.access_token) {
            loadEnquiries(session.access_token)
            loadProjects(session.access_token)
            loadPackages(session.access_token)
        }
    }, [session, loadEnquiries, loadProjects, loadPackages])

    async function signIn(event) {
        event.preventDefault()
        setLoading(true)
        setError('')
        setNotice('')
        if (!API_URL || !API_KEY || API_URL.includes('YOUR-PROJECT')) {
            setError('Supabase is not configured. Add the Supabase URL and publishable/anon key to the GitHub Actions repository variables.')
            setLoading(false)
            return
        }
        try {
            const response = await fetch(`${API_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: { apikey: API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.msg || result.message || result.error_description || 'Sign-in failed. Check your email and password.')
            const token = result.access_token
            const user = result.user
            const admins = await api(`/rest/v1/admin_users?select=user_id&user_id=eq.${encodeURIComponent(user.id)}`, token)
            if (!Array.isArray(admins) || admins.length === 0) {
                await fetch(`${API_URL}/auth/v1/logout`, { method: 'POST', headers: { apikey: API_KEY, Authorization: `Bearer ${token}` } })
                throw new Error('This account is not on the ShriShubh admin allowlist. Ask the project owner to verify the admin_users record and RLS policy.')
            }
            const nextSession = { access_token: token, refresh_token: result.refresh_token, user }
            setSession(nextSession)
            setPassword('')
            setNotice('Signed in securely.')
        } catch (err) {
            setError(err.message || 'Could not sign in.')
        } finally {
            setLoading(false)
        }
    }

    async function signOut() {
        if (session?.access_token && API_URL) {
            try { await fetch(`${API_URL}/auth/v1/logout`, { method: 'POST', headers: { apikey: API_KEY, Authorization: `Bearer ${session.access_token}` } }) } catch { /* local sign-out still proceeds */ }
        }
        setSession(null)
        setEnquiries([])
        setSelectedId(null)
        setNotice('')
        setError('')
    }

    async function createProject(event) {
        event.preventDefault()
        setSavingProject(true)
        setError('')
        setNotice('')
        try {
            const payload = {
                client_name: projectForm.client_name.trim(),
                client_email: projectForm.client_email.trim(),
                project_name: projectForm.project_name.trim(),
                status: projectForm.status,
                progress: Number(projectForm.progress),
                due_date: projectForm.due_date || null,
                notes: projectForm.notes.trim() || null,
            }
            const created = await api('/rest/v1/projects?select=*', session.access_token, {
                method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(payload),
            })
            setProjects(current => [...(Array.isArray(created) ? created : []), ...current])
            setProjectForm({ client_name: '', client_email: '', project_name: '', status: 'enquiry', progress: 0, due_date: '', notes: '' })
            setNotice('Project created successfully.')
        } catch (err) {
            setError(err.message || 'Could not create project.')
        } finally {
            setSavingProject(false)
        }
    }

    async function savePackage(pkg) {
        setSavingPackageId(pkg.id)
        setError('')
        setNotice('')
        try {
            const payload = { name: pkg.name.trim(), price_inr: Number(pkg.price_inr), description: pkg.description.trim(), features: pkg.features, is_active: pkg.is_active, updated_at: new Date().toISOString() }
            await api(`/rest/v1/pricing_packages?id=eq.${encodeURIComponent(pkg.id)}`, session.access_token, {
                method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(payload),
            })
            setNotice(`${pkg.name} pricing saved. The public site will show the new price after the pricing table is configured and the website is deployed.`)
        } catch (err) {
            setError(err.message || 'Could not save pricing. Check the pricing_packages table and admin policies.')
        } finally {
            setSavingPackageId('')
        }
    }

    async function createPackage(event) {
        event.preventDefault()
        setCreatingPackage(true)
        setError('')
        setNotice('')
        const name = newPackage.name.trim()
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 35)
        const id = `${slug || 'service'}-${Date.now().toString(36)}`
        try {
            const payload = {
                id,
                name,
                price_inr: Number(newPackage.price_inr),
                description: newPackage.description.trim(),
                features: newPackage.features.split('\n').map(item => item.trim()).filter(Boolean).slice(0, 20),
                is_active: newPackage.is_active,
                updated_at: new Date().toISOString(),
            }
            const created = await api('/rest/v1/pricing_packages?select=*', session.access_token, {
                method: 'POST',
                headers: { Prefer: 'return=representation' },
                body: JSON.stringify(payload),
            })
            if (!Array.isArray(created) || created.length === 0) throw new Error('The new service was not returned. Refresh the pricing list and check Supabase permissions.')
            setPackages(current => [...current, { ...created[0], features: Array.isArray(created[0].features) ? created[0].features : [] }].sort((x, y) => Number(x.price_inr) - Number(y.price_inr)))
            setNewPackage({ name: '', price_inr: '', description: '', features: '', is_active: true })
            setNotice(`${name} was added to pricing successfully.`)
        } catch (err) {
            setError(err.message || 'Could not add the new pricing service. Check pricing_packages insert permissions.')
        } finally {
            setCreatingPackage(false)
        }
    }

    async function deletePackage(pkg) {
        if (!window.confirm(`Delete "${pkg.name}" from website pricing? This cannot be undone.`)) return
        setError('')
        setNotice('')
        try {
            await api(`/rest/v1/pricing_packages?id=eq.${encodeURIComponent(pkg.id)}`, session.access_token, {
                method: 'DELETE',
                headers: { Prefer: 'return=minimal' },
            })
            setPackages(current => current.filter(item => item.id !== pkg.id))
            setNotice(`${pkg.name} was deleted from pricing.`)
        } catch (err) {
            setError(err.message || 'Could not delete this pricing service.')
        }
    }

    function updatePackage(id, patch) {
        setPackages(current => current.map(pkg => pkg.id === id ? { ...pkg, ...patch } : pkg))
    }

    async function updateProject(project, patch) {
        setError('')
        setNotice('')
        const nextPatch = { ...patch, updated_at: new Date().toISOString() }
        try {
            await api(`/rest/v1/projects?id=eq.${encodeURIComponent(project.id)}`, session.access_token, {
                method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(nextPatch),
            })
            setProjects(current => current.map(row => row.id === project.id ? { ...row, ...nextPatch } : row))
            setNotice('Project updated.')
        } catch (err) {
            setError(err.message || 'Could not update project.')
        }
    }

    async function updateStatus(item, status) {
        setError('')
        setNotice('')
        try {
            await api(`/rest/v1/enquiries?id=eq.${encodeURIComponent(item.id)}`, session.access_token, {
                method: 'PATCH',
                headers: { Prefer: 'return=minimal' },
                body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
            })
            setEnquiries(current => current.map(row => row.id === item.id ? { ...row, status, updated_at: new Date().toISOString() } : row))
            setNotice('Enquiry status updated.')
        } catch (err) {
            setError(err.message || 'Could not update enquiry status.')
        }
    }

    const filtered = useMemo(() => enquiries.filter(item => {
        const matchesFilter = filter === 'all' || item.status === filter
        const needle = query.trim().toLowerCase()
        const matchesQuery = !needle || [item.name, item.email, item.service, item.message].some(value => String(value || '').toLowerCase().includes(needle))
        return matchesFilter && matchesQuery
    }), [enquiries, filter, query])
    const selected = filtered.find(item => item.id === selectedId) || enquiries.find(item => item.id === selectedId) || null
    const countNew = enquiries.filter(item => item.status === 'new').length

    return (
        <div className="admin-shell">
            <header className="admin-topbar">
                <a className="admin-back" href="#home" aria-label="Back to ShriShubh homepage"><ArrowLeft size={17} /> <span>ShriShubh</span></a>
                <div className="admin-brand"><ShieldCheck size={18} /> ADMIN CONSOLE</div>
                {session && <button className="admin-logout" onClick={signOut}><LogOut size={16} /> Sign out</button>}
            </header>

            {!session ? (
                <main className="admin-login-wrap">
                    <form className="admin-login-card" onSubmit={signIn}>
                        <div className="admin-icon"><ShieldCheck size={25} /></div>
                        <div className="admin-eyebrow">RESTRICTED ACCESS</div>
                        <h1>Admin sign in</h1>
                        <p>Use the email and password for the admin account you created in Supabase. Only accounts on the configured admin allowlist can open enquiry records.</p>
                        {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
                        <label>Email address<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
                        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
                        <button className="admin-primary" type="submit" disabled={loading}>{loading ? 'Checking access…' : 'Sign in securely'}</button>
                        <small>Authentication and access checks are handled by Supabase. Do not share your password or add secret keys to the website.</small>
                    </form>
                </main>
            ) : (
                <main className="admin-content">
                    <div className="admin-heading-row">
                        <div><div className="admin-eyebrow">SHRISHUBH / WORKSPACE</div><h1>Enquiry inbox</h1><p>Review incoming requests and update their status.</p></div>
                        <button className="admin-secondary" onClick={() => { loadEnquiries(session.access_token); loadProjects(session.access_token) }} disabled={loading}><RefreshCw size={15} /> Refresh</button>
                    </div>
                    <nav className="admin-view-tabs" aria-label="Admin sections"><button type="button" className={activeView === 'enquiries' ? 'active' : ''} onClick={() => setActiveView('enquiries')}><Inbox size={15} /> Enquiries</button><button type="button" className={activeView === 'projects' ? 'active' : ''} onClick={() => setActiveView('projects')}><Clock3 size={15} /> Projects</button><button type="button" className={activeView === 'pricing' ? 'active' : ''} onClick={() => setActiveView('pricing')}><ShieldCheck size={15} /> Pricing</button><button type="button" className={activeView === 'portfolio' ? 'active' : ''} onClick={() => setActiveView('portfolio')}><Globe size={15} /> Portfolio</button><button type="button" className={activeView === 'content' ? 'active' : ''} onClick={() => setActiveView('content')}><Globe size={15} /> Content</button></nav>
                    <div className="admin-stats">
                        <div><Inbox size={19} /><span>Total enquiries</span><strong>{enquiries.length}</strong></div>
                        <div><Mail size={19} /><span>New enquiries</span><strong>{countNew}</strong></div>
                        <div><Clock3 size={19} /><span>In progress</span><strong>{enquiries.filter(item => item.status === 'in_progress').length}</strong></div>
                    </div>
                    {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
                    {notice && <div className="admin-alert admin-alert-success" role="status">{notice}</div>}
                    {activeView === 'content' ? <SiteContentManager token={session.access_token} /> : activeView === 'enquiries' ? <div className="admin-inbox-layout">
                        <section className="admin-list-panel">
                            <div className="admin-filters">
                                <label className="admin-search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, email, service…" /></label>
                                <select aria-label="Filter by status" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All statuses</option>{STATUSES.map(status => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}</select>
                            </div>
                            {loading && enquiries.length === 0 ? <p className="admin-empty">Loading enquiries…</p> : filtered.length === 0 ? <p className="admin-empty">No enquiries match this view yet.</p> : (
                                <div className="admin-enquiry-list">{filtered.map(item => (
                                    <button type="button" className={selectedId === item.id ? 'admin-enquiry-row selected' : 'admin-enquiry-row'} key={item.id} onClick={() => setSelectedId(item.id)}>
                                        <span className="admin-enquiry-head"><strong>{item.name}</strong><small>{dateLabel(item.created_at)}</small></span>
                                        <span className="admin-enquiry-service">{item.service}</span>
                                        <span className="admin-enquiry-preview">{item.message}</span>
                                        <span className={`admin-status status-${item.status}`}>{item.status.replace('_', ' ')}</span>
                                    </button>
                                ))}</div>
                            )}
                        </section>
                        <section className="admin-detail-panel">
                            {!selected ? <div className="admin-detail-empty"><Mail size={26} /><h2>Select an enquiry</h2><p>Choose a message from the list to see its details.</p></div> : (
                                <div className="admin-detail">
                                    <div className="admin-detail-title"><div><div className="admin-eyebrow">ENQUIRY DETAILS</div><h2>{selected.name}</h2><p>{dateLabel(selected.created_at)}</p></div><span className={`admin-status status-${selected.status}`}>{selected.status.replace('_', ' ')}</span></div>
                                    <dl className="admin-detail-fields"><div><dt>Email</dt><dd><a href={`mailto:${encodeURIComponent(selected.email)}`}>{selected.email}</a></dd></div><div><dt>Service</dt><dd>{selected.service}</dd></div><div><dt>Budget</dt><dd>{selected.budget || 'Not specified'}</dd></div></dl>
                                    <div className="admin-message"><span>PROJECT MESSAGE</span><p>{selected.message}</p></div>
                                    <label className="admin-status-control">Update status<select value={selected.status} onChange={event => updateStatus(selected, event.target.value)}>{STATUSES.map(status => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}</select></label>
                                    <a className="admin-primary admin-reply-link" href={`mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent('Re: Your ShriShubh enquiry')}&body=${encodeURIComponent(`Hello ${selected.name},\n\nThank you for contacting ShriShubh about ${selected.service}.\n\n\nRegards,\nShriShubh\nshrishubh521@gmail.com`)}`}><Mail size={16} /> Reply by email</a>
                                    <p className="admin-help-note">This opens your email app with a draft. It does not send mail automatically or track delivery.</p>
                                </div>
                            )}
                        </section>
                    </div> : activeView === 'projects' ? <section className="admin-projects-view">
                        <form className="admin-project-form" onSubmit={createProject}>
                            <div><div className="admin-eyebrow">PROJECT TRACKING</div><h2>Add a project</h2><p>Create a client project and track its status, progress and due date.</p></div>
                            <div className="admin-project-form-grid">
                                <label>Client name<input required value={projectForm.client_name} onChange={e => setProjectForm({ ...projectForm, client_name: e.target.value })} /></label>
                                <label>Client email<input type="email" required value={projectForm.client_email} onChange={e => setProjectForm({ ...projectForm, client_email: e.target.value })} /></label>
                                <label>Project name<input required value={projectForm.project_name} onChange={e => setProjectForm({ ...projectForm, project_name: e.target.value })} /></label>
                                <label>Due date<input type="date" value={projectForm.due_date} onChange={e => setProjectForm({ ...projectForm, due_date: e.target.value })} /></label>
                                <label>Initial status<select value={projectForm.status} onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}>{PROJECT_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></label>
                                <label>Progress: {projectForm.progress}%<input type="range" min="0" max="100" step="5" value={projectForm.progress} onChange={e => setProjectForm({ ...projectForm, progress: e.target.value })} /></label>
                                <label className="admin-project-notes">Notes<textarea rows="2" value={projectForm.notes} onChange={e => setProjectForm({ ...projectForm, notes: e.target.value })} placeholder="Scope, next steps, or internal notes" /></label>
                            </div>
                            <button className="admin-primary" type="submit" disabled={savingProject}>{savingProject ? 'Saving project…' : 'Create project'}</button>
                        </form>
                        <div className="admin-project-list-heading"><div><h2>Client projects</h2><p>{projects.length} project{projects.length === 1 ? '' : 's'} in your workspace</p></div></div>
                        {projects.length === 0 ? <div className="admin-empty">No projects yet. Create your first project above.</div> : <div className="admin-project-grid">{projects.map(project => <article className="admin-project-card" key={project.id}>
                            <div className="admin-project-card-top"><div><div className="admin-eyebrow">{project.client_name}</div><h3>{project.project_name}</h3></div><span className={`admin-status status-${project.status}`}>{project.status.replace('_', ' ')}</span></div>
                            <a className="admin-project-email" href={`mailto:${encodeURIComponent(project.client_email)}`}>{project.client_email}</a>
                            <div className="admin-progress-heading"><span>Progress</span><strong>{project.progress}%</strong></div><div className="admin-progress-track"><span style={{ width: `${project.progress}%` }} /></div>
                            <div className="admin-project-controls"><label>Status<select value={project.status} onChange={e => updateProject(project, { status: e.target.value, ...(e.target.value === 'completed' ? { progress: 100 } : {}) })}>{PROJECT_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></label><label>Progress<select value={project.progress} onChange={e => updateProject(project, { progress: Number(e.target.value), ...(Number(e.target.value) === 100 ? { status: 'completed' } : {}) })}>{[0,10,20,30,40,50,60,70,80,90,100].map(n => <option key={n} value={n}>{n}%</option>)}</select></label></div>
                            <div className="admin-project-meta"><span>Due date</span><strong>{project.due_date || 'Not set'}</strong></div>
                            {project.notes && <p className="admin-project-note">{project.notes}</p>}
                        </article>)}</div>}
                    </section> : activeView === 'portfolio' ? <PortfolioManager token={session.access_token} /> : <section className="admin-pricing-view">
                        <div className="admin-pricing-intro"><div className="admin-eyebrow">PACKAGE MANAGEMENT</div><h2>Manage website pricing</h2><p>Add new services or packages, set their prices, edit existing details, and control which offers appear publicly. Changes are saved to Supabase.</p></div>
                        <form className="admin-pricing-card admin-pricing-add-form" onSubmit={createPackage}>
                            <div className="admin-pricing-card-heading"><div><span className="admin-eyebrow">NEW SERVICE</span><h3>Add a pricing option</h3></div></div>
                            <label>Service / package name<input required maxLength="60" value={newPackage.name} onChange={e => setNewPackage({ ...newPackage, name: e.target.value })} placeholder="e.g. SEO Optimization" /></label>
                            <label>Price (₹)<input type="number" min="0" max="10000000" step="1" required value={newPackage.price_inr} onChange={e => setNewPackage({ ...newPackage, price_inr: e.target.value })} placeholder="e.g. 4999" /></label>
                            <label>Description<textarea rows="3" maxLength="300" value={newPackage.description} onChange={e => setNewPackage({ ...newPackage, description: e.target.value })} placeholder="Briefly describe this service" /></label>
                            <label>Included features<textarea rows="4" value={newPackage.features} onChange={e => setNewPackage({ ...newPackage, features: e.target.value })} placeholder={'One feature per line\nResponsive design\nBasic SEO setup'} /><small>One feature per line, up to 20 features.</small></label>
                            <label className="admin-active-toggle"><input type="checkbox" checked={newPackage.is_active} onChange={e => setNewPackage({ ...newPackage, is_active: e.target.checked })} /> Publish on website</label>
                            <button className="admin-primary" type="submit" disabled={creatingPackage || !newPackage.name.trim() || newPackage.price_inr === ''}>{creatingPackage ? 'Adding service…' : 'Add service to pricing'}</button>
                        </form>
                        <div className="admin-pricing-grid">{packages.map(pkg => <form className="admin-pricing-card" key={pkg.id} onSubmit={event => { event.preventDefault(); savePackage(pkg) }}>
                            <div className="admin-pricing-card-heading"><div><span className="admin-eyebrow">PACKAGE / {pkg.id}</span><h3>{pkg.name}</h3></div><label className="admin-active-toggle"><input type="checkbox" checked={Boolean(pkg.is_active)} onChange={e => updatePackage(pkg.id, { is_active: e.target.checked })} /> Visible</label></div>
                            <label>Package name<input required maxLength="60" value={pkg.name} onChange={e => updatePackage(pkg.id, { name: e.target.value })} /></label>
                            <label>Starting price (₹)<input type="number" min="0" max="10000000" step="1" required value={pkg.price_inr} onChange={e => updatePackage(pkg.id, { price_inr: e.target.value })} /></label>
                            <label>Description<textarea rows="3" maxLength="300" value={pkg.description} onChange={e => updatePackage(pkg.id, { description: e.target.value })} /></label>
                            <label>Included features <textarea rows="5" value={pkg.features.join('\n')} onChange={e => updatePackage(pkg.id, { features: e.target.value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 20) })} /><small>One feature per line, up to 20 features.</small></label>
                            <button className="admin-primary" type="submit" disabled={savingPackageId === pkg.id}>{savingPackageId === pkg.id ? 'Saving…' : 'Save package'}</button>
                            <button className="admin-secondary" type="button" onClick={() => deletePackage(pkg)}>Delete service</button>
                        </form>)}</div>
                    </section>}
                    </main>
            )}
        </div>
    )
}
