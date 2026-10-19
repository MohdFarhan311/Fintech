import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const requestKey = () => `ft-${window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

function DemoPayment({ plan, onClose, onUpdated }) {
  const [amount, setAmount] = useState(String(Math.min(plan.pool2Amount || plan.outstandingBalance, plan.outstandingBalance)));
  const [step, setStep] = useState(1);
  const [outcome, setOutcome] = useState('success');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const idempotencyKey = useRef(null);

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await axios.post(`/api/customers/pay/${plan._id}`, {
        amount: Number(amount),
        outcome,
        idempotencyKey: idempotencyKey.current || (idempotencyKey.current = requestKey()),
      });
      setReceipt(response.data);
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.error || 'The demo attempt could not be recorded. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="modal-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="demo-pay-title">
      <button className="modal-close" onClick={onClose} aria-label="Close" disabled={busy}>×</button>
      <div className="section-kicker">DEMO PAYMENT · NO REAL MONEY</div>
      <h2 id="demo-pay-title" style={{ fontFamily: 'Manrope', marginBottom: 8 }}>{receipt ? 'Demo receipt' : step === 1 ? 'Review your payment' : 'Confirm demo payment'}</h2>
      <div className="notice" role="note">This is a simulation inside FlexTenure. No payment provider is contacted and no money is transferred.</div>

      {receipt ? <>
        <div className="demo-receipt" style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 20, margin: '18px 0' }}>
          <div className="section-kicker">DEMO PAYMENT</div>
          <h3 style={{ fontFamily: 'Manrope', margin: '8px 0' }}>{receipt.payment.status === 'paid' ? 'Simulated success' : 'Simulated failure'}</h3>
          <p className="muted" style={{ margin: '0 0 12px' }}>{plan.productName} · {money(receipt.payment.amount)}</p>
          <div className="muted">Reference: <b>{receipt.payment.reference}</b></div>
          <div className="muted">Date: <b>{new Date(receipt.payment.date).toLocaleString('en-IN')}</b></div>
          <div className="muted">Status: <b>{receipt.payment.status === 'paid' ? 'DEMO PAID' : 'DEMO FAILED'}</b></div>
          <div className="muted">Outstanding balance: <b>{money(receipt.transaction.outstandingBalance)}</b></div>
        </div>
        <button className="button button-dark" onClick={onClose}>Done</button>
      </> : <>
        <div className="card" style={{ padding: 16, margin: '16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span className="muted">Purchase plan</span><b>{plan.productName}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 10 }}><span className="muted">Outstanding</span><b>{money(plan.outstandingBalance)}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 10 }}><span className="muted">Next instalment</span><b>{money(Math.min(plan.pool2Amount || plan.outstandingBalance, plan.outstandingBalance))}</b></div>
        </div>
        {step === 1 ? <>
          <label className="form-group" style={{ display: 'block' }}>Demo amount (₹)
            <input aria-label="Demo payment amount" type="number" min="1" max={plan.outstandingBalance} step="1" value={amount} onChange={event => { idempotencyKey.current = null; setAmount(event.target.value); }} style={{ width: '100%', marginTop: 7 }} />
          </label>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <button className="button button-dark" disabled={!Number.isSafeInteger(Number(amount)) || Number(amount) < 1 || Number(amount) > plan.outstandingBalance} onClick={() => { setError(''); setStep(2); }}>Continue to confirmation</button>
        </> : <>
          <div className="card" style={{ padding: 16, margin: '16px 0' }}>
            <div className="muted">Amount to simulate</div><div style={{ font: '700 24px Manrope', margin: '4px 0 14px' }}>{money(Number(amount))}</div>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend style={{ fontWeight: 700, marginBottom: 8 }}>Choose a demo result</legend>
              <label style={{ display: 'block', marginBottom: 8 }}><input type="radio" name="demo-outcome" value="success" checked={outcome === 'success'} onChange={() => { idempotencyKey.current = null; setOutcome('success'); }} /> Simulate successful payment</label>
              <label style={{ display: 'block' }}><input type="radio" name="demo-outcome" value="failure" checked={outcome === 'failure'} onChange={() => { idempotencyKey.current = null; setOutcome('failure'); }} /> Simulate failed payment</label>
            </fieldset>
          </div>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="button button-light" disabled={busy} onClick={() => setStep(1)}>Back</button>
            <button className="button button-dark" disabled={busy} onClick={confirm}>{busy ? 'Recording demo…' : 'Confirm demo payment'}</button>
          </div>
        </>}
      </>}
    </section>
  </div>;
}

function Receipt({ payment }) {
  return <article className="demo-receipt" style={{ border: '1px dashed var(--line)', borderRadius: 10, padding: 14, marginTop: 12 }}>
    <div className="section-kicker">DEMO PAYMENT RECEIPT</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 7 }}>
      <b>{payment.status === 'paid' ? 'Simulated success' : 'Simulated failure'} · {money(payment.amount)}</b>
      <span className={`badge ${payment.status === 'paid' ? 'badge-green' : 'badge-gray'}`}>{payment.status === 'paid' ? 'DEMO PAID' : 'DEMO FAILED'}</span>
    </div>
    <div className="muted" style={{ marginTop: 6 }}>{payment.reference} · {payment.date ? new Date(payment.date).toLocaleString('en-IN') : '—'}</div>
  </article>;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ transactions: [], totalOutstanding: 0, activeCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);

  const refresh = async () => {
    try {
      const response = await axios.get('/api/customers/dashboard');
      setData(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load your plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); }, []);
  const plans = data.transactions || [];

  return <main className="dashboard">
    <div className="dashboard-header"><div className="section-kicker">CUSTOMER ACCOUNT</div><h1>Your plans</h1><p>Welcome back, {user?.name}. Review your plan details and demo payment activity.</p></div>
    {error && <div className="alert alert-error" role="alert">{error}</div>}
    <div className="stats-grid"><div className="stat-card"><div className="label">Outstanding balance</div><div className="value">{money(data.totalOutstanding)}</div></div><div className="stat-card"><div className="label">Active plans</div><div className="value purple">{data.activeCount}</div></div><div className="stat-card"><div className="label">Plan records</div><div className="value">{plans.length}</div></div><div className="stat-card"><div className="label">Payment mode</div><div className="value" style={{ fontSize: 15 }}>Demo only</div></div></div>
    <div className="notice"><b>Demo mode:</b> all payment outcomes are simulated. No real money is transferred and no payment details are collected.</div>
    {loading ? <div className="loading-screen"><div className="spinner" /></div> : plans.length === 0 ? <section className="card empty-state"><span>◷</span><h3>No plans yet</h3><p>Plans linked to your account will appear here.</p><Link to="/how-it-works" className="text-link">Learn how FlexTenure works ↗</Link></section> : plans.map(plan => <section className="card" key={plan._id} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}><div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><h3 style={{ fontFamily: 'Manrope', margin: '0 0 7px' }}>{plan.productName}</h3><span className={`badge ${plan.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{plan.status}</span></div><div className="muted">{plan.merchant?.businessName || 'Merchant'}{plan.merchant?.city ? ` · ${plan.merchant.city}` : ''}</div></div><div style={{ textAlign: 'right' }}><small className="muted">Outstanding balance</small><div style={{ font: '700 22px Manrope', marginTop: 4 }}>{money(plan.outstandingBalance)}</div></div></div>
      <div style={{ display: 'flex', gap: 25, flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: 16, marginTop: 17 }}><div className="muted">Purchase amount<br /><b style={{ color: 'var(--ink)' }}>{money(plan.productPrice)}</b></div><div className="muted">Scheduled instalment<br /><b style={{ color: 'var(--ink)' }}>{money(plan.pool2Amount)}</b></div><div className="muted">Plan progress<br /><b style={{ color: 'var(--ink)' }}>{plan.paidMonths || 0} of {plan.totalMonths} instalments</b></div><div className="muted">Next scheduled date<br /><b style={{ color: 'var(--ink)' }}>{plan.nextDebitDate ? new Date(plan.nextDebitDate).toLocaleDateString('en-IN') : 'Complete'}</b></div></div>
      {plan.status === 'active' && plan.outstandingBalance > 0 && <button className="button button-dark" style={{ marginTop: 16 }} onClick={() => setSelectedPlan(plan)}>Pay Now · Demo</button>}
      {plan.paymentHistory?.length > 0 && <details style={{ marginTop: 16 }}><summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Payment history and demo receipts ({plan.paymentHistory.length})</summary>{[...plan.paymentHistory].reverse().map((payment, index) => <Receipt key={payment.reference || `${payment.date}-${index}`} payment={payment} />)}</details>}
    </section>)}
    {selectedPlan && <DemoPayment plan={selectedPlan} onClose={() => setSelectedPlan(null)} onUpdated={refresh} />}
  </main>;
}
