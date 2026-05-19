
(function(){
  const toggle=document.querySelector('[data-menu-toggle]');
  const nav=document.querySelector('[data-primary-nav]');
  if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));});}
  document.querySelectorAll('[data-form]').forEach(form=>{
    form.addEventListener('submit',e=>{e.preventDefault();
      const hp=form.querySelector('.honeypot'); if(hp&&hp.value) return;
      console.info('Form event placeholder',{type:form.dataset.form, time:new Date().toISOString()});
      form.insertAdjacentHTML('beforeend','<p class="form-note" role="status">Prototype submission captured. Connect secure backend before production.</p>');
      form.querySelector('button[type="submit"]').disabled=true;
    });
  });
  const docList=document.querySelector('[data-document-list]');
  if(docList){
    const search=document.querySelector('[data-search="documents"]');
    const auth=document.querySelector('[data-filter="doc-authority"]');
    const year=document.querySelector('[data-filter="doc-year"]');
    const type=document.querySelector('[data-filter="doc-type"]');
    const cards=[...docList.querySelectorAll('.doc-card')];
    function filterDocs(){const q=(search?.value||'').toLowerCase();const a=auth?.value||'all';const y=year?.value||'all';const t=(type?.value||'').toLowerCase();cards.forEach(c=>{const text=c.innerText.toLowerCase();const okQ=!q||text.includes(q);const okA=a==='all'||c.dataset.authority===a;const okY=y==='all'||c.dataset.year===y;const okT=!t||c.dataset.type.toLowerCase().includes(t);c.style.display=okQ&&okA&&okY&&okT?'flex':'none';});}
    [search,auth,year,type].forEach(el=>el&&el.addEventListener('input',filterDocs));filterDocs();
  }
  const facultyList=document.querySelector('[data-faculty-list]');
  if(facultyList){
    const search=document.querySelector('[data-search="faculty"]');const dept=document.querySelector('[data-filter="faculty-department"]');const cards=[...facultyList.querySelectorAll('.faculty-card')];
    function filterFaculty(){const q=(search?.value||'').toLowerCase();const d=dept?.value||'all';cards.forEach(c=>{const okQ=!q||c.innerText.toLowerCase().includes(q);const okD=d==='all'||c.dataset.department===d;c.style.display=okQ&&okD?'block':'none';});}
    [search,dept].forEach(el=>el&&el.addEventListener('input',filterFaculty));filterFaculty();
  }
  document.querySelectorAll('a[href^="tel:"],a[href*="wa.me"],a[href$=".pdf"]').forEach(a=>a.addEventListener('click',()=>console.info('analytics placeholder',{event:'cta_click',label:a.textContent.trim(),href:a.href})));
})();
