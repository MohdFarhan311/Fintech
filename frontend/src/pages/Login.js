import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'merchant') navigate('/merchant/dashboard');
      else navigate('/customer/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Welcome back</h2>
        <p className="sub">Log in to your FlexTenure account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form-light">
          <div className="form-group">
            <label>Email address</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" style={{ background: '#fafbf9', border: '1px solid #dfe5dc', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.9rem', width: '100%', outline: 'none', color: 'var(--ink)' }} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" required value={form.password} onChange={handleChange} placeholder="••••••••" style={{ background: '#fafbf9', border: '1px solid #dfe5dc', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.9rem', width: '100%', outline: 'none', color: 'var(--ink)' }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In →'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Sign up free</Link>
        </div>
      </div>
    </div>
  );
}
