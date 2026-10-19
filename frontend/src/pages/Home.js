import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const steps = [
  ['01', 'Choose a participating merchant', 'Find a participating store and review the terms offered for your purchase before you commit.'],
  ['02', 'See your plan clearly', 'Review the amount, schedule, and any applicable fees up front. You stay in control of the decision.'],
  ['03', 'Track every instalment', 'Review your plan and payment history, including clearly labelled simulated payment attempts.']
];
const benefits = [
  ['For customers', 'A clearer way to plan a purchase', 'See the full schedule and outstanding balance in one view. No credit or payment claims are made until the service and terms are confirmed.'],
  ['For merchants', 'Offer customers more choice', 'Manage plans and customer transactions from a single workspace, with account level visibility into your business activity.']
];
const inr = value => `₹${Number(value).toLocaleString('en-IN')}`;

function DemoCalculator() {
  const productPrice = 10000;
  const [payment, setPayment] = useState(3000);
  const updatePayment = value => setPayment(Math.max(0, Math.min(productPrice, Number(value) || 0)));
  const remaining = productPrice - payment;

  return <section className="calculator-section" id="calculator">
    <div className="calculator-copy"><div className="section-kicker">INTERACTIVE DEMO</div><h2>See how a payment<br /><em>changes your balance.</em></h2><p>Try different amounts against a sample ₹10,000 plan. The dashboard can record a simulated payment success or failure. Nothing is charged.</p></div>
    <div className="calculator-card">
      <div className="calculator-heading"><div><span>DEMO PLAN</span><h3>How much would you pay?</h3></div><span className="calculator-mark">₹</span></div>
      <div className="calculator-presets">{[100, 3000, 10000].map(amount => <button key={amount} type="button" aria-pressed={payment === amount} onClick={() => updatePayment(amount)}>{inr(amount)}</button>)}</div>
      <input className="calculator-range" type="range" min="0" max={productPrice} step="100" value={payment} aria-label="Simulated payment amount" onChange={event => updatePayment(event.target.value)} />
      <label className="calculator-amount">Amount to simulate<input type="number" min="0" max={productPrice} step="1" value={payment} onChange={event => updatePayment(event.target.value)} aria-label="Enter simulated payment amount" /></label>
      <div className="calculator-breakdown"><div><span>Sample plan balance</span><b>{inr(productPrice)}</b></div><div><span>Simulated payment</span><b>− {inr(payment)}</b></div><div className="calculator-total"><span>Remaining in this example</span><b>{inr(remaining)}</b></div></div>
      <div className="calculator-disclaimer">Illustration only · No real payment · Plan terms are set by the merchant</div>
    </div>
  </section>;
}

const demoFeatures = [
  ['↔', 'Choose an amount', 'Explore different payment amounts within a plan balance.'],
  ['✓', 'Simulate success', 'See the recorded amount reduce the example plan balance.'],
  ['×', 'Simulate failure', 'Record an unsuccessful attempt without changing the balance.'],
  ['◷', 'Follow plan progress', 'View the remaining balance, instalments, and next plan date.'],
  ['▤', 'Review receipts', 'See a history of attempts, clearly marked DEMO PAYMENT.'],
  ['⌂', 'Merchant overview', 'Merchants can review customer plan status and refresh records.'],
];

