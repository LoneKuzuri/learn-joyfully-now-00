import { createFileRoute } from "@tanstack/react-router";
import { useEffect,useState } from "react";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getSupabase } from "@/lib/supabase";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download,Users,AlertTriangle,CheckCircle2,ClipboardList } from "lucide-react";
import { toast } from "sonner";

export const Route=createFileRoute("/hr/reports")({head:()=>({meta:[{title:"Reports — Learning Hub Connect"}]}),component:ReportsPage});
type Department={id:string;name:string};
type Profile={id:string;full_name:string;email:string;department_id:string|null;departments:{name:string}|null};
type Enrollment={id:string;learner_id:string;course_id:string;status:string;progress_percent:number;due_at:string|null;courses:{title:string}|null};
function ReportsPage(){
 const {allowed}=useAuthGuard("hr");const [departments,setDepartments]=useState<Department[]>([]);const [profiles,setProfiles]=useState<Profile[]>([]);const [enrollments,setEnrollments]=useState<Enrollment[]>([]);const [loading,setLoading]=useState(true);
 useEffect(()=>{if(!allowed)return;let alive=true;const load=async()=>{
  const supabase=getSupabase();const [d,p,e]=await Promise.all([
   supabase.from("departments").select("id,name").order("name"),
   supabase.from("profiles").select("id,full_name,email,department_id,departments(name)").eq("role","learner"),
   supabase.from("enrollments").select("id,learner_id,course_id,status,progress_percent,due_at,courses(title)")
  ]);
  for(const result of [d,p,e])if(result.error)toast.error(result.error.message);
  if(alive){setDepartments(d.data??[]);setProfiles((p.data??[]) as unknown as Profile[]);setEnrollments((e.data??[]) as unknown as Enrollment[]);setLoading(false);}
 };void load();return()=>{alive=false;};},[allowed]);
 if(!allowed)return null;
 const now=Date.now();const overdue=enrollments.filter(e=>e.progress_percent<100&&e.due_at&&new Date(e.due_at).getTime()<now);
 const complete=enrollments.filter(e=>e.progress_percent===100).length;const rate=enrollments.length?Math.round(complete/enrollments.length*100):0;
 const rows=departments.map(d=>{const members=profiles.filter(p=>p.department_id===d.id);const ids=new Set(members.map(p=>p.id));const records=enrollments.filter(e=>ids.has(e.learner_id));return {department:d.name,learners:members.length,assignments:records.length,completion:records.length?Math.round(records.filter(e=>e.progress_percent===100).length/records.length*100):0,overdue:records.filter(e=>e.progress_percent<100&&e.due_at&&new Date(e.due_at).getTime()<now).length};});
 const exportCsv=()=>{const lines=[["Department","Learners","Assignments","Completion %","Overdue"],...rows.map(r=>[r.department,r.learners,r.assignments,r.completion,r.overdue])];const csv=lines.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="learning-hub-department-report.csv";a.click();URL.revokeObjectURL(url);};
 return <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
  <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight">Learning Reports</h1><p className="text-sm text-muted-foreground">Live completion and compliance data from your organization.</p></div><Button variant="outline" onClick={exportCsv} disabled={loading}><Download className="h-4 w-4 mr-2"/>Export CSV</Button></div>
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{label:"Active learners",value:profiles.length,icon:Users},{label:"Assignments",value:enrollments.length,icon:ClipboardList},{label:"Completion rate",value:rate+"%",icon:CheckCircle2},{label:"Overdue",value:overdue.length,icon:AlertTriangle}].map(k=><Card key={k.label}><CardContent className="p-4"><div className="flex justify-between text-sm text-muted-foreground">{k.label}<k.icon className="h-4 w-4"/></div><div className="text-3xl font-semibold mt-2">{loading?"—":k.value}</div></CardContent></Card>)}</div>
  <Card><CardHeader><CardTitle className="text-base">Department completion</CardTitle></CardHeader><CardContent>{loading?<p className="text-sm text-muted-foreground">Loading report…</p>:<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="py-3 pr-3">Department</th><th className="py-3 pr-3 text-right">Learners</th><th className="py-3 pr-3 text-right">Assignments</th><th className="py-3 pr-3 text-right">Completion</th><th className="py-3 text-right">Overdue</th></tr></thead><tbody>{rows.map(r=><tr key={r.department} className="border-b last:border-0"><td className="py-3 pr-3 font-medium">{r.department}</td><td className="py-3 pr-3 text-right">{r.learners}</td><td className="py-3 pr-3 text-right">{r.assignments}</td><td className="py-3 pr-3 text-right">{r.completion}%</td><td className="py-3 text-right">{r.overdue?<Badge variant="outline" className="text-warning">{r.overdue}</Badge>:"—"}</td></tr>)}</tbody></table></div>}</CardContent></Card>
  <Card><CardHeader><CardTitle className="text-base">Overdue learners</CardTitle></CardHeader><CardContent>{overdue.length===0?<p className="text-sm text-muted-foreground">No overdue assignments.</p>:<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="py-3 pr-3">Learner</th><th className="py-3 pr-3">Department</th><th className="py-3 pr-3">Course</th><th className="py-3 text-right">Due date</th></tr></thead><tbody>{overdue.map(e=>{const p=profiles.find(x=>x.id===e.learner_id);return <tr key={e.id} className="border-b last:border-0"><td className="py-3 pr-3 font-medium">{p?.full_name||p?.email||"Learner"}</td><td className="py-3 pr-3">{p?.departments?.name||"—"}</td><td className="py-3 pr-3">{e.courses?.title||"Course"}</td><td className="py-3 text-right"><Badge variant="outline" className="text-warning">{new Date(e.due_at!).toLocaleDateString()}</Badge></td></tr>})}</tbody></table></div>}</CardContent></Card>
 </div>;
}
