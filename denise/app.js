import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const $ = s => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches, opened = false, progress = 0, target = 0, ready = false, replaying = false, viewProgress = 0;
const stage = $('#stage'), status = $('#load-status');
let stageWidth=stage.clientWidth, stageHeight=stage.clientHeight, stageVisible=true;
new ResizeObserver(([entry])=>{stageWidth=entry.contentRect.width;stageHeight=entry.contentRect.height;}).observe(stage);
new IntersectionObserver(([entry])=>{stageVisible=entry.isIntersecting;}).observe(stage);
const motion = $('#motion');
function setMotion() { motion.textContent = paused ? 'Animation fortsetzen' : 'Animation pausieren'; motion.setAttribute('aria-pressed', String(paused)); $('#replay').disabled = paused; }
setMotion();
motion.addEventListener('click', () => { paused = !paused; setMotion(); });
reduced.addEventListener('change', e => { paused = e.matches; setMotion(); });
function reveal() {
  opened = true; target = 1; document.body.classList.add('opened');
  $('#open').setAttribute('aria-expanded', 'true');
  $('#intro').inert = true; $('#intro').setAttribute('aria-hidden','true');
  $('#story').hidden = false;
  $('#gift').inert = false; $('#gift').setAttribute('aria-hidden', 'false');
  $('#replay').focus({preventScroll:true});
  if (paused) progress = 1;
}
$('#open').addEventListener('click', reveal);
$('#replay').addEventListener('click', () => { if (paused) return; target = 0; replaying = true; });

// A gentle particle sky: bounded particles, no full-screen flashes, no audio.
const sky = $('#fireworks'), ctx = sky.getContext('2d');
let sw = 1, sh = 1, particles = [], nextBurst = 0;
const stars = Array.from({length:65}, () => [Math.random(),Math.random(),Math.random()]);
function resizeSky() { sw = innerWidth; sh = innerHeight; const d = Math.min(devicePixelRatio,1.5); sky.width=sw*d; sky.height=sh*d; ctx.setTransform(d,0,0,d,0,0); }
resizeSky(); addEventListener('resize', resizeSky);
function burst() {
 const x = sw*(.12+Math.random()*.76), y=sh*(.1+Math.random()*.42);
 const color = ['#e6bd78','#ef9aab','#d4ddec'][Math.floor(Math.random()*3)];
 for(let i=0;i<65;i++){ const angle=Math.PI*2*i/65; const speed=25+Math.random()*53;
 particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1,decay:.22+Math.random()*.15,color}); }
}
function drawSky(dt, time) {
 ctx.clearRect(0,0,sw,sh);
 for(const [x,y,a] of stars){ctx.globalAlpha=.2+a*.4;ctx.fillStyle='#dbc6a4';ctx.beginPath();ctx.arc(x*sw,y*sh,.5+a*.7,0,Math.PI*2);ctx.fill();}
 if(!paused){nextBurst-=dt;if(nextBurst<=0){burst();nextBurst=opened?1.25:2.7;}}
 for(const p of particles){if(!paused){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=14*dt;p.vx*=Math.pow(.985,dt*60);p.life-=p.decay*dt;}ctx.globalAlpha=Math.max(0,p.life)*.85;ctx.strokeStyle=p.color;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.085,p.y-p.vy*.085);ctx.stroke();}
 particles=particles.filter(p=>p.life>0);ctx.globalAlpha=1;
}

