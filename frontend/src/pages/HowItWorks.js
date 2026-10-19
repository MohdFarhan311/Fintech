import React from 'react';
import { Link } from 'react-router-dom';

export default function HowItWorks() {
  return <main className="page-shell">
    <header className="page-heading"><div className="section-kicker">HOW IT WORKS</div><h1>Payment plans,<br />with more clarity.</h1><p>FlexTenure lets customers and merchants review plan records and demonstrate how repayments change a balance.</p></header>
    <section className="flow-steps">{[
      ['01', 'Create an account', 'Choose a customer or merchant account. Merchants can complete their business profile.'],
      ['02', 'Review the plan details', 'A merchant can create a plan record for an existing customer account. Both parties can review the amount and schedule.'],
      ['03', 'Try a demo payment', 'Customers can simulate a successful or failed payment and see how the plan record changes.'],
    ].map(([n, title, body]) => <article className="flow-step" key={n}><span className="step-num">{n}</span><div className="step-content"><h3>{title}</h3><p>{body}</p></div></article>)}</section>
    <div className="notice"><b>Demonstration only:</b> payment outcomes are simulated inside FlexTenure. No payment details are collected, no external payment service is contacted, and no real money moves. A demo receipt is not proof of payment or settlement.</div>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 30 }}><Link className="button button-dark" to="/register">Create account ↗</Link><Link className="button button-light" to="/faq">Read FAQs</Link></div>
  </main>;
}
