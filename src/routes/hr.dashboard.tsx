import { createFileRoute,Link } from "@tanstack/react-router";
import { useEffect,useState } from "react";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users,CheckCircle2,AlertTriangle,ClipboardList,BookOpen,ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route=createFileRoute("/hr/dashboard")({head:()=>({meta:[{title:"Organization Dashboard — Learning Hub Connect"}]}),component:HRDashboardPage});
type Profile={id:string;full_name:string;role:string;department_id:string|null;departments:{name:string}|null};
type Enrollment={id:string;learner_id:string;progress_percent:number;due_at:string|null;assignment_id:string};
function HRDashboardPage(){
 const {user,ready,allowed}=useAuthGuard("hr");const {firstTime}=useAuth();
 const [profiles,setProfiles]=useState<Profile[]>([]);const [enrollments,setEnrollments]=useState<Enrollment[]>([]);const [loading,setLoading]=useState(true);
 useEffect(()=>{if(!allowed)return;let alive=true;const load=async()=>{
  const [p,e]=await Promise.all([
   getSupabase().from("profiles").select("id,full_name,role,department_id,departments(name)").eq("role","learner"),
   getSupabase().from("enrollments").select("id,learner_id,progress_percent,due_at,assignment_id")
  ]);
  if(p.error)toast.error(p.error.message);if(e.error)toast.error(e.error.message);
  if(alive){setProfiles((p.data??[]) as unknown as Profile[]);setEnrollments((e.data??[]) as Enrollment[]);setLoading(false);}
 };void load();return()=>{alive=false;};},[allowed]);
 if(!ready||!allowed||!user)return <div className="p-8"><div className="h-40 rounded-xl bg-muted animate-pulse"/></div>;
 const overdue=enrollments.filter(e=>e.progress_percent<100&&e.due_at&&new Date(e.due_at).getTime()<Date.now()).length;
 const completed=enrollments.filter(e=>e.progress_percent===100).length;
 const completion=enrollments.length?Math.round(completed/enrollments.length*100):0;
 const assignmentCount=new Set(enrollments.map(e=>e.assignment_id)).size;
 const departments=Array.from(new Set(profiles.map(p=>p.departments?.name??"Unassigned"))).map(name=>{const members=profiles.filter(p=>(p.departments?.name??"Unassigned")===name);const ids=new Set(members.map(p=>p.id));const rows=enrollments.filter(e=>ids.has(e.learner_id));return {name,learners:members.length,assignments:rows.length,completion:rows.length?Math.round(rows.filter(e=>e.progress_percent===100).length/rows.length*100):0,overdue:rows.filter(e=>e.progress_percent<100&&e.due_at&&new Date(e.due_at).getTime()<Date.now()).length};});
 const stats=[{label:"Active learners",value:profiles.length,icon:Users},{label:"Completion rate",value:completion+"%",icon:CheckCircle2},{label:"Overdue",value:overdue,icon:AlertTriangle},{label:"Active assignments",value:assignmentCount,icon:ClipboardList}];
 return <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
  <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight">Organization Dashboard</h1><p className="text-sm text-muted-foreground">Welcome {user.name.split(" ")[0]} · Live workforce learning overview.</p></div>{firstTime&&<Badge>First login</Badge>}</div>
  <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">{stats.map(s=><Card key={s.label}><CardContent className="p-4"><div className="flex justify-between text-sm text-muted-foreground">{s.label}<s.icon className="h-4 w-4"/></div><div className="text-3xl font-semibold mt-2">{loading?"—":s.value}</div></CardContent></Card>)}</div>
  <div className="flex flex-wrap gap-2"><Button asChild><Link to="/hr/assign"><ClipboardList className="h-4 w-4 mr-2"/>Assign training</Link></Button><Button asChild variant="outline"><Link to="/hr/courses"><BookOpen className="h-4 w-4 mr-2"/>Manage courses</Link></Button><Button asChild variant="outline"><Link to="/hr/people"><Users className="h-4 w-4 mr-2"/>Manage people</Link></Button></div>
  <Card><CardHeader><CardTitle className="text-base">Department performance</CardTitle></CardHeader><CardContent>{loading?<p className="text-sm text-muted-foreground">Loading analytics…</p>:departments.length===0?<p className="text-sm text-muted-foreground">No learner activity yet. Invite users and assign training to populate this view.</p>:<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="py-3 pr-3">Department</th><th className="py-3 pr-3 text-right">Learners</th><th className="py-3 pr-3 text-right">Assignments</th><th className="py-3 pr-3 text-right">Completion</th><th className="py-3 text-right">Overdue</th></tr></thead><tbody>{departments.map(d=><tr key={d.name} className="border-b last:border-0"><td className="py-3 pr-3 font-medium">{d.name}</td><td className="py-3 pr-3 text-right">{d.learners}</td><td className="py-3 pr-3 text-right">{d.assignments}</td><td className="py-3 pr-3 text-right">{d.completion}%</td><td className="py-3 text-right">{d.overdue? <Badge variant="outline" className="text-warning">{d.overdue}</Badge>:"—"}</td></tr>)}</tbody></table></div>}</CardContent></Card>
  <Card><CardContent className="p-5 flex items-center justify-between gap-3"><div><div className="font-medium">Detailed compliance report</div><p className="text-sm text-muted-foreground">Review overdue learners and export department results.</p></div><Button asChild variant="outline"><Link to="/hr/reports">Open reports<ArrowRight className="h-4 w-4 ml-1"/></Link></Button></CardContent></Card>
 </div>;
}
