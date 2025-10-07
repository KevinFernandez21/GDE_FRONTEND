"use client"

import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight, BookOpen, Calculator, FileText, BarChart3, DollarSign, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface TutorialStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  content: string
  tips: string[]
  actionText?: string
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: "Bienvenido al Sistema GDE",
    description: "Sistema de Gestión de Inventario y Contabilidad",
    icon: <BookOpen className="w-6 h-6" />,
    content: "Como usuario contador, tendrás acceso a herramientas especializadas para la gestión contable y financiera de la empresa. Este tutorial te guiará a través de las funcionalidades principales.",
    tips: [
      "Mantén siempre actualizados los registros contables",
      "Revisa diariamente los reportes de inventario",
      "Usa las alertas automáticas para gestión de stock"
    ]
  },
  {
    id: 2,
    title: "Dashboard Principal",
    description: "Monitoreo en tiempo real de métricas clave",
    icon: <BarChart3 className="w-6 h-6" />,
    content: "El dashboard te muestra las métricas más importantes: stock disponible, productos críticos, valorización del inventario y movimientos recientes. Toda la información se actualiza automáticamente desde la base de datos.",
    tips: [
      "Revisa las alertas rojas diariamente",
      "Monitorea la valorización del inventario",
      "Utiliza los filtros para análisis específicos"
    ],
    actionText: "Ir al Dashboard"
  },
  {
    id: 3,
    title: "Gestión Financiera",
    description: "Control de costos, gastos y capital",
    icon: <DollarSign className="w-6 h-6" />,
    content: "En el módulo de Gestión puedes registrar y controlar todos los costos, gastos operativos y movimientos de capital. Los datos se sincronizan con el sistema contable para generar reportes automáticos.",
    tips: [
      "Clasifica correctamente los costos por categoría",
      "Mantén actualizado el estado de los documentos",
      "Revisa mensualmente los KPIs financieros"
    ],
    actionText: "Ir a Gestión"
  },
  {
    id: 4,
    title: "Trazabilidad de Movimientos",
    description: "Kardex y guías de despacho en tiempo real",
    icon: <FileText className="w-6 h-6" />,
    content: "El módulo de Trazabilidad te permite seguir todos los movimientos de inventario mediante el kardex y gestionar las guías de despacho. Todos los movimientos se registran automáticamente.",
    tips: [
      "Verifica que cada movimiento tenga documento de respaldo",
      "Usa los filtros de fecha para análisis periódicos",
      "Exporta el kardex para análisis externos"
    ],
    actionText: "Ir a Trazabilidad"
  },
  {
    id: 5,
    title: "Reportes y Análisis",
    description: "Generación automática de reportes contables",
    icon: <TrendingUp className="w-6 h-6" />,
    content: "El sistema genera automáticamente reportes de estado de resultados, balance general y flujo de caja. Los reportes se actualizan en tiempo real con los datos del inventario y transacciones.",
    tips: [
      "Programa reportes automáticos mensuales",
      "Compara periodos para análisis de tendencias",
      "Exporta los reportes en formato Excel para presentaciones"
    ],
    actionText: "Ver Reportes"
  },
  {
    id: 6,
    title: "Mejores Prácticas",
    description: "Consejos para optimizar tu trabajo",
    icon: <Calculator className="w-6 h-6" />,
    content: "Para aprovechar al máximo el sistema, sigue estas mejores prácticas de trabajo diario que te ayudarán a mantener la información contable siempre actualizada y precisa.",
    tips: [
      "Registra las transacciones diariamente",
      "Verifica la conciliación bancaria semanalmente",
      "Mantén respaldo de todos los documentos digitales",
      "Revisa los inventarios físicos mensualmente",
      "Actualiza los precios de productos trimestralmente"
    ]
  }
]

interface AccountingTutorialProps {
  isOpen: boolean
  onClose: () => void
  userRole?: string
}

export default function AccountingTutorial({ isOpen, onClose, userRole }: AccountingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setCompletedSteps([])
    }
  }, [isOpen])

  if (!isOpen) return null

  const currentTutorialStep = tutorialSteps[currentStep]
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep])
      }
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setCompletedSteps(prev => [...prev, currentStep])

    // Marcar el tutorial como completado en localStorage
    localStorage.setItem('tutorial_completed', 'true')
    localStorage.setItem('tutorial_completion_date', new Date().toISOString())

    onClose()
  }

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {currentTutorialStep.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-blue-900">Tutorial para Contadores</h2>
              <p className="text-sm text-blue-600">Sistema GDE - Gestión Integral</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progreso del Tutorial</span>
            <span className="text-sm text-gray-500">
              {currentStep + 1} de {tutorialSteps.length}
            </span>
          </div>
          <Progress value={progress} className="mb-4" />

          {/* Step indicators */}
          <div className="flex gap-2 overflow-x-auto">
            {tutorialSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                  index === currentStep
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : completedSteps.includes(index)
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-500 hover:border-blue-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  {currentTutorialStep.icon}
                </div>
                <div>
                  <CardTitle className="text-xl">{currentTutorialStep.title}</CardTitle>
                  <CardDescription className="text-lg">
                    {currentTutorialStep.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700 leading-relaxed">
                {currentTutorialStep.content}
              </p>

              {currentTutorialStep.tips.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    💡 Consejos Importantes
                  </h4>
                  <ul className="space-y-2">
                    {currentTutorialStep.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 flex-shrink-0">
                          {index + 1}
                        </Badge>
                        <span className="text-sm text-gray-600">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentTutorialStep.actionText && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>Acción recomendada:</strong>
                  </p>
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                    {currentTutorialStep.actionText}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Saltar Tutorial
            </Button>

            {currentStep === tutorialSteps.length - 1 ? (
              <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                Completar Tutorial
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Siguiente
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}