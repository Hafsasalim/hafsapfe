import React, { useState, useRef, useEffect } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip } from 'chart.js';
import { coffeeService } from '../services/coffeeService';
import { usePredHistory } from '../hooks/useData';
import { fmt } from '../utils/helpers';
import toast from 'react-hot-toast';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

const CAFES = [
  {id:15,name:"Espresso",prix:12},{id:16,name:"Cappuccino",prix:18},
  {id:17,name:"Latte",prix:20},{id:18,name:"Americano",prix:15},{id:19,name:"Mocha",prix:22},
];
const PAYMENTS = [{id:1,type:"Cash 💵"},{id:2,type:"Card 💳"}];
const TIMES = ["Morning","Afternoon","Evening"];

const card = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20 };

export default function Predictions() {
  const history = usePredHistory();
  const [form, setForm] = useState({ coffee_id:15, hour:10, sale_date: new Date().toISOString().split('T')[0], payment_id:1 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionPreds, setSessionPreds] = useState([]);
  const canvasRef = useRef(); const chartRef = useRef();

  // Import CSV state
  const [csvFile, setCsvFile] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const fileInputRef = useRef();

  const handlePredict = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await coffeeService.predict({
        coffee_id:  parseInt(form.coffee_id),
        hour:       parseInt(form.hour),
        sale_date:  form.sale_date,
        payment_id: parseInt(form.payment_id),
      });
      setResult(data);
      setSessionPreds(prev => [...prev, { label: data.coffee_name, value: data.predicted_price }]);
      toast.success(`Prix prédit : ${fmt(data.predicted_price)} — Confiance : ${(data.confidence*100).toFixed(0)}%`);
    } catch { toast.error('Erreur de prédiction'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!sessionPreds.length) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type:'line',
      data: {
        labels: sessionPreds.map((_, i) => `#${i+1}`),
        datasets:[{ label:'Prix prédit (MAD)', data: sessionPreds.map(p=>p.value),
          borderColor:'#c8913a', backgroundColor:'rgba(200,145,58,0.15)',
          tension:.3, pointRadius:5, fill:true }]
      },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#1a1410', titleColor:'#f5e6d0', bodyColor:'#b89878' } },
        scales:{ x:{grid:{display:false},ticks:{color:'#b89878'}}, y:{grid:{color:'rgba(61,45,30,0.4)'},ticks:{color:'#b89878'}} }
      }
    });
    return () => { if(chartRef.current) chartRef.current.destroy(); };
  }, [sessionPreds]);

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setCsvLoading(true);
    setCsvResult(null);
    try {
      const data = await coffeeService.uploadPredict(csvFile);
      setCsvResult(data);
      toast.success(`${data.total_rows} prédictions générées et sauvegardées !`);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(detail || 'Erreur import CSV — vérifiez le format du fichier');
    }
    finally { setCsvLoading(false); }
  };

  const exportCsvResult = () => {
    if (!csvResult) return;
    const header = 'Date,Heure,Café,Paiement,Prix réel (MAD),Prix prédit (MAD)\n';
    const rows = csvResult.predictions.map(r =>
      `${r.date},${r.hour_of_day},"${r.coffee_name}","${r.cash_type}",${r.money},${r.predicted_price}`
    ).join('\n');
    const blob = new Blob(['﻿' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'predictions_import.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const selectedCafe = CAFES.find(c=>c.id===parseInt(form.coffee_id));

  return (
    <div className="fade-in">
      {/* Métriques modèle */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          {label:'Modèle',value:'Random Forest',color:'var(--purple)'},
          {label:'R² Score',value:'1.00',color:'var(--green)'},
          {label:'MAE',value:'0.04 MAD',color:'var(--amber)'},
          {label:'Transactions entraînement',value:'3 636',color:'var(--coffee)'},
        ].map(m => (
          <div key={m.label} style={{...card}}>
            <div style={{fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:.5,marginBottom:4}}>{m.label}</div>
            <div style={{fontSize:17,fontWeight:700,color:m.color,fontFamily:"'Space Grotesk',sans-serif"}}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* ── Section Import CSV ────────────────────────────────────────────── */}
      <div style={{...card, marginBottom:20}}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>📂 Importer des données CSV pour nouvelle prédiction</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

          {/* Upload zone */}
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{border:`2px dashed ${csvFile?'var(--coffee)':'var(--border)'}`,borderRadius:'var(--radius-sm)',padding:28,textAlign:'center',cursor:'pointer',transition:'all .2s',background:csvFile?'rgba(200,145,58,.08)':'transparent'}}
              onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor='var(--coffee)'}}
              onDragLeave={e=>{e.currentTarget.style.borderColor=csvFile?'var(--coffee)':'var(--border)'}}
              onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f?.name.endsWith('.csv')){setCsvFile(f);setCsvResult(null);}}}
            >
              <div style={{fontSize:32,marginBottom:8}}>📁</div>
              <div style={{fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:4}}>
                {csvFile ? csvFile.name : 'Glissez votre fichier CSV ici'}
              </div>
              <div style={{fontSize:11,color:'var(--text3)'}}>
                {csvFile ? `${(csvFile.size/1024).toFixed(1)} KB` : 'ou cliquez pour sélectionner'}
              </div>
              <input ref={fileInputRef} type="file" accept=".csv" style={{display:'none'}}
                onChange={e=>{const f=e.target.files[0];if(f){setCsvFile(f);setCsvResult(null);}}}/>
            </div>

            <div style={{fontSize:11,color:'var(--text3)',marginTop:8,lineHeight:1.6}}>
              Format attendu (séparateur <code style={{background:'var(--surface2)',padding:'0 4px',borderRadius:3}}>;</code>) :<br/>
              <code style={{fontSize:10}}>date;hour_of_day;cash_type;coffee_name;money;...</code>
            </div>

            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button onClick={handleCsvUpload} disabled={!csvFile||csvLoading}
                style={{flex:1,background:csvFile?'var(--coffee)':'var(--surface2)',border:'none',borderRadius:'var(--radius-sm)',padding:'10px',color:csvFile?'#1a1410':'var(--text3)',fontSize:13,fontWeight:700,opacity:csvLoading?0.7:1,cursor:csvFile?'pointer':'not-allowed'}}>
                {csvLoading ? '⏳ Prédiction en cours...' : '🤖 Lancer les prédictions'}
              </button>
              {csvFile && (
                <button onClick={()=>{setCsvFile(null);setCsvResult(null);fileInputRef.current.value='';}}
                  style={{background:'rgba(239,68,68,.15)',border:'1px solid rgba(239,68,68,.4)',borderRadius:'var(--radius-sm)',padding:'10px 14px',color:'var(--red)',fontSize:13,cursor:'pointer'}}>
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Résumé résultats */}
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {!csvResult && !csvLoading && (
              <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8,color:'var(--text3)'}}>
                <div style={{fontSize:36}}>🤖</div>
                <div style={{fontSize:12}}>Importez un CSV pour voir les prédictions</div>
              </div>
            )}
            {csvLoading && (
              <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8}}>
                <div style={{fontSize:36}}>⏳</div>
                <div style={{fontSize:12,color:'var(--text2)'}}>Analyse en cours...</div>
              </div>
            )}
            {csvResult && (
              <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {[
                    {label:'Lignes traitées', value: csvResult.total_rows, color:'var(--coffee)'},
                    {label:'Sauvegardées DB', value: csvResult.saved_to_db, color:'var(--green)'},
                    {label:'Total réel',     value: `${csvResult.total_real?.toFixed(2)} MAD`, color:'var(--amber)'},
                    {label:'Total prédit',   value: `${csvResult.total_predicted?.toFixed(2)} MAD`, color:'var(--purple)'},
                  ].map(m=>(
                    <div key={m.label} style={{background:'var(--surface2)',borderRadius:'var(--radius-sm)',padding:'10px 12px'}}>
                      <div style={{fontSize:10,color:'var(--text3)',marginBottom:3}}>{m.label}</div>
                      <div style={{fontSize:14,fontWeight:700,color:m.color}}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <button onClick={exportCsvResult}
                  style={{background:'rgba(16,185,129,.15)',border:'1px solid var(--green)',borderRadius:'var(--radius-sm)',padding:'9px',color:'var(--green)',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                  ⬇ Exporter les prédictions CSV
                </button>
                <div style={{maxHeight:160,overflowY:'auto',fontSize:11}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr>
                      {['Date','Café','Réel','Prédit'].map(h=><th key={h} style={{padding:'4px 8px',textAlign:'left',color:'var(--text3)',borderBottom:'1px solid var(--border)',fontSize:10}}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {csvResult.predictions?.slice(0,8).map((p,i)=>(
                        <tr key={i}>
                          <td style={{padding:'4px 8px',color:'var(--text2)'}}>{p.date?.slice(0,10)}</td>
                          <td style={{padding:'4px 8px',color:'var(--text)'}}>{p.coffee_name}</td>
                          <td style={{padding:'4px 8px',color:'var(--text2)'}}>{p.money} MAD</td>
                          <td style={{padding:'4px 8px',color:'var(--coffee)',fontWeight:600}}>{p.predicted_price} MAD</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvResult.predictions?.length > 8 && <div style={{textAlign:'center',color:'var(--text3)',padding:'4px',fontSize:10}}>+{csvResult.predictions.length-8} autres lignes (exportez le CSV)</div>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Formulaire */}
        <div style={card}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>🤖 Prédire le prix d'une vente</div>
          <form onSubmit={handlePredict} style={{display:'flex',flexDirection:'column',gap:14}}>
            <div>
              <label style={{fontSize:12,color:'var(--text2)',display:'block',marginBottom:6}}>Type de café</label>
              <select value={form.coffee_id} onChange={e=>setForm(p=>({...p,coffee_id:e.target.value}))}
                style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'9px 12px',color:'var(--text)',fontSize:13}}>
                {CAFES.map(c=><option key={c.id} value={c.id}>{c.name} — {c.prix} MAD</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,color:'var(--text2)',display:'block',marginBottom:6}}>Heure (6–22)</label>
              <input type="number" min={6} max={22} value={form.hour} onChange={e=>setForm(p=>({...p,hour:e.target.value}))}
                style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'9px 12px',color:'var(--text)',fontSize:13}}/>
            </div>
            <div>
              <label style={{fontSize:12,color:'var(--text2)',display:'block',marginBottom:6}}>Date</label>
              <input type="date" value={form.sale_date} onChange={e=>setForm(p=>({...p,sale_date:e.target.value}))}
                style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'9px 12px',color:'var(--text)',fontSize:13}}/>
            </div>
            <div>
              <label style={{fontSize:12,color:'var(--text2)',display:'block',marginBottom:6}}>Mode de paiement</label>
              <select value={form.payment_id} onChange={e=>setForm(p=>({...p,payment_id:e.target.value}))}
                style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'9px 12px',color:'var(--text)',fontSize:13}}>
                {PAYMENTS.map(p=><option key={p.id} value={p.id}>{p.type}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading}
              style={{background:'var(--coffee)',border:'none',borderRadius:'var(--radius-sm)',padding:'12px',color:'#1a1410',fontSize:14,fontWeight:700,opacity:loading?0.7:1}}>
              {loading ? '⏳ Prédiction en cours...' : '🤖 Prédire le prix'}
            </button>
          </form>

          {/* Résultat */}
          {result && (
            <div style={{marginTop:20,background:'var(--surface2)',border:'1px solid var(--coffee)',borderRadius:'var(--radius-sm)',padding:16}}>
              <div style={{fontSize:12,color:'var(--text3)',marginBottom:8}}>Résultat de la prédiction</div>
              <div style={{fontSize:28,fontWeight:700,color:'var(--coffee)',fontFamily:"'Space Grotesk',sans-serif"}}>{fmt(result.predicted_price)}</div>
              <div style={{fontSize:12,color:'var(--text2)',marginTop:6}}>
                ☕ {result.coffee_name} — {result.payment_type}<br/>
                🎯 Confiance : <strong style={{color:'var(--green)'}}>{(result.confidence*100).toFixed(0)}%</strong>
              </div>
            </div>
          )}
        </div>

        {/* Graphique session + historique */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={card}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>📈 Historique session</div>
            {sessionPreds.length === 0
              ? <div style={{height:160,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:13}}>Lancez une prédiction pour voir le graphique</div>
              : <div style={{position:'relative',height:160}}><canvas ref={canvasRef}/></div>
            }
          </div>

          <div style={card}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>📋 Prédictions récentes</div>
            {history.loading
              ? <div className="skeleton" style={{height:120,borderRadius:8}}/>
              : history.data?.slice(0,5).map(p => (
                <div key={p.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(61,45,30,0.3)'}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:500}}>{p.coffee}</div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>{p.date}</div>
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:'var(--coffee)',textAlign:'right'}}>{fmt(p.predicted)}</div>
                    <div style={{fontSize:10,color:'var(--green)',textAlign:'right'}}>{p.confidence ? `${(p.confidence*100).toFixed(0)}%` : '—'}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
