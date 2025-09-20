<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Physics Editor — Sticky Objects & Slopes</title>
<style>
  html,body { height:100%; margin:0; }
  #container { width:100%; height:100vh; background:#f6f7fb; overflow:hidden; }

  /* UI */
  .ui {
    position: fixed;
    left: 12px;
    top: 12px;
    width: 320px;
    background: rgba(255,255,255,0.98);
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
    font-family: Inter, system-ui, Arial;
    z-index: 999;
  }
  .ui h3 { margin:0 0 8px 0; font-size:15px; }
  .row { display:flex; gap:8px; align-items:center; margin-bottom:8px; }
  label { width:110px; font-size:13px; color:#333; }
  input[type="number"], select { flex:1; padding:6px 8px; border:1px solid #ddd; border-radius:6px; font-size:13px; }
  button { padding:8px 10px; border-radius:8px; border:none; cursor:pointer; background:#2563eb; color:#fff; }
  button.ghost { background:#e6e7eb; color:#111; }
  .small { padding:6px 8px; font-size:13px; }
  #selectionInfo { margin-top:6px; font-size:13px; color:#444; min-height:32px; }

  /* footer hint */
  #hint { position: fixed; right:12px; bottom:12px; background:rgba(0,0,0,0.6); color:#fff; padding:8px 10px; border-radius:8px; font-size:13px; z-index:999; }
</style>
</head>
<body>
<div id="container"></div>

<div class="ui" id="ui">
  <h3>Editor Fisika — Objects & Slopes</h3>

  <div style="font-weight:600;margin-bottom:6px">Object spawn</div>
  <div class="row">
    <label>Tipe</label>
    <select id="typeSelect"><option value="box">Box</option><option value="circle">Circle</option></select>
  </div>
  <div class="row">
    <label>Massa (kg)</label>
    <input id="massInput" type="number" step="0.1" value="2" min="0.1" />
  </div>
  <div class="row" id="sizeBoxRow">
    <label>Ukuran (W×H)</label>
    <input id="widthInput" type="number" value="60" min="8" />
    <input id="heightInput" type="number" value="60" min="8" />
  </div>
  <div class="row" id="radiusRow" style="display:none;">
    <label>Radius</label>
    <input id="radiusInput" type="number" value="30" min="4" />
  </div>
  <div class="row">
    <label>Friction</label>
    <input id="frictionInput" type="number" step="0.05" value="0.3" min="0" max="1" />
  </div>
  <div class="row">
    <label>FrictionStatic</label>
    <input id="fricStaticInput" type="number" step="0.05" value="0.5" min="0" max="1" />
  </div>
  <div class="row">
    <label>Restitution</label>
    <input id="restitutionInput" type="number" step="0.01" value="0.0" min="0" max="1" />
  </div>

  <div class="row">
    <button id="spawnCenterBtn" class="small">Spawn Tengah</button>
    <button id="spawnClickBtn" class="small ghost">Spawn di Klik: OFF</button>
  </div>

  <hr />

  <div style="font-weight:600;margin-bottom:6px">Slope (bidang miring)</div>
  <div class="row">
    <label>Lebar</label>
    <input id="sWidth" type="number" value="300" />
    <label style="width:auto">Tinggi</label>
    <input id="sHeight" type="number" value="20" />
  </div>
  <div class="row">
    <label>Angle (rad)</label>
    <input id="sAngle" type="number" step="0.05" value="0.3" />
  </div>
  <div class="row">
    <label>Friction</label>
    <input id="sFriction" type="number" step="0.05" value="0.8" />
  </div>
  <div class="row">
    <button id="spawnSlopeCenter" class="small">Spawn Slope Tengah</button>
    <button id="spawnSlopeClick" class="small ghost">Spawn Slope Klik: OFF</button>
  </div>

  <hr />
  <div class="row">
    <button id="toggleSticky" class="small ghost">Toggle Sticky (selected)</button>
    <button id="deleteSelected" class="small ghost">Delete</button>
    <button id="snapGrid" class="small ghost">Snap Grid</button>
  </div>

  <div class="row">
    <button id="exportBtn" class="small ghost">Export JSON</button>
    <button id="resetBtn" class="small ghost">Reset Semua</button>
  </div>

  <div id="selectionInfo">Selected: —</div>
</div>

<div id="hint">Klik canvas untuk interaksi (toggle spawn mode di UI)</div>

<!-- Matter.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js"></script>
<script>
(function(){
  const { Engine, Render, Runner, Bodies, Composite, Body, Events, Mouse, MouseConstraint, Query } = Matter;

  // ---------- setup ----------
  const container = document.getElementById('container');
  const w = () => window.innerWidth;
  const h = () => window.innerHeight;

  const engine = Engine.create();
  const world = engine.world;
  world.gravity.y = 1;

  const render = Render.create({
    element: container,
    engine: engine,
    options: { width: w(), height: h(), wireframes: false, background: '#f6f7fb' }
  });
  Render.run(render);
  const runner = Runner.create(); Runner.run(runner, engine);

  // invisible bounds
  const wallThickness = 300;
  const ground = Bodies.rectangle(w()/2, h()+wallThickness/2, w(), wallThickness, { isStatic:true, render:{ visible:false }});
  const leftWall = Bodies.rectangle(-wallThickness/2, h()/2, wallThickness, h(), { isStatic:true, render:{ visible:false }});
  const rightWall = Bodies.rectangle(w()+wallThickness/2, h()/2, wallThickness, h(), { isStatic:true, render:{ visible:false }});
  Composite.add(world, [ground,leftWall,rightWall]);

  // ---------- state ----------
  let userBodies = [];
  let slopeBodies = [];
  let selected = null;
  let spawnObjectOnClick = false;
  let spawnSlopeOnClick = false;

  // ---------- UI refs ----------
  const typeSelect = document.getElementById('typeSelect');
  const massInput = document.getElementById('massInput');
  const widthInput = document.getElementById('widthInput');
  const heightInput = document.getElementById('heightInput');
  const radiusInput = document.getElementById('radiusInput');
  const radiusRow = document.getElementById('radiusRow');
  const sizeBoxRow = document.getElementById('sizeBoxRow');
  const frictionInput = document.getElementById('frictionInput');
  const fricStaticInput = document.getElementById('fricStaticInput');
  const restitutionInput = document.getElementById('restitutionInput');
  const spawnCenterBtn = document.getElementById('spawnCenterBtn');
  const spawnClickBtn = document.getElementById('spawnClickBtn');

  const sWidth = document.getElementById('sWidth');
  const sHeight = document.getElementById('sHeight');
  const sAngle = document.getElementById('sAngle');
  const sFriction = document.getElementById('sFriction');
  const spawnSlopeCenter = document.getElementById('spawnSlopeCenter');
  const spawnSlopeClick = document.getElementById('spawnSlopeClick');

  const toggleStickyBtn = document.getElementById('toggleSticky');
  const deleteSelectedBtn = document.getElementById('deleteSelected');
  const snapGridBtn = document.getElementById('snapGrid');
  const exportBtn = document.getElementById('exportBtn');
  const resetBtn = document.getElementById('resetBtn');
  const selectionInfo = document.getElementById('selectionInfo');

  // update size UI
  function updateSizeUI(){
    if(typeSelect.value === 'circle'){
      radiusRow.style.display = '';
      sizeBoxRow.style.display = 'none';
    } else {
      radiusRow.style.display = 'none';
      sizeBoxRow.style.display = '';
    }
  }
  typeSelect.addEventListener('change', updateSizeUI);
  updateSizeUI();

  // ---------- factories ----------
  function createUserBody(params){
    let body;
    if(params.type === 'circle'){
      body = Bodies.circle(params.x, params.y, params.radius, {
        friction: params.friction,
        frictionStatic: params.frictionStatic,
        restitution: params.restitution,
        density: Math.max(0.0001, params.mass / (Math.PI * params.radius * params.radius))
      });
    } else {
      body = Bodies.rectangle(params.x, params.y, params.width, params.height, {
        friction: params.friction,
        frictionStatic: params.frictionStatic,
        restitution: params.restitution,
        density: Math.max(0.0001, params.mass / Math.max(1, params.width * params.height))
      });
    }

    body.isUserObject = true;
    body.massValue = params.mass;
    body.isSticky = false;
    body.labelText = params.mass + 'kg';
    return body;
  }

  function createSlope(params){
    const body = Bodies.rectangle(params.x, params.y, params.width, params.height, {
      isStatic: true,
      friction: params.friction,
      render: { fillStyle:'#444' }
    });
    Body.rotate(body, params.angle);
    body.isSlope = true;
    body.slopeProps = { angle: params.angle, width: params.width, height: params.height };
    return body;
  }

  // ---------- mouse & drag ----------
  const mouse = Mouse.create(render.canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.18, render:{ visible:false } }
  });
  Composite.add(world, mouseConstraint);
  render.mouse = mouse;

  Events.on(mouseConstraint, 'startdrag', (ev) => {
    const b = ev.body;
    if(!b) return;
    selectBody(b);
    if(b.isUserObject){
      if(b.isSticky && b.isStatic){
        b._wasStickyTemp = true;
        Body.setStatic(b, false);
      }
    }
  });

  Events.on(mouseConstraint, 'enddrag', (ev) => {
    const b = ev.body;
    if(!b) return;
    if(b.isUserObject && b._wasStickyTemp){
      b._wasStickyTemp = false;
      b.isSticky = true;
      Body.setStatic(b, true);
      Body.setVelocity(b, { x:0, y:0 });
    }
  });

  render.canvas.addEventListener('pointerdown', (ev) => {
    if(ev.target && ev.target.closest && ev.target.closest('.ui')) return;
    const rect = render.canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;

    if(spawnSlopeOnClick){ spawnSlopeAt(x,y); return; }
    if(spawnObjectOnClick){ spawnObjectAt(x,y); return; }

    const found = Query.point(world.bodies, { x, y });
    if(found.length > 0){ selectBody(found[found.length -1]); }
    else { selectBody(null); }
  });

  // ---------- spawn helpers ----------
  function spawnObjectAt(x,y){
    const type = typeSelect.value;
    const mass = parseFloat(massInput.value) || 1;
    const friction = parseFloat(frictionInput.value) || 0;
    const frictionStatic = parseFloat(fricStaticInput.value) || 0;
    const restitution = parseFloat(restitutionInput.value) || 0;
    if(type === 'circle'){
      const radius = parseFloat(radiusInput.value) || 20;
      const body = createUserBody({ type:'circle', mass, x, y, radius, friction, frictionStatic, restitution });
      Composite.add(world, body); userBodies.push(body);
    } else {
      const widthVal = parseFloat(widthInput.value) || 40;
      const heightVal = parseFloat(heightInput.value) || 40;
      const body = createUserBody({ type:'box', mass, x, y, width:widthVal, height:heightVal, friction, frictionStatic, restitution });
      Composite.add(world, body); userBodies.push(body);
    }
  }

  function spawnSlopeAt(x, y) {
    const widthVal = parseFloat(sWidth.value) || 300;
    const heightVal = parseFloat(sHeight.value) || 20;
    const angle = parseFloat(sAngle.value) || 0;
    const friction = parseFloat(sFriction.value) || 0.8;
    const slope = createSlope({ x, y, width: widthVal, height: heightVal, angle, friction });
    Composite.add(world, slope);
    slopeBodies.push(slope);
  }

  spawnCenterBtn.addEventListener('click', () => spawnObjectAt(w()/2, h()/2 - 120));
  spawnSlopeCenter.addEventListener('click', () => spawnSlopeAt(w()/2 + 200, h()/2 + 100));

  spawnClickBtn.addEventListener('click', () => {
    spawnObjectOnClick = !spawnObjectOnClick;
    spawnClickBtn.textContent = `Spawn di Klik: ${spawnObjectOnClick ? 'ON' : 'OFF'}`;
    spawnClickBtn.classList.toggle('ghost', !spawnObjectOnClick);
    if(spawnObjectOnClick){ spawnSlopeOnClick = false; spawnSlopeClick.textContent = 'Spawn Slope Klik: OFF'; spawnSlopeClick.classList.add('ghost'); }
  });

  spawnSlopeClick.addEventListener('click', () => {
    spawnSlopeOnClick = !spawnSlopeOnClick;
    spawnSlopeClick.textContent = `Spawn Slope Klik: ${spawnSlopeOnClick ? 'ON' : 'OFF'}`;
    spawnSlopeClick.classList.toggle('ghost', !spawnSlopeOnClick);
    if(spawnSlopeOnClick){ spawnObjectOnClick = false; spawnClickBtn.textContent = 'Spawn di Klik: OFF'; spawnClickBtn.classList.add('ghost'); }
  });

  // ---------- selection / actions ----------
  function selectBody(b){
    selected = b;
    if(!b) selectionInfo.textContent = 'Selected: —';
    else {
      const t = b.isSlope ? 'Slope' : (b.circleRadius ? 'Circle' : 'Box');
      const massInfo = b.isUserObject ? `, mass=${b.massValue}kg` : '';
      const stickyInfo = b.isUserObject ? (b.isSticky ? ', STICKY' : '') : '';
      selectionInfo.textContent = `Selected: ${t}${massInfo}${stickyInfo}`;
    }
  }

  toggleStickyBtn.addEventListener('click', () => {
    if(!selected) return alert('Pilih objek dulu');
    selected.isSticky = !selected.isSticky;
    Body.setStatic(selected, selected.isSticky);
  });

  deleteSelectedBtn.addEventListener('click', () => {
    if(!selected) return;
    Composite.remove(world, selected);
    userBodies = userBodies.filter(b => b !== selected);
    slopeBodies = slopeBodies.filter(s => s !== selected);
    selectBody(null);
  });

  snapGridBtn.addEventListener('click', () => {
    if(!selected) return;
    const x = Math.round(selected.position.x / 10) * 10;
    const y = Math.round(selected.position.y / 10) * 10;
    Body.setPosition(selected, { x, y });
  });

  resetBtn.addEventListener('click', () => {
    userBodies.forEach(b => Composite.remove(world, b));
    slopeBodies.forEach(s => Composite.remove(world, s));
    userBodies = []; slopeBodies = []; selectBody(null);
  });

  // ---------- export ----------
  exportBtn.addEventListener('click', () => {
    const out = { objects: [], slopes: [] };
    userBodies.forEach(b => {
      if(b.circleRadius){
        out.objects.push({ type:'circle', mass:b.massValue, radius:b.circleRadius, pos:b.position });
      } else {
        out.objects.push({ type:'box', mass:b.massValue, w:b.bounds.max.x-b.bounds.min.x, h:b.bounds.max.y-b.bounds.min.y, pos:b.position });
      }
    });
    slopeBodies.forEach(s => {
      out.slopes.push({ pos:s.position, w:s.slopeProps.width, h:s.slopeProps.height, angle:s.slopeProps.angle });
    });
    const str = JSON.stringify(out, null, 2);
    const win = window.open('', '_blank');
    win.document.body.innerHTML = '<pre>'+str+'</pre>';
  });

  // ---------- render overlays ----------
  Events.on(render, 'afterRender', () => {
    const ctx = render.context;
    userBodies.forEach(b => {
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.font = '13px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(b.labelText, b.position.x, b.position.y+4);
      ctx.restore();
    });
    if(selected){
      ctx.save();
      ctx.strokeStyle = 'orange';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if(selected.circleRadius){ ctx.arc(selected.position.x, selected.position.y, selected.circleRadius+4, 0, 2*Math.PI); }
      else {
        const v = selected.vertices;
        ctx.moveTo(v[0].x, v[0].y);
        for(let i=1;i<v.length;i++) ctx.lineTo(v[i].x,v[i].y);
        ctx.closePath();
      }
      ctx.stroke();
      ctx.restore();
    }
  });

  // ---------- resize ----------
  window.addEventListener('resize', () => {
    render.canvas.width = w();
    render.canvas.height = h();
    Body.setPosition(ground, {x:w()/2,y:h()+wallThickness/2});
    Body.setPosition(leftWall, {x:-wallThickness/2,y:h()/2});
    Body.setPosition(rightWall, {x:w()+wallThickness/2,y:h()/2});
  });
})();
</script>
</body>
</html>
