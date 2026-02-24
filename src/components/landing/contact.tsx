"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export function Contact() {
  const scrollRef = useScrollAnimation()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al enviar el mensaje")
        setLoading(false)
        return
      }

      setSent(true)
      setFormData({ name: "", email: "", company: "", message: "" })
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contacto" className="py-16 md:py-24 px-4 bg-muted/30 relative overflow-hidden" ref={scrollRef}>
      {/* Background decorators */}
      <div className="absolute top-0 left-1/2 w-[500px] h-[300px] bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -z-10"></div>

      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance scroll-hidden">Contáctanos</h2>
          <p className="text-base md:text-xl text-muted-foreground leading-relaxed scroll-hidden stagger-1">
            Estamos listos para ayudarte a llevar tu empresa al siguiente nivel
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="space-y-4">
            {[
              { icon: Mail, title: "Email", value: "contacto@arycp.com", bg: "bg-primary/10", color: "text-primary" },
              { icon: Phone, title: "Teléfono", value: "+52 33 1094 9192", bg: "bg-blue-50", color: "text-blue-600" },
              { icon: MapPin, title: "Ubicación", value: "Zenzontle 886, Col. 8 de Julio, Guadalajara, Jalisco, México", bg: "bg-emerald-50", color: "text-emerald-600" },
            ].map((item, i) => (
              <Card key={i} className={`card-hover scroll-hidden stagger-${i + 1}`}>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0 icon-hover`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="lg:col-span-2 glass scroll-hidden stagger-2 shadow-lg">
            <CardHeader>
              <CardTitle>Envíanos un mensaje</CardTitle>
              <CardDescription>Completa el formulario y nos pondremos en contacto contigo</CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">¡Mensaje enviado!</h3>
                  <p className="text-muted-foreground mb-4">
                    Gracias por contactarnos. Te responderemos lo antes posible.
                  </p>
                  <Button variant="outline" onClick={() => setSent(false)}>
                    Enviar otro mensaje
                  </Button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre *</Label>
                      <Input
                        id="name"
                        placeholder="Tu nombre"
                        className="bg-white/50"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        className="bg-white/50"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      placeholder="Nombre de tu empresa"
                      className="bg-white/50"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Mensaje *</Label>
                    <Textarea
                      id="message"
                      placeholder="Cuéntanos cómo podemos ayudarte..."
                      rows={5}
                      className="bg-white/50"
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 group shadow-lg shadow-primary/20"
                    disabled={loading}
                  >
                    {loading ? (
                      "Enviando..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        Enviar Mensaje
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
