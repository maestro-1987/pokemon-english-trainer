export const VERSION=1;
export const TASK_NAMES={listen:'听辨',meaning:'词义',spell1:'补字母',spell2:'排列字母',spell3:'独立拼词',comprehend:'信息理解',letter:'字母名称',case:'大小写配对',order:'故事顺序',review:'间隔复习'};
export function required(item){if(!item.available)return[];if(item.kind==='vocabulary')return ['listen','meaning','spell1','spell2','spell3','review'];if(item.kind==='letter')return ['letter','case','review'];if(item.kind==='order')return ['order','comprehend','review'];return ['listen','comprehend','review']}
export function taskId(item,stage){return `${item.id}:${stage}`}
export function defaultState(){return {version:VERSION,book:'upper',players:[{name:'小石头',partner:'025'},{name:'大训练家',partner:'133'}],settings:{difficulty:'auto',rate:.85,motion:false,seated:false},rounds:{upper:0,lower:0},records:[],paper:[],partners:{'025':1,'133':1},badges:{upper:[],lower:[]},sessions:{upper:null,lower:null}}}
export function statsFor(state,item,stage,scope='solo',player=0){const rows=state.records.filter(r=>r.item===item.id&&r.stage===stage&&r.scope===scope&&r.player===player);return {rows,seen:rows.some(r=>r.type==='heard'||r.type==='answer'),correct:rows.filter(r=>r.type==='answer'&&r.correct).length,independent:rows.filter(r=>r.type==='answer'&&r.correct&&!r.assisted).length,assisted:rows.filter(r=>r.type==='answer'&&r.correct&&r.assisted).length,errors:rows.filter(r=>r.type==='answer'&&!r.correct).length,last:rows.at(-1)}}
export function stageDone(state,item,stage){return statsFor(state,item,stage).independent>0}
export function itemStatus(state,item){const stages=required(item),attempts=state.records.filter(r=>r.item===item.id&&r.scope==='solo');const done=stages.filter(s=>stageDone(state,item,s));return {stages,done,seen:attempts.some(r=>r.type==='heard'||r.type==='answer'),assisted:attempts.some(r=>r.correct&&r.assisted),independent:attempts.some(r=>r.correct&&!r.assisted),review:stageDone(state,item,'review'),complete:stages.length>0&&done.length===stages.length}}
export function overview(data,state,book){const all=data.items.filter(i=>i.book===book),usable=all.filter(i=>i.available),statuses=usable.map(i=>itemStatus(state,i));return {total:all.length,usable:usable.length,unavailable:all.length-usable.length,core:all.filter(i=>i.kind==='vocabulary').length,passages:all.filter(i=>i.kind==='passage').length,other:all.filter(i=>!['vocabulary','passage'].includes(i.kind)).length,seen:statuses.filter(s=>s.seen).length,pending:statuses.filter(s=>!s.seen).length,complete:statuses.filter(s=>s.complete).length,review:statuses.filter(s=>s.seen&&!s.review).length,tasks:usable.reduce((n,i)=>n+required(i).length,0),done:usable.reduce((n,i)=>n+itemStatus(state,i).done.length,0),bookComplete:statuses.every(s=>s.complete)&&all.every(i=>i.available)&&data.books.find(b=>b.id===book)?.status==='complete'}}
export function shuffle(arr,random=Math.random){let a=[...arr];for(let i=a.length-1;i>0;i--){let j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function letterBank(word,level,random=Math.random){const letters=[...word.toLowerCase()].filter(c=>/[a-z]/.test(c));if(level===1){let index=Math.floor(random()*letters.length);let answer=letters[index],other='aeioubcdmnstr'.split('').find(c=>c!==answer);return {letters:shuffle([answer,other],random).map((value,id)=>({id,value})),missing:index}}return {letters:shuffle([...letters,...(level===3?'aeiostnrulbcdfghmpvykwxqjz'.split('').filter(c=>!letters.includes(c)).slice(0,2):[])],random).map((value,id)=>({id,value})),missing:null}}
export function nextRound(data,state,book,{mode='adventure',scope='solo',size=12,random=Math.random}={}){
 const round=(state.rounds[book]||0)+1;let pending=[];
 for(const item of data.items.filter(i=>i.book===book&&i.available)){
  const stages=required(item);
  for(let index=0;index<stages.length;index++){
   const stage=stages[index];if(scope==='solo'&&stageDone(state,item,stage))continue;
   const previous=stages.slice(0,index).filter(s=>s!=='review');
   const dependencies=mode==='energy'?previous.filter(s=>s.startsWith('spell')):previous;
   if(scope==='solo'&&dependencies.some(s=>statsFor(state,item,s).correct===0))continue;
   if(stage==='review'&&scope==='solo'){
    const rows=state.records.filter(r=>r.item===item.id&&r.scope==='solo'&&r.type==='answer'&&r.correct&&r.stage!=='review');
    if(!rows.length||rows.at(-1).round>=round)continue;
   }
   if(mode==='islands'&&!['listen','comprehend','letter','order','review'].includes(stage))continue;
   if(mode==='energy'&&!['spell1','spell2','spell3','meaning','case','order'].includes(stage))continue;
   const history=scope==='solo'?[]:state.records.filter(r=>r.item===item.id&&r.scope===scope);
   const first=scope==='solo'?!itemStatus(state,item).seen:!history.some(r=>r.type==='heard'||r.type==='answer');
   pending.push({id:taskId(item,stage),item:item.id,stage,kind:item.kind,unit:item.source.unit,rank:(first?0:stage==='review'?1:2),repetitions:history.filter(r=>r.type==='answer').length,difficulty:item.kind==='vocabulary'?item.text.length:item.kind==='letter'?3:15});
   if(scope!=='solo')break;
  }
 }
 // Deterministic unseen queue, rotated across source units. Every selected task is removed.
 pending.sort((a,b)=>a.rank-b.rank||a.repetitions-b.repetitions||a.difficulty-b.difficulty||a.id.localeCompare(b.id));
 const selected=[];const units=[1,2,3,4,5,6,'附录'];let lastUnit=null;
 const category=t=>t.kind==='vocabulary'?(t.stage.startsWith('spell')?'spell':t.stage==='meaning'?'meaning':'word'):t.kind==='letter'?'letter':'text';
 const cycle=['word','spell','text','spell','meaning','letter'];
 while(pending.length&&selected.length<size){
  const want=cycle[selected.length%cycle.length];let candidates=pending.filter(t=>category(t)===want);
  if(selected.length%6===5&&scope==='solo'){const reviews=pending.filter(t=>t.stage==='review');if(reviews.length)candidates=reviews;}
  if(selected.length%6===4&&scope==='solo'){const errors=pending.filter(t=>statsFor(state,data.items.find(i=>i.id===t.item),t.stage).errors>0);if(errors.length)candidates=errors;}
  if(!candidates.length)candidates=pending;
  let chosen=candidates.find(t=>t.unit!==lastUnit)||candidates[0];
  selected.push(chosen);lastUnit=chosen.unit;pending.splice(pending.indexOf(chosen),1);
 }
 // A round consists of current obligations. Dedicated egg mode adds current-round vocabulary review,
 // which is marked practice, never credited as the interval-review obligation.
 if(scope==='solo'&&['egg','adventure'].includes(mode)&&selected.length){
  const words=selected.filter(t=>t.kind==='vocabulary'&&t.stage==='listen').slice(0,mode==='egg'?2:2);
  for(const t of words){const item=data.items.find(i=>i.id===t.item);if(!stageDone(state,item,'spell1')&&!selected.some(x=>x.item===t.item&&x.stage==='spell1')){const index=selected.indexOf(t);selected.splice(index+1,0,{...t,id:taskId(item,'spell1'),stage:'spell1'});}}
  if(mode==='egg')for(const t of selected.filter(t=>t.kind==='vocabulary').slice(0,1)){selected.push({...t,id:t.id+':egg',stage:'eggReview',practice:true});}
  if(selected.length>size){const practice=selected.filter(t=>t.practice);const base=selected.filter(t=>!t.practice).slice(0,size-practice.length);selected.splice(0,selected.length,...base,...practice)}
 }
 if(scope==='solo'&&selected.length&&new Set(selected.map(t=>t.unit)).size===1){const old=data.items.find(i=>i.book===book&&i.available&&i.kind==='vocabulary'&&i.source.unit!==selected[0].unit&&stageDone(state,i,'listen'));if(old)selected.push({id:taskId(old,'mixedReview')+':'+round,item:old.id,stage:'mixedReview',kind:old.kind,unit:old.source.unit,practice:true})}
 return {book,mode,scope,round,id:`${book}-${round}-${Date.now()}`,tasks:selected,index:0,scores:[0,0],contributions:[0,0],mistakes:0,hints:0,results:[],completed:false,elapsed:0,eggEnergy:0,hatched:null};
}
export function appendRecord(state,session,item,stage,{correct=null,assisted=false,player=0,type='answer'}={}){
 const r={id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`,at:Date.now(),book:session.book,item:item.id,task:taskId(item,stage),stage,round:session.round,session:session.id,scope:session.scope,player,type,correct,assisted};state.records.push(r);return r
}
export function makeQuestion(data,item,stage,level=1,random=Math.random){
 const eggPractice=stage==='eggReview';if(eggPractice)stage='review';if(stage==='mixedReview')stage='listen';
 if(item.kind==='vocabulary'){
  if(stage.startsWith('spell')||(stage==='review')){let difficulty=stage==='review'?(eggPractice?level:3):Number(stage.slice(-1));const bank=letterBank(item.text,difficulty,random);const related=data.items.find(i=>i.book===item.book&&i.available&&i.kind==='passage'&&new RegExp('\\b'+item.text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(i.text));return {type:'spell',level:difficulty,bank,word:item.text,answer:item.text,listen:item.text,context:difficulty===1?related?.text:null,contextSource:related?.source}}
  const others=data.items.filter(i=>i.book===item.book&&i.kind==='vocabulary'&&i.id!==item.id&&i.source.unit===item.source.unit);
  const choices=shuffle([item,...shuffle(others,random).slice(0,2)],random);
  return {type:stage==='meaning'?'meaning':'island',listen:item.text,answer:item.id,choices:choices.map(i=>({id:i.id,image:i.image,text:stage==='meaning'?i.meaning:'',reveal:i.text}))}
 }
 if(item.kind==='letter'){
  let pool=shuffle(data.items.filter(i=>i.book===item.book&&i.kind==='letter'&&i.id!==item.id),random).slice(0,2);
  const choices=shuffle([item,...pool],random).map(i=>({id:i.id,text:stage==='case'?i.lowercase:i.text,reveal:i.text+i.lowercase}));
  return {type:'letter',listen:item.text,answer:item.id,choices,case:stage==='case'};
 }
 if(item.kind==='order'&&stage!=='comprehend')return {type:'order',listen:item.text,answer:item.events.map((_,i)=>String(i)),choices:shuffle(item.events.map((text,i)=>({id:String(i),text,reveal:text})),random)};
 const meaningMap={'奶奶':'grandma','爷爷':'grandpa','妈妈':'mum','爸爸':'dad','面条':'noodles','苹果':'apple','柠檬':'lemon','番茄':'tomato','胡萝卜':'carrot','西瓜':'watermelon','香蕉':'banana','梨':'pear','菠萝':'pineapple','铅笔盒':'pencil case','尺子':'ruler','橡皮':'eraser','牛奶':'milk','小鸟':'bird','鸟':'bird','鱼':'fish','大鱼':'fish','青蛙':'frog','金鱼':'goldfish','乌龟':'tortoise','仓鼠':'hamster','猫':'cat','狗':'dog','蝴蝶':'butterfly','冷':'cold','热':'hot','饿了':'hungry','冷了':'cold','口渴':'thirsty','春天':'spring','夏天':'summer','秋天':'autumn','冬天':'winter','绿色':'green','红色':'red','黄色':'yellow','蓝色':'blue','白色':'white','灰色':'grey','黑色':'black','两朵':'two','四朵':'four','三支':'three','四支':'four','两条':'two','四条':'four','唱歌':'sing','跳舞':'dance','骑自行车':'ride a bike','跑步':'run','踢足球':'play football','滑滑板':'skateboard'};
 const imageFor=text=>{const word=meaningMap[text];if(!word)return null;return data.items.find(i=>i.kind==='vocabulary'&&i.text===word)?.image||(['run','grey'].includes(word)?`assets/${word}.${word==='grey'?'svg':'jpg'}`:null)};
 const check=item.checks?.[stage],options=check?.options||item.options;
 const pictureChoices=options.every(text=>imageFor(text));
 return {type:'comprehension',listen:check?.listen||item.text,query:check?.query||item.query,answer:String(check?.target??item.target),choices:shuffle(options.map((text,i)=>({id:String(i),text:pictureChoices?'':text,image:pictureChoices?imageFor(text):null,reveal:text})),random)};
}
export function applyLetter(spelling,choice){const next=spelling.word.toLowerCase().replace(/[^a-z]/g,'')[spelling.typed.length];if(choice.value!==next)return {correct:false,next,typed:spelling.typed,used:spelling.used};return {correct:true,next,typed:spelling.typed+choice.value,used:[...spelling.used,choice.id]}}
export function reward(state,session,partners){if(session.hatched)return session.hatched;const learned=session.results.filter(r=>r.correct).length;if(learned<3||session.eggEnergy<3)return null;const ids=partners.map(p=>p.id),owned=ids.filter(id=>state.partners[id]);const next=ids.find(id=>!owned.includes(id))||ids[(state.rounds[session.book]-1)%ids.length];state.partners[next]=(state.partners[next]||0)+1;session.hatched=next;return next}

