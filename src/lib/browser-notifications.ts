/**
 * Browser notifications & sound alerts for ARYCP
 *
 * Uses lazy initialization — no top-level side effects.
 * AudioContext is created and unlocked only when first needed.
 */

let audioCtx: AudioContext | null = null
let unlockListenerAdded = false

function ensureAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null
    if (!audioCtx) {
        try {
            audioCtx = new AudioContext()
        } catch {
            return null
        }
    }
    // Resume if suspended (Chrome requires user gesture)
    if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => { })
    }
    // Add unlock listener once (to resume on next user interaction)
    if (!unlockListenerAdded && typeof document !== "undefined") {
        unlockListenerAdded = true
        const resume = () => {
            if (audioCtx && audioCtx.state === "suspended") {
                audioCtx.resume().catch(() => { })
            }
        }
        document.addEventListener("click", resume, { once: true })
        document.addEventListener("keydown", resume, { once: true })
    }
    return audioCtx
}

function playTones(tones: { freq: number; start: number; dur: number; vol: number }[]) {
    const ctx = ensureAudioContext()
    if (!ctx) return

    try {
        for (const t of tones) {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = t.freq
            osc.type = "sine"
            gain.gain.setValueAtTime(t.vol, ctx.currentTime + t.start)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t.start + t.dur)
            osc.start(ctx.currentTime + t.start)
            osc.stop(ctx.currentTime + t.start + t.dur)
        }
    } catch {
        // Silent fail — don't break callers
    }
}

/**
 * Play the system notification sound (2-tone high chime)
 */
export function playNotificationSound() {
    playTones([
        { freq: 830, start: 0, dur: 0.15, vol: 0.3 },
        { freq: 1100, start: 0.15, dur: 0.2, vol: 0.3 },
    ])
}

/**
 * Play the chat message sound (3-tone softer chime)
 */
export function playChatSound() {
    playTones([
        { freq: 600, start: 0, dur: 0.12, vol: 0.2 },
        { freq: 800, start: 0.12, dur: 0.12, vol: 0.2 },
        { freq: 600, start: 0.24, dur: 0.15, vol: 0.2 },
    ])
}

/**
 * Show a native browser notification
 */
export function showBrowserNotification(
    title: string,
    body: string,
    url?: string | null
) {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission !== "granted") return

    console.log("[ARYCP] Showing browser notification:", title, body)

    try {
        // Try ServiceWorker-based notification first (more reliable when tab is in background)
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body,
                    icon: "/favicon.ico",
                    tag: "arycp-" + Date.now(),
                    requireInteraction: false,
                    data: { url },
                }).catch(() => {
                    // Fallback to regular Notification
                    createBasicNotification(title, body, url)
                })
            }).catch(() => {
                createBasicNotification(title, body, url)
            })
        } else {
            createBasicNotification(title, body, url)
        }
    } catch {
        // Last resort fallback
        createBasicNotification(title, body, url)
    }
}

function createBasicNotification(title: string, body: string, url?: string | null) {
    try {
        const notif = new window.Notification(title, {
            body,
            icon: "/favicon.ico",
            tag: "arycp-" + Date.now(),
        })

        notif.onclick = () => {
            window.focus()
            if (url) window.location.href = url
            notif.close()
        }
    } catch (e) {
        console.warn("[ARYCP] Notification creation failed:", e)
    }
}

/**
 * Request browser notification permission (must be called from user gesture)
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
    if (typeof window === "undefined" || !("Notification" in window)) return null
    if (Notification.permission === "granted") return "granted"
    if (Notification.permission === "denied") return "denied"
    try {
        return await Notification.requestPermission()
    } catch {
        return null
    }
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | null {
    if (typeof window === "undefined" || !("Notification" in window)) return null
    return Notification.permission
}
