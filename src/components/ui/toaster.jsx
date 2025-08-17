import { AnimatePresence } from "framer-motion"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"
import { useToast } from "./use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      <ToastViewport>
        <AnimatePresence>
          {toasts.map(function ({ id, title, description, action, variant, ...props }) {
            return (
              <Toast key={id} variant={variant} {...props}>
                <div className="grid gap-1">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && (
                    <ToastDescription>{description}</ToastDescription>
                  )}
                </div>
                {action}
                <ToastClose onClose={() => props.onOpenChange?.(false)} />
              </Toast>
            )
          })}
        </AnimatePresence>
      </ToastViewport>
    </ToastProvider>
  )
} 