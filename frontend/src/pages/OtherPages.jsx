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

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_FR = {January:'Janvier',February:'Février',March:'Mars',April:'Avril',May:'Mai',June:'Juin',July:'Juillet',August:'Août',September:'Septembre',October:'Octobre',November:'Novembre',December:'Décembre'};
const YEARS = ['2023','2024','2025','2026'];

const sel = {width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'9px 12px',color:'var(--text)',fontSize:13};

export function Rapports() {
  const reports = useFetch(() => coffeeService.getReports());

  // ── Génération ────────────────────────────────────────────────
  const [periodType, setPeriodType] = useState('month');
  const [selMonth, setSelMonth]     = useState('January');
  const [selSem, setSelSem]         = useState('S1');
  const [selYear, setSelYear]       = useState('2025');
  const [notes, setNotes]           = useState('');
  const [genLoading, setGenLoading] = useState(false);

  // ── Sélection pour export ─────────────────────────────────────
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [exportingIds, setExportingIds] = useState(new Set());

  const getPeriodStr = () => {
    if (periodType === 'semester') return `${selSem} ${selYear}`;
    if (periodType === 'year')     return selYear;
    return selMonth;
  };

  const handleGenerate = async () => {
    setGenLoading(true);
    try { await coffeeService.generateReport(getPeriodStr(), notes); reports.refetch(); setNotes(''); }
    finally { setGenLoading(false); }
  };

  const toggleSelect = (id) => setSelectedIds(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const allSelected = reports.data?.length > 0 && selectedIds.size === reports.data?.length;
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(reports.data?.map(r => r.id)));

  const buildRichCSV = (data, report) => {
    const q = v => `"${String(v ?? '').replace(/"/g, "'")}"`;
    const lines = [
      `Rapport CoffeeBI,${q(data.period)}`,
      `Généré le,${q((report.created_at || data.created_at || '').slice(0, 16))}`,
      `Notes,${q(report.notes || data.notes || '')}`,
      '',
      '=== INDICATEURS CLÉS ===',
      `Chiffre d'affaires (MAD),${data.kpis.chiffre_affaires}`,
      `Nombre de ventes,${data.kpis.nombre_ventes}`,
      `Panier moyen (MAD),${data.kpis.panier_moyen}`,
      '',
      '=== TOP 5 PRODUITS ===',
      'Rang,Produit,Catégorie,CA (MAD),Nb Ventes',
      ...data.top_produits.map(p => `${p.rang},${q(p.produit)},${q(p.categorie)},${p.ca},${p.ventes}`),
      '',
      '=== VENTES PAR CATÉGORIE ===',
      'Catégorie,CA (MAD),Nb Ventes,Part (%)',
      ...data.par_categorie.map(c => `${q(c.categorie)},${c.ca},${c.ventes},${c.part_pct}`),
      '',
      '=== VENTES PAR MODE DE PAIEMENT ===',
      'Mode,Nb Ventes,CA (MAD)',
      ...data.par_paiement.map(p => `${q(p.mode)},${p.ventes},${p.ca}`),
    ];
    if (data.predictions?.length > 0) {
      lines.push('', '=== PRÉDICTIONS ML ===', 'Café,Prix Prédit (MAD),Confiance (%),Date');
      data.predictions.forEach(p => lines.push(`${q(p.cafe)},${p.prix_predit},${p.confiance_pct},${p.date}`));
    }
    return '﻿' + lines.join('\n');
  };

  const exportOne = async (report) => {
    setExportingIds(prev => new Set(prev).add(report.id));
    try {
      let blob, ext;
      try {
        blob = await coffeeService.exportReportExcel(report.id);
        ext  = 'xlsx';
      } catch {
        // Fallback CSV si le backend est indisponible
        const data = await coffeeService.getReportFullData(report.id);
        const csv  = buildRichCSV(data, report);
        blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        ext  = 'csv';
      }
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `rapport_${(report.period||'').replace(/\s+/g,'_')}_coffeebi.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingIds(prev => { const n = new Set(prev); n.delete(report.id); return n; });
    }
  };

  const exportSelected = async () => {
    const toExport = (reports.data || []).filter(r => selectedIds.has(r.id));
    for (const r of toExport) {
      await exportOne(r);
      await new Promise(res => setTimeout(res, 350));
    }
  };

  const btnBase = {border:'none',borderRadius:'var(--radius-sm)',padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer'};
  const tabStyle = (active) => ({
    flex:1, padding:'7px 0', fontSize:12, fontWeight:600, border:'none', cursor:'pointer',
    borderRadius:'var(--radius-sm)',
    background: active ? 'var(--coffee)' : 'var(--surface2)',
    color:       active ? '#1a1410'       : 'var(--text2)',
    transition: 'all .15s',
  });

  return (
    <div className="fade-in">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

        {/* ── Liste des rapports ── */}
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
            <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',userSelect:'none'}}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll}
                style={{width:15,height:15,accentColor:'var(--coffee)',cursor:'pointer'}}/>
              <span style={{fontSize:14,fontWeight:600}}>📋 Rapports générés</span>
            </label>
            <div style={{marginLeft:'auto',display:'flex',gap:8}}>
              {selectedIds.size > 0 && (
                <button onClick={exportSelected}
                  style={{background:'rgba(16,185,129,.15)',border:'1px solid var(--green)',borderRadius:'var(--radius-sm)',padding:'5px 12px',color:'var(--green)',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                  ⬇ Excel sélection ({selectedIds.size})
                </button>
              )}
            </div>
          </div>

          {reports.loading
            ? <div className="skeleton" style={{height:200,borderRadius:8}}/>
            : reports.data?.length === 0
              ? <div style={{color:'var(--text3)',fontSize:13,textAlign:'center',padding:'40px 0'}}>Aucun rapport — générez-en un à droite.</div>
              : reports.data?.map(r => {
                  const isSel  = selectedIds.has(r.id);
                  const isExp  = exportingIds.has(r.id);
                  return (
                    <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 0',borderBottom:'1px solid rgba(61,45,30,0.3)',transition:'background .1s'}}>
                      <input type="checkbox" checked={isSel} onChange={() => toggleSelect(r.id)}
                        style={{width:15,height:15,accentColor:'var(--coffee)',cursor:'pointer',flexShrink:0}}/>
                      <span style={{fontSize:22,flexShrink:0}}>📊</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>Rapport {r.period}</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>{r.created_at?.slice(0,16)}</div>
                      </div>
                      <div style={{textAlign:'right',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                        <div style={{fontSize:13,fontWeight:700,color:'var(--coffee)'}}>{fmt(r.total_sales)}</div>
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          <span style={{background:'rgba(16,185,129,.15)',color:'var(--green)',borderRadius:20,padding:'2px 8px',fontSize:10}}>Disponible</span>
                          <button onClick={() => exportOne(r)} disabled={isExp}
                            style={{background:'rgba(200,145,58,.15)',border:'1px solid var(--coffee)',borderRadius:20,padding:'2px 8px',fontSize:10,color:'var(--coffee)',cursor:'pointer',fontWeight:600,opacity:isExp ? 0.6 : 1}}>
                            {isExp ? '⏳' : '⬇ Excel'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
          }
        </div>

        {/* ── Générer un rapport ── */}
        <div style={card}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>⚡ Générer un rapport</div>

          {/* Tabs type de période */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,color:'var(--text2)',marginBottom:8}}>Type de période</div>
            <div style={{display:'flex',gap:6}}>
              {[['month','Mois'],['semester','Semestre'],['year','Année']].map(([v,label])=>(
                <button key={v} onClick={()=>setPeriodType(v)} style={tabStyle(periodType===v)}>{label}</button>
              ))}
            </div>
          </div>

          {/* Sélecteurs dynamiques */}
          {periodType === 'month' && (
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,color:'var(--text2)',display:'block',marginBottom:6}}>Mois</label>
              <select value={selMonth} onChange={e=>setSelMonth(e.target.value)} style={sel}>
                {MONTHS.map(m=><option key={m} value={m}>{MONTHS_FR[m]}</option>)}
              </select>
            </div>
          )}

          {periodType === 'semester' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              <div>
                <label style={{fontSize:12,color:'var(--text2)',display:'block',marginBottom:6}}>Semestre</label>
                <select value={selSem} onChange={e=>setSelSem(e.target.value)} style={sel}>
                  <option value="S1">S1 — Jan → Juin</option>
                  <option value="S2">S2 — Juil → Déc</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:12,color:'var(--text2)',display:'block',marginBottom:6}}>Année</label>
                <select value={selYear} onChange={e=>setSelYear(e.target.value)} style={sel}>
                  {YEARS.map(y=><option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
          )}

          {periodType === 'year' && (
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,color:'var(--text2)',display:'block',marginBottom:6}}>Année</label>
              <select value={selYear} onChange={e=>setSelYear(e.target.value)} style={sel}>
                {YEARS.map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
          )}

          {/* Aperçu de la période */}
          <div style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'8px 12px',marginBottom:14,fontSize:12,color:'var(--text2)'}}>
            Période sélectionnée : <strong style={{color:'var(--coffee)'}}>{getPeriodStr()}</strong>
          </div>

          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,color:'var(--text2)',display:'block',marginBottom:6}}>Notes (optionnel)</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
              style={{...sel,resize:'vertical'}}
              placeholder="Notes optionnelles..."/>
          </div>

          <button onClick={handleGenerate} disabled={genLoading}
            style={{...btnBase,background:'var(--coffee)',color:'#1a1410',width:'100%',opacity:genLoading ? 0.7 : 1}}>
            {genLoading ? '⏳ Génération en cours...' : '📊 Générer le rapport'}
          </button>

          <div style={{marginTop:14,padding:'10px 12px',background:'rgba(200,145,58,.08)',borderRadius:'var(--radius-sm)',fontSize:11,color:'var(--text3)',lineHeight:1.6}}>
            Le rapport inclut : chiffre d'affaires, nombre de ventes, panier moyen, top 5 produits, répartition par catégorie, mode de paiement et prédictions ML.
          </div>
        </div>
      </div>
    </div>
  );
}
