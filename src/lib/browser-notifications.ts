/**
 * Browser notifications & sound alerts for ARYCP
 *
 * Solves Chrome's autoplay policy by:
 * 1. Using a singleton AudioContext that gets resumed on first user interaction
 * 2. Registering a one-time click/keydown listener on document to unlock audio
 * 3. Falling back to Audio element with data URI if AudioContext fails
 */

let audioCtx: AudioContext | null = null
let audioUnlocked = false

function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null
    if (!audioCtx) {
        try {
            audioCtx = new AudioContext()
        } catch {
            return null
        }
    }
    return audioCtx
}

// Unlock AudioContext on first user gesture (click, keydown, touchstart)
if (typeof window !== "undefined") {
    const unlock = () => {
        const ctx = getAudioContext()
        if (ctx && ctx.state === "suspended") {
            ctx.resume()
        }
        audioUnlocked = true
        document.removeEventListener("click", unlock)
        document.removeEventListener("keydown", unlock)
        document.removeEventListener("touchstart", unlock)
    }
    document.addEventListener("click", unlock, { once: false })
    document.addEventListener("keydown", unlock, { once: false })
    document.addEventListener("touchstart", unlock, { once: false })
}

function playTones(tones: { freq: number; start: number; dur: number; vol: number }[]) {
    const ctx = getAudioContext()
    if (!ctx) return

    // Resume if suspended (belt-and-suspenders)
    if (ctx.state === "suspended") {
        ctx.resume()
    }

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
        // Fallback: try HTML5 Audio with a simple beep
        playFallbackBeep()
    }
}

// Fallback beep using a tiny WAV file encoded as data URI
function playFallbackBeep() {
    try {
        // Minimal WAV: 8kHz, 8-bit, mono, ~100ms beep
        const sampleRate = 8000
        const duration = 0.15
        const numSamples = Math.floor(sampleRate * duration)
        const buffer = new ArrayBuffer(44 + numSamples)
        const view = new DataView(buffer)
        // WAV header
        const writeString = (offset: number, str: string) => {
            for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
        }
        writeString(0, "RIFF")
        view.setUint32(4, 36 + numSamples, true)
        writeString(8, "WAVE")
        writeString(12, "fmt ")
        view.setUint32(16, 16, true)       // chunk size
        view.setUint16(20, 1, true)         // PCM
        view.setUint16(22, 1, true)         // mono
        view.setUint32(24, sampleRate, true)
        view.setUint32(28, sampleRate, true)
        view.setUint16(32, 1, true)         // block align
        view.setUint16(34, 8, true)         // bits per sample
        writeString(36, "data")
        view.setUint32(40, numSamples, true)
        // Generate sine wave
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate
            const envelope = Math.max(0, 1 - t / duration) // fade out
            const sample = Math.sin(2 * Math.PI * 800 * t) * envelope
            view.setUint8(44 + i, Math.floor(128 + 64 * sample))
        }
        const blob = new Blob([buffer], { type: "audio/wav" })
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.volume = 0.3
        audio.play().catch(() => { })
        audio.onended = () => URL.revokeObjectURL(url)
    } catch {
        // Nothing we can do
    }
}

/**
 * Play the system notification sound (2-tone high chime)
 */
export function playNotificationSound() {
    if (!audioUnlocked) {
        playFallbackBeep()
        return
    }
    playTones([
        { freq: 830, start: 0, dur: 0.15, vol: 0.3 },
        { freq: 1100, start: 0.15, dur: 0.2, vol: 0.3 },
    ])
}

/**
 * Play the chat message sound (3-tone softer chime)
 */
export function playChatSound() {
    if (!audioUnlocked) {
        playFallbackBeep()
        return
    }
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

    const notif = new window.Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: "arycp-" + Date.now(),
    })

    if (url) {
        notif.onclick = () => {
            window.focus()
            window.location.href = url
            notif.close()
        }
    } else {
        notif.onclick = () => {
            window.focus()
            notif.close()
        }
    }
}

/**
 * Request browser notification permission (must be called from user gesture)
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
    if (typeof window === "undefined" || !("Notification" in window)) return null
    if (Notification.permission === "granted") return "granted"
    if (Notification.permission === "denied") return "denied"
    return await Notification.requestPermission()
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | null {
    if (typeof window === "undefined" || !("Notification" in window)) return null
    return Notification.permission
}
