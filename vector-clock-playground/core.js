'use strict';
function compare(a,b){let less=false,greater=false;for(let i=0;i<a.length;i++){less ||= a[i]<b[i];greater ||= a[i]>b[i];}return less&&greater?'concurrent':less?'before':greater?'after':'same';}
function tick(clock,replica){const next=clock.slice();next[replica]++;return next;}
function merge(local,remote,replica){const next=local.map((v,i)=>Math.max(v,remote[i]||0));next[replica]++;return next;}
function format(clock){return '<'+clock.join(',')+'>';}
function makeEvent(replica,clock,label,type){return{id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),replica,clock:clock.slice(),label,type:type||'local'};}
if(typeof module!=='undefined')module.exports={compare,tick,merge,format,makeEvent};
if(typeof window!=='undefined')window.VectorClockCore={compare,tick,merge,format,makeEvent};