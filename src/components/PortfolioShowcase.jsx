import { useEffect, useState } from 'react'
import { ArrowUpRight, ExternalLink, Monitor, Smartphone, X } from 'lucide-react'

const API_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

function safeHttpUrl(value) {
    try {
        const url = new URL(value)
        const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
        if (url.protocol !== 'https:' || url.username || url.password || !host.includes('.') || host.endsWith('.') || host.includes(':') || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.test') || /^\d+(\.\d+){3}$/.test(host) || (url.port && url.port !== '443')) return null
        return url.href
    } catch {
        return null
    }
}

export default function PortfolioShowcase() {
    const [items, setItems] = useState([])
    const [selected, setSelected] = useState(null)
    const [viewport, setViewport] = useState('desktop')
    const [loadError, setLoadError] = useState(false)

    useEffect(() => {
        if (!API_URL || !API_KEY) return
        fetch(`${API_URL}/rest/v1/portfolio_projects?select=id,title,website_url,description,category,technologies,thumbnail_url,is_featured&status=eq.published&order=sort_order.asc,created_at.desc`, {
            headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` },
        }).then(response => response.ok ? response.json() : []).then(rows => setItems(Array.isArray(rows) ? rows.filter(row => safeHttpUrl(row.website_url)) : [])).catch(() => setItems([]))
    }, [])

    function openPreview(item) {
        setSelected(item)
        setLoadError(false)
        setViewport('desktop')
    }

    return (
        <section className="section portfolio-section" id="portfolio">
            <div className="container">
                <div className="section-heading">
                    <div><div className="eyebrow">LIVE WEBSITE SHOWCASE</div><h2>Work worth<br /><span>exploring.</span></h2></div>
                    <p>Explore selected websites added to our portfolio. Open an interactive preview where the website allows embedding, or visit the live site directly.</p>
                </div>
                {items.length === 0 ? <div className="portfolio-empty"><span>SHRISHUBH / PORTFOLIO</span><h3>Our website showcase is getting ready.</h3><p>Published website projects will appear here.</p></div> : (
                    <div className="portfolio-grid">{items.map(item => (
                        <article className="portfolio-card" key={item.id}>
                            <button type="button" className="portfolio-thumb" onClick={() => openPreview(item)} aria-label={`Preview ${item.title}`}>
                                {item.thumbnail_url ? <img src={item.thumbnail_url} alt="" loading="lazy" /> : <div className="portfolio-thumb-placeholder"><span>LIVE WEBSITE</span><strong>{item.title}</strong><ArrowUpRight size={28} /></div>}
                                <span className="portfolio-view-label">Open preview <ArrowUpRight size={14} /></span>
                            </button>
                            <div className="portfolio-card-copy">
                                <div className="portfolio-card-kicker">{item.category || 'WEBSITE PROJECT'}{item.is_featured ? ' · FEATURED' : ''}</div>
                                <h3>{item.title}</h3>
                                <p>{item.description || 'Explore this website project.'}</p>
                                {Array.isArray(item.technologies) && item.technologies.length > 0 && <div className="portfolio-tags">{item.technologies.map(tag => <span key={tag}>{tag}</span>)}</div>}
                                <div className="portfolio-card-actions"><button type="button" onClick={() => openPreview(item)}>Live preview <ArrowUpRight size={15} /></button><a href={safeHttpUrl(item.website_url)} target="_blank" rel="noopener noreferrer">Visit website <ExternalLink size={14} /></a></div>
                            </div>
                        </article>
                    ))}</div>
                )}
            </div>
            {selected && <div className="portfolio-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null) }}>
                <section className="portfolio-modal" role="dialog" aria-modal="true" aria-label={`${selected.title} live preview`}>
                    <header className="portfolio-modal-head"><div><span className="eyebrow">LIVE WEBSITE PREVIEW</span><h3>{selected.title}</h3></div><div className="portfolio-modal-tools"><button type="button" className={viewport === 'desktop' ? 'active' : ''} onClick={() => setViewport('desktop')} aria-label="Desktop preview"><Monitor size={17} /></button><button type="button" className={viewport === 'mobile' ? 'active' : ''} onClick={() => setViewport('mobile')} aria-label="Mobile preview"><Smartphone size={17} /></button><a href={safeHttpUrl(selected.website_url)} target="_blank" rel="noopener noreferrer" aria-label="Open website in a new tab"><ExternalLink size={17} /></a><button type="button" onClick={() => setSelected(null)} aria-label="Close preview"><X size={19} /></button></div></header>
                    <div className="portfolio-frame-wrap"><div className={viewport === 'mobile' ? 'portfolio-frame portfolio-frame-mobile' : 'portfolio-frame'}>
                        {!loadError ? <iframe title={`${selected.title} website preview`} src={safeHttpUrl(selected.website_url)} sandbox="allow-scripts allow-forms" referrerPolicy="no-referrer" onError={() => setLoadError(true)} /> : <div className="portfolio-frame-blocked"><h4>Preview unavailable in this window</h4><p>This website may prevent embedding. Open it in a new tab to view the full experience.</p><a href={safeHttpUrl(selected.website_url)} target="_blank" rel="noopener noreferrer">Open full website <ExternalLink size={15} /></a></div>}
                    </div></div>
                    <p className="portfolio-modal-note">Some websites block embedded previews through their security settings. The full website link remains available.</p>
                </section>
            </div>}
        </section>
    )
}
