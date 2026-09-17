import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function AuthPage({ mode = 'login', admin = false }) {
  const { login, signUp, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const params = new URLSearchParams(location.search);
  const [error, setError] = useState(params.get('error') === 'not-admin' ? 'This account does not have administrator access.' : '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const returnTo = params.get('return') || (admin ? '/admin' : '/account');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters.');
        if (form.password !== form.confirm) throw new Error('Passwords do not match.');
        const data = await signUp(form);
        if (!data.session) setMessage('Check your email to confirm your account, then log in.');
        else navigate(returnTo, { replace: true });
      } else if (mode === 'forgot') {
        const redirectTo = `${window.location.origin}/reset-password`;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo });
        if (resetError) throw resetError;
        setMessage('Password reset instructions have been sent to your email.');
      } else if (mode === 'reset') {
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters.');
        if (form.password !== form.confirm) throw new Error('Passwords do not match.');
        const { error: updateError } = await supabase.auth.updateUser({ password: form.password });
        if (updateError) throw updateError;
        setMessage('Password updated. You can now use your new password.');
        setTimeout(() => navigate('/account', { replace: true }), 900);
      } else {
        const result = await login(form.email, form.password);
        if (admin && result.profile?.role !== 'admin') {
          await logout();
          throw new Error(result.profile ? 'This account is not an administrator.' : 'No ShopXzetio profile was found for this account.');
        }
        navigate(result.profile?.role === 'admin' ? '/admin' : returnTo, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  const titles = {
    login: [admin ? 'ADMIN COMMAND LOGIN' : 'CUSTOMER LOGIN', admin ? 'Authorized ShopXzetio staff only.' : 'Return to your loadout, orders and saved delivery details.'],
    signup: ['CREATE ACCOUNT', 'Faster checkout and one place for every ShopXzetio order.'],
    forgot: ['RESET ACCESS', 'We will email you a secure password-reset link.'],
    reset: ['NEW PASSWORD', 'Choose a new password for your ShopXzetio account.'],
  };
  const [title, subtitle] = titles[mode];

  return (
    <main className="account-shell auth-shell">
      <section className="auth-card cyber-cut-sm">
        <Link to="/" className="auth-back"><i className="fa-solid fa-arrow-left" /> Continue shopping</Link>
        <div className="auth-emblem"><i className="fa-solid fa-user-astronaut" /></div>
        <p className="auth-kicker">{admin ? '// SECURE STAFF ACCESS' : '// SHOPXZETIO CUSTOMER NETWORK'}</p>
        <h1>{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && (
            <>
              <label>Full Name<input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
              <label>Phone Number <span>(optional)</span><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            </>
          )}
          {!['reset'].includes(mode) && <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>}
          {!['forgot'].includes(mode) && <label>Password<input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>}
          {['signup', 'reset'].includes(mode) && <label>Confirm Password<input required type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></label>}
          {error && <div className="auth-alert error">{error}</div>}
          {message && <div className="auth-alert success">{message}</div>}
          <button disabled={busy} className="btn-cyber-primary cyber-cut-sm" type="submit">
            {busy ? 'PROCESSING…' : mode === 'login' ? 'LOGIN' : mode === 'signup' ? 'CREATE ACCOUNT' : 'UPDATE PASSWORD'}
          </button>
        </form>
        {mode === 'login' && <div className="auth-links"><Link to="/forgot-password">Forgot password?</Link>{!admin && <Link to={`/signup?return=${encodeURIComponent(returnTo)}`}>Create Account</Link>}</div>}
        {mode === 'signup' && <p className="auth-switch">Already registered? <Link to={`/login?return=${encodeURIComponent(returnTo)}`}>Login</Link></p>}
        {mode === 'forgot' && <p className="auth-switch"><Link to="/login">Back to Login</Link></p>}
      </section>
    </main>
  );
}
