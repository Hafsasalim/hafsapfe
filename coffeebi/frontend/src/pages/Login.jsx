import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, password);
    if (ok) navigate('/dashboard');
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', position:'relative', overflow:'hidden' }}>
      {/* Background blobs */}
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'rgba(200,145,58,0.05)', top:-100, right:-100, pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'rgba(200,145,58,0.04)', bottom:-80, left:-80, pointerEvents:'none' }} />

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:40, width:380, position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
          <span style={{ fontSize:36 }}>☕</span>
          <div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, color:'var(--coffee)' }}>CoffeeBI</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Dashboard Analytique — Coffee Shop</div>
          </div>
        </div>

        <h1 style={{ fontSize:22, fontWeight:700, marginBottom:6, fontFamily:"'Space Grotesk',sans-serif" }}>Connexion</h1>
        <p style={{ fontSize:13, color:'var(--text2)', marginBottom:24 }}>Accédez à votre tableau de bord BI</p>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:12, color:'var(--text2)' }}>Adresse e-mail</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 14px', color:'var(--text)', fontSize:13, width:'100%' }}
              onFocus={e=>e.target.style.borderColor='var(--coffee)'}
              onBlur={e=>e.target.style.borderColor='var(--border)'}
              placeholder="email@coffeebi.com"
            />
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:12, color:'var(--text2)' }}>Mot de passe</label>
            <div style={{ position:'relative' }}>
              <input type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} required
                style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 40px 10px 14px', color:'var(--text)', fontSize:13, width:'100%' }}
                onFocus={e=>e.target.style.borderColor='var(--coffee)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'}
                placeholder="••••••••"
              />
              <button type="button" onClick={()=>setShowPwd(v=>!v)}
                style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', fontSize:16, color:'var(--text3)' }}>
                {showPwd?'🙈':'👁️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ background:'var(--coffee)', border:'none', borderRadius:'var(--radius-sm)', padding:12, color:'#1a1410', fontSize:14, fontWeight:700, marginTop:4, opacity:loading?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading ? '⏳ Connexion...' : 'Se connecter ☕'}
          </button>
        </form>

        <div style={{ marginTop:16, background:'var(--surface2)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:11, color:'var(--text2)' }}>
          <strong>Comptes démo :</strong><br/>
          admin@coffeebi.com / admin123<br/>
          manager@coffeebi.com / manager123
        </div>
        <div style={{ marginTop:14, textAlign:'center', fontSize:10, color:'var(--text3)' }}>
          PFE 2025
        </div>
      </div>
    </div>
  );
}
