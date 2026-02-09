"use client"

import { useEffect, useState } from "react"
import { ROLES } from "@/lib/constants/roles"

type UserRole = {
    id: string
    email: string
    role: string
    fullName: string
}

export function useUserRole() {
    const [userData, setUserData] = useState<UserRole | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchUserRole()
    }, [])

    async function fetchUserRole() {
        try {
            const response = await fetch("/api/auth/me")
            const data = await response.json()

            if (!response.ok) {
                setError(data.error || "Error al obtener rol")
                setLoading(false)
                return
            }

            setUserData(data)
            setLoading(false)
        } catch (err) {
            console.error("Error fetching user role:", err)
            setError("Error de conexión")
            setLoading(false)
        }
    }

    return {
        userData,
        role: userData?.role || null,
        isAdmin: userData?.role === ROLES.ADMIN,
        isContador: userData?.role === ROLES.CONTADOR,
        isCliente: userData?.role === ROLES.CLIENTE,
        loading,
        error,
        refreshRole: fetchUserRole,
    }
}
