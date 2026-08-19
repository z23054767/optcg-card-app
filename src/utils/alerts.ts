import { readonly, reactive } from 'vue'

type AlertVariant = 'success' | 'error' | 'warning' | 'confirm'
type AlertPresentation = 'dialog' | 'sheet'
type AlertTone = 'default' | 'danger'
type ToastVariant = 'success' | 'error' | 'warning' | 'info'

type AlertDialogResult = {
  isConfirmed: boolean
  isDismissed: boolean
}

type AlertOptions = {
  title?: string
  confirmButtonText?: string
  cancelButtonText?: string
  showCancelButton?: boolean
  autoCloseMs?: number | null
  presentation?: AlertPresentation
  tone?: AlertTone
}

type ConfirmAlertOptions = {
  title?: string
  confirmButtonText?: string
  cancelButtonText?: string
  presentation?: AlertPresentation
  tone?: AlertTone
}

type ToastOptions = {
  variant?: ToastVariant
  durationMs?: number
  title?: string
}

type InternalAlertRequest = {
  id: number
  variant: AlertVariant
  tone: AlertTone
  presentation: AlertPresentation
  title: string
  text: string
  confirmButtonText: string
  cancelButtonText: string
  showCancelButton: boolean
  autoCloseMs: number | null
  resolve: (result: AlertDialogResult) => void
}

type PublicAlertRequest = Omit<InternalAlertRequest, 'resolve'>

type AppToast = {
  id: number
  title: string | null
  text: string
  variant: ToastVariant
}

const alertState = reactive<{
  current: PublicAlertRequest | null
  toasts: AppToast[]
}>({
  current: null,
  toasts: [],
})

const alertQueue: InternalAlertRequest[] = []
const toastTimers = new Map<number, ReturnType<typeof setTimeout>>()
let nextAlertId = 1
let nextToastId = 1

function defaultDismissResult(alert?: PublicAlertRequest | null): AlertDialogResult {
  if (alert?.autoCloseMs) {
    return {
      isConfirmed: true,
      isDismissed: false,
    }
  }

  return {
    isConfirmed: false,
    isDismissed: true,
  }
}

function syncCurrentAlert(): void {
  const nextAlert = alertQueue[0]

  if (!nextAlert) {
    alertState.current = null
    return
  }

  const { resolve: _resolve, ...publicAlert } = nextAlert
  alertState.current = publicAlert
}

function enqueueAlert(input: {
  variant: AlertVariant
  title: string
  text: string
  confirmButtonText?: string
  cancelButtonText?: string
  showCancelButton?: boolean
  autoCloseMs?: number | null
  presentation?: AlertPresentation
  tone?: AlertTone
}): Promise<AlertDialogResult> {
  return new Promise((resolve) => {
    alertQueue.push({
      id: nextAlertId++,
      variant: input.variant,
      tone: input.tone ?? 'default',
      presentation: input.presentation ?? 'dialog',
      title: input.title,
      text: input.text,
      confirmButtonText: input.confirmButtonText ?? '知道了',
      cancelButtonText: input.cancelButtonText ?? '取消',
      showCancelButton: input.showCancelButton ?? false,
      autoCloseMs: input.autoCloseMs ?? null,
      resolve,
    })

    if (!alertState.current) {
      syncCurrentAlert()
    }
  })
}

function resolveActiveAlert(result?: AlertDialogResult): void {
  const activeAlert = alertQueue.shift()

  if (!activeAlert) {
    alertState.current = null
    return
  }

  activeAlert.resolve(result ?? defaultDismissResult(activeAlert))
  syncCurrentAlert()
}

function showToast(text: string, options: ToastOptions = {}): number {
  const toastId = nextToastId++
  const durationMs = options.durationMs ?? 2800

  alertState.toasts = [
    ...alertState.toasts,
    {
      id: toastId,
      title: options.title ?? null,
      text,
      variant: options.variant ?? 'success',
    },
  ]

  const timer = setTimeout(() => {
    dismissToast(toastId)
  }, durationMs)

  toastTimers.set(toastId, timer)
  return toastId
}

function dismissToast(toastId: number): void {
  const timer = toastTimers.get(toastId)

  if (timer) {
    clearTimeout(timer)
    toastTimers.delete(toastId)
  }

  alertState.toasts = alertState.toasts.filter((toast) => toast.id !== toastId)
}

const showErrorAlert = (text: string, options: AlertOptions = {}): Promise<void> => {
  return enqueueAlert({
    variant: 'error',
    title: options.title ?? '發生錯誤',
    text,
    confirmButtonText: options.confirmButtonText ?? '我知道了',
    autoCloseMs: options.autoCloseMs ?? null,
    presentation: options.presentation ?? 'dialog',
    tone: options.tone ?? 'danger',
  }).then(() => undefined)
}

const showSuccessAlert = (text: string, options: AlertOptions = {}): Promise<void> => {
  return enqueueAlert({
    variant: 'success',
    title: options.title ?? '操作完成',
    text,
    confirmButtonText: options.confirmButtonText ?? '關閉',
    autoCloseMs: options.autoCloseMs ?? 1500,
    presentation: options.presentation ?? 'dialog',
    tone: options.tone ?? 'default',
  }).then(() => undefined)
}

const showWarningAlert = (text: string, options: AlertOptions = {}): Promise<void> => {
  return enqueueAlert({
    variant: 'warning',
    title: options.title ?? '提醒',
    text,
    confirmButtonText: options.confirmButtonText ?? '知道了',
    autoCloseMs: options.autoCloseMs ?? null,
    presentation: options.presentation ?? 'dialog',
    tone: options.tone ?? 'default',
  }).then(() => undefined)
}

const showConfirmAlert = (
  text: string,
  options: ConfirmAlertOptions = {},
): Promise<AlertDialogResult> => {
  return enqueueAlert({
    variant: 'confirm',
    title: options.title ?? '確認操作',
    text,
    confirmButtonText: options.confirmButtonText ?? '確定',
    cancelButtonText: options.cancelButtonText ?? '取消',
    showCancelButton: true,
    presentation: options.presentation ?? 'sheet',
    tone: options.tone ?? 'default',
  })
}

const showDangerConfirmAlert = (
  text: string,
  options: Omit<ConfirmAlertOptions, 'tone'> = {},
): Promise<AlertDialogResult> => {
  return showConfirmAlert(text, {
    ...options,
    tone: 'danger',
    presentation: options.presentation ?? 'sheet',
  })
}

function dismissActiveAlert(result?: AlertDialogResult): void {
  resolveActiveAlert(result)
}

function useAlertState() {
  return readonly(alertState)
}

export {
  dismissActiveAlert,
  dismissToast,
  showConfirmAlert,
  showDangerConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
  showToast,
  showWarningAlert,
  useAlertState,
}

export type {
  AlertDialogResult,
  AlertPresentation,
  AlertTone,
  AlertVariant,
  AppToast,
  ConfirmAlertOptions,
  PublicAlertRequest,
  ToastOptions,
  ToastVariant,
}
