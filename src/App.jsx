import { useState } from 'react'
import {
    ArrowRight,
    Check,
    Menu,
    X,
    Globe,
    Palette,
    ShoppingCart,
    Search,
    Code2,
    ShieldCheck,
    Zap,
    Star,
    MessageCircle,
    ChevronDown,
    Send,
} from 'lucide-react'

const services = [
    {
        icon: Globe,
        title: 'Business Websites',
        description: 'Build a professional online presence that makes your business stand out.',
        tag: 'FOR BUSINESSES',
    },
    {
        icon: ShoppingCart,
        title: 'E-commerce Stores',
        description: 'Showcase your products and build a smooth online shopping experience.',
        tag: 'SELL ONLINE',
    },
    {
        icon: Palette,
        title: 'UI/UX Design',
        description: 'Clean, intuitive and modern digital experiences designed around your users.',
        tag: 'DESIGN',
    },
    {
        icon: Code2,
        title: 'Custom Web Solutions',
        description: 'Bring your ideas to life with tailored features and functionality.',
        tag: 'DEVELOPMENT',
    },
    {
        icon: Search,
        title: 'SEO & Optimization',
        description: 'Improve website performance, accessibility and search engine readiness.',
        tag: 'GROWTH',
    },
    {
        icon: ShieldCheck,
        title: 'Maintenance & Support',
        description: 'Keep your website updated, secure and running smoothly.',
        tag: 'ONGOING SUPPORT',
    },
]

const plans = [
    {
        name: 'Starter',
        price: '₹3,999',
        description: 'For individuals and small businesses getting online.',
        features: [
            'Up to 5 website pages',
            'Mobile-responsive design',
            'Contact form layout',
            'Basic on-page SEO setup',
            'Social media links',
        ],
    },
    {
        name: 'Professional',
        price: '₹5,999',
        description: 'For growing businesses ready for a stronger online presence.',
        popular: true,
        features: [
            'Up to 10 website pages',
            'Custom premium design',
            'Responsive on all devices',
            'Contact and enquiry forms',
            'SEO-ready page structure',
            'Performance optimization',
        ],
    },
    {
        name: 'Business Plus',
        price: '₹13,999',
        description: 'For businesses that need more features and flexibility.',
        features: [
            'Up to 15 website pages',
            'Advanced custom sections',
            'CMS or product catalogue setup',
            'Analytics integration setup',
            'Advanced enquiry experience',
            'Priority launch support',
        ],
    },
]

const faqs = [
    {
        q: 'How long does it take to build a website?',
        a: 'A simple business website may take around 1–2 weeks. Larger projects can take longer depending on content, revisions and functionality.',
    },
    {
        q: 'Are the prices fixed?',
        a: 'The displayed prices are illustrative starting packages. The final quote depends on your requirements, integrations and project scope.',
    },
    {
        q: 'Will my website work on mobile phones?',
        a: 'Yes. The design is responsive and adapts to desktop, tablet and mobile screen sizes.',
    },
    {
        q: 'Can I request a custom website?',
        a: 'Yes. Share your idea and requirements with us, and we can discuss a suitable design and development approach.',
    },
]

function Brand() {
    return (
        <a className="brand" href="#home" aria-label="ShriShubh home">
            <img
                className="brand-logo"
                src="/images/shrishubh-logo.png"
                alt="ShriShubh logo"
            />
        </a>
    )
}

