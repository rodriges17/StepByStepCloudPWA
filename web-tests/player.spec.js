import {test,expect} from '@playwright/test';
test.use({serviceWorkers:'block'});
async function openPlayer(page,count=1,names=null){
 await page.goto('/pwa/');await page.waitForFunction(()=>document.documentElement.dataset.appVersion);
 await page.evaluate(async ({count,names})=>{
  const storage=await import('/pwa/storage.js'),blob=await(await fetch('/web-tests/fixtures/clip.mp4')).blob();
  await storage.saveFigure({id:'player-contract',title:'Player',description:'Beschreibung',tags:[],status:'Neu'},Array.from({length:count},(_,i)=>({id:'player-video-'+i,name:names?.[i]??'Video '+(i+1),blob,confirmed:true,duration:6,width:320,height:180})));
  dispatchEvent(new Event('focus'));
 },{count,names});
 await page.locator('[data-figure-id="player-contract"] .card-main').click();
 await page.waitForFunction(()=>{const v=document.querySelector('#learningVideo');return v.readyState>=2&&v.videoWidth>0&&document.querySelector('#videoLoading').hidden;});
}
async function swipe(page,up=true){await page.mouse.move(180,up?480:280);await page.mouse.down();await page.mouse.move(180,up?280:480,{steps:5});await page.mouse.up();}
test('first frame remains paused and loading errors can be retried',async({page})=>{
 await openPlayer(page);await expect(page.locator('#learningVideo')).toHaveJSProperty('paused',true);
 await page.screenshot({path:test.info().outputPath('compact-player.png')});
 await expect(page.getByRole('button',{name:'Loop',exact:true})).toHaveCount(0);
 await page.locator('#learningVideo').evaluate(v=>v.dispatchEvent(new Event('error')));
 await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();
 await expect(page.locator('#videoLoading')).toBeHidden();await expect(page.locator('#playerError')).toBeHidden();
 await expect(page.getByRole('button',{name:'Video starten',exact:true})).toBeVisible();
 await expect(page.locator('#learningVideo')).toHaveJSProperty('paused',true);
});
test('denied browser fullscreen keeps custom controls, tap playback and Back navigation',async({page})=>{
 await openPlayer(page,2);
 await page.evaluate(()=>{document.querySelector('#playerScreen').requestFullscreen=()=>Promise.reject(Error('denied'));document.querySelector('#learningVideo').webkitEnterFullscreen=()=>{throw Error('native video fallback must not be used');};});
 await page.locator('#speed').selectOption('0.5');await page.locator('#learningVideo').evaluate(v=>v.currentTime=.3);
 await page.locator('#fullscreen').click();await expect(page.locator('#playerScreen')).toHaveClass(/is-immersive/);
 await expect(page.locator('#playerScreen .screen-header')).toHaveJSProperty('inert',true);
 if(!/Android/i.test(await page.evaluate(()=>navigator.userAgent)))await expect(page.getByRole('status').filter({hasText:'Browserleisten'})).toBeVisible();
 const stage=await page.locator('#videoStage').boundingBox();await swipe(page);
 await expect(page.locator('#playerScreen .screen-header')).toHaveJSProperty('inert',false);
 expect(await page.locator('#videoStage').boundingBox()).toEqual(stage);
 await page.screenshot({path:test.info().outputPath('fullscreen-controls.png')});
 await expect(page.locator('#playerVideoChoice')).toBeVisible();await expect(page.locator('#playerDescription')).toBeHidden();
 await page.locator('#playerVideoChoice').click();await page.locator('#playerVideoDialog .player-video-option').nth(1).click();await expect(page.locator('#playerTitle')).toHaveText('Player');await expect(page.locator('#playerVideoChoice')).toContainText('Video 2 von 2');
 await page.keyboard.press('Escape');await expect(page.locator('#playerScreen')).toHaveClass(/is-immersive/);
 await expect(page.locator('#playerScreen .player-bottom')).toHaveJSProperty('inert',true);
 await page.keyboard.press('Escape');await expect(page.locator('#playerScreen')).not.toHaveClass(/is-immersive/);
 await expect(page.locator('#playerScreen')).toBeVisible();await expect(page.locator('#speed')).toHaveValue('0.5');
 await page.locator('#playerBack').click();await expect(page.locator('#playerScreen')).toBeHidden();
});
test('container fullscreen preserves state and hides controls on inactivity but not while scrubbing',async({page})=>{
 await openPlayer(page);
 await page.clock.install();await page.locator('#fullscreen').click();await swipe(page);
 await page.locator('#playPause').click();await expect(page.locator('#learningVideo')).toHaveJSProperty('paused',false);
 const seek=await page.locator('#seek').boundingBox();await page.mouse.move(seek.x+seek.width*.3,seek.y+seek.height/2);await page.mouse.down();
 await page.clock.fastForward(5000);await expect(page.locator('#playerScreen .screen-header')).toHaveJSProperty('inert',false);
 await page.mouse.up();await page.clock.fastForward(4100);await expect(page.locator('#playerScreen .screen-header')).toHaveJSProperty('inert',true);
 await page.mouse.click(180,300);await expect(page.locator('#learningVideo')).toHaveJSProperty('paused',true);
 await page.keyboard.press('ArrowUp');await page.clock.fastForward(6000);await expect(page.locator('#playerScreen .screen-header')).toHaveJSProperty('inert',false);
 await page.locator('#seek').focus();await page.keyboard.press('ArrowDown');await expect(page.locator('#playerScreen .screen-header')).toHaveJSProperty('inert',false);
 await page.locator('#videoStage').focus();await page.keyboard.press('ArrowDown');await expect(page.locator('#playerScreen .screen-header')).toHaveJSProperty('inert',true);
 await page.keyboard.press('Escape');await expect(page.locator('#playerScreen')).toBeVisible();await expect(page.locator('#playerScreen')).not.toHaveClass(/is-immersive/);
});

