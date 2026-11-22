import { createFileRoute,Link } from "@tanstack/react-router";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuth } from "@/lib/auth";
import { Card,CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen,Users,ClipboardList,ArrowRight } from "lucide-react";
export const Route=createFileRoute("/hr")({head:()=>({meta:[{title:"Learning Workspace — Learning Hub Connect"}]}),component:HRLandingPage});
function HRLandingPage(){
 const {allowed}=useAuthGuard("hr");const {user}=useAuth();if(!allowed)return null;
 return <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"><div><h1 className="text-2xl font-semibold tracking-tight">Learning workspace</h1><p className="text-sm text-muted-foreground">Manage your organization’s training operations.</p></div>
 <div className="grid gap-4 md:grid-cols-3">{[{title:"People & teams",description:"Create departments, organize teams and invite members.",to:"/hr/people",icon:Users},{title:"Course catalog",description:"Create learning modules and assessments.",to:"/hr/courses",icon:BookOpen},{title:"Assignments",description:"Publish mandatory or optional training with deadlines.",to:"/hr/assign",icon:ClipboardList}].map(item=><Card key={item.title}><CardContent className="p-5"><item.icon className="h-6 w-6 text-primary"/><div className="font-medium mt-3">{item.title}</div><p className="text-sm text-muted-foreground mt-1">{item.description}</p><Button asChild variant="ghost" size="sm" className="mt-3 -ml-2"> <Link to={item.to}>{user?.role==="department_manager"&&item.to==="/hr/people"?"View team":"Open"}<ArrowRight className="h-4 w-4 ml-1"/></Link></Button></CardContent></Card>)}</div>
 <Card><CardContent className="p-5 flex items-center justify-between gap-3"><div><div className="font-medium">Organization performance</div><p className="text-sm text-muted-foreground">View completion, department activity and overdue assignments.</p></div><Button asChild><Link to="/hr/dashboard">Open dashboard<ArrowRight className="h-4 w-4 ml-1"/></Link></Button></CardContent></Card>
 </div>;
}