function Header() {
    const [open, setOpen] = useState(false)
    const links = [
        ['Services', '#services'],
        ['Pricing', '#pricing'],
        ['About', '#about'],
        ['FAQ', '#faq'],
    ]

    return (
        <header className="header">
            <div className="container nav">
                <Brand />
                <nav className={open ? 'nav-links nav-open' : 'nav-links'}>
                    {links.map(([label, href]) => (
                        <a key={label} href={href} onClick={() => setOpen(false)}>
                            {label}
                        </a>
                    ))}
                    <a className="button button-small" href="#contact" onClick={() => setOpen(false)}>
                        Get a quote <ArrowRight size={15} />
                    </a>
                </nav>
                <button
                    className="mobile-menu-button"
                    type="button"
                    aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
                    aria-expanded={open}
                    onClick={() => setOpen(!open)}
                >
                    {open ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>
        </header>
    )
}

function Hero() {
    return (
        <section className="hero" id="home">
            <div className="hero-glow" />
            <div className="container hero-grid">
                <div className="hero-content">
                    <div className="eyebrow"><span className="status-dot" /> DIGITAL EXPERIENCES, BUILT BETTER</div>
                    <h1>
                        Your ideas.<br />
                        <span>Our craft.</span><br />
                        A better web.
                    </h1>
                    <p className="hero-description">
                        Professional websites. Transparent pricing. Simple process.
                        Everything you need to build your next digital experience.
                    </p>
                    <div className="hero-actions">
                        <a href="#contact" className="button">
                            Start your project <ArrowRight size={17} />
                        </a>
                        <a href="#services" className="button button-ghost">Explore services</a>
                    </div>
                    <div className="hero-proof">
                        <div className="proof-icon"><Check size={17} /></div>
                        <span>Clear scope. Thoughtful design. No confusing process.</span>
                    </div>
                </div>

                <div className="hero-art" aria-label="Website design preview">
                    <div className="art-orbit orbit-one" />
                    <div className="art-orbit orbit-two" />
                    <div className="browser-card">
                        <div className="browser-top">
                            <div className="browser-dots"><i /><i /><i /></div>
                            <span>yourbusiness.in</span>
                            <span className="browser-lock"><ShieldCheck size={14} /></span>
                        </div>
                        <div className="browser-body">
                            <div className="mock-nav">
                                <span className="mock-logo">BRAND.</span>
                                <span className="mock-nav-line" />
                                <span className="mock-nav-line short" />
                            </div>
                            <div className="mock-hero">
                                <span className="mock-label">BUILT FOR WHAT'S NEXT</span>
                                <div className="mock-heading">Make your<br />mark online.</div>
                                <div className="mock-lines"><i /><i /><i /></div>
                                <div className="mock-cta">Explore <ArrowRight size={12} /></div>
                            </div>
                            <div className="mock-bottom">
                                <div><strong>01</strong><span>Strategy</span></div>
                                <div><strong>02</strong><span>Design</span></div>
                                <div><strong>03</strong><span>Launch</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="floating-card floating-top"><Zap size={17} /><span><strong>Fast & responsive</strong><small>Designed for every screen</small></span></div>
                    <div className="floating-card floating-bottom"><Star size={17} /><span><strong>Made to stand out</strong><small>Thoughtful digital design</small></span></div>
                    <div className="hero-index">SS / 001</div>
                </div>
            </div>
            <div className="container hero-bottom">
                <span>BUILT AROUND YOUR BUSINESS</span>
                <span className="bottom-line" />
                <span>DESIGN · DEVELOPMENT · GROWTH</span>
            </div>
        </section>
    )
}

function Services() {
    return (
        <section className="section" id="services">
            <div className="container">
                <div className="section-heading">
                    <div>
                        <div className="eyebrow">WHAT WE DO</div>
                        <h2>Digital solutions<br /><span>with purpose.</span></h2>
                    </div>
                    <p>From your first website to your next big idea, we help turn business goals into useful digital experiences.</p>
                </div>
                <div className="service-grid">
                    {services.map(({ icon: Icon, title, description, tag }, index) => (
                        <article className="service-card" key={title}>
                            <div className="service-card-top">
                                <span className="service-icon"><Icon size={22} /></span>
                                <span className="service-number">0{index + 1}</span>
                            </div>
                            <span className="service-tag">{tag}</span>
                            <h3>{title}</h3>
                            <p>{description}</p>
                            <a href="#contact" className="text-link">Discuss your project <ArrowRight size={15} /></a>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}

function Pricing() {
    return (
        <section className="section pricing-section" id="pricing">
            <div className="container">
                <div className="section-heading">
                    <div>
                        <div className="eyebrow">SIMPLE, TRANSPARENT PRICING</div>
                        <h2>A plan that fits.<br /><span>A price you understand.</span></h2>
                    </div>
                    <p>Choose a starting point. We'll confirm the scope and final price before work begins.</p>
                </div>
                <div className="pricing-grid">
                    {plans.map((plan) => (
                        <article className={plan.popular ? 'price-card price-featured' : 'price-card'} key={plan.name}>
                            {plan.popular && <div className="popular-label"><Star size={13} /> MOST POPULAR</div>}
                            <div className="plan-name">{plan.name}</div>
                            <div className="plan-price">{plan.price}<span> / project</span></div>
                            <p className="plan-description">{plan.description}</p>
                            <a className={plan.popular ? 'button price-button' : 'button button-ghost price-button'} href="#contact">
                                Choose {plan.name} <ArrowRight size={15} />
                            </a>
                            <div className="feature-divider" />
                            <div className="feature-title">WHAT'S INCLUDED</div>
                            <ul className="feature-list">
                                {plan.features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}
                            </ul>
                        </article>
                    ))}
                </div>
                <p className="pricing-note">Prices are starting estimates, not a final quote. Domain, hosting, paid plugins and third-party services may cost extra.</p>
            </div>
        </section>
    )
}

function About() {
    const items = [
        ['01', 'Understand', 'We start with your goals, audience and requirements.'],
        ['02', 'Design', 'We shape a visual direction around your brand.'],
        ['03', 'Build', 'We develop a responsive site and review it with you.'],
        ['04', 'Launch', 'After approval, we help prepare your site for launch.'],
    ]

    return (
        <section className="section about-section" id="about">
            <div className="container about-grid">
                <div className="about-copy">
                    <div className="eyebrow">THE SHRIShUBH APPROACH</div>
                    <h2>Good work.<br /><span>No guesswork.</span></h2>
                    <p>Building a website should feel straightforward. ShriShubh brings design, development and a clear process together, so you know what happens next.</p>
                    <div className="about-points">
                        <div><Check size={17} /> Clear communication</div>
                        <div><Check size={17} /> Mobile-first approach</div>
                        <div><Check size={17} /> Scope agreed before work</div>
                    </div>
                </div>
                <div className="process-list">
                    {items.map(([number, title, description]) => (
                        <div className="process-item" key={number}>
                            <span className="process-number">{number}</span>
                            <div><h3>{title}</h3><p>{description}</p></div>
                            <ArrowRight className="process-arrow" size={18} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function FAQ() {
    const [active, setActive] = useState(0)

    return (
        <section className="section faq-section" id="faq">
            <div className="container faq-grid">
                <div>
                    <div className="eyebrow">GOOD TO KNOW</div>
                    <h2>Questions?<br /><span>Answered.</span></h2>
                    <p className="faq-intro">Have another question? Tell us what you're planning and we'll help you figure out the next step.</p>
                    <a href="#contact" className="text-link">Ask us directly <ArrowRight size={15} /></a>
                </div>
                <div className="faq-list">
                    {faqs.map((faq, index) => (
                        <article className={active === index ? 'faq-item faq-active' : 'faq-item'} key={faq.q}>
                            <button type="button" onClick={() => setActive(active === index ? -1 : index)}>
                                <span>{faq.q}</span><ChevronDown size={18} />
                            </button>
                            {active === index && <p>{faq.a}</p>}
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}

function Contact() {

    const [form, setForm] = useState({
        name: '',
        email: '',
        service: 'Business Website',
        budget: '',
        message: '',
    })

    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    function update(event) {
        setForm({ ...form, [event.target.name]: event.target.value })
        setSent(false)
        setError('')
    }

    function submit(event) {
        event.preventDefault()
        setSent(false)
        setError('')

        const subject = encodeURIComponent(
            'New Project Enquiry - ShriShubh'
        )

        const body = encodeURIComponent(
            `New Project Enquiry - ShriShubh

Name: ${form.name}
Email: ${form.email}
Service: ${form.service}
Estimated Budget: ${form.budget || 'Not specified'}

Project Details:
${form.message}`
        )

        window.location.href =
            `mailto:shrishubh521@gmail.com?subject=${subject}&body=${body}`
    }

    return (
        <section className="section contact-section" id="contact">
            <div className="container contact-grid">
                <div className="contact-copy">
                    <div className="eyebrow">LET'S BUILD SOMETHING</div>
                    <h2>Your next idea<br />starts <span>here.</span></h2>
                    <p>Tell us a little about your project. We'll use the details to start a conversation about the right solution for you.</p>
                    <div className="contact-promise"><MessageCircle size={19} /><span><strong>Simple from the start</strong><small>Share your goals. Discuss the scope. Get clarity.</small></span></div>
                    <div className="contact-email"><span>YOUR DIGITAL PARTNER</span><strong>ShriShubh</strong></div>
                </div>

                <form className="contact-form" onSubmit={submit}>
                    <div className="form-heading"><span>PROJECT ENQUIRY</span><span className="form-step">01 / 01</span></div>



                    <label>
                        Your name
                        <input name="name" value={form.name} onChange={update} placeholder="Enter your name" required />
                    </label>

                    <label>
                        Email address
                        <input name="email" value={form.email} onChange={update} type="email" placeholder="you@example.com" required />
                    </label>

                    <label>
                        What do you need?
                        <select name="service" value={form.service} onChange={update}>
                            <option>Business Website</option>
                            <option>E-commerce Website</option>
                            <option>UI/UX Design</option>
                            <option>Custom Web Solution</option>
                            <option>SEO & Optimization</option>
                            <option>Website Maintenance</option>
                        </select>
                    </label>

                    <label>
                        Estimated budget
                        <select name="budget" value={form.budget} onChange={update}>
                            <option value="">Select a budget</option>
                            <option>Under ₹5,000</option>
                            <option>₹5,000 – ₹10,000</option>
                            <option>₹10,000 – ₹25,000</option>
                            <option>₹25,000+</option>
                            <option>Not sure yet</option>
                        </select>
                    </label>

                    <label>
                        Tell us about your project
                        <textarea name="message" value={form.message} onChange={update} placeholder="What would you like to build?" rows="3" required />
                    </label>

                    <button className="button submit-button" type="submit">
                        Send enquiry <Send size={16} />
                    </button>
                    <p className="form-privacy">
                        Clicking Send enquiry opens your email application with your
                        project details ready. Review the email and press Send to submit it.
                    </p>
                </form>
            </div>
        </section>
    )
}

function Footer() {
    return (
        <footer className="footer">
            <div className="container footer-top">
                <Brand />
                <p>Professional websites.<br />Transparent pricing. Simple process.</p>
                <a className="back-top" href="#home">Back to top ↑</a>
            </div>
            <div className="container footer-bottom">
                <span>© {new Date().getFullYear()} ShriShubh. All rights reserved.</span>
                <span>DESIGNED WITH PURPOSE <span className="gold-dot">●</span></span>
            </div>
            <div className="social-links">
                <a
                    href="https://www.instagram.com/shrishubh2026_web_builder?stkn=NjJsYTF0bG9ramFz"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Follow us on Instagram ↗
                </a>
                <a href="mailto:shrishubh521@gmail.com">
                    shrishubh521@gmail.com
                </a>
            </div>
        </footer>
    )
}

export default function App() {
    return (
        <>
            <Header />
            <main>
                <Hero />
                <Services />
                <Pricing />
                <About />
                <FAQ />
                <Contact />
            </main>
            <Footer />
        </>
    )
}
