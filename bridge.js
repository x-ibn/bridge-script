/* bridge.js
   Configured for: Xibn 
   Upload to GitHub → Access via jsDelivr → Include in LP head/footer
*/

/* ============= CONFIG ============= */
const REDIRECT_URL = 'https://so-nic-188.live/register';
const META_PIXEL_ID = '563642226812250';
const TOKEN_ENDPOINT = '';  // optional: 'https://yourserver.com/get-js-token'
const TOKEN_TIMEOUT_MS = 3000;
/* ================================== */

(function(){
  const nowMs = () => Date.now();
  const safeFetch = (u, t=TOKEN_TIMEOUT_MS) => Promise.race([
    fetch(u, { credentials: 'omit' }),
    new Promise((_, rej) => setTimeout(()=> rej(new Error('timeout')), t))
  ]);

  function initMeta(id){
    if(!id) return;
    if(window.fbq) return;
    !function(f,b,e,v,n,t,s){
      if(f.fbq) return; n=f.fbq=function(){n.callMethod? n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq) f._fbq=n; n.push=n; n.loaded=!0; n.version='2.0'; n.queue=[];
      t=b.createElement(e); t.async=!0; t.src=v; s=b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t,s);
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', id); window.fbq('track','PageView');
  }
  function fireMeta(ev, obj){ try{ if(window.fbq) window.fbq('track', ev, obj||{}); }catch(e){} }

  async function runHeuristics(){
    const signals = { score: 0, details: [] };
    if(navigator.webdriver){ signals.details.push('webdriver'); signals.score -= 40; }

    const ua = navigator.userAgent || '';
    if(/HeadlessChrome|PhantomJS|Puppeteer|curl|wget|bot|spider/i.test(ua)){
      signals.details.push('ua-bot'); signals.score -= 40;
    }

    try { const hasPlugins = navigator.plugins && navigator.plugins.length>0; 
      if(hasPlugins) signals.score += 10; else { signals.details.push('no-plugins'); signals.score -= 10; } 
    } catch(e){}

    try{
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if(gl) signals.score += 12; else { signals.details.push('no-webgl'); signals.score -= 12; }
    }catch(e){ signals.details.push('webgl-error'); signals.score -= 6; }

    signals._mouse = 0;
    const mv = ()=> signals._mouse++;
    document.addEventListener('mousemove', mv, {passive:true});
    await new Promise(r => setTimeout(r, 600));
    document.removeEventListener('mousemove', mv);
    if(signals._mouse > 2) signals.score += 15; else { signals.details.push('no-mouse'); signals.score -= 10; }

    try{ if(navigator.language && navigator.language.length>1) signals.score += 5; }catch(e){}
    signals.score = Math.max(-100, Math.min(100, signals.score));
    return signals;
  }

  async function fetchToken(){
    if(!TOKEN_ENDPOINT) return null;
    try{
      const r = await safeFetch(TOKEN_ENDPOINT, TOKEN_TIMEOUT_MS);
      if(!r.ok) throw new Error('no-token');
      const t = (await r.text()).trim();
      if(!t || t.length < 20) throw new Error('bad-token');
      return t;
    }catch(e){
      console.warn('token fetch failed', e);
      return null;
    }
  }

  function createUI(){
    const existing = document.getElementById('__bridge_ui_card');
    if(existing) return existing;

    const card = document.createElement('div');
    card.id = '__bridge_ui_card';
    card.style.position = 'fixed';
    card.style.left = '50%';
    card.style.top = '48%';
    card.style.transform = 'translate(-50%, -50%)';
    card.style.zIndex = 999999;
    card.style.background = 'rgba(3,18,36,0.95)';
    card.style.color = '#fff';
    card.style.padding = '20px';
    card.style.borderRadius = '10px';
    card.style.boxShadow = '0 8px 30px rgba(0,0,0,0.6)';
    card.style.maxWidth = '420px';
    card.style.fontFamily = 'system-ui,Segoe UI,Roboto,Arial';

    card.innerHTML = `
      <div style="font-size:18px;font-weight:700;margin-bottom:6px">Teruskan ke Pendaftaran</div>
      <div style="font-size:13px;color:#cfe8ff;margin-bottom:12px">Kami melakukan pemeriksaan singkat untuk memastikan Anda bukan bot. Klik tombol di bawah untuk lanjut.</div>
      <div style="display:flex;gap:10px;align-items:center">
        <button id="__bridge_go" style="padding:10px 14px;border-radius:8px;border:none;background:#2fa6ff;color:#022334;font-weight:700;cursor:pointer">Lanjutkan</button>
        <div id="__bridge_status" style="font-size:13px;color:#bfe0ff"></div>
      </div>
      <div style="font-size:12px;color:#94c8f2;margin-top:10px">Jika halaman ini muncul beberapa detik, tunggu sebentar atau refresh.</div>
    `;
    document.body.appendChild(card);
    return card;
  }

  async function mainFlow(){
    initMeta(META_PIXEL_ID);
    const ui = createUI();
    const btn = ui.querySelector('#__bridge_go');
    const status = ui.querySelector('#__bridge_status');
    const pageLoad = nowMs();

    btn.addEventListener('click', async function onClick(e){
      e.preventDefault();
      status.innerHTML = 'Memeriksa...';
      btn.disabled = true;
      try{
        const heur = await runHeuristics();
        const timeSinceLoad = nowMs() - pageLoad;
        if(timeSinceLoad < 700){ heur.details.push('fast-click'); heur.score -= 18; }

        const threshold = 0;
        if(heur.score < threshold){
          const token = await fetchToken();
          if(token){
            fireMeta('CompleteRegistrationAttempt', {via:'bridge_token'});
            const url = new URL(REDIRECT_URL);
            url.searchParams.set('bridge_token', token);
            status.innerHTML = 'Memverifikasi...';
            setTimeout(()=> window.location.href = url.toString(), 350);
            return;
          }
          status.innerHTML = 'Perlu verifikasi: tekan lagi untuk lanjut';
          btn.disabled = false;
          const second = async function(ev){
            ev.preventDefault();
            btn.removeEventListener('click', second);
            status.innerHTML = 'Mengarahkan...';
            fireMeta('CompleteRegistrationAttempt', {via:'challenge_redirect'});
            const u = new URL(REDIRECT_URL);
            u.searchParams.set('suspicious','1');
            setTimeout(()=> window.location.href = u.toString(), 300);
          };
          btn.addEventListener('click', second);
          return;
        }

        const token2 = await fetchToken();
        const turl = new URL(REDIRECT_URL);
        if(token2) turl.searchParams.set('bridge_token', token2);
        fireMeta('InitiateCheckout', {bridge:1});
        status.innerHTML = 'Mengarahkan...';
        setTimeout(()=> window.location.href = turl.toString(), 250);
      }catch(err){
        console.error(err);
        status.innerHTML = 'Terjadi gangguan. Coba refresh';
        btn.disabled = false;
      }
    }, false);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mainFlow);
  else mainFlow();
})();