test('browser Back leaves fullscreen before leaving the player and keeps position and A–B',async({page})=>{
 await openPlayer(page);await page.locator('#learningVideo').evaluate(v=>v.currentTime=1);await page.locator('#markA').click();
 await page.locator('#learningVideo').evaluate(v=>v.currentTime=3);await page.locator('#markB').click();
 await page.locator('#speed').selectOption('0.5');await page.locator('#fitCrop').click();
 await page.locator('#fullscreen').click();await page.goBack();
 await expect(page.locator('#playerScreen')).toBeVisible();await expect(page.locator('#playerScreen')).not.toHaveClass(/is-immersive/);
 await expect(page.locator('#speed')).toHaveValue('0.5');await expect(page.locator('#fitCrop')).toHaveText('Crop');
 expect(await page.locator('#learningVideo').evaluate(v=>v.currentTime)).toBeGreaterThanOrEqual(2.9);
 await expect(page.locator('#abStatus')).toHaveText('A 0:01 · B 0:03');
 await page.goBack();await expect(page.locator('#playerScreen')).toBeHidden();
});

test('double taps seek within A–B and accumulate feedback while paused play can be hidden',async({page})=>{
 await openPlayer(page);await page.clock.install();
 await expect(page.getByRole('button',{name:'Video starten',exact:true})).toBeVisible({timeout:1500});
 await page.locator('#learningVideo').evaluate(v=>v.currentTime=1);await page.locator('#markA').click();
 await page.locator('#learningVideo').evaluate(v=>v.currentTime=3);await page.locator('#markB').click();
 const b=await page.locator('#videoStage').boundingBox();const y=b.y+b.height*.3;
 await page.mouse.dblclick(b.x+b.width*.85,y,{delay:80});
 await expect(page.locator('#learningVideo')).toHaveJSProperty('currentTime',3);
 await expect(page.locator('#learningVideo')).toHaveJSProperty('paused',true);
 await page.mouse.dblclick(b.x+b.width*.85,y,{delay:80});await expect(page.locator('.player-seek-feedback')).toHaveText('▶▶ 10 s');
 await page.mouse.dblclick(b.x+b.width*.15,y,{delay:80});await expect(page.locator('#learningVideo')).toHaveJSProperty('currentTime',1);
 await expect(page.locator('#learningVideo')).toHaveJSProperty('seeking',false);
 await page.mouse.click(b.x+b.width*.15,y);await page.clock.fastForward(350);await expect(page.getByRole('button',{name:'Video starten',exact:true})).toBeHidden();
 await page.mouse.click(b.x+b.width*.15,y);await page.clock.fastForward(350);await expect(page.getByRole('button',{name:'Video starten',exact:true})).toBeVisible();
});

