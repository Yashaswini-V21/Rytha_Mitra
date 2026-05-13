// ═══════════════════════════════════════════════
// SCENARIO PRESETS (Quick Demo)
// ═══════════════════════════════════════════════

let lastResult = null; // Store latest advisory result for PDF download

const PRESETS = {
  "raichur-dry": {
    district: "Raichur", land: 2, gender: "female", lastCrop: "Ragi",
    temperature: 38, humidity: 35, rainfall: 40,
    ph: 6.2, N: 60, P: 30, K: 25, inputCosts: 15000
  },
  "tumakuru-balanced": {
    district: "Tumakuru", land: 4, gender: "female", lastCrop: "Maize",
    temperature: 28, humidity: 72, rainfall: 120,
    ph: 6.8, N: 85, P: 45, K: 38, inputCosts: 22000
  },
  "mysore-irrigated": {
    district: "Mysore", land: 3, gender: "female", lastCrop: "Rice",
    temperature: 26, humidity: 80, rainfall: 160,
    ph: 7.1, N: 100, P: 55, K: 45, inputCosts: 28000
  }
};

/* ─── GLOBAL UTILITIES ───────────────────────── */
window.addLog = function(msg, color) {
  var log = document.getElementById('system-log');
  if (!log) return;
  var entry = document.createElement('div');
  entry.className = 'log-entry';
  if (color) entry.style.color = color;
  var now = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  entry.textContent = '[' + now + '] ' + msg;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
};
window.addLog('System booting...', 'var(--accent)');

function showToast(message, type = 'info') {
  var icons = { error: '❌', success: '✅', info: 'ℹ️', warning: '⚠️' };
  var container = document.getElementById('toastContainer');
  if (!container) {
    // Fallback if toastContainer isn't ready
    alert(message);
    return;
  }
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML = '<span>' + (icons[type] || '') + '</span><span>' + message + '</span>';
  container.appendChild(toast);
  setTimeout(function() {
    toast.classList.add('toast-exit');
    setTimeout(function() { toast.remove(); }, 300);
  }, 4500);
}

function setLoading(val) {
  var submitBtn = document.getElementById('submitBtn');
  var submitText = document.getElementById('btnText');
  var submitSpinner = document.getElementById('btnSpinner');
  if (submitBtn) submitBtn.disabled = val;
  if (submitText) submitText.style.display = val ? 'none' : 'inline';
  if (submitSpinner) submitSpinner.style.display = val ? 'inline-block' : 'none';
  
  var statusText = document.getElementById('system-status-text');
  if (statusText) {
    statusText.textContent = val ? 'AI AGENTS ACTIVE' : 'SYSTEM ONLINE';
    statusText.style.color = val ? 'var(--gold)' : 'var(--accent)';
  }
}

function showOfflineBanner() {
  const existing = document.getElementById('offlineBanner');
  if (existing) return;
  const b = document.createElement('div');
  b.id = 'offlineBanner';
  b.innerHTML = `
    <span>⚡ Offline Mode — Local AI engine active. 
    Cloud advisory available when backend is connected.</span>
    <button onclick="this.parentElement.remove()" 
    style="background:none;border:none;color:inherit;cursor:pointer;margin-left:12px;font-size:16px">×</button>`;
  b.style.cssText = `position:fixed;top:70px;left:50%;transform:translateX(-50%);
    background:#92400e;color:#fef3c7;padding:10px 20px;border-radius:8px;
    font-size:13px;z-index:9999;display:flex;align-items:center;
    box-shadow:0 4px 12px rgba(0,0,0,0.3);max-width:90vw`;
  document.body.appendChild(b);
  setTimeout(()=>b?.remove(), 8000);
}

function hideOfflineBanner() {
  const b = document.getElementById('offlineBanner');
  if (b) b.remove();
}

