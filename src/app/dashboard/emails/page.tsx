import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EmailsPageClient } from "@/components/emails/emails-page-client"

export default async function EmailsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return <EmailsPageClient />
}
