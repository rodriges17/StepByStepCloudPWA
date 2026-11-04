import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
import {createPlayerView} from '../pwa/player-view.js';

async function fixture({android=false,native=false}={}) {
 const win=new Window({url:'https://example.test/pwa/'});
 win.document.body.innerHTML=await readFile(new URL('../pwa/index.html',import.meta.url),'utf8');
 const style=win.document.createElement('style');style.textContent=await readFile(new URL('../pwa/styles.css',import.meta.url),'utf8');win.document.head.append(style);
 if(android)Object.defineProperty(win.navigator,'userAgent',{value:'Mozilla/5.0 (Linux; Android 15) Chrome/130'});
 const screen=win.document.querySelector('#playerScreen');screen.hidden=false;win.document.body.classList.add('playing-screen');
 const video=win.document.querySelector('#learningVideo');
 const platform=native?{setFullscreen(value){win.nativeFullscreen=value;}}:null;
 const view=createPlayerView({screen,video,native:()=>platform});
 return {win,screen,view,close:()=>win.happyDOM.abort()};
}

test('an open figure hides all main navigation in normal mode and restores the overview navigation on close',async()=>{
 const {win,screen,close}=await fixture();try{
  for(const nav of win.document.querySelectorAll('.bottom-nav'))assert.equal(win.getComputedStyle(nav).display,'none');
  screen.hidden=true;win.document.body.classList.remove('playing-screen');
  assert.notEqual(win.getComputedStyle(win.document.querySelector('body > .bottom-nav')).display,'none');
 }finally{await close();}
});

test('Android PWA keeps browser system navigation by using app fullscreen without requesting immersive browser fullscreen',async()=>{
 const {win,screen,view,close}=await fixture({android:true});try{
  let requested=false;screen.requestFullscreen=async()=>{requested=true;};
  await view.enter();
  assert.equal(view.full,true);
  assert.equal(requested,false,'browser fullscreen would hide the Android navigation bar');
  assert.equal(screen.querySelector('.player-bottom').inert,true);
  await view.exit({history:false});
  assert.equal(view.full,false);
 }finally{await close();}
});

for(const native of [false,true])test(`${native?'native Android':'PWA'} Back hides the revealed menu before leaving fullscreen and preserves media state`,async()=>{
 const {win,screen,view,close}=await fixture({android:true,native});try{
  const video=screen.querySelector('video');video.currentTime=3;video.playbackRate=.5;
  await view.enter();
  assert.equal(screen.querySelector('.player-bottom').inert,true);
  win.document.dispatchEvent(new win.KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));
  assert.equal(screen.querySelector('.player-bottom').inert,false);
  assert.equal(view.back(),true);
  assert.equal(view.full,true,'first Back should only hide the menu');
  assert.equal(screen.querySelector('.player-bottom').inert,true);
  assert.equal(view.back(),true);
  assert.equal(view.full,false);
  assert.equal(video.currentTime,3);assert.equal(video.playbackRate,.5);
  assert.equal(view.back(),false,'normal player delegates closing the figure to its owner');
 }finally{await close();}
});
