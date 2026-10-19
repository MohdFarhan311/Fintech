import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const inputStyle = {
  background: '#fafbf9', border: '1px solid #dfe5dc', borderRadius: 10,
  padding: '0.75rem 1rem', fontSize: '0.9rem', width: '100%', outline: 'none', color: 'var(--ink)', fontFamily: 'inherit'
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'merchant' ? 'merchant' : 'customer';
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: initialRole });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      if (user.role === 'merchant') navigate('/merchant/dashboard');
      else navigate('/customer/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create your account</h2>
        <p className="sub">Create an account to manage your FlexTenure plans</p>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Role Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#fafbf9', padding: '0.35rem', borderRadius: 12, marginBottom: '1.5rem', border: '1px solid #dfe5dc' }}>
          {['merchant', 'customer'].map(r => (
            <button key={r} type="button"
              onClick={() => setForm({ ...form, role: r })}
              style={{
                flex: 1, padding: '0.6rem', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit', transition: 'all 0.2s',
                background: form.role === r ? 'var(--accent)' : 'transparent',
                color: form.role === r ? 'white' : 'var(--text-muted)',
              }}>
              {r === 'merchant' ? '🏪 I\'m a Merchant' : '👤 I\'m a Customer'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#68746e' }}>Full Name *</label>
            <input name="name" required value={form.name} onChange={handleChange} placeholder="Your full name" style={inputStyle} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#68746e' }}>Email *</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" style={inputStyle} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#68746e' }}>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" style={inputStyle} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#68746e' }}>Password *</label>
            <input name="password" type="password" required minLength={8} value={form.password} onChange={handleChange} placeholder="At least 8 characters" style={inputStyle} />
          </div>

          {form.role === 'merchant' && (
            <div style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 12, padding: '1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#68746e' }}>
              <strong>Merchant workspace.</strong> Create your account, then add your business profile. Customers can demonstrate plan repayments using simulated payments.
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Creating account...' : `Create ${form.role === 'merchant' ? 'Merchant' : 'Customer'} Account →`}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
