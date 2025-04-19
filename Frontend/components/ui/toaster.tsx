"use client"
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast as useToastHook } from "@/hooks/use-toast"

function Toaster() {
  const { toasts } = useToastHook()

  return (
    <ToastProvider>
      {toasts.map(({ ...props }) => (
        <Toast key={props.id} {...props}>
          <div className="grid gap-1 pr-7">
            {props.title && <ToastTitle>{props.title}</ToastTitle>}
            {props.description && <ToastDescription>{props.description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}

export { Toaster, useToastHook as useToast }
