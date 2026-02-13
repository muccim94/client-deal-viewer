import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !anonKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller identity
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleRow } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (!roleRow || roleRow.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List all users
    const {
      data: { users },
      error: listError,
    } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

    if (listError) {
      console.error("Failed to list users:", listError);
      return new Response(JSON.stringify({ error: "Unable to retrieve user list" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch roles for all users
    const { data: rolesData } = await adminClient
      .from("user_roles")
      .select("user_id, role");

    const rolesMap: Record<string, string> = {};
    if (rolesData) {
      for (const r of rolesData) {
        rolesMap[r.user_id] = r.role;
      }
    }

    const result = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: rolesMap[u.id] || "user",
    }));

    // Fetch distinct agents from sales_records (service role bypasses RLS & row limits)
    const allAgents: string[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data: batch } = await adminClient
        .from("sales_records")
        .select("agente")
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (!batch || batch.length === 0) break;
      for (const r of batch) {
        if (r.agente) allAgents.push(r.agente);
      }
      if (batch.length < pageSize) break;
      page++;
    }
    const distinctAgents = [...new Set(allAgents)].sort();

    return new Response(JSON.stringify({ users: result, agents: distinctAgents }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("list-users error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
