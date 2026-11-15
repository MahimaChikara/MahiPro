"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, ArrowUpRight, CalendarDays, Check, CheckCircle2,
  Circle, Clock3, Filter, LayoutDashboard, ListTodo, Plus, Search, Target,
  Trash2, X, Pencil, ChevronDown, Bell, Sparkles
} from "lucide-react";

type Status = "Not Started" | "In Progress" | "On Hold" | "Completed";
type Priority = "Low" | "Medium" | "High";
type Update = { id: string; date: string; note: string; progress: number };
type Task = {
  id: string; title: string; description: string; startDate: string; dueDate: string;
  priority: Priority; status: Status; progress: number; createdAt: string; updates: Update[];
};

const STORAGE_KEY = "daymark-tasks-v1";
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);
const seed: Task[] = [
  { id:"sample-1", title:"Prepare quarterly business review", description:"Consolidate delivery metrics, risks and key decisions for the leadership review.", startDate:today(), dueDate:addDays(4), priority:"High", status:"In Progress", progress:55, createdAt:new Date().toISOString(), updates:[{id:"u1",date:new Date().toISOString(),note:"Draft storyline and metrics are in progress.",progress:55}] },
  { id:"sample-2", title:"Complete project transition checklist", description:"Review ownership, documentation and readiness checkpoints.", startDate:today(), dueDate:addDays(8), priority:"Medium", status:"Not Started", progress:0, createdAt:new Date().toISOString(), updates:[] },
  { id:"sample-3", title:"Schedule stakeholder catch-ups", description:"Align with key stakeholders on priorities and open dependencies.", startDate:today(), dueDate:addDays(-2), priority:"Low", status:"On Hold", progress:25, createdAt:new Date().toISOString(), updates:[{id:"u2",date:new Date().toISOString(),note:"Initial stakeholder list created.",progress:25}] }
];
function addDays(n:number) { const d = new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function prettyDate(s:string) { if(!s) return "No date"; return new Date(s+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}); }
function isOverdue(t:Task) { return t.status !== "Completed" && !!t.dueDate && t.dueDate < today(); }
function isUpcoming(t:Task) { const diff = (new Date(t.dueDate+"T00:00:00").getTime()-new Date(today()+"T00:00:00").getTime())/86400000; return t.status !== "Completed" && diff >= 0 && diff <= 3; }

const statusStyle: Record<Status,string> = {
  "Not Started":"bg-slate-100 text-slate-600",
  "In Progress":"bg-indigo-50 text-indigo-700",
  "On Hold":"bg-amber-50 text-amber-700",
  "Completed":"bg-emerald-50 text-emerald-700"
};
const priorityStyle: Record<Priority,string> = {
  Low:"bg-slate-100 text-slate-600", Medium:"bg-blue-50 text-blue-700", High:"bg-rose-50 text-rose-700"
};

