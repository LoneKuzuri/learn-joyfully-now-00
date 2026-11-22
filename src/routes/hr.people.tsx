import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuth, isOrganizationAdmin, type Role } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Users, Loader2 } from "lucide-react";

export const Route = createFileRoute("/hr/people")({
  head: () => ({ meta: [{ title: "People & Teams — Learning Hub Connect" }] }),
  component: PeoplePage,
});

type Person = { id: string; full_name: string; email: string; role: Role; is_active: boolean; departments?: { name: string } | null };
type Department = { id: string; name: string };
type Team = { id: string; name: string };
const roleNames: Record<Role,string> = {
  platform_super_admin: "Platform Super Admin", organization_admin: "Organization Admin",
  hr_coordinator: "HR / Training Coordinator", department_manager: "Department Manager",
  trainer: "Trainer / Instructor", learner: "Employee / Learner",
};

function PeoplePage() {
  const { allowed } = useAuthGuard("admin");
  const { user } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedLearner, setSelectedLearner] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("learner");
  const [departmentId, setDepartmentId] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newTeam, setNewTeam] = useState("");
  const [teamDepartmentId, setTeamDepartmentId] = useState("");
  const canInvite = !!user && isOrganizationAdmin(user.role);
  const roleOptions: Role[] = user?.role === "hr_coordinator"
    ? ["learner", "trainer", "department_manager"]
    : ["hr_coordinator", "department_manager", "trainer", "learner"];

  const load = async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const [peopleRes, deptRes, teamRes] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,role,is_active,departments(name)").order("full_name"),
        supabase.from("departments").select("id,name").order("name"),
        supabase.from("teams").select("id,name").order("name"),
      ]);
      if (peopleRes.error) throw peopleRes.error;
      if (deptRes.error) throw deptRes.error;
      if (teamRes.error) throw teamRes.error;
      setPeople((peopleRes.data ?? []) as Person[]);
      setDepartments(deptRes.data ?? []);
      setTeams(teamRes.data ?? []);
      if (!selectedTeam && teamRes.data?.[0]) setSelectedTeam(teamRes.data[0].id);
      if (!selectedLearner && peopleRes.data?.find((person) => person.role === "learner")) setSelectedLearner(peopleRes.data.find((person) => person.role === "learner")!.id);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load organization members"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (allowed) void load(); }, [allowed]);

  const createDepartment = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const { error } = await getSupabase().from("departments").insert({ name: newDepartment.trim(), organization_id: user?.organizationId });
      if (error) throw error;
      toast.success("Department created"); setNewDepartment(""); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to create department"); }
  };

  const createTeam = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const { error } = await getSupabase().from("teams").insert({ name: newTeam.trim(), department_id: teamDepartmentId || null, organization_id: user?.organizationId });
      if (error) throw error;
      toast.success("Team created"); setNewTeam(""); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to create team"); }
  };

  const addTeamMember = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const { error } = await getSupabase().from("team_members").insert({ team_id: selectedTeam, profile_id: selectedLearner });
      if (error) throw error;
      toast.success("Learner added to team");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to add team member"); }
  };

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data, error } = await getSupabase().functions.invoke("invite-user", {
        body: { email: email.trim(), full_name: name.trim(), role, department_id: departmentId || null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Invitation sent to " + email);
      setName(""); setEmail(""); setDepartmentId(""); setRole("learner");
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to invite user. Deploy the invite-user Edge Function first."); }
    finally { setSaving(false); }
  };

  if (!allowed) return null;
  return <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <div><h1 className="text-2xl font-semibold tracking-tight">People & Teams</h1><p className="text-sm text-muted-foreground">Manage organization membership and role-based access.</p></div>
    {canInvite && <div className="grid gap-4 md:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">Departments</CardTitle></CardHeader><CardContent><form onSubmit={createDepartment} className="flex gap-2"><Input required value={newDepartment} onChange={(e)=>setNewDepartment(e.target.value)} placeholder="Department name"/><Button type="submit">Add</Button></form><div className="mt-3 flex flex-wrap gap-2">{departments.map(d=><Badge key={d.id} variant="secondary">{d.name}</Badge>)}</div></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Teams</CardTitle></CardHeader><CardContent><form onSubmit={createTeam} className="space-y-2"><Input required value={newTeam} onChange={(e)=>setNewTeam(e.target.value)} placeholder="Team name"/><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={teamDepartmentId} onChange={(e)=>setTeamDepartmentId(e.target.value)}><option value="">No department</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select><Button type="submit">Add team</Button></form></CardContent></Card>
    </div>}
    {canInvite && <Card><CardHeader><CardTitle className="text-base">Team membership</CardTitle></CardHeader><CardContent><form onSubmit={addTeamMember} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><div className="space-y-1"><Label htmlFor="member-team">Team</Label><select id="member-team" required className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={selectedTeam} onChange={(e)=>setSelectedTeam(e.target.value)}><option value="">Select team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div><div className="space-y-1"><Label htmlFor="member-learner">Learner</Label><select id="member-learner" required className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={selectedLearner} onChange={(e)=>setSelectedLearner(e.target.value)}><option value="">Select learner</option>{people.filter(p=>p.role==="learner").map(p=><option key={p.id} value={p.id}>{p.full_name||p.email}</option>)}</select></div><div className="flex items-end"><Button type="submit" disabled={!selectedTeam||!selectedLearner}>Add member</Button></div></form></CardContent></Card>}
    {canInvite && <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-4 w-4"/> Invite a team member</CardTitle></CardHeader><CardContent>
      <form onSubmit={invite} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="invite-name">Full name</Label><Input id="invite-name" required value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name"/></div>
        <div className="space-y-2"><Label htmlFor="invite-email">Work email</Label><Input id="invite-email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="name@company.com"/></div>
        <div className="space-y-2"><Label htmlFor="invite-role">Role</Label><select id="invite-role" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={role} onChange={(e)=>setRole(e.target.value as Role)}>{roleOptions.map((item)=><option key={item} value={item}>{roleNames[item]}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="invite-department">Department</Label><select id="invite-department" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={departmentId} onChange={(e)=>setDepartmentId(e.target.value)}><option value="">No department</option>{departments.map((d)=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        <div className="md:col-span-2 flex justify-end"><Button type="submit" disabled={saving}>{saving&&<Loader2 className="h-4 w-4 mr-2 animate-spin"/>}Send invitation</Button></div>
      </form>
      <p className="text-xs text-muted-foreground mt-3">Invitations are sent through Supabase Auth. Elevated platform administrator roles cannot be assigned from this screen.</p>
    </CardContent></Card>}
    <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4"/> Organization members <Badge variant="secondary">{people.length}</Badge></CardTitle></CardHeader><CardContent>
      {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading people…</p> : people.length===0 ? <p className="py-8 text-center text-sm text-muted-foreground">No members found.</p> :
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="py-3 pr-4 font-medium">Member</th><th className="py-3 pr-4 font-medium">Department</th><th className="py-3 pr-4 font-medium">Role</th><th className="py-3 font-medium">Status</th></tr></thead><tbody>{people.map((person)=><tr key={person.id} className="border-b last:border-0"><td className="py-3 pr-4"><div className="font-medium">{person.full_name||"Unnamed user"}</div><div className="text-xs text-muted-foreground">{person.email}</div></td><td className="py-3 pr-4">{person.departments?.name||"—"}</td><td className="py-3 pr-4">{roleNames[person.role]}</td><td className="py-3"><Badge variant={person.is_active?"default":"outline"}>{person.is_active?"Active":"Inactive"}</Badge></td></tr>)}</tbody></table></div>}
    </CardContent></Card>
  </div>;
}
