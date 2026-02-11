"use client"

import { useEffect, useRef } from "react"

/**
 * Hook that adds scroll-triggered animations using Intersection Observer.
 * Adds 'scroll-visible' class to elements with 'scroll-hidden' (or variants) when they enter viewport.
 */
export function useScrollAnimation() {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = ref.current
        if (!container) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("scroll-visible")
                        observer.unobserve(entry.target) // animate only once
                    }
                })
            },
            {
                threshold: 0.1,
                rootMargin: "0px 0px -40px 0px",
            }
        )

        // Observe all elements with scroll-hidden classes
        const targets = container.querySelectorAll(
            ".scroll-hidden, .scroll-hidden-left, .scroll-hidden-right, .scroll-hidden-scale"
        )
        targets.forEach((el) => observer.observe(el))

        return () => observer.disconnect()
    }, [])

    return ref
}