export default function Home() {
  const [tasks,setTasks] = useState<Task[]>([]);
  const [ready,setReady] = useState(false);
  const [query,setQuery] = useState("");
  const [filter,setFilter] = useState("All");
  const [sort,setSort] = useState("due");
  const [modal,setModal] = useState(false);
  const [editing,setEditing] = useState<Task|null>(null);
  const [active,setActive] = useState<Task|null>(null);
  const [form,setForm] = useState({title:"",description:"",startDate:today(),dueDate:addDays(7),priority:"Medium" as Priority,status:"Not Started" as Status,progress:0});
  const [updateNote,setUpdateNote] = useState("");
  const [toast,setToast] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setTasks(saved ? JSON.parse(saved) as Task[] : seed);
    } catch { setTasks(seed); }
    setReady(true);
  },[]);
  useEffect(() => { if(ready) localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks)); },[tasks,ready]);

  const stats = useMemo(() => ({
    total:tasks.length, completed:tasks.filter(t=>t.status==="Completed").length,
    inProgress:tasks.filter(t=>t.status==="In Progress").length,
    overdue:tasks.filter(isOverdue).length
  }),[tasks]);
  const visible = useMemo(() => {
    let list = tasks.filter(t => (filter==="All" || (filter==="Overdue" ? isOverdue(t) : t.status===filter)) &&
      (t.title.toLowerCase().includes(query.toLowerCase()) || t.description.toLowerCase().includes(query.toLowerCase())));
    list = [...list].sort((a,b)=> sort==="due" ? (a.dueDate||"9999").localeCompare(b.dueDate||"9999") : sort==="priority" ? ["High","Medium","Low"].indexOf(a.priority)-["High","Medium","Low"].indexOf(b.priority) : b.createdAt.localeCompare(a.createdAt));
    return list;
  },[tasks,filter,query,sort]);

  function openNew() {
    setEditing(null); setForm({title:"",description:"",startDate:today(),dueDate:addDays(7),priority:"Medium",status:"Not Started",progress:0}); setModal(true);
  }
  function openEdit(t:Task) {
    setEditing(t); setForm({title:t.title,description:t.description,startDate:t.startDate,dueDate:t.dueDate,priority:t.priority,status:t.status,progress:t.progress}); setModal(true);
  }
  function saveTask(e:React.FormEvent) {
    e.preventDefault();
    if(!form.title.trim()) return;
    if(form.dueDate && form.startDate && form.dueDate < form.startDate) { setToast("Due date must be on or after the start date."); return; }
    const status = form.progress===100 ? "Completed" : form.status==="Completed" ? "Completed" : form.status;
    if(editing) {
      setTasks(prev=>prev.map(t=>t.id===editing.id?{...t,...form,status,updates:t.updates}:t));
      setToast("Task updated.");
    } else {
      const task:Task={...form,status,id:uid(),createdAt:new Date().toISOString(),updates:[]};
      setTasks(prev=>[task,...prev]); setToast("Task added.");
    }
    setModal(false);
  }
  function removeTask(id:string) {
    if(!confirm("Delete this task? This cannot be undone.")) return;
    setTasks(prev=>prev.filter(t=>t.id!==id)); setActive(null); setToast("Task deleted.");
  }
  function addUpdate(t:Task) {
    if(!updateNote.trim()) return;
    const update:Update={id:uid(),date:new Date().toISOString(),note:updateNote.trim(),progress:t.progress};
    setTasks(prev=>prev.map(x=>x.id===t.id?{...x,updates:[update,...x.updates]}:x));
    setActive({...t,updates:[update,...t.updates]}); setUpdateNote(""); setToast("Progress update added.");
  }
  function quickProgress(t:Task,value:number) {
    const status:Status = value===100 ? "Completed" : value===0 ? "Not Started" : "In Progress";
    const update:Update={id:uid(),date:new Date().toISOString(),note:`Progress changed to ${value}%.`,progress:value};
    setTasks(prev=>prev.map(x=>x.id===t.id?{...x,progress:value,status,updates:[update,...x.updates]}:x));
    setActive({...t,progress:value,status,updates:[update,...t.updates]});
  }

  if(!ready) return <main className="shell"><div className="card p-8 text-sm text-slate-500">Loading your workspace…</div></main>;

  return (
    <main className="shell">
      <header className="topbar flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200"><Target size={23}/></div>
          <div><div className="text-xl font-extrabold tracking-tight">daymark<span className="text-indigo-600">.</span></div><div className="text-xs text-slate-500 mt-0.5">Your work, in focus.</div></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-2"><CalendarDays size={14}/>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</div>
          <button className="btn btn-primary" onClick={openNew}><Plus size={16}/> New task</button>
        </div>
      </header>

      <section className="mb-7">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div><p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600 mb-2">Overview</p><h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Good work starts with a clear plan.</h1><p className="text-sm text-slate-500 mt-2">A quick view of what needs your attention.</p></div>
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500"><Sparkles size={15} className="text-amber-500"/> Small steps add up.</div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat icon={<ListTodo size={18}/>} label="Total tasks" value={stats.total} tint="bg-indigo-50 text-indigo-600" detail="In your workspace"/>
          <Stat icon={<Activity size={18}/>} label="In progress" value={stats.inProgress} tint="bg-blue-50 text-blue-600" detail="Currently moving"/>
          <Stat icon={<CheckCircle2 size={18}/>} label="Completed" value={stats.completed} tint="bg-emerald-50 text-emerald-600" detail={stats.total?`${Math.round(stats.completed/stats.total*100)}% of all tasks`:"Nothing completed yet"}/>
          <Stat icon={<AlertCircle size={18}/>} label="Overdue" value={stats.overdue} tint="bg-rose-50 text-rose-600" detail="Needs your attention"/>
        </div>
      </section>

      {(stats.overdue>0 || tasks.some(isUpcoming)) && <section className="grid md:grid-cols-2 gap-3 mb-6">
        {stats.overdue>0 && <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 flex gap-3 items-start"><AlertCircle size={18} className="text-rose-600 mt-0.5"/><div><div className="text-sm font-bold text-rose-800">{stats.overdue} overdue {stats.overdue===1?"task":"tasks"}</div><div className="text-xs text-rose-700 mt-1">Review deadlines and update your plan.</div></div></div>}
        {tasks.some(isUpcoming) && <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 flex gap-3 items-start"><Bell size={18} className="text-amber-600 mt-0.5"/><div><div className="text-sm font-bold text-amber-800">Upcoming deadlines</div><div className="text-xs text-amber-700 mt-1">{tasks.filter(isUpcoming).length} task(s) are due within the next 3 days.</div></div></div>}
      </section>}

      <section className="card overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div><h2 className="font-extrabold text-lg">Your tasks</h2><p className="text-xs text-slate-500 mt-1">{visible.length} task{visible.length===1?"":"s"} shown</p></div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="field pl-9 sm:w-56" placeholder="Search tasks…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
              <div className="relative"><Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/><select className="field pl-9 sm:w-40" value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>Not Started</option><option>In Progress</option><option>On Hold</option><option>Completed</option><option>Overdue</option></select></div>
              <select className="field sm:w-36" value={sort} onChange={e=>setSort(e.target.value)}><option value="due">Sort: Due date</option><option value="priority">Sort: Priority</option><option value="newest">Sort: Newest</option></select>
            </div>
          </div>
          <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
            {["All","Not Started","In Progress","On Hold","Completed","Overdue"].map(s=><button key={s} onClick={()=>setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${filter===s?"bg-indigo-600 text-white":"bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{s}</button>)}
          </div>
        </div>
        {visible.length===0 ? <div className="py-16 text-center px-5"><div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3"><ListTodo size={22}/></div><div className="font-bold text-sm">No tasks found</div><p className="text-xs text-slate-500 mt-1">{tasks.length===0?"Create your first task to get started.":"Try changing your search or filter."}</p>{tasks.length===0&&<button onClick={openNew} className="btn btn-primary mt-4"><Plus size={15}/> Add your first task</button>}</div> :
          <div className="divide-y divide-slate-100">
            {visible.map(t=><article key={t.id} className="task-row p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <button className="font-bold text-sm text-left hover:text-indigo-700" onClick={()=>{setActive(t);setUpdateNote("");}}>{t.title}</button>
                  <span className={`pill ${statusStyle[t.status]}`}>{t.status}</span>
                  <span className={`pill ${priorityStyle[t.priority]}`}>{t.priority} priority</span>
                  {isOverdue(t)&&<span className="pill bg-rose-50 text-rose-700">Overdue</span>}
                  {isUpcoming(t)&&<span className="pill bg-amber-50 text-amber-700">Due soon</span>}
                </div>
                <p className="text-xs text-slate-500 truncate max-w-2xl">{t.description||"No description added."}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1"><CalendarDays size={12}/> Starts {prettyDate(t.startDate)}</span><span className="inline-flex items-center gap-1"><Clock3 size={12}/> Due {prettyDate(t.dueDate)}</span></div>
              </div>
              <div className="w-full lg:w-48">
                <div className="flex justify-between text-xs mb-2"><span className="font-semibold text-slate-600">Progress</span><span className="font-bold text-slate-800">{t.progress}%</span></div>
                <div className="progress-track"><div className="progress-fill" style={{width:`${t.progress}%`}}/></div>
              </div>
              <div className="flex items-center gap-2 lg:ml-2">
                <button className="btn btn-secondary !p-2" title="View updates" onClick={()=>{setActive(t);setUpdateNote("");}}><Activity size={15}/></button>
                <button className="btn btn-secondary !p-2" title="Edit task" onClick={()=>openEdit(t)}><Pencil size={15}/></button>
                <button className="btn btn-secondary !p-2 text-rose-600" title="Delete task" onClick={()=>removeTask(t.id)}><Trash2 size={15}/></button>
              </div>
            </article>)}
          </div>
        }
      </section>
      <footer className="text-center text-[11px] text-slate-400 mt-6">Daymark · Your tasks are saved in this browser on this device.</footer>

      {toast && <div className="fixed bottom-5 right-5 z-[70] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2" role="status"><Check size={15}/>{toast}<button onClick={()=>setToast("")} className="ml-2 text-slate-300"><X size={14}/></button></div>}

      {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false);}}><div className="modal">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100"><div><h3 className="font-extrabold text-lg">{editing?"Edit task":"Create a task"}</h3><p className="text-xs text-slate-500 mt-1">Add the details and set a realistic timeline.</p></div><button onClick={()=>setModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X size={18}/></button></div>
        <form onSubmit={saveTask} className="p-6 space-y-4">
          <div><label className="label">Task title *</label><input autoFocus required className="field" placeholder="e.g. Prepare project plan" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
          <div><label className="label">Description</label><textarea rows={3} className="field resize-none" placeholder="What needs to get done?" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
          <div className="grid sm:grid-cols-2 gap-4"><div><label className="label">Start date</label><input type="date" className="field" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></div><div><label className="label">Due date</label><input type="date" className="field" value={form.dueDate} min={form.startDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></div></div>
          <div className="grid sm:grid-cols-2 gap-4"><div><label className="label">Priority</label><select className="field" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value as Priority})}><option>Low</option><option>Medium</option><option>High</option></select></div><div><label className="label">Status</label><select className="field" value={form.status} onChange={e=>setForm({...form,status:e.target.value as Status})}><option>Not Started</option><option>In Progress</option><option>On Hold</option><option>Completed</option></select></div></div>
          <div><div className="flex justify-between mb-2"><label className="label !mb-0">Progress</label><span className="text-xs font-bold text-indigo-700">{form.progress}%</span></div><input type="range" min="0" max="100" step="5" className="w-full accent-indigo-600" value={form.progress} onChange={e=>setForm({...form,progress:Number(e.target.value)})}/><div className="flex justify-between text-[10px] text-slate-400"><span>Not started</span><span>Completed</span></div></div>
          <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn btn-secondary" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary" type="submit">{editing?"Save changes":"Create task"}</button></div>
        </form>
      </div></div>}

      {active && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setActive(null);}}><div className="modal">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100"><div className="min-w-0 pr-4"><div className="flex flex-wrap gap-2 mb-2"><span className={`pill ${statusStyle[active.status]}`}>{active.status}</span><span className={`pill ${priorityStyle[active.priority]}`}>{active.priority} priority</span></div><h3 className="font-extrabold text-lg break-words">{active.title}</h3><p className="text-xs text-slate-500 mt-1">{active.description||"No description added."}</p></div><button onClick={()=>setActive(null)} className="p-2 rounded-lg hover:bg-slate-100"><X size={18}/></button></div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3"><div className="bg-slate-50 rounded-xl p-3"><div className="text-[11px] text-slate-500">Start date</div><div className="text-sm font-bold mt-1">{prettyDate(active.startDate)}</div></div><div className="bg-slate-50 rounded-xl p-3"><div className="text-[11px] text-slate-500">Due date</div><div className={`text-sm font-bold mt-1 ${isOverdue(active)?"text-rose-600":""}`}>{prettyDate(active.dueDate)}</div></div></div>
          <div><div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-600">Current progress</span><span className="text-xs font-extrabold">{active.progress}%</span></div><div className="progress-track !h-2"><div className="progress-fill" style={{width:`${active.progress}%`}}/></div><div className="flex flex-wrap gap-2 mt-3">{[0,25,50,75,100].map(v=><button key={v} onClick={()=>quickProgress(active,v)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${active.progress===v?"bg-indigo-600 text-white border-indigo-600":"bg-white text-slate-600 border-slate-200"}`}>{v}%</button>)}</div></div>
          <div><h4 className="font-bold text-sm mb-3">Add a progress update</h4><textarea className="field resize-none" rows={2} placeholder="What changed? Add a note for your activity history…" value={updateNote} onChange={e=>setUpdateNote(e.target.value)}/><div className="flex justify-end mt-2"><button className="btn btn-primary" disabled={!updateNote.trim()} onClick={()=>addUpdate(active)}>Add update</button></div></div>
          <div><div className="flex items-center justify-between mb-3"><h4 className="font-bold text-sm">Activity history</h4><span className="text-[11px] text-slate-400">{active.updates.length} update(s)</span></div>{active.updates.length===0?<p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-4">No updates yet. Add a note when you make progress.</p>:<div className="space-y-3 max-h-48 overflow-y-auto">{active.updates.map(u=><div key={u.id} className="flex gap-3"><div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Activity size={13}/></div><div className="min-w-0"><p className="text-xs text-slate-700">{u.note}</p><p className="text-[10px] text-slate-400 mt-1">{new Date(u.date).toLocaleString("en-IN")} · {u.progress}% complete</p></div></div>)}</div>}</div>
          <div className="flex justify-between pt-2 border-t border-slate-100"><button className="btn btn-secondary text-rose-600" onClick={()=>removeTask(active.id)}><Trash2 size={14}/> Delete</button><button className="btn btn-secondary" onClick={()=>{setActive(null);openEdit(active);}}><Pencil size={14}/> Edit task</button></div>
        </div>
      </div></div>}
    </main>
  );
}

function Stat({icon,label,value,tint,detail}:{icon:React.ReactNode,label:string,value:number,tint:string,detail:string}) {
  return <div className="card stat-card"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{label}</span><span className={`stat-icon ${tint}`}>{icon}</span></div><div className="text-2xl font-extrabold mt-2">{value}</div><div className="text-[11px] text-slate-400 mt-1">{detail}</div></div>;
}
