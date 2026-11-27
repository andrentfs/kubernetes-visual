/* Kubernetes Visual — js/content.js
   Idioma ativo e montagem do conteúdo (lições = ordem + textos + cenas).
   Script clássico (não módulo): as declarações de topo são compartilhadas entre os arquivos js/*.js,
   que precisam ser carregados nesta ordem: geometry → content → renderer → ui. */
/* ---------- language + content ---------- */
let LANG=(()=>{try{const v=localStorage.getItem('k8s-lang');if(v==='pt'||v==='en')return v}catch(e){}return (navigator.language||'pt').toLowerCase().startsWith('pt')?'pt':'en'})();
const TX=()=>window.TXT[LANG],tl=k=>(TX().lbl[k]??k),U_=k=>TX().ui[k];
const S=window.buildScenes({node,nodes,pod,blk,cp,users,kub,SV,ING,at,tl});
let L=[];
function buildL(){L=window.LESSON_ORDER.filter(id=>TX().les[id]&&S[id]).map(id=>{const sc=S[id],tx=TX().les[id];return{id,mod:sc.mod,min:sc.min,lvl:TX().lv[sc.lvl],exam:tx.exam,examD:tx.examD,title:tx.t,lede:tx.lede,ml:tx.ml,goals:tx.goals,steps:sc.steps.map((st,i)=>({...tx.steps[i],c:(TX().cap||{})[id]?.[i],k:st.k,cmd:st.cmd,s:st.s}))}})}
buildL();
const MODC=['#cfe1f6','#d1e9c2','#fcd4ad','#f1c3bd','#e2d6f4'];
