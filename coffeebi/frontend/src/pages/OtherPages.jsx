import React, { useState } from 'react';
import { coffeeService } from '../services/coffeeService';
import { useFetch } from '../hooks/useData';
import { fmt, fmtN, CAT_COLORS } from '../utils/helpers';

const card = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20, marginBottom:16 };
const TH = { textAlign:'left', padding:'8px 12px', fontSize:10, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:.5, borderBottom:'1px solid var(--border)' };
const TD = { padding:'10px 12px', borderBottom:'1px solid rgba(61,45,30,0.3)', color:'var(--text2)', fontSize:12 };

export function Ventes() {
  const [page, setPage] = useState(1);
  const sales = useFetch(() => coffeeService.getSales(page), [page]);
  const data  = sales.data;

  return (
    <div className="fade-in">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          {label:'Total transactions', value: fmtN(data?.total), color:'var(--coffee)'},
          {label:'Page actuelle',      value: `${data?.page||1} / ${data?.pages||1}`, color:'var(--green)'},
          {label:'Résultats par page', value: '10',             color:'var(--purple)'},
        ].map(k => (
          <div key={k.label} style={card}>
            <div style={{fontSize:10,color:'var(--text3)',marginBottom:4}}>{k.label}</div>
            <div style={{fontSize:20,fontWeight:700,color:k.color}}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:600}}>Transactions — coffee_sales × cafe × payment_mode</div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
              style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 12px',color:'var(--text2)',fontSize:12}}>← Préc</button>
            <span style={{padding:'4px 12px',fontSize:12,color:'var(--text2)'}}>Page {page}</span>
            <button onClick={()=>setPage(p=>p+1)} disabled={page>=(data?.pages||1)}
              style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 12px',color:'var(--text2)',fontSize:12}}>Suiv →</button>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={TH}>ID</th><th style={TH}>Date</th><th style={TH}>Heure</th>
              <th style={TH}>Café</th><th style={TH}>Catégorie</th><th style={TH}>Paiement</th>
              <th style={TH}>Montant</th><th style={TH}>Moment</th>
            </tr></thead>
            <tbody>
              {sales.loading
                ? Array.from({length:5}).map((_,i)=><tr key={i}>{Array.from({length:8}).map((__,j)=><td key={j} style={TD}><div className="skeleton" style={{height:14,borderRadius:4}}/></td>)}</tr>)
                : data?.data?.map(s => (
                  <tr key={s.sale_id} style={{cursor:'default'}} onMouseEnter={e=>{[...e.currentTarget.cells].forEach(c=>c.style.background='var(--surface2)')}} onMouseLeave={e=>{[...e.currentTarget.cells].forEach(c=>c.style.background='')}}>
                    <td style={{...TD,color:'var(--coffee)',fontWeight:600}}>#{s.sale_id}</td>
                    <td style={TD}>{s.date}</td>
                    <td style={TD}>{s.hour}h</td>
                    <td style={{...TD,fontWeight:500,color:'var(--text)'}}>{s.coffee}</td>
                    <td style={TD}><span style={{background:(CAT_COLORS[s.category]||'#888')+'22',color:CAT_COLORS[s.category]||'#888',borderRadius:20,padding:'2px 8px',fontSize:10}}>{s.category}</span></td>
                    <td style={TD}><span style={{background:s.payment==='cash'?'rgba(16,185,129,.15)':'rgba(139,92,246,.15)',color:s.payment==='cash'?'var(--green)':'var(--purple)',borderRadius:20,padding:'2px 8px',fontSize:10}}>{s.payment}</span></td>
                    <td style={{...TD,fontWeight:600,color:'var(--coffee)'}}>{fmt(s.amount)}</td>
                    <td style={TD}>{s.time_of_day}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function Produits() {
  const products = useFetch(() => coffeeService.getProducts());
  return (
    <div className="fade-in">
      <div style={card}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>Catalogue — cafe × coffee_sales (JOIN)</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {products.loading
            ? Array.from({length:6}).map((_,i)=><div key={i} className="skeleton" style={{height:120,borderRadius:'var(--radius-sm)'}}/>)
            : products.data?.map(p => (
              <div key={p.id||p.name} style={{background:'var(--surface2)',border:`1px solid ${CAT_COLORS[p.category]||'var(--border)'}44`,borderRadius:'var(--radius-sm)',padding:14}}>
                <div style={{fontSize:11,color:CAT_COLORS[p.category]||'var(--text3)',marginBottom:6}}>{p.category}</div>
                <div style={{fontSize:14,fontWeight:600,color:'var(--text)',marginBottom:8}}>{p.name}</div>
                <div style={{height:4,background:'var(--surface3)',borderRadius:2,overflow:'hidden',marginBottom:8}}>
                  <div style={{height:4,borderRadius:2,width:`${Math.min(100,((p.total_revenue||p.revenue||0)/5600)*100)}%`,background:CAT_COLORS[p.category]||'var(--coffee)'}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}>
                  <span style={{color:'var(--text2)'}}>{fmtN(p.sales_count||p.count||0)} ventes</span>
                  <span style={{color:'var(--coffee)',fontWeight:600}}>{fmt(p.total_revenue||p.revenue)}</span>
                </div>
                {p.base_price && <div style={{fontSize:10,color:'var(--text3)',marginTop:4}}>Prix base : {p.base_price} MAD</div>}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

export function Clients() {
  const clients = useFetch(() => coffeeService.getClients());
  return (
    <div className="fade-in">
      <div style={card}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>Clients anonymisés — client × coffee_sales (JOIN)</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            <th style={TH}>ID</th><th style={TH}>Code anonyme</th>
            <th style={TH}>Commandes</th><th style={TH}>Total dépensé</th>
          </tr></thead>
          <tbody>
            {clients.loading
              ? Array.from({length:8}).map((_,i)=><tr key={i}>{[1,2,3,4].map(j=><td key={j} style={TD}><div className="skeleton" style={{height:14,borderRadius:4}}/></td>)}</tr>)
              : clients.data?.map(c => (
                <tr key={c.id}>
                  <td style={{...TD,color:'var(--coffee)',fontWeight:600}}>#{c.id}</td>
                  <td style={{...TD,fontFamily:'monospace',fontSize:11}}>{c.code}</td>
                  <td style={{...TD,fontWeight:600}}>{fmtN(c.orders)}</td>
                  <td style={{...TD,color:'var(--coffee)',fontWeight:600}}>{fmt(c.spent)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Rapports() {
  const reports = useFetch(() => coffeeService.getReports());
  const [gen, setGen] = useState({period:'June',notes:''});
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try { await coffeeService.generateReport(gen.period, gen.notes); reports.refetch(); }
    finally { setLoading(false); }
  };

  return (
    <div className="fade-in">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={card}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>📋 Rapports générés</div>
          {reports.loading
            ? <div className="skeleton" style={{height:200,borderRadius:8}}/>
            : reports.data?.map(r => (
              <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid rgba(61,45,30,0.3)'}}>
                <span style={{fontSize:24}}>📊</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>Rapport {r.period}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>{r.created_at?.slice(0,16)}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--coffee)'}}>{fmt(r.total_sales)}</div>
                  <span style={{background:'rgba(16,185,129,.15)',color:'var(--green)',borderRadius:20,padding:'2px 8px',fontSize:10}}>Disponible</span>
                </div>
              </div>
            ))
          }
        </div>

        <div style={card}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>⚡ Générer un rapport</div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div>
              <label style={{fontSize:12,color:'var(--text2)',display:'block',marginBottom:6}}>Période (mois)</label>
              <select value={gen.period} onChange={e=>setGen(p=>({...p,period:e.target.value}))}
                style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'9px 12px',color:'var(--text)',fontSize:13}}>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,color:'var(--text2)',display:'block',marginBottom:6}}>Notes</label>
              <textarea value={gen.notes} onChange={e=>setGen(p=>({...p,notes:e.target.value}))} rows={3}
                style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'9px 12px',color:'var(--text)',fontSize:13,resize:'vertical'}}
                placeholder="Notes optionnelles..."/>
            </div>
            <button onClick={handleGenerate} disabled={loading}
              style={{background:'var(--coffee)',border:'none',borderRadius:'var(--radius-sm)',padding:'10px',color:'#1a1410',fontSize:13,fontWeight:700,opacity:loading?0.7:1}}>
              {loading?'⏳ Génération...':'📊 Générer le rapport'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