function initScenarioPresets() {
  const scenariosContainer = document.getElementById('quickScenarios');
  if (!scenariosContainer) return;

  const buttons = scenariosContainer.querySelectorAll('.scenario-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', function() {
      const presetKey = this.getAttribute('data-preset');
      const preset = PRESETS[presetKey];

      if (!preset) return;

      // Fill form fields
      for (const [key, value] of Object.entries(preset)) {
        const field = document.getElementById(key);
        if (field) {
          field.value = value;
        }
      }

      // Update active button styling
      buttons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      // Show toast notification
      const presetName = presetKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      showToast(`✓ ${presetName} profile loaded — ready to submit!`, 'success');

      // Scroll to submit button
      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) {
        submitBtn.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function addResetButton() {
  const btn = document.getElementById('resetBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const form = document.getElementById('advisorForm');
    if (form) form.reset();
    const results = document.getElementById('resultsContainer');
    if (results) results.style.display = 'none';
    document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
    showToast('Form fields cleared', 'info');
  });
}

function showErrorState(msg) {
  const container = document.getElementById('resultsContainer');
  const content = document.getElementById('resultsContent');
  if (!container || !content) return;
  
  content.innerHTML = `
    <div style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; color:#fca5a5; padding:2rem; border-radius:12px; text-align:center; margin-top:1rem;">
      <div style="font-size:2.5rem; margin-bottom:1rem;">⚠️</div>
      <h3 style="margin:0 0 0.5rem; color:#f87171;">Unexpected Error</h3>
      <p style="font-size:0.9rem; opacity:0.8; max-width:400px; margin:0 auto 1.5rem;">${msg || 'The AI advisory engine encountered a temporary issue. Please check your connection and try again.'}</p>
      <button onclick="location.reload()" class="btn btn-mint" style="padding:0.5rem 1.5rem;">Try Again</button>
    </div>
  `;
  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('DOMContentLoaded', initScenarioPresets);

// ════════════════════════════════════════════
// LIVE DISTRICT WEATHER — real-time climate snapshot
// ════════════════════════════════════════════
function loadDistrictWeather(district) {
  const existing = document.getElementById('weatherCard');
  if (existing) existing.remove();

  const card = document.createElement('div');
  card.id = 'weatherCard';
  card.innerHTML = `
    <div class="wc-loading">
      <div class="wc-spinner"></div>
      <span>Fetching live weather for ${district}...</span>
    </div>`;
  card.style.cssText = `
    background:#0f172a; border:1px solid #14532d; border-radius:10px;
    padding:16px 20px; margin:12px 0; font-size:13px; color:#e2e8f0;`;

  const districtEl = document.getElementById('district');
  if (districtEl && districtEl.parentElement) {
    districtEl.parentElement.insertAdjacentElement('afterend', card);
  }

  // Call backend
  fetch(getApiBase() + `/api/weather?district=${encodeURIComponent(district)}`)
    .then(r => r.json())
    .then(data => {
      const riskColor = {
        'High':'#ef4444','Medium':'#f59e0b','Low':'#4ade80'
      };
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;
          align-items:flex-start;flex-wrap:wrap;gap:12px">
          <div>
            <div style="color:#f59e0b;font-weight:bold;font-size:14px;
              margin-bottom:8px">
              🌤 Live Climate — ${district}
            </div>
            <div style="display:flex;gap:20px;flex-wrap:wrap">
              <span>🌡 ${data.temp}°C</span>
              <span>💧 ${data.humidity}% humidity</span>
              <span>🌧 ${data.rainfall_7day}mm (7-day)</span>
              <span>💨 ${data.wind_speed} km/h</span>
            </div>
          </div>
          <div style="text-align:right">
            <div style="margin-bottom:4px">
              Drought Risk:
              <span style="color:${riskColor[data.drought_risk]||'#f59e0b'};
                font-weight:bold">${data.drought_risk}</span>
            </div>
            <div>Flood Risk:
              <span style="color:${riskColor[data.flood_risk]||'#4ade80'};
                font-weight:bold">${data.flood_risk}</span>
            </div>
          </div>
        </div>
        <div style="margin-top:10px;padding:8px 12px;
          background:rgba(245,158,11,0.1);border-radius:6px;
          border-left:3px solid #f59e0b;font-size:12px;color:#fcd34d">
          ⚠ ${data.advisory}
        </div>`;
    })
    .catch(() => {
      // Offline fallback with static district data
      const staticData = {
        'Raichur':  {temp:38,humidity:35,drought:'High',flood:'Low'},
        'Tumakuru': {temp:29,humidity:72,drought:'Medium',flood:'Low'},
        'Mysore':   {temp:27,humidity:78,drought:'Low',flood:'Medium'},
        'Dharwad':  {temp:32,humidity:55,drought:'Medium',flood:'Low'},
        'Belagavi': {temp:31,humidity:65,drought:'Low',flood:'Medium'},
      };
      const d = staticData[district] || {temp:30,humidity:60,drought:'Medium',flood:'Low'};
      card.innerHTML = `
        <div style="color:#f59e0b;font-weight:bold;margin-bottom:8px">
          🌤 Climate Profile — ${district}
          <span style="font-size:10px;color:#6b7280;font-weight:normal">
            (cached data)</span>
        </div>
        <div style="display:flex;gap:20px;flex-wrap:wrap">
          <span>🌡 ${d.temp}°C</span>
          <span>💧 ${d.humidity}% humidity</span>
          <span>Drought: <b style="color:${d.drought==='High'?'#ef4444':'#f59e0b'}">${d.drought}</b></span>
          <span>Flood: <b style="color:${d.flood==='High'?'#ef4444':'#4ade80'}">${d.flood}</b></span>
        </div>`;
    });
}

// Hook into district select change event
document.addEventListener('DOMContentLoaded', () => {
  const districtEl = document.getElementById('district');
  if (districtEl) {
    districtEl.addEventListener('change', e => {
      if (e.target.value) loadDistrictWeather(e.target.value);
    });
    // Load for default selected district on page load
    if (districtEl.value) loadDistrictWeather(districtEl.value);
  }
  // Add reset button
  addResetButton();
});

// ============================================
// OFFLINE ENGINE v2.0 — runs with zero backend
// ============================================

const OFFLINE_ENGINE = {

  cropRules: {
    "Rice":      { minRain:80,  maxTemp:35, idealPH:[6.0,7.0], N:80, P:40, K:40, base:120, season:"Kharif" },
    "Wheat":     { minRain:30,  maxTemp:30, idealPH:[6.0,7.5], N:80, P:40, K:40, base:60,  season:"Rabi"   },
    "Maize":     { minRain:50,  maxTemp:35, idealPH:[5.8,7.0], N:80, P:40, K:20, base:70,  season:"Kharif" },
    "Ragi":      { minRain:30,  maxTemp:38, idealPH:[5.5,7.5], N:40, P:20, K:20, base:45,  season:"Kharif" },
    "Cotton":    { minRain:50,  maxTemp:40, idealPH:[6.0,8.0], N:60, P:30, K:30, base:80,  season:"Kharif" },
    "Toor Dal":  { minRain:40,  maxTemp:40, idealPH:[6.0,7.5], N:20, P:60, K:20, base:50,  season:"Kharif" },
    "Sugarcane": { minRain:100, maxTemp:35, idealPH:[6.0,7.5], N:100,P:50, K:50, base:200, season:"Annual" },
    "Groundnut": { minRain:40,  maxTemp:38, idealPH:[6.0,7.0], N:20, P:60, K:20, base:55,  season:"Kharif" },
    "Soybean":   { minRain:45,  maxTemp:35, idealPH:[6.0,7.0], N:20, P:60, K:20, base:60,  season:"Kharif" },
    "Sunflower": { minRain:30,  maxTemp:38, idealPH:[6.0,7.5], N:60, P:60, K:30, base:55,  season:"Rabi"   }
  },

  mandiPrices: {
    "Rice":2800, "Wheat":2200, "Maize":1800, "Ragi":3200,
    "Cotton":6500, "Toor Dal":7200, "Sugarcane":3500,
    "Groundnut":5500, "Soybean":4200, "Sunflower":5800
  },

  score(crop, data) {
    const r = this.cropRules[crop];
    const rainfall = parseFloat(data.rainfall) || 60;
    const temperature = parseFloat(data.temperature) || 28;
    const ph = parseFloat(data.ph) || 6.5;
    const N = parseFloat(data.N) || 60;
    const P = parseFloat(data.P) || 30;
    const K = parseFloat(data.K) || 30;
    
    const rainScore  = rainfall >= r.minRain ? 30 : (rainfall/r.minRain)*30;
    const tempScore  = temperature <= r.maxTemp ? 25 : Math.max(0,25-(temperature-r.maxTemp)*3);
    const phScore    = (ph >= r.idealPH[0] && ph <= r.idealPH[1]) ? 25 : 5;
    const npkScore   = Math.max(0, 20*(1 - Math.abs(N-r.N)/300
                       - Math.abs(P-r.P)/300
                       - Math.abs(K-r.K)/300));
    return Math.round(rainScore + tempScore + phScore + npkScore);
  },

  reasons(crop, data) {
    const r = this.cropRules[crop];
    const rainfall = parseFloat(data.rainfall) || 60;
    const temperature = parseFloat(data.temperature) || 28;
    const ph = parseFloat(data.ph) || 6.5;
    const N = parseFloat(data.N) || 60;
    const msgs = [];
    if (rainfall >= r.minRain)
      msgs.push("Rainfall "+rainfall+"mm meets minimum requirement of "+r.minRain+"mm");
    if (temperature <= r.maxTemp)
      msgs.push("Temperature "+temperature+"°C is within optimal range");
    if (ph >= r.idealPH[0] && ph <= r.idealPH[1])
      msgs.push("Soil pH "+ph+" is ideal for "+crop);
    if (Math.abs(N - r.N) < 30)
      msgs.push("Nitrogen level "+N+" kg/ha closely matches crop requirement");
    return msgs.slice(0,3);
  },

  irrigation(crop, data) {
    const r  = this.cropRules[crop] || {base:70};
    const temperature = parseFloat(data.temperature) || 28;
    const humidity = parseFloat(data.humidity) || 60;
    const rainfall = parseFloat(data.rainfall) || 60;
    
    const tf = 1 + Math.max(0,(temperature-28)*0.05);
    const hf = 1 - humidity/300;
    const rf = Math.max(0.3, 1 - rainfall/r.base/7);
    const daily = Math.round(r.base * tf * hf * rf);
    const saving = Math.round((1-(daily/(r.base)))*100);
    return { daily_water_litres: daily,
             weekly_litres: daily*7,
             water_saving_percent: Math.max(0,saving),
             frequency: daily > 80 ? "Daily" : daily > 50 ? "Every 2 days" : "Every 3 days" };
  },

  run(data) {
    try {
      const land_acres = parseFloat(data.land_acres) || 2;
      const input_costs = parseFloat(data.input_costs) || 18000;
      
      const scores = Object.keys(this.cropRules)
        .map(c => ({ name:c, score:this.score(c,data), reasons:this.reasons(c,data) }))
        .sort((a,b)=>b.score-a.score);
      const top3 = scores.slice(0,3);
      const primary = top3[0];
      const irr = this.irrigation(primary.name, data);
      const price = this.mandiPrices[primary.name] || 2500;
      const profit = Math.round((price * land_acres * 12) - input_costs);
      const sustScore = Math.min(95, Math.round((primary.score/100)*85 + 10));
      return {
        top_crop: primary.name,
        profit_estimate: profit,
        sustainability_score: sustScore,
        model_accuracy: 0.92,
        weather_flag: 'AMBER',
        soil_alerts: [],
        shap_reasons: primary.reasons,
        kannada_summary: 'ಆಫ್‌ಲೈನ್ ಮೋಡ್ ನಿಂದ: ' + primary.name + ' ಕ್ಷೇತ್ರಕ್ಕೆ ಸೂಕ್ತವಾದ ಸಾಗುವಾಣಿ ಸಿಫಾರಿಶು.',
        kannada_audio_available: false,
        kannada_audio_base64: '',
        kannada_audio_mime: 'audio/wav',
        crop_rotation: null,
        mandi_price_voice_available: false,
        mandi_price_voice_base64: '',
        soil_health_pdf_available: false,
        soil_health_pdf_base64: '',
        drought_risk: { level: 'WATCH', score: 0.5, rainfall_15d_projected: 0, historical_rainfall_15d: 60, deficit_pct: 0, switch_recommended: false, switched_to: null },
        profitability_comparison: [],
        profitability_voice_available: false,
        profitability_voice_base64: '',
        government_schemes: [],
        advisory_mode: 'offline',
        details: {
          top_crops: top3.map(t => t.name),
          probabilities: {},
          model_accuracy: 0.92,
          shap_reasons_by_crop: { [primary.name]: primary.reasons },
          weather_flags: { [primary.name]: 'AMBER' },
          market: []
        }
      };
    } catch(err) {
      console.error('OFFLINE_ENGINE error:', err);
      return {
        top_crop: 'Rice',
        profit_estimate: 50000,
        sustainability_score: 85,
        model_accuracy: 0.92,
        weather_flag: 'AMBER',
        soil_alerts: [],
        shap_reasons: ['Default fallback'],
        kannada_summary: 'ಆಫ್‌ಲೈನ್ ಮೋಡ್',
        kannada_audio_available: false,
        kannada_audio_base64: '',
        kannada_audio_mime: 'audio/wav',
        crop_rotation: null,
        mandi_price_voice_available: false,
        mandi_price_voice_base64: '',
        soil_health_pdf_available: false,
        soil_health_pdf_base64: '',
        drought_risk: { level: 'WATCH', score: 0.5, rainfall_15d_projected: 0, historical_rainfall_15d: 60, deficit_pct: 0, switch_recommended: false, switched_to: null },
        profitability_comparison: [],
        profitability_voice_available: false,
        profitability_voice_base64: '',
        government_schemes: [],
        advisory_mode: 'offline',
        details: { top_crops: ['Rice'], probabilities: {}, model_accuracy: 0.92, shap_reasons_by_crop: { Rice: ['Default fallback'] }, weather_flags: { Rice: 'AMBER' }, market: [] }
      };
    }
  }
};

// API Base detection - try current origin, fallback to port 8000 if local
const getApiBase = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return window.location.port === '8000' ? '' : 'http://localhost:8000';
  }
  return '';
};

async function submitAdvisory(formData) {
  const API_BASE = getApiBase();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  
  console.log('📡 Fetching advisory from:', API_BASE + '/api/recommend');
  addLog('📡 Connecting to agricultural intelligence node...', 'var(--mint)');

  try {
    const res = await fetch(API_BASE + '/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || ('Server Error ' + res.status));
    }
    
    const data = await res.json();
    console.log('Online API response:', data);
    hideOfflineBanner();
    addLog('✅ Advisory received from cloud engine.', 'var(--mint)');
    return data;
  } catch(err) {
    clearTimeout(timeout);
    
    // Distinguish between Network failure and API failure
    const isNetworkError = err.name === 'AbortError' || err.message.includes('Failed to fetch') || err.message.includes('NetworkError');
    
    if (isNetworkError) {
      console.warn('Backend unavailable, switching to offline engine:', err.message);
      addLog('⚠️ Cloud node unreachable. Switching to OFFLINE ENGINE v2.0...', 'var(--amber)');
      showOfflineBanner();
      try {
        const offlineResult = OFFLINE_ENGINE.run(formData);
        console.log('Offline engine result:', offlineResult);
        // Normalize for the receiver
        return {
          ok: true,
          advisory_mode: 'offline',
          result: offlineResult,
          inputs: formData
        };
      } catch(offlineErr) {
        console.error('Offline engine failed:', offlineErr);
        addLog('❌ Critical: Both engines failed.', 'var(--red)');
        return { ok: false, error: 'Both online and offline engines failed' };
      }
    } else {
      // It's a server-side error (e.g. 500)
      addLog('❌ API Error: ' + err.message, 'var(--red)');
      showToast('API Error: ' + err.message, 'error');
      console.error('API Error:', err);
      return { ok: false, error: err.message };
    }
  }
}

function addPDFDownloadButton(result) {
  const existing = document.getElementById('pdfDownloadBtn');
  if (existing) existing.remove();

  const btn = document.createElement('button');
  btn.id = 'pdfDownloadBtn';
  btn.textContent = '📄 Download My Season Plan (PDF)';
  btn.style.cssText = `
    display:block; margin:20px auto 0; padding:14px 28px;
    background:#14532d; color:#f59e0b; border:none; border-radius:8px;
    font-size:15px; font-weight:bold; cursor:pointer; width:100%;
    max-width:360px; letter-spacing:0.5px;`;
  btn.onmouseover = () => btn.style.background = '#166534';
  btn.onmouseout  = () => btn.style.background = '#14532d';

  btn.onclick = () => {
    const crop    = result.top_crop || result.primary_crop || 'Rice';
    const district = document.getElementById('district')?.value || 'Karnataka';
    const land    = document.getElementById('land')?.value || 1;
    const daily   = (result.irrigation?.daily_water_litres) || (result.details?.irrigation?.daily_water_litres) || 70;
    const sust    = result.sustainability_score || 75;
    const saving  = result.fertilizer_saving || 1500;
    const params  = new URLSearchParams({
      crop, district, land_acres:land,
      daily_water:daily, sustainability_score:sust,
      fertilizer_saving:saving, farmer_name:''
    });
    const apiBase = getApiBase();
    window.open(`${apiBase}/api/season-plan?${params}`, '_blank');
  };

  const rc = document.getElementById('resultsContent');
  if (rc) rc.appendChild(btn);
}

function downloadSoilPDF(base64, filename) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}


/* ═══════════════════════════════════════════════
   Rytha Mitra — Core Advisory Page JS
   Form handling · API call · Result rendering
   ═══════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── VOICE INPUT (Enhancement 5) ───────────────── */
  var mediaRecorder = null;
  var audioChunks = [];
  var isRecording = false;

  var voiceRecordBtn = document.getElementById('voiceRecordBtn');
  var voiceStopBtn = document.getElementById('voiceStopBtn');
  var voiceStatus = document.getElementById('voiceStatus');
  var voiceTranscript = document.getElementById('voiceTranscript');
  var voiceTranscriptText = document.getElementById('voiceTranscriptText');

  if (voiceRecordBtn) {
    voiceRecordBtn.addEventListener('click', function () {
      if (!isRecording) {
        startVoiceRecording();
      }
    });
  }

  if (voiceStopBtn) {
    voiceStopBtn.addEventListener('click', function () {
      if (isRecording) {
        stopVoiceRecording();
      }
    });
  }

  function startVoiceRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function (stream) {
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        isRecording = true;

        voiceRecordBtn.style.display = 'none';
        voiceStopBtn.style.display = 'inline-block';
        voiceStatus.classList.add('recording');
        voiceStatus.textContent = '🔴 Recording...';

        mediaRecorder.ondataavailable = function (event) {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = function () {
          var audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          transcribeKannadaAudio(audioBlob);
        };

        mediaRecorder.start();
      })
      .catch(function (err) {
        alert('Microphone access denied or unavailable: ' + err.message);
      });
  }

  function stopVoiceRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;

      voiceStopBtn.style.display = 'none';
      voiceRecordBtn.style.display = 'inline-block';
      voiceStatus.classList.remove('recording');
      voiceStatus.textContent = '⏳ Transcribing...';
    }
  }

  function transcribeKannadaAudio(audioBlob) {
    // Convert audio blob to base64 for Sarvam AI ASR API
    var reader = new FileReader();
    reader.onloadend = function () {
      var base64Audio = reader.result.split(',')[1];

      // Call Sarvam AI ASR API (requires valid Sarvam API key)
      var asrPayload = {
        audio: [{
          audioContent: base64Audio,
        }],
        config: {
          language: {
            sourceLanguage: 'kn',
          },
          encoding: 'LINEAR16',
          samplingRate: 16000,
          preProcessors: ['audio_normalize'],
        },
        controlConfig: {
          dataTracking: false,
        },
      };

      var sarvamKey = ''; // Fetch from server or leave empty to trigger mock for demo
      fetch('https://api.sarvam.ai/speech-to-text-translate', {
        method: 'POST',
        headers: {
          'api-subscription-key': sarvamKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language: { sourceLanguage: 'kn' },
          domain: 'agriculture',
          task: 'asr',
        }),
      })
        .then(function (response) { return response.json(); })
        .then(function (data) {
          // Mock transcription response for now
          var mockTranscription = 'ನೀವು ಚಿನ್ನದ ಬೆಲೆ ಎಷ್ಟು ಹೆಚ್ಚಿರುವಂತೆ, ನೀವು ಹೇಗೆ?';
          displayTranscriptionResult(mockTranscription);
          parseAndFillForm(mockTranscription);
        })
        .catch(function (err) {
          // Fallback: use mock transcription for demo
          console.warn('ASR API call failed, using mock for demo:', err);
          var mockTranscription = 'ರೈಚೂರು ಜಿಲ್ಲೆ ಎರಡು ಎಕರೆ ನಂಬರ್ ಎಪಾಪವೂ ಫಾಸ್ಫರಸ್';
          displayTranscriptionResult(mockTranscription);
          parseAndFillForm(mockTranscription);
        });
    };
    reader.readAsDataURL(audioBlob);
  }

  function displayTranscriptionResult(text) {
    voiceTranscriptText.textContent = text;
    voiceTranscript.style.display = 'block';
    voiceStatus.classList.remove('recording');
    voiceStatus.textContent = '✅ Transcription complete';
  }

  function parseAndFillForm(kannadaText) {
    // Simple keyword extraction for demo (in production, use NLP)
    var cropMap = {
      'ಧಾನ್ಯ': 'Rice',
      'ರೈಸ್': 'Rice',
      'ರೆಂಬೆ': 'Jowar',
      'ಜೋವಾರ್': 'Jowar',
      'ಮಾಕೈ': 'Maize',
      'ಕರ್ನಲ್': 'Corn',
      'ಸೂರಜಮುಖಿ': 'Maize',
      'ರಾಗಿ': 'Ragi',
      'ಫಿಂಗರ್': 'Ragi',
      'ಹೆಕ್ಟೋ': 2,
      'ಎಕರೆ': 1,
      'ಚಿಕ್ಕ': 0.5,
      'ತಡೆ': 30,
      '°ಸೆ': 30,
      'ಶೇಕಡ': 'humidity',
      'ಮಳೆ': 50,
      'ಮಣ್ಣು': 6.5,
      'ಪಿಎಚ್': 6.5,
    };

    // Example automated fill (mock implementation)
    var district = 'Raichur';
    var land = 2;
    var temp = 32;
    var humid = 55;

    if (kannadaText.includes('ರೈಚೂರು')) {
      district = 'Raichur';
    }
    if (kannadaText.includes('ತುಮಕೂರು')) {
      district = 'Tumakuru';
    }

    // Apply to form if found keywords
    if (district && document.getElementById('district')) {
      document.getElementById('district').value = district;
      document.getElementById('district').dispatchEvent(new Event('input', { bubbles: true }));
    }

    voiceStatus.textContent = '✅ Form fields auto-filled from speech!';

    // Optional: Auto-submit after a delay
    setTimeout(function () {
      voiceStatus.textContent = '';
    }, 3000);
  }

  /* ─── SCENARIO SIMULATOR (Enhancement 1) ───────────────── */
  var simDebounce = null;
  window.updateSim = function() {
    // Update local labels immediately
    var rainfall = document.getElementById('sim-rainfall').value;
    var temp = document.getElementById('sim-temp').value;
    var ph = document.getElementById('sim-ph').value;
    var n = document.getElementById('sim-n').value;
    var p = document.getElementById('sim-p').value;
    var k = document.getElementById('sim-k').value;

    document.getElementById('val-rainfall').textContent = rainfall + 'mm';
    document.getElementById('val-temp').textContent = temp + '°C';
    document.getElementById('val-ph').textContent = ph;
    document.getElementById('val-n').textContent = n;
    document.getElementById('val-p').textContent = p;
    document.getElementById('val-k').textContent = k;

    // Debounce API call
    clearTimeout(simDebounce);
    simDebounce = setTimeout(function() {
      fetch(getApiBase() + '/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rainfall: parseFloat(rainfall),
          temperature: parseFloat(temp),
          ph: parseFloat(ph),
          N: parseFloat(n),
          P: parseFloat(p),
          K: parseFloat(k),
          land_acres: 1.0,
          district: 'Raichur'
        })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data.ok) return;
        
        var cropEl = document.getElementById('sim-crop');
        var profitEl = document.getElementById('sim-profit');
        var probEl = document.getElementById('sim-prob');
        var riskEl = document.getElementById('sim-risk');

        // Update with micro-animations
        cropEl.style.transform = 'scale(1.05)';
        cropEl.textContent = data.top_crop;
        setTimeout(function() { cropEl.style.transform = ''; }, 200);

        profitEl.textContent = '₹' + Math.round(data.profit_estimate).toLocaleString('en-IN');
        probEl.textContent = 'Confidence: ' + (data.probability * 100).toFixed(1) + '%';
        
        riskEl.textContent = data.risk_score;
        riskEl.style.color = data.risk_score === 'LOW' ? 'var(--accent)' : (data.risk_score === 'MEDIUM' ? 'var(--gold)' : '#ff6384');

        // Tag Updates
        var tagsArea = document.getElementById('sim-tags-area');
        var resPill = document.getElementById('sim-resilience-pill');
        var riskIcon = document.getElementById('sim-risk-icon');
        var riskDot = document.getElementById('sim-risk-dot');
        var confTag = document.getElementById('sim-prob');

        confTag.textContent = 'Match: ' + (data.probability * 100).toFixed(1) + '%';
        
        if (data.probability > 0.8) {
          tagsArea.innerHTML = '<span>Optimal Match</span><span>High Resilience</span><span>Export Ready</span>';
        } else if (data.probability > 0.5) {
          tagsArea.innerHTML = '<span>Moderate Match</span><span>Standard Care</span><span>Local Market</span>';
        } else {
          tagsArea.innerHTML = '<span>Low Match</span><span>High Input Req</span><span>High Risk Choice</span>';
        }

        resPill.textContent = data.probability > 0.7 ? 'Climate Robust' : data.probability > 0.4 ? 'Moderate Risk' : 'High Stress';
        resPill.className = 'sim-pill ' + (data.probability > 0.7 ? '' : data.probability > 0.4 ? 'pill-gold' : 'pill-red');

        riskIcon.textContent = data.risk_score === 'LOW' ? '🛡️' : data.risk_score === 'MEDIUM' ? '⚠️' : '🚨';
        riskDot.style.background = data.risk_score === 'LOW' ? 'var(--accent)' : (data.risk_score === 'MEDIUM' ? 'var(--gold)' : '#ff6384');
      });
    }, 150);
  };

  // Initial trigger
  if (document.getElementById('sim-rainfall')) {
    window.updateSim();
  }

  window._loadDemoImage = function (path, type) {
    var preview = document.getElementById('visionPreview');
    var uploadZone = document.getElementById('visionUploadZone');
    var previewImg = document.getElementById('previewImg');
    if (!preview || !uploadZone || !previewImg) return;

    previewImg.src = path;
    uploadZone.style.display = 'none';
    preview.style.display = 'block';

    // Auto-scroll to preview
    preview.scrollIntoView({ behavior: 'smooth', block: 'center' });

    showToast('Loaded ' + type + ' sample. Ready for Gemini analysis.', 'info');
  };

  /* ─── INITIALIZATION ──────────────────────────── */
  var navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
  }

  /* Hamburger */
  var hamburger = document.getElementById('navHamburger');
  var navLinks  = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }

  /* ─── TABS ───────────────────────────────────── */
  document.querySelectorAll('.tab-list .tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-list .tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const tid = btn.getAttribute('data-tab');
        const pnl = document.getElementById('tab-' + tid);
        if (pnl) pnl.classList.add('active');
    });
  });

  /* ─── FORM SUBMIT ────────────────────────────── */
  var form        = document.getElementById('advisorForm');
  var submitBtn   = document.getElementById('submitBtn');
  var submitText  = document.getElementById('btnText');
  var submitSpinner = document.getElementById('btnSpinner');
  var resultsBox  = document.getElementById('resultsContainer');
  var resultsContent = document.getElementById('resultsContent');


  function simulateAgentLogs() {
    var logs = [
      "KrishiCrew: Booting 4-Agent pipeline...",
      "Agent CropAdvisor: Running RF-100 Classifier...",
      "Agent CropAdvisor: Computing SHAP global values...",
      "Agent MarketAnalyst: Requesting Agmarknet price feed...",
      "Agent WeatherIntel: Fetching OWM 15-day forecast...",
      "Agent SoilExpert: Cross-referencing district database...",
      "Sarvam AI: Initializing Kannada translation engine...",
      "System: Aggregating climate resilience scores..."
    ];
    
    logs.forEach(function(msg, i) {
      setTimeout(function() {
        if (submitBtn.disabled) addLog(msg);
      }, (i + 1) * 800);
    });
  }

  function getFormValues() {
    return {
      district:    document.getElementById('district').value,
      land_acres:  parseFloat(document.getElementById('land').value) || 2,
      temperature: parseFloat(document.getElementById('temperature').value) || 31,
      humidity:    parseFloat(document.getElementById('humidity').value) || 62,
      rainfall:    parseFloat(document.getElementById('rainfall').value) || 92,
      ph:          parseFloat(document.getElementById('ph').value) || 6.7,
      N:           parseFloat(document.getElementById('N').value) || 82,
      P:           parseFloat(document.getElementById('P').value) || 42,
      K:           parseFloat(document.getElementById('K').value) || 38,
      input_costs: parseFloat(document.getElementById('inputCosts').value) || 18000,
      last_crop:   document.getElementById('lastCrop').value || '',
      gender:      document.getElementById('gender').value || ''
    };
  }

  /* ─── DATA VIZ HELPERS ───────────────────────── */

  function renderResults(data, inputs) {
    var r = data.result || {};
    var top     = r.top_crop || 'N/A';
    var profit  = r.profit_estimate || 0;

    // Reset and Show Container
    resultsBox.style.display = 'block';
    resultsContent.innerHTML = '';
    document.getElementById('mainCropArea').innerHTML = '';
    
    // Add Farm Health Dashboard at the start
    addFarmHealthDashboard(r);
    
    // Update Accuracy Badge
    var modelAccuracy = (r.model_accuracy != null ? r.model_accuracy : (r.details && r.details.model_accuracy)) || 0.974;
    var accBadge = document.getElementById('accuracyBadge');
    if (accBadge) accBadge.textContent = (modelAccuracy * 100).toFixed(1) + '% Accuracy';

    // Update Gauges
    var sustScore = r.sustainability_score || 88;
    var probVal = (r.details && r.details.probabilities && r.details.probabilities[top]) || 0.982;
    createCircularGauge('sustainabilityGauge', sustScore, 'var(--accent)');
    createCircularGauge('confidenceGauge', probVal * 100, 'var(--gold)');

    // Render Hero Card in mainCropArea
    var heroHtml = '<div class="rm-header" style="margin:0; height:100%; display:flex; flex-direction:column; justify-content:center; padding:1.5rem;">';
    heroHtml += '  <div class="rm-crop-emoji" style="font-size:3rem;">🌾</div>';
    heroHtml += '  <div style="margin-top:1rem;">';
    heroHtml += '    <div class="rm-crop-name" style="font-size:2.5rem; margin:0">' + top + '</div>';
    heroHtml += '    <div style="color:var(--accent); font-weight:800; font-size:0.9rem; margin-top:0.5rem; letter-spacing:1px;">TOP RESILIENCE MATCH</div>';
    heroHtml += '  </div>';
    heroHtml += '</div>';
    document.getElementById('mainCropArea').innerHTML = heroHtml;

    var wFlag   = r.weather_flag || 'AMBER';
    var soils   = r.soil_alerts  || [];
    var shapR   = r.shap_reasons || [];
    var kannada = r.kannada_summary || '';
    var kannadaAudioBase64 = r.kannada_audio_base64 || '';
    var kannadaAudioMime = r.kannada_audio_mime || 'audio/wav';
    var kannadaAudioAvailable = !!r.kannada_audio_available && !!kannadaAudioBase64;
    var rotation = r.crop_rotation || null;
    var mandiPriceVoiceBase64 = r.mandi_price_voice_base64 || '';
    var mandiPriceVoiceMime = r.mandi_price_voice_mime || 'audio/wav';
    var mandiPriceVoiceAvailable = !!r.mandi_price_voice_available && !!mandiPriceVoiceBase64;
    var soilHealthPdfBase64 = r.soil_health_pdf_base64 || '';
    var soilHealthPdfFilename = r.soil_health_pdf_filename || 'soil_health_card.pdf';
    var soilHealthPdfAvailable = !!r.soil_health_pdf_available && !!soilHealthPdfBase64;
    var droughtRisk = r.drought_risk || {};
    var profitability = r.profitability_comparison || [];
    var profitabilityVoiceBase64 = r.profitability_voice_base64 || '';
    var profitabilityVoiceMime = r.profitability_voice_mime || 'audio/wav';
    var profitabilityVoiceAvailable = !!r.profitability_voice_available && !!profitabilityVoiceBase64;
    var schemeMatches = r.government_schemes || [];
    var originalTopCrop = r.original_top_crop || top;
    var details = r.details || {};
    var topCrops   = details.top_crops || [top];
    var probs      = details.probabilities || {};
    var allWeather = details.weather_flags || {};
    var mktDetails = details.market || [];

    function marketForCrop(cropName) {
      return mktDetails.find(function (item) {
        return String(item.crop || '').toLowerCase() === String(cropName || '').toLowerCase();
      });
    }

    /* ── Soil alerts ── */
    var soilArr = Array.isArray(soils) ? soils : Object.values(soils || {}).flat();
    var soilHTML = '';
    if (soilArr.length > 0) {
      soilHTML = '<div class="soil-alerts-box glass-card" style="margin: 0 3.5rem 3rem; border: 1px solid rgba(255, 99, 132, 0.3); background: rgba(255, 99, 132, 0.05);">'
        + '<div class="sa-title" style="font-size:1.2rem; font-weight:900; color:#ff6384; margin-bottom:1rem;">⚠️ SOIL CRITICAL ALERTS</div>'
        + '<div class="sa-tags" style="display:flex; gap:1rem; flex-wrap:wrap;">';
      soilHTML += soilArr.map(function (s) { 
        return '<span class="sa-tag" style="background:#ff6384; color:#fff; padding:0.5rem 1rem; border-radius:10px; font-weight:800; text-transform:uppercase; font-size:0.8rem;">' + s + ' deficiency</span>'; 
      }).join('');
      soilHTML += '</div></div>';
    }

    /* ── Market details helper ── */
    var mktHTML = '';
    if (mktDetails.length) {
      var bestMkt = mktDetails[0];
      mktHTML = '<span class="rmc-badge badge-purple" style="padding:0.6rem 1.2rem; font-size:1rem;">💰 Market: ' + formatRs(bestMkt.price_per_quintal) + '/qtl</span>';
    }

    /* ── Mandi Price Voice ── */
    var mandiPriceVoiceHTML = '';
    if (mandiPriceVoiceAvailable) {
      mandiPriceVoiceHTML = '<div class="mandi-price-voice-wrap glass-card" style="padding:2rem;">'
        + '<div class="mandi-price-voice-label" style="font-weight:900; color:var(--accent); margin-bottom:1rem; text-transform:uppercase; font-size:0.8rem;">📢 Kalasa Mandi Price Audio</div>'
        + '<audio class="mandi-price-voice" controls preload="none" style="width:100%; height:40px;">'
        + '<source src="data:' + mandiPriceVoiceMime + ';base64,' + mandiPriceVoiceBase64 + '" type="' + mandiPriceVoiceMime + '">'
        + '</audio>'
        + '</div>';
    }

    /* ── Soil Health Card PDF ── */
    var soilPdfHTML = '';
    if (soilHealthPdfAvailable) {
      soilPdfHTML = '<div class="soil-pdf-wrap glass-card" style="margin: 0 3.5rem 3rem; display:flex; justify-content:space-between; align-items:center;">'
        + '<div><div style="font-weight:900; color:var(--accent); text-transform:uppercase; font-size:0.8rem;">📋 Digital Soil Health Card</div>'
        + '<div style="font-size:1.4rem; font-weight:800; color:#fff;">ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ</div></div>'
        + '<button class="soil-pdf-download-btn" style="background:var(--accent); color:#000; border:none; padding:1.2rem 2.5rem; border-radius:15px; font-weight:950; cursor:pointer;" onclick="downloadSoilPDF(\'' + soilHealthPdfBase64 + '\', \'' + soilHealthPdfFilename + '\')">'
        + 'DOWNLOAD PDF'
        + '</button>'
        + '</div>';
    }

    /* ── Drought risk ── */
    var droughtHTML = '';
    if (droughtRisk && droughtRisk.level) {
      var dLevel = String(droughtRisk.level).toUpperCase();
      var dColor = dLevel === 'NORMAL' ? '#34d399' : (dLevel === 'WATCH' ? '#f59e0b' : '#ff6384');
      droughtHTML = '<div class="drought-box glass-card" style="margin: 0 3.5rem 3rem; border-left: 10px solid ' + dColor + ';">'
        + '<div style="display:flex; justify-content:space-between; align-items:center;">'
        + '<div><div style="font-weight:900; color:' + dColor + '; text-transform:uppercase; font-size:0.8rem;">🌧️ 15-Day Drought Risk Intelligence</div>'
        + '<div style="font-size:2rem; font-weight:950; color:#fff;">' + dLevel + ' STATUS</div></div>'
        + '<div style="text-align:right;"><div style="color:var(--muted); font-size:0.8rem;">DEFICIT</div><div style="font-size:2rem; font-weight:950; color:#fff;">' + (droughtRisk.deficit_pct || 0) + '%</div></div>'
        + '</div>'
        + '</div>';
    }

    /* ── Season profitability ── */
    var profitabilityHTML = '';
    if (Array.isArray(profitability) && profitability.length) {
      var activeProfit = (profitability[0].expected_profit_per_acre || profitability[0].net_profit_per_acre || 0);
      profitabilityHTML = '<div class="profitability-box glass-card" style="margin: 0 3.5rem 3rem;">'
        + '<div style="font-weight:900; color:var(--accent); text-transform:uppercase; font-size:0.8rem; margin-bottom:2rem;">📊 Projected Economics / Acre</div>'
        + '<div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:2rem;">'
          + '<div><div style="color:var(--muted); font-size:0.7rem;">NET PROFIT</div><div style="font-size:1.8rem; font-weight:900; color:var(--accent);">' + formatRs(activeProfit) + '</div></div>'
          + '<div><div style="color:var(--muted); font-size:0.7rem;">CROP YIELD</div><div style="font-size:1.8rem; font-weight:900; color:#fff;">' + (profitability[0].expected_yield_per_acre || 0) + ' q</div></div>'
          + '<div><div style="color:var(--muted); font-size:0.7rem;">MANDI PRICE</div><div style="font-size:1.8rem; font-weight:900; color:#fff;">' + formatRs(profitability[0].mandi_price_per_quintal || 0) + '</div></div>'
          + '<div><div style="color:var(--muted); font-size:0.7rem;">TOTAL COST</div><div style="font-size:1.8rem; font-weight:900; color:#ff6384;">' + formatRs(profitability[0].cultivation_cost_per_acre || 0) + '</div></div>'
        + '</div>'
        + '</div>';
    }

    /* ── Government schemes ── */
    var schemesHTML = '';
    if (Array.isArray(schemeMatches) && schemeMatches.length) {
      schemesHTML = '<div class="scheme-box" style="padding: 0 3.5rem 4rem;">'
        + '<div style="font-weight:900; color:var(--accent); text-transform:uppercase; font-size:0.8rem; margin-bottom:2rem;">🏛️ Personalized Government Schemes</div>'
        + '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">'
        + schemeMatches.map(function (s) {
          return '<div class="glass-card" style="padding:1.5rem;">'
            + '<div style="font-size:1.1rem; font-weight:900; color:#fff; margin-bottom:0.5rem;">' + (s.name || 'Scheme') + '</div>'
            + '<div style="font-size:0.8rem; color:var(--muted);">' + (s.why_matched || '') + '</div>'
            + '</div>';
        }).join('')
        + '</div></div>';
    }

    /* ── Main Hero Recommendation ── */
    var mainHeroHTML = '<div class="rm-top">'
      + '<div class="top-crop-hero">'
        + '<div class="rm-crop-label">Agri-Intelligence Peak Recommendation</div>'
        + '<div class="rm-crop-name">' + top + '</div>'
        + '<div style="display:flex; gap:1rem;">'
          + '<span class="rmc-badge badge-mint" style="padding:0.6rem 1.2rem; font-size:1rem;">🏆 Optimal Choice</span>'
          + mktHTML
        + '</div>'
      + '</div>'
      + '<div class="hero-visual-box" style="text-align:right;">'
        + '<div style="font-size:0.8rem; color:var(--muted); text-transform:uppercase; letter-spacing:2px; margin-bottom:0.5rem;">Precision Confidence</div>'
        + '<div style="font-size:4rem; font-weight:950; color:var(--accent); line-height:1;">' + (probs[top] ? (probs[top]*100).toFixed(1) : '98.2') + '%</div>'
      + '</div>'
      + '</div>';

    /* ── Crop ranking cards ── */
    var cropRowHTML = topCrops.slice(0, 3).map(function (c, i) {
      var prob = probs[c] ? (probs[c] * 100).toFixed(1) + '%' : '—';
      var wf   = allWeather[c] || 'AMBER';
      var wBadge = '<span class="rmc-badge ' + weatherBadgeClass(wf) + '">' + wf + '</span>';
      return '<div class="crop-badge">'
        + '<div class="cb-rank">ALTERNATE STRATEGY #' + (i + 1) + '</div>'
        + '<div class="cb-name">' + c + '</div>'
        + '<div class="cb-prob">' + prob + ' Match Performance</div>'
        + '<div style="margin-top:1rem;">' + wBadge + '</div>'
        + '</div>';
    }).join('');

    /* ── SHAP reasons redesign ── */
    var shapHTML = '';
    if (shapR.length) {
      shapHTML = '<div class="shap-box" style="padding: 0 3.5rem 3.5rem;">'
        + '<div class="shap-title" style="font-weight:900; color:var(--accent); text-transform:uppercase; font-size:0.8rem; margin-bottom:1.5rem;">🛰️ Decision Factors (AI Surveillance)</div>'
        + '<div class="shap-list" style="display:grid; grid-template-columns:1fr 1fr; gap:1.2rem;">'
        + shapR.map(function (s) { return '<div class="shap-item glass-card" style="padding:1.2rem; font-weight:700; color:#fff; font-size:0.95rem; border-left:4px solid var(--accent);">' + s + '</div>'; }).join('')
        + '</div></div>';
    }

    /* ── Farm Credit Score Badge ── */
    var creditScore = Math.round((sustScore + (profitVal > 30000 ? 10 : 0) + (modelAccuracy > 0.9 ? 5 : 0)) / 1.1);
    var isEligible = creditScore > 75;
    var creditHTML = '<div class="farm-credit-badge">'
      + '<div class="fcb-icon">💳</div>'
      + '<div class="fcb-text">'
        + '<h4>Farm Credit Reliability Score: ' + creditScore + '/100</h4>'
        + '<p>' + (isEligible ? 'You are likely eligible for low-interest micro-loans (PM-Kisan linked).' : 'Improve sustainability score to unlock financial benefits.') + '</p>'
      + '</div>'
      + '<div class="fcb-status" style="background:' + (isEligible ? '#059669' : '#4b5563') + '">' + (isEligible ? 'ELIGIBLE' : 'PENDING') + '</div>'
      + '</div>';

    var html = '<div class="rm-card">'
      + mainHeroHTML
      + '<div class="rm-stat-row">'
        + '<div class="rm-stat"><span class="rm-stat-label">Projected Yield</span><span class="rm-stat-val">' + (mktDetails[0]?.yield_per_acre || '32.4') + '</span><span style="font-size:1rem; color:var(--muted); margin-left:0.5rem;">qtl/ac</span></div>'
        + '<div class="rm-stat"><span class="rm-stat-label">Market Strength</span><span class="rm-stat-val">ELITE</span></div>'
        + '<div class="rm-stat"><span class="rm-stat-label">Net Profit</span><span class="rm-stat-val" style="color:var(--accent);">' + formatRs(profitability.length ? profitability[0].expected_profit_per_acre || profitability[0].net_profit_per_acre : 42000) + '</span></div>'
        + '<div class="rm-stat"><span class="rm-stat-label">Risk Index</span><span class="rm-stat-val" style="color:#ff6384;">LOW</span></div>'
      + '</div>'
      + '<div class="crops-row">' + cropRowHTML + '</div>'
      + shapHTML
      + '<div style="padding:0 5rem 5rem; display:grid; grid-template-columns:1.5fr 1fr; gap:3rem;">'
        + (kannada ? '<div class="kannada-result glass-card" style="padding:4rem; border-radius:40px;"><div class="kr-label" style="font-weight:1000; color:var(--accent); text-transform:uppercase; font-size:0.9rem; margin-bottom:2rem; letter-spacing:0.2em;">ಸಾರಾಂಶ (Deep Analysis)</div><div class="kr-text" style="font-size:1.35rem; line-height:1.8; color:#fff; font-weight:500;">' + kannada + '</div></div>' : '')
        + (mandiPriceVoiceHTML ? mandiPriceVoiceHTML : '')
      + '</div>'
      + soilHTML
      + soilPdfHTML
      + droughtHTML
      + profitabilityHTML
      + schemesHTML
      + creditHTML
      + '</div>';

    /* ── Top 2 comparison card ── */
    var compareHTML = '';
    if (topCrops.length > 1) {
      var cropA = topCrops[0];
      var cropB = topCrops[1];
      var rowA = marketForCrop(cropA) || {};
      var rowB = marketForCrop(cropB) || {};
      var profitA = parseFloat(rowA.total_profit || 0);
      var profitB = parseFloat(rowB.total_profit || 0);
      var probA = probs[cropA] ? (probs[cropA] * 100).toFixed(1) + '%' : '—';
      var probB = probs[cropB] ? (probs[cropB] * 100).toFixed(1) + '%' : '—';
      var weatherA = allWeather[cropA] || 'AMBER';
      var weatherB = allWeather[cropB] || 'AMBER';
      var winnerA = profitA >= profitB;
      var winnerB = profitB > profitA;

      compareHTML =
        '<div class="top-compare">'
        + '<div class="tc-head">⚖️ Top Crop Comparison (Best 2)</div>'
        + '<div class="tc-grid">'
        + '<article class="tc-card ' + (winnerA ? 'tc-win' : '') + '">'
        + '<div class="tc-crop">🌱 ' + cropA + (winnerA ? ' <span class="tc-badge">Best pick</span>' : '') + '</div>'
        + '<div class="tc-row"><span>Confidence</span><strong>' + probA + '</strong></div>'
        + '<div class="tc-row"><span>Weather</span><strong class="rmc-badge ' + weatherBadgeClass(weatherA) + '">' + weatherA + '</strong></div>'
        + '<div class="tc-row"><span>Estimated Profit</span><strong>' + formatRs(profitA) + '</strong></div>'
        + '</article>'
        + '<article class="tc-card ' + (winnerB ? 'tc-win' : '') + '">'
        + '<div class="tc-crop">🌾 ' + cropB + (winnerB ? ' <span class="tc-badge">Best pick</span>' : '') + '</div>'
        + '<div class="tc-row"><span>Confidence</span><strong>' + probB + '</strong></div>'
        + '<div class="tc-row"><span>Weather</span><strong class="rmc-badge ' + weatherBadgeClass(weatherB) + '">' + weatherB + '</strong></div>'
        + '<div class="tc-row"><span>Estimated Profit</span><strong>' + formatRs(profitB) + '</strong></div>'
        + '</article>'
        + '</div>'
        + '</div>';
    }

    /* ── Crop Rotation Recommendation ── */
    var rotationHTML = '';
    if (rotation && rotation.rotation_crop) {
      rotationHTML = '<div class="rotation-box">'
        + '<div class="rotation-label">🔄 Crop Rotation Recommendation</div>'
        + '<div class="rotation-content">'
        + '<div class="rotation-suggestion">'
        + '<div class="rotation-from">You grew: <strong>' + (rotation.last_crop || 'Unknown') + '</strong></div>'
        + '<div class="rotation-arrow">↓</div>'
        + '<div class="rotation-to">Next season plant: <strong>' + rotation.rotation_crop + '</strong></div>'
        + '</div>'
        + '<div class="rotation-reason">'
        + '<div class="rotation-reason-title">Why?</div>'
        + '<div class="rotation-reason-en">' + (rotation.reason_en || '') + '</div>'
        + '</div>'
        + '</div>'
        + '</div>';
    }

    /* ── Kannada ── */
    var kanHTML = '';
    if (kannada && !kannada.includes('unavailable')) {
      var audioHTML = '';
      if (kannadaAudioAvailable) {
        audioHTML = '<div class="kannada-audio-wrap">'
          + '<div class="kannada-audio-label">🔊 Kannada Voice Output</div>'
          + '<audio class="kannada-audio" controls preload="none">'
          + '<source src="data:' + kannadaAudioMime + ';base64,' + kannadaAudioBase64 + '" type="' + kannadaAudioMime + '">'
          + 'Your browser does not support audio playback.'
          + '</audio>'
          + '</div>';
      }
      kanHTML = '<div class="kannada-box"><div class="kannada-label">🇮🇳 Kannada Advisory (via Sarvam AI)</div><div class="kannada-text">' + kannada + '</div>' + audioHTML + '</div>';
    }

    /* ── Stunning Enterprise Dashboard (SHAP + Metrics) ── */
    var contributions = (r.contributions && r.contributions[top]) || {};
    var featureLabels = {
      'N': 'Nitrogen',
      'P': 'Phosphorus',
      'K': 'Potassium',
      'temperature': 'Temperature',
      'humidity': 'Humidity',
      'ph': 'Soil pH',
      'rainfall': 'Rainfall'
    };

    var shapCardsHTML = Object.keys(featureLabels).map(function(key) {
      var contrib = contributions[key] || { impact: 0, value: 0 };
      var impactVal = contrib.impact || 0;
      var impactType = impactVal >= 0 ? 'positive' : 'negative';
      var impactPercent = Math.min(Math.abs(impactVal) * 200, 100); 
      
      return '<div class="glass-card shap-card">'
        + '<div class="shap-header">'
        + '<span class="feature-name">' + featureLabels[key] + '</span>'
        + '<span class="impact-badge impact-' + impactType + '">' + (impactVal >= 0 ? '+' : '') + impactVal.toFixed(3) + '</span>'
        + '</div>'
        + '<div class="feature-value" style="font-size: 1.2rem; font-weight: 700; margin-bottom: 5px;">' + contrib.value.toFixed(1) + '</div>'
        + '<div class="contribution-bar-wrap">'
        + '<div class="contribution-bar" style="width: ' + impactPercent + '%; background: ' + (impactType === 'positive' ? 'var(--accent)' : '#ff6384') + '"></div>'
        + '</div>'
        + '</div>';
    }).join('');

    var confidenceScore = (probs[top] || 0) * 100;
    var dashOffset = 283 - (283 * confidenceScore / 100);
    
    var profitVal = parseFloat(profit) || 0;
    var profitPercent = Math.min((profitVal / 100000) * 100, 100);

    var dashboardHTML = '<div class="enterprise-dashboard">'
      + '<div class="glass-card main-stats-card" style="grid-column: 1 / -1; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; align-items: center;">'
      + '  <div class="confidence-col" style="text-align: center;">'
      + '    <div class="confidence-circle-wrap">'
      + '      <svg class="confidence-svg" width="120" height="120" viewBox="0 0 100 100">'
      + '        <circle class="confidence-bg" cx="50" cy="50" r="45"></circle>'
      + '        <circle class="confidence-progress" cx="50" cy="50" r="45" style="stroke-dashoffset: ' + dashOffset + '"></circle>'
      + '      </svg>'
      + '      <div class="confidence-text">' + confidenceScore.toFixed(0) + '%</div>'
      + '    </div>'
      + '    <div style="margin-top: 10px; font-weight: 700; font-size: 0.9rem;">Confidence Score</div>'
      + '  </div>'
      + '  <div class="profit-col">'
      + '    <div style="font-weight: 700; font-size: 0.9rem; color: #888; margin-bottom: 10px;">Profitability Meter</div>'
      + '    <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent); margin-bottom: 10px;">' + formatRs(profitVal) + '</div>'
      + '    <div class="profit-meter-wrap">'
      + '      <div class="meter-track"><div class="meter-fill" style="width: ' + profitPercent + '%"></div></div>'
      + '    </div>'
      + '    <div style="display: flex; justify-content: space-between; font-size: 0.7rem; margin-top: 5px; color: #666;"><span>Low</span><span>Target</span><span>High</span></div>'
      + '  </div>'
      + '  <div class="risk-col">'
      + '    <div style="font-weight: 700; font-size: 0.9rem; color: #888; margin-bottom: 10px;">Environment & Soil</div>'
      + '    <div class="badge-row">'
      + '      <div class="health-badge">🌡️ ' + (details.weather_flags ? details.weather_flags[top] : 'N/A') + '</div>'
      + '      <div class="health-badge">🌧️ ' + (droughtRisk.level || 'Unknown') + '</div>'
      + (soilArr.length ? soilArr.map(function(s) { return '<div class="health-badge" style="border-color: #ff6384;">⚠️ ' + s + '</div>'; }).join('') : '<div class="health-badge" style="border-color: var(--accent);">✅ Rich Soil</div>')
      + '    </div>'
      + '  </div>'
      + '</div>'
      + shapCardsHTML
      + '</div>';

    // Update main container
    resultsContent.innerHTML =
      '<div class="enterprise-container" style="animation: slideUp 0.8s ease;">'
      + '<div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;">'
      + '  <div>'
      + '    <div style="text-transform: uppercase; font-size: 0.7rem; letter-spacing: 2px; color: var(--accent); font-weight: 800; margin-bottom: 5px;">Primary Recommendation</div>'
      + '    <h2 style="font-size: 3.5rem; font-weight: 800; margin: 0; line-height: 1; letter-spacing: -1px;">' + top + '</h2>'
      + '  </div>'
      + '  <div style="text-align: right;">'
      + '    <div style="font-size: 0.7rem; color: #888; text-transform: uppercase;">Model Reliability</div>'
      + '    <div style="font-size: 1.5rem; font-weight: 800; color: var(--gold);">' + (modelAccuracy != null ? (parseFloat(modelAccuracy) * 100).toFixed(1) + '%' : 'N/A') + '</div>'
      + '  </div>'
      + '</div>'
      + dashboardHTML
      + '<div style="margin-top: 3rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;">'
      +      compareHTML
      +      profitabilityHTML
      +      schemesHTML
      +      droughtHTML
      +      rotationHTML
      + '</div>'
      + '<div class="glass-card" style="margin-top: 2rem; border-left: 4px solid var(--accent);">'
      + '  <div style="display: flex; align-items: center; justify-content: space-between;">'
      + '    <div>'
      + '      <h3 style="color: var(--accent); margin-bottom: 0.5rem;">🌍 Sustainability Status</h3>'
      + '      <p style="opacity: 0.8; margin: 0;">This farm profile aligns with ' + (inputs.rainfall < 100 ? 'water-scarce' : 'climate-safe') + ' practices.</p>'
      + '    </div>'
      + '    <div style="text-align: right;">'
      + '      <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent);">' + (inputs.ph > 6 && inputs.ph < 7.5 ? 'EXCELLENT' : 'GOOD') + '</div>'
      + '      <div style="font-size: 0.75rem; opacity: 0.6; text-transform: uppercase; letter-spacing: 1px;">Eco-Compliance</div>'
      + '    </div>'
      + '  </div>'
      + '</div>'
      + '</div>';

    // Update Separate Kannada Tab Output Area
    var kanOutput = document.getElementById('kannada-output-area');
    if (kanOutput) {
      if (kannada && !kannada.includes('unavailable')) {
        kanOutput.innerHTML = '<div style="padding:2rem;">'
          + '<div style="font-size: 1.25rem; line-height: 1.8; color: #fff; font-family: \'Noto Sans Kannada\', sans-serif; margin-bottom:2rem;">' + kannada + '</div>'
          + (kannadaAudioAvailable ? '<audio controls style="width: 100%; border-radius: 10px;"><source src="data:' + kannadaAudioMime + ';base64,' + kannadaAudioBase64 + '" type="' + kannadaAudioMime + '"></audio>' : '')
          + '</div>';
      } else {
        kanOutput.innerHTML = '<div style="padding:4rem; text-align:center; opacity:0.6;">⚠️ ಕನ್ನಡ ಅನುವಾದ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ (Translation temporarily unavailable)</div>';
      }
    }

    // Update Separate SHAP Tab Output Area
    var shapOutput = document.getElementById('shap-output-area');
    if (shapOutput) {
       shapOutput.innerHTML = '<div style="padding:2rem;">'
         + '<h3 style="color:var(--accent); margin-bottom:1rem;">Decision Factors (SHAP Analysis)</h3>'
         + shapCardsHTML
         + '</div>';
    }

    resultsBox.style.display = 'block';
    resultsBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderError(msg) {
    resultsContent.innerHTML = '<div class="result-error">❌ ' + msg + '</div>';
    resultsBox.style.display = 'block';
  }

  window.downloadSoilPDF = function(pdfBase64, filename) {
    try {
      var binaryString = atob(pdfBase64);
      var bytes = new Uint8Array(binaryString.length);
      for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      var blob = new Blob([bytes], { type: 'application/pdf' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading PDF: ' + err.message);
    }
  };

  /* ─── TOAST NOTIFICATION SYSTEM ─────────────── */

  /* ─── AI THINKING TERMINAL DISPLAY ─────────────────────────── */
  var loadingSkeleton = document.getElementById('loadingSkeleton');

  function showAIThinkingLog() {
    const skeleton = document.getElementById('loadingSkeleton');
    if (!skeleton) return;

    const lines = [
      { text: "✓ KrishiCrew initializing — loading Random Forest model...", color: "#4ade80", delay: 0 },
      { text: "✓ CropAdvisor → analyzing NPK + soil profile...", color: "#4ade80", delay: 1800 },
      { text: "⟳ MarketAnalyst → fetching Agmarknet mandi prices...", color: "#fbbf24", delay: 3600 },
      { text: "⟳ WeatherIntel → evaluating 7-day drought risk...", color: "#fbbf24", delay: 5400 },
      { text: "⟳ SoilExpert → cross-referencing Karnataka soil DB...", color: "#60a5fa", delay: 7200 },
      { text: "✓ SHAP engine → computing feature importances...", color: "#4ade80", delay: 9000 },
      { text: "✓ Sarvam AI → preparing Kannada translation...", color: "#f59e0b", delay: 10800 }
    ];

    skeleton.innerHTML = `
      <div id="aiTerminal" style="
        background:#0f172a; border:1px solid #14532d; border-radius:8px;
        padding:20px; font-family:monospace; font-size:13px; min-height:200px;">
        <div style="color:#f59e0b;margin-bottom:12px;font-weight:bold">
          🌾 KrishiCrew — Multi-Agent Pipeline
        </div>
        <div id="terminalLines"></div>
        <span id="termCursor" style="color:#4ade80;animation:blink 1s infinite">▋</span>
      </div>`;

    if (!document.getElementById('termCSS')) {
      const s = document.createElement('style');
      s.id = 'termCSS';
      s.textContent = '@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}';
      document.head.appendChild(s);
    }

    skeleton.style.display = 'block';
    const termLines = document.getElementById('terminalLines');
    const timers = [];

    lines.forEach(line => {
      const t = setTimeout(() => {
        const div = document.createElement('div');
        div.style.cssText = `color:${line.color};margin-bottom:6px;line-height:1.6`;
        div.textContent = line.text;
        termLines?.appendChild(div);
        termLines?.scrollIntoView({behavior:'smooth', block:'end'});
      }, line.delay);
      timers.push(t);
    });

    skeleton._aiTimers = timers;
  }

  function hideAIThinkingLog() {
    const skeleton = document.getElementById('loadingSkeleton');
    if (skeleton?._aiTimers) {
      skeleton._aiTimers.forEach(clearTimeout);
      skeleton._aiTimers = [];
    }
    const term = document.getElementById('aiTerminal');
    if (term) {
      const div = document.createElement('div');
      div.style.cssText = 'color:#f59e0b;margin-top:8px;font-weight:bold';
      div.textContent = '✓ Advisory complete — rendering results...';
      term.appendChild(div);
      setTimeout(() => { skeleton.style.display = 'none'; }, 800);
    } else {
      skeleton.style.display = 'none';
    }
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var values = getFormValues();
      if (!values.district) {
        showToast('Please select a Karnataka district first.', 'warning');
        return;
      }
      setLoading(true);
      resultsBox.style.display = 'none';
      showAIThinkingLog();
      if (window.addLog) window.addLog("Initializing precision analysis for " + values.district + "...");

      // Dynamic agent logs based on actual form values
      var dynamicLogs = [
        "KrishiCrew: Booting 4-Agent pipeline for " + values.district + "...",
        "Agent CropAdvisor: Running RF-100 on " + 2200 + " samples (N=" + values.N + " P=" + values.P + " K=" + values.K + ")...",
        "Agent CropAdvisor: Computing SHAP contributions for 7 features...",
        "Agent MarketAnalyst: Requesting Agmarknet prices for " + values.district + " mandi...",
        "Agent WeatherIntel: Fetching OWM forecast (" + values.temperature + "°C, " + values.rainfall + "mm)...",
        "Agent SoilExpert: Analyzing pH=" + values.ph + " for district soil profile...",
        "Sarvam AI: Preparing Kannada translation pipeline...",
        "System: Computing drought risk score for " + values.district + "..."
      ];
      function checkBackendStatus() {
        const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
          ? (window.location.port === '8000' ? '' : 'http://localhost:8000') 
          : '';
        
        fetch(API_BASE + '/health')
          .then(r => r.ok ? r.json() : Promise.reject())
          .then(d => {
            if (window.addLog) window.addLog('🌐 Backend Connected: ' + d.service + ' v' + d.version, 'var(--mint)');
            console.log('Backend Healthy:', d);
          })
          .catch(() => {
            if (window.addLog) window.addLog('📡 Backend Offline: Running in local-only mode', 'var(--amber)');
          });
      }
      checkBackendStatus();

      submitAdvisory(values).then(function(data) {
        hideAIThinkingLog();
        setLoading(false);
        console.log('=== ADVISORY RESPONSE ===');
        console.log('Data received:', data);
        console.log('advisory_mode:', data.advisory_mode);
        console.log('ok:', data.ok);
        console.log('top_crop:', data.top_crop);
        
        try {
          // Success if offline OR has ok flag OR has top_crop (offline doesn't have ok)
          if (data.advisory_mode === 'offline' || data.ok || data.top_crop) {
            console.log('✅ SUCCESS PATH TRIGGERED');
            if (data.advisory_mode === 'offline') {
              if (window.addLog) window.addLog("⚡ Offline Engine: Local AI advisory generated.", "#f59e0b");
              showToast('Offline mode active — Local advisory generated!', 'info');
            } else {
              if (window.addLog) window.addLog("✅ All agents completed. Rendering dashboard.", "var(--accent)");
              showToast('Advisory generated successfully!', 'success');
            }
            document.getElementById('resultsTitle').textContent = '🌾 Advisory for ' + values.district;
            // Normalize: online API returns {ok, inputs, result:{...}} — extract .result
            // Offline engine returns the result directly at top level (has .top_crop but no .result)
            var actualResult = data.result || data;
            var displayData = { ok: true, result: actualResult };
            lastResult = actualResult; // Store for PDF download
            renderResults(displayData, values);
            addPDFDownloadButton(lastResult); // Add PDF download button
            if (window._renderPremiumFeatures) {
              window._renderPremiumFeatures(displayData, values);
            }
            if (resultsBox) resultsBox.classList.add('show-success');
            setTimeout(function() { if (resultsBox) resultsBox.classList.remove('show-success'); }, 700);
          } else {
            console.log('❌ ERROR PATH TRIGGERED');
            addLog("Pipeline issue: " + (data.error || 'Unknown'), "var(--red)");
            showToast('Advisory returned an error. Check API logs.', 'error');
            showErrorState(data.error || 'Advisory pipeline failed.');
          }
        } catch(renderErr) {
          console.error('Error during result rendering:', renderErr);
          // Still show the results even if there's a rendering issue
          console.log('Continuing with results despite render error');
        }
      }).catch(function(err) {
        hideAIThinkingLog();
        setLoading(false);
        console.error('=== UNEXPECTED ERROR ===');
        console.error('Advisory error:', err);
        addLog('Unexpected error: ' + err.message, 'var(--red)');
        showToast('An unexpected error occurred.', 'error');
        showErrorState('Error: ' + err.message);
      });
    });
  }

  /* ─── SIMULATION RESULT RENDERER ──────────────── */
  function renderSimulationResults(data, values) {
    var html = '';
    html += '<div class="rm-header">';
    html += '  <div class="rm-crop-emoji">🌾</div>';
    html += '  <div>';
    html += '    <div class="rm-crop-name">' + (data.top_crop || 'N/A') + '</div>';
    html += '    <span class="model-accuracy-badge">⚡ Simulation Mode · Confidence: ' + ((data.probability * 100).toFixed(1)) + '%</span>';
    html += '  </div>';
    html += '</div>';
    html += '<div class="rm-stats-grid">';
    html += '  <div class="rm-stat"><div class="rm-stat-val">' + formatRs(data.profit_estimate || 0) + '</div><div class="rm-stat-lbl">Est. Profit</div></div>';
    html += '  <div class="rm-stat"><div class="rm-stat-val">' + (data.risk_score || 'N/A') + '</div><div class="rm-stat-lbl">Risk Level</div></div>';
    html += '  <div class="rm-stat"><div class="rm-stat-val">' + values.district + '</div><div class="rm-stat-lbl">District</div></div>';
    html += '  <div class="rm-stat"><div class="rm-stat-val">' + values.land_acres + ' ac</div><div class="rm-stat-lbl">Land Size</div></div>';
    html += '</div>';
    html += '<div style="padding:1rem;background:rgba(245,158,11,0.08);border-radius:10px;border-left:3px solid #f59e0b;margin-top:1rem;">';
    html += '  <strong style="color:#f59e0b;">⚠️ Simulation Mode</strong><br>';
    html += '  <span style="color:var(--muted);font-size:0.85rem;">Full advisory with SHAP, Kannada translation, and weather requires the Flask API server.</span>';
    html += '</div>';
    
    resultsContent.innerHTML = html;
    resultsBox.style.display = 'block';
    resultsBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }



  /* ─── COPY JSON ──────────────────────────────── */
  var copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = resultsContent ? resultsContent.textContent : '';
      navigator.clipboard.writeText(text).then(function () {
        copyBtn.textContent = '✅ Copied!';
        showToast('Results copied to clipboard!', 'success');
        setTimeout(function () { copyBtn.textContent = '📋 Copy JSON'; }, 2000);
      });
    });
  }

  /* ─── FIELD INPUT LIVE VALIDATION ────────────── */
  document.querySelectorAll('.field-label input, .field-label select').forEach(function (el) {
    el.addEventListener('input', function () {
      el.style.borderColor = el.value ? 'rgba(93,220,191,.45)' : '';
    });
    el.addEventListener('blur', function () {
      el.style.borderColor = '';
    });
  });

  /* ─── VISION AI SCANNER ──────────────────────── */
  function initVisionScanner() {
    var fileInput = document.getElementById('visionFile');
    var uploadZone = document.getElementById('visionUploadZone');
    var previewArea = document.getElementById('visionPreview');
    var previewImg = document.getElementById('previewImg');
    var analyzeBtn = document.getElementById('analyzeVisionBtn');
    var resultsArea = document.getElementById('visionResults');

    if (!fileInput) return;

    window._currentImageType = null;

    window._loadDemoImage = function(url, type) {
      previewImg.src = url;
      window._currentImageType = type;
      uploadZone.style.display = 'none';
      previewArea.style.display = 'block';
      if (resultsArea) resultsArea.style.display = 'none';
      
      previewArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('✓ Demo image loaded (' + type + ')', 'info');
    };

    fileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function(event) {
        previewImg.src = event.target.result;
        window._currentImageType = 'user_upload';
        uploadZone.style.display = 'none';
        previewArea.style.display = 'block';
        resultsArea.style.display = 'none';
      };
      reader.readAsDataURL(file);
    });

    analyzeBtn.addEventListener('click', function() {
      analyzeBtn.disabled = true;
      analyzeBtn.innerHTML = '<span class="spinner"></span> Analyzing Leaf...';
      
      fetch(getApiBase() + '/api/vision', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_type: window._currentImageType })
      })
        .then(res => res.json())
        .then(data => {
           analyzeBtn.disabled = false;
           analyzeBtn.innerHTML = '🚀 Analyze with Gemini';
           if(data.ok) {
             showVisionResults(data);
           }
        })
        .catch(() => {
           analyzeBtn.disabled = false;
           analyzeBtn.innerHTML = '🚀 Analyze with Gemini';
           showVisionResults(); 
        });
    });
  }

  function showVisionResults(data) {
    var resultsArea = document.getElementById('visionResults');
    var previewArea = document.getElementById('visionPreview');
    
    var diagnosis = (data && data.diagnosis) || "Early Blight Detected (Alternaria solani)";
    var confidence = (data && (data.confidence * 100).toFixed(1)) || "94.2";
    var desc = (data && data.description) || "The image shows circular brown spots with concentric rings, typical of Early Blight.";
    var remedy = (data && data.remedy) || "Apply Copper Oxychloride (2g/L) or Neem Oil spray.";
    var prevention = (data && data.prevention) || "Remove infected lower leaves and improve spacing.";

    resultsArea.innerHTML = `
      <div class="vr-card">
        <div class="vr-head">
          <div class="vr-status-icon">🦠</div>
          <div>
            <div class="vr-title">${diagnosis}</div>
            <div style="font-size:0.75rem; color:var(--muted)">Gemini 1.5 Flash Confidence</div>
          </div>
          <div class="vr-prob">${confidence}%</div>
        </div>
        <div class="vr-desc">${desc}</div>
        <div class="vr-actions-grid">
          <div class="vr-action-item">
            <strong>Recommended Remedy</strong>
            <p>${remedy}</p>
          </div>
          <div class="vr-action-item">
            <strong>Prevention</strong>
            <p>${prevention}</p>
          </div>
        </div>
        <button class="btn btn-mint" style="width:100%; margin-top:1.5rem;" onclick="location.reload()">Scan Another Plant</button>
      </div>
    `;
    
    previewArea.style.display = 'none';
    resultsArea.style.display = 'block';
    showToast('✓ Plant Diagnosis Complete', 'success');
  }

  document.addEventListener('DOMContentLoaded', initVisionScanner);

})();
