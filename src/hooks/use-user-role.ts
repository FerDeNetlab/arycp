"use client"

import { useState, useEffect, useCallback } from "react"

type UserServices = {
    has_accounting: boolean
    has_fiscal: boolean
    has_legal: boolean
    has_labor: boolean
}

type ClientInfo = {
    id: string
    name: string
    has_accounting: boolean
    has_fiscal: boolean
    has_legal: boolean
    has_labor: boolean
}

type UserRoleData = {
    userId: string
    role: string
    fullName: string
    email: string
    services: UserServices | null
    clientId: string | null
    clients: ClientInfo[]
    selectedClientId: string | null
    loading: boolean
    setSelectedClient: (clientId: string) => void
}

// Cache to avoid duplicate calls
let cachedData: Omit<UserRoleData, "loading" | "setSelectedClient" | "selectedClientId"> | null = null
let fetchPromise: Promise<Omit<UserRoleData, "loading" | "setSelectedClient" | "selectedClientId">> | null = null

// Selected client persisted in sessionStorage
const SELECTED_CLIENT_KEY = "arycp_selected_client"

function getStoredClientId(): string | null {
    if (typeof window === "undefined") return null
    return sessionStorage.getItem(SELECTED_CLIENT_KEY)
}

function storeClientId(id: string) {
    if (typeof window !== "undefined") {
        sessionStorage.setItem(SELECTED_CLIENT_KEY, id)
    }
}

export function useUserRole(): UserRoleData {
    const [data, setData] = useState<Omit<UserRoleData, "loading" | "setSelectedClient" | "selectedClientId">>(
        cachedData || {
            userId: "",
            role: "",
            fullName: "",
            email: "",
            services: null,
            clientId: null,
            clients: [],
        }
    )
    const [loading, setLoading] = useState(!cachedData)
    const [selectedClientId, setSelectedClientIdState] = useState<string | null>(
        getStoredClientId() || cachedData?.clientId || null
    )

    const setSelectedClient = useCallback((clientId: string) => {
        storeClientId(clientId)
        setSelectedClientIdState(clientId)
        // Update services to match the selected client
        const client = data.clients.find(c => c.id === clientId)
        if (client) {
            setData(prev => ({
                ...prev,
                services: {
                    has_accounting: client.has_accounting,
                    has_fiscal: client.has_fiscal,
                    has_legal: client.has_legal,
                    has_labor: client.has_labor,
                },
            }))
        }
        // Clear cache so next page load re-evaluates
        cachedData = null
    }, [data.clients])

    useEffect(() => {
        // If we already have cached data, state was initialized from it — nothing to do
        if (cachedData) {
            return
        }

        if (!fetchPromise) {
            fetchPromise = fetch("/api/auth/me")
                .then((res) => res.json())
                .then((json) => {
                    const clients: ClientInfo[] = json.clients || []
                    const result = {
                        userId: json.id || "",
                        role: json.role || "",
                        fullName: json.fullName || "",
                        email: json.email || "",
                        services: json.services || null,
                        clientId: json.clientId || null,
                        clients,
                    }
                    cachedData = result
                    return result
                })
                .catch(() => ({
                    userId: "",
                    role: "",
                    fullName: "",
                    email: "",
                    services: null,
                    clientId: null,
                    clients: [],
                }))
        }

        fetchPromise.then((result) => {
            setData(result)
            // Set selected client: stored preference > first client
            const storedId = getStoredClientId()
            const validStored = storedId && result.clients.some(c => c.id === storedId)
            const effectiveClientId = validStored ? storedId : result.clientId
            if (effectiveClientId) {
                setSelectedClientIdState(effectiveClientId)
                // Update services to match the selected client
                const client = result.clients.find(c => c.id === effectiveClientId)
                if (client && effectiveClientId !== result.clientId) {
                    setData(prev => ({
                        ...prev,
                        services: {
                            has_accounting: client.has_accounting,
                            has_fiscal: client.has_fiscal,
                            has_legal: client.has_legal,
                            has_labor: client.has_labor,
                        },
                    }))
                }
            }
            setLoading(false)
        })
    }, [selectedClientId])

    return { ...data, selectedClientId, loading, setSelectedClient }
}

export function isClientRole(role: string): boolean {
    return role === "cliente"
}

export function canModify(role: string): boolean {
    return role === "admin" || role === "contador"
}
