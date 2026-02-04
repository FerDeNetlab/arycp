"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

export default function GoogleConnectButton() {
  const handleConnect = () => {
    alert(
      "La conexión con Google Calendar estará disponible cuando publiques el sitio. En el preview solo puedes ver la interfaz.",
    )
  }

  return (
    <Button onClick={handleConnect} size="lg" className="gap-2">
      <Calendar className="h-5 w-5" />
      Conectar Google Calendar
    </Button>
  )
}
