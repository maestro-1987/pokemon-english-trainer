// Original locally synthesized scene melodies and effects. No downloaded songs.
export class GameSound{
 constructor(){this.music=true;this.effects=true;this.ducked=false;this.nodes=new Set()}
 unlock(){try{this.ctx??=new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state!=='running')this.ctx.resume().catch(()=>{});}catch{}}
 tone(note,time,duration=.25,type='sine',volume=.07){const c=this.ctx;if(!c||c.state!=='running')return;const osc=c.createOscillator(),gain=c.createGain();osc.type=type;osc.frequency.value=440*2**((note-69)/12);gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.025);gain.gain.exponentialRampToValueAtTime(.001,time+duration);osc.connect(gain);gain.connect(c.destination);osc.start(time);osc.stop(time+duration+.01);this.nodes.add(osc);osc.onended=()=>this.nodes.delete(osc)}
 scene(mode){this.stop();this.mode=mode;let beat=0;const tunes={islands:[72,76,79,76,74,77,81,77],energy:[60,67,72,67,62,69,74,69],egg:[72,79,76,81,79,76,74,72],gym:[60,64,67,72,67,64,62,67],coop:[72,76,79,84,79,76,74,79],relay:[67,72,76,79,76,72,69,74],mistakes:[72,74,76,79,76,74,72,67]};
 this.timer=setInterval(()=>{if(!this.music||this.ducked||!this.ctx)return;const note=(tunes[mode]||tunes.energy)[beat++%8];this.tone(note,this.ctx.currentTime,.4,'sine',.024)},mode==='energy'?420:650)}
 duck(value){this.ducked=value;if(value){for(const n of this.nodes)try{n.stop()}catch{}this.nodes.clear()}}
 effect(type='star'){if(!this.effects||!this.ctx)return;const patterns={wrong:[67,64,60],electric:[84,91,88,96],grass:[72,76,79,84],fire:[60,67,72,84],water:[79,76,72,84],music:[72,76,79,84],earth:[48,55,60,67],star:[79,84,88,91],evolve:[60,64,67,72,76,79,84,88],egg:[72,76,79,84,88]};(patterns[type]||patterns.star).forEach((n,i)=>this.tone(n,this.ctx.currentTime+i*.075,.18,type==='electric'?'triangle':'sine',type==='wrong'?.035:.07))}
 stop(){clearInterval(this.timer);for(const n of this.nodes)try{n.stop()}catch{}this.nodes.clear()}
}
