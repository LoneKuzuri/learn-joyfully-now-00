import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const { verification_code } = await req.json().catch(() => ({}));
  const code = String(verification_code ?? "")
    .trim()
    .toUpperCase();
  if (!code) return json({ error: "Verification code is required" }, 400);
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data, error } = await admin
    .from("certificates")
    .select(
      "verification_code,issued_at,expires_at,revoked_at,profiles(full_name),courses(title),organizations(name)",
    )
    .eq("verification_code", code)
    .maybeSingle();
  if (error) return json({ error: "Unable to verify certificate" }, 500);
  if (!data)
    return json({ valid: false, message: "No certificate matches this verification code." });
  const expired = !!data.expires_at && new Date(data.expires_at).getTime() < Date.now();
  const revoked = !!data.revoked_at;
  return json({
    valid: !expired && !revoked,
    status: revoked ? "revoked" : expired ? "expired" : "valid",
    verification_code: data.verification_code,
    issued_at: data.issued_at,
    expires_at: data.expires_at,
    learner: (data.profiles as { full_name: string } | null)?.full_name ?? "Learner",
    course: (data.courses as { title: string } | null)?.title ?? "Course",
    organization: (data.organizations as { name: string } | null)?.name ?? "Organization",
  });
});
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
