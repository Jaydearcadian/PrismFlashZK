
const PRISM = (() => {
  const json = async (url) => { const r = await fetch(url + '?t=' + Date.now()); if(!r.ok) throw new Error(url + ' -> ' + r.status); return r.json(); };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const link = (url, text) => url ? '<a class="link" target="_blank" rel="noreferrer" href="'+esc(url)+'">'+esc(text||url)+'</a>' : '<span class="muted">pending</span>';
  function initParticles(){
    const container=document.getElementById('canvas-container'); if(!container || !window.THREE) return;
    const scene=new THREE.Scene(); scene.fog=new THREE.FogExp2('#141217',0.015);
    const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,100); camera.position.z=18;
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight); container.appendChild(renderer.domElement);
    const count=18000, geometry=new THREE.BufferGeometry(), positions=new Float32Array(count*3), colors=new Float32Array(count*3);
    const palette=['#d9a078','#e8d5cc','#f3e0d3','#a08575','#ffffff'].map(c=>new THREE.Color(c));
    for(let i=0;i<count;i++){const u=Math.random(),v=Math.random(),theta=u*2*Math.PI,phi=Math.acos(2*v-1),r=3.6+(Math.sin(theta*4)*Math.cos(phi*4)*.36)+(Math.random()*.45);positions[i*3]=r*Math.sin(phi)*Math.cos(theta);positions[i*3+1]=r*Math.sin(phi)*Math.sin(theta);positions[i*3+2]=r*Math.cos(phi);const c=palette[Math.floor(Math.random()*palette.length)];colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b}
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3)); geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    const material=new THREE.PointsMaterial({size:.022,vertexColors:true,transparent:true,opacity:.78,blending:THREE.AdditiveBlending,depthWrite:false});
    const ps=new THREE.Points(geometry,material); scene.add(ps); ps.position.x=2.1; ps.position.y=.45;
    let mx=0,my=0,tx=0,ty=0; addEventListener('mousemove',e=>{mx=(e.clientX-innerWidth/2)/100; my=(e.clientY-innerHeight/2)/100});
    addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); if(innerWidth<768){ps.position.x=0; ps.position.y=1; camera.position.z=22}else{ps.position.x=2.1; ps.position.y=.45; camera.position.z=18}});
    const base=geometry.attributes.position.array;
    function animate(){requestAnimationFrame(animate); tx+=(mx-tx)*.04; ty+=(my-ty)*.04; ps.rotation.y+=.0015; ps.rotation.x+=.0008; ps.rotation.y+=tx*.0002; ps.rotation.x+=ty*.0002; const t=Date.now()*.0005; const arr=geometry.attributes.position.array; for(let i=0;i<count;i+=30){arr[i*3]=base[i*3]+Math.sin(t+i*.01)*.015; arr[i*3+1]=base[i*3+1]+Math.cos(t+i*.015)*.015} geometry.attributes.position.needsUpdate=true; renderer.render(scene,camera)} animate();
  }
  function artifactCard(artifact){
    return '<div class="grid grid-3 section">'+
      '<div class="card"><h3>Stellar Registry</h3><div class="muted">'+esc(artifact.stellar?.registryContract)+'</div><p>'+link(artifact.stellar?.contractExplorer,'Open contract')+'</p></div>'+
      '<div class="card"><h3>Base Sepolia</h3><div class="muted">'+esc(artifact.chains?.['base-sepolia']?.address)+'</div><p>'+link(artifact.chains?.['base-sepolia']?.explorer,'Open ERC20')+'</p></div>'+
      '<div class="card"><h3>Solana Devnet</h3><div class="muted">'+esc(artifact.chains?.['solana-devnet']?.mint)+'</div><p>'+link(artifact.chains?.['solana-devnet']?.explorer,'Open SPL mint')+'</p></div>'+
      '</div>';
  }
  function renderJson(el, data){el.textContent=JSON.stringify(data,null,2)}
  async function loadToken(){try{return await json('/api/artifacts/token')}catch(e){return json('/deployments/tokens/Z0.latest.json')}}
  async function loadSupply(){try{return await json('/api/artifacts/supply')}catch(e){return json('/deployments/tokens/Z0.supply.json')}}
  async function loadMaybe(url){try{return await json(url)}catch(e){return {error:e.message}}}
  return {json,esc,link,initParticles,artifactCard,renderJson,loadToken,loadSupply,loadMaybe};
})();
function prismReady(fn){
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
}
prismReady(PRISM.initParticles);
