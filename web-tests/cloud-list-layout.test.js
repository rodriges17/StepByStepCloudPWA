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

test('library overview sorts names naturally, ignoring case and putting numbers first',async()=>{
 snapshot.libraries=['Zulu','Kurs 10','2 Salsa','alpha','Kurs 2','10 Salsa'].map((title,i)=>({...library,id:'lib-'+i,title}));
 await openCloud();
 await click(button('Bibliotheken'));
 assert.deepEqual([...document.querySelectorAll('#cloudBody .cloud-library-card h3')].map(n=>n.textContent),['2 Salsa','10 Salsa','alpha','Kurs 2','Kurs 10','Zulu']);
 await closeCloud();
});

test('list headings and the figures explanation stay outside scrolling content',async()=>{
 await openCloud();
 const info=button('Informationen zu Meine Figuren');
 assert.ok(info);
 assert.equal(info.closest('.cloud-scroll'),null);
 await click(info);
 const explanation=document.getElementById('cloudFiguresExplanation');
 assert.equal(explanation.hidden,false);
 assert.equal(explanation.closest('.cloud-scroll'),null);
 await click(button('Bibliotheken'));
 assert.equal(button('Bibliothek erstellen').closest('.cloud-scroll'),null);
 await click(button('Bibliothek erstellen'));
 assert.equal(document.getElementById('cloudListHeader').hidden,true);
 await closeCloud();
});

test('opening a library leaves its contents and back link in the existing scroller',async()=>{
 await openCloud(null,'library');
 assert.equal(document.getElementById('cloudListHeader').hidden,true);
 assert.ok(button('< Zurück zu allen Bibliotheken').closest('.cloud-scroll'));
 await closeCloud();
});

test('public library overview uses the same order and a fixed title without a create action',async()=>{
 snapshot.me=null;
 localStorage.removeItem(sessionKey);
 await openCloud();
 assert.deepEqual([...document.querySelectorAll('#cloudBody .cloud-library-card h3')].map(n=>n.textContent),['2 Salsa','10 Salsa','alpha','Kurs 2','Kurs 10','Zulu']);
 const title=[...document.querySelectorAll('h3')].find(n=>n.textContent==='Öffentliche Bibliotheken');
 assert.ok(title);
 assert.equal(title.closest('.cloud-scroll'),null);
 assert.equal(button('Bibliothek erstellen'),undefined);
 await closeCloud();
});
