const SCREENS = ['welcome','resources','learning-path','dashboard'];

function showScreen(screen){
  if(!requireAuthFor(screen)) return;
  SCREENS.forEach(s=>{
    const el = document.getElementById(s+'-screen');
    if(el) el.style.display = (s===screen)?'block':'none';
  });
  if(screen==='dashboard') renderDashboard();
}

/* Modal helpers */
function openModal(id){
  const m=document.getElementById(id); if(!m) return; m.setAttribute('aria-hidden','false');
}
function closeModal(id){
  const m=document.getElementById(id); if(!m) return; m.setAttribute('aria-hidden','true');
}

/* Simple auth stubs (local only) */
function login(){
  const email=document.getElementById('login-email').value;
  closeModal('login-modal');
  if(email) alert('Logged in as '+email+' (demo)');
}
function signup(){
  const name=document.getElementById('signup-name').value;
  closeModal('signup-modal');
  if(name) alert('Account created for '+name+' (demo)');
}

/* Demo authentication (localStorage) */
const USER_KEY = 'evolveu:users';
const CURR_KEY = 'evolveu:current';

function readUsers(){try{return JSON.parse(localStorage.getItem(USER_KEY)||'{}')}catch(e){return{}}}
function writeUsers(u){localStorage.setItem(USER_KEY,JSON.stringify(u))}

function setCurrentUser(email){localStorage.setItem(CURR_KEY, email||''); renderUserArea();}
function getCurrentUser(){return localStorage.getItem(CURR_KEY)||''}

function doSignup(){
  const name=document.getElementById('signup-name').value.trim();
  const email=document.getElementById('signup-email').value.trim().toLowerCase();
  const pass=document.getElementById('signup-password').value;
  if(!email||!pass||!name) return alert('Fill all fields');
  const users=readUsers(); if(users[email]) return alert('Account already exists');
  users[email]={name,email,password:pass,created:Date.now()}; writeUsers(users); setCurrentUser(email);
  // redirect to home
  location.href='index.html';
}

function doLogin(){
  const email=document.getElementById('login-email').value.trim().toLowerCase();
  const pass=document.getElementById('login-password').value;
  const users=readUsers(); if(!users[email]||users[email].password!==pass) return alert('Invalid credentials');
  setCurrentUser(email); location.href='index.html';
}

function logout(){ setCurrentUser(''); location.href='login.html'; }

function renderUserArea(){
  const area=document.getElementById('user-area'); if(!area) return;
  const email=getCurrentUser(); area.innerHTML='';
  if(email){
    const users=readUsers(); const u=users[email]||{name:email};
    const span=document.createElement('span'); span.className='user-name'; span.textContent=u.name||email;
    const avatar=document.createElement('span'); avatar.className='avatar'; avatar.textContent = (u.name||email).charAt(0).toUpperCase();
    const out=document.createElement('button'); out.className='ghost'; out.textContent='Logout'; out.onclick=logout;
    area.appendChild(avatar); area.appendChild(span); area.appendChild(out);
  } else {
    const a1=document.createElement('a'); a1.href='login.html'; a1.textContent='Log in'; a1.className='ghost';
    const a2=document.createElement('a'); a2.href='signup.html'; a2.textContent='Sign up'; a2.className='outline';
    area.appendChild(a1); area.appendChild(a2);
  }
}

/* Protect screens: if no user, redirect to login when accessing certain screens */
function requireAuthFor(screen){
  const protectedScreens=['resources','learning-path','dashboard'];
  if(protectedScreens.includes(screen) && !getCurrentUser()){
    location.href='login.html';
    return false;
  }
  return true;
}

/* Resources: drag & drop + upload + links persisted in localStorage */
const RES_KEY = 'evolveu:resources';
function readResources(){
  try{return JSON.parse(localStorage.getItem(RES_KEY)||'[]')}catch(e){return[]}
}
function writeResources(list){ localStorage.setItem(RES_KEY,JSON.stringify(list)) }

