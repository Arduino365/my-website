/*
  Lightweight side-scroller engine optimized for canvas and mobile.
  Features:
  - devicePixelRatio scaling
  - touch + keyboard controls
  - double-jump
  - obstacles and orbs
  - simple state machine (start, play, pause, gameover)
  - leaderboard integration (POST to ../save_score.php, GET ../get_leaderboard.php)
*/

(function(){
  'use strict'

  // Config / tuning
  const T = {
    width: 800,
    height: 400,
    gravity: 0.9,
    jumpImpulse: -14,
    doubleJumpImpulse: -12,
    obstacleInterval: 1500, // ms
    orbInterval: 1200,
    baseSpeed: 220, // px/s
    maxOrbs: 100
  }

  // DOM
  const canvas = document.getElementById('game');
  const scoreEl = document.getElementById('score');
  const highEl = document.getElementById('highscore');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const startScreen = document.getElementById('start-screen');
  const pauseScreen = document.getElementById('pause-screen');
  const leaderboardBtn = document.getElementById('leaderboard-btn');
  const leaderScreen = document.getElementById('leaderboard-screen');
  const leaderList = document.getElementById('leaderboard-list');
  const backBtn = document.getElementById('back-btn');
  const playerNameInput = document.getElementById('player-name');
  const difficultySel = document.getElementById('difficulty');

  // Canvas setup with DPR scaling
  const ctx = canvas.getContext('2d');
  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.min(window.innerWidth, T.width);
    const h = Math.min(window.innerHeight, T.height);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Audio manager: try to load files, but provide a WebAudio synth fallback so game works anonymously
  const sounds = {};
  let audioCtx = null;
  function ensureAudioCtx(){
    if (audioCtx) return audioCtx;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ audioCtx = null; }
    return audioCtx;
  }

  function loadSound(name, url) {
    try {
      const a = new Audio();
      a.src = url;
      a.preload = 'auto';
      a.crossOrigin = 'anonymous';
      // store immediately; browsers will handle fetch errors gracefully
      sounds[name] = a;
    } catch(e) { console.warn('Audio load failed', name); }
  }

  // Synthetic fallback using WebAudio for short SFX (no external files required)
  function synthPlay(kind){
    const ctx = ensureAudioCtx();
    if (!ctx) return; // no audio available
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    if (kind === 'jump') { o.type = 'sine'; o.frequency.setValueAtTime(600, now); g.gain.setValueAtTime(0.001, now); g.gain.exponentialRampToValueAtTime(0.12, now + 0.01); g.gain.exponentialRampToValueAtTime(0.001, now + 0.35); o.start(now); o.stop(now + 0.4); }
    else if (kind === 'orb') { o.type = 'triangle'; o.frequency.setValueAtTime(900, now); g.gain.setValueAtTime(0.001, now); g.gain.exponentialRampToValueAtTime(0.08, now + 0.005); g.gain.exponentialRampToValueAtTime(0.001, now + 0.18); o.start(now); o.stop(now + 0.2); }
    else if (kind === 'hit') { o.type = 'square'; o.frequency.setValueAtTime(160, now); g.gain.setValueAtTime(0.001, now); g.gain.exponentialRampToValueAtTime(0.18, now + 0.01); g.gain.exponentialRampToValueAtTime(0.001, now + 0.35); o.start(now); o.stop(now + 0.45); }
  }

  // Expect user to put audio files in side_scroller/assets/ or host them. If missing, synthPlay will run instead.
  loadSound('jump', 'assets/jump.mp3');
  loadSound('orb', 'assets/orb.mp3');
  loadSound('hit', 'assets/hit.mp3');

  // Game state
  let state = 'start'; // start, play, pause, gameover
  let last = performance.now();
  let accum = 0;
  let score = 0; let high = Number(localStorage.getItem('ss_high')||0);
  highEl.textContent = 'High: ' + high;

  // Player
  const player = { x:80, y: 0, w:36, h:48, vy:0, onGround:false, jumps:0, anim:0 };

  // Obstacles / Orbs
  const obstacles = [];
  const orbs = [];
  let lastObstacle = 0; let lastOrb = 0;

  function reset() {
    score = 0; scoreEl.textContent = 'Score: 0';
    obstacles.length=0; orbs.length=0;
    player.y = canvas.height/2/ (window.devicePixelRatio||1); player.vy = 0; player.jumps=0;
    lastObstacle = performance.now(); lastOrb = performance.now();
  }

  // Input handlers
  let wantJump = false;
  function jump() {
    if (player.onGround) {
      player.vy = T.jumpImpulse; player.onGround=false; player.jumps=1;
      if (sounds.jump && sounds.jump.play) sounds.jump.play().catch(()=>{}); else synthPlay('jump');
    } else if (player.jumps===1) {
      player.vy = T.doubleJumpImpulse; player.jumps=2;
      if (sounds.jump && sounds.jump.play) sounds.jump.play().catch(()=>{}); else synthPlay('jump');
    }
  }

  window.addEventListener('keydown', (e)=>{
    if (e.code==='Space' || e.code==='ArrowUp') { e.preventDefault(); wantJump=true; }
    if (e.code==='KeyP') togglePause();
  });
  window.addEventListener('keyup', (e)=>{ if (e.code==='Space' || e.code==='ArrowUp') wantJump=false; });

  // Touch controls: tap to jump, double-tap for double jump naturally
  let lastTouch = 0;
  window.addEventListener('touchstart', (e)=>{
    e.preventDefault(); wantJump=true; lastTouch = performance.now();
  }, {passive:false});
  window.addEventListener('touchend', ()=>{ wantJump=false });
  // Mouse click
  canvas.addEventListener('mousedown', (e)=>{ wantJump=true });
  canvas.addEventListener('mouseup', ()=>{ wantJump=false });

  // Difficulty multiplier
  function difficultyMultiplier() {
    const d = difficultySel.value || 'medium';
    switch(d){ case 'easy': return 0.8; case 'medium': return 1; case 'hard': return 1.25; case 'harder': return 1.5 }
    return 1;
  }

  function spawnObstacle(now) {
    const speed = T.baseSpeed * difficultyMultiplier();
    obstacles.push({ x: canvas.width/ (window.devicePixelRatio||1) + 60, y: canvas.height/ (window.devicePixelRatio||1) - 40, w:32, h:40, speed });
  }
  function spawnOrb(now) {
    orbs.push({ x: canvas.width/ (window.devicePixelRatio||1) + 60, y: 100 + Math.random()*200, r:10, speed: T.baseSpeed * difficultyMultiplier()*0.8 });
    if (orbs.length > T.maxOrbs) orbs.shift();
  }

  function update(dt) {
    // Input
    if (wantJump) { wantJump=false; jump(); }

    // Physics
    player.vy += T.gravity * (dt/16);
    player.y += player.vy * (dt/16);
    const ground = canvas.height/ (window.devicePixelRatio||1) - 20;
    if (player.y + player.h >= ground) { player.y = ground - player.h; player.vy=0; player.onGround=true; player.jumps=0 }

    // Spawn
    const now = performance.now();
    if (now - lastObstacle > T.obstacleInterval / difficultyMultiplier()) { spawnObstacle(now); lastObstacle = now }
    if (now - lastOrb > T.orbInterval) { spawnOrb(now); lastOrb = now }

    // Move obstacles & orbs
    for (let i=obstacles.length-1;i>=0;i--) {
      const o = obstacles[i]; o.x -= o.speed * dt/1000;
      if (o.x + o.w < -50) obstacles.splice(i,1);
      // collision
      if (rectsOverlap(player,o)) {
        // hit
          if (sounds.hit && sounds.hit.play) sounds.hit.play().catch(()=>{}); else synthPlay('hit');
        state = 'gameover';
        saveIfHigh();
      }
    }
    for (let i=orbs.length-1;i>=0;i--) {
      const o = orbs[i]; o.x -= o.speed * dt/1000;
      if (o.x + o.r < -50) orbs.splice(i,1);
      if (circleRectOverlap(o,player)) {
        orbs.splice(i,1); score+=10; scoreEl.textContent = 'Score: ' + score;
        if (sounds.orb && sounds.orb.play) sounds.orb.play().catch(()=>{}); else synthPlay('orb');
      }
    }

    // Score increases with time
    score += dt * 0.01 * difficultyMultiplier();
    scoreEl.textContent = 'Score: ' + Math.floor(score);

    // small animation tick
    player.anim += dt * 0.01;
  }

  function rectsOverlap(a,b){ return !(a.x+a.w < b.x || a.x > b.x+b.w || a.y+a.h < b.y || a.y > b.y+b.h) }
  function circleRectOverlap(c,r){ const cx = c.x; const cy=c.y; const rx=r.x; const ry=r.y; const rw=r.w; const rh=r.h; // adapt
    // approximate: point inside rect by orb center
    return !(cx < r.x || cx > r.x + r.w || cy < r.y || cy > r.y + r.h)
  }

  function draw() {
    const w = canvas.width/(window.devicePixelRatio||1);
    const h = canvas.height/(window.devicePixelRatio||1);
    ctx.clearRect(0,0,w,h);
    // background
    ctx.fillStyle = '#07203a'; ctx.fillRect(0,0,w,h);
    // ground
    ctx.fillStyle = '#1f3a2f'; ctx.fillRect(0,h-20,w,20);
    // player
    // simple animated player: bob when on ground and tint color when in air
    const bob = player.onGround ? Math.sin(player.anim) * 2 : Math.sin(player.anim*2) * 4;
    const py = player.y + bob;
    const color = player.onGround ? '#ffd166' : '#ffb4a2';
    ctx.fillStyle = color; ctx.fillRect(player.x, py, player.w, player.h);
    // obstacles
    ctx.fillStyle = '#ef476f'; obstacles.forEach(o => ctx.fillRect(o.x,o.y,o.w,o.h));
    // orbs
    ctx.fillStyle = '#4ad3ff'; orbs.forEach(o => { ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill() });
  }

  function loop(now) {
    const dt = Math.min(50, now - last); last = now;
    if (state === 'play') update(dt);
    draw();
    if (state !== 'pause') requestAnimationFrame(loop);
  }

  // Start/resume/pause controls
  function startGame(){ reset(); state='play'; startScreen.classList.add('hidden'); pauseScreen.classList.add('hidden'); leaderScreen.classList.add('hidden'); requestAnimationFrame((t)=>{ last = t; loop(t) }) }
  function togglePause(){ if (state==='play') { state='pause'; pauseScreen.classList.remove('hidden') } else if (state==='pause') { state='play'; pauseScreen.classList.add('hidden'); requestAnimationFrame((t)=>{ last=t; loop(t) }) } }
  function resume(){ if (state==='pause') togglePause(); }

  startBtn.addEventListener('click', ()=>{ const name = playerNameInput.value.trim() || 'Anon'; startGame() });
  pauseBtn.addEventListener('click', ()=>{ togglePause() });
  resumeBtn.addEventListener('click', ()=>{ resume() });
  leaderboardBtn.addEventListener('click', ()=>{ showLeaderboard() });
  backBtn.addEventListener('click', ()=>{ leaderScreen.classList.add('hidden'); startScreen.classList.remove('hidden') });

  function showLeaderboard(){ startScreen.classList.add('hidden'); leaderScreen.classList.remove('hidden'); fetchLeaderboard() }

  // Save score if it's a high score locally and send to server
  function saveIfHigh(){ const s = Math.floor(score); if (s > high) { high = s; localStorage.setItem('ss_high', high); highEl.textContent = 'High: ' + high; }
    // Post to server (non-blocking)
    const name = (playerNameInput.value || 'Anon').slice(0,40);
    postScore(name, Math.floor(score), difficultySel.value || 'medium');
  }

  function postScore(name, scoreVal, mode){
    try {
      fetch('../save_score.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name,score:scoreVal,mode}) })
        .then(r=>r.json()).then(j=>{ console.log('save result',j) }).catch(e=>console.warn('save failed',e));
    } catch(e){ console.warn('Post blocked', e) }
  }

  function fetchLeaderboard(){ leaderList.textContent='Loading...';
    fetch('../get_leaderboard.php')
      .then(r=>r.json())
      .then(j=>{
        if (!Array.isArray(j)) { leaderList.textContent = 'No results'; return }
        leaderList.innerHTML = '<ol>' + j.map(i=>`<li>${escapeHtml(i.name)} — ${i.score} (${escapeHtml(i.mode)})</li>`).join('') + '</ol>'
      }).catch(e=>{ leaderList.textContent = 'Failed to load' })
  }

  function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])) }

  // init
  resize();
  // draw initial frame
  requestAnimationFrame((t)=>{ last=t; draw() });

  // Expose for debugging
  window.ss = { startGame, togglePause, postScore, fetchLeaderboard };

})();
