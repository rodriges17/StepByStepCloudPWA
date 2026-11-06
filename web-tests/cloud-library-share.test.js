import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';

const window=new Window({url:'http://localhost/pwa/',settings:{disableCSSFileLoading:true,disableJavaScriptFileLoading:true}});
globalThis.window=window;
for(const key of ['document','location','history','localStorage','Event','CustomEvent','Image','IntersectionObserver'])globalThis[key]=window[key];
Object.defineProperty(globalThis,'navigator',{configurable:true,value:window.navigator});
for(const key of ['addEventListener','dispatchEvent','requestAnimationFrame'])globalThis[key]=window[key].bind(window);
window.HTMLElement.prototype.scrollIntoView=function(){};
document.body.innerHTML=await readFile(new URL('../pwa/index.html',import.meta.url),'utf8');
const sessionKey=`salsa-cloud-session:${new URL('../pwa/',import.meta.url).pathname}:v1`;
localStorage.setItem(sessionKey,JSON.stringify({access_token:'test',refresh_token:'test',expires_at:Date.now()+3600000,cache_id:'navigation-test'}));
const revision={id:'revision',figure_id:'figure',title:'Drehung',description:'Figurenbeschreibung',tags:['Salsa','Figur'],videos:[{id:'video',name:'Video',type:'video/mp4',size:20}]};
const library={id:'library',title:'Kurs',description:'Bibliotheksbeschreibung',visibility:'public',owner_id:'me',edit_version:'v1'};
const snapshot={me:{id:'me',email:'me@test.ch',upload_enabled:true,is_admin:false,used:0,quota:100},own_figures:[{id:'figure',owner_id:'me',public_allowed:true,revisions:[revision]}],libraries:[library]};
const calls=[];let holdState=null;
globalThis.fetch=async(_url,options)=>{
 const {action,payload}=JSON.parse(options.body);
 if(action==='library_commit')library.title=payload.title;
 calls.push(action);
 const result=action==='state'?structuredClone(snapshot):action==='library'?{library,manage:true,members:[],entries:[{figure_id:'figure',published:revision}]}:{};
 if(action==='state'&&holdState){const hold=holdState;holdState=null;await hold();}
 return new Response(JSON.stringify(result),{headers:{'Content-Type':'application/json'}});
};
const {initCloud,openCloud,closeCloud}=await import('../pwa/cloud.js');
const prompts=[];
initCloud({localFigures:async()=>[],chooseImport:async()=>({}),confirm:async options=>{prompts.push(options);return false;}});
const button=name=>{const buttons=[...document.querySelectorAll('button')];return buttons.find(b=>b.textContent===name)||buttons.find(b=>b.getAttribute('aria-label')===name);};
const click=async el=>{assert.ok(el,'control exists');await el.onclick();};

test('library sharing uses the current public PWA address and preserves its identifier',async()=>{
 await openCloud(null,'library');
 const input=document.querySelector('.cloud-library-link input');
 assert.ok(input);
 assert.equal(input.value,'https://rodriges17.github.io/StepByStepCloudPWA/?library=library');
 await closeCloud();
});