let renderer, scene, camera, model, temple, cards=[], parts=[], userAngle=0, renderedAngle=0, dragStart=null;
const smooth = x => { x=THREE.MathUtils.clamp(x,0,1);return x*x*x*(x*(x*6-15)+10); };
function cardTexture(i) {
 const c=document.createElement('canvas');c.width=256;c.height=320;const x=c.getContext('2d');
 x.fillStyle='#f6ead7';x.fillRect(0,0,256,320);
 x.fillStyle=['#9e303f','#202d43','#bd894e','#556966','#705267'][i];x.fillRect(16,16,224,205);
 x.strokeStyle='#eed3a5';x.lineWidth=2;
 for(let j=0;j<11;j++){x.beginPath();x.arc(128,119,17+j*7,0,Math.PI*2);x.stroke();}
 x.fillStyle='#f5dec0';x.beginPath();x.arc(128,119,12,0,Math.PI*2);x.fill();
 x.fillStyle='#222835';x.font='bold 18px sans-serif';x.fillText('SONG 0'+(i+1),20,253);
 x.font='12px sans-serif';x.fillText('FÜR DEINE REISE',20,276);
 x.fillStyle='#a33945';x.fillRect(20,294,145,3);
 x.font='bold 14px sans-serif';x.fillText('NFC',195,301);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function fallback(error) {
 console.warn('3D preview unavailable:',error);
 document.body.classList.add('fallback');$('#fallback').hidden=false;
 if(renderer) renderer.domElement.hidden=true;
 status.textContent='';stage.setAttribute('aria-label','Explosionsansicht deines japanischen Tempels');
}
async function init() {
 try {
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x000000,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
 stage.append(renderer.domElement);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('WebGL context lost');});
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(34,1,.1,100);
 scene.add(new THREE.HemisphereLight(0xd4e0ff,0x805444,1.5));
 const key=new THREE.DirectionalLight(0xffe4b9,2.0);key.position.set(3,7,5);scene.add(key);
 const rim=new THREE.DirectionalLight(0x9bbdff,2.0);rim.position.set(-4,5,-4);scene.add(rim);
 const red=new THREE.PointLight(0xff6254,5,15);red.position.set(4,2,-2);scene.add(red);
 model=new THREE.Group();scene.add(model);
 const gltf=await new GLTFLoader().loadAsync('./assets/temple.glb');
 temple=gltf.scene;model.add(temple);
 temple.traverse(o=>{if(o.isMesh){o.userData.base=o.position.clone();parts.push(o);o.material.envMapIntensity=.6;}});
 const centers=[[-54,33],[0,33],[54,33],[-27.5,-33],[27.5,-33]];
 centers.forEach(([x,z],i)=>{
  const g=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(.90,.073,1.08),new THREE.MeshStandardMaterial({color:0xe9dfcd,roughness:.4}));g.add(body);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(.87,1.05),new THREE.MeshStandardMaterial({map:cardTexture(i),roughness:.58}));face.rotation.x=-Math.PI/2;face.position.y=.038;g.add(face);
  g.userData.start=new THREE.Vector3(x*.018,.105,-z*.018);g.position.copy(g.userData.start);g.userData.end=new THREE.Vector3((i-2)*.86,.84+(.12*(2-Math.abs(i-2))),1.22+(.18*(2-Math.abs(i-2))));model.add(g);cards.push(g);
 });
 ready=true;status.textContent='';
 stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||opened){dragStart={x:e.clientX,angle:userAngle};stage.setPointerCapture(e.pointerId);}});
 stage.addEventListener('pointermove',e=>{if(dragStart){userAngle=dragStart.angle+(e.clientX-dragStart.x)*.006;}});
 for(const event of ['pointerup','pointercancel','lostpointercapture']) stage.addEventListener(event,()=>{dragStart=null;});
 } catch(e) { fallback(e); }
}
init();
let last=performance.now(), elapsed=0;
function frame(now){
 requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;
 if(document.hidden)return;
 if(!paused)elapsed+=dt;
 drawSky(dt,elapsed);
 if(!ready||!stageVisible)return;
 if(!paused){
  const delta=target-progress;
  progress+=Math.sign(delta)*Math.min(Math.abs(delta),dt*.22);
  if(replaying&&progress<=0){target=1;replaying=false;}
 }
 viewProgress=paused&&opened?1:Math.min(opened?1:0,viewProgress+dt*.55);
 
 const p=smooth(progress);
 for(const mesh of parts){const name=mesh.name;let lift=0;if(name.startsWith('04_'))lift=2.8*smooth(progress*1.9);else if(name.startsWith('03_'))lift=1.85*smooth((progress-.12)*1.7);else if(name.startsWith('02_'))lift=1.28*smooth((progress-.24)*1.7);mesh.position.y=mesh.userData.base.y+lift;}
 cards.forEach((c,i)=>{const f=smooth((progress-.37-i*.035)*2.6);c.position.copy(c.userData.start).lerp(c.userData.end,f);c.rotation.x=f*.92;c.rotation.z=(i-2)*-.065*f;});
 renderedAngle+=(userAngle-renderedAngle)*(1-Math.exp(-dt*12));
 model.rotation.y=renderedAngle+.22+(.14*(1-p))+Math.sin(elapsed*.21)*.065;
 model.position.y=Math.sin(elapsed*.7)*.028;
 const w=stageWidth,h=stageHeight;
 if(!w||!h)return;
 if(renderer.domElement.width!==Math.floor(w*renderer.getPixelRatio())||renderer.domElement.height!==Math.floor(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);
 camera.aspect=w/h;
 const v=smooth(viewProgress),mobile=w<=700;
 const vertical=THREE.MathUtils.lerp(mobile?8.7:5.8,mobile?12.8:12.2,v);
 const distance=Math.max(vertical,4.9/camera.aspect)/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
 const look=THREE.MathUtils.lerp(1.08,2.55,v);
 camera.setViewOffset(w,h,-w*(mobile?.08:.20)*(1-v),-h*THREE.MathUtils.lerp(mobile?.22:.035,.005,v),w,h);
 camera.position.set(0,look+distance*.28,distance);camera.lookAt(0,look,0);camera.updateProjectionMatrix();renderer.render(scene,camera);
}
requestAnimationFrame(frame);
