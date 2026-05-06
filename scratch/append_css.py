css_to_append = """
/* ─── PREMIUM FEATURES STYLES ────────────────── */
.premium-share-bar {
  display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;
}
.prem-share-btn {
  padding: 0.8rem 1.5rem; border-radius: 12px; border: 1px solid var(--glass-border);
  background: var(--glass); backdrop-filter: var(--glass-blur); color: #fff;
  font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
  transition: all 0.3s ease; font-size: 0.85rem;
}
.prem-share-btn:hover { background: rgba(255,255,255,0.15); transform: translateY(-2px); }
.wa-btn:hover { border-color: #25D366; color: #25D366; }
.print-btn:hover { border-color: var(--accent); color: var(--accent); }

.premium-section { margin-bottom: 2rem; position: relative; }
.prem-section-head { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
.prem-section-icon { 
  font-size: 1.8rem; background: var(--mint-dim); width: 60px; height: 60px; 
  display: flex; align-items: center; justify-content: center; border-radius: 15px;
  border: 1px solid var(--border-mint);
}
.prem-section-title { font-size: 1.4rem; font-weight: 800; color: #fff; }
.prem-section-sub { font-size: 0.85rem; color: var(--muted); margin-top: 2px; }

/* Radar Chart */
.radar-chart-wrap { display: flex; align-items: center; justify-content: space-around; padding: 2rem; flex-wrap: wrap; gap: 2rem; }
.premium-radar-svg { width: 100%; max-width: 350px; height: auto; }
.radar-legend { display: flex; flex-direction: column; gap: 0.8rem; }
.radar-leg-item { font-size: 0.8rem; font-weight: 700; color: #aaa; display: flex; align-items: center; gap: 8px; }

/* Timeline */
.crop-timeline { display: flex; overflow-x: auto; padding: 2rem 0; gap: 0; scrollbar-width: none; }
.crop-timeline::-webkit-scrollbar { display: none; }
.timeline-stage { flex: 1; min-width: 140px; position: relative; text-align: center; }
.tl-connector { position: absolute; top: 25px; left: 50%; right: -50%; height: 2px; background: rgba(255,255,255,0.1); z-index: 1; }
.timeline-last .tl-connector { display: none; }
.tl-dot { 
  width: 50px; height: 50px; background: var(--surface); border: 2px solid var(--border-mint);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1rem; position: relative; z-index: 2; font-size: 1.2rem;
  transition: all 0.3s ease; box-shadow: 0 0 15px rgba(52,211,153,0.1);
}
.timeline-stage:hover .tl-dot { transform: scale(1.2); border-color: var(--accent); box-shadow: 0 0 25px rgba(52,211,153,0.3); }
.tl-name { font-size: 0.85rem; font-weight: 800; color: #fff; margin-bottom: 4px; }
.tl-month { font-size: 0.75rem; color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

/* Pest Risk */
.pest-severity { margin-left: auto; padding: 0.5rem 1rem; border-radius: 10px; font-weight: 800; font-size: 0.75rem; letter-spacing: 1px; }
.pest-content { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 0 1rem; margin-top: 1rem; }
.pest-col-title { font-size: 0.8rem; font-weight: 800; color: #888; text-transform: uppercase; margin-bottom: 1rem; letter-spacing: 1px; }
.pest-item { font-size: 0.95rem; color: #eee; margin-bottom: 0.6rem; font-weight: 500; }
.pest-organic { color: var(--accent); }
.pest-advice { margin-top: 2rem; padding: 1.2rem; background: rgba(255,255,255,0.03); border-radius: 12px; font-size: 0.9rem; font-style: italic; color: #ccc; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }

/* Carbon Footprint */
.carbon-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; }
.carbon-metric-card { 
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  padding: 1.5rem; border-radius: 20px; text-align: center; transition: all 0.3s ease;
}
.carbon-metric-card:hover { background: rgba(255,255,255,0.06); transform: translateY(-5px); }
.cm-icon { font-size: 1.8rem; margin-bottom: 0.8rem; }
.cm-value { font-size: 1.6rem; font-weight: 900; margin-bottom: 4px; }
.cm-label { font-size: 0.75rem; font-weight: 700; color: #888; text-transform: uppercase; margin-bottom: 12px; }
.cm-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }

/* Emergency Strip */
.emergency-strip { 
  background: linear-gradient(90deg, #991b1b, #7f1d1d); border-radius: 20px; 
  padding: 1.5rem 2rem; display: flex; align-items: center; gap: 1.5rem; color: #fff;
  box-shadow: 0 10px 30px rgba(153, 27, 27, 0.3);
}
.emergency-icon { font-size: 2rem; animation: shake 2s infinite; }
.emergency-text { font-size: 0.95rem; line-height: 1.6; }
.emergency-text strong { font-size: 1.1rem; color: #fecaca; }

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
  20%, 40%, 60%, 80% { transform: rotate(10deg); }
}

@media (max-width: 768px) {
  .pest-content { grid-template-columns: 1fr; }
  .prem-section-head { flex-direction: column; text-align: center; }
  .pest-severity { margin: 1rem auto 0; }
  .radar-chart-wrap { flex-direction: column; }
}
"""

with open(r"c:\Rytha_Gelathi\frontend\core.css", "a", encoding="utf-8") as f:
    f.write(css_to_append)

print("Appended premium CSS successfully.")
