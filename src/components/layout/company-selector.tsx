"use client"

import { Building2, ChevronDown } from "lucide-react"
import { useUserRole, isClientRole } from "@/hooks/use-user-role"
import { useRouter, usePathname } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function CompanySelector() {
    const { role, clients, selectedClientId, setSelectedClient } = useUserRole()
    const router = useRouter()
    const pathname = usePathname()

    // Only show for client users with 2+ companies
    if (!isClientRole(role) || clients.length <= 1) return null

    const selectedCompany = clients.find(c => c.id === selectedClientId) || clients[0]

    function handleSelect(clientId: string) {
        if (clientId === selectedClientId) return
        setSelectedClient(clientId)
        // Redirect to the same module but with the new clientId
        // Pattern: /dashboard/accounting/OLD_ID → /dashboard/accounting/NEW_ID
        const segments = pathname.split("/")
        // Check if last segment is a UUID (client ID)
        if (segments.length >= 4 && segments[3]?.length > 30) {
            segments[3] = clientId
            router.replace(segments.join("/"))
        } else {
            // Just reload current page
            router.refresh()
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 hover:border-indigo-300 transition-all text-left">
                <Building2 className="h-4 w-4 text-indigo-600 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-indigo-500 font-semibold">Empresa</p>
                    <p className="text-sm font-medium text-indigo-900 truncate">{selectedCompany.name}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px]">
                {clients.map((client) => (
                    <DropdownMenuItem
                        key={client.id}
                        onClick={() => handleSelect(client.id)}
                        className={`flex items-center gap-2 cursor-pointer ${client.id === selectedClientId ? "bg-indigo-50 text-indigo-900 font-medium" : ""}`}
                    >
                        <Building2 className={`h-4 w-4 shrink-0 ${client.id === selectedClientId ? "text-indigo-600" : "text-muted-foreground"}`} />
                        <span className="truncate">{client.name}</span>
                        {client.id === selectedClientId && (
                            <span className="ml-auto text-indigo-500 text-xs">✓</span>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
