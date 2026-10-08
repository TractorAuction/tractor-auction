import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type PartnerRecord = {
  id: string
  company_name: string
  status: "pending" | "approved" | "rejected" | "suspended"
  source_id: string | null
  feed_type: string | null
  feed_url: string | null
  geographic_coverage: string | null
  contact_email: string
}

/**
 * The partner record for whoever is signed in.
 *
 * Applications are usually filed before the applicant has an account, so a
 * record can exist with no user_id. The first time someone signs in with the
 * application's contact email, the record is linked to them. That address is
 * confirmed by Supabase Auth before a session exists, so possession of the
 * inbox is the proof of identity, the same proof the application itself had.
 */
export async function getCurrentPartner() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { user: null, partner: null }

  const admin = createAdminClient()
  const columns =
    "id, company_name, status, source_id, feed_type, feed_url, geographic_coverage, contact_email"

  const { data: linked } = await admin
    .from("partners")
    .select(columns)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (linked) return { user, partner: linked as PartnerRecord }

  if (!user.email) return { user, partner: null }

  const { data: unclaimed } = await admin
    .from("partners")
    .select(columns)
    .is("user_id", null)
    .ilike("contact_email", user.email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!unclaimed) return { user, partner: null }

  await admin.from("partners").update({ user_id: user.id }).eq("id", unclaimed.id)
  return { user, partner: unclaimed as PartnerRecord }
}