export default function Home() {
  const [form, setForm] = useState({ businessName: '', ownerName: '', email: '', phone: '', businessType: '', city: '' });
  const [state, setState] = useState({ loading: false, submitted: false, error: '' });
  const submit = async (event) => {
    event.preventDefault(); setState({ loading: true, submitted: false, error: '' });
    try { await axios.post('/api/pilot', form); setState({ loading: false, submitted: true, error: '' }); }
    catch (error) { setState({ loading: false, submitted: false, error: error.response?.data?.error || 'We could not send your request. Please try again.' }); }
  };
  return <main>
    <section className="hero-shell" id="consumer">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot" /> FLEXIBLE PAYMENTS, MADE CLEAR</div>
        <h1>More room to pay.<br/><em>More room to grow.</em></h1>
        <p className="hero-lede">FlexTenure helps customers and merchants manage purchase payment plans with a clear schedule, transparent status, and one place to keep track.</p>
        <div className="hero-actions"><Link className="button button-dark" to="/register?role=customer">Explore as a customer <span>↗</span></Link><Link className="button button-light" to="/register?role=merchant">For merchants</Link></div>
        <div className="hero-note"><span className="shield">✓</span> Demo payments only · No real money is transferred</div>
      </div>
      <div className="hero-visual" aria-label="Illustration of a payment plan dashboard">
        <div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/>
        <div className="plan-card">
          <div className="plan-top"><span className="plan-mark">F</span><span className="plan-label">SAMPLE DEMO PLAN</span><span className="plan-menu">•••</span></div>
          <div className="plan-product">A little more flexible.</div><div className="plan-sub">Illustrative numbers · not account data</div>
          <div className="plan-amount">₹ 8,400 <span>remaining</span></div>
          <div className="progress-track"><span/></div><div className="progress-label"><span>Paid ₹ 3,600</span><span>3 of 10 instalments</span></div>
          <div className="plan-divider"/><div className="next-row"><span className="calendar-icon">▦</span><div><b>Next scheduled instalment</b><small>Example · 15 November</small></div><strong>₹ 1,200</strong></div>
        </div>
        <div className="float-chip chip-top"><span className="chip-check">↗</span> Made for clarity</div><div className="float-chip chip-bottom"><span className="chip-bars">▥</span> One view. Every plan.</div>
        <span className="visual-star star-a">✳</span><span className="visual-star star-b">✳</span>
      </div>
      <div className="hero-bottom"><span>Built for everyday purchases</span><span className="bottom-rule"/><span>Designed for customers and merchants</span></div>
    </section>

    <DemoCalculator />

    <section className="section-intro"><div className="section-kicker">A BETTER WAY TO KEEP TRACK</div><h2>Flexible by design.<br/><em>Clear at every step.</em></h2><p>Payment plans should be easy to understand and easier to manage. FlexTenure brings the details together before and after a purchase.</p></section>
    <section className="steps-grid">{steps.map(([number, title, body]) => <article className="step-card" key={number}><span className="step-number">{number}</span><span className="step-icon">{number === '01' ? '⌕' : number === '02' ? '◷' : '↗'}</span><h3>{title}</h3><p>{body}</p></article>)}</section>

    <section className="benefit-section"><div className="benefit-heading"><div className="section-kicker">ONE PLATFORM, TWO PERSPECTIVES</div><h2>Built around the<br/><em>whole experience.</em></h2></div><div className="benefit-cards">{benefits.map(([audience, title, body], i) => <article className={`benefit-card benefit-${i}`} key={audience}><span className="benefit-label">{audience}</span><div className="benefit-art">{i === 0 ? <><span className="art-circle">₹</span><span className="art-line line-a"/><span className="art-line line-b"/><span className="art-square"/></> : <><span className="merchant-window"><i/><i/><i/><b>FT</b></span><span className="art-spark">✳</span></>}</div><h3>{title}</h3><p>{body}</p><Link to={i === 0 ? '/register?role=customer' : '/register?role=merchant'}>Get started <span>↗</span></Link></article>)}</div></section>

    <section className="feature-section" id="features"><div className="feature-heading"><div className="section-kicker">A CLEARER PLAN VIEW</div><h2>Everything in one place.<br/><em>Demo outcomes included.</em></h2><p>Try the working account flow with clearly labelled simulated payment activity.</p></div><div className="feature-grid">{demoFeatures.map(([icon, title, body])=><article className="feature-card" key={title}><span>{icon}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>

    <section className="schedule-section"><div className="schedule-copy"><div className="section-kicker">NO GUESSWORK</div><h2>Know what’s next.<br/><em>And what it costs.</em></h2><p>Each plan is presented with its amount, schedule, and current status. Your dashboard is tied to your account, so you can return to the details whenever you need them.</p><Link className="text-link" to="/how-it-works">See how it works <span>↗</span></Link></div><div className="schedule-panel"><div className="schedule-panel-head"><div><small>PAYMENT OVERVIEW</small><h3>Plan activity</h3></div><span className="live-pill"><i/> PLAN VIEW</span></div><div className="activity-row"><span className="activity-icon lavender">▦</span><div><b>Plan details</b><small>Amount, term and status</small></div><span className="activity-arrow">↗</span></div><div className="activity-row"><span className="activity-icon peach">◷</span><div><b>Upcoming dates</b><small>Review the schedule</small></div><span className="activity-arrow">↗</span></div><div className="activity-row"><span className="activity-icon mint">✓</span><div><b>Payment history</b><small>See recorded activity</small></div><span className="activity-arrow">↗</span></div><div className="demo-notice">Illustrative interface preview. No payment has been initiated.</div></div></section>

    <section className="merchant-cta" id="merchants"><div><div className="section-kicker">FOR MERCHANTS</div><h2>Give customers a clearer<br/>way to plan their purchase.</h2><p>Create customer-linked plan records, review balances, and follow demo payment activity from your merchant workspace.</p></div><div className="merchant-cta-actions"><Link className="button button-white" to="/register?role=merchant">Create a merchant account <span>↗</span></Link><a href="#merchant-contact" className="button button-outline-light">Request a conversation</a></div><span className="cta-decoration">F</span></section>

    <section className="faq-preview"><div><div className="section-kicker">GOOD QUESTIONS</div><h2>Clear answers<br/><em>come first.</em></h2><Link className="text-link" to="/faq">Browse all FAQs <span>↗</span></Link></div><div className="faq-preview-list"><details><summary>Are these real payments?<span>＋</span></summary><p>No. Payment outcomes are simulated within this app. No provider is contacted and no money is transferred.</p></details><details><summary>Can I see my payment schedule?<span>＋</span></summary><p>Customer accounts can view their plan schedule and demo payment history. Simulated successes update the displayed balance; simulated failures do not.</p></details><details><summary>How do merchants get started?<span>＋</span></summary><p>Create a merchant account, complete your business profile, and contact us to discuss onboarding.</p></details></div></section>

    <section className="contact-section" id="merchant-contact"><div className="contact-copy"><div className="section-kicker">LET’S TALK</div><h2>Bring your business<br/><em>into the conversation.</em></h2><p>Tell us a little about your store and our team can follow up about the next steps.</p><div className="contact-detail"><span>✉</span><a href="mailto:hello@flextenure.com">hello@flextenure.com</a></div></div>{state.submitted ? <div className="contact-success"><span>✓</span><h3>Request received</h3><p>Your details were submitted. We’ll be in touch using the contact information you provided.</p></div> : <form className="contact-form" onSubmit={submit}><div className="form-row"><label>Business name<input required value={form.businessName} onChange={e=>setForm({...form,businessName:e.target.value})} /></label><label>Your name<input required value={form.ownerName} onChange={e=>setForm({...form,ownerName:e.target.value})} /></label></div><div className="form-row"><label>Work email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></label><label>Phone number<input required type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></label></div><div className="form-row"><label>Business type<input value={form.businessType} onChange={e=>setForm({...form,businessType:e.target.value})} /></label><label>City<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} /></label></div>{state.error && <div className="form-error" role="alert">{state.error}</div>}<button className="button button-dark" type="submit" disabled={state.loading}>{state.loading ? 'Sending…' : 'Send enquiry'} <span>↗</span></button><small>Submitting this form does not enroll your business in a pilot or create an account.</small></form>}</section>
    <footer className="site-footer"><div className="footer-brand"><Link to="/" className="brand-lockup"><span className="brand-mark">F</span>FlexTenure</Link><p>Payment plans with more clarity at every step.</p></div><div className="footer-links"><div><b>Explore</b><Link to="/how-it-works">How it works</Link><Link to="/pricing">Pricing information</Link><Link to="/faq">FAQs</Link></div><div><b>Your account</b><Link to="/login">Sign in</Link><Link to="/register">Create account</Link><Link to="/support">Support</Link></div><div><b>Information</b><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><a href="mailto:hello@flextenure.com">Contact</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} FlexTenure</span><span>Demo payments only. No real money is transferred.</span></div></footer>
  </main>;
}
