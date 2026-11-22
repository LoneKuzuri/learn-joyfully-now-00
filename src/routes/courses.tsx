import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/courses")({
  head: () => ({ meta: [{ title: "My Courses — Learning Hub Connect" }] }),
  component: CoursesPage,
});
type Enrollment = { id:string; course_id:string; status:string; progress_percent:number; due_at:string|null; courses:{id:string;title:string;category:string;description:string;estimated_minutes:number;status:string}|null };
const statuses=["All","Not started","In progress","Completed"] as const;

function CoursesPage() {
  const { allowed } = useAuthGuard("learner");
  const [rows,setRows]=useState<Enrollment[]>([]);
  const [q,setQ]=useState("");
  const [status,setStatus]=useState<(typeof statuses)[number]>("All");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    if(!allowed)return;
    let alive=true;
    const load=async()=>{
      setLoading(true);
      const {data,error}=await getSupabase().from("enrollments").select("id,course_id,status,progress_percent,due_at,courses(id,title,category,description,estimated_minutes,status)").order("due_at",{ascending:true});
      if(error){toast.error(error.message);}else if(alive)setRows((data??[]) as unknown as Enrollment[]);
      if(alive)setLoading(false);
    };
    void load();return()=>{alive=false;};
  },[allowed]);
  if(!allowed)return null;
  const filtered=rows.filter((row)=>{
    const course=row.courses;if(!course)return false;
    if(q&&!course.title.toLowerCase().includes(q.toLowerCase()))return false;
    if(status==="Not started"&&row.progress_percent!==0)return false;
    if(status==="In progress"&&(row.progress_percent===0||row.progress_percent===100))return false;
    if(status==="Completed"&&row.progress_percent!==100)return false;
    return true;
  });
  return <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
    <div><h1 className="text-2xl font-semibold tracking-tight">My Courses</h1><p className="text-sm text-muted-foreground">{filtered.length} assigned courses</p></div>
    <Card><CardContent className="p-4 flex flex-wrap items-center gap-3"><div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder="Search assigned courses…" value={q} onChange={(e)=>setQ(e.target.value)} className="pl-9"/></div><div className="flex items-center gap-2 text-sm text-muted-foreground"><Filter className="h-4 w-4"/>Status:</div><div className="flex flex-wrap gap-1.5">{statuses.map((item)=><Button key={item} size="sm" variant={status===item?"default":"outline"} onClick={()=>setStatus(item)}>{item}</Button>)}</div></CardContent></Card>
    {loading?<div className="py-12 text-center text-sm text-muted-foreground">Loading your courses…</div>:filtered.length===0?<Card><CardContent className="py-14 text-center"><BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-3"/><div className="font-medium">No assigned courses found</div><p className="text-sm text-muted-foreground mt-1">Your organization will publish assigned learning here.</p></CardContent></Card>:
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((row)=>{const course=row.courses!;return <Card key={row.id} className="overflow-hidden flex flex-col"><div className="h-2 bg-primary/10"><div className="h-full bg-primary" style={{width:row.progress_percent+"%"}}/></div><CardContent className="p-4 flex flex-col flex-1"><div className="flex items-center justify-between gap-2"><Badge variant="secondary">{course.category}</Badge><Badge variant={row.status==="completed"?"default":"outline"}>{row.status.replace("_"," ")}</Badge></div><div className="font-semibold leading-snug mt-3">{course.title}</div><p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p><div className="mt-3 text-xs text-muted-foreground">{course.estimated_minutes} minutes {row.due_at?"· Due "+new Date(row.due_at).toLocaleDateString():""}</div><div className="mt-3 space-y-1"><div className="flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{row.progress_percent}%</span></div><Progress value={row.progress_percent} className="h-1.5"/></div><Button asChild className="mt-4 w-full"><Link to="/courses/$courseId" params={{courseId:course.id}}>{row.progress_percent===100?"Review course":row.progress_percent===0?"Start learning":"Continue learning"}</Link></Button></CardContent></Card>})}</div>}
  </div>;
}
