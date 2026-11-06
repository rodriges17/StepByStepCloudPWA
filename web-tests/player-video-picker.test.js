import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
import {createPlayerView} from '../pwa/player-view.js';
import {createPlayerVideoPicker} from '../pwa/player-video-picker.js';
async function fixture({onOpenChange}={}){
 const win=new Window({url:'https://example.test/pwa/'});
 win.document.body.innerHTML=await readFile(new URL('../pwa/index.html',import.meta.url),'utf8');
 const screen=win.document.getElementById('playerScreen');screen.hidden=false;
 const selections=[];
 const picker=createPlayerVideoPicker({screen,onSelect:index=>selections.push(index),onOpenChange});
 return {win,screen,picker,selections,close:()=>win.happyDOM.abort()};
}
test('video selection lives below the figure title and lists complete names with the selected video marked',async()=>{
 const {win,screen,picker,selections,close}=await fixture();try{
  const title=screen.querySelector('#playerTitle');title.textContent='Italiana 1';
  picker.update([{name:'Frontansicht'},{name:'Rückansicht mit allen Details und Übergängen'}],0);
  const trigger=screen.querySelector('#playerVideoChoice');
  assert.ok(trigger.closest('.screen-header'));
  assert.match(trigger.textContent,/Video 1 von 2/);assert.match(trigger.textContent,/Frontansicht/);
  trigger.click();
  const dialog=screen.querySelector('dialog[open]');assert.ok(dialog);
  const options=[...dialog.querySelectorAll('[aria-pressed]')];
  assert.equal(options[0].getAttribute('aria-pressed'),'true');
  assert.match(options[1].textContent,/Rückansicht mit allen Details und Übergängen/);
  options[1].click();
  assert.deepEqual(selections,[1]);assert.equal(dialog.open,false);
  assert.equal(title.textContent,'Italiana 1');
  assert.match(trigger.textContent,/Video 2 von 2/);
  assert.equal(win.document.activeElement,trigger);
 }finally{await close();}
});

test('browser Back dismisses the video list before touching the player fullscreen entry',async()=>{
 const {win,screen,picker,close}=await fixture();try{
  win.history.replaceState({view:'player',playerFullscreen:true},'');
  picker.update([{name:'Vorne'},{name:'Hinten'}],0);screen.querySelector('#playerVideoChoice').click();
  assert.equal(win.history.state.playerVideoPicker,true);
  assert.equal(picker.handlePopState(new win.PopStateEvent('popstate',{state:{view:'player',playerFullscreen:true}})),true);
  assert.equal(picker.open,false);
  assert.equal(screen.querySelector('#playerVideoChoice').getAttribute('aria-expanded'),'false');
 }finally{await close();}
});

test('an open video list suspends the shared fullscreen timer and closing it resumes the same timer',async t=>{
 let view;
 const {win,screen,picker,close}=await fixture({onOpenChange:open=>view.selectionChanged(open)});try{
  const video=screen.querySelector('video');
  Object.defineProperty(video,'paused',{configurable:true,value:false});
  Object.defineProperty(win.navigator,'userAgent',{value:'Android'});
  view=createPlayerView({screen,video,native:()=>null});
  t.mock.timers.enable({apis:['setTimeout']});
  await view.enter();
  win.document.dispatchEvent(new win.KeyboardEvent('keydown',{key:'ArrowUp'}));
  picker.update([{name:'Vorne'},{name:'Hinten'}]);screen.querySelector('#playerVideoChoice').click();
  t.mock.timers.tick(5000);
  assert.equal(picker.open,true);assert.equal(view.controlsVisible,true);
  picker.dismiss();
  t.mock.timers.tick(4001);
  assert.equal(view.controlsVisible,false);
  assert.equal(screen.querySelector('.screen-header').inert,true);
  assert.equal(screen.querySelector('.player-bottom').inert,true);
 }finally{t.mock.timers.reset();await close();}
});