function renderResources(){
  const ul=document.getElementById('resources-list'); if(!ul) return;
  ul.innerHTML='';
  const list = readResources();
  list.forEach((r,i)=>{
    const li=document.createElement('li');
  const thumb = r.preview? `<img src="${r.preview}" class="thumb" alt="${escapeHtml(r.name)}" onerror="this.onerror=null;this.src='${fallback}';"/>` : '';
    const label = r.url? `<a href="${escapeHtml(r.url)}" target="_blank">${escapeHtml(r.url)}</a>` : escapeHtml(r.name||'file');
    li.innerHTML = `${thumb}<div class="name">${label}</div><div class="meta">${r.type||''}</div><button class="outline" onclick="removeResource(${i})">Remove</button>`;
    ul.appendChild(li);
  });
  // also update dashboard resources
  const dr=document.getElementById('dashboard-resources'); if(dr){dr.innerHTML=''; list.forEach(r=>{const li=document.createElement('li'); li.innerHTML = r.preview? `<img src="${r.preview}" class="thumb small-thumb" alt="${escapeHtml(r.name)}" onerror="this.onerror=null;this.src='${fallback}';"/> ${escapeHtml(r.name||r.url)}` : escapeHtml(r.name||r.url); dr.appendChild(li)})}
}

function removeResource(index){
  const list=readResources(); list.splice(index,1); writeResources(list); renderResources();
}

function handleFiles(files){
  const list = readResources();
  const fileArr = Array.from(files);
  const promises = fileArr.map(f => new Promise(resolve => {
    if(f.type && f.type.startsWith('image/')){
      // compress image using canvas to limit size
      const reader = new FileReader();
      reader.onload = e => {
        compressImage(e.target.result, 800, 0.75).then(preview => resolve({name:f.name,type:f.type,size:f.size,created:Date.now(),preview}));
      };
      reader.readAsDataURL(f);
    } else {
      resolve({name:f.name,type:f.type||'file',size:f.size||0,created:Date.now()});
    }
  }));
  Promise.all(promises).then(results=>{
    results.forEach(r=>list.push(r));
    writeResources(list);
    renderResources();
  });
}

// image compression helper: input dataURL, output compressed dataURL
function compressImage(dataUrl, maxWidth=800, quality=0.8){
  return new Promise(resolve=>{
    const img=new Image(); img.onload = ()=>{
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0,w,h);
      const out = canvas.toDataURL('image/jpeg', quality);
      resolve(out);
    };
    img.src = dataUrl;
  });
}

// file input
const fileInput=document.getElementById('file-input');
if(fileInput){fileInput.addEventListener('change',e=>{handleFiles(e.target.files)})}

// drop area
const drop=document.getElementById('drop-area');
if(drop){
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('drag')});
  drop.addEventListener('dragleave',e=>{drop.classList.remove('drag')});
  drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('drag'); handleFiles(e.dataTransfer.files) });
}

function addLink(){
  const v=document.getElementById('link-input').value.trim(); if(!v) return alert('Enter a link');
  const list=readResources(); list.push({name:v,url:v,type:'link',created:Date.now()}); writeResources(list); document.getElementById('link-input').value=''; renderResources();
}

/* Tasks (learning path) persisted */
const TASK_KEY = 'evolveu:tasks';
function readTasks(){try{return JSON.parse(localStorage.getItem(TASK_KEY)||'[]')}catch(e){return[]}}
function writeTasks(t){localStorage.setItem(TASK_KEY,JSON.stringify(t))}

function renderTasks(){
  const ul=document.getElementById('tasks'); if(!ul) return; ul.innerHTML='';
  const tasks=readTasks();
  tasks.forEach((t,i)=>{
    const li=document.createElement('li');
    li.innerHTML = `<input type="checkbox" ${t.done?'checked':''} onchange="toggleTask(${i})"> <div class="task-title">${escapeHtml(t.title)}</div> <span>${t.date||''}</span> <button class="outline" onclick="deleteTask(${i})">Delete</button>`;
    ul.appendChild(li);
  });
  updateProgress();
}

function addTask(){
  const title=document.getElementById('new-task-input').value.trim();
  const date=document.getElementById('new-task-date').value||'';
  if(!title) return alert('Enter task title');
  const tasks=readTasks(); tasks.push({title,date,done:false}); writeTasks(tasks); document.getElementById('new-task-input').value=''; document.getElementById('new-task-date').value=''; renderTasks();
}

function toggleTask(i){const tasks=readTasks(); tasks[i].done=!tasks[i].done; writeTasks(tasks); renderTasks();}
function deleteTask(i){const tasks=readTasks(); tasks.splice(i,1); writeTasks(tasks); renderTasks();}

