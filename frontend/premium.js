/* ═══════════════════════════════════════════════════════════════
   RythaGelathi — Premium Differentiators
   Risk Radar · Crop Calendar · Pest AI · WhatsApp · Print · Carbon
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── CROP CALENDAR DATA ────────────────────── */
  var CROP_CALENDAR = {
    'Rice':       { emoji: '🍚', stages: [{n:'Land Prep',m:'May',i:'🚜'},{n:'Sowing',m:'Jun',i:'🌱'},{n:'Transplant',m:'Jul',i:'🌿'},{n:'Tillering',m:'Aug',i:'🌾'},{n:'Flowering',m:'Sep',i:'🌸'},{n:'Harvest',m:'Nov',i:'🪓'},{n:'Market',m:'Dec',i:'💰'}] },
    'Wheat':      { emoji: '🌾', stages: [{n:'Soil Prep',m:'Oct',i:'🚜'},{n:'Sowing',m:'Nov',i:'🌱'},{n:'Crown Root',m:'Dec',i:'🌿'},{n:'Tillering',m:'Jan',i:'🌾'},{n:'Heading',m:'Feb',i:'🌸'},{n:'Harvest',m:'Apr',i:'🪓'},{n:'Market',m:'May',i:'💰'}] },
    'Maize':      { emoji: '🌽', stages: [{n:'Bed Prep',m:'Jun',i:'🚜'},{n:'Sowing',m:'Jul',i:'🌱'},{n:'Vegetative',m:'Aug',i:'🌿'},{n:'Tasseling',m:'Sep',i:'🌸'},{n:'Grain Fill',m:'Oct',i:'🌾'},{n:'Harvest',m:'Nov',i:'🪓'},{n:'Market',m:'Dec',i:'💰'}] },
    'Ragi':       { emoji: '🌿', stages: [{n:'Nursery',m:'Jun',i:'🌱'},{n:'Transplant',m:'Jul',i:'🌿'},{n:'Vegetative',m:'Aug',i:'🌾'},{n:'Flowering',m:'Sep',i:'🌸'},{n:'Ripening',m:'Oct',i:'🟤'},{n:'Harvest',m:'Nov',i:'🪓'},{n:'Market',m:'Dec',i:'💰'}] },
    'Groundnut':  { emoji: '🥜', stages: [{n:'Soil Prep',m:'Jun',i:'🚜'},{n:'Sowing',m:'Jul',i:'🌱'},{n:'Pegging',m:'Aug',i:'🌿'},{n:'Pod Dev',m:'Sep',i:'🥜'},{n:'Maturity',m:'Oct',i:'🟤'},{n:'Harvest',m:'Nov',i:'🪓'},{n:'Market',m:'Dec',i:'💰'}] },
    'Jowar':      { emoji: '🌾', stages: [{n:'Field Prep',m:'Jun',i:'🚜'},{n:'Sowing',m:'Jul',i:'🌱'},{n:'Growth',m:'Aug',i:'🌿'},{n:'Flowering',m:'Sep',i:'🌸'},{n:'Grain Fill',m:'Oct',i:'🌾'},{n:'Harvest',m:'Nov',i:'🪓'},{n:'Market',m:'Dec',i:'💰'}] },
    'Cotton':     { emoji: '☁️', stages: [{n:'Prep',m:'May',i:'🚜'},{n:'Sowing',m:'Jun',i:'🌱'},{n:'Vegetative',m:'Jul-Aug',i:'🌿'},{n:'Squaring',m:'Sep',i:'🌸'},{n:'Boll Open',m:'Oct-Nov',i:'☁️'},{n:'Picking',m:'Dec',i:'🪓'},{n:'Market',m:'Jan',i:'💰'}] },
    'Sugarcane':  { emoji: '🎋', stages: [{n:'Planting',m:'Feb',i:'🌱'},{n:'Germination',m:'Mar',i:'🌿'},{n:'Tillering',m:'May',i:'🌾'},{n:'Grand Growth',m:'Jul-Sep',i:'🎋'},{n:'Maturity',m:'Nov-Jan',i:'🟤'},{n:'Harvest',m:'Feb',i:'🪓'},{n:'Mill',m:'Mar',i:'💰'}] },
    'Toor Dal':   { emoji: '🫘', stages: [{n:'Prep',m:'Jun',i:'🚜'},{n:'Sowing',m:'Jul',i:'🌱'},{n:'Growth',m:'Aug-Sep',i:'🌿'},{n:'Flowering',m:'Oct',i:'🌸'},{n:'Pod Fill',m:'Nov',i:'🫘'},{n:'Harvest',m:'Jan',i:'🪓'},{n:'Market',m:'Feb',i:'💰'}] },
    'Chickpea':   { emoji: '🫘', stages: [{n:'Prep',m:'Oct',i:'🚜'},{n:'Sowing',m:'Nov',i:'🌱'},{n:'Branching',m:'Dec',i:'🌿'},{n:'Flowering',m:'Jan',i:'🌸'},{n:'Pod Fill',m:'Feb',i:'🫘'},{n:'Harvest',m:'Mar',i:'🪓'},{n:'Market',m:'Apr',i:'💰'}] },
  };

  /* ─── CARBON FOOTPRINT DATA (kg CO₂/acre/season) ─── */
  var CROP_CARBON = {
    'Rice':       { co2: 3.2, water: 5000, rating: 'High',     color: '#ff6384' },
    'Wheat':      { co2: 1.8, water: 2800, rating: 'Medium',   color: '#f59e0b' },
    'Maize':      { co2: 1.4, water: 2200, rating: 'Medium',   color: '#f59e0b' },
    'Ragi':       { co2: 0.6, water: 1200, rating: 'Very Low', color: '#34d399' },
    'Groundnut':  { co2: 0.9, water: 1800, rating: 'Low',      color: '#34d399' },
    'Jowar':      { co2: 0.8, water: 1500, rating: 'Low',      color: '#34d399' },
    'Cotton':     { co2: 2.5, water: 4200, rating: 'High',     color: '#ff6384' },
    'Sugarcane':  { co2: 4.5, water: 8000, rating: 'Very High',color: '#ef4444' },
    'Toor Dal':   { co2: 0.4, water: 1000, rating: 'Very Low', color: '#10b981' },
    'Chickpea':   { co2: 0.5, water: 900,  rating: 'Very Low', color: '#10b981' },
  };

  /* ─── PEST RISK ENGINE ──────────────────────── */
  var PEST_DATABASE = {
    'Rice':      { pests: ['Stem Borer','Brown Planthopper','Blast'], organic: ['Neem oil spray','Trichogramma release','Pseudomonas fluorescens'] },
    'Wheat':     { pests: ['Aphids','Rust','Termites'],              organic: ['Ladybug release','Trichoderma','Neem cake'] },
    'Maize':     { pests: ['Fall Armyworm','Stem Borer','Aphids'],   organic: ['Pheromone traps','Bt spray','Neem oil'] },
    'Ragi':      { pests: ['Shoot fly','Aphids','Blast'],            organic: ['Yellow sticky traps','Neem extract','Crop rotation'] },
    'Groundnut': { pests: ['White Grub','Thrips','Tikka disease'],   organic: ['Metarhizium','Neem oil','Trichoderma'] },
    'Jowar':     { pests: ['Shoot fly','Stem Borer','Midge'],        organic: ['Early sowing','Fish meal traps','Neem seed kernel'] },
    'Cotton':    { pests: ['Bollworm','Whitefly','Jassids'],         organic: ['Bt cotton variety','Yellow traps','Neem oil'] },
    'Sugarcane': { pests: ['Early Shoot Borer','Pyrilla','Red Rot'], organic: ['Trichogramma','Light traps','Resistant varieties'] },
    'Toor Dal':  { pests: ['Pod Borer','Pod Fly','Wilt'],            organic: ['HaNPV spray','Neem extract','Trichoderma'] },
    'Chickpea':  { pests: ['Pod Borer','Wilt','Collar Rot'],        organic: ['HaNPV spray','Trichoderma','Crop rotation'] },
  };

  function computePestRisk(temp, humidity, crop) {
    var score = 0;
    if (temp > 30) score += Math.min((temp - 30) * 4, 40);
    if (humidity > 65) score += Math.min((humidity - 65) * 2.5, 35);
    if (temp > 28 && humidity > 70) score += 25; // compound risk
    score = Math.min(100, Math.round(score));
    var level, color, icon, advice;
    if (score > 65) { level = 'HIGH'; color = '#ff6384'; icon = '🔴'; advice = 'Immediate organic intervention recommended. Scout fields daily.'; }
    else if (score > 35) { level = 'MODERATE'; color = '#f59e0b'; icon = '🟡'; advice = 'Weekly scouting advised. Preventive neem spray recommended.'; }
    else { level = 'LOW'; color = '#34d399'; icon = '🟢'; advice = 'Conditions unfavorable for major pests. Continue monitoring.'; }
    var db = PEST_DATABASE[crop] || PEST_DATABASE['Rice'];
    return { score: score, level: level, color: color, icon: icon, advice: advice, pests: db.pests, organic: db.organic };
  }

  /* ─── SVG RADAR CHART BUILDER ────────────────── */
  function buildRadarSVG(scores) {
    var size = 300, cx = size / 2, cy = size / 2, maxR = 105;
    var keys = Object.keys(scores);
    var labels = { weather: '🌦️ Weather', soil: '🪨 Soil', market: '💰 Market', drought: '🌧️ Drought', confidence: '🤖 AI Confidence' };
    var n = keys.length;
    var svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" class="premium-radar-svg">';
    // Grid rings
    [0.33, 0.66, 1.0].forEach(function (lv) {
      var pts = [];
      for (var i = 0; i < n; i++) {
        var a = (Math.PI * 2 * i) / n - Math.PI / 2;
        pts.push(Math.round(cx + maxR * lv * Math.cos(a)) + ',' + Math.round(cy + maxR * lv * Math.sin(a)));
      }
      svg += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>';
    });
    // Axis lines + labels
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i) / n - Math.PI / 2;
      var x2 = cx + maxR * Math.cos(a), y2 = cy + maxR * Math.sin(a);
      svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + Math.round(x2) + '" y2="' + Math.round(y2) + '" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>';
      var lx = cx + (maxR + 30) * Math.cos(a), ly = cy + (maxR + 30) * Math.sin(a);
      svg += '<text x="' + Math.round(lx) + '" y="' + Math.round(ly) + '" text-anchor="middle" dominant-baseline="middle" fill="#aaa" font-size="10" font-weight="600">' + (labels[keys[i]] || keys[i]) + '</text>';
    }
    // Data polygon with glow
    var dp = [];
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i) / n - Math.PI / 2;
      var v = Math.max(0, Math.min(100, scores[keys[i]])) / 100;
      dp.push(Math.round(cx + maxR * v * Math.cos(a)) + ',' + Math.round(cy + maxR * v * Math.sin(a)));
    }
    svg += '<polygon points="' + dp.join(' ') + '" fill="rgba(52,211,153,0.15)" stroke="#34d399" stroke-width="2.5" style="filter:drop-shadow(0 0 8px rgba(52,211,153,0.4))"/>';
    // Data dots + values
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i) / n - Math.PI / 2;
      var v = Math.max(0, Math.min(100, scores[keys[i]])) / 100;
      var px = cx + maxR * v * Math.cos(a), py = cy + maxR * v * Math.sin(a);
      svg += '<circle cx="' + Math.round(px) + '" cy="' + Math.round(py) + '" r="5" fill="#34d399" stroke="#050d0a" stroke-width="2"/>';
      var tx = cx + (maxR * v + 14) * Math.cos(a), ty = cy + (maxR * v + 14) * Math.sin(a);
      svg += '<text x="' + Math.round(tx) + '" y="' + Math.round(ty) + '" text-anchor="middle" dominant-baseline="middle" fill="#5ddcbf" font-size="11" font-weight="800">' + scores[keys[i]] + '</text>';
    }
    // Center score
    var avg = Math.round(keys.reduce(function (s, k) { return s + scores[k]; }, 0) / n);
    svg += '<text x="' + cx + '" y="' + (cy - 6) + '" text-anchor="middle" fill="#fff" font-size="22" font-weight="900">' + avg + '</text>';
    svg += '<text x="' + cx + '" y="' + (cy + 12) + '" text-anchor="middle" fill="#888" font-size="9" font-weight="700">FARM SCORE</text>';
    svg += '</svg>';
    return svg;
  }

  /* ─── WHATSAPP SHARE ─────────────────────────── */
  window.shareWhatsApp = function (topCrop, profit, district, weatherFlag) {
    var text = '🌾 *RythaGelathi Advisory* 🌾\n\n'
      + '📍 District: ' + district + '\n'
      + '🌱 Best Crop: *' + topCrop + '*\n'
      + '💰 Expected Profit: ₹' + Math.round(profit).toLocaleString('en-IN') + '\n'
      + '🌦️ Weather: ' + weatherFlag + '\n\n'
      + '🤖 Powered by AI (CrewAI + SHAP)\n'
      + '🇮🇳 ಕನ್ನಡ ವರದಿ ಲಭ್ಯವಿದೆ\n\n'
      + '→ rythagelathi.com';
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  };

  /* ─── PRINT REPORT ───────────────────────────── */
  window.printAdvisory = function () {
    window.print();
  };

  /* ─── PREMIUM RENDER HOOK ────────────────────── */
  window._renderPremiumFeatures = function (resultData, formInputs) {
    var container = document.getElementById('premiumFeaturesArea');
    if (!container) return;

    var r = resultData || {};
    var inputs = formInputs || {};
    var topCrop = r.top_crop || 'Rice';
    var profit = r.profit_estimate || 0;
    var wFlag = r.weather_flag || 'AMBER';
    var district = inputs.district || 'Karnataka';
    var temp = parseFloat(inputs.temperature) || 30;
    var humidity = parseFloat(inputs.humidity) || 60;
    var droughtLevel = (r.drought_risk && r.drought_risk.level) || 'WATCH';
    var soilAlerts = r.soil_alerts || [];
    var probs = (r.details && r.details.probabilities) || {};
    var topProb = probs[topCrop] || 0.85;

    // Compute radar scores
    var weatherScore = wFlag === 'GREEN' ? 92 : (wFlag === 'AMBER' ? 62 : 28);
    var soilScore = Array.isArray(soilAlerts) ? Math.max(20, 95 - soilAlerts.length * 25) : 75;
    var marketScore = Math.min(95, Math.max(20, Math.round(profit / 800)));
    var droughtScore = droughtLevel === 'NORMAL' ? 92 : (droughtLevel === 'WATCH' ? 68 : (droughtLevel === 'WARNING' ? 38 : 15));
    var confidenceScore = Math.round(topProb * 100);

    var html = '';

    // ─── 1. SHARE ACTIONS BAR ──────────────────
    html += '<div class="premium-share-bar">'
      + '<button class="prem-share-btn wa-btn" onclick="shareWhatsApp(\'' + topCrop + '\',' + profit + ',\'' + district + '\',\'' + wFlag + '\')">'
      + '<span>📱</span> Share via WhatsApp</button>'
      + '<button class="prem-share-btn print-btn" onclick="printAdvisory()">'
      + '<span>🖨️</span> Print Report</button>'
      + '<button class="prem-share-btn copy2-btn" onclick="navigator.clipboard.writeText(document.getElementById(\'resultsContent\').innerText).then(function(){alert(\'Copied!\')})">'
      + '<span>📋</span> Copy Text</button>'
      + '</div>';

    // ─── 2. RISK RADAR CHART ───────────────────
    html += '<div class="premium-section glass-card">'
      + '<div class="prem-section-head">'
      + '<div class="prem-section-icon">🎯</div>'
      + '<div><div class="prem-section-title">Farm Risk Intelligence Radar</div>'
      + '<div class="prem-section-sub">Multi-dimensional risk assessment across 5 critical factors</div></div>'
      + '</div>'
      + '<div class="radar-chart-wrap">'
      + buildRadarSVG({ weather: weatherScore, soil: soilScore, market: marketScore, drought: droughtScore, confidence: confidenceScore })
      + '<div class="radar-legend">'
      + '<div class="radar-leg-item"><span style="color:#34d399">●</span> 80+ Excellent</div>'
      + '<div class="radar-leg-item"><span style="color:#f59e0b">●</span> 50-79 Moderate</div>'
      + '<div class="radar-leg-item"><span style="color:#ff6384">●</span> <50 At Risk</div>'
      + '</div></div></div>';

    // ─── 3. CROP GROWTH CALENDAR ───────────────
    var cal = CROP_CALENDAR[topCrop] || CROP_CALENDAR['Rice'];
    html += '<div class="premium-section glass-card">'
      + '<div class="prem-section-head">'
      + '<div class="prem-section-icon">📅</div>'
      + '<div><div class="prem-section-title">' + topCrop + ' Growth Calendar</div>'
      + '<div class="prem-section-sub">Complete lifecycle from field preparation to market · ' + cal.stages.length + ' stages</div></div>'
      + '</div>'
      + '<div class="crop-timeline">';
    cal.stages.forEach(function (s, idx) {
      var isLast = idx === cal.stages.length - 1;
      html += '<div class="timeline-stage' + (isLast ? ' timeline-last' : '') + '">'
        + '<div class="tl-connector"></div>'
        + '<div class="tl-dot">' + s.i + '</div>'
        + '<div class="tl-content">'
        + '<div class="tl-name">' + s.n + '</div>'
        + '<div class="tl-month">' + s.m + '</div>'
        + '</div></div>';
    });
    html += '</div></div>';

    // ─── 4. PEST RISK ALERT ────────────────────
    var pest = computePestRisk(temp, humidity, topCrop);
    html += '<div class="premium-section glass-card" style="border-left: 4px solid ' + pest.color + ';">'
      + '<div class="prem-section-head">'
      + '<div class="prem-section-icon">🐛</div>'
      + '<div><div class="prem-section-title">Pest Risk Intelligence</div>'
      + '<div class="prem-section-sub">AI prediction based on temperature (' + temp + '°C) and humidity (' + humidity + '%) patterns</div></div>'
      + '<div class="pest-severity" style="background:' + pest.color + '20;color:' + pest.color + ';border:1px solid ' + pest.color + '40">'
      + pest.icon + ' ' + pest.level + ' RISK (' + pest.score + '/100)</div>'
      + '</div>'
      + '<div class="pest-content">'
      + '<div class="pest-col"><div class="pest-col-title">⚠️ Likely Pests for ' + topCrop + '</div>';
    pest.pests.forEach(function (p) {
      html += '<div class="pest-item">• ' + p + '</div>';
    });
    html += '</div><div class="pest-col"><div class="pest-col-title">🌿 Organic Interventions</div>';
    pest.organic.forEach(function (o) {
      html += '<div class="pest-item pest-organic">✅ ' + o + '</div>';
    });
    html += '</div></div>'
      + '<div class="pest-advice">' + pest.advice + '</div>'
      + '</div>';

    // ─── 5. CARBON & WATER FOOTPRINT ───────────
    var carbon = CROP_CARBON[topCrop] || { co2: 1.5, water: 2000, rating: 'Medium', color: '#f59e0b' };
    var landAcres = parseFloat(inputs.land_acres) || 2;
    var totalCO2 = (carbon.co2 * landAcres).toFixed(1);
    var totalWater = Math.round(carbon.water * landAcres).toLocaleString('en-IN');
    var treesEquiv = Math.round(carbon.co2 * landAcres / 21.77 * 100) / 100; // 1 tree absorbs ~21.77 kg CO₂/year

    html += '<div class="premium-section glass-card">'
      + '<div class="prem-section-head">'
      + '<div class="prem-section-icon">🌍</div>'
      + '<div><div class="prem-section-title">Environmental Impact Assessment</div>'
      + '<div class="prem-section-sub">Carbon footprint, water usage, and ecological impact for ' + landAcres + ' acres of ' + topCrop + '</div></div>'
      + '</div>'
      + '<div class="carbon-metrics">'
      + '<div class="carbon-metric-card">'
      + '<div class="cm-icon">💨</div>'
      + '<div class="cm-value" style="color:' + carbon.color + '">' + totalCO2 + ' kg</div>'
      + '<div class="cm-label">CO₂ per Season</div>'
      + '<div class="cm-badge" style="background:' + carbon.color + '20;color:' + carbon.color + '">' + carbon.rating + '</div>'
      + '</div>'
      + '<div class="carbon-metric-card">'
      + '<div class="cm-icon">💧</div>'
      + '<div class="cm-value" style="color:#38bdf8">' + totalWater + ' L</div>'
      + '<div class="cm-label">Water per Season</div>'
      + '<div class="cm-badge" style="background:rgba(56,189,248,0.15);color:#38bdf8">' + (carbon.water > 3000 ? 'High' : carbon.water > 1500 ? 'Medium' : 'Low') + '</div>'
      + '</div>'
      + '<div class="carbon-metric-card">'
      + '<div class="cm-icon">🌳</div>'
      + '<div class="cm-value" style="color:#34d399">' + treesEquiv + '</div>'
      + '<div class="cm-label">Trees to Offset</div>'
      + '<div class="cm-badge" style="background:rgba(52,211,153,0.15);color:#34d399">Annual</div>'
      + '</div>'
      + '<div class="carbon-metric-card">'
      + '<div class="cm-icon">🏆</div>'
      + '<div class="cm-value" style="color:#a78bfa">' + (carbon.co2 < 1 ? 'A+' : carbon.co2 < 2 ? 'A' : carbon.co2 < 3 ? 'B' : 'C') + '</div>'
      + '<div class="cm-label">Eco Grade</div>'
      + '<div class="cm-badge" style="background:rgba(167,139,250,0.15);color:#a78bfa">SDG 13</div>'
      + '</div>'
      + '</div></div>';

    // ─── 6. EMERGENCY HELPLINE ─────────────────
    html += '<div class="premium-section emergency-strip">'
      + '<div class="emergency-icon">📞</div>'
      + '<div class="emergency-text">'
      + '<strong>Kisan Call Center: 1800-180-1551</strong> (Toll-Free, 24×7) · '
      + '<strong>Karnataka Helpline: 1800-425-1553</strong> · '
      + 'ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ'
      + '</div></div>';

    container.innerHTML = html;
    container.style.display = 'block';

    // Animate contribution bars
    setTimeout(function () {
      container.querySelectorAll('.contribution-bar').forEach(function (bar) {
        bar.style.width = bar.getAttribute('data-width') || bar.style.width;
      });
    }, 200);
  };

})();
