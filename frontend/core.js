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
  var tabs   = document.querySelectorAll('.tab[data-tab]');
  var panels = document.querySelectorAll('.tab-panel[id]');

  function activateTab(targetId) {
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === targetId);
    });
    panels.forEach(function (p) {
      p.classList.toggle('active', p.id === 'tab-' + targetId);
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activateTab(tab.getAttribute('data-tab'));
    });
  });

  document.querySelectorAll('.js-tab-link[data-target]').forEach(function (link) {
    link.addEventListener('click', function () {
      activateTab(link.getAttribute('data-target'));
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

    /* ── Crop ranking cards ── */
    var cropRowHTML = topCrops.slice(0, 3).map(function (c, i) {
      var prob = probs[c] ? (probs[c] * 100).toFixed(1) + '%' : '—';
      var wf   = allWeather[c] || 'AMBER';
      var wBadge = '<span class="rmc-badge ' + weatherBadgeClass(wf) + '">' + wf + '</span>';
      return '<div class="rc-crop">'
        + '<div class="rc-rank">#' + (i + 1) + (i === 0 ? ' · Best Pick' : '') + '</div>'
        + '<div class="rc-name">' + c + '</div>'
        + '<div class="rc-prob">' + prob + ' match ' + wBadge + '</div>'
        + '</div>';
    }).join('');

    /* ── SHAP reasons list ── */
    var shapHTML = '';
    if (shapR.length) {
      shapHTML = '<div class="shap-reasons">'
        + '<div class="shap-title">🔍 SHAP — Why ' + top + ' was recommended</div>'
        + '<div class="shap-list">'
        + shapR.map(function (r) { return '<div class="shap-item">' + r + '</div>'; }).join('')
        + '</div></div>';
    }

    /* ── Soil alerts ── */
    var soilArr = Array.isArray(soils) ? soils : Object.values(soils || {}).flat();
    var soilHTML = '<div class="soil-alerts-box"><div class="sa-title">🪨 Soil Alerts</div><div class="sa-tags">';
    if (soilArr.length === 0 || (soilArr.length === 1 && soilArr[0].toLowerCase().includes('no major'))) {
      soilHTML += '<span class="sa-tag sa-ok">✅ No major NPK deficiency</span>';
    } else {
      soilHTML += soilArr.map(function (s) { return '<span class="sa-tag">⚠️ ' + s + ' deficiency</span>'; }).join('');
    }
    soilHTML += '</div></div>';

    /* ── Market details ── */
    var mktHTML = '';
    if (mktDetails.length) {
      var bestMkt = mktDetails[0];
      mktHTML = '<div class="rmc-badge badge-purple" style="margin-top:.4rem;display:inline-flex">💰 ' + bestMkt.crop + ' · ' + formatRs(bestMkt.price_per_quintal) + '/qtl · Yield/acre: ' + (bestMkt.yield_per_acre || '—') + 'q</div>';
    }

    /* ── Enhancement 2: Mandi Price Voice ── */
    var mandiPriceVoiceHTML = '';
    if (mandiPriceVoiceAvailable) {
      mandiPriceVoiceHTML = '<div class="mandi-price-voice-wrap">'
        + '<div class="mandi-price-voice-label">📢 Kalasa Mandi Price Alert (Kannada)</div>'
        + '<audio class="mandi-price-voice" controls preload="none">'
        + '<source src="data:' + mandiPriceVoiceMime + ';base64,' + mandiPriceVoiceBase64 + '" type="' + mandiPriceVoiceMime + '">'
        + 'Your browser does not support audio playback.'
        + '</audio>'
        + '</div>';
    }

    /* ── Enhancement 3: Soil Health Card PDF ── */
    var soilPdfHTML = '';
    if (soilHealthPdfAvailable) {
      soilPdfHTML = '<div class="soil-pdf-wrap">'
        + '<div class="soil-pdf-label">📋 ಮಡಿ ಆರೋಗ್ಯ ಕಾರ್ಡ್ (Soil Health Card)</div>'
        + '<button class="soil-pdf-download-btn" onclick="downloadSoilPDF(\'' + soilHealthPdfBase64 + '\', \'' + soilHealthPdfFilename + '\')">'
        + '⬇️ Download Kannada Soil Card PDF'
        + '</button>'
        + '</div>';
    }

    /* ── Enhancement 4: Drought risk early warning ── */
    var droughtHTML = '';
    if (droughtRisk && droughtRisk.level) {
      var dLevel = String(droughtRisk.level).toUpperCase();
      var dClass = dLevel === 'NORMAL' ? 'badge-flag-green' : (dLevel === 'WATCH' ? 'badge-flag-amber' : 'badge-flag-red');
      var switchText = '';
      if (droughtRisk.switch_recommended && droughtRisk.switched_to) {
        switchText = '<div class="drought-note">🌾 Crop switch activated: <strong>' + originalTopCrop + '</strong> → <strong>' + droughtRisk.switched_to + '</strong></div>';
      }
      droughtHTML = '<div class="drought-box">'
        + '<div class="drought-title">🌧️ Drought Risk (15-day)</div>'
        + '<div class="drought-meta">'
        + '<span class="rmc-badge ' + dClass + '">' + dLevel + '</span>'
        + '<span>Projected Rain: ' + (droughtRisk.rainfall_15d_projected || 0) + ' mm</span>'
        + '<span>Historical: ' + (droughtRisk.historical_rainfall_15d || 0) + ' mm</span>'
        + '<span>Deficit: ' + (droughtRisk.deficit_pct || 0) + '%</span>'
        + '</div>'
        + switchText
        + '</div>';
    }

    /* ── Enhancement 6: Season profitability comparison ── */
    var profitabilityHTML = '';
    if (Array.isArray(profitability) && profitability.length) {
      var rows = profitability.slice(0, 3).map(function (row) {
        return '<tr>'
          + '<td>' + (row.crop || '-') + '</td>'
          + '<td>' + formatRs(row.net_profit_per_acre || 0) + '</td>'
          + '<td>' + (row.expected_yield_per_acre || 0) + ' q</td>'
          + '<td>' + formatRs(row.mandi_price_per_quintal || 0) + '</td>'
          + '<td>' + formatRs(row.cultivation_cost_per_acre || 0) + '</td>'
          + '</tr>';
      }).join('');

      var profitabilityVoiceHTML = '';
      if (profitabilityVoiceAvailable) {
        profitabilityVoiceHTML = '<div class="profit-voice-wrap">'
          + '<div class="kannada-audio-label">🔊 Profitability Voice Summary (Kannada)</div>'
          + '<audio class="kannada-audio" controls preload="none">'
          + '<source src="data:' + profitabilityVoiceMime + ';base64,' + profitabilityVoiceBase64 + '" type="' + profitabilityVoiceMime + '">'
          + 'Your browser does not support audio playback.'
          + '</audio>'
          + '</div>';
      }

      profitabilityHTML = '<div class="profitability-box">'
        + '<div class="profitability-title">📊 Season Profitability Comparison</div>'
        + '<div class="profitability-table-wrap">'
        + '<table class="profitability-table">'
        + '<thead><tr><th>Crop</th><th>Net / acre</th><th>Yield</th><th>Mandi Price</th><th>Cost / acre</th></tr></thead>'
        + '<tbody>' + rows + '</tbody>'
        + '</table>'
        + '</div>'
        + profitabilityVoiceHTML
        + '</div>';
    }

    /* ── Enhancement 7: Government scheme matcher ── */
    var schemesHTML = '';
    if (Array.isArray(schemeMatches) && schemeMatches.length) {
      schemesHTML = '<div class="scheme-box">'
        + '<div class="scheme-title">🏛️ Personalized Government Schemes</div>'
        + schemeMatches.map(function (s) {
          var docs = Array.isArray(s.documents) ? s.documents.join(', ') : '';
          return '<div class="scheme-item">'
            + '<div class="scheme-name">' + (s.name || 'Scheme') + '</div>'
            + '<div class="scheme-line"><strong>Eligibility:</strong> ' + (s.eligibility || '') + '</div>'
            + '<div class="scheme-line"><strong>Why matched:</strong> ' + (s.why_matched || '') + '</div>'
            + '<div class="scheme-line"><strong>Documents:</strong> ' + docs + '</div>'
            + '<div class="scheme-line"><strong>Nearest center:</strong> ' + (s.nearest_center || '') + '</div>'
            + '</div>';
        }).join('')
        + '</div>';
    }

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

    resultsContent.innerHTML =
      '<div class="result-main-card">'
      + '<div class="rmc-top">'
      + '<div>'
      + '<div style="font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.2rem">Top Recommended Crop</div>'
      + '<div class="rmc-crop-name">🌱 ' + top + '</div>'
      + '</div>'
      + '<div class="rmc-badges">'
      + '<span class="rmc-badge ' + weatherBadgeClass(wFlag) + '">🌦️ ' + wFlag + '</span>'
      + '</div>'
      + '</div>'

      + '<div class="rmc-stats">'
      + '<div class="rs-item"><span class="rs-label">Profit Estimate</span><span class="rs-val" style="color:var(--gold)">' + formatRs(profit) + '</span></div>'
      + '<div class="rs-item"><span class="rs-label">Weather Flag</span><span class="rs-val">' + wFlag + '</span></div>'
      + '<div class="rs-item"><span class="rs-label">Top Crops</span><span class="rs-val">' + topCrops.slice(0,3).join(', ') + '</span></div>'
      + '<div class="rs-item"><span class="rs-label">RF Accuracy</span><span class="rs-val">' + (modelAccuracy != null ? ((parseFloat(modelAccuracy) * 100).toFixed(1) + '%') : 'N/A') + '</span></div>'
      + '</div>'

      + '<div class="result-crops-row">' + cropRowHTML + '</div>'
      + compareHTML
      + mktHTML
      + '</div>'

      + shapHTML
      + droughtHTML
      + mandiPriceVoiceHTML
      + profitabilityHTML
      + schemesHTML
      + rotationHTML
      + soilHTML
      + soilPdfHTML
      + kanHTML;

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
