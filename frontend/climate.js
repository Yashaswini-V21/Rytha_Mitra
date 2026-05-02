(function(){'use strict';
/* === DATA === */
var CROPS={Rice:{water:1200,nReq:120,pReq:60,kReq:40,carbon:3.2,drought:0.2,flood:0.8,heat:0.3,yield:18,price:2200,cost:15000},Jowar:{water:450,nReq:80,pReq:40,kReq:30,carbon:0.8,drought:0.85,flood:0.3,heat:0.8,yield:12,price:2800,cost:10000},Ragi:{water:350,nReq:60,pReq:30,kReq:25,carbon:0.6,drought:0.9,flood:0.4,heat:0.85,yield:10,price:3200,cost:8000},Maize:{water:600,nReq:100,pReq:50,kReq:35,carbon:1.2,drought:0.5,flood:0.35,heat:0.6,yield:22,price:1800,cost:12000},Toor:{water:400,nReq:25,pReq:50,kReq:20,carbon:0.4,drought:0.88,flood:0.3,heat:0.75,yield:8,price:6500,cost:9000},Groundnut:{water:500,nReq:20,pReq:40,kReq:30,carbon:0.5,drought:0.7,flood:0.25,heat:0.65,yield:14,price:5200,cost:13000},Cotton:{water:700,nReq:90,pReq:45,kReq:35,carbon:1.8,drought:0.6,flood:0.2,heat:0.7,yield:10,price:6200,cost:16000},Sugarcane:{water:1800,nReq:150,pReq:80,kReq:60,carbon:4.5,drought:0.1,flood:0.5,heat:0.2,yield:80,price:350,cost:25000}};
var DISTRICTS={Raichur:{droughtRisk:0.85,floodRisk:0.15,avgRain:580,avgTemp:33,soil:'black',bestCrops:['Toor','Jowar','Ragi'],sustBase:42},Kalaburagi:{droughtRisk:0.82,floodRisk:0.12,avgRain:620,avgTemp:32,soil:'black',bestCrops:['Toor','Jowar','Cotton'],sustBase:44},Vijayapura:{droughtRisk:0.78,floodRisk:0.18,avgRain:550,avgTemp:31,soil:'black',bestCrops:['Jowar','Toor','Groundnut'],sustBase:46},Koppal:{droughtRisk:0.75,floodRisk:0.2,avgRain:560,avgTemp:32,soil:'red',bestCrops:['Ragi','Jowar','Maize'],sustBase:48},Bidar:{droughtRisk:0.7,floodRisk:0.22,avgRain:780,avgTemp:29,soil:'black',bestCrops:['Toor','Jowar','Cotton'],sustBase:50},Davanagere:{droughtRisk:0.55,floodRisk:0.3,avgRain:640,avgTemp:28,soil:'red',bestCrops:['Maize','Ragi','Groundnut'],sustBase:58},Chitradurga:{droughtRisk:0.6,floodRisk:0.25,avgRain:570,avgTemp:29,soil:'red',bestCrops:['Groundnut','Ragi','Jowar'],sustBase:55},Tumakuru:{droughtRisk:0.45,floodRisk:0.35,avgRain:680,avgTemp:27,soil:'red',bestCrops:['Ragi','Groundnut','Maize'],sustBase:62},Hassan:{droughtRisk:0.25,floodRisk:0.45,avgRain:920,avgTemp:25,soil:'laterite',bestCrops:['Rice','Ragi','Maize'],sustBase:68}};
var SOIL_RETENTION={black:0.85,red:0.6,laterite:0.5,alluvial:0.75,sandy:0.35};

/* === SIMULATOR === */
function runSimulator(){
  var d=el('simDistrict').value,rain=num('simRain'),temp=num('simTemp'),hum=num('simHum'),ph=num('simPh'),n=num('simN'),p=num('simP'),k=num('simK');
  el('simRainVal').textContent=rain+'mm';el('simTempVal').textContent=temp+'°C';el('simHumVal').textContent=hum+'%';el('simPhVal').textContent=ph;el('simNpkVal').textContent=n+'-'+p+'-'+k;
  var dist=DISTRICTS[d]||DISTRICTS.Raichur,bestCrop='Jowar',bestScore=-1;
  Object.keys(CROPS).forEach(function(c){var cr=CROPS[c],score=0;
    if(rain<300)score+=cr.drought*40;else if(rain>600)score+=cr.flood*20;else score+=30;
    if(temp>35)score+=cr.heat*25;else if(temp>=25&&temp<=32)score+=25;else score+=15;
    score+=Math.max(0,10-Math.abs(n-cr.nReq)/10);score+=Math.max(0,10-Math.abs(p-cr.pReq)/10);
    if(score>bestScore){bestScore=score;bestCrop=c;}
  });
  var cr=CROPS[bestCrop],conf=Math.min(95,Math.round(50+bestScore/2)),yld=cr.yield*(0.7+conf/300),profit=Math.round(yld*cr.price-cr.cost);
  var waterNeed=Math.round(cr.water*(1+Math.max(0,(temp-28)*0.04)-rain/2000));
  var waterEff=Math.min(100,Math.round(60+rain/15-cr.water/50)),fertEff=Math.min(100,Math.round(80-Math.abs(n-cr.nReq)/3-Math.abs(p-cr.pReq)/3)),climRes=Math.min(100,Math.round((rain>200?40:rain/5)+(temp<38?30:10)+cr.drought*30)),profScore=Math.min(100,Math.round(profit/800));
  var sust=Math.round((waterEff+fertEff+climRes+profScore)/4);
  var risk=sust>65?'LOW':sust>45?'MEDIUM':'HIGH';
  el('simCropOut').textContent=bestCrop;el('simCropConf').textContent='Confidence: '+conf+'%';
  el('simYieldOut').textContent=yld.toFixed(1)+' qtl/ac';el('simProfitOut').textContent='₹'+profit.toLocaleString('en-IN');
  el('simIrrigOut').textContent=waterNeed.toLocaleString('en-IN')+' L/ac';el('simSustOut').textContent=sust+'/100';
  el('simSustBar').style.width=sust+'%';el('simRiskOut').textContent=risk;
  var dot=el('simRiskDot');dot.style.background=risk==='LOW'?'var(--accent)':risk==='MEDIUM'?'var(--amber)':'var(--red)';
}
var SCENARIOS={normal:{rain:150,temp:28,hum:60,ph:6.5,n:80,p:40,k:40},drought:{rain:30,temp:38,hum:25,ph:7.2,n:60,p:30,k:25},'flood':{rain:400,temp:26,hum:90,ph:5.8,n:90,p:50,k:45},heatwave:{rain:80,temp:42,hum:30,ph:7.0,n:70,p:35,k:30},'water-scarce':{rain:50,temp:35,hum:35,ph:7.5,n:50,p:25,k:20},'fert-short':{rain:120,temp:29,hum:55,ph:6.5,n:30,p:15,k:10}};
document.querySelectorAll('.sim-preset').forEach(function(b){b.addEventListener('click',function(){
  document.querySelectorAll('.sim-preset').forEach(function(x){x.classList.remove('active')});b.classList.add('active');
  var s=SCENARIOS[b.dataset.scenario];if(!s)return;
  el('simRain').value=s.rain;el('simTemp').value=s.temp;el('simHum').value=s.hum;el('simPh').value=s.ph;el('simN').value=s.n;el('simP').value=s.p;el('simK').value=s.k;runSimulator();
});});
['simRain','simTemp','simHum','simPh','simN','simP','simK','simDistrict'].forEach(function(id){var e=el(id);if(e)e.addEventListener('input',runSimulator);});

/* === IRRIGATION === */
function calcIrrigation(){
  var crop=el('irrCrop').value,soil=el('irrSoil').value,land=num('irrLand')||2,rain=num('irrRain'),temp=num('irrTemp'),hum=num('irrHum');
  var cr=CROPS[crop]||CROPS.Jowar,ret=SOIL_RETENTION[soil]||0.6;
  var baseWater=cr.water,tempFactor=1+Math.max(0,(temp-28)*0.05),humFactor=1-hum/300,rainFactor=Math.max(0.3,1-rain/baseWater);
  var dailyWater=Math.round(baseWater*tempFactor*humFactor*rainFactor/7);
  var freq=rain>200?Math.max(2,Math.round(4*rainFactor)):rain>100?Math.round(5*tempFactor):7;
  var savings=Math.round(Math.max(0,Math.min(65,(rain/baseWater)*50+ret*20-10)));
  var droughtWarn=rain<100&&temp>33,overWarn=rain>300&&ret>0.7;
  setGauge('irrGaugeFill1',dailyWater,2000);setGauge('irrGaugeFill2',freq,7);setGauge('irrGaugeFill3',savings,100);
  el('irrWaterVal').textContent=dailyWater;el('irrFreqVal').textContent=freq;el('irrSaveVal').textContent=savings;
  var alerts='';
  if(droughtWarn)alerts+='<div class="irr-alert irr-alert-danger">🚨 DROUGHT WARNING — Rainfall critically low. Prioritize drip irrigation and mulching.</div>';
  if(overWarn)alerts+='<div class="irr-alert irr-alert-warn">⚠️ OVERWATERING RISK — High soil retention + heavy rainfall. Reduce irrigation frequency.</div>';
  if(!droughtWarn&&!overWarn)alerts+='<div class="irr-alert irr-alert-ok">✅ Conditions normal — Follow recommended schedule below.</div>';
  el('irrAlerts').innerHTML=alerts;
  var days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],weekHTML='';
  for(var i=0;i<7;i++){var isSkip=i%Math.max(1,Math.round(7/freq))!==0||rain>250&&i%2===0;
    weekHTML+='<div class="irr-day '+(isSkip?'irr-skip':'irr-water')+'"><span class="irr-day-name">'+days[i]+'</span><span class="irr-day-water">'+(isSkip?'SKIP':dailyWater+'L')+'</span><span class="irr-day-time">'+(isSkip?'Rain expected':'5:30–7:00 AM')+'</span></div>';}
  el('irrWeek').innerHTML=weekHTML;
  var altHTML='<h4>💧 Low-Water Crop Alternatives</h4><div class="irr-alt-list">';
  ['Ragi','Jowar','Toor'].forEach(function(c){var cData=CROPS[c];if(c!==crop)altHTML+='<div class="irr-alt-item"><strong>'+c+'</strong>Water: '+cData.water+' L/ac/week<br>Drought tolerance: '+(cData.drought*100).toFixed(0)+'%</div>';});
  altHTML+='</div>';el('irrAltCrops').innerHTML=altHTML;el('irrOutputs').style.display='block';
}
if(el('irrCalcBtn'))el('irrCalcBtn').addEventListener('click',calcIrrigation);

/* === FERTILIZER === */
function calcFertilizer(){
  var n=num('fertN'),p=num('fertP'),k=num('fertK'),ph=num('fertPh'),crop=el('fertCrop').value,prev=el('fertPrev').value;
  var cr=CROPS[crop]||CROPS.Jowar;
  var legumeBonus=prev==='Groundnut'?15:0;var adjN=cr.nReq-legumeBonus;
  var nStatus=n>adjN*1.3?'excess':n<adjN*0.7?'low':'optimal';
  var pStatus=p>cr.pReq*1.3?'excess':p<cr.pReq*0.7?'low':'optimal';
  var kStatus=k>cr.kReq*1.3?'excess':k<cr.kReq*0.7?'low':'optimal';
  function card(nutrient,label,current,optimal,status,colorCls){
    var pct=Math.min(100,Math.round(current/optimal*100));
    return '<div class="fert-reco-card"><div class="fert-nutrient '+colorCls+'">'+label+'</div><div class="fert-val">'+current+' → '+optimal+' kg/ha</div><div class="fert-bar-wrap"><div class="fert-bar fert-bar-'+status+'" style="width:'+pct+'%"></div></div><div class="fert-reco">'+(status==='excess'?'Reduce by '+(current-optimal)+' kg/ha':status==='low'?'Add '+(optimal-current)+' kg/ha':'Optimal level')+'</div><span class="fert-status fert-'+status+'">'+(status==='excess'?'⚠️ EXCESS':status==='low'?'⬇️ LOW':'✅ OK')+'</span></div>';}
  el('fertRecoGrid').innerHTML=card('N','Nitrogen (N)',n,Math.round(adjN),nStatus,'fert-n-label')+card('P','Phosphorus (P)',p,cr.pReq,pStatus,'fert-p-label')+card('K','Potassium (K)',k,cr.kReq,kStatus,'fert-k-label');
  var excessCost=(Math.max(0,n-adjN)*18+Math.max(0,p-cr.pReq)*25+Math.max(0,k-cr.kReq)*15);
  var soilImpact=nStatus==='excess'||pStatus==='excess'?'Degrading':'Healthy';
  var envImpact=nStatus==='excess'?'High runoff risk — groundwater contamination':'Low environmental risk';
  el('fertImpact').innerHTML='<h4>📊 Impact Analysis</h4><div class="fert-impact-grid"><div class="fert-impact-item"><span class="fert-impact-num" style="color:var(--amber)">₹'+excessCost+'</span><span class="fert-impact-lbl">Cost of Overuse/Acre</span></div><div class="fert-impact-item"><span class="fert-impact-num" style="color:'+(soilImpact==='Healthy'?'var(--accent)':'var(--red)')+'">'+soilImpact+'</span><span class="fert-impact-lbl">Soil Health Impact</span></div><div class="fert-impact-item"><span class="fert-impact-num">'+Math.round((n+p+k)*0.12)+'</span><span class="fert-impact-lbl">kg CO₂ from fertilizer</span></div><div class="fert-impact-item"><span class="fert-impact-num" style="color:var(--accent)">'+Math.round(excessCost*2.5)+'</span><span class="fert-impact-lbl">Annual savings potential ₹</span></div></div>';
  el('fertEco').innerHTML='<h4>🌿 Eco-Friendly Alternatives</h4><div class="fert-eco-grid"><div class="fert-eco-card"><strong>Vermicompost</strong><p>Replace 30% chemical N. Improves soil biology. ₹3/kg vs ₹18/kg urea.</p></div><div class="fert-eco-card"><strong>Neem-Coated Urea</strong><p>Reduces N loss by 15%. Govt-subsidized. Slows nitrogen release.</p></div><div class="fert-eco-card"><strong>Green Manure (Dhaincha)</strong><p>Adds 25-30 kg N/ha naturally. Plant before main crop season.</p></div><div class="fert-eco-card"><strong>Bio-fertilizers (Rhizobium)</strong><p>Fixes atmospheric N for legumes. Zero chemical input. ₹50/packet.</p></div></div>';
  el('fertOutputs').style.display='block';
}
if(el('fertCalcBtn'))el('fertCalcBtn').addEventListener('click',calcFertilizer);

/* === CLIMATE CROPS + CARBON + SUSTAINABILITY === */
function calcClimateIntel(){
  var d=el('ciDistrict').value,season=el('ciSeason').value;
  var dist=DISTRICTS[d]||DISTRICTS.Raichur;
  var droughtCrops=[],floodCrops=[],heatCrops=[];
  Object.keys(CROPS).forEach(function(c){var cr=CROPS[c];if(cr.drought>0.7)droughtCrops.push(c);if(cr.flood>0.4)floodCrops.push(c);if(cr.heat>0.7)heatCrops.push(c);});
  function cropCards(list,type,cls){return list.map(function(c){var cr=CROPS[c];return '<div class="ci-card"><span class="ci-type '+cls+'">'+type+'</span><h4>'+c+'</h4><p>Water: '+cr.water+'L · Yield: '+cr.yield+'qtl · Price: ₹'+cr.price+'/qtl</p><div class="ci-traits"><span class="ci-trait">Drought: '+(cr.drought*100)+'%</span><span class="ci-trait">Carbon: '+cr.carbon+' kg/ac</span></div></div>';}).join('');}
  el('ciGrid').innerHTML=cropCards(droughtCrops,'🏜️ Drought-Resistant','ci-drought')+cropCards(floodCrops.slice(0,2),'🌊 Flood-Resistant','ci-flood')+cropCards(heatCrops,'🔥 Heat-Resistant','ci-heat');
  var carbonHTML='';dist.bestCrops.forEach(function(c){var cr=CROPS[c];var pct=Math.round(cr.carbon/4.5*100);var color=cr.carbon<1?'var(--accent)':cr.carbon<2?'var(--amber)':'var(--red)';
    carbonHTML+='<div class="carbon-card"><div class="carbon-crop">'+c+'</div><div class="carbon-val" style="color:'+color+'">'+cr.carbon+' kg</div><div class="carbon-label">CO₂ per acre per season</div><div class="carbon-bar-wrap"><div class="carbon-bar" style="width:'+pct+'%;background:'+color+'"></div></div></div>';});
  el('carbonGrid').innerHTML=carbonHTML;
  var bestCrop=dist.bestCrops[0],cr=CROPS[bestCrop]||CROPS.Jowar;
  var wEff=Math.round(70+dist.avgRain/30-cr.water/60),fEff=78,cRes=Math.round(cr.drought*50+cr.heat*30+(dist.avgRain>500?20:10)),prof=Math.round(cr.yield*cr.price/cr.cost*25);
  var total=Math.round((wEff+fEff+cRes+prof)/4);
  el('sustScoreWrap').innerHTML='<div class="sust-circle-wrap"><svg viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" class="sust-bg"/><circle cx="80" cy="80" r="70" class="sust-fill" id="sustFill"/></svg><div class="sust-center"><span class="sust-num">'+total+'</span><span class="sust-lbl">/ 100</span></div></div><div class="sust-details"><div class="sust-detail"><span class="sust-detail-label">💧 Water Efficiency</span><div class="sust-detail-bar"><div class="sust-detail-fill" style="width:'+wEff+'%;background:var(--blue)"></div></div><span class="sust-detail-val">'+wEff+'</span></div><div class="sust-detail"><span class="sust-detail-label">⚗️ Fertilizer Efficiency</span><div class="sust-detail-bar"><div class="sust-detail-fill" style="width:'+fEff+'%;background:var(--accent)"></div></div><span class="sust-detail-val">'+fEff+'</span></div><div class="sust-detail"><span class="sust-detail-label">🌾 Climate Resilience</span><div class="sust-detail-bar"><div class="sust-detail-fill" style="width:'+cRes+'%;background:var(--amber)"></div></div><span class="sust-detail-val">'+cRes+'</span></div><div class="sust-detail"><span class="sust-detail-label">💰 Profitability</span><div class="sust-detail-bar"><div class="sust-detail-fill" style="width:'+prof+'%;background:#a78bfa"></div></div><span class="sust-detail-val">'+prof+'</span></div></div>';
  setTimeout(function(){var f=document.getElementById('sustFill');if(f)f.style.strokeDashoffset=440-(440*total/100);},100);
}
if(el('ciCalcBtn'))el('ciCalcBtn').addEventListener('click',calcClimateIntel);

/* === KARNATAKA MAP === */
function renderMap(){
  var html='';Object.keys(DISTRICTS).forEach(function(d){var dist=DISTRICTS[d];
    var riskLvl=dist.droughtRisk>0.75?'CRITICAL':dist.droughtRisk>0.6?'HIGH':dist.droughtRisk>0.4?'MEDIUM':'LOW';
    var riskColor=riskLvl==='CRITICAL'?'background:rgba(239,68,68,.15);color:var(--red)':riskLvl==='HIGH'?'background:rgba(249,115,22,.15);color:#f97316':riskLvl==='MEDIUM'?'background:rgba(245,158,11,.15);color:var(--amber)':'background:rgba(52,211,153,.15);color:var(--accent)';
    html+='<div class="kmap-card" data-district="'+d+'"><div class="kmap-card-name">'+d+'</div><div class="kmap-card-risk" style="'+riskColor+'">'+riskLvl+'</div><div class="kmap-card-stats"><div class="kmap-card-stat"><span>Drought</span><span>'+(dist.droughtRisk*100)+'%</span></div><div class="kmap-card-stat"><span>Flood</span><span>'+(dist.floodRisk*100)+'%</span></div><div class="kmap-card-stat"><span>Avg Rain</span><span>'+dist.avgRain+'mm</span></div><div class="kmap-card-stat"><span>Score</span><span>'+dist.sustBase+'</span></div></div></div>';});
  el('kmapGrid').innerHTML=html;
  document.querySelectorAll('.kmap-card').forEach(function(c){c.addEventListener('click',function(){
    document.querySelectorAll('.kmap-card').forEach(function(x){x.classList.remove('active')});c.classList.add('active');
    var d=c.dataset.district,dist=DISTRICTS[d];
    var detail=el('kmapDetail');detail.classList.add('active');
    var crops=dist.bestCrops.map(function(cr){return cr}).join(', ');
    detail.innerHTML='<div class="kmap-detail-header"><h3>'+d+' District Intelligence</h3></div><div class="kmap-detail-grid"><div class="kmap-metric"><span class="kmap-metric-val" style="color:var(--red)">'+(dist.droughtRisk*100)+'%</span><span class="kmap-metric-lbl">Drought Risk</span></div><div class="kmap-metric"><span class="kmap-metric-val" style="color:var(--blue)">'+(dist.floodRisk*100)+'%</span><span class="kmap-metric-lbl">Flood Risk</span></div><div class="kmap-metric"><span class="kmap-metric-val">'+crops+'</span><span class="kmap-metric-lbl">Best Crops</span></div><div class="kmap-metric"><span class="kmap-metric-val">'+dist.avgRain+'mm</span><span class="kmap-metric-lbl">Avg Rainfall</span></div><div class="kmap-metric"><span class="kmap-metric-val">'+dist.avgTemp+'°C</span><span class="kmap-metric-lbl">Avg Temperature</span></div><div class="kmap-metric"><span class="kmap-metric-val" style="color:var(--accent)">'+dist.sustBase+'/100</span><span class="kmap-metric-lbl">Sustainability</span></div></div>';
  });});
}

/* === HERO COUNTERS === */
function animateCount(id,target,suffix){var e=el(id);if(!e)return;var start=0,dur=2000,step=Math.ceil(target/60);
  var iv=setInterval(function(){start+=step;if(start>=target){start=target;clearInterval(iv);}e.textContent=start+(suffix||'');},dur/60);}
setTimeout(function(){animateCount('heroWater',2400);animateCount('heroCarbon',180);animateCount('heroScore',72);},500);

/* === HELPERS === */
function el(id){return document.getElementById(id)}
function num(id){return parseFloat(el(id).value)||0}
function setGauge(id,val,max){var e=document.getElementById(id);if(!e)return;var pct=Math.min(1,val/max);e.style.strokeDashoffset=327-(327*pct);}

/* === THEME & NAV === */
(function initTheme() {
  const themeBtn = el('themeBtn');
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);
  if(themeBtn) themeBtn.innerText = savedTheme === 'dark' ? '🌙' : '☀️';

  if(themeBtn) {
    themeBtn.addEventListener('click', function() {
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      themeBtn.innerText = next === 'dark' ? '🌙' : '☀️';
    });
  }

  const nav = el('navbar');
  window.addEventListener('scroll', function() {
    if(nav) nav.classList.toggle('scrolled', window.scrollY > 50);
  });
})();

/* === INIT === */
if(el('simRain'))runSimulator();
if(el('kmapGrid'))renderMap();
if(el('ciCalcBtn'))calcClimateIntel();
})();
