/* ═══════════════════════════════════════════════════════════════
   Rytha Mitra — Language Engine v2.1
   Handles UI translation between English and Kannada
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var TRANSLATIONS = {
    'kn': {
      // Navbar
      'Opportunity': 'ಅವಕಾಶ',
      'How It Works': 'ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
      'Features': 'ವೈಶಿಷ್ಟ್ಯಗಳು',
      'AI Agents': 'AI ಏಜೆಂಟ್‌ಗಳು',
      'Climate Dashboard': 'ವಾತಾವರಣದ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      'Open App →': 'ಅಪ್ಲಿಕೇಶನ್ ತೆರೆಯಿರಿ →',
      'Advisory Tool': 'ಸಲಹಾ ಸಾಧನ',
      'Simulator': 'ಸಿಮ್ಯುಲೇಟರ್',
      'District Map': 'ಜಿಲ್ಲಾ ನಕ್ಷೆ',

      // Hero
      'Climate-resilient farming': 'ಹವಾಮಾನ-ನಿರೋಧಕ ಕೃಷಿ',
      'in Karnataka,': 'ಕರ್ನಾಟಕದಲ್ಲಿ,',
      'AI-powered and actionable.': 'AI-ಚಾಲಿತ ಮತ್ತು ಕಾರ್ಯರೂಪಕ್ಕೆ ತರುವಂತಹ.',
      'Climate Action · Built for the farmers of Karnataka': 'ಹವಾಮಾನ ಕ್ರಿಯೆ · ಕರ್ನಾಟಕದ ರೈತರಿಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ',

      // Core App
      'Agricultural Intelligence Center': 'ಕೃಷಿ ಗುಪ್ತಚರ ಕೇಂದ್ರ',
      'Real-time climate resilience engine for Karnataka\'s agrarian future.': 'ಕರ್ನಾಟಕದ ಕೃಷಿ ಭವಿಷ್ಯಕ್ಕಾಗಿ ನೈಜ-ಸಮಯದ ಹವಾಮಾನ ಸ್ಥಿತಿಸ್ಥಾಪಕತ್ವ ಎಂಜಿನ್.',
      'Crop Advisor': 'ಬೆಳೆ ಸಲಹೆಗಾರ',
      'Market Analyst': 'ಮಾರುಕಟ್ಟೆ ವಿಶ್ಲೇಷಕ',
      'Weather Intel': 'ಹವಾಮಾನ ಮಾಹಿತಿ',
      'Soil Expert': 'ಮಣ್ಣಿನ ತಜ್ಞ',
      'Advisory Form': 'ಸಲಹಾ ಫಾರ್ಮ್',
      'Target District': 'ಗುರಿ ಜಿಲ್ಲೆ',
      'Land Size (Acres)': 'ಭೂಮಿಯ ಗಾತ್ರ (ಎಕರೆ)',
      'Current Temp (°C)': 'ಪ್ರಸ್ತುತ ತಾಪಮಾನ (°C)',
      'Humidity (%)': 'ಆರ್ದ್ರತೆ (%)',
      'Rainfall (mm)': 'ಮಳೆ (ಮಿಮೀ)',
      'Soil pH': 'ಮಣ್ಣಿನ pH',
      'Nitrogen (N)': 'ಸಾರಜನಕ (N)',
      'Phosphorus (P)': 'ರಂಜಕ (P)',
      'Potassium (K)': 'ಪೊಟ್ಯಾಸಿಯಮ್ (K)',
      'Last Crop Grown': 'ಕೊನೆಯದಾಗಿ ಬೆಳೆದ ಬೆಳೆ',
      'Get AI Advisory': 'AI ಸಲಹೆ ಪಡೆಯಿರಿ',

      // Vision
      'Pest & Disease Scanner': 'ಕೀಟ ಮತ್ತು ರೋಗ ಸ್ಕ್ಯಾನರ್',
      'Upload Crop Photo': 'ಬೆಳೆ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
      'Snap a clear photo of the pest or leaf spot for instant diagnosis.': 'ತತ್ಕ್ಷಣದ ರೋಗನಿರ್ಣಯಕ್ಕಾಗಿ ಕೀಟ ಅಥವಾ ಎಲೆಯ ಕಲೆಯ ಸ್ಪಷ್ಟ ಫೋಟೋವನ್ನು ಸ್ನ್ಯಾಪ್ ಮಾಡಿ.',
      'Analyze with Gemini': 'Gemini ಮೂಲಕ ವಿಶ್ಲೇಷಿಸಿ',

      // Climate Dashboard
      'Climate Intelligence': 'ಹವಾಮಾನ ಬುದ್ಧಿಮತ್ತೆ',
      'Dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      'Liters Water Saved/Acre': 'ಉಳಿಸಿದ ನೀರಿನ ಪ್ರಮಾಣ (ಲೀಟರ್/ಎಕರೆ)',
      'kg CO₂ Reduced': 'ಕಡಿಮೆಯಾದ CO₂ ಪ್ರಮಾಣ (ಕೆಜಿ)',
      'Sustainability Score': 'ಸುಸ್ಥಿರತೆಯ ಸ್ಕೋರ್',
      'Districts Covered': 'ಒಳಗೊಂಡಿರುವ ಜಿಲ್ಲೆಗಳು',
      'Launch Simulator →': 'ಸಿಮ್ಯುಲೇಟರ್ ಪ್ರಾರಂಭಿಸಿ →',
      'Irrigation Engine': 'ನೀರಾವರಿ ಎಂಜಿನ್',
      'District Map': 'ಜಿಲ್ಲಾ ನಕ್ಷೆ',

      // Simulator
      'Quick Scenario Test': 'ತ್ವರಿತ ಸನ್ನಿವೇಶ ಪರೀಕ್ಷೆ',
      'Climate Simulator': 'ಹವಾಮಾನ ಸಿಮ್ಯುಲೇಟರ್',
      'Normal Season': 'ಸಾಮಾನ್ಯ ಹವಾಮಾನ',
      'Drought': 'ಬರಗಾಲ',
      'Heatwave': 'ಹೀಟ್‌ವೇವ್',
      'Water Scarcity': 'ನೀರಿನ ಅಭಾವ',
      'Flood': 'ಪ್ರವಾಹ',

      // Footer
      'Ready to build climate-resilient farms?': 'ಹವಾಮಾನ-ಸ್ಥಿತಿಸ್ಥಾಪಕ ಫಾರ್ಮ್‌ಗಳನ್ನು ನಿರ್ಮಿಸಲು ಸಿದ್ಧರಿದ್ದೀರಾ?',
      'Made with 💚 for climate action': 'ಹವಾಮಾನ ಕ್ರಿಯೆಗಾಗಿ 💚 ನೊಂದಿಗೆ ಮಾಡಲಾಗಿದೆ',
      'The Farmer\'s Friend': 'ರೈತರ ಸ್ನೇಹಿತ',
    }
  };

  var currentLang = localStorage.getItem('ryt-lang') || 'en';

  function applyTranslations() {
    var dict = TRANSLATIONS[currentLang];
    
    // Select elements to translate
    // 1. All text nodes
    var walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while(node = walk.nextNode()) {
      var txt = node.textContent.trim();
      // Reverse translation if switching back to English
      if (currentLang === 'en') {
        // This is hard since we don't have the original text saved per node.
        // For a hackathon, we'll just reload to restore English or use data attributes if we had them.
        location.reload(); 
        return;
      }
      if (dict && dict[txt]) {
        node.textContent = dict[txt];
      }
    }

    // 2. All buttons and links
    document.querySelectorAll('a, button, h1, h2, h3, h4, label, span, p').forEach(function(el) {
       var txt = el.textContent.trim();
       if (dict && dict[txt]) {
         el.textContent = dict[txt];
       }
    });

    // 3. Placeholders
    document.querySelectorAll('[placeholder]').forEach(function(el) {
      var p = el.getAttribute('placeholder');
      if (dict && dict[p]) el.setAttribute('placeholder', dict[p]);
    });

    updateToggleButton();
  }

  function updateToggleButton() {
    var btn = document.getElementById('langBtn');
    if (btn) {
      btn.innerHTML = currentLang === 'en' ? '🌐 English' : '🌐 ಕನ್ನಡ';
      btn.style.background = currentLang === 'en' ? 'var(--glass-bg)' : 'var(--accent)';
      btn.style.color = currentLang === 'en' ? 'var(--text)' : '#000';
    }
  }

  window.toggleLanguage = function() {
    currentLang = currentLang === 'en' ? 'kn' : 'en';
    localStorage.setItem('ryt-lang', currentLang);
    if (currentLang === 'en') {
      location.reload();
    } else {
      applyTranslations();
    }
  };

  function init() {
    var nav = document.querySelector('.nav-links') || document.querySelector('.nav-inner') || document.querySelector('.nav-right');
    if (nav && !document.getElementById('langBtn')) {
      var btn = document.createElement('button');
      btn.id = 'langBtn';
      btn.className = 'lang-toggle-btn';
      btn.style.cssText = `
        margin-left: 1.5rem;
        padding: 6px 14px;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,0.1);
        background: rgba(255,255,255,0.05);
        color: white;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 700;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: inline-flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      `;
      btn.onmouseover = () => { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)'; };
      btn.onmouseout = () => { btn.style.transform = 'translateY(0)'; btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'; };
      btn.onclick = window.toggleLanguage;
      nav.appendChild(btn);
    }
    
    if (currentLang === 'kn') {
      applyTranslations();
    } else {
      updateToggleButton();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
