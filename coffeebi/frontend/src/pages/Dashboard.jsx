import React, { useRef, useEffect } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale,
         DoughnutController, ArcElement, BarController, BarElement, Filler, Tooltip, Legend } from 'chart.js';
import { useKPIs, useMonthlySales, useByCategory, useByPayment, useByHour, useTopProducts } from '../hooks/useData';
import { fmt, fmtN, CAT_COLORS } from '../utils/helpers';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale,
               DoughnutController, ArcElement, BarController, BarElement, Filler, Tooltip, Legend);

const card = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20, marginBottom:0 };
const kpiCard = (color) => ({ ...card, position:'relative', overflow:'hidden' });

function KPI({ label, value, icon, color, sub }) {
  return (
    <div style={{ ...card }}>
      <div style={{ width:36, height:36, borderRadius:8, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, color, fontFamily:"'Space Grotesk',sans-serif" }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function LineChart({ data, loading }) {
  const ref = useRef(); const ch = useRef();
  useEffect(() => {
    if (!data||loading) return;
    if (ch.current) ch.current.destroy();
    ch.current = new Chart(ref.current, {
      type:'line',
      data: { labels: data.map(d=>d.month?.slice(0,3)||d.month), datasets: [{
        label:'Revenus (MAD)', data: data.map(d=>d.revenue),
        borderColor:'#c8913a', backgroundColor:'rgba(200,145,58,0.15)',
        tension:.4, pointRadius:4, fill:true, pointBackgroundColor:'#c8913a'
      }]},
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#1a1410', borderColor:'#3d2d1e', borderWidth:1, titleColor:'#f5e6d0', bodyColor:'#b89878' } },
        scales: { x:{grid:{display:false},ticks:{color:'#b89878',font:{size:10}}}, y:{grid:{color:'rgba(61,45,30,0.4)'},ticks:{color:'#b89878',font:{size:10},callback:v=>v/1000+'k'}} }
      }
    });
    return () => { if(ch.current) ch.current.destroy(); };
  }, [data, loading]);
  return loading ? <div className="skeleton" style={{height:220,borderRadius:8}}/> : <div style={{position:'relative',height:220}}><canvas ref={ref}/></div>;
}

function DonutChart({ data, loading, title }) {
  const ref = useRef(); const ch = useRef();
  useEffect(() => {
    if (!data||loading) return;
    if (ch.current) ch.current.destroy();
    ch.current = new Chart(ref.current, {
      type:'doughnut',
      data: { labels: data.map(d=>d.name||d.type), datasets:[{
        data: data.map(d=>d.value||d.count||d.revenue),
        backgroundColor: data.map(d=>CAT_COLORS[d.name]||CAT_COLORS[d.type]||'#c8913a'),
        borderColor:'#1a1410', borderWidth:2, hoverOffset:6
      }]},
      options: { responsive:true, maintainAspectRatio:false, cutout:'65%',
        plugins:{ legend:{ position:'bottom', labels:{color:'#b89878',font:{size:10},padding:10,usePointStyle:true} },
          tooltip:{ backgroundColor:'#1a1410', borderColor:'#3d2d1e', borderWidth:1, titleColor:'#f5e6d0', bodyColor:'#b89878' } }
      }
    });
    return () => { if(ch.current) ch.current.destroy(); };
  }, [data, loading]);
  return loading ? <div className="skeleton" style={{height:200,borderRadius:8}}/> : <div style={{position:'relative',height:200}}><canvas ref={ref}/></div>;
}

function BarChart({ data, loading }) {
  const ref = useRef(); const ch = useRef();
  useEffect(() => {
    if (!data||loading) return;
    if (ch.current) ch.current.destroy();
    const filtered = data.filter(d=>d.hour>=6&&d.hour<=22);
    ch.current = new Chart(ref.current, {
      type:'bar',
      data: { labels: filtered.map(d=>`${d.hour}h`), datasets:[{
        label:'Ventes', data: filtered.map(d=>d.count),
        backgroundColor:'rgba(200,145,58,0.7)', borderRadius:4
      }]},
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#1a1410', borderColor:'#3d2d1e', borderWidth:1, titleColor:'#f5e6d0', bodyColor:'#b89878' } },
        scales: { x:{grid:{display:false},ticks:{color:'#b89878',font:{size:10}}}, y:{grid:{color:'rgba(61,45,30,0.4)'},ticks:{color:'#b89878',font:{size:10}}} }
      }
    });
    return () => { if(ch.current) ch.current.destroy(); };
  }, [data, loading]);
  return loading ? <div className="skeleton" style={{height:200,borderRadius:8}}/> : <div style={{position:'relative',height:200}}><canvas ref={ref}/></div>;
}

function cardHeader(title, badge) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
      <div style={{ fontSize:14, fontWeight:600 }}>{title}</div>
      {badge && <span style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:20, padding:'2px 10px', fontSize:10, color:'var(--text2)' }}>{badge}</span>}
    </div>
  );
}

