const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const official = 'https://mgit.ac.in/wp-content/uploads/';
const sourceFor = sem => official+(sem<=4?'2024/08/MR-22-I-IV-SEM-SCHEME-SYLLABUS-IT.pdf':'2024/11/12-IT-528.pdf');
const branchNames = {IT:'Information Technology',Civil:'Civil Engineering',EEE:'Electrical and Electronics Engineering',Mechanical:'Mechanical Engineering',ECE:'Electronics and Communication Engineering',CSE:'Computer Science and Engineering',MCT:'Mechatronics',MME:'Metallurgical and Materials Engineering',CSBS:'Computer Science and Business Systems','CSE (DS)':'CSE (Data Science)','CSE (AI & ML)':'CSE (AI & ML)'};
const catalog = {IT:syllabus,...branches};
function stored(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
function persist(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
const remembered = stored('mgit-desk-branch');
let branch = Object.hasOwn(catalog,remembered) ? remembered : 'IT';
const progress = stored('mgit-revision-progress') || {};
progress.IT ??= stored('mgit-desk-v1')?.done || {};
let sem=1, course=null, selected=0, mode='Sheet';
const modes=['Sheet','Formulas','Diagrams','Abbreviations','MCQs','Fill in the blanks'];
const main=$('main');
function btn(label,action,val='',attr=''){
  return '<button type="button" data-action="'+action+'" data-value="'+esc(val)+'" '+attr+'>'+esc(label)+'</button>';
}
function checkId(c,key){return c.id+'/'+key;}
function done(c,key){return !!progress[branch]?.[checkId(c,key)];}
function itItems(c){
  return c.units.flatMap(([unit,rows],u)=>rows.flatMap(([title,children],t)=>[
    {key:u+'/'+t,title,unit,depth:0},
    ...children.map((child,j)=>({key:u+'/'+t+'/'+j,title:child,unit,depth:1}))
  ]));
}
const aliases={CS502PC:'IT502PC',CS601PC:'CM502PC',CS501PC:'IT602PC',CM501PC:'IT602PC',CD501PC:'CS523PE',CS303PC:'IT501PC',CS405PC:'IT501PC',CS306PC:'CS402PC',CS302PC:'IT401PC',CS407PC:'IT401PC',CS304PC:'CS401PC',MS501HS:'MS401HS',EC431PC:'EC331ES',CH201BS:'CH101BS',PH101BS:'PH201BS'};
const itById = new Map(syllabus.map(c=>[c.id,c]));
function cards(c) {
  const reference=itById.get(c.id)||itById.get(aliases[c.id]);
  const available=reference?itItems(reference).flatMap(x=>{
    const id=reference.id+'/'+x.key;
    return starter[id]?[{...x,unit:branch==='IT'?x.unit:'Revision topic',note:starter[id],diagram:diagrams[id]}]:[];
  }):[];
  if(available.length)return available;
  return branchNotes.filter(([pattern])=>pattern.test(c.title)).map(([,title,summary,formula,abbr,mcq,options,correct],i)=>({
    key:'card/'+i,title,unit:'Revision topic',note:{summary,formula,abbr,mcq,options:options.join('\n'),correct:String(correct)}
  }));
}
function visibleCourses(){
  const query=$('search').value.trim().toLowerCase();
  return catalog[branch].filter(c=>c.sem===sem&&(!query||(c.title+' '+c.id).toLowerCase().includes(query)));
}
function sidebar(){
  $('branch').value=branch;
  $('semesters').innerHTML=Array.from({length:8},(_,i)=>btn(String(i+1),'semester',i+1,'aria-label="Semester '+(i+1)+'" aria-current="'+(sem===i+1)+'"')).join('');
  $('subjects').innerHTML=visibleCourses().map(c=>btn(c.title,'subject',c.id,'class="subject" aria-current="'+(course?.id===c.id)+'"')).join('')||'<p class="muted">No matching subjects.</p>';
}
function route(){
  try {
    const [b,s,id]=decodeURIComponent(location.hash.slice(1)).split('/');
    if(Object.hasOwn(catalog,b)&&/^[1-8]$/.test(s)){
      branch=b;sem=+s;course=catalog[branch].find(c=>c.sem===sem&&c.id===id)||null;
    }else {
      course=itById.get(b)||null;
      if(course){branch='IT';sem=course.sem;}
    }
  } catch {course=null;}
  persist('mgit-desk-branch',branch);
  selected=0;mode='Sheet';draw();
}
function open(b,s,id=''){
  const hash=encodeURI(b+'/'+s+(id?'/'+id:''));
  if(location.hash==='#'+hash)route();else location.hash=hash;
}
function overview(){
  main.innerHTML='<div class="hero"><div class="eyebrow">'+esc(branchNames[branch])+'</div><h1>Semester '+sem+'</h1><p>Choose a subject to revise.</p></div><div class="grid">'+visibleCourses().map(c=>{
    const count=cards(c).length;
    return '<article class="card"><small>'+esc(c.id.startsWith('ELECTIVE-')?'Elective slot':c.id)+(c.slot?' · '+esc(c.slot):'')+'</small><h2>'+esc(c.title)+'</h2><p class="muted">'+(count?count+' revision '+(count===1?'topic':'topics'):'Syllabus checklist')+'</p>'+btn(count?'Revise subject':'View syllabus','subject',c.id)+'</article>';
  }).join('')+'</div>';
}
function syllabusLink(c){
  return '<a href="'+esc((c.source||sourceFor(c.sem))+'#page='+(c.page||1))+'" target="_blank" rel="noopener noreferrer">Official syllabus</a>';
}
function checklist(c){
  const topics=branch==='IT'?itItems(c):[];
  const units=topics.length?[...new Set(topics.map(x=>x.unit))]:['Course checklist'];
  return '<section id="checklist" class="checklist"><div class="row"><h2>Syllabus checklist</h2>'+btn('Print checklist','print')+'</div>'+units.map((u,i)=>{
    const entries=topics.length?topics.filter(x=>x.unit===u):[{key:'course',title:c.title,depth:0}];
    return '<details '+(i===0?'open':'')+'><summary>'+esc(u)+'</summary>'+entries.map(x=>
      '<label class="check depth'+x.depth+'"><input type="checkbox" data-check="'+esc(x.key)+'" '+(done(c,x.key)?'checked':'')+'><span>'+esc(x.title)+'</span></label>').join('')+'</details>';
  }).join('')+'</section>';
}
function readable(value){return '<div class="studyText">'+esc(value)+'</div>';}
function availableModes(c){
  const a=c.note;
  return modes.filter(m=>({Sheet:a.summary,Formulas:a.formula,Diagrams:c.diagram,Abbreviations:a.abbr,MCQs:a.mcq&&a.options,'Fill in the blanks':a.fill})[m]);
}
function panel(c,topics){
  if(!topics.length)return '<section class="study"><h2>Revision sheet</h2><p class="muted">A revision sheet for this subject is still pending. Use the syllabus link and checklist to review the course.</p></section>';
  const x=topics[selected]||topics[0], a=x.note, tabs=availableModes(x);
  if(!tabs.includes(mode))mode=tabs[0];
  let content='';
  if(mode==='Sheet')content=readable(a.summary)+(a.review?'<h3>Recall in 5 minutes</h3>'+readable(a.review):'');
  if(mode==='Formulas')content=readable(a.formula);
  if(mode==='Abbreviations')content=readable(a.abbr);
  if(mode==='Diagrams')content='<figure>'+x.diagram+'<figcaption>'+esc(a.caption||x.title)+'</figcaption></figure>';
  if(mode==='MCQs') content='<fieldset><legend>'+esc(a.mcq)+'</legend>'+a.options.split('\n').map((option,i)=>'<label class="answerOption"><input type="radio" name="mcq" value="'+(i+1)+'"> '+String.fromCharCode(65+i)+'. '+esc(option)+'</label>').join('')+'</fieldset>'+btn('Check answer','mcq')+'<p id="feedback" aria-live="polite"></p>';
  if(mode==='Fill in the blanks')content='<p>'+esc(a.fill)+'</p><label for="fill">Your answer</label><input id="fill" type="text">'+btn('Check answer','fill')+' '+btn('Reveal answer','reveal')+'<p id="feedback" aria-live="polite"></p>';
  return '<section class="study"><div class="row"><h2>Revision panel</h2><span class="muted">'+(selected+1)+' of '+topics.length+'</span></div>'+
    '<label for="topic">Topic</label><select id="topic">'+topics.map((v,i)=>'<option value="'+i+'" '+(i===selected?'selected':'')+'>'+esc(v.title)+'</option>').join('')+'</select>'+
    '<div class="topicTitle"><small>'+esc(x.unit)+'</small><h3>'+esc(x.title)+'</h3></div><div class="tabs" aria-label="Revision material">'+tabs.map(m=>btn(m,'mode',m,'aria-pressed="'+(mode===m)+'"')).join('')+'</div><div class="material">'+content+'</div>'+
    '<div class="row controls">'+btn('Previous topic','previous','',''+(selected===0?'disabled':''))+btn('Next topic','next','',selected===topics.length-1?'disabled':'')+'</div></section>';
}
function draw(){
  sidebar();
  if(!course){overview();return;}
  main.innerHTML='<div class="hero"><div class="eyebrow">'+esc(branchNames[branch])+' · Semester '+sem+'</div><h1>'+esc(course.title)+'</h1><div class="row courseLinks">'+btn('All subjects','overview')+syllabusLink(course)+'</div></div>'+
    panel(course,cards(course))+checklist(course);
}
function updatePanel(){
  const old=main.querySelector('.study');
  if(old)old.outerHTML=panel(course,cards(course));
}
$('branch').innerHTML=Object.entries(branchNames).map(([b,label])=>'<option value="'+esc(b)+'">'+esc(label)+'</option>').join('');
$('branch').onchange=e=>{$('search').value='';open(e.target.value,sem);};
$('search').oninput=()=>{sidebar();if(!course)overview();};
document.addEventListener('change',e=>{
  if(e.target.id==='topic'){selected=+e.target.value;mode='Sheet';updatePanel();$('topic').focus();}
  if(course&&e.target.dataset.check){progress[branch]??={};progress[branch][checkId(course,e.target.dataset.check)]=e.target.checked;persist('mgit-revision-progress',progress);}
});
document.addEventListener('click',e=>{
  const button=e.target.closest('button[data-action]');
  if(!button)return;
  const {action,value}=button.dataset;
  if(action==='semester'){ $('search').value='';open(branch,+value);return; }
  if(action==='overview'){open(branch,sem);return;}
  if(action==='subject'){open(branch,sem,value);return;}
  if(!course)return;
  if(action==='print'){
    const sections=[...document.querySelectorAll('#checklist details')];
    const states=sections.map(el=>el.open);
    sections.forEach(el=>el.open=true);window.print();sections.forEach((el,i)=>el.open=states[i]);return;
  }
  const topics=cards(course), a=topics[selected]?.note;
  if(action==='mode'){mode=value;updatePanel();main.querySelector('[aria-pressed="true"]')?.focus();return;}
  if(action==='previous'||action==='next'){
    selected=Math.max(0,Math.min(topics.length-1,selected+(action==='next'?1:-1)));
    mode='Sheet';updatePanel();$('topic').focus();return;
  }
  const feedback=$('feedback');
  if(!feedback||!a)return;
  if(action==='mcq'){
    const chosen=document.querySelector('input[name=mcq]:checked');
    const answer=+a.correct;
    feedback.textContent=!chosen?'Choose an answer.':+chosen.value===answer?'Correct.':'Correct answer: '+a.options.split('\n')[answer-1];
  }
  if(action==='reveal'||action==='fill'){
    const expected=a.fillAnswer||'';
    feedback.textContent=action==='fill'&&$('fill').value.trim().toLowerCase()===expected.toLowerCase()?'Correct.':'Answer: '+expected;
  }
});
window.addEventListener('hashchange',()=>{route(); window.scrollTo(0,0);});
route();
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
