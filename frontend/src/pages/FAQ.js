import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const sections = [
  { category: 'Using FlexTenure', items: [
    { q: 'Are payments real?', a: 'No. This application simulates payment success and failure for demonstration. No payment provider is contacted and no money is transferred.' },
    { q: 'What happens on simulated success?', a: 'The selected amount is deducted from the plan balance, the schedule is updated, and a receipt labelled DEMO PAYMENT is saved.' },
    { q: 'What happens on simulated failure?', a: 'The failed attempt appears in payment history, but the plan balance and repayment schedule stay unchanged.' },
    { q: 'Does a demo receipt prove that I paid?', a: 'No. Demo receipts are clearly labelled and do not show that real funds were collected or settled.' },
  ] },
  { category: 'For customers', items: [
    { q: 'Can I see another customer’s plans?', a: 'No. Plan queries and demo payment actions are scoped to the signed-in customer.' },
    { q: 'Do I need to enter card or bank details?', a: 'No. The demo flow never asks for card numbers, security codes, or bank credentials.' },
  ] },
  { category: 'For merchants', items: [
    { q: 'How do I onboard my business?', a: 'Create a merchant account, save your business profile in the merchant workspace, then contact hello@flextenure.com about onboarding.' },
    { q: 'Can I add a plan record for any email address?', a: 'No. The email must match an existing customer account. The record belongs to the authenticated merchant business.' },
    { q: 'Are dashboard balances settled funds?', a: 'No. Balances and demo activity are application records only; they are not evidence of funds received or settlement.' },
  ] },
];

function Item({ q, a }) {
  const [open, setOpen] = useState(false);
  return <div className="faq-item"><button className="faq-q" aria-expanded={open} onClick={() => setOpen(!open)} style={{ border: 0, background: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}>{q}<span className="icon">{open ? '−' : '＋'}</span></button>{open && <div className="faq-a">{a}</div>}</div>;
}

export default function FAQ() {
  return <main><section className="page-shell"><header className="page-heading"><div className="section-kicker">HELP CENTRE</div><h1>Good questions.<br />Clear answers.</h1><p>Learn how the FlexTenure account and demo payment screens work.</p></header>{sections.map(section => <section key={section.category} style={{ maxWidth: 760, margin: '0 auto 40px' }}><div className="section-kicker">{section.category}</div>{section.items.map(item => <Item key={item.q} {...item} />)}</section>)}<div className="notice" style={{ maxWidth: 760, margin: 'auto' }}>For help with an account, email <a href="mailto:hello@flextenure.com"><b>hello@flextenure.com</b></a>. Never send card numbers, security codes, or bank credentials by email.</div><p style={{ textAlign: 'center', marginTop: 25 }}><Link to="/support" className="text-link">More support information ↗</Link></p></section></main>;
}
