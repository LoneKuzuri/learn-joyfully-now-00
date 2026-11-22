import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Missing authorization" }, 401);

  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: authData, error: authError } = await callerClient.auth.getUser();
  if (authError || !authData.user) return json({ error: "Invalid session" }, 401);

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: caller, error: profileError } = await admin.from("profiles")
    .select("id,organization_id,role,is_active").eq("id", authData.user.id).single();
  if (profileError || !caller?.is_active || !["platform_super_admin","organization_admin","hr_coordinator"].includes(caller.role)) {
    return json({ error: "You are not allowed to invite organization members" }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const fullName = String(body.full_name ?? "").trim();
  const role = String(body.role ?? "learner");
  const departmentId = body.department_id ? String(body.department_id) : null;
  const allowedRoles = caller.role === "platform_super_admin"
    ? ["organization_admin","hr_coordinator","department_manager","trainer","learner"]
    : caller.role === "hr_coordinator"
      ? ["learner","trainer","department_manager"]
      : ["hr_coordinator","department_manager","trainer","learner"];
  if (!email || !fullName || !email.includes("@")) return json({ error: "Enter a valid email and full name" }, 400);
  if (!allowedRoles.includes(role)) return json({ error: "You cannot assign that role" }, 403);
  const organizationId = caller.role === "platform_super_admin"
    ? String(body.organization_id ?? "")
    : caller.organization_id;
  if (!organizationId) return json({ error: "Select an organization for this invitation" }, 400);
  const { data: organization } = await admin.from("organizations").select("id").eq("id", organizationId).maybeSingle();
  if (!organization) return json({ error: "Organization not found" }, 404);

  if (departmentId) {
    const { data: department } = await admin.from("departments").select("id")
      .eq("id", departmentId).eq("organization_id", organizationId).maybeSingle();
    if (!department) return json({ error: "Selected department does not belong to your organization" }, 400);
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  });
  if (inviteError || !invited.user) return json({ error: inviteError?.message ?? "Invitation failed" }, 400);

  const { error: updateError } = await admin.from("profiles").update({
    organization_id: organizationId, role, full_name: fullName, department_id: departmentId,
  }).eq("id", invited.user.id);
  if (updateError) return json({ error: "User was invited but profile setup failed: " + updateError.message }, 500);

  await admin.from("audit_logs").insert({
    organization_id: organizationId, actor_id: caller.id, action: "member_invited",
    entity_type: "profile", entity_id: invited.user.id,
    metadata: { email, role, department_id: departmentId },
  });
  return json({ user_id: invited.user.id, email, role });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
