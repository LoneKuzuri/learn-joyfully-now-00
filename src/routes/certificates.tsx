import { createFileRoute } from "@tanstack/react-router";
import { useEffect,useState } from "react";
import { Card,CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award,Printer,ExternalLink,CheckCircle2 } from "lucide-react";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getSupabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route=createFileRoute("/certificates")({head:()=>({meta:[{title:"Certificates — Learning Hub Connect"}]}),component:CertificatesPage});
type Certificate={id:string;verification_code:string;issued_at:string;expires_at:string|null;revoked_at:string|null;courses:{title:string}|null};
function CertificatesPage(){
 const {allowed}=useAuthGuard("learner");const [items,setItems]=useState<Certificate[]>([]);const [loading,setLoading]=useState(true);
 useEffect(()=>{if(!allowed)return;let alive=true;const load=async()=>{const {data,error}=await getSupabase().from("certificates").select("id,verification_code,issued_at,expires_at,revoked_at,courses(title)").order("issued_at",{ascending:false});if(error)toast.error(error.message);else if(alive)setItems((data??[]) as unknown as Certificate[]);if(alive)setLoading(false);};void load();return()=>{alive=false;};},[allowed]);
 if(!allowed)return null;
 return <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto"><div><h1 className="text-2xl font-semibold tracking-tight">My Certificates</h1><p className="text-sm text-muted-foreground">{items.length} issued credentials</p></div>
 {loading?<p className="py-10 text-sm text-muted-foreground">Loading certificates…</p>:items.length===0?<Card><CardContent className="py-14 text-center"><Award className="h-9 w-9 mx-auto text-muted-foreground mb-3"/><div className="font-medium">No certificates yet</div><p className="text-sm text-muted-foreground mt-1">Complete a course and pass its assessment to earn a credential.</p></CardContent></Card>:
 <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map((cert)=><Card key={cert.id} className="overflow-hidden"><div className="bg-gradient-to-br from-primary via-info to-primary p-5 text-primary-foreground"><div className="flex items-center justify-between"><Badge className="bg-white/15 text-primary-foreground border-0"><CheckCircle2 className="h-3 w-3 mr-1"/>Issued</Badge><Award className="h-10 w-10"/></div><div className="mt-8 text-[11px] uppercase tracking-wider opacity-80">Certificate of Completion</div><div className="font-semibold text-lg leading-tight mt-1">{cert.courses?.title??"Course completion"}</div></div><CardContent className="p-4 space-y-3"><div className="text-xs"><div className="text-muted-foreground">Issued on</div><div className="font-medium">{new Date(cert.issued_at).toLocaleDateString()}</div></div>{cert.expires_at&&<div className="text-xs"><div className="text-muted-foreground">Expires on</div><div className="font-medium">{new Date(cert.expires_at).toLocaleDateString()}</div></div>}<div className="text-xs"><div className="text-muted-foreground">Verification code</div><div className="font-mono font-medium">{cert.verification_code}</div></div><div className="flex gap-2 pt-1"><Button size="sm" className="flex-1" onClick={()=>window.print()}><Printer className="h-4 w-4 mr-1"/>Print / Save PDF</Button><Button size="sm" variant="outline" onClick={()=>window.open("/verify/"+cert.verification_code,"_blank","noopener,noreferrer")}><ExternalLink className="h-4 w-4"/></Button></div>{cert.revoked_at&&<Badge variant="destructive">Revoked</Badge>}</CardContent></Card>)}</div>}
 </div>;
}
