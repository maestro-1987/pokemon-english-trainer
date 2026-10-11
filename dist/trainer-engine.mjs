import {shuffle,letterBank,applyLetter} from './engine.mjs';
export {shuffle,applyLetter};
export const STAGES=['spell1','spell2','spell3','review'];
export const STAGE_NAMES={listen:'旧版听辨',spell1:'补字母',spell2:'词义输入',spell3:'听写',review:'复习听写'};
export const cleanText=s=>String(s??'').replace(/[^a-z]/gi,'').toLowerCase();
export function checkInput(word,typed){return [word.text,...(word.forms||[])].some(t=>cleanText(t)===cleanText(typed))}
export function wordStats(state,word,player=null){
 const rows=state.records.filter(r=>r.item===word.id&&r.book===word.book&&(player==null||r.player===player)&&['answer','practice'].includes(r.type));
 const encounters=new Set(rows.map(r=>`${r.session}:${r.taskId||r.item+':'+r.stage}:${r.player}`));
 return {times:encounters.size,correct:rows.filter(r=>r.type==='answer'&&r.correct&&r.event!=='letter').length,independent:rows.filter(r=>r.type==='answer'&&r.correct&&!r.assisted&&r.scope!=='coop'&&r.scope!=='relay'&&r.event!=='letter').length,helped:rows.filter(r=>r.type==='answer'&&r.correct&&r.assisted).length,errors:rows.filter(r=>r.type==='answer'&&!r.correct).length};
}
export const PARTNERS=[
 {id:'025',name:'皮卡丘',move:'十万伏特',type:'electric',chain:['025','026']},
 {id:'001',name:'妙蛙种子',move:'藤鞭',type:'grass',chain:['001','002','003']},
 {id:'004',name:'小火龙',move:'火花',type:'fire',chain:['004','005','006']},
 {id:'007',name:'杰尼龟',move:'水枪',type:'water',chain:['007','008','009']},
 {id:'133',name:'伊布',move:'星星冲击',type:'star',chain:['133']},
 {id:'039',name:'胖丁',move:'旋律光环',type:'music',chain:['039','040']},
 {id:'052',name:'喵喵',move:'聚宝功',type:'star',chain:['052','053']},
 {id:'143',name:'卡比兽',move:'泰山压顶',type:'earth',chain:['143']}
];
export const NAMES={'026':'雷丘','002':'妙蛙草','003':'妙蛙花','005':'火恐龙','006':'喷火龙','008':'卡咪龟','009':'水箭龟','040':'胖可丁','053':'猫老大',...Object.fromEntries(PARTNERS.map(p=>[p.id,p.name]))};
export function createState(old={}){
 const players=(old.players||[{name:'小训练家',partner:'025'},{name:'大训练家',partner:'001'}]).map(p=>({...p,xp:p.xp||{},evolved:p.evolved||{},rewards:p.rewards||{}}));
 return {...old,version:3,book:old.book||'upper',players,records:old.records||[],rounds:old.rounds||{},badges:old.badges||{},partners:old.partners||{'025':1,'001':1},settings:{music:true,effects:true,reduced:false,...old.settings},sessions:old.version===3?(old.sessions||{}):{},wrong:old.wrong||{}};
}
export function progress(state,word,stage){return state.records.filter(r=>r.book===word.book&&r.item===word.id&&r.stage===stage&&r.scope==='solo'&&r.player===0&&r.type==='answer'&&r.correct&&!r.assisted).length>0}
export function wordOverview(data,state,book){const words=data.words.filter(w=>w.book===book);return {words:words.length,seen:words.filter(w=>wordStats(state,w).times>0).length,completed:words.filter(w=>wordStats(state,w).correct>0).length,done:words.reduce((n,w)=>n+STAGES.filter(s=>progress(state,w,s)).length,0),tasks:words.length*STAGES.length,mastered:words.filter(w=>STAGES.every(s=>progress(state,w,s))).length,wrong:wrongList(state,book).length}}
function key(book,player,word){return `${book}:${player}:${word}`}
export function wrongList(state,book,player=null){return Object.values(state.wrong||{}).filter(w=>w.book===book&&(player==null||w.player===player))}
export function trackWrong(state,record){
 if(record.type!=='answer'||record.stage==='listen')return;const id=key(record.book,record.player,record.item),entry=state.wrong[id];
 if(!record.correct){state.wrong[id]={...entry,id,book:record.book,player:record.player,item:record.item,stage:record.stage,streak:0,errors:(entry?.errors||0)+1,lastSession:record.session,lastAt:record.at};return}
 // A clean answer must be in a different attempt/session from the previous error or clean answer.
 if(!entry)return;if(record.assisted){entry.streak=0;entry.lastSession=record.session;return}
 if(record.scope==='coop'||record.scope==='relay'||entry.lastSession===record.session)return;
 entry.streak++;entry.lastSession=record.session;entry.lastAt=record.at;if(entry.streak>=2)delete state.wrong[id];
}
export function recordAttempt(state,session,task,{correct,assisted=false,player=0,type='answer',event='submit'}){
 const record={id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`,at:Date.now(),book:session.book,item:task.item,stage:task.stage,scope:session.scope,player,session:session.id,round:session.round,taskId:task.id,event,type,correct,assisted};state.records.push(record);trackWrong(state,record);return record;
}
export function migrate(old,data){
 const state=createState(old),byId=new Map(data.words.map(w=>[w.id,w]));state.wrong={};
 state.records=state.records.map(r=>{const w=byId.get(data.aliases?.[r.item]||r.item);return w?{...r,...(r.item!==w.id?{originalItem:r.item,originalBook:r.book}:{}),item:w.id,book:w.book}:r});
 // Old tile tasks were guided: retain their evidence without claiming independent typed input.
 if(old.version!==3)state.records=state.records.map(r=>r.stage==='spell2'&&r.correct?{...r,assisted:true,legacyGuided:true}:r);
 for(const r of state.records)if(byId.has(r.item))trackWrong(state,r);
 for(const [b,s]of Object.entries(state.sessions))if(s.version!==3||s.tasks.some(t=>!byId.has(t.item)||byId.get(t.item).book!==b))delete state.sessions[b];
 return state;
}
export function evolutionFor(player,base){const p=PARTNERS.find(p=>p.id===base)||PARTNERS[0],xp=player.xp?.[p.id]||0;const stage=xp>=70?2:xp>=24?1:0;return {base:p.id,id:p.chain[Math.min(stage,p.chain.length-1)],stage:Math.min(stage,p.chain.length-1),xp,next:p.chain.length>stage+1?(stage===0?24:70):null,...{type:p.type,move:p.move}}}
export function grantXp(state,player,session,task,assisted){
 session.awarded??=[];const id=`${player}:${task.id}`;if(session.awarded.includes(id))return null;session.awarded.push(id);const p=state.players[player],base=PARTNERS.find(x=>x.id===p.partner)?.id||'025',before=evolutionFor(p,base);p.xp[base]=(p.xp[base]||0)+(assisted?1:2);const after=evolutionFor(p,base);if(before.id!==after.id){p.evolved[after.id]=true;return {from:before.id,to:after.id}}return null;
}
export function buildRound(data,state,book,{mode='energy',random=Math.random,player=null}={}){
 const scope=['gym','coop','relay'].includes(mode)?mode:'solo',round=(state.rounds[book]||0)+1,words=data.words.filter(w=>w.book===book),count=i=>state.records.filter(r=>r.book===book&&r.item===i.id&&r.scope===scope&&r.type==='answer').length;
 let tasks=[];
 if(mode==='mistakes'){
   tasks=shuffle(wrongList(state,book,player),random).slice(0,8).map((w,n)=>({id:`retry-${n}-${w.id}`,item:w.item,stage:w.stage,owner:w.player,fromWrong:true}));
 }else if(scope!=='solo'){
   const pool=[...words].sort((a,b)=>count(a)-count(b)||a.text.length-b.text.length).slice(0,mode==='gym'?6:4);
   if(mode==='gym')tasks=pool.map((w,n)=>({id:`gym-${n}`,item:w.id,stage:count(w)<2?'spell1':'spell3'}));
   if(mode==='coop')tasks=pool.flatMap((w,n)=>[{id:`coop-${n}-a`,item:w.id,stage:'spell1',owner:n%2,pair:n},{id:`coop-${n}-b`,item:w.id,stage:'spell3',owner:1-n%2,pair:n}]);
   if(mode==='relay')tasks=pool.map((w,n)=>({id:`relay-${n}`,item:w.id,stage:'spell2',owner:n%2}));
 }else{
   const pending=[];
   for(const w of words){const done=s=>progress(state,w,s),seen=state.records.some(r=>r.item===w.id&&r.scope==='solo'&&r.type==='answer');
    for(const stage of STAGES){if(done(stage))continue;if(stage==='spell2'&&!state.records.some(r=>r.item===w.id&&r.stage==='spell1'&&r.correct))continue;if(stage==='spell3'&&!state.records.some(r=>r.item===w.id&&r.stage==='spell2'&&r.correct))continue;if(stage==='review'&&!state.records.some(r=>r.item===w.id&&r.stage==='spell3'&&r.correct&&r.round<round))continue;
     pending.push({id:w.id+':'+stage,item:w.id,stage,unit:w.source.unit,rank:seen?1:0,length:w.text.length,error:wrongList(state,book).some(e=>e.item===w.id&&e.stage===stage)});
    }
   }
   pending.sort((a,b)=>a.rank-b.rank||a.length-b.length||a.id.localeCompare(b.id));let previous=null;
   for(let n=0;n<8&&pending.length;n++){let pool=pending;if(n===6){const errors=pool.filter(t=>t.error);if(errors.length)pool=errors}
    const chosen=pool.find(t=>t.unit!==previous)||pool[0];tasks.push(chosen);pending.splice(pending.indexOf(chosen),1);previous=chosen.unit;
   }
   if(!tasks.length){const pool=shuffle(words,random).slice(0,8);tasks=pool.map((w,n)=>({id:w.id+':practice-'+n,item:w.id,stage:'review',practice:true}))}
   if(mode==='egg'&&tasks.length>1){const first=tasks[0];tasks[tasks.length-1]={id:first.item+':egg-recall',item:first.item,stage:'spell3',practice:true,eggReview:true}}
 }
 return {version:3,id:`${book}-${round}-${Date.now()}-${random()}`,book,round,mode,scope,tasks,index:0,current:null,scores:[0,0],contributions:[0,0],results:[],eggEnergy:0,awarded:[],evolutions:[],completed:false};
}
export function questionFor(data,word,stage,random=Math.random){
 const level=stage==='review'||stage==='listen'?3:Number(stage.replace('spell',''))||2;
 return {type:'input',listen:word.text,word:word.text,level,bank:letterBank(word.text,level,random),answer:word.text};
}
export function completeRound(state,session){if(session.completed)return;session.completed=true;if(session.results.filter(r=>r.correct).length>=3){state.badges[session.book]??=[];state.badges[session.book].push(session.id);const next=PARTNERS.find(p=>!state.partners[p.id])||PARTNERS[(session.round-1)%PARTNERS.length];state.partners[next.id]=(state.partners[next.id]||0)+1;session.reward=next.id;state.players.forEach((p,n)=>{if(session.scores[n]>0)p.rewards[next.id]=(p.rewards[next.id]||0)+1})}}
