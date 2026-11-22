import { createFileRoute } from "@tanstack/react-router";
import { useEffect,useState } from "react";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell,CheckCircle2,Check } from "lucide-react";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getSupabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route=createFileRoute("/notifications")({head:()=>({meta:[{title:"Notifications — Learning Hub Connect"}]}),component:NotificationsPage});
type Notification={id:string;title:string;body:string;action_url:string|null;read_at:string|null;created_at:string};
function NotificationsPage(){
 const {allowed}=useAuthGuard("learner");const [items,setItems]=useState<Notification[]>([]);const [loading,setLoading]=useState(true);
 const load=async()=>{const {data,error}=await getSupabase().from("notifications").select("id,title,body,action_url,read_at,created_at").order("created_at",{ascending:false});if(error)toast.error(error.message);else setItems((data??[]) as Notification[]);setLoading(false);};
 useEffect(()=>{if(allowed)void load();},[allowed]);
 const markRead=async(id:string)=>{const {error}=await getSupabase().from("notifications").update({read_at:new Date().toISOString()}).eq("id",id);if(error)toast.error(error.message);else setItems(current=>current.map(n=>n.id===id?{...n,read_at:new Date().toISOString()}:n));};
 const markAll=async()=>{const {error}=await getSupabase().from("notifications").update({read_at:new Date().toISOString()}).is("read_at",null);if(error)toast.error(error.message);else setItems(current=>current.map(n=>({...n,read_at:n.read_at??new Date().toISOString()})));};
 if(!allowed)return null;const unread=items.filter(n=>!n.read_at).length;
 return <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6"><div className="flex items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight">Notifications</h1><p className="text-sm text-muted-foreground">{unread} unread updates</p></div><Button size="sm" variant="outline" disabled={!unread} onClick={()=>void markAll()}><Check className="h-4 w-4 mr-1"/>Mark all read</Button></div>
 <Card><CardHeader><CardTitle className="text-base">Inbox</CardTitle></CardHeader><CardContent className="divide-y">{loading?<p className="py-6 text-sm text-muted-foreground">Loading notifications…</p>:items.length===0?<p className="py-8 text-center text-sm text-muted-foreground">You have no notifications yet.</p>:items.map(n=><div key={n.id} className="flex gap-3 py-4"><div className={"mt-1 p-2 rounded-md "+(!n.read_at?"bg-primary/10":"bg-muted")}>{!n.read_at?<Bell className="h-4 w-4 text-primary"/>:<CheckCircle2 className="h-4 w-4 text-muted-foreground"/>}</div><div className="flex-1 min-w-0"><div className="flex justify-between gap-3"><div className="font-medium text-sm">{n.title}</div><div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(n.created_at).toLocaleString()}</div></div><p className="text-sm text-muted-foreground mt-1">{n.body}</p>{!n.read_at&&<Button variant="ghost" size="sm" className="mt-2 -ml-2" onClick={()=>void markRead(n.id)}>Mark as read</Button>}</div></div>)}</CardContent></Card></div>;
}