function updateProgress(){
  const tasks=readTasks(); if(!tasks.length){document.getElementById('dashboard-fill').style.width='0%'; document.getElementById('progress-percent').textContent='0%'; return}
  const done = tasks.filter(t=>t.done).length; const pct = Math.round((done/tasks.length)*100);
  document.getElementById('dashboard-fill').style.width = pct+'%'; document.getElementById('progress-percent').textContent = pct+'%';
  // next milestone = first undone task
  const next = tasks.find(t=>!t.done);
  document.getElementById('next-milestone').textContent = next? (next.title + (next.date? (' — '+next.date):'')) : 'All done 🎉';
}

function renderDashboard(){ renderResources(); renderTasks(); updateProgress(); }

/* small helpers */
function escapeHtml(s){ return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// initialize with some defaults if empty
(function init(){
  if(!localStorage.getItem(TASK_KEY)){
    writeTasks([
      {title:'Learn the basics',date:'2025-05-01',done:true},
      {title:'Construct your first project',date:'2025-05-03',done:false},
      {title:'Enhance your skills',date:'2025-05-06',done:false}
    ]);
  }
  if(!localStorage.getItem(RES_KEY)){
    writeResources([{name:'Introductory talk',type:'video'},{name:'Understanding the basics',type:'doc'}]);
  }
  renderResources(); renderTasks();
  renderUserArea();
  // render featured courses if the container exists on this page
  if(document.getElementById('courses-list')) renderCoursesList();
  // If user not logged in, redirect to login when trying to view protected screens; default to welcome
  if(!getCurrentUser()){
    showScreen('welcome');
  } else {
    showScreen('dashboard');
  }
})();

/* ===== Courses & profile ===== */
const COURSES_KEY = 'evolveu:courses';

function seedCourses(force=false){
  const existing = localStorage.getItem(COURSES_KEY);
  if(!force && existing){
    try{ const parsed = JSON.parse(existing); if(Array.isArray(parsed) && parsed.length>0) return parsed; }catch(e){}
  }
  const courses=[
    {id:'c1',title:'Intro to Web Development',desc:'HTML, CSS and basic JavaScript',imageBase:'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61',lessons:[{id:'l1',title:'HTML basics',content:'Learn about tags, structure and semantics.'},{id:'l2',title:'CSS basics',content:'Styling with CSS, box model and layouts.'}],quiz:{q:'What does HTML stand for?',options:['Hyper Text Markup Language','Home Tool Markup Language','Hyperlinks and Text Markup Language'],answer:0}},
    {id:'c2',title:'JavaScript Essentials',desc:'Variables, functions, and the DOM',imageBase:'https://images.unsplash.com/photo-1518770660439-4636190af475',lessons:[{id:'l1',title:'Variables & Types',content:'Numbers, strings, objects.'},{id:'l2',title:'DOM manipulation',content:'Selecting and changing DOM elements.'}],quiz:{q:'Which method selects an element by id?',options:['getElementByClass','getElementById','querySelectorAll'],answer:1}},
    {id:'c3',title:'Python for Data',desc:'Intro to Python and data handling',imageBase:'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2',lessons:[{id:'l1',title:'Python syntax',content:'Variables, control flow, and functions.'},{id:'l2',title:'Pandas basics',content:'Working with tabular data.'}],quiz:{q:'Which library is commonly used for dataframes in Python?',options:['numpy','pandas','matplotlib'],answer:1}},
    {id:'c4',title:'UI/UX Foundations',desc:'Design systems, prototyping and research',imageBase:'https://images.unsplash.com/photo-1498050108023-c5249f4df085',lessons:[{id:'l1',title:'Design principles',content:'Alignment, contrast, hierarchy.'},{id:'l2',title:'Prototyping',content:'From wireframes to interactive prototypes.'}],quiz:{q:'What is a low-fidelity prototype?',options:['High pixel-perfect mock','Quick sketch/wireframe','Final design system'],answer:1}},
    {id:'c5',title:'Machine Learning Basics',desc:'Supervised learning and model evaluation',imageBase:'https://images.unsplash.com/photo-1508385082359-fc3b8d4f43e4',lessons:[{id:'l1',title:'Supervised vs unsupervised',content:'Key differences and examples.'},{id:'l2',title:'Evaluation metrics',content:'Accuracy, precision, recall.'}],quiz:{q:'Which metric is sensitive to class imbalance?',options:['Accuracy','Precision','Recall'],answer:0}},
    {id:'c6',title:'Product Management 101',desc:'Roadmaps, prioritization and stakeholder work',imageBase:'https://images.unsplash.com/photo-1557800636-894a64c1696f',lessons:[{id:'l1',title:'Roadmapping',content:'Building outcomes-focused roadmaps.'},{id:'l2',title:'Prioritization',content:'RICE, MoSCoW and other frameworks.'}],quiz:{q:'What does RICE stand for?',options:['Reach, Impact, Confidence, Effort','Revenue, Impact, Cost, Effort','Reach, Influence, Confidence, Ease'],answer:0}},
    // Additional demo courses
    {id:'c7',title:'Accessibility Essentials',desc:'Making web content accessible to everyone',imageBase:'https://images.unsplash.com/photo-1498050108023-c5249f4df085',lessons:[{id:'l1',title:'WCAG overview',content:'Principles of accessible design.'},{id:'l2',title:'Keyboard navigation',content:'Ensuring content is usable without a mouse.'}],quiz:{q:'What does WCAG stand for?',options:['Web Content Accessibility Guidelines','Website Compliance and Accessibility Guide','Web Controls and Accessibility Guide'],answer:0}},
    {id:'c8',title:'DevOps Basics',desc:'CI/CD, containerization and deployment',imageBase:'https://images.unsplash.com/photo-1518773553398-650c184e0bb3',lessons:[{id:'l1',title:'Containers & Docker',content:'Introduction to containers.'},{id:'l2',title:'CI/CD pipelines',content:'Automating builds and deployments.'}],quiz:{q:'What is the purpose of CI?',options:['Continuous Integration','Continuous Improvement','Container Integration'],answer:0}},
    {id:'c9',title:'Data Visualization',desc:'Charts, dashboards and storytelling with data',imageBase:'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7',lessons:[{id:'l1',title:'Chart types',content:'Choosing the right chart for data.'},{id:'l2',title:'Design for clarity',content:'Color, labeling and interaction.'}],quiz:{q:'Which library is popular for interactive JS charts?',options:['D3.js','NumPy','Scikit-learn'],answer:0}}
  ];
  localStorage.setItem(COURSES_KEY,JSON.stringify(courses));
  return courses;
}

// reset demo data (useful during development)
function resetDemoData(){
  seedCourses(true);
  // if we're on courses page, re-render
  const page = (location.pathname||'').split('/').pop() || '';
  if(page.includes('courses.html')) renderCoursesList();
  if(page.includes('profile.html')) renderProfile();
  if(page.includes('course.html')) {
    // if a course query param exists, refresh the detail
    renderCourseDetail();
  }
  toast('Demo data reset');
}

function readCourses(){ try{return JSON.parse(localStorage.getItem(COURSES_KEY)||'[]')}catch(e){return[]}}

function renderCoursesList(){
  seedCourses(); const list = readCourses();
  const target=document.getElementById('courses-list'); if(!target) return;
  // If the page already contains hardcoded cards, don't remove them. Only append dynamic cards when they don't exist.
  const hasHardcoded = target.children.length > 0;
  if(!hasHardcoded) target.innerHTML='';
  const query = (document.getElementById('course-search')?.value||'').toLowerCase();
  list.forEach(c=>{
    if(query && !(c.title.toLowerCase().includes(query) || c.desc.toLowerCase().includes(query))) return;
    // avoid duplicating a hardcoded card with the same title
    if(hasHardcoded){
      const exists = Array.from(target.children).some(ch => {
        const h = ch.querySelector && ch.querySelector('h4');
        return h && h.textContent === c.title;
      });
      if(exists) return;
    }
    const card=document.createElement('div'); card.className='course-card';
    let img = '';
    // ensure there's always an image (fallback to a subtle placeholder image)
  // lightweight SVG data URI as a fallback thumbnail (prevents 404s when remote images fail)
  const fallback = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 150"><rect width="100%" height="100%" rx="10" fill="#eaf1ff"/><rect x="24" y="28" width="140" height="94" rx="8" fill="#fff" opacity="0.6"/><rect x="180" y="34" width="360" height="18" rx="6" fill="#dbeeff"/><rect x="180" y="62" width="300" height="12" rx="6" fill="#eaf4ff"/><rect x="180" y="86" width="220" height="12" rx="6" fill="#eaf4ff"/></svg>');
    // use fallback immediately and preload remote image to avoid 404 logs
    const imgId = 'course-img-' + c.id;
    if(c.imageBase){
      const s1 = `${c.imageBase}?w=600&q=70&auto=format&fit=crop`;
      const s2 = `${c.imageBase}?w=1200&q=85&auto=format&fit=crop`;
      img = `<img id="${imgId}" src="${fallback}" class="thumb" loading="lazy" alt="${escapeHtml(c.title)}"/>`;
      // after appending card we'll attempt to preload and swap in the nicer image
    } else {
      img = `<img src="${fallback}" class="thumb" loading="lazy" alt="${escapeHtml(c.title)}"/>`;
    }
    card.innerHTML = `${img}<h4>${escapeHtml(c.title)}</h4><p class="small">${escapeHtml(c.desc)}</p><div class="row"><button onclick="openCourse('${c.id}')">Open</button><button class="outline" onclick="enrollCourse('${c.id}')">Enroll</button></div>`;
    target.appendChild(card);
    // if we have a remote image, preload it and assign on success (prevents 404 network errors)
    if(c.imageBase){
      (function(id, base){
        const s1 = base + '?w=600&q=70&auto=format&fit=crop';
        const s2 = base + '?w=1200&q=85&auto=format&fit=crop';
        const pre = new Image();
        pre.onload = function(){
          const el = document.getElementById(id); if(!el) return;
          el.src = s1; el.setAttribute('srcset', s1 + ' 1x, ' + s2 + ' 2x');
        };
        pre.onerror = function(){ /* keep fallback */ };
        pre.src = s1;
      })(imgId, c.imageBase);
    }
  });
}

function openCourse(id){ location.href = 'course.html?courseId='+encodeURIComponent(id); }

function enrollCourse(id){
  const email=getCurrentUser(); if(!email) return location.href='login.html';
  const key = `evolveu:enroll:${email}`;
  const enrolled=JSON.parse(localStorage.getItem(key)||'[]'); if(!enrolled.includes(id)) enrolled.push(id); localStorage.setItem(key,JSON.stringify(enrolled)); alert('Enrolled');
}

function getEnrolledCourses(email){ const key=`evolveu:enroll:${email}`; return JSON.parse(localStorage.getItem(key)||'[]') }

function renderCourseDetail(){
  const params = new URLSearchParams(location.search); const id = params.get('courseId');
  const all = readCourses(); const course = all.find(c=>c.id===id); const target=document.getElementById('course-content'); if(!target) return;
  if(!course){ target.innerHTML='<p>Course not found</p>'; return }
  let html = `<h2>${escapeHtml(course.title)}</h2><p class="small">${escapeHtml(course.desc)}</p>`;
    if(course.imageBase){
      const imgId = 'course-hero-img';
      // insert fallback first
      html = `<img id="${imgId}" src="${fallback}" class="course-hero" loading="lazy" alt="${escapeHtml(course.title)}"/>` + html;
      // preload and swap in nicer images to avoid 404 logs
      (function(id, base){
        const s1 = base + '?w=900&q=70&auto=format&fit=crop';
        const s2 = base + '?w=1800&q=85&auto=format&fit=crop';
        const pre = new Image();
        pre.onload = function(){ const el = document.getElementById(id); if(!el) return; el.src = s1; el.setAttribute('srcset', s1 + ' 1x, ' + s2 + ' 2x'); };
        pre.onerror = function(){};
        pre.src = s1;
      })(imgId, course.imageBase);
    }
  html += '<h3>Lessons</h3>';
  course.lessons.forEach(l=>{ html += `<div class="lesson"><strong>${escapeHtml(l.title)}</strong><p>${escapeHtml(l.content)}</p></div>`});
  html += '<div class="quiz"><h3>Quiz</h3><p>'+escapeHtml(course.quiz.q)+'</p>';
  course.quiz.options.forEach((op,i)=>{ html+=`<div class="option" onclick="submitQuiz('${id}',${i})">${escapeHtml(op)}</div>`});
  html += '</div>';
  html += `<div class="row"><button onclick="enrollCourse('${id}')">Enroll</button><a class="ghost" href="courses.html">Back</a></div>`;
  target.innerHTML = html;
}

function submitQuiz(courseId,choice){
  const courses=readCourses(); const c=courses.find(x=>x.id===courseId); if(!c) return;
  const correct = (choice===c.quiz.answer);
  const email=getCurrentUser(); if(!email) return location.href='login.html';
  // record progress
  const key = `evolveu:progress:${email}`; const prog = JSON.parse(localStorage.getItem(key)||'{}');
  prog[courseId] = {quizPassed: correct, lastAttempt: Date.now()}; localStorage.setItem(key,JSON.stringify(prog));
  alert(correct? 'Correct!':'Not quite.');
  // update profile and possibly dashboard
}

function renderProfile(){
  const area=document.getElementById('profile-area'); if(!area) return; const email=getCurrentUser(); if(!email) {area.innerHTML='<p>Please <a href="login.html">log in</a>.</p>'; return}
  const users=readUsers(); const u=users[email]||{};
  const enrolled = getEnrolledCourses(email);
  const progress = JSON.parse(localStorage.getItem(`evolveu:progress:${email}`)||'{}');
  let html = `<p><strong>${escapeHtml(u.name||email)}</strong><br class="small">${escapeHtml(email)}</p>`;
  html += '<h3>Enrolled Courses</h3>';
  if(!enrolled.length) html += '<p class="small">You have not enrolled in any courses yet.</p>';
  enrolled.forEach(id=>{ const c = readCourses().find(x=>x.id===id); const p = progress[id]||{}; html += `<div class="course-card"><h4>${escapeHtml(c.title)}</h4><p class="small">Quiz passed: ${p.quizPassed? 'Yes':'No'}</p><div class="row"><a class="ghost" href="course.html?courseId=${encodeURIComponent(id)}">Resume</a><button class="outline" onclick="unenrollCourse('${id}')">Unenroll</button></div></div>` });
  area.innerHTML = html;
}

function unenrollCourse(id){ const email=getCurrentUser(); if(!email) return location.href='login.html'; const key=`evolveu:enroll:${email}`; const arr=JSON.parse(localStorage.getItem(key)||'[]'); const idx=arr.indexOf(id); if(idx>=0) arr.splice(idx,1); localStorage.setItem(key,JSON.stringify(arr)); renderProfile(); }

// hook pages
document.addEventListener('DOMContentLoaded', ()=>{
  // robust page detection (works with file:// paths) and ensure courses are seeded
  const page = (location.pathname||'').split('/').pop() || '';
  seedCourses();
  if(page.includes('courses.html')) renderCoursesList();
  if(page.includes('course.html')) renderCourseDetail();
  if(page.includes('profile.html')) renderProfile();
});

/* ===== Utilities: toasts, dark mode, export/import, analytics ===== */
function toast(msg,timeout=3000){
  const container = document.getElementById('toasts'); if(!container) return alert(msg);
  const t = document.createElement('div'); t.className='toast'; t.textContent = msg; container.appendChild(t);
  setTimeout(()=>{ t.style.opacity=0; t.remove(); }, timeout);
}

// dark mode toggle
function toggleDark(){
}
// apply theme on load
  const root = document.documentElement; const cur = root.getAttribute('data-theme'); if(cur==='dark'){ root.removeAttribute('data-theme'); localStorage.removeItem('evolveu:theme'); toast('Light mode'); } else { root.setAttribute('data-theme','dark'); localStorage.setItem('evolveu:theme','dark'); toast('Dark mode'); }

  (function applyTheme(){ if(localStorage.getItem('evolveu:theme')==='dark') document.documentElement.setAttribute('data-theme','dark'); })();

// export/import localStorage (all keys for this app)
function exportData(){
  const data = {};
  for(const k in localStorage){ if(k.startsWith('evolveu:')) data[k]=localStorage.getItem(k); }
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='evolveu-export.json'; a.click(); URL.revokeObjectURL(url); toast('Exported data');
}

function importData(){
  const f = document.getElementById('import-file'); if(!f) return; f.onchange = e => {
    const file = e.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = ev => {
      try{ const obj = JSON.parse(ev.target.result); for(const k in obj){ localStorage.setItem(k,obj[k]); } toast('Imported data'); location.reload(); } catch(err){ toast('Invalid file'); }
    }; reader.readAsText(file);
  }; f.click();
}

// simple analytics: track page views per page in localStorage
function trackPageView(){ const key='evolveu:analytics'; const obj = JSON.parse(localStorage.getItem(key)||'{}'); const p = location.pathname; obj[p] = (obj[p]||0)+1; localStorage.setItem(key,JSON.stringify(obj)); }
trackPageView();
