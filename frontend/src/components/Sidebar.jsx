import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { label:'Principal', items:[
    { to:'/dashboard',   icon:'☕', text:'Dashboard'     },
    { to:'/ventes',      icon:'📊', text:'Ventes'        },
    { to:'/produits',    icon:'🫘', text:'Produits'      },
    { to:'/clients',     icon:'👥', text:'Clients'       },
  ]},
  { label:'Analytique', items:[
    { to:'/predictions', icon:'🤖', text:'Prédictions ML' },
    { to:'/rapports',    icon:'📋', text:'Rapports BI'   },
  ]},
];

const S = {
  sidebar: { width:220, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink:0, height:'100vh' },
  logo:    { display:'flex', alignItems:'center', gap:10, padding:'20px 16px 18px', borderBottom:'1px solid var(--border)' },
  logoIcon:{ fontSize:28 },
  logoText:{ fontFamily:"'Space Grotesk',sans-serif", fontSize:17, fontWeight:700, color:'var(--coffee)' },
  logoSub: { fontSize:10, color:'var(--text3)', marginTop:2 },
  nav:     { flex:1, padding:'14px 10px', overflowY:'auto' },
  label:   { fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase', padding:'0 8px', margin:'14px 0 6px', display:'block' },
  footer:  { padding:14, borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' },
  avatar:  { width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,var(--coffee),var(--coffee2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#1a1410', flexShrink:0 },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  return (
    <aside style={S.sidebar}>
      <div style={S.logo}>
        <span style={S.logoIcon}>☕</span>
        <div>
          <div style={S.logoText}>CoffeeBI</div>
          <div style={S.logoSub}>Dashboard Analytique</div>
        </div>
      </div>

      <nav style={S.nav}>
        {NAV.map(g => (
          <div key={g.label}>
            <span style={S.label}>{g.label}</span>
            {g.items.map(item => (
              <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                borderRadius:'var(--radius-sm)', fontSize:13, marginBottom:2,
                textDecoration:'none', transition:'all .15s',
                background: isActive ? 'rgba(200,145,58,0.15)' : 'transparent',
                color:      isActive ? 'var(--coffee)'         : 'var(--text2)',
                fontWeight: isActive ? 500 : 400,
              })}>
                <span style={{ fontSize:15, width:20, textAlign:'center' }}>{item.icon}</span>
                {item.text}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div style={S.footer}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={S.avatar}>{user?.name?.slice(0,2).toUpperCase()||'HS'}</div>
          <div>
            <div style={{ fontSize:12, fontWeight:500, color:'var(--text)' }}>{user?.name||'Hafsa Salim'}</div>
            <div style={{ fontSize:10, color:'var(--text3)' }}>{user?.email||''}</div>
          </div>
        </div>
        <button onClick={()=>{logout();navigate('/login');}}
          style={{ background:'none', color:'var(--text3)', fontSize:18, padding:'4px 6px', borderRadius:6, transition:'all .15s' }}
          onMouseEnter={e=>e.target.style.color='var(--red)'}
          onMouseLeave={e=>e.target.style.color='var(--text3)'}
        >⎋</button>
      </div>
    </aside>
  );
}
