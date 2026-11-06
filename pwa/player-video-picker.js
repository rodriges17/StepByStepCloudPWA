// The picker owns its sheet; media loading stays with the player.
export function createPlayerVideoPicker({screen,onSelect,onOpenChange=()=>{}}){
 const doc=screen.ownerDocument,win=doc.defaultView;
 const trigger=screen.querySelector('#playerVideoChoice');
 const count=trigger.querySelector('.player-video-count'),name=trigger.querySelector('.player-video-name');
 const dialog=doc.createElement('dialog');dialog.className='player-video-dialog';dialog.id='playerVideoDialog';dialog.setAttribute('aria-labelledby','playerVideoDialogTitle');
 const heading=doc.createElement('div');heading.className='player-video-sheet-heading';
 const title=doc.createElement('h2');title.id='playerVideoDialogTitle';title.textContent='Video auswählen';
 const cancel=doc.createElement('button');cancel.type='button';cancel.className='player-video-close';cancel.setAttribute('aria-label','Videoauswahl schließen');cancel.textContent='×';
 const options=doc.createElement('div');options.className='player-video-options';heading.append(title,cancel);dialog.append(heading,options);screen.append(dialog);
 trigger.setAttribute('aria-controls',dialog.id);
 let records=[],index=0,historyEntry=false,pendingBack=false;
 const label=i=>records[i]?.name||`Video ${i+1}`;
 function paint(){
  trigger.hidden=records.length<=1;
  count.textContent=`Video ${index+1} von ${records.length} ·`;
  name.textContent=label(index);trigger.title=label(index);
  trigger.setAttribute('aria-label',`Video auswählen: Video ${index+1} von ${records.length}, ${label(index)}`);
 }
 function dismiss({focus=true,history=true}={}){
  if(!dialog.open)return false;
  dialog.close();trigger.setAttribute('aria-expanded','false');onOpenChange(false);
  if(focus&&!trigger.hidden)trigger.focus({preventScroll:true});
  if(history&&historyEntry&&win.history.state?.playerVideoPicker){pendingBack=true;win.history.back();}
  historyEntry=false;return true;
 }
 function open({history=true}={}){
  if(records.length<=1||dialog.open||pendingBack)return;
  historyEntry=true;
  if(history)win.history.pushState({...win.history.state,playerVideoPicker:true},'',win.location.href);
  options.replaceChildren();
  records.forEach((record,i)=>{
   const option=doc.createElement('button');option.type='button';option.className='player-video-option';option.setAttribute('aria-pressed',String(i===index));
   const copy=doc.createElement('span');copy.className='player-video-option-copy';
   const position=doc.createElement('small');position.textContent=`Video ${i+1} von ${records.length}`;
   const text=doc.createElement('span');text.textContent=label(i);copy.append(position,text);
   const check=doc.createElement('span');check.setAttribute('aria-hidden','true');check.className='player-video-check';check.textContent=i===index?'✓':'';option.append(copy,check);
   option.onclick=()=>{const changed=i!==index;index=i;paint();dismiss();if(changed)onSelect(i);};options.append(option);
  });
  trigger.setAttribute('aria-expanded','true');onOpenChange(true);dialog.showModal();options.querySelector('[aria-pressed=true]')?.focus({preventScroll:true});
 }
 trigger.onclick=()=>open();cancel.onclick=()=>dismiss();dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dismiss();}});
 return {handlePopState(event){
  if(pendingBack){pendingBack=false;return true;}
  if(historyEntry){dismiss({history:false});historyEntry=false;return true;}
  if(event.state?.playerVideoPicker&&records.length>1){open({history:false});return true;}
  return false;
 },update(next,selected=0){records=next;index=selected;paint();},dismiss,get open(){return dialog.open;},reset(){dismiss({focus:false,history:false});pendingBack=false;historyEntry=false;records=[];index=0;paint();}};
}
