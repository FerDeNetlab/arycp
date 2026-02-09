"use client"

import { useState, useEffect } from "react"

type UserServices = {
    has_accounting: boolean
    has_fiscal: boolean
    has_legal: boolean
    has_labor: boolean
}

type UserRoleData = {
    role: string
    fullName: string
    email: string
    services: UserServices | null
    clientId: string | null
    loading: boolean
}

// Cache to avoid duplicate calls
let cachedData: Omit<UserRoleData, "loading"> | null = null
let fetchPromise: Promise<Omit<UserRoleData, "loading">> | null = null

export function useUserRole(): UserRoleData {
    const [data, setData] = useState<Omit<UserRoleData, "loading">>(
        cachedData || {
            role: "",
            fullName: "",
            email: "",
            services: null,
            clientId: null,
        }
    )
    const [loading, setLoading] = useState(!cachedData)

    useEffect(() => {
        if (cachedData) {
            setData(cachedData)
            setLoading(false)
            return
        }

        if (!fetchPromise) {
            fetchPromise = fetch("/api/auth/me")
                .then((res) => res.json())
                .then((json) => {
                    const result = {
                        role: json.role || "",
                        fullName: json.fullName || "",
                        email: json.email || "",
                        services: json.services || null,
                        clientId: json.clientId || null,
                    }
                    cachedData = result
                    return result
                })
                .catch(() => ({
                    role: "",
                    fullName: "",
                    email: "",
                    services: null,
                    clientId: null,
                }))
        }

        fetchPromise.then((result) => {
            setData(result)
            setLoading(false)
        })
    }, [])

    return { ...data, loading }
}

export function isClientRole(role: string): boolean {
    return role === "cliente"
}

export function canModify(role: string): boolean {
    return role === "admin" || role === "contador"
}
