import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Step {
  label: string
  value: string
}

interface StepsProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function Steps({ steps, currentStep, className }: StepsProps) {
  return (
    <div className={cn("!mb-16 flex w-10/12 items-center", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep

        return (
          <div
            key={step.value}
            className={cn(
              "ml-20 flex items-center",
              index < steps.length - 1 ? "flex-1" : ""
            )}
          >
            <div className="relative flex items-center justify-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-primary text-primary"
                      : "border-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "absolute top-10 text-sm whitespace-nowrap",
                  isCompleted || isCurrent
                    ? "font-medium text-primary"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-4 mt-[-1px] h-[2px] flex-1",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
