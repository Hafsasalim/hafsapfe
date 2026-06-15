export const fmt  = (v,c='MAD') => v==null?'—':`${new Intl.NumberFormat('fr-MA',{maximumFractionDigits:2}).format(v)} ${c}`;
export const fmtN = v => v==null?'—':new Intl.NumberFormat('fr-MA').format(v);
export const trendIcon  = v => v>=0?'▲':'▼';
export const trendColor = v => v>=0?'var(--green)':'var(--red)';
export const CAT_COLORS = {
  Classique:'#3b82f6', Lait:'#8b5cf6', Chocolat:'#c8913a', Strong:'#f59e0b', default:'#94a3b8'
};
export const chartBase = {
  color:'#b89878', gridColor:'rgba(61,45,30,0.5)', fontFamily:'DM Sans'
};
