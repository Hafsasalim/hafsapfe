import api from './api';

/* ── Mock fallback (si FastAPI indisponible) ─────────────────────────────── */
const MOCK_KPIS = {
  total_revenue: 24817.00, total_sales: 1600, avg_basket: 15.51,
  best_day: "Vendredi", best_product: "Mocha", best_category: "Chocolat"
};
const MOCK_MONTHLY = [
  {month:"January",revenue:2100,count:140},{month:"February",revenue:1980,count:132},
  {month:"March",revenue:2300,count:150},{month:"April",revenue:2150,count:143},
  {month:"May",revenue:2400,count:160},{month:"June",revenue:2250,count:148},
  {month:"July",revenue:2050,count:136},{month:"August",revenue:2180,count:145},
  {month:"September",revenue:2310,count:155},{month:"October",revenue:2190,count:146},
  {month:"November",revenue:2280,count:152},{month:"December",revenue:2620,count:175},
];
const MOCK_CATEGORIES = [
  {name:"Classique",value:8200,count:540,pct:33,color:"#3b82f6"},
  {name:"Lait",value:7100,count:470,pct:28,color:"#8b5cf6"},
  {name:"Chocolat",value:5600,count:370,pct:22,color:"#c8913a"},
  {name:"Strong",value:3900,count:220,pct:17,color:"#f59e0b"},
];
const MOCK_PAYMENT = [
  {type:"cash",count:860,revenue:13200,pct:53.8},
  {type:"card",count:740,revenue:11600,pct:46.2},
];
const MOCK_HOURLY = Array.from({length:16},(_,i)=>({
  hour:i+6, count:Math.floor(20+Math.random()*80),
  revenue:Math.floor(300+Math.random()*1200)
}));
const MOCK_PRODUCTS = [
  {rank:1,name:"Mocha",category:"Chocolat",base_price:22,revenue:5600,count:255,pct:100},
  {rank:2,name:"Latte",category:"Lait",base_price:20,revenue:4800,count:240,pct:86},
  {rank:3,name:"Cappuccino",category:"Lait",base_price:18,revenue:4200,count:233,pct:75},
  {rank:4,name:"Americano",category:"Classique",base_price:15,revenue:3600,count:240,pct:64},
  {rank:5,name:"Espresso",category:"Classique",base_price:12,revenue:2900,count:242,pct:52},
];
const MOCK_SALES = {total:1600,page:1,pages:160,data:[
  {sale_id:65,date:"2025-12-06",hour:20,amount:15,time_of_day:"Evening",month:"December",coffee:"Americano",category:"Classique",payment:"card"},
  {sale_id:66,date:"2025-12-11",hour:21,amount:22,time_of_day:"Evening",month:"December",coffee:"Mocha",category:"Chocolat",payment:"cash"},
  {sale_id:67,date:"2025-11-13",hour:14,amount:12,time_of_day:"Afternoon",month:"November",coffee:"Espresso",category:"Classique",payment:"card"},
  {sale_id:68,date:"2025-10-15",hour:15,amount:15,time_of_day:"Afternoon",month:"October",coffee:"Americano",category:"Classique",payment:"card"},
  {sale_id:69,date:"2025-11-02",hour:9,amount:20,time_of_day:"Morning",month:"November",coffee:"Latte",category:"Lait",payment:"cash"},
]};
const MOCK_PREDICTIONS = [
  {id:8,date:"2025-07-01",predicted:12.5,confidence:0.92,coffee:"Espresso"},
  {id:9,date:"2025-07-01",predicted:18.5,confidence:0.88,coffee:"Cappuccino"},
  {id:10,date:"2025-07-01",predicted:20.5,confidence:0.90,coffee:"Latte"},
];

const delay = (ms=300) => new Promise(r=>setTimeout(r,ms));

export const coffeeService = {
  async getKPIs() {
    try { const {data}=await api.get('/dashboard/kpis'); return data; }
    catch { await delay(); return MOCK_KPIS; }
  },
  async getMonthlySales() {
    try { const {data}=await api.get('/dashboard/monthly'); return data; }
    catch { await delay(); return MOCK_MONTHLY; }
  },
  async getByCategory() {
    try { const {data}=await api.get('/dashboard/by-category'); return data; }
    catch { await delay(); return MOCK_CATEGORIES; }
  },
  async getByPayment() {
    try { const {data}=await api.get('/dashboard/by-payment'); return data; }
    catch { await delay(); return MOCK_PAYMENT; }
  },
  async getByHour() {
    try { const {data}=await api.get('/dashboard/by-hour'); return data; }
    catch { await delay(); return MOCK_HOURLY; }
  },
  async getTopProducts(limit=5) {
    try { const {data}=await api.get(`/dashboard/top-products?limit=${limit}`); return data; }
    catch { await delay(); return MOCK_PRODUCTS; }
  },
  async getSales(page=1,filters={}) {
    try {
      const params=new URLSearchParams({page,...filters}).toString();
      const {data}=await api.get(`/sales/?${params}`); return data;
    } catch { await delay(); return MOCK_SALES; }
  },
  async predict(payload) {
    try { const {data}=await api.post('/predictions/predict',payload); return data; }
    catch {
      await delay(600);
      return { predicted_price:15.5+Math.random()*5, confidence:0.87+Math.random()*0.1, coffee_name:'Café', payment_type:'cash' };
    }
  },
  async getPredictionHistory() {
    try { const {data}=await api.get('/predictions/history'); return data; }
    catch { await delay(); return MOCK_PREDICTIONS; }
  },
  async getProducts() {
    try { const {data}=await api.get('/products/'); return data; }
    catch { await delay(); return MOCK_PRODUCTS.map(p=>({id:p.rank,name:p.name,category:p.category,base_price:p.base_price,sales_count:p.count,total_revenue:p.revenue})); }
  },
  async getCafes() {
    try { const {data}=await api.get('/products/'); return data; }
    catch { await delay(); return [{id:15,name:"Espresso",categorie:"Classique",prix_base:12},{id:16,name:"Cappuccino",categorie:"Lait",prix_base:18},{id:17,name:"Latte",categorie:"Lait",prix_base:20},{id:18,name:"Americano",categorie:"Classique",prix_base:15},{id:19,name:"Mocha",categorie:"Chocolat",prix_base:22}]; }
  },
  async getClients() {
    try { const {data}=await api.get('/clients/'); return data; }
    catch { await delay(); return [{id:10,code:"ANON-0000-0001",orders:12,spent:185},{id:11,code:"ANON-0000-0002",orders:8,spent:132}]; }
  },
  async getReports() {
    try { const {data}=await api.get('/reports/'); return data; }
    catch { await delay(); return [{id:5,period:"June",total_sales:2313.50,created_at:"2026-06-13",notes:"Monthly report"}]; }
  },
  async generateReport(period,notes='') {
    try { const {data}=await api.post('/reports/generate',{period,notes}); return data; }
    catch { await delay(); return {id:99,period,total_sales:2000,created_at:new Date().toISOString()}; }
  },
};
