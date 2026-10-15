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
 {id:'143',name:'卡比兽',move:'泰山压顶',type:'earth',chain:['143']},
 {id:'010',name:'绿毛虫',move:'吐丝',type:'grass',chain:['010','011','012']},
 {id:'016',name:'波波',move:'起风',type:'star',chain:['016','017','018']},
 {id:'037',name:'六尾',move:'火花',type:'fire',chain:['037','038']},
 {id:'054',name:'可达鸭',move:'水枪',type:'water',chain:['054','055']},
 {id:'058',name:'卡蒂狗',move:'火焰轮',type:'fire',chain:['058','059']},
 {id:'060',name:'蚊香蝌蚪',move:'泡沫光线',type:'water',chain:['060','061','062']},
 {id:'066',name:'腕力',move:'空手劈',type:'earth',chain:['066','067','068']},
 {id:'077',name:'小火马',move:'火焰轮',type:'fire',chain:['077','078']},
 {id:'147',name:'迷你龙',move:'龙之怒',type:'star',chain:['147','148','149']},
 {id:'280',name:'拉鲁拉丝',move:'念力',type:'star',chain:['280','281','282']},
 {id:'092',name:'鬼斯',move:'暗影球',type:'star',chain:['092','093','094']}
];
export const EEVEE_FORMS=[{id:'134',name:'水伊布',type:'water',move:'水之波动'},{id:'135',name:'雷伊布',type:'electric',move:'电光闪耀'},{id:'136',name:'火伊布',type:'fire',move:'火焰旋风'},{id:'196',name:'太阳伊布',type:'star',move:'念力星光'},{id:'197',name:'月亮伊布',type:'star',move:'月光冲击'},{id:'470',name:'叶伊布',type:'grass',move:'叶片旋舞'},{id:'471',name:'冰伊布',type:'water',move:'冰晶波动'},{id:'700',name:'仙子伊布',type:'star',move:'缎带星光'}];
export const NAMES={'011':'铁甲蛹','012':'巴大蝶','017':'比比鸟','018':'大比鸟','038':'九尾','055':'哥达鸭','059':'风速狗','061':'蚊香君','062':'蚊香泳士','067':'豪力','068':'怪力','078':'烈焰马','148':'哈克龙','149':'快龙','281':'奇鲁莉安','282':'沙奈朵','093':'鬼斯通','094':'耿鬼','026':'雷丘','002':'妙蛙草','003':'妙蛙花','005':'火恐龙','006':'喷火龙','008':'卡咪龟','009':'水箭龟','040':'胖可丁','053':'猫老大',...Object.fromEntries([...PARTNERS,...EEVEE_FORMS].map(p=>[p.id,p.name]))};
const num=n=>Number.isFinite(n)?Math.max(0,Math.min(1000000,Math.floor(n))):0;
const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`;
const regions=['关都','城都','丰缘','神奥','合众','卡洛斯','阿罗拉','伽勒尔','帕底亚'];
function blankEgg(){return {id:uid(),energy:0,contributions:[0,0],words:[],reviewIndex:0}}
function normalizeEgg(e){return {id:typeof e?.id==='string'?e.id:uid(),energy:Math.min(72,num(e?.energy)),contributions:[0,1].map(k=>Math.min(12,num(e?.contributions?.[k]))),words:Array.isArray(e?.words)?[...new Set(e.words.filter(x=>typeof x==='string'))]:[],reviewIndex:num(e?.reviewIndex)}}
function normalizePlayer(p){
 const validForm=f=>EEVEE_FORMS.some(x=>x.id===f)?f:null;
 const existing=Array.isArray(p.collection)&&p.collection.some(c=>c&&PARTNERS.some(b=>b.id===c.base));
 const collection=existing?p.collection.filter(c=>c&&PARTNERS.some(b=>b.id===c.base)).map(c=>({id:String(c.id),base:c.base,region:String(c.region||'').slice(0,60),xp:num(c.xp),stage:Math.min(PARTNERS.find(b=>b.id===c.base).chain.length-1,num(c.stage)),form:validForm(c.form),words:Array.isArray(c.words)?[...new Set(c.words.filter(w=>typeof w==='string'))]:[],origin:c.origin==='egg'?'egg':'starter'})):PARTNERS.slice(0,8).map(b=>({id:b.id,base:b.id,region:'',xp:num(p.xp?.[b.id]),stage:b.id==='133'?0:Math.min(b.chain.length-1,num(p.xp?.[b.id])>=70?2:num(p.xp?.[b.id])>=24?1:0),form:b.id==='133'?validForm(p.eeveeEvolution):null,words:[],origin:'starter'}));
 const ids=new Set();for(const c of collection){if(ids.has(c.id))c.id=uid();ids.add(c.id)}
 return {...p,collection,partner:collection.some(c=>c.id===p.partner)?p.partner:collection[0].id,xp:p.xp||{},evolved:p.evolved||{},rewards:p.rewards||{},eeveeEvolution:validForm(p.eeveeEvolution)};
}
export function createState(old={}){
 const players=(old.players||[{name:'小训练家',partner:'025'},{name:'大训练家',partner:'001'}]).map(normalizePlayer);
 return {...old,version:3,collectionVersion:1,soloPlayer:old.soloPlayer===1?1:0,book:old.book||'upper',players,records:old.records||[],rounds:old.rounds||{},badges:old.badges||{},partners:old.partners||{'025':1,'001':1},settings:{music:true,effects:true,reduced:false,...old.settings},sessions:old.version===3?(old.sessions||{}):{},wrong:old.wrong||{},hatching:{books:Object.fromEntries(['upper','lower','grade2upper'].map(b=>[b,{solo:[0,1].map(k=>normalizeEgg(old.hatching?.books?.[b]?.solo?.[k])),coop:normalizeEgg(old.hatching?.books?.[b]?.coop)}]))}};
}
export function companion(player,id=player.partner){return player.collection.find(c=>c.id===id)||player.collection[0]}
export function companionName(player,id=player.partner){const c=companion(player,id);return NAMES[evolutionFor(player,c.id).id]+(c.region?'·'+c.region:'')}
export function eggFor(state,mode,player=state.soloPlayer){state.hatching.books??={};const book=state.book||'upper';state.hatching.books[book]??={solo:[blankEgg(),blankEgg()],coop:blankEgg()};return mode==='coop'?state.hatching.books[book].coop:state.hatching.books[book].solo[player]}
export function eggStage(egg){return Math.min(2,Math.floor(egg.energy/24))}
export const EGG_STAGES=['蛋的苏醒','破壳准备','孵化揭晓'];
export function prepareEggTask(state,session,task,data){
 if(!['egg','coop'].includes(session.mode))return;
 const egg=eggFor(state,session.mode,session.player),stage=eggStage(egg);
 task.stage=['spell1','spell2','review'][stage];
 if(session.mode==='coop')task.owner=egg.contributions[0]>=12?1:egg.contributions[1]>=12?0:session.index%2;
 if(stage===2){const pool=egg.words.filter(id=>data.words.some(w=>w.id===id&&w.book===session.book));if(pool.length){task.item=pool[egg.reviewIndex%pool.length];egg.reviewIndex++}task.stage=state.records.some(r=>r.item===task.item&&r.stage==='spell3'&&r.correct&&!r.assisted&&r.player===(task.owner??session.player)&&r.scope===session.scope)?'review':'spell3'}
}
export function addEggEnergy(state,session,task,player,assisted){
 if(!['egg','coop'].includes(session.mode))return 0;
 const egg=eggFor(state,session.mode,session.player),key=`${egg.id}:${task.id}:${player}`;
 session.eggAwarded??=[];if(egg.energy>=72||session.eggAwarded.includes(key))return 0;
 session.eggAwarded.push(key);const room=24-egg.energy%24;
 const amount=Math.min(assisted?1:2,room,session.mode==='coop'?12-egg.contributions[player]:24);
 egg.energy+=amount;if(session.mode==='coop')egg.contributions[player]+=amount;
 if(!egg.words.includes(task.item))egg.words.push(task.item);
 if(egg.energy<72&&egg.energy%24===0)egg.contributions=[0,0];
 return amount;
}
export function randomSpecies(random=Math.random){let n=Math.min(.999999,Math.max(0,random()))*100;for(const p of PARTNERS){n-=p.id==='133'?10:5;if(n<0)return p}return PARTNERS.at(-1)}
function addCompanion(state,player,base){
 const p=state.players[player];let region='',n=0;
 // One unique location per family across both trainers prevents future evolution name collisions.
 const used=new Set(state.players.flatMap(p=>p.collection.filter(c=>c.base===base).map(c=>c.region)));
 while(used.has(region)){region=n<regions.length?regions[n]:`${regions[n%regions.length]}·冒险营地${Math.floor(n/regions.length)}`;n++}
 const c={id:uid(),base,region,xp:0,stage:0,form:null,words:[],origin:'egg'};p.collection.push(c);return {player,id:c.id,base,region};
}
export function claimEgg(state,mode,player=state.soloPlayer,random=Math.random){
 const egg=eggFor(state,mode,player);if(egg.energy<72)return [];
 const rewards=(mode==='coop'?[0,1]:[player]).map(k=>addCompanion(state,k,randomSpecies(random).id));
 if(mode==='coop')state.hatching.books[state.book].coop=blankEgg();else state.hatching.books[state.book].solo[player]=blankEgg();
 return rewards;
}
export function progress(state,word,stage,player=state.soloPlayer||0){return state.records.filter(r=>r.book===word.book&&r.item===word.id&&r.stage===stage&&r.scope==='solo'&&r.player===player&&r.type==='answer'&&r.correct&&!r.assisted).length>0}
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
export function evolutionFor(player,id){
 const c=companion(player,id),p=PARTNERS.find(p=>p.id===c.base),form=c.base==='133'?EEVEE_FORMS.find(f=>f.id===c.form):null;
 const stage=form?1:c.stage,next=c.base==='133'?!form:p.chain.length>stage+1;
 return {base:c.base,id:form?.id||p.chain[c.stage],stage,xp:c.xp,next:next?(stage===0?120:300):null,words:c.words.length,neededWords:next?(stage===0?20:40):null,type:form?.type||p.type,move:form?.move||p.move,level:1+Math.floor(c.xp/120)};
}
export function grantXp(state,player,session,task,assisted,random=Math.random){
 session.awarded??=[];const key=`${player}:${task.id}`;if(session.awarded.includes(key))return null;session.awarded.push(key);
 const p=state.players[player],c=companion(p),before=evolutionFor(p,c.id);c.xp+=assisted?1:2;
 if(!assisted&&!['coop','relay'].includes(session.scope)&&task.item&&!c.words.includes(task.item))c.words.push(task.item);
 if(before.next&&c.xp>=before.next&&c.words.length>=before.neededWords){if(c.base==='133')c.form=EEVEE_FORMS[Math.min(7,Math.max(0,Math.floor(random()*8)))].id;else c.stage++}
 p.xp[c.id]=c.xp;if(c.id==='133')p.eeveeEvolution=c.form;
 const after=evolutionFor(p,c.id);if(before.id!==after.id){p.evolved[after.id]=true;return {from:before.id,to:after.id}}return null;
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
   for(const w of words){const done=s=>progress(state,w,s,player??state.soloPlayer),seen=state.records.some(r=>r.item===w.id&&r.scope==='solo'&&r.type==='answer');
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
 if(scope==='solo'&&mode!=='mistakes')tasks.forEach(t=>t.owner=player??state.soloPlayer);
 return {player:player??state.soloPlayer,version:3,id:`${book}-${round}-${Date.now()}-${random()}`,book,round,mode,scope,tasks,index:0,current:null,scores:[0,0],contributions:[0,0],results:[],eggEnergy:0,awarded:[],evolutions:[],completed:false};
}
export function questionFor(data,word,stage,random=Math.random){
 const level=stage==='review'||stage==='listen'?3:Number(stage.replace('spell',''))||2;
 return {type:'input',listen:word.text,word:word.text,level,bank:letterBank(word.text,level,random),answer:word.text};
}
export function completeRound(state,session){if(session.completed)return;session.completed=true;if(session.results.filter(r=>r.correct).length>=3){state.badges[session.book]??=[];if(!state.badges[session.book].includes(session.id))state.badges[session.book].push(session.id)}}
