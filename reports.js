// Reports and PDF exports for Field Visits. Loaded on demand by index.html.
function downloadPDF() {
  const data = getFilteredForDL();
  if (!data.length) { toast('No records to export', 'warn'); return; }

  const dc = {};
  data.forEach(r => { if(r.department) dc[r.department]=(dc[r.department]||0)+1; });
  const pc = {urgent:0,high:0,medium:0,low:0};
  data.forEach(r => { if(pc.hasOwnProperty(r.priority)) pc[r.priority]++; });

  const targets = JSON.parse(localStorage.getItem('mld_officer_targets')||'[]');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Field Inspection — PDF Report</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;color:#1A2438;font-size:12px;background:white}
  .header{background:linear-gradient(135deg,#0C1A2E,#1E3A5F);color:white;padding:28px 32px;text-align:center;margin-bottom:24px}
  .header h1{font-size:22px;font-weight:700;margin-bottom:4px}
  .header h2{font-size:14px;opacity:.75;font-weight:400;margin-bottom:8px}
  .header p{font-size:11px;opacity:.55}
  .seal{font-size:44px;margin-bottom:8px}
  .kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:0 24px 20px}
  .kpi-card{text-align:center;padding:14px;border:1.5px solid #E0DDD6;border-radius:8px;background:#FAFAF7}
  .kpi-card-top{font-size:28px;font-weight:700;line-height:1}
  .kpi-card-lbl{font-size:10px;color:#6B7A94;margin-top:4px;text-transform:uppercase;letter-spacing:.5px}
  .section{margin:0 24px 20px}
  .section h3{font-size:14px;font-weight:700;color:#162540;padding-bottom:7px;border-bottom:2px solid #E8650A;margin-bottom:12px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#0C1A2E;color:white;padding:8px 10px;text-align:left;font-size:10px;letter-spacing:.3px}
  td{padding:7px 10px;border-bottom:1px solid #EEE;vertical-align:top}
  tr:nth-child(even){background:#F9F8F5}
  .badge{display:inline-block;padding:1px 7px;border-radius:8px;font-size:9px;font-weight:700}
  .b-urgent{background:#FCECEA;color:#B5220E}
  .b-high{background:#FFF4EB;color:#E8650A}
  .b-medium{background:#FEFBEA;color:#C8960C}
  .b-low{background:#E6F5F1;color:#0A7055}
  .b-synced{background:#E6F5F1;color:#0A7055}
  .b-pending{background:#FFF4EB;color:#E8650A}
  .footer{text-align:center;color:#AAA;font-size:10px;border-top:1px solid #EEE;padding:14px 24px;margin-top:16px}
  .dept-bar-row{margin-bottom:8px}
  .db-lbl{display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px}
  .db-track{height:8px;background:#F2F0EA;border-radius:4px;overflow:hidden}
  .db-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#E8650A,#C8960C)}
  @media print{
    @page{margin:16mm;size:A4}
    body{font-size:11px}
    .no-print{display:none}
    .header{margin-bottom:16px}
  }
</style>
</head>
<body>
<div class="header">
  <h1>Field Inspection Report</h1>
  <p>Generated: ${new Date().toLocaleString('en-IN')} &nbsp;|&nbsp; Records: ${data.length}</p>
</div>
<div class="no-print" style="text-align:center;padding:12px;background:#FFF4EB;border-bottom:2px solid #E8650A;font-size:13px;font-weight:600;color:#E8650A">
  👆 Press <kbd>Ctrl+P</kbd> (or ⌘P on Mac) → Save as PDF &nbsp;·&nbsp; For best results, set margins to "None" and enable "Background graphics"
  <button onclick="window.print()" style="margin-left:16px;padding:6px 16px;background:#E8650A;color:white;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer">🖨 Print / Save PDF</button>
</div>
<div class="kpi-row">
  <div class="kpi-card"><div class="kpi-card-top" style="color:#E8650A">${data.length}</div><div class="kpi-card-lbl">Total Inspections</div></div>
  <div class="kpi-card"><div class="kpi-card-top" style="color:#0A7055">${data.filter(r=>r.synced).length}</div><div class="kpi-card-lbl">Cloud Synced</div></div>
  <div class="kpi-card"><div class="kpi-card-top" style="color:#B5220E">${pc.urgent+pc.high}</div><div class="kpi-card-lbl">Urgent / High Priority</div></div>
  <div class="kpi-card"><div class="kpi-card-top" style="color:#0B6FAD">${data.filter(r=>r.lat&&r.lng).length}</div><div class="kpi-card-lbl">GPS Tagged</div></div>
</div>
<div class="section">
  <h3>📊 Department-wise Summary</h3>
  ${Object.entries(dc).sort((a,b)=>b[1]-a[1]).map(([d,c])=>`
  <div class="dept-bar-row">
    <div class="db-lbl"><span>${d}</span><strong>${c} (${(c/data.length*100).toFixed(1)}%)</strong></div>
    <div class="db-track"><div class="db-fill" style="width:${(c/Math.max(...Object.values(dc))*100).toFixed(1)}%"></div></div>
  </div>`).join('')}
</div>
<div class="section">
  <h3>🎯 Priority Breakdown</h3>
  <table>
    <tr><th>Priority</th><th>Count</th><th>% Share</th></tr>
    ${[['🔴 Urgent',pc.urgent,'#B5220E'],['🟠 High',pc.high,'#E8650A'],['🟡 Medium',pc.medium,'#C8960C'],['🟢 Low',pc.low,'#0A7055']].map(([p,c,col])=>
      `<tr><td style="color:${col};font-weight:600">${p}</td><td>${c}</td><td>${data.length>0?(c/data.length*100).toFixed(1):'0'}%</td></tr>`
    ).join('')}
  </table>
</div>

${targets.length > 0 ? `
<div class="section">
  <h3>🎯 Officer Inspection Targets vs Actual</h3>
  <table>
    <tr><th>Officer</th><th>Department</th><th>Target</th><th>Completed</th><th>Progress</th><th>Status</th></tr>
    ${targets.map(t => {
      const done = data.filter(r => (r.officerName||'').toLowerCase().trim() === (t.name||'').toLowerCase().trim()).length;
      const pct  = t.target > 0 ? Math.min(100, Math.round(done/t.target*100)) : 0;
      const status = done >= t.target ? '✅ Met' : done >= t.target*0.7 ? '🟡 Near' : '🔴 Below';
      return `<tr>
        <td style="font-weight:600">${t.name||'—'}</td>
        <td>${t.department||'—'}</td>
        <td style="text-align:center;font-weight:700">${t.target}</td>
        <td style="text-align:center;font-weight:700;color:${done>=t.target?'#0A7055':'#E8650A'}">${done}</td>
        <td style="text-align:center">${pct}%</td>
        <td style="text-align:center">${status}</td>
      </tr>`;
    }).join('')}
  </table>
</div>` : ''}
<div class="section">
  <h3>📋 Inspection Records</h3>
  <table>
    <colgroup><col style="width:3%"><col style="width:16%"><col style="width:14%"><col style="width:67%"></colgroup>
    <tr><th>#</th><th>Officer</th><th>Department</th><th>Observations &amp; Remarks</th></tr>
    ${data.map((r,i)=>`<tr>
      <td style="color:#6B7A94">${i+1}</td>
      <td><strong>${r.officerName||'—'}</strong><br><span style="color:#6B7A94;font-size:10px">${r.location||''}${r.block?', '+r.block:''}</span></td>
      <td>${r.department||'—'}</td>
      <td style="white-space:pre-wrap">${esc(r.remarks)||'—'}${r.coordRequired?`<br><span style="color:#0B6FAD;font-size:10px;font-weight:700">🔗 Coordination: ${esc((r.concernedDepts||[]).join(', '))||'Yes'}</span>`:''}</td>
    </tr>`).join('')}
  </table>
</div>
<div class="footer">
  Field Inspection System &nbsp;·&nbsp; Report generated: ${new Date().toLocaleString('en-IN')} &nbsp;·&nbsp; ${data.length} inspections
</div>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) { toast('❌ Popup blocked — allow popups to generate PDF', 'error'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  toast('📕 PDF report opened — use Ctrl+P to save as PDF', 'success');
}

function downloadReport() {
  const data = getFilteredForDL();
  if (!data.length) { toast('No records match the selected filter', 'warn'); return; }

  const dc = {};
  data.forEach(r => { if(r.department) dc[r.department]=(dc[r.department]||0)+1; });
  const pc = {urgent:0,high:0,medium:0,low:0};
  data.forEach(r => { if(pc.hasOwnProperty(r.priority)) pc[r.priority]++; });

  const dateF  = document.getElementById('dl-filter-date')?.value || '';
  const fromV  = document.getElementById('dl-from-date')?.value   || '';
  const toV    = document.getElementById('dl-to-date')?.value     || '';
  let periodLabel = 'All Records';
  if (dateF==='today')  periodLabel = 'Today — ' + new Date().toLocaleDateString('en-IN');
  else if (dateF==='week')  periodLabel = 'Last 7 Days';
  else if (dateF==='month') periodLabel = new Date().toLocaleString('en-IN',{month:'long',year:'numeric'});
  else if (dateF==='custom') {
    if (fromV && toV) periodLabel = new Date(fromV).toLocaleDateString('en-IN') + ' to ' + new Date(toV).toLocaleDateString('en-IN');
    else if (fromV) periodLabel = 'From ' + new Date(fromV).toLocaleDateString('en-IN');
    else if (toV)   periodLabel = 'Until ' + new Date(toV).toLocaleDateString('en-IN');
  }

  const gpsCount = data.filter(r=>r.lat&&r.lng).length;
  const gpsRate  = data.length > 0 ? Math.round(gpsCount/data.length*100) : 0;

  const days7 = {};
  const msDay = 864e5;
  for (let i=6;i>=0;i--) {
    const d = new Date(Date.now()-i*msDay).toISOString().slice(0,10);
    days7[d] = 0;
  }
  data.forEach(r => {
    const d = (r.createdAt||'').slice(0,10);
    if (days7.hasOwnProperty(d)) days7[d]++;
  });
  const maxDay = Math.max(...Object.values(days7), 1);

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Field Inspection — Report</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#F5F5F5;color:#1A2438;font-size:13px}
  .page{max-width:960px;margin:0 auto;padding:32px 24px}
  .header{background:linear-gradient(135deg,#0C1A2E 0%,#1E3A5F 60%,#0A5566 100%);color:white;padding:36px 40px;border-radius:16px;margin-bottom:28px;position:relative;overflow:hidden}
  .header::after{content:'🏛';position:absolute;right:32px;top:50%;transform:translateY(-50%);font-size:80px;opacity:.08}
  .header h1{font-size:26px;font-weight:700;margin-bottom:4px}
  .header h2{font-size:15px;font-weight:400;opacity:.75;margin-bottom:10px}
  .header .meta{display:flex;gap:20px;flex-wrap:wrap;font-size:12px;opacity:.6}
  .period-badge{display:inline-block;background:rgba(232,101,10,.3);border:1px solid rgba(232,101,10,.5);color:#FFA040;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;margin-top:10px}
  .kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:28px}
  .kpi-card{background:white;text-align:center;padding:18px 14px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.07);border:1px solid #E8E4DC}
  .kpi-num{font-size:34px;font-weight:700;line-height:1}
  .kpi-lbl{font-size:11px;color:#6B7A94;margin-top:5px;text-transform:uppercase;letter-spacing:.5px}
  .section{background:white;border-radius:12px;padding:22px 24px;margin-bottom:22px;box-shadow:0 2px 10px rgba(0,0,0,.06);border:1px solid #E8E4DC}
  .section h3{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#162540;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #F0EDE5}
  table{width:100%;border-collapse:collapse}
  th{background:#0C1A2E;color:white;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
  td{padding:10px 12px;border-bottom:1px solid #EEE;vertical-align:top}
  tr:nth-child(even) td{background:#FAFAF7}
  .badge{display:inline-block;padding:2px 9px;border-radius:10px;font-size:10px;font-weight:700}
  .b-urgent{background:#FCECEA;color:#B5220E}
  .b-high{background:#FFF4EB;color:#E8650A}
  .b-medium{background:#FEFBEA;color:#C8960C}
  .b-low{background:#E6F5F1;color:#0A7055}
  .bar-wrap{display:flex;align-items:center;gap:10px;margin-bottom:8px}
  .bar-label{min-width:160px;font-size:12px;color:#3D4F6A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .bar-track{flex:1;height:8px;background:#F0EDE5;border-radius:4px;overflow:hidden}
  .bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#E8650A,#C8960C)}
  .bar-count{min-width:28px;text-align:right;font-size:12px;font-weight:700;color:#1A2438}
  .day-row{display:flex;gap:8px;align-items:flex-end;height:60px;margin-top:8px}
  .day-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
  .day-bar{width:100%;background:linear-gradient(180deg,#E8650A,#C8960C);border-radius:4px 4px 0 0;min-height:2px;transition:height .3s}
  .day-label{font-size:10px;color:#6B7A94}
  .footer{margin-top:32px;text-align:center;color:#AAA;font-size:11px;padding-top:16px;border-top:1px solid #EEE}
  .gps-bar{height:8px;background:#EEE;border-radius:4px;margin-top:6px;overflow:hidden}
  .gps-fill{height:100%;background:linear-gradient(90deg,#0A7055,#0E9470);border-radius:4px}
  @media print{body{background:white}.page{padding:20px}.header{border-radius:8px}table{page-break-inside:avoid}}
</style></head><body>
<div class="page">
<div class="header">
  <h1>Field Inspection Report</h1>
  <div class="meta">
    <span>Generated: ${new Date().toLocaleString('en-IN')}</span>
    <span>Records: ${data.length}</span>
    ${document.getElementById('dl-filter-dept')?.value ? `<span>Department: ${document.getElementById('dl-filter-dept').value}</span>` : ''}
  </div>
  <div class="period-badge">📅 ${periodLabel}</div>
</div>
<div class="kpi-row">
  <div class="kpi-card"><div class="kpi-num" style="color:#E8650A">${data.length}</div><div class="kpi-lbl">Total Inspections</div></div>
  <div class="kpi-card"><div class="kpi-num" style="color:#0A7055">${data.filter(r=>r.synced).length}</div><div class="kpi-lbl">Cloud Synced</div></div>
  <div class="kpi-card"><div class="kpi-num" style="color:#B5220E">${pc.urgent+pc.high}</div><div class="kpi-lbl">Urgent / High</div></div>
  <div class="kpi-card"><div class="kpi-num" style="color:#0B6FAD">${data.filter(r=>r.coordRequired).length}</div><div class="kpi-lbl">Coordination Cases</div></div>
  <div class="kpi-card"><div class="kpi-num" style="color:#0A7055">${gpsRate}%</div><div class="kpi-lbl">GPS Coverage</div></div>
</div>
<div class="section">
  <h3>📊 Department-wise Breakdown</h3>
  ${Object.entries(dc).sort((a,b)=>b[1]-a[1]).map(([d,c])=>`
    <div class="bar-wrap">
      <div class="bar-label" title="${d}">${d}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(c/data.length*100).toFixed(1)}%"></div></div>
      <div class="bar-count">${c}</div>
    </div>
  `).join('')}
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:22px">
  <div class="section" style="margin:0">
    <h3>🎯 Priority Distribution</h3>
    ${[['Urgent',pc.urgent,'#B5220E'],['High',pc.high,'#E8650A'],['Medium',pc.medium,'#C8960C'],['Low',pc.low,'#0A7055']].map(([p,c,col])=>`
      <div class="bar-wrap">
        <div class="bar-label">${p}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${data.length>0?(c/data.length*100).toFixed(1):0}%;background:${col}"></div></div>
        <div class="bar-count">${c}</div>
      </div>
    `).join('')}
  </div>
  <div class="section" style="margin:0">
    <h3>📈 7-Day Activity Trend</h3>
    <div class="day-row">
      ${Object.entries(days7).map(([d,c])=>`
        <div class="day-col">
          <div class="day-bar" style="height:${Math.max(c/maxDay*48,c>0?4:2)}px" title="${d}: ${c}"></div>
          <div class="day-label">${new Date(d).toLocaleDateString('en-IN',{weekday:'short'})}</div>
        </div>
      `).join('')}
    </div>
    <div style="font-size:12px;color:#6B7A94;margin-top:10px">GPS Coverage: ${gpsCount}/${data.length} records (${gpsRate}%)</div>
    <div class="gps-bar"><div class="gps-fill" style="width:${gpsRate}%"></div></div>
  </div>
</div>
<div class="section">
  <h3>📋 Inspection Records</h3>
  <table>
    <tr><th>#</th><th>Officer</th><th>Department</th><th>Location</th><th>Date</th><th>Priority</th><th>GPS</th><th>Coord.</th></tr>
    ${data.map((r,i)=>`<tr>
      <td style="color:#6B7A94">${i+1}</td>
      <td><strong>${esc(r.officerName)}</strong><br><span style="color:#6B7A94;font-size:11px">${esc(r.designation)}</span></td>
      <td style="font-size:12px">${esc(r.department)}</td>
      <td>${esc(r.location)}<br><span style="color:#6B7A94;font-size:11px">${esc(r.block)}</span></td>
      <td style="white-space:nowrap;font-size:12px">${r.datetime?new Date(r.datetime).toLocaleDateString('en-IN'):''}</td>
      <td><span class="badge b-${r.priority||'low'}">${(r.priority||'low').toUpperCase()}</span></td>
      <td style="text-align:center">${r.lat&&r.lng?'✅':'—'}</td>
      <td>${r.coordRequired?`<span style="color:#0B6FAD;font-weight:600">Yes</span>`:'No'}</td>
    </tr>`).join('')}
  </table>
</div>
<div class="footer">
  Field Inspection System · Report Period: ${periodLabel} · Generated: ${new Date().toLocaleString('en-IN')}
</div>
</div>
</body></html>`;

  dlFile(`Field_Report_${periodLabel.replace(/[^a-zA-Z0-9]/g,'_')}_${today()}.html`, html, 'text/html');
  toast('📋 Professional report downloaded successfully', 'success');
}

function generateReport(type, format) {
  const data = getFilteredForDL();
  if (!data.length) { toast('No records match the selected filter', 'warn'); return; }

  const dateF = document.getElementById('dl-filter-date')?.value || '';
  const fromV = document.getElementById('dl-from-date')?.value   || '';
  const toV   = document.getElementById('dl-to-date')?.value     || '';
  let period = 'All Records';
  if (dateF==='today')  period = 'Today — ' + new Date().toLocaleDateString('en-IN');
  else if (dateF==='yesterday') period = 'Yesterday — ' + new Date(Date.now() - 864e5).toLocaleDateString('en-IN');
  else if (dateF==='lastmonth') { const lm = new Date(); lm.setDate(1); lm.setMonth(lm.getMonth() - 1); period = lm.toLocaleString('en-IN',{month:'long',year:'numeric'}); }
  else if (dateF==='week')  period = 'Last 7 Days';
  else if (dateF==='month') period = new Date().toLocaleString('en-IN',{month:'long',year:'numeric'});
  else if (dateF==='custom' && fromV && toV)
    period = new Date(fromV).toLocaleDateString('en-IN') + ' to ' + new Date(toV).toLocaleDateString('en-IN');

  const generated = new Date().toLocaleString('en-IN', {day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});

  let titleText = '';
  let sections  = '';

  const reportStyle = `
    body{font-family:Arial,Helvetica,sans-serif;max-width:900px;margin:0 auto;padding:32px 40px;color:#1A2438;font-size:13px;line-height:1.6}
    h1{font-size:22px;margin:0;color:#fff}
    h2{font-size:16px;font-weight:700;color:#1A2438;border-bottom:2px solid #1A73E8;padding-bottom:6px;margin:28px 0 14px}
    h3{font-size:14px;font-weight:700;color:#1A73E8;margin:18px 0 8px}
    .cover{background:linear-gradient(135deg,#1A73E8,#1557B0);color:#fff;padding:28px 32px;border-radius:8px;margin-bottom:28px}
    .cover .sub{font-size:13px;opacity:.8;margin-top:6px}
    .cover .meta{font-size:12px;opacity:.7;margin-top:16px;border-top:1px solid rgba(255,255,255,.25);padding-top:12px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:12px}
    th{background:#1A73E8;color:#fff;padding:9px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.4px}
    td{padding:8px 12px;border-bottom:1px solid #E8EAED;vertical-align:top}
    tr:nth-child(even) td{background:#F8F9FA}
    .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;text-transform:uppercase}
    .b-urgent{background:#FDECEA;color:#B71C1C}.b-high{background:#FFF3E0;color:#E65100}
    .b-medium{background:#FFFDE7;color:#F57F17}.b-low{background:#E8F5E9;color:#1B5E20}
    .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px}
    .stat{border:1px solid #E8EAED;border-radius:8px;padding:14px;text-align:center}
    .stat .val{font-size:28px;font-weight:700;color:#1A73E8;font-family:monospace}
    .stat .lbl{font-size:11px;color:#5F6368;margin-top:4px;text-transform:uppercase;letter-spacing:.4px}
    .footer{margin-top:36px;padding-top:14px;border-top:1px solid #E8EAED;font-size:11px;color:#9AA0A6;text-align:center}
    @media print{body{padding:20px}.cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  `;

  if (type === 'officer' || type === 'comprehensive') {
    titleText = titleText || 'Officer Visit Report';
    const om = {};
    data.forEach(r => {
      const n = (r.officerName||'').trim() || 'Unknown';
      if (!om[n]) om[n] = { name:n, desig:r.designation||'', dept:r.department||'', total:0, days:new Set(), depts:new Set(), locations:new Set(), urgent:0, remarks:[] };
      const o = om[n];
      o.total++;
      o.days.add(new Date(r.createdAt).toDateString());
      if (r.department) o.depts.add(r.department);
      if (r.location)   o.locations.add(r.location);
      if (r.block)      o.locations.add(r.block);
      if (r.priority==='urgent'||r.priority==='high') o.urgent++;
      if (r.remarks)    o.remarks.push(r.remarks.substring(0,120));
    });
    const officers = Object.values(om).sort((a,b)=>b.total-a.total);
    sections += `<h2>👮 Officer-wise Field Visit Summary</h2>
    <div class="stat-grid">
      <div class="stat"><div class="val">${officers.length}</div><div class="lbl">Officers</div></div>
      <div class="stat"><div class="val">${data.length}</div><div class="lbl">Total Visits</div></div>
      <div class="stat"><div class="val">${Math.round(data.length/Math.max(officers.length,1)*10)/10}</div><div class="lbl">Avg Visits/Officer</div></div>
    </div>
    <table>
      <tr><th>#</th><th>Officer</th><th>Designation</th><th>Department</th><th>Total Visits</th><th>Active Days</th><th>Locations</th><th>Depts Covered</th><th>Urgent/High</th></tr>
      ${officers.map((o,i)=>`<tr>
        <td>${i+1}</td>
        <td><strong>${esc(o.name)}</strong></td>
        <td style="font-size:11px;color:#5F6368">${esc(o.desig)}</td>
        <td style="font-size:11px">${esc(o.dept)}</td>
        <td style="text-align:center;font-weight:700;color:#1A73E8">${o.total}</td>
        <td style="text-align:center;font-weight:700;color:#34A853">${o.days.size}</td>
        <td style="font-size:11px">${[...o.locations].slice(0,4).join(', ')+(o.locations.size>4?` +${o.locations.size-4} more`:'')}</td>
        <td style="font-size:11px">${[...o.depts].join(', ')||'—'}</td>
        <td style="text-align:center;color:${o.urgent>0?'#B71C1C':'#5F6368'}">${o.urgent||'—'}</td>
      </tr>`).join('')}
    </table>`;
  }

  if (type === 'coord' || type === 'comprehensive') {
    titleText = titleText || 'Interdepartmental Issues Report';
    const coordRecs = data.filter(r => r.coordRequired || r.priority==='urgent' || r.priority==='high');
    const deptPairs = {};
    coordRecs.forEach(r => {
      if (r.concernedDepts && r.concernedDepts.length) {
        r.concernedDepts.forEach(d => {
          const key = [r.department, d].sort().join(' ↔ ');
          if (!deptPairs[key]) deptPairs[key] = [];
          deptPairs[key].push(r);
        });
      }
    });
    sections += `<h2>🔗 Interdepartmental Issues &amp; Coordination</h2>
    <div class="stat-grid">
      <div class="stat"><div class="val">${coordRecs.length}</div><div class="lbl">Flagged Issues</div></div>
      <div class="stat"><div class="val">${data.filter(r=>r.priority==='urgent').length}</div><div class="lbl">Urgent</div></div>
      <div class="stat"><div class="val">${data.filter(r=>r.followup==='urgent'||r.followup==='scheduled').length}</div><div class="lbl">Follow-ups Pending</div></div>
      <div class="stat"><div class="val">${Object.keys(deptPairs).length}</div><div class="lbl">Dept Pairs</div></div>
    </div>
    ${Object.keys(deptPairs).length ? `
    <h3>Inter-Department Linkages</h3>
    <table>
      <tr><th>Departments Involved</th><th>Cases</th><th>Locations</th></tr>
      ${Object.entries(deptPairs).sort((a,b)=>b[1].length-a[1].length).map(([pair,recs])=>`<tr>
        <td><strong>${esc(pair)}</strong></td>
        <td style="text-align:center;font-weight:700;color:#1A73E8">${recs.length}</td>
        <td style="font-size:11px">${[...new Set(recs.map(r=>r.location||r.block).filter(Boolean))].slice(0,3).join(', ')}</td>
      </tr>`).join('')}
    </table>` : '<p style="color:#5F6368;font-style:italic">No interdepartmental coordination cases in selected period.</p>'}
    <h3>Field Observations</h3>
    <table>
      <colgroup><col style="width:16%"><col style="width:9%"><col style="width:58%"><col style="width:17%"></colgroup>
      <tr><th>Officer</th><th>Priority</th><th>Field Observation</th><th>Departments Involved</th></tr>
      ${data.filter(r=>r.remarks && r.remarks.trim()).map(r=>`<tr>
        <td><strong>${esc(r.officerName)}</strong><br><span style="font-size:10px;color:#5F6368">${esc(r.department||'—')} · ${esc(r.location||r.block||'—')} · ${r.datetime?new Date(r.datetime).toLocaleDateString('en-IN'):'—'}</span></td>
        <td><span class="badge b-${r.priority||'low'}">${(r.priority||'low').toUpperCase()}</span></td>
        <td style="font-size:12px;white-space:pre-wrap">${esc(r.remarks)||'—'}</td>
        <td style="font-size:11px">${esc((r.concernedDepts||[]).join(', '))||'—'}</td>
      </tr>`).join('')}
    </table>`;
  }

  if (type === 'dept' || type === 'comprehensive') {
    titleText = titleText || 'Department-wise Inspection Report';
    const dm = {};
    data.forEach(r => {
      const d = r.department || 'Unknown';
      if (!dm[d]) dm[d] = { dept:d, total:0, urgent:0, high:0, officers:new Set(), locations:new Set() };
      const o = dm[d];
      o.total++;
      if (r.priority==='urgent') o.urgent++;
      if (r.priority==='high')   o.high++;
      if (r.officerName) o.officers.add(r.officerName);
      if (r.location||r.block) o.locations.add(r.location||r.block);
    });
    const depts = Object.values(dm).sort((a,b)=>b.total-a.total);
    sections += `<h2>🏢 Department-wise Inspection Coverage</h2>
    <div class="stat-grid">
      <div class="stat"><div class="val">${depts.length}</div><div class="lbl">Departments</div></div>
      <div class="stat"><div class="val">${data.length}</div><div class="lbl">Total Inspections</div></div>
      <div class="stat"><div class="val">${depts[0]?.dept||'—'}</div><div class="lbl">Most Inspected</div></div>
    </div>
    <table>
      <tr><th>#</th><th>Department</th><th>Total</th><th>Urgent</th><th>High</th><th>Officers</th><th>Locations Covered</th></tr>
      ${depts.map((d,i)=>`<tr>
        <td>${i+1}</td>
        <td><strong>${esc(d.dept)}</strong></td>
        <td style="text-align:center;font-weight:700;color:#1A73E8">${d.total}</td>
        <td style="text-align:center;color:${d.urgent>0?'#B71C1C':'#5F6368'}">${d.urgent||'—'}</td>
        <td style="text-align:center;color:${d.high>0?'#E65100':'#5F6368'}">${d.high||'—'}</td>
        <td style="text-align:center">${d.officers.size}</td>
        <td style="font-size:11px">${[...d.locations].slice(0,4).join(', ')+(d.locations.size>4?` +${d.locations.size-4} more`:'')}</td>
      </tr>`).join('')}
    </table>`;
    if (type === 'dept') {
      depts.forEach(d => {
        const visits = data.filter(r => (r.department || 'Unknown') === d.dept).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        sections += `<div style="page-break-before:always"></div>
        <h2>${esc(d.dept)} <span style="font-weight:400;color:#5F6368;font-size:13px">· ${d.total} visit${d.total > 1 ? 's' : ''} · ${d.officers.size} officer${d.officers.size > 1 ? 's' : ''}</span></h2>
        <table>
          <tr><th>#</th><th>Date</th><th>Officer</th><th>Place</th><th>Priority</th><th>Remarks</th><th>Follow-up</th></tr>
          ${visits.map((r, i) => `<tr>
            <td>${i + 1}</td>
            <td style="white-space:nowrap">${new Date(r.datetime || r.createdAt).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}</td>
            <td><strong>${esc(r.officerName || r.submittedBy || '—')}</strong><br><span style="font-size:11px;color:#5F6368">${esc(r.designation || '')}</span></td>
            <td>${esc([r.location, r.block && r.block !== r.location ? r.block : ''].filter(Boolean).join(', ') || '—')}</td>
            <td><span class="badge b-${r.priority || 'low'}">${(r.priority || 'low').toUpperCase()}</span></td>
            <td style="font-size:12px;white-space:pre-wrap">${esc(r.remarks) || '—'}</td>
            <td style="font-size:11px">${r.followup && r.followup !== 'none' ? esc(r.followup) + (r.followupDate ? ' · ' + esc(r.followupDate) : '') : '—'}${r.coordRequired ? '<br>🔗 ' + esc((r.concernedDepts || []).join(', ')) : ''}</td>
          </tr>`).join('')}
        </table>`;
      });
    }
  }

  if (type === 'village' || type === 'comprehensive') {
    titleText = titleText || 'Village & Location Coverage Report';
    const lm = {};
    data.forEach(r => {
      const loc = (r.location || r.block || '').trim();
      if (!loc) return;
      if (!lm[loc]) lm[loc] = { loc, block:r.block||'', total:0, officers:new Set(), depts:new Set(), gps:0 };
      const o = lm[loc];
      o.total++;
      if (r.officerName) o.officers.add(r.officerName);
      if (r.department)  o.depts.add(r.department);
      if (r.lat&&r.lng)  o.gps++;
    });
    const locs = Object.values(lm).sort((a,b)=>b.total-a.total);
    const blocks = {};
    data.forEach(r => { if(r.block) blocks[r.block]=(blocks[r.block]||0)+1; });
    sections += `<h2>📍 Village &amp; Location Coverage</h2>
    <div class="stat-grid">
      <div class="stat"><div class="val">${locs.length}</div><div class="lbl">Villages/Locations</div></div>
      <div class="stat"><div class="val">${Object.keys(blocks).length}</div><div class="lbl">Blocks Covered</div></div>
      <div class="stat"><div class="val">${data.filter(r=>r.lat&&r.lng).length}</div><div class="lbl">GPS Tagged</div></div>
    </div>
    ${Object.keys(blocks).length ? `
    <h3>Block-wise Summary</h3>
    <table>
      <tr><th>Block</th><th>Inspections</th></tr>
      ${Object.entries(blocks).sort((a,b)=>b[1]-a[1]).map(([b,c])=>`<tr><td>${esc(b)}</td><td style="font-weight:700;color:#1A73E8">${c}</td></tr>`).join('')}
    </table>` : ''}
    <h3>Village / Location Detail</h3>
    <table>
      <tr><th>#</th><th>Location</th><th>Block</th><th>Total</th><th>Officers</th><th>Departments</th><th>GPS Tagged</th></tr>
      ${locs.map((l,i)=>`<tr>
        <td>${i+1}</td>
        <td><strong>${esc(l.loc)}</strong></td>
        <td style="font-size:11px;color:#5F6368">${esc(l.block)||'—'}</td>
        <td style="text-align:center;font-weight:700;color:#1A73E8">${l.total}</td>
        <td style="font-size:11px">${[...l.officers].join(', ')||'—'}</td>
        <td style="font-size:11px">${[...l.depts].join(', ')||'—'}</td>
        <td style="text-align:center">${l.gps>0?`✅ ${l.gps}`:'—'}</td>
      </tr>`).join('')}
    </table>`;
  }

  if (!titleText) titleText = 'Field Inspection Report';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${titleText} — Mayiladuthurai</title>
<style>${reportStyle}</style></head><body>
<div class="cover">
  <h1>🏛️ Mayiladuthurai District Collectorate</h1>
  <div style="font-size:18px;font-weight:600;margin-top:8px">${titleText}</div>
  <div class="sub">Field Inspection Monitoring System</div>
  <div class="meta">${dlFilterSummary() ? esc(dlFilterSummary()) + ' &nbsp;·&nbsp; ' : ''}Period: ${period} &nbsp;·&nbsp; Records: ${data.length} &nbsp;·&nbsp; Generated: ${generated}</div>
</div>
${sections}
<div class="footer">Mayiladuthurai District Field Inspection System · ${titleText} · Period: ${period} · Generated: ${generated}</div>
</body></html>`;

  if (format === 'pdf') {

    const win = window.open('', '_blank');
    if (!win) { toast('⚠️ Allow pop-ups to generate PDF', 'warn'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 600);
    toast('📄 Report opened — use "Save as PDF" in the print dialog', 'success');
  } else {

    const blob = new Blob(['﻿' + html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${titleText.replace(/[^a-zA-Z0-9]/g,'_')}_${today()}.doc`;
    a.click();
    toast('📝 Word document downloaded successfully', 'success');
  }
}

function downloadSingleById(id) {
  const r = APP.records.find(x => x.id===id);
  if (!r) { toast('Record not found','warn'); return; }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Inspection Report — ${r.officerName}</title>
<style>
  body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;padding:32px;color:#1A2438;font-size:13px;border:1px solid #DDD}
  .header{background:linear-gradient(135deg,#0C1A2E,#1E3A5F);color:white;padding:24px;margin-bottom:24px}
  .header h1{font-size:20px;margin-bottom:4px}
  .ref{font-family:monospace;font-size:11px;opacity:.6}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
  .field label{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#6B7A94;font-weight:700}
  .field p{font-size:13px;font-weight:600;margin-top:3px;color:#1A2438}
  .remarks{background:#F5F5F2;border-left:3px solid #E8650A;padding:14px;border-radius:0 6px 6px 0;margin-bottom:16px;font-size:13px;line-height:1.7}
  .coord-box{background:#EBF5FC;border:1px solid #C0D8ED;border-radius:6px;padding:14px;margin-bottom:16px}
  .badge{display:inline-block;padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700}
  .b-urgent{background:#FCECEA;color:#B5220E}.b-high{background:#FFF4EB;color:#E8650A}
  .b-medium{background:#FEFBEA;color:#C8960C}.b-low{background:#E6F5F1;color:#0A7055}
  .footer{margin-top:24px;border-top:1px solid #EEE;padding-top:12px;font-size:10px;color:#AAA;text-align:center}
  .sign{margin-top:48px;display:grid;grid-template-columns:1fr 1fr;gap:40px}
  .sign-box{border-top:1px solid #333;padding-top:8px;font-size:11px;color:#6B7A94;text-align:center}
  @media print{body{border:none;margin:0;padding:24px}}

/* ─── Custom Designation Row ─── */
#custom-desig-row { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-top:8px; }

/* ─── Records Sort Buttons ─── */
#rec-sort-date, #rec-sort-officer, #rec-sort-dept, #rec-sort-prio {
  transition: all .15s;
  font-weight: 600;
}

/* ─── Absent Officers Result ─── */
#absent-officers-result table th,
#absent-officers-result table td {
  vertical-align: middle;
}

/* ─── Records table active rows ─── */
#records-tbody tr:hover td { color: var(--ink); }
.table-shell th { cursor:pointer; user-select:none; }
.table-shell th:hover { background: rgba(255,255,255,.08); }
</style></head><body>
<div class="header">
  <h1>Field Inspection Report</h1>
  <div class="ref">Ref: ${r.id} · ${r.synced?'SYNCED TO FIREBASE':'LOCAL RECORD'}</div>
</div>
<div class="grid">
  <div class="field"><label>Department</label><p>${esc(r.department)}</p></div>
  <div class="field"><label>Officer Name</label><p>${esc(r.officerName)}</p></div>
  <div class="field"><label>Designation</label><p>${esc(r.designation)}</p></div>
  <div class="field"><label>Date & Time</label><p>${r.datetime?new Date(r.datetime).toLocaleString('en-IN'):''}</p></div>
  <div class="field"><label>Inspection Location</label><p>${esc(r.location)}</p></div>
  <div class="field"><label>Block / Taluk</label><p>${esc(r.block)||'—'}</p></div>
  <div class="field"><label>Priority</label><p><span class="badge b-${r.priority}">${r.priority}</span></p></div>
  <div class="field"><label>GPS Coordinates</label><p>${r.lat&&r.lng?`${r.lat}, ${r.lng}`:'Not captured'}</p></div>
</div>
<div class="field" style="margin-bottom:14px"><label>Observations & Remarks</label></div>
<div class="remarks">${esc(r.remarks)}</div>
${r.coordRequired?`<div class="coord-box"><strong style="color:#0B6FAD">🔗 Inter-departmental Coordination Required</strong><br>
<p style="margin-top:8px"><strong>Departments:</strong> ${(r.concernedDepts||[]).join(', ')||'—'}</p>
${r.coordNotes?`<p style="margin-top:4px">${esc(r.coordNotes)}</p>`:''}
</div>`:''}
<div class="grid">
  <div class="field"><label>Follow-up Required</label><p>${r.followup||'None'}</p></div>
  <div class="field"><label>Follow-up Date</label><p>${r.followupDate||'—'}</p></div>
  <div class="field"><label>Photos Attached</label><p>${r.photoCount||0} photo(s)</p></div>
  <div class="field"><label>Submitted By</label><p>${esc(r.submittedBy||r.officerName)}</p></div>
</div>
<div class="sign">
  <div class="sign-box">Signature of Inspecting Officer<br><br>${esc(r.officerName)}<br>${esc(r.designation)}</div>
  <div class="sign-box">Signature of Reviewing Authority<br><br>District Collectorate</div>
</div>
<div class="footer">Field Inspection System · Generated: ${new Date().toLocaleString('en-IN')}</div>
</body></html>`;

  dlFile(`Inspection_${r.officerName.replace(/\s+/g,'_')}_${today()}.html`, html, 'text/html');
  toast('📋 Single report downloaded','success');
}

function generateWeeklyReport(format) {
  const { from, to } = getWeekRange();
  const weekRecs = APP.records.filter(r => {
    const d = new Date(r.createdAt || r.datetime);
    return d >= from && d <= to;
  });

  const BLOCKS   = ['Mayiladuthurai','Sirkazhi','Kuthalam','Kollidam','Sembanarkoil','Tharangambadi','Poompuhar'];
  const DAYS     = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const cfg      = getAdminConfig();

  const fmtDate  = d => d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  const weekLabel= `${fmtDate(from)} to ${fmtDate(to)}`;

  const allKnown = new Set(APP.records.map(r => (r.officerName||r.submittedBy||'').trim()).filter(Boolean));
  const oMap = {};
  allKnown.forEach(n => {
    oMap[n] = {name:n, dept:'—', desig:'—', days:new Set(), count:0, blocks:new Set(),
               open:0, inprog:0, resolved:0, urgent:0, high:0, coord:0, inspTypes:{}};
  });
  weekRecs.forEach(r => {
    const name = (r.officerName||r.submittedBy||'').trim();
    if (!name) return;
    if (!oMap[name]) oMap[name] = {name, dept:'—', desig:'—', days:new Set(), count:0, blocks:new Set(), open:0, inprog:0, resolved:0, urgent:0, high:0, coord:0, inspTypes:{}};
    const o = oMap[name];
    if (r.department && r.department !== '—') o.dept = r.department;
    if (r.designation) o.desig = r.designation;
    o.count++;
    const d = new Date(r.createdAt||r.datetime);
    o.days.add(d.toISOString().slice(0,10));
    if (r.block) o.blocks.add(r.block);
    const rs = r.resolutionStatus||'open';
    if (rs==='open') o.open++;
    else if (rs==='in_progress') o.inprog++;
    else if (rs==='resolved') o.resolved++;
    if (r.priority==='urgent') o.urgent++;
    if (r.priority==='high')   o.high++;
    if (r.coordRequired)       o.coord++;
    const it = r.inspType||'routine';
    o.inspTypes[it] = (o.inspTypes[it]||0)+1;
  });
  const activeOfficers = Object.values(oMap).filter(o => o.count > 0).sort((a,b) => b.count - a.count);
  const zeroOfficers   = Object.values(oMap).filter(o => o.count === 0);

  const dayMap = {};
  weekRecs.forEach(r => {
    const ds = new Date(r.createdAt||r.datetime).toISOString().slice(0,10);
    if (!dayMap[ds]) dayMap[ds] = {count:0, officers:new Set()};
    dayMap[ds].count++;
    dayMap[ds].officers.add((r.officerName||r.submittedBy||'').trim());
  });

  const dayRows = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(from); d.setDate(from.getDate() + i);
    const ds = d.toISOString().slice(0,10);
    const data = dayMap[ds] || {count:0, officers:new Set()};
    dayRows.push({day: DAYS[i], date: fmtDate(d), ds, count: data.count, officers: data.officers.size});
  }

  const deptMap = {};
  weekRecs.forEach(r => {
    const d = r.department||'Unknown';
    if (!deptMap[d]) deptMap[d] = {count:0, open:0, resolved:0, blocks:new Set()};
    deptMap[d].count++;
    if ((r.resolutionStatus||'open')==='open') deptMap[d].open++;
    if (r.resolutionStatus==='resolved') deptMap[d].resolved++;
    if (r.block) deptMap[d].blocks.add(r.block);
  });
  const deptRows = Object.entries(deptMap).sort((a,b) => b[1].count - a[1].count);

  const typeMap = {};
  weekRecs.forEach(r => {
    const t = r.inspType||'routine';
    typeMap[t] = (typeMap[t]||0)+1;
  });
  const typeLabels = {routine:'🔵 Routine',complaint:'📢 Public Complaint',newspaper:'📰 Newspaper',special_drive:'🚨 Special Drive',court_order:'⚖️ Court Order',superior_order:'👆 Superior\'s Direction'};

  const prioMap = {urgent:0, high:0, medium:0, low:0};
  weekRecs.forEach(r => { const p = r.priority||'medium'; if (p in prioMap) prioMap[p]++; });

  const blockOfficers = {};
  weekRecs.forEach(r => {
    if (!r.block) return;
    if (!blockOfficers[r.block]) blockOfficers[r.block] = new Set();
    blockOfficers[r.block].add((r.officerName||r.submittedBy||'').trim());
  });

  const coordRecs = weekRecs.filter(r => r.coordRequired && r.concernedDepts?.length);

  const toStr = to.toISOString().slice(0,10);
  const overdueFollowups = APP.records.filter(r =>
    r.followupDate && r.followupDate <= toStr && (r.followup||'none') !== 'none' && (r.resolutionStatus||'open') !== 'resolved'
  );

  const totalOpen     = weekRecs.filter(r => (r.resolutionStatus||'open')==='open').length;
  const totalResolved = weekRecs.filter(r => r.resolutionStatus==='resolved').length;
  const totalInprog   = weekRecs.filter(r => r.resolutionStatus==='in_progress').length;
  const totalCoord    = weekRecs.filter(r => r.coordRequired).length;
  const allBlocks     = new Set(weekRecs.map(r=>r.block).filter(Boolean));
  const resolutionRate= weekRecs.length > 0 ? Math.round(totalResolved/weekRecs.length*100) : 0;

  if (format === 'excel') {

    if (typeof XLSX === 'undefined') { toast('⚠️ Excel library not loaded','warn'); return; }
    const wb = XLSX.utils.book_new();

    const s1 = [
      ['MAYILADUTHURAI DISTRICT — WEEKLY FIELD INSPECTION REPORT'],
      ['Week:', weekLabel],
      ['Generated:', new Date().toLocaleString('en-IN')],
      [],
      ['EXECUTIVE SUMMARY'],
      ['Total Inspections', weekRecs.length],
      ['Active Officers',   activeOfficers.length],
      ['Zero-Submission Officers', zeroOfficers.length],
      ['Blocks Covered',   allBlocks.size + ' / 7'],
      ['Open Issues',      totalOpen],
      ['In Progress',      totalInprog],
      ['Resolved',         totalResolved],
      ['Resolution Rate',  resolutionRate + '%'],
      ['Coordination Issues', totalCoord],
      ['Overdue Follow-ups',  overdueFollowups.length],
      [],
      ['DAY-WISE ACTIVITY'],
      ['Day','Date','Inspections','Active Officers']
    ];
    dayRows.forEach(r => s1.push([r.day, r.date, r.count, r.officers]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s1), 'Summary');

    const s2 = [
      ['OFFICER PERFORMANCE — WEEK: ' + weekLabel],
      [],
      ['#','Officer','Designation','Department','Inspections','Active Days','Blocks Visited','Blocks Count','Open','In Progress','Resolved','Resolution %','Urgent','High','Coord Issues','Daily Target Status','Weekly Target Status']
    ];
    [...activeOfficers, ...zeroOfficers].forEach((o,i) => {
      const tot = o.open+o.inprog+o.resolved;
      const rate = tot>0 ? Math.round(o.resolved/tot*100) : 0;
      const dailySt  = cfg.minDaily  ? (o.count >= cfg.minDaily * 5 ? '✅ Met' : `❌ ${o.count}/${cfg.minDaily*5}`) : '—';
      const weeklySt = cfg.minWeekly ? (o.count >= cfg.minWeekly    ? '✅ Met' : `❌ ${o.count}/${cfg.minWeekly}`) : '—';
      s2.push([i+1, o.name, o.desig, o.dept, o.count, o.days.size, [...o.blocks].join(', ')||'—', o.blocks.size, o.open, o.inprog, o.resolved, rate+'%', o.urgent, o.high, o.coord, dailySt, weeklySt]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s2), 'Officer Performance');

    const s3 = [['BLOCK COVERAGE — WEEK: '+weekLabel],[]];
    s3.push(['Officer','Department',...BLOCKS,'Total Blocks','Coverage %']);
    activeOfficers.forEach(o => {
      const bCnts = {};
      weekRecs.filter(r=>(r.officerName||r.submittedBy||'').trim()===o.name).forEach(r=>{ if(r.block) bCnts[r.block]=(bCnts[r.block]||0)+1; });
      const cov = BLOCKS.filter(b=>bCnts[b]>0).length;
      s3.push([o.name, o.dept, ...BLOCKS.map(b=>bCnts[b]||0), cov, Math.round(cov/BLOCKS.length*100)+'%']);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s3), 'Block Coverage');

    const s4 = [['ISSUES & RESOLUTION — WEEK: '+weekLabel],[],['#','Date','Officer','Department','Location','Block','Priority','Status','Remarks']];
    weekRecs.filter(r=>(r.resolutionStatus||'open')!=='resolved').sort((a,b)=>{
      const po={urgent:0,high:1,medium:2,low:3}; return (po[a.priority]||2)-(po[b.priority]||2);
    }).forEach((r,i) => {
      s4.push([i+1, r.createdAt?.slice(0,10)||'—', r.officerName||'—', r.department||'—', r.location||'—', r.block||'—', r.priority||'medium', r.resolutionStatus||'open', (r.remarks||'').slice(0,120)]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s4), 'Open Issues');

    const s5 = [['OFFICERS WITH ZERO SUBMISSIONS — WEEK: '+weekLabel],[],['#','Officer Name','Department','Last Known Submission']];
    zeroOfficers.forEach((o,i) => {
      const lastRec = APP.records.filter(r=>(r.officerName||r.submittedBy||'').trim()===o.name).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0];
      const lastDate = lastRec ? new Date(lastRec.createdAt).toLocaleDateString('en-IN') : 'Never';
      s5.push([i+1, o.name, o.dept, lastDate]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s5), 'Zero Submissions');

    const filename = `MLD_Weekly_Report_${from.toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast('📊 Weekly Excel exported — 5 sheets', 'success');
    return;
  }

  const barMax = Math.max(...dayRows.map(r=>r.count), 1);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Weekly Field Inspection Report — ${weekLabel}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;color:#202124;font-size:12px;padding:0}
    .cover{background:linear-gradient(135deg,#1A73E8 0%,#0D47A1 100%);color:white;padding:36px 40px;page-break-after:always}
    .cover h1{font-size:26px;margin-bottom:6px}
    .cover .sub{opacity:.85;font-size:14px;margin-bottom:4px}
    .cover .meta{opacity:.7;font-size:12px;margin-top:12px}
    .cover-kpis{display:flex;flex-wrap:wrap;gap:14px;margin-top:24px}
    .ck{background:rgba(255,255,255,.15);border-radius:10px;padding:12px 18px;min-width:100px;text-align:center}
    .ck .v{font-size:28px;font-weight:700}
    .ck .l{font-size:11px;opacity:.8;margin-top:3px}
    .page{padding:28px 32px}
    h2{color:#1A73E8;font-size:15px;border-bottom:2px solid #E8F0FE;padding-bottom:6px;margin:22px 0 12px}
    h3{color:#333;font-size:13px;margin:16px 0 8px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:11.5px}
    th{background:#1A73E8;color:white;padding:7px 8px;text-align:left;font-weight:600;font-size:11px}
    td{padding:6px 8px;border-bottom:1px solid #EEEEEE}
    tr:nth-child(even) td{background:#F8F9FA}
    .flag td{background:#FFF5F5!important}
    .flag td:first-child{border-left:3px solid #EA4335}
    .badge{border-radius:12px;padding:2px 8px;font-size:10px;font-weight:700;white-space:nowrap}
    .b-green{background:#E8F5E9;color:#1B5E20}
    .b-red{background:#FFEBEE;color:#B71C1C}
    .b-orange{background:#FFF3E0;color:#E65100}
    .b-grey{background:#F5F5F5;color:#757575}
    .kpi-row{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px}
    .kpi-box{border-radius:10px;padding:12px 16px;min-width:90px;text-align:center;border:1px solid #e0e0e0}
    .kpi-box .v{font-size:22px;font-weight:700}
    .kpi-box .l{font-size:10px;color:#666;margin-top:2px}
    .bar-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
    .bar-label{width:90px;font-size:11px;text-align:right;flex-shrink:0}
    .bar-wrap{flex:1;background:#E8EAF6;border-radius:4px;height:22px;position:relative}
    .bar-fill{height:100%;border-radius:4px;transition:.3s;display:flex;align-items:center;padding-left:6px;font-size:10px;font-weight:700;color:white}
    .bar-cnt{position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:10px;font-weight:700;color:#333}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}
    .section-note{font-size:11px;color:#9E9E9E;margin-top:-8px;margin-bottom:14px}
    .block-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}
    .block-cell{border-radius:8px;padding:10px 8px;text-align:center;font-size:11px}
    .block-cell .cnt{font-size:18px;font-weight:700;margin-bottom:2px}
    .footer{font-size:10px;color:#9E9E9E;border-top:1px solid #eee;padding-top:8px;margin-top:30px}
    .pg-break{page-break-before:always}
    @media print{
      .cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      th{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    }
  </style></head><body>
  <!-- ═══ COVER PAGE ═══ -->
  <div class="cover">
    <div style="font-size:13px;opacity:.7;margin-bottom:10px">🏛 MAYILADUTHURAI DISTRICT ADMINISTRATION</div>
    <h1>📅 Weekly Field Inspection Report</h1>
    <div class="sub">Week: <strong>${weekLabel}</strong></div>
    <div class="meta">Generated on: ${new Date().toLocaleString('en-IN')} &nbsp;·&nbsp; Total Officers in System: ${allKnown.size}</div>
    <div class="cover-kpis">
      <div class="ck"><div class="v">${weekRecs.length}</div><div class="l">Total Inspections</div></div>
      <div class="ck"><div class="v">${activeOfficers.length}</div><div class="l">Active Officers</div></div>
      <div class="ck"><div class="v">${zeroOfficers.length}</div><div class="l">Zero Submissions</div></div>
      <div class="ck"><div class="v">${allBlocks.size}/7</div><div class="l">Blocks Covered</div></div>
      <div class="ck"><div class="v">${totalOpen}</div><div class="l">Open Issues</div></div>
      <div class="ck"><div class="v">${totalResolved}</div><div class="l">Resolved</div></div>
      <div class="ck"><div class="v">${resolutionRate}%</div><div class="l">Resolution Rate</div></div>
      <div class="ck"><div class="v">${totalCoord}</div><div class="l">Coord. Issues</div></div>
    </div>
  </div>
  <!-- ═══ PAGE 2 — Day-wise + Dept + Types ═══ -->
  <div class="page">
    <h2>📊 1. Executive Summary &amp; Day-wise Activity</h2>
    <div class="kpi-row">
      <div class="kpi-box"><div class="v" style="color:#1A73E8">${weekRecs.length}</div><div class="l">Total Inspections</div></div>
      <div class="kpi-box"><div class="v" style="color:#1B5E20">${activeOfficers.length}</div><div class="l">Active Officers</div></div>
      <div class="kpi-box"><div class="v" style="color:#B71C1C">${zeroOfficers.length}</div><div class="l">No Submission</div></div>
      <div class="kpi-box"><div class="v" style="color:#E65100">${allBlocks.size}</div><div class="l">Blocks Covered</div></div>
      <div class="kpi-box"><div class="v" style="color:#B71C1C">${totalOpen}</div><div class="l">Open Issues</div></div>
      <div class="kpi-box"><div class="v" style="color:#E65100">${totalInprog}</div><div class="l">In Progress</div></div>
      <div class="kpi-box"><div class="v" style="color:#1B5E20">${totalResolved}</div><div class="l">Resolved</div></div>
      <div class="kpi-box"><div class="v" style="color:#6A1B9A">${totalCoord}</div><div class="l">Coord. Issues</div></div>
    </div>
    <h3>Day-wise Inspection Count</h3>
    ${dayRows.map(r => {
      const w = barMax > 0 ? Math.round(r.count/barMax*100) : 0;
      const bg = r.count===0 ? '#BDBDBD' : r.count >= Math.ceil(weekRecs.length/5) ? '#1B5E20' : '#1A73E8';
      return `<div class="bar-row">
        <div class="bar-label"><b>${r.day.slice(0,3)}</b> ${r.date}</div>
        <div class="bar-wrap">
          <div class="bar-fill" style="width:${Math.max(w,3)}%;background:${bg}">
            ${r.count > 0 ? r.count+' insp' : ''}
          </div>
          <span class="bar-cnt">${r.officers} officer${r.officers!==1?'s':''}</span>
        </div>
      </div>`;
    }).join('')}
    <div class="two-col" style="margin-top:20px">
      <div>
        <h3>Inspection Type Breakdown</h3>
        <table><thead><tr><th>Type</th><th style="text-align:center">Count</th><th style="text-align:center">%</th></tr></thead><tbody>
        ${Object.entries(typeMap).sort((a,b)=>b[1]-a[1]).map(([t,c]) =>
          `<tr><td>${typeLabels[t]||t}</td><td style="text-align:center;font-weight:700">${c}</td><td style="text-align:center">${weekRecs.length>0?Math.round(c/weekRecs.length*100):0}%</td></tr>`
        ).join('')}
        </tbody></table>
      </div>
      <div>
        <h3>Priority Distribution</h3>
        <table><thead><tr><th>Priority</th><th style="text-align:center">Count</th></tr></thead><tbody>
          <tr><td>🔴 Urgent</td><td style="text-align:center;font-weight:700;color:#B71C1C">${prioMap.urgent}</td></tr>
          <tr><td>🟠 High</td><td style="text-align:center;font-weight:700;color:#E65100">${prioMap.high}</td></tr>
          <tr><td>🟡 Medium</td><td style="text-align:center;font-weight:700;color:#7c4d00">${prioMap.medium}</td></tr>
          <tr><td>🟢 Low</td><td style="text-align:center;font-weight:700;color:#1B5E20">${prioMap.low}</td></tr>
        </tbody></table>
        <h3 style="margin-top:12px">Department Summary</h3>
        <table><thead><tr><th>Department</th><th style="text-align:center">Insp.</th><th style="text-align:center">Open</th><th style="text-align:center">Resolved</th></tr></thead><tbody>
        ${deptRows.map(([d,v]) =>
          `<tr><td>${esc(d)}</td><td style="text-align:center;font-weight:700">${v.count}</td><td style="text-align:center;color:#B71C1C">${v.open}</td><td style="text-align:center;color:#1B5E20">${v.resolved}</td></tr>`
        ).join('')}
        </tbody></table>
      </div>
    </div>
    <div class="footer">Mayiladuthurai District Field Inspection System · Weekly Report · ${weekLabel} · Page 1</div>
  </div>
  <!-- ═══ PAGE 3 — Block Coverage ═══ -->
  <div class="page pg-break">
    <h2>🗺 2. Block Coverage Analysis</h2>
    <p class="section-note">Inspections conducted across all 7 blocks of Mayiladuthurai District during the week</p>
    <div class="block-grid">
    ${BLOCKS.map(b => {
      const cnt = (blockOfficers[b]||new Set()).size > 0 ? weekRecs.filter(r=>r.block===b).length : 0;
      const offs = (blockOfficers[b]||new Set()).size;
      const covered = cnt > 0;
      return `<div class="block-cell" style="background:${covered?'#C8E6C9':'#FFCDD2'};border:1px solid ${covered?'#66BB6A':'#EF9A9A'}">
        <div class="cnt" style="color:${covered?'#1B5E20':'#B71C1C'}">${cnt}</div>
        <div style="font-weight:700;font-size:11px">${b}</div>
        <div style="font-size:10px;color:${covered?'#388E3C':'#C62828'};margin-top:2px">${offs} officer${offs!==1?'s':''}</div>
      </div>`;
    }).join('')}
    </div>
    <h3>Officer × Block Matrix (This Week)</h3>
    <div style="overflow-x:auto">
    <table><thead><tr>
      <th style="min-width:130px">Officer</th><th>Dept</th>
      ${BLOCKS.map(b=>`<th style="text-align:center;font-size:10px;white-space:nowrap">${b.slice(0,8)}</th>`).join('')}
      <th style="text-align:center">Coverage</th>
    </tr></thead><tbody>
    ${activeOfficers.map(o => {
      const bCnts = {};
      weekRecs.filter(r=>(r.officerName||r.submittedBy||'').trim()===o.name).forEach(r=>{ if(r.block) bCnts[r.block]=(bCnts[r.block]||0)+1; });
      const cov = BLOCKS.filter(b=>bCnts[b]>0).length;
      const pct = Math.round(cov/BLOCKS.length*100);
      return `<tr>
        <td style="font-weight:600">${esc(o.name)}</td>
        <td style="font-size:11px">${esc(o.dept)}</td>
        ${BLOCKS.map(b => {
          const c = bCnts[b]||0;
          return `<td style="text-align:center;background:${c>0?'#C8E6C9':'#FFCDD2'};color:${c>0?'#1B5E20':'#B71C1C'};font-weight:700;font-size:11px">${c||'✗'}</td>`;
        }).join('')}
        <td style="text-align:center;font-weight:700;color:${pct>=80?'#1B5E20':pct>=40?'#E65100':'#B71C1C'}">${pct}%</td>
      </tr>`;
    }).join('')}
    </tbody></table>
    </div>
    <div class="footer">Mayiladuthurai District Field Inspection System · Weekly Report · ${weekLabel} · Page 2</div>
  </div>
  <!-- ═══ PAGE 4 — Officer Performance ═══ -->
  <div class="page pg-break">
    <h2>👥 3. Officer Performance Table</h2>
    <p class="section-note">All officers ranked by inspections submitted this week. ${cfg.minWeekly ? 'Min weekly target: <b>'+cfg.minWeekly+'</b> · ' : ''}Highlighted rows = below minimum threshold</p>
    <table><thead><tr>
      <th>#</th><th>Officer Name</th><th>Designation</th><th>Dept</th>
      <th style="text-align:center">Insp.</th><th style="text-align:center">Days Active</th>
      <th style="text-align:center">Blocks</th><th style="text-align:center">Urgent</th>
      <th style="text-align:center">Open</th><th style="text-align:center">Resolved</th>
      <th style="text-align:center">Rate</th><th>Status</th>
    </tr></thead><tbody>
    ${activeOfficers.map((o,i) => {
      const tot = o.open+o.inprog+o.resolved;
      const rate = tot>0 ? Math.round(o.resolved/tot*100) : 0;
      const belowMin = cfg.minWeekly && o.count < cfg.minWeekly;
      const statusCls = o.count > 0 ? 'b-green' : 'b-red';
      return `<tr class="${belowMin?'flag':''}">
        <td>${i+1}</td>
        <td style="font-weight:700">${esc(o.name)}</td>
        <td style="font-size:11px">${esc(o.desig)}</td>
        <td style="font-size:11px">${esc(o.dept)}</td>
        <td style="text-align:center;font-weight:700;color:${o.count>0?'#1B5E20':'#9E9E9E'}">${o.count}${belowMin?'⚠️':''}</td>
        <td style="text-align:center">${o.days.size}</td>
        <td style="text-align:center">${o.blocks.size}/7</td>
        <td style="text-align:center;color:${o.urgent>0?'#B71C1C':'#999'}">${o.urgent}</td>
        <td style="text-align:center;color:#B71C1C">${o.open}</td>
        <td style="text-align:center;color:#1B5E20">${o.resolved}</td>
        <td style="text-align:center;font-weight:700;color:${rate>=70?'#1B5E20':rate>=40?'#E65100':'#B71C1C'}">${rate}%</td>
        <td><span class="badge ${statusCls}">${o.count>0?'🟢 Active':'🔴 Zero'}</span></td>
      </tr>`;
    }).join('')}
    </tbody></table>

    ${zeroOfficers.length > 0 ? `
    <h3 style="color:#B71C1C">⚠️ Officers with Zero Submissions This Week (${zeroOfficers.length})</h3>
    <table><thead><tr><th>#</th><th>Officer Name</th><th>Department</th><th>Last Known Submission</th></tr></thead><tbody>
    ${zeroOfficers.map((o,i) => {
      const lastRec = APP.records.filter(r=>(r.officerName||r.submittedBy||'').trim()===o.name).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0];
      const lastDate = lastRec ? new Date(lastRec.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : 'Never';
      return `<tr class="flag"><td>${i+1}</td><td style="font-weight:700">${esc(o.name)}</td><td>${esc(o.dept)}</td><td>${lastDate}</td></tr>`;
    }).join('')}
    </tbody></table>` : '<div style="background:#E8F5E9;border-radius:8px;padding:12px;color:#1B5E20;font-weight:600">✅ All officers submitted at least one inspection this week!</div>'}
    <div class="footer">Mayiladuthurai District Field Inspection System · Weekly Report · ${weekLabel} · Page 3</div>
  </div>
  <!-- ═══ PAGE 5 — Issues & Resolution ═══ -->
  <div class="page pg-break">
    <h2>🔧 4. Issues &amp; Resolution Status</h2>
    <div class="kpi-row">
      <div class="kpi-box"><div class="v" style="color:#B71C1C">${totalOpen}</div><div class="l">Open Issues</div></div>
      <div class="kpi-box"><div class="v" style="color:#E65100">${totalInprog}</div><div class="l">In Progress</div></div>
      <div class="kpi-box"><div class="v" style="color:#1B5E20">${totalResolved}</div><div class="l">Resolved</div></div>
      <div class="kpi-box"><div class="v" style="color:${resolutionRate>=70?'#1B5E20':resolutionRate>=40?'#E65100':'#B71C1C'}">${resolutionRate}%</div><div class="l">Resolution Rate</div></div>
      <div class="kpi-box"><div class="v" style="color:#6A1B9A">${totalCoord}</div><div class="l">Coord. Raised</div></div>
      <div class="kpi-box"><div class="v" style="color:#B71C1C">${overdueFollowups.length}</div><div class="l">Overdue Follow-ups</div></div>
    </div>
    <h3>🔴 Open &amp; In-Progress Issues (Priority Order)</h3>
    <table><colgroup><col style="width:3%"><col style="width:20%"><col style="width:8%"><col style="width:11%"><col style="width:58%"></colgroup>
    <thead><tr>
      <th>#</th><th>Officer</th><th>Priority</th><th>Status</th><th>Observation / Issues</th>
    </tr></thead><tbody>
    ${weekRecs.filter(r=>(r.resolutionStatus||'open')!=='resolved').sort((a,b)=>{
      const po={urgent:0,high:1,medium:2,low:3}; return (po[a.priority]||2)-(po[b.priority]||2);
    }).slice(0,30).map((r,i) => {
      const prioColors = {urgent:'#FFCDD2',high:'#FFE0B2',medium:'#FFF9C4',low:'#E8F5E9'};
      const dt = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : '—';
      return `<tr>
        <td>${i+1}</td>
        <td style="font-weight:600;font-size:11px">${esc(r.officerName||'—')}<br><span style="font-weight:400;font-size:10px;color:#666">${esc(r.location||'—')}${r.block?', '+esc(r.block):''} · ${typeLabels[r.inspType||'routine']||r.inspType||'Routine'} · ${dt}</span></td>
        <td style="background:${prioColors[r.priority]||'#fff'};font-weight:700;font-size:11px">${r.priority||'medium'}</td>
        <td><span class="badge ${r.resolutionStatus==='in_progress'?'b-orange':'b-red'}">${r.resolutionStatus==='in_progress'?'🟡 In Prog':'🔴 Open'}</span></td>
        <td style="font-size:12px;white-space:pre-wrap">${esc(r.remarks)||'—'}</td>
      </tr>`;
    }).join('')}
    </tbody></table>

    ${coordRecs.length > 0 ? `
    <h3>🤝 Inter-departmental Coordination Issues Raised</h3>
    <table><colgroup><col style="width:18%"><col style="width:20%"><col style="width:62%"></colgroup>
    <thead><tr><th>Raised By</th><th>Concerned Departments</th><th>Notes</th></tr></thead><tbody>
    ${coordRecs.slice(0,15).map((r,i) => `<tr>
      <td style="font-weight:600;font-size:11px">${esc(r.officerName||'—')}<br><span style="font-weight:400;font-size:10px;color:#666">${esc(r.location||'—')} · ${r.createdAt?.slice(0,10)||'—'}</span></td>
      <td style="font-size:11px">${esc((r.concernedDepts||[]).join(', '))}</td>
      <td style="font-size:12px;white-space:pre-wrap">${esc(r.coordNotes)||'—'}</td>
    </tr>`).join('')}
    </tbody></table>` : ''}

    ${overdueFollowups.length > 0 ? `
    <h3 style="color:#B71C1C">⏰ Overdue Follow-ups (${overdueFollowups.length})</h3>
    <table><thead><tr><th>#</th><th>Officer</th><th>Location</th><th>Due Date</th><th>Priority</th></tr></thead><tbody>
    ${overdueFollowups.slice(0,10).map((r,i) => `<tr class="flag">
      <td>${i+1}</td>
      <td style="font-weight:600">${esc(r.officerName||'—')}</td>
      <td>${esc(r.location||'—')}${r.block?', '+r.block:''}</td>
      <td style="color:#B71C1C;font-weight:700">${r.followupDate}</td>
      <td>${r.priority||'medium'}</td>
    </tr>`).join('')}
    </tbody></table>` : ''}
    <div class="footer">Mayiladuthurai District Field Inspection System · Weekly Report · ${weekLabel} · Page 4 · CONFIDENTIAL</div>
  </div>
  <script>window.onload=function(){window.print();};<\/script>
  </body></html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
  else toast('⚠️ Allow pop-ups to open the report', 'warn');
}

function exportMonitorExcel() {
  const recs = APP.records;
  const now  = new Date();
  const todayStr      = now.toISOString().slice(0,10);
  const thisWeekAgo   = new Date(now - 7*86400000);
  const thisMonthStart= new Date(now.getFullYear(), now.getMonth(), 1);
  const BLOCKS = ['Mayiladuthurai','Sirkazhi','Kuthalam','Kollidam','Sembanarkoil','Tharangambadi','Poompuhar'];

  const officerMap = {};
  recs.forEach(r => {
    const name = (r.officerName || r.submittedBy || '').trim();
    const dept = r.department || '—';
    if (!name) return;
    if (!officerMap[name]) officerMap[name] = {name, dept, today:0, week:0, month:0, total:recs.filter(x=>(x.officerName||x.submittedBy||'').trim()===name).length, lastDate:null, blocks:new Set(), open:0, inprog:0, resolved:0};
    const recDate = new Date(r.createdAt || r.datetime);
    if (recDate.toISOString().slice(0,10) === todayStr) officerMap[name].today++;
    if (recDate >= thisWeekAgo)    officerMap[name].week++;
    if (recDate >= thisMonthStart) officerMap[name].month++;
    if (!officerMap[name].lastDate || recDate > new Date(officerMap[name].lastDate)) officerMap[name].lastDate = recDate.toISOString();
    if (r.block) officerMap[name].blocks.add(r.block);
    const rs = r.resolutionStatus || 'open';
    if (rs === 'open') officerMap[name].open++;
    else if (rs === 'in_progress') officerMap[name].inprog++;
    else if (rs === 'resolved') officerMap[name].resolved++;
  });

  const cfg = getAdminConfig();
  const officers = Object.values(officerMap).sort((a,b) => b.month - a.month);

  const aoa1 = [
    ['Mayiladuthurai District — Field Officer Activity Report'],
    ['Generated:', new Date().toLocaleString('en-IN'), '', 'Total Officers:', officers.length],
    [],
    ['#','Officer Name','Department','Today','This Week','This Month','Total','Last Submission','Blocks Covered (Month)','Block Count','Open Issues','In Progress','Resolved','Resolution %','Daily Status','Weekly Status']
  ];
  officers.forEach((o, i) => {
    const lastStr  = o.lastDate ? new Date(o.lastDate).toLocaleDateString('en-IN') : '—';
    const blocksArr= [...o.blocks];
    const total    = o.open + o.inprog + o.resolved;
    const rate     = total > 0 ? Math.round(o.resolved / total * 100) : 0;
    const dailySt  = cfg.minDaily  ? (o.today  >= cfg.minDaily  ? '✅ Met' : `❌ ${o.today}/${cfg.minDaily}`)  : '—';
    const weeklySt = cfg.minWeekly ? (o.week   >= cfg.minWeekly ? '✅ Met' : `❌ ${o.week}/${cfg.minWeekly}`) : '—';
    aoa1.push([i+1, o.name, o.dept, o.today, o.week, o.month, recs.filter(r=>(r.officerName||r.submittedBy||'').trim()===o.name).length, lastStr, blocksArr.join(', '), blocksArr.length, o.open, o.inprog, o.resolved, rate+'%', dailySt, weeklySt]);
  });

  const aoa2 = [['Officer', ...BLOCKS, 'Coverage %']];
  officers.forEach(o => {
    const blockCounts = {};
    recs.forEach(r => {
      if ((r.officerName||r.submittedBy||'').trim() !== o.name) return;
      if (new Date(r.createdAt||r.datetime) < thisMonthStart) return;
      if (r.block) blockCounts[r.block] = (blockCounts[r.block]||0) + 1;
    });
    const covered = BLOCKS.filter(b => blockCounts[b] > 0).length;
    aoa2.push([o.name, ...BLOCKS.map(b => blockCounts[b]||0), Math.round(covered/BLOCKS.length*100)+'%']);
  });

  const aoa3 = [
    ['Officer Issues & Resolution Report'],
    ['Generated:', new Date().toLocaleString('en-IN')],
    [],
    ['#','Officer','Dept','Open','In Progress','Resolved','Total','Resolution %']
  ];
  officers.forEach((o,i) => {
    const total = o.open+o.inprog+o.resolved;
    aoa3.push([i+1, o.name, o.dept, o.open, o.inprog, o.resolved, total, total>0?Math.round(o.resolved/total*100)+'%':'—']);
  });

  if (typeof XLSX === 'undefined') { toast('⚠️ Excel library not loaded', 'warn'); return; }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa1), 'Officer Activity');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa2), 'Block Coverage');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa3), 'Issues & Resolution');

  const date = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `MLD_Officer_Monitor_${date}.xlsx`);
  toast('📊 Excel exported — 3 sheets', 'success');
}

function exportMonitorPDF() {
  const recs = APP.records;
  const now  = new Date();
  const todayStr      = now.toISOString().slice(0,10);
  const thisWeekAgo   = new Date(now - 7*86400000);
  const thisMonthStart= new Date(now.getFullYear(), now.getMonth(), 1);
  const monthName     = now.toLocaleString('en-IN', {month:'long', year:'numeric'});
  const BLOCKS = ['Mayiladuthurai','Sirkazhi','Kuthalam','Kollidam','Sembanarkoil','Tharangambadi','Poompuhar'];

  const officerMap = {};
  recs.forEach(r => {
    const name = (r.officerName || r.submittedBy || '').trim();
    const dept = r.department || '—';
    if (!name) return;
    if (!officerMap[name]) officerMap[name] = {name, dept, today:0, week:0, month:0, lastDate:null, blocks:new Set(), open:0, inprog:0, resolved:0};
    const recDate = new Date(r.createdAt || r.datetime);
    if (recDate.toISOString().slice(0,10) === todayStr) officerMap[name].today++;
    if (recDate >= thisWeekAgo)    officerMap[name].week++;
    if (recDate >= thisMonthStart) officerMap[name].month++;
    if (!officerMap[name].lastDate || recDate > new Date(officerMap[name].lastDate)) officerMap[name].lastDate = recDate.toISOString();
    if (r.block) officerMap[name].blocks.add(r.block);
    const rs = r.resolutionStatus || 'open';
    if (rs === 'open') officerMap[name].open++;
    else if (rs === 'in_progress') officerMap[name].inprog++;
    else if (rs === 'resolved') officerMap[name].resolved++;
  });

  const officers = Object.values(officerMap).sort((a,b) => b.month - a.month);
  const cfg = getAdminConfig();
  const activeToday   = officers.filter(o => o.today > 0).length;
  const totalMonthRecs= recs.filter(r => new Date(r.createdAt||r.datetime) >= thisMonthStart).length;
  const totalOpen     = recs.filter(r => (r.resolutionStatus||'open') === 'open').length;
  const totalResolved = recs.filter(r => r.resolutionStatus === 'resolved').length;

  function statusBadge(o) {
    if (o.today > 0) return '<span style="background:#E8F5E9;color:#1B5E20;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">🟢 Active Today</span>';
    const days = o.lastDate ? Math.floor((now - new Date(o.lastDate))/86400000) : 999;
    if (days <= 7) return `<span style="background:#FFF3E0;color:#E65100;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">🟠 ${days}d ago</span>`;
    return `<span style="background:#FFEBEE;color:#B71C1C;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">🔴 ${days}d ago</span>`;
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Field Officer Monitor Report — ${monthName}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#202124;font-size:13px}
    h1{color:#1A73E8;margin:0 0 4px}
    .subtitle{color:#5F6368;font-size:13px;margin-bottom:20px}
    .kpis{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}
    .kpi{border-radius:10px;padding:14px 20px;min-width:110px;text-align:center}
    .kpi .v{font-size:28px;font-weight:700}
    .kpi .l{font-size:11px;margin-top:2px;opacity:.8}
    table{width:100%;border-collapse:collapse;margin-bottom:28px;font-size:12px}
    th{background:#1A73E8;color:white;padding:8px 6px;text-align:left;font-weight:600}
    td{padding:7px 6px;border-bottom:1px solid #e0e0e0}
    tr:nth-child(even){background:#F8F9FA}
    .sec{font-size:15px;font-weight:700;color:#1A73E8;margin:24px 0 10px;border-bottom:2px solid #E8F0FE;padding-bottom:6px}
    .flag{background:#FFEBEE;color:#B71C1C}
    @media print{body{padding:10px}.kpi{border:1px solid #ddd!important}}
  </style></head><body>
  <h1>🏛 Mayiladuthurai District — Field Officer Monitor</h1>
  <div class="subtitle">Report for ${monthName} &nbsp;·&nbsp; Generated: ${new Date().toLocaleString('en-IN')} &nbsp;·&nbsp; Total Officers: ${officers.length}</div>
  <div class="kpis">
    <div class="kpi" style="background:#E8F5E9"><div class="v" style="color:#1B5E20">${activeToday}</div><div class="l" style="color:#1B5E20">Active Today</div></div>
    <div class="kpi" style="background:#FFEBEE"><div class="v" style="color:#B71C1C">${officers.length - activeToday}</div><div class="l" style="color:#B71C1C">Not Submitted Today</div></div>
    <div class="kpi" style="background:#E8F0FE"><div class="v" style="color:#1A73E8">${totalMonthRecs}</div><div class="l" style="color:#1A73E8">Inspections This Month</div></div>
    <div class="kpi" style="background:#FFF3E0"><div class="v" style="color:#E65100">${totalOpen}</div><div class="l" style="color:#E65100">Open Issues</div></div>
    <div class="kpi" style="background:#F0FFF4"><div class="v" style="color:#1B5E20">${totalResolved}</div><div class="l" style="color:#1B5E20">Resolved</div></div>
  </div>
  <div class="sec">👥 Officer Activity Summary</div>
  <table><thead><tr>
    <th>#</th><th>Officer Name</th><th>Department</th>
    <th style="text-align:center">Today</th><th style="text-align:center">This Week</th>
    <th style="text-align:center">This Month</th><th style="text-align:center">Last Submission</th>
    <th>Blocks Visited</th><th style="text-align:center">Status</th>
  </tr></thead><tbody>
  ${officers.map((o,i) => {
    const lastStr = o.lastDate ? new Date(o.lastDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : '—';
    const belowMin = (cfg.minDaily && o.today < cfg.minDaily) || (cfg.minWeekly && o.week < cfg.minWeekly);
    return `<tr class="${belowMin?'flag':''}">
      <td>${i+1}</td><td><b>${o.name}</b></td><td>${o.dept}</td>
      <td style="text-align:center;font-weight:700;color:${o.today>0?'#1B5E20':'#9E9E9E'}">${o.today}</td>
      <td style="text-align:center">${o.week}</td>
      <td style="text-align:center;font-weight:700">${o.month}</td>
      <td style="text-align:center">${lastStr}</td>
      <td style="font-size:11px">${[...o.blocks].join(', ')||'—'}</td>
      <td>${statusBadge(o)}</td>
    </tr>`;
  }).join('')}
  </tbody></table>
  <div class="sec">🗺 Block Coverage Matrix (${monthName})</div>
  <table><thead><tr>
    <th>Officer</th>
    ${BLOCKS.map(b=>`<th style="text-align:center;font-size:11px">${b}</th>`).join('')}
    <th style="text-align:center">Coverage</th>
  </tr></thead><tbody>
  ${officers.map(o => {
    const blockCounts = {};
    recs.forEach(r => {
      if ((r.officerName||r.submittedBy||'').trim() !== o.name) return;
      if (new Date(r.createdAt||r.datetime) < thisMonthStart) return;
      if (r.block) blockCounts[r.block] = (blockCounts[r.block]||0) + 1;
    });
    const covered = BLOCKS.filter(b => blockCounts[b] > 0).length;
    const pct = Math.round(covered/BLOCKS.length*100);
    return `<tr>
      <td><b>${o.name}</b></td>
      ${BLOCKS.map(b => {
        const cnt = blockCounts[b]||0;
        return `<td style="text-align:center;background:${cnt>0?'#C8E6C9':'#FFCDD2'};color:${cnt>0?'#1B5E20':'#B71C1C'};font-weight:700">${cnt||'✗'}</td>`;
      }).join('')}
      <td style="text-align:center;font-weight:700;color:${pct>=80?'#1B5E20':pct>=40?'#E65100':'#B71C1C'}">${pct}%</td>
    </tr>`;
  }).join('')}
  </tbody></table>
  <div class="sec">🔧 Issues &amp; Resolution Tracker</div>
  <table><thead><tr>
    <th>#</th><th>Officer</th><th>Dept</th>
    <th style="text-align:center">Open</th><th style="text-align:center">In Progress</th>
    <th style="text-align:center">Resolved</th><th style="text-align:center">Rate</th>
  </tr></thead><tbody>
  ${officers.map((o,i) => {
    const tot = o.open+o.inprog+o.resolved;
    const rate = tot>0 ? Math.round(o.resolved/tot*100) : 0;
    return `<tr>
      <td>${i+1}</td><td><b>${o.name}</b></td><td>${o.dept}</td>
      <td style="text-align:center;color:#B71C1C;font-weight:700">${o.open}</td>
      <td style="text-align:center;color:#E65100">${o.inprog}</td>
      <td style="text-align:center;color:#1B5E20;font-weight:700">${o.resolved}</td>
      <td style="text-align:center;font-weight:700;color:${rate>=70?'#1B5E20':rate>=40?'#E65100':'#B71C1C'}">${rate}%</td>
    </tr>`;
  }).join('')}
  </tbody></table>
  <div style="font-size:11px;color:#9E9E9E;margin-top:30px;border-top:1px solid #eee;padding-top:10px">
    Mayiladuthurai District Field Inspection System · Printed on ${new Date().toLocaleString('en-IN')}
    ${cfg.minDaily  ? ` · Min Daily: ${cfg.minDaily}` : ''}
    ${cfg.minWeekly ? ` · Min Weekly: ${cfg.minWeekly}` : ''}
    <br>🔴 Highlighted rows = officers below minimum threshold
  </div>
  <script>window.onload=function(){window.print();};<\/script>
  </body></html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
  else toast('⚠️ Allow pop-ups to open PDF report', 'warn');
}

function exportOfficerReportCard(officerName) {
  const recs = APP.records.filter(r =>
    (r.officerName||r.submittedBy||'').trim().toLowerCase() === officerName.toLowerCase()
  );
  if (!recs.length) { toast('No records for this officer', 'warn'); return; }

  const now = new Date();
  const monthName = now.toLocaleString('en-IN', {month:'long', year:'numeric'});
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const BLOCKS = ['Mayiladuthurai','Sirkazhi','Kuthalam','Kollidam','Sembanarkoil','Tharangambadi','Poompuhar'];

  const dept = recs[0].department || '—';
  const desig = recs[0].designation || '—';
  const monthRecs = recs.filter(r => new Date(r.createdAt||r.datetime) >= thisMonthStart);
  const totalRecs = recs.length;
  const open = recs.filter(r => (r.resolutionStatus||'open') === 'open').length;
  const inprog = recs.filter(r => r.resolutionStatus === 'in_progress').length;
  const resolved = recs.filter(r => r.resolutionStatus === 'resolved').length;
  const rate = totalRecs > 0 ? Math.round(resolved/totalRecs*100) : 0;

  const blockCounts = {};
  monthRecs.forEach(r => { if (r.block) blockCounts[r.block] = (blockCounts[r.block]||0)+1; });
  const blocksCovered = BLOCKS.filter(b => blockCounts[b] > 0).length;

  const recent = [...recs].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,10);

  const dailyMap = {};
  monthRecs.forEach(r => {
    const d = (r.createdAt||'').slice(0,10);
    if (d) dailyMap[d] = (dailyMap[d]||0)+1;
  });
  const activeDays = Object.keys(dailyMap).length;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Officer Report Card — ${officerName}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#202124;font-size:13px}
    .cover{background:linear-gradient(135deg,#1A73E8,#0D47A1);color:white;border-radius:14px;padding:24px 28px;margin-bottom:24px}
    .cover h1{margin:0 0 6px;font-size:22px}
    .cover .sub{opacity:.85;font-size:13px}
    .kpis{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:24px}
    .kpi{border-radius:10px;padding:14px 18px;min-width:100px;text-align:center;border:1px solid #e0e0e0}
    .kpi .v{font-size:26px;font-weight:700}
    .kpi .l{font-size:11px;margin-top:2px;color:#5F6368}
    .sec{font-size:14px;font-weight:700;color:#1A73E8;margin:20px 0 10px;border-bottom:2px solid #E8F0FE;padding-bottom:5px}
    table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px}
    th{background:#1A73E8;color:white;padding:7px 8px;text-align:left}
    td{padding:6px 8px;border-bottom:1px solid #eee}
    tr:nth-child(even){background:#F8F9FA}
    .block-grid{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
    .block-cell{border-radius:8px;padding:8px 12px;font-size:12px;font-weight:700;text-align:center;min-width:90px}
    @media print{.cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <div class="cover">
    <div style="font-size:13px;opacity:.7;margin-bottom:8px">🏛 Mayiladuthurai District — Officer Performance Report</div>
    <h1>👤 ${officerName}</h1>
    <div class="sub">${desig} &nbsp;·&nbsp; ${dept} &nbsp;·&nbsp; Report for ${monthName}</div>
    <div class="sub" style="margin-top:6px">Generated: ${new Date().toLocaleString('en-IN')}</div>
  </div>
  <div class="kpis">
    <div class="kpi"><div class="v" style="color:#1A73E8">${totalRecs}</div><div class="l">Total Inspections</div></div>
    <div class="kpi"><div class="v" style="color:#1B5E20">${monthRecs.length}</div><div class="l">This Month</div></div>
    <div class="kpi"><div class="v" style="color:#0D47A1">${activeDays}</div><div class="l">Active Days</div></div>
    <div class="kpi"><div class="v" style="color:#7c4d00">${blocksCovered}/${BLOCKS.length}</div><div class="l">Blocks Covered</div></div>
    <div class="kpi"><div class="v" style="color:#B71C1C">${open}</div><div class="l">Open Issues</div></div>
    <div class="kpi"><div class="v" style="color:#1B5E20">${resolved}</div><div class="l">Resolved</div></div>
    <div class="kpi"><div class="v" style="color:${rate>=70?'#1B5E20':rate>=40?'#E65100':'#B71C1C'}">${rate}%</div><div class="l">Resolution Rate</div></div>
  </div>
  <div class="sec">🗺 Block Coverage This Month</div>
  <div class="block-grid">
    ${BLOCKS.map(b => {
      const cnt = blockCounts[b]||0;
      return `<div class="block-cell" style="background:${cnt>0?'#C8E6C9':'#FFCDD2'};color:${cnt>0?'#1B5E20':'#B71C1C'}">
        ${b}<br><span style="font-size:16px">${cnt||'✗'}</span>
      </div>`;
    }).join('')}
  </div>
  <div class="sec">📋 Recent Inspections (Last 10)</div>
  <table><thead><tr>
    <th>#</th><th>Date</th><th>Location</th><th>Block</th><th>Priority</th><th>Status</th>
  </tr></thead><tbody>
  ${recent.map((r,i) => {
    const dt = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
    const prioBg = {urgent:'#FFCDD2',high:'#FFE0B2',medium:'#FFF9C4',low:'#E8F5E9'};
    const statusLbl = {open:'🔴 Open',in_progress:'🟡 In Progress',resolved:'🟢 Resolved'};
    return `<tr>
      <td>${i+1}</td><td>${dt}</td>
      <td>${r.location||'—'}${r.block?', '+r.block:''}</td>
      <td>${r.block||'—'}</td>
      <td style="background:${prioBg[r.priority]||'#fff'}">${r.priority||'medium'}</td>
      <td>${statusLbl[r.resolutionStatus||'open']||'🔴 Open'}</td>
    </tr>`;
  }).join('')}
  </tbody></table>
  <div style="font-size:11px;color:#9E9E9E;margin-top:20px;border-top:1px solid #eee;padding-top:8px">
    Mayiladuthurai District Field Inspection System · Officer Report Card · ${new Date().toLocaleString('en-IN')}
  </div>
  <script>window.onload=function(){window.print();};<\/script>
  </body></html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
  else toast('⚠️ Allow pop-ups to open report', 'warn');
}