export default function Dashboard() {
  const kpis     = useKPIs();
  const monthly  = useMonthlySales();
  const category = useByCategory();
  const payment  = useByPayment();
  const hourly   = useByHour();
  const products = useTopProducts();
  const k        = kpis.data;

  return (
    <div className="fade-in">
      {/* KPI Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        <KPI label="Chiffre d'affaires" value={fmt(k?.total_revenue)} icon="☕" color="var(--coffee)" sub="Total transactions" />
        <KPI label="Nombre de ventes"   value={fmtN(k?.total_sales)}  icon="🛒" color="var(--green)"  sub={`Panier moy : ${fmt(k?.avg_basket)}`} />
        <KPI label="Meilleur produit"   value={k?.best_product||'—'}  icon="⭐" color="var(--amber)"  sub={`Catégorie : ${k?.best_category||'—'}`} />
        <KPI label="Meilleur jour"      value={k?.best_day||'—'}      icon="📅" color="var(--purple)" sub="Jour le plus rentable" />
      </div>

      {/* Charts row 1 : line + donut catégorie */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr .65fr', gap:16, marginBottom:16 }}>
        <div style={card}>
          {cardHeader('Évolution mensuelle des ventes','2025')}
          <LineChart data={monthly.data} loading={monthly.loading} />
        </div>
        <div style={card}>
          {cardHeader('Ventes par catégorie')}
          <DonutChart data={category.data} loading={category.loading} />
        </div>
      </div>

      {/* Charts row 2 : bar heure + donut paiement */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr .65fr', gap:16, marginBottom:16 }}>
        <div style={card}>
          {cardHeader('Ventes par heure','6h–22h')}
          <BarChart data={hourly.data} loading={hourly.loading} />
        </div>
        <div style={card}>
          {cardHeader('Paiement Cash vs Card')}
          <DonutChart data={payment.data?.map(p=>({name:p.type==='cash'?'💵 Cash':'💳 Card',value:p.count,...p}))} loading={payment.loading} />
        </div>
      </div>

      {/* Top products */}
      <div style={card}>
        {cardHeader('Top 5 Produits — Chiffre d\'affaires')}
        {products.loading
          ? <div className="skeleton" style={{height:180,borderRadius:8}}/>
          : products.data?.map(p => (
            <div key={p.rank||p.name} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid rgba(61,45,30,0.3)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--coffee)', width:20 }}>#{p.rank}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500, marginBottom:3 }}>{p.name}</div>
                <div style={{ height:4, background:'var(--surface3)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:4, borderRadius:2, width:`${p.pct||50}%`, background:CAT_COLORS[p.category]||'var(--coffee)', transition:'width .4s' }} />
                </div>
              </div>
              <div style={{ fontSize:11, color:'var(--coffee)', fontWeight:600 }}>{fmt(p.revenue)}</div>
              <span style={{ fontSize:10, color:'var(--text3)', background:'var(--surface2)', padding:'2px 8px', borderRadius:20 }}>{p.category}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}
