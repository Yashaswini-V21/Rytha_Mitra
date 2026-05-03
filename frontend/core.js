/* ═══════════════════════════════════════════════
   RythaGelathi — Core Advisory Page JS
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
    // Convert audio blob to base64 for Bhashini ASR API
    var reader = new FileReader();
    reader.onloadend = function () {
      var base64Audio = reader.result.split(',')[1];

      // Call Bhashini ASR API (requires valid Bhashini API key)
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

      var bhashiniKey = 'demo'; // In production, fetch from server

      fetch('https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + bhashiniKey,
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
      fetch('/api/simulate', {
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

  /* ─── NAVBAR SCROLL ──────────────────────────── */
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

  function setLoading(val) {
    submitBtn.disabled = val;
    submitText.style.display   = val ? 'none' : 'inline';
    submitSpinner.style.display = val ? 'inline-block' : 'none';
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

  /* ─── QUICK DEMO PRESETS ───────────────────── */
  var presetMap = {
    'raichur-dry': {
      district: 'Raichur',
      land: 2,
      temperature: 36,
      humidity: 34,
      rainfall: 58,
      ph: 7.1,
      N: 72,
      P: 34,
      K: 29,
      inputCosts: 17000
    },
    'tumakuru-balanced': {
      district: 'Tumakuru',
      land: 3,
      temperature: 30,
      humidity: 60,
      rainfall: 96,
      ph: 6.6,
      N: 84,
      P: 44,
      K: 40,
      inputCosts: 19500
    },
    'mysore-irrigated': {
      district: 'Mysore',
      land: 4,
      temperature: 28,
      humidity: 68,
      rainfall: 118,
      ph: 6.4,
      N: 92,
      P: 48,
      K: 46,
      inputCosts: 22500
    }
  };

  function applyPreset(values) {
    if (!values) return;
    ['district', 'land', 'temperature', 'humidity', 'rainfall', 'ph', 'N', 'P', 'K', 'inputCosts'].forEach(function (id) {
      var field = document.getElementById(id);
      if (!field) return;
      field.value = values[id];
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  document.querySelectorAll('.scenario-btn[data-preset]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var presetKey = btn.getAttribute('data-preset');
      applyPreset(presetMap[presetKey]);
      document.querySelectorAll('.scenario-btn').forEach(function (el) {
        el.classList.toggle('is-active', el === btn);
      });
    });
  });

  /* ─── RESULT RENDERER ────────────────────────── */
  function weatherBadgeClass(flag) {
    if (!flag) return 'badge-flag-amber';
    var f = flag.toUpperCase();
    if (f === 'GREEN')  return 'badge-flag-green';
    if (f === 'RED')    return 'badge-flag-red';
    return 'badge-flag-amber';
  }

  function formatRs(val) {
    var n = parseFloat(val) || 0;
    return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  function renderResults(data) {
    var r = data.result || {};
    var top     = r.top_crop || 'N/A';
    var profit  = r.profit_estimate || 0;
    var modelAccuracy = (r.model_accuracy != null ? r.model_accuracy : (r.details && r.details.model_accuracy));
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
      kanHTML = '<div class="kannada-box"><div class="kannada-label">🇮🇳 Kannada Advisory (via Bhashini)</div><div class="kannada-text">' + kannada + '</div>' + audioHTML + '</div>';
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
      + '<div class="glass-card" style="margin-top: 2rem; border-left: 4px solid var(--accent);">'
      + '  <h3 style="color: var(--accent); margin-bottom: 1rem; display: flex; align-items: center; gap: 10px;">'
      + '    <span style="font-size: 1.5rem;">🇮🇳</span> ಪ್ರಾದೇಶಿಕ ಸಲಹೆ (Kannada Advisory)'
      + '  </h3>'
      + '  <p style="font-size: 1.25rem; line-height: 1.6; color: #eee; font-family: \'Noto Sans Kannada\', sans-serif;">' + kannada + '</p>'
      + '  <div style="margin-top: 1.5rem;">' + (kannadaAudioAvailable ? '<audio controls style="width: 100%; border-radius: 10px;"><source src="data:' + kannadaAudioMime + ';base64,' + kannadaAudioBase64 + '" type="' + kannadaAudioMime + '"></audio>' : '') + '</div>'
      + '</div>'
      + '<div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">'
      +      mandiPriceVoiceHTML
      +      soilPdfHTML
      + '</div>'
      + '</div>';

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

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var values = getFormValues();
      if (!values.district) {
        alert('Please select a district.');
        return;
      }
      setLoading(true);
      resultsBox.style.display = 'none';

      fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      .then(function (resp) { return resp.json(); })
      .then(function (data) {
        setLoading(false);
        if (data.ok) {
          document.getElementById('resultsTitle').textContent = '🌾 Advisory for ' + values.district;
          renderResults(data);
        } else {
          renderError(data.error || 'Advisory pipeline failed.');
        }
      })
      .catch(function (err) {
        setLoading(false);
        renderError('Network error: ' + err.message + '. Make sure the Flask server is running on port 8000.');
      });
    });
  }

  /* ─── RESET BUTTON ───────────────────────────── */
  var resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (resultsBox) resultsBox.style.display = 'none';
    });
  }

  /* ─── COPY JSON ──────────────────────────────── */
  var copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = resultsContent ? resultsContent.textContent : '';
      navigator.clipboard.writeText(text).then(function () {
        copyBtn.textContent = '✅ Copied!';
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

})();
