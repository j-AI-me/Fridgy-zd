"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"

export function PrivacyPolicy() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
          Política de Privacidad
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Política de Privacidad
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm space-y-4 mt-4">
          <p>
            <strong>Última actualización:</strong> {new Date().toLocaleDateString()}
          </p>

          <section>
            <h3 className="font-medium mb-1">1. Información que recopilamos</h3>
            <p>Fridgy recopila la siguiente información:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Imágenes que subes de tu nevera</li>
              <li>Ingredientes identificados en tus imágenes</li>
              <li>Recetas generadas basadas en tus ingredientes</li>
              <li>Recetas marcadas como favoritas</li>
            </ul>
          </section>

          <section>
            <h3 className="font-medium mb-1">2. Cómo usamos tu información</h3>
            <p>Utilizamos la información recopilada para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Analizar el contenido de tu nevera</li>
              <li>Generar recetas personalizadas</li>
              <li>Mejorar nuestros algoritmos de reconocimiento de alimentos</li>
              <li>Proporcionar una experiencia personalizada</li>
            </ul>
          </section>

          <section>
            <h3 className="font-medium mb-1">3. Seguridad de datos</h3>
            <p>Tomamos medidas para proteger tu información:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Encriptación de datos en tránsito y en reposo</li>
              <li>Acceso limitado a tus datos personales</li>
              <li>Eliminación automática de imágenes después de su análisis</li>
              <li>Almacenamiento seguro de preferencias</li>
            </ul>
          </section>

          <section>
            <h3 className="font-medium mb-1">4. Tus derechos</h3>
            <p>Tienes derecho a:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Acceder a tus datos personales</li>
              <li>Corregir información inexacta</li>
              <li>Eliminar tu cuenta y datos asociados</li>
              <li>Exportar tus datos en un formato portátil</li>
            </ul>
          </section>

          <section>
            <h3 className="font-medium mb-1">5. Contacto</h3>
            <p>
              Si tienes preguntas sobre nuestra política de privacidad, contáctanos en:
              <br />
              <a href="mailto:privacy@fridgy.app" className="text-primary hover:underline">
                privacy@fridgy.app
              </a>
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
