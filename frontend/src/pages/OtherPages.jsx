import React, { useState, useEffect } from 'react';
import { coffeeService } from '../services/coffeeService';
import { useFetch } from '../hooks/useData';
import { fmt, fmtN, CAT_COLORS } from '../utils/helpers';

const card = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20, marginBottom:16 };
const TH = { textAlign:'left', padding:'8px 12px', fontSize:10, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:.5, borderBottom:'1px solid var(--border)' };
const TD = { padding:'10px 12px', borderBottom:'1px solid rgba(61,45,30,0.3)', color:'var(--text2)', fontSize:12 };

const EMPTY_FILTERS = {
  sale_id:'', date_from:'', date_to:'',
  hour_from:'', hour_to:'', coffee_name:'',
  category:'', payment:'', amount_min:'', amount_max:'', time_of_day:'',
};

const inpF = (active) => ({
  width:'100%', background:'var(--surface)', color:'var(--text)', fontSize:11,
  border:`1px solid ${active ? 'var(--coffee)' : 'var(--border)'}`,
  borderRadius:4, padding:'3px 7px', outline:'none', boxSizing:'border-box',
});
const selF = (active) => ({...inpF(active), cursor:'pointer', appearance:'auto'});

export function Ventes() {
  const [page, setPage]       = useState(1);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);   // debounced
  const [sort, setSort]       = useState({ by:'date', dir:'desc' });

  // Debounce text/number inputs 400ms
  useEffect(() => {
    const t = setTimeout(() => setApplied({ ...filters }), 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.sale_id, filters.date_from, filters.date_to,
      filters.hour_from, filters.hour_to, filters.coffee_name,
      filters.amount_min, filters.amount_max]);

  // Selects apply immediately (no debounce needed)
  const setImmediate = (key, val) => {
    setFilters(p => ({ ...p, [key]: val }));
    setApplied(p => ({ ...p, [key]: val }));
    setPage(1);
  };
  const setF = (key, val) => { setFilters(p => ({ ...p, [key]: val })); setPage(1); };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  };

  const toggleSort = (col) => {
    setSort(prev => prev.by === col
      ? { by: col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { by: col, dir: 'asc' }
    );
    setPage(1);
  };

  const apiKey = JSON.stringify(applied) + sort.by + sort.dir;
  const buildParams = () => ({
    ...Object.fromEntries(Object.entries(applied).filter(([,v]) => v !== '')),
    sort_by: sort.by, sort_dir: sort.dir,
  });

  const sales = useFetch(() => coffeeService.getSales(page, buildParams()), [page, apiKey]);
  const data  = sales.data;

  const hasFilters = Object.values(filters).some(v => v !== '');

  const SortBtn = ({ col }) => {
    const active = sort.by === col;
    return (
      <span style={{ marginLeft:5, fontSize:11, color: active ? 'var(--coffee)' : 'var(--border)',
                     fontWeight: active ? 700 : 400, display:'inline-block', lineHeight:1 }}>
        {active ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    );
  };

  // Header cell: sortable
  const thClick = (col) => ({
    ...TH,
    cursor:'pointer', userSelect:'none', whiteSpace:'nowrap',
    padding:'9px 10px', verticalAlign:'bottom',
    color: sort.by === col ? 'var(--coffee)' : 'var(--text3)',
    borderBottom: sort.by === col ? '2px solid var(--coffee)' : '1px solid var(--border)',
  });

  // Filter row cell
  const TF = {
    padding:'5px 8px',
    background:'var(--surface2)',
    borderBottom:'2px solid var(--border)',
    verticalAlign:'top',
  };

  return (
    <div className="fade-in">
      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
        {[
          { label:'Total transactions', value: fmtN(data?.total),                       color:'var(--coffee)' },
          { label:'Page',               value: `${data?.page||1} / ${data?.pages||1}`,   color:'var(--green)' },
          { label:'Résultats / page',   value: '10',                                     color:'var(--purple)' },
        ].map(k => (
          <div key={k.label} style={card}>
            <div style={{fontSize:10,color:'var(--text3)',marginBottom:4}}>{k.label}</div>
            <div style={{fontSize:20,fontWeight:700,color:k.color}}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        {/* Toolbar */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:14,fontWeight:600}}>Analyse des Ventes</span>
            {hasFilters && (
              <span style={{fontSize:10,background:'rgba(200,145,58,.15)',color:'var(--coffee)',
                            borderRadius:20,padding:'2px 9px',fontWeight:600}}>
                Filtres actifs
              </span>
            )}
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            {hasFilters && (
              <button onClick={resetFilters}
                style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.3)',
                        borderRadius:6,padding:'4px 10px',color:'#ef4444',fontSize:11,
                        fontWeight:600,cursor:'pointer'}}>
                ✕ Réinitialiser
              </button>
            )}
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,
                      padding:'4px 12px',color:'var(--text2)',fontSize:12,cursor:'pointer'}}>
              ← Préc
            </button>
            <span style={{padding:'4px 8px',fontSize:12,color:'var(--text2)'}}>
              Page {page} / {data?.pages||1}
            </span>
            <button onClick={() => setPage(p => p+1)} disabled={page >= (data?.pages||1)}
              style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,
                      padding:'4px 12px',color:'var(--text2)',fontSize:12,cursor:'pointer'}}>
              Suiv →
            </button>
          </div>
        </div>

        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:820}}>
            <thead>
              {/* ── Ligne d'en-têtes triables ── */}
              <tr>
                <th style={thClick('id')}      onClick={()=>toggleSort('id')}>
                  ID <SortBtn col="id"/>
                </th>
                <th style={thClick('date')}    onClick={()=>toggleSort('date')}>
                  Date <SortBtn col="date"/>
                </th>
                <th style={thClick('hour')}    onClick={()=>toggleSort('hour')}>
                  Heure <SortBtn col="hour"/>
                </th>
                <th style={thClick('coffee')}  onClick={()=>toggleSort('coffee')}>
                  Café <SortBtn col="coffee"/>
                </th>
                <th style={thClick('category')}onClick={()=>toggleSort('category')}>
                  Catégorie <SortBtn col="category"/>
                </th>
                <th style={thClick('payment')} onClick={()=>toggleSort('payment')}>
                  Paiement <SortBtn col="payment"/>
                </th>
                <th style={thClick('amount')}  onClick={()=>toggleSort('amount')}>
                  Montant <SortBtn col="amount"/>
                </th>
                <th style={thClick('moment')}  onClick={()=>toggleSort('moment')}>
                  Moment <SortBtn col="moment"/>
                </th>
              </tr>

              {/* ── Ligne de filtres ── */}
              <tr>
                {/* ID */}
                <td style={TF}>
                  <input type="number" min={1} placeholder="ID…"
                    value={filters.sale_id}
                    onChange={e => setF('sale_id', e.target.value)}
                    style={inpF(!!filters.sale_id)}/>
                </td>

                {/* Date : de → à */}
                <td style={TF}>
                  <input type="date" value={filters.date_from}
                    onChange={e => setImmediate('date_from', e.target.value)}
                    style={{...inpF(!!filters.date_from), marginBottom:3}}
                    title="Date de début"/>
                  <input type="date" value={filters.date_to}
                    onChange={e => setImmediate('date_to', e.target.value)}
                    style={inpF(!!filters.date_to)}
                    title="Date de fin"/>
                </td>

                {/* Heure : de → à */}
                <td style={TF}>
                  <div style={{display:'flex',gap:3}}>
                    <input type="number" min={0} max={23} placeholder="De"
                      value={filters.hour_from}
                      onChange={e => setF('hour_from', e.target.value)}
                      style={{...inpF(filters.hour_from !== ''), width:'50%'}}/>
                    <input type="number" min={0} max={23} placeholder="À"
                      value={filters.hour_to}
                      onChange={e => setF('hour_to', e.target.value)}
                      style={{...inpF(filters.hour_to !== ''), width:'50%'}}/>
                  </div>
                </td>

                {/* Café : recherche texte */}
                <td style={TF}>
                  <input type="text" placeholder="Recherche…"
                    value={filters.coffee_name}
                    onChange={e => setF('coffee_name', e.target.value)}
                    style={inpF(!!filters.coffee_name)}/>
                </td>

                {/* Catégorie : select */}
                <td style={TF}>
                  <select value={filters.category}
                    onChange={e => setImmediate('category', e.target.value)}
                    style={selF(!!filters.category)}>
                    <option value="">Toutes</option>
                    <option value="Classique">Classique</option>
                    <option value="Lait">Lait</option>
                    <option value="Chocolat">Chocolat</option>
                    <option value="Strong">Strong</option>
                  </select>
                </td>

                {/* Paiement : select */}
                <td style={TF}>
                  <select value={filters.payment}
                    onChange={e => setImmediate('payment', e.target.value)}
                    style={selF(!!filters.payment)}>
                    <option value="">Tous</option>
                    <option value="cash">Cash</option>
                    <option value="card">Carte</option>
                  </select>
                </td>

                {/* Montant : min → max */}
                <td style={TF}>
                  <input type="number" min={0} placeholder="Min"
                    value={filters.amount_min}
                    onChange={e => setF('amount_min', e.target.value)}
                    style={{...inpF(filters.amount_min !== ''), marginBottom:3}}/>
                  <input type="number" min={0} placeholder="Max"
                    value={filters.amount_max}
                    onChange={e => setF('amount_max', e.target.value)}
                    style={inpF(filters.amount_max !== '')}/>
                </td>

                {/* Moment : select */}
                <td style={TF}>
                  <select value={filters.time_of_day}
                    onChange={e => setImmediate('time_of_day', e.target.value)}
                    style={selF(!!filters.time_of_day)}>
                    <option value="">Tous</option>
                    <option value="Morning">Matin</option>
                    <option value="Afternoon">Après-midi</option>
                    <option value="Evening">Soir</option>
                    <option value="Night">Nuit</option>
                  </select>
                </td>
              </tr>
            </thead>

            <tbody>
              {sales.loading
                ? Array.from({length:6}).map((_,i) => (
                    <tr key={i}>
                      {Array.from({length:8}).map((__,j) => (
                        <td key={j} style={TD}>
                          <div className="skeleton" style={{height:14,borderRadius:4}}/>
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.data?.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} style={{...TD, textAlign:'center', padding:'32px', color:'var(--text3)'}}>
                        Aucun résultat pour les filtres sélectionnés.
                      </td>
                    </tr>
                  )
                  : data?.data?.map(s => (
                    <tr key={s.sale_id}
                      onMouseEnter={e => [...e.currentTarget.cells].forEach(c => c.style.background='var(--surface2)')}
                      onMouseLeave={e => [...e.currentTarget.cells].forEach(c => c.style.background='')}>
                      <td style={{...TD,color:'var(--coffee)',fontWeight:600}}>#{s.sale_id}</td>
                      <td style={TD}>{s.date}</td>
                      <td style={TD}>{s.hour}h</td>
                      <td style={{...TD,fontWeight:500,color:'var(--text)'}}>{s.coffee}</td>
                      <td style={TD}>
                        <span style={{background:(CAT_COLORS[s.category]||'#888')+'22',
                                      color:CAT_COLORS[s.category]||'#888',
                                      borderRadius:20,padding:'2px 8px',fontSize:10}}>
                          {s.category}
                        </span>
                      </td>
                      <td style={TD}>
                        <span style={{background:s.payment==='cash'?'rgba(16,185,129,.15)':'rgba(139,92,246,.15)',
                                      color:s.payment==='cash'?'var(--green)':'var(--purple)',
                                      borderRadius:20,padding:'2px 8px',fontSize:10}}>
                          {s.payment}
                        </span>
                      </td>
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

const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12];
const MONTHS_FR = {1:'Janvier',2:'Février',3:'Mars',4:'Avril',5:'Mai',6:'Juin',7:'Juillet',8:'Août',9:'Septembre',10:'Octobre',11:'Novembre',12:'Décembre'};
const YEARS = ['2023','2024','2025','2026'];

const sel = {width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'9px 12px',color:'var(--text)',fontSize:13};

export function Rapports() {
  const reports = useFetch(() => coffeeService.getReports());

  // ── Génération ────────────────────────────────────────────────
  const [periodType, setPeriodType] = useState('month');
  const [selMonth, setSelMonth]     = useState(1);
  const [selSem, setSelSem]         = useState('S1');
  const [selYear, setSelYear]       = useState('2025');
  const [notes, setNotes]           = useState('');
  const [genLoading, setGenLoading] = useState(false);

  const formatPeriodLabel = (period) => {
    const text = String(period ?? '').trim();
    if (!text) return '';

    const parts = text.split(/\s+/);
    if (parts.length >= 2) {
      const monthNumber = Number(parts[0]);
      if (!Number.isNaN(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
        const monthName = MONTHS_FR[monthNumber];
        return `${(monthName || parts[0]).toLowerCase()} ${parts.slice(1).join(' ')}`.trim();
      }
    }

    return text;
  };

  // ── Sélection pour export ─────────────────────────────────────
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [exportingIds, setExportingIds] = useState(new Set());

  const getPeriodStr = () => {
    if (periodType === 'semester') return `${selSem} ${selYear}`;
    if (periodType === 'year')     return selYear;
    return `${selMonth} ${selYear}`;
  };

  const getDisplayPeriodStr = () => {
    if (periodType === 'semester') return `${selSem} ${selYear}`;
    if (periodType === 'year') return selYear;
    return formatPeriodLabel(`${selMonth} ${selYear}`);
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
      `Rapport CoffeeBI,${q(formatPeriodLabel(data.period))}`,
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
      a.download = `rapport_${(formatPeriodLabel(report.period)||'').replace(/\s+/g,'_')}_coffeebi.${ext}`;
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
                        <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>Rapport {formatPeriodLabel(r.period)}</div>
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
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              <div>
                <label style={{fontSize:12,color:'var(--text2)',display:'block',marginBottom:6}}>Mois</label>
                <select value={selMonth} onChange={e=>setSelMonth(e.target.value)} style={sel}>
                  {MONTHS.map(m=><option key={m} value={m}>{MONTHS_FR[m]}</option>)}
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
            Période sélectionnée : <strong style={{color:'var(--coffee)'}}>{getDisplayPeriodStr()}</strong>
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
