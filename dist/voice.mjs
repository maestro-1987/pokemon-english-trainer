import {AUDIO_FILES} from './audio-map.mjs';
export class AudioQueue{
 constructor(onStatus,{createAudio=url=>new Audio(url)}={}){this.onStatus=onStatus;this.createAudio=createAudio;this.token=0;this.canHear=false}
 play(text,{onHeard=()=>{}}={}){
 this.stop();const token=this.token;this.canHear=false;const url=AUDIO_FILES[text.trim().toLowerCase()];
 if(!url){this.onStatus('这条读音暂缺，请检查音频文件',true);return false}
 const a=this.createAudio(url);this.active=a;a.preload='auto';a.playbackRate=1;this.onStatus('听一听…');
 const fail=()=>{if(token!==this.token)return;this.stop();this.onStatus('读音未播放，请点重听',true)};
 this.timeout=setTimeout(fail,10000);
 a.onplaying=()=>{if(token===this.token){clearTimeout(this.timeout);this.timeout=setTimeout(fail,20000)}};
 a.onended=()=>{if(token!==this.token)return;clearTimeout(this.timeout);this.active=null;this.canHear=true;this.onStatus('可以作答啦');onHeard()};a.onerror=fail;
 try{Promise.resolve(a.play()).catch(fail);return true}catch{fail();return false}
 }
 stop(){this.token++;clearTimeout(this.timeout);this.canHear=false;if(this.active){this.active.onended=null;this.active.onerror=null;this.active.onplaying=null;this.active.pause();this.active.removeAttribute?.('src');this.active.load?.();this.active=null}}
}
