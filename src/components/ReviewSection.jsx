import { useEffect, useState } from 'react'
import { Star, Send, MessageSquareQuote } from 'lucide-react'

const API_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

function formatReviewDate(value) {
    return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ReviewSection() {
    const [reviews, setReviews] = useState([])
    const [name, setName] = useState('')
    const [rating, setRating] = useState(5)
    const [review, setReview] = useState('')
    const [website, setWebsite] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    useEffect(() => {
        if (!API_URL || !API_KEY || API_URL.includes('YOUR-PROJECT')) {
            setLoading(false)
            return
        }
        fetch(`${API_URL}/rest/v1/reviews?select=id,name,rating,review,created_at&status=eq.approved&order=created_at.desc&limit=30`, {
            headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` },
        }).then(response => {
            if (!response.ok) throw new Error('Reviews are temporarily unavailable.')
            return response.json()
        }).then(rows => setReviews(Array.isArray(rows) ? rows : []))
            .catch(err => setError(err.message || 'Could not load reviews.'))
            .finally(() => setLoading(false))
    }, [])

    async function submitReview(event) {
        event.preventDefault()
        setError('')
        setNotice('')
        if (website.trim()) {
            setNotice('Thank you. Your review has been received for moderation.')
            setName('')
            setReview('')
            return
        }
        if (!API_URL || !API_KEY) {
            setError('Review submission is not configured yet. Please try again later.')
            return
        }
        setSubmitting(true)
        try {
            const response = await fetch(`${API_URL}/rest/v1/reviews`, {
                method: 'POST',
                headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
                body: JSON.stringify({ name: name.trim(), rating, review: review.trim(), source: 'customer' }),
            })
            if (!response.ok) {
                const details = await response.text()
                throw new Error(details || 'Could not submit your review.')
            }
            setName('')
            setReview('')
            setRating(5)
            setNotice('Thank you! Your review was submitted and will appear after admin approval.')
        } catch (err) {
            setError(err.message || 'Could not submit your review. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <section className="section reviews-section" id="reviews">
            <div className="container">
                <div className="section-heading">
                    <div><div className="eyebrow">WORDS FROM OUR CLIENTS</div><h2>Experiences that<br /><span>build trust.</span></h2></div>
                    <p>Have we worked together? Share your experience and help others discover ShriShubh.</p>
                </div>
                {loading ? <p className="reviews-loading">Loading customer reviews…</p> : reviews.length ? (
                    <div className="reviews-grid">
                        {reviews.map(item => <article className="review-card" key={item.id}>
                            <div className="review-stars" aria-label={`${item.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill={index < item.rating ? 'currentColor' : 'none'} />)}</div>
                            <blockquote>“{item.review}”</blockquote>
                            <div className="review-author"><strong>{item.name}</strong><span>{formatReviewDate(item.created_at)}</span></div>
                        </article>)}
                    </div>
                ) : <div className="reviews-empty"><MessageSquareQuote size={23} /><h3>Be the first to share your experience</h3><p>Customer reviews approved by our team will appear here.</p></div>}
                <div className="review-form-wrap">
                    <div><div className="eyebrow">YOUR FEEDBACK</div><h3>Leave a review</h3><p>All reviews are checked by our team before being published.</p></div>
                    <form className="review-form" onSubmit={submitReview}>
                        <label>Your name<input value={name} onChange={event => setName(event.target.value)} required maxLength="80" placeholder="Enter your name" /></label>
                        <fieldset><legend>Your rating</legend><div className="review-rating-picker">{[1, 2, 3, 4, 5].map(value => <button type="button" key={value} aria-label={`Rate ${value} out of 5`} aria-pressed={rating === value} onClick={() => setRating(value)}><Star size={24} fill={value <= rating ? 'currentColor' : 'none'} /></button>)}</div></fieldset>
                        <label>Your review<textarea value={review} onChange={event => setReview(event.target.value)} required minLength="8" maxLength="1200" rows="4" placeholder="Tell us about your experience…" /></label>
                        <label className="review-honeypot" aria-hidden="true">Leave this field empty<input tabIndex="-1" autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></label>
                        {error && <p className="review-form-message error" role="alert">{error}</p>}
                        {notice && <p className="review-form-message success" role="status">{notice}</p>}
                        <button className="button review-submit" type="submit" disabled={submitting || !name.trim() || review.trim().length < 8}>{submitting ? 'Submitting…' : 'Submit review'} <Send size={15} /></button>
                    </form>
                </div>
            </div>
        </section>
    )
}