test('fullscreen menu keeps browser safe area clear through rotation without moving video',async({page,browserName})=>{
 test.skip(browserName!=='chromium','Native browser safe-area emulation requires Chromium CDP');
 await openPlayer(page);await page.evaluate(()=>{document.querySelector('#playerScreen').requestFullscreen=()=>Promise.reject(Error('test viewport fallback'));});const cdp=await page.context().newCDPSession(page);
 await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{bottom:48}});
 await page.locator('#fullscreen').click();await page.keyboard.press('ArrowUp');
 const video=await page.locator('#videoStage').boundingBox();const button=await page.locator('#fullscreen').boundingBox();
 expect(button.y+button.height).toBeLessThanOrEqual(video.y+video.height-48-8);
 await page.keyboard.press('ArrowDown');expect(await page.locator('#videoStage').boundingBox()).toEqual(video);
 await page.setViewportSize({width:844,height:390});await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{bottom:0,right:48}});await page.keyboard.press('ArrowUp');
 const rotated=await page.locator('#fullscreen').boundingBox();expect(rotated.x+rotated.width).toBeLessThanOrEqual(844-48);
});

 test('changing video cancels delayed taps and loading errors hide the play affordance',async({page})=>{
 await openPlayer(page,2);await page.clock.install();
 const b=await page.locator('#videoStage').boundingBox();await page.mouse.click(b.x+b.width*.15,b.y+b.height*.3);
 await page.locator('#playerVideoChoice').click();await page.locator('#playerVideoDialog .player-video-option').nth(1).click();await page.clock.fastForward(400);
 await expect(page.getByRole('button',{name:'Video starten',exact:true})).toBeVisible();
 await page.mouse.dblclick(b.x+b.width*.15,b.y+b.height*.3,{delay:80});await expect(page.locator('.player-seek-feedback')).toBeVisible();
 await page.locator('#fullscreen').click();await expect(page.locator('.player-seek-feedback')).toBeHidden({timeout:100});
 await page.locator('#learningVideo').evaluate(v=>v.dispatchEvent(new Event('error')));
 await expect(page.getByRole('button',{name:'Video starten',exact:true})).toBeHidden();
 await expect(page.getByRole('button',{name:'Erneut versuchen',exact:true})).toBeVisible();
});

 test('Android PWA Back hides menu, exits fullscreen, then closes figure without showing the footer early',async({page,browserName})=>{
 test.skip(browserName!=='chromium','Android PWA fullscreen strategy');
 await openPlayer(page);
 await expect(page.locator('#playerScreen .bottom-nav')).toBeHidden();
 await page.locator('#fullscreen').click();
 expect(await page.evaluate(()=>document.fullscreenElement)).toBeNull();
 await expect(page.locator('#playerScreen .player-bottom')).toHaveJSProperty('inert',true);
 await page.keyboard.press('ArrowUp');await page.goBack();
 await expect(page.locator('#playerScreen')).toHaveClass(/is-immersive/);
 await expect(page.locator('#playerScreen .player-bottom')).toHaveJSProperty('inert',true);
 await page.goBack();await expect(page.locator('#playerScreen')).not.toHaveClass(/is-immersive/);
 await expect(page.locator('#playerScreen .bottom-nav')).toBeHidden();
 await page.goBack();await expect(page.locator('#playerScreen')).toBeHidden();
 await expect(page.locator('body > .bottom-nav')).toBeVisible();
});

test('header video picker keeps the figure title, a text-adjacent chevron and full names in the sheet',async({page})=>{
 const long='Rückansicht mit einer sehr ausführlichen Erklärung aller Schritte und Übergänge';
 await openPlayer(page,2,['Vorne',long]);
 const trigger=page.locator('#playerVideoChoice');
 await expect(page.locator('#playerTitle')).toHaveText('Player');
 await expect(trigger).toContainText('Video 1 von 2');
 expect((await trigger.boundingBox()).height).toBeGreaterThanOrEqual(44);
 const text=await page.locator('.player-video-label').boundingBox(),arrow=await page.locator('.player-video-chevron').boundingBox();
 expect(arrow.x-text.x-text.width).toBeCloseTo(8,0);
 await trigger.click();
 await expect(page.getByRole('button',{name:new RegExp(long)})).toBeVisible();
 await page.locator('#playerVideoDialog .player-video-option').nth(1).click();
 await expect(page.locator('#playerVideoDialog')).not.toBeVisible();
 await expect(trigger).toContainText(long);
 await expect(trigger).toBeFocused();
 await expect(page.locator('#playerTitle')).toHaveText('Player');
 const rotate=await page.locator('#rotatePlayer').boundingBox(),chevron=await page.locator('.player-video-chevron').boundingBox();
 expect(chevron.x+chevron.width).toBeLessThanOrEqual(rotate.x);
 await trigger.click();await page.goBack();
 await expect(page.locator('#playerVideoDialog')).not.toBeVisible();
 await expect(page.locator('#playerScreen')).toBeVisible();
 await page.locator('#playerBack').click();await expect(page.locator('#playerScreen')).toBeHidden();
});
test('a single-video figure has no video selection row',async({page})=>{
 await openPlayer(page);
 await expect(page.locator('#playerVideoChoice')).toBeHidden();
 await expect(page.locator('#playerTitle')).toHaveText('Player');
});
test('video selection remains operable while fullscreen controls would normally hide',async({page})=>{
 await openPlayer(page,2);await page.clock.install();
 await page.locator('#fullscreen').click();await page.keyboard.press('ArrowUp');
 await page.locator('#playPause').click();
 await page.locator('#playerVideoChoice').click();
 await page.clock.fastForward(5000);
 await expect(page.locator('#playerVideoDialog')).toBeVisible();
 await expect(page.locator('#playerScreen .screen-header')).toHaveJSProperty('inert',false);
 await page.getByRole('button',{name:'Videoauswahl schließen'}).click();
 await page.locator('#learningVideo').evaluate(v=>{v.pause();});
 await page.locator('#playPause').click();await page.clock.fastForward(4100);
 await expect(page.locator('#playerScreen .screen-header')).toHaveJSProperty('inert',true);
 await expect(page.locator('#playerVideoChoice')).toBeHidden();
 await expect(page.locator('#playerScreen .player-bottom')).toHaveJSProperty('inert',true);
 await page.keyboard.press('ArrowUp');
 await expect(page.locator('#playerVideoChoice')).toBeVisible();
});
