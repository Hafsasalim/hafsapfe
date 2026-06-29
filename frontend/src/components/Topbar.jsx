import React from 'react';
import { useLocation } from 'react-router-dom';

const TITLES = {
  '/dashboard':  'Dashboard ☕',
  '/ventes':     'Analyse des Ventes 📊',
  '/produits':   'Catalogue Produits 🫘',
  '/clients':    'Clients 👥',
  '/predictions':'Prédictions ML 🤖',
  '/rapports':   'Rapports 📋',
};

export default function Topbar() {
  const { pathname } = useLocation();
  return (
    <header style={{
      height:54, background:'var(--surface)', borderBottom:'1px solid var(--border)',
      display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', flexShrink:0,
    }}>
      <h2 style={{ fontSize:16, fontWeight:600, color:'var(--text)', fontFamily:"'Space Grotesk',sans-serif" }}>
        {TITLES[pathname] || 'Dashboard ☕'}
      </h2>
      <div style={{ display:'flex', gap:10 }}>
        <span style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:20, padding:'4px 12px', fontSize:11, color:'var(--text2)' }}>
          🟢 FastAPI connecté
        </span>
        <span style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:20, padding:'4px 12px', fontSize:11, color:'var(--text2)' }}>
          📅 {new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}
        </span>
      </div>
    </header>
  );
}
