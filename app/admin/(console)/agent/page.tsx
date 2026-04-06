import { redirect } from "next/navigation"

/** Old route: agent controls live on the Tenants page. */
export default function AdminAgentRedirectPage() {
  redirect("/admin/tenants")
}
