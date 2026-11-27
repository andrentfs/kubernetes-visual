/* Kubernetes Visual — js/boot.js (ADR-003)
   Carrega só os textos do idioma em uso e, depois deles, a aplicação, nesta ordem.
   Scripts clássicos inseridos com async=false executam na ordem de inserção, também em file://.
   O outro idioma é baixado só quando o usuário troca (window.K8S_loadLang). */
(function(){
  var l;
  try{l=localStorage.getItem('k8s-lang')}catch(e){}
  if(l!=='pt'&&l!=='en')l=(navigator.language||'pt').toLowerCase().indexOf('pt')===0?'pt':'en';
  window.K8S_LANG=l;
  function add(src,cb){var s=document.createElement('script');s.src=src;s.async=false;if(cb){s.onload=cb;s.onerror=cb}document.head.appendChild(s)}
  ['i18n/'+l+'.js','js/content.js','js/renderer.js','js/ui.js'].forEach(function(src){add(src)});
  window.K8S_loadLang=function(lang,cb){
    if(window.TXT&&window.TXT[lang]&&window.TXT[lang].les){cb();return}
    add('i18n/'+lang+'.js',cb);
  };
})();
