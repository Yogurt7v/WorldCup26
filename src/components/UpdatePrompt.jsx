import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="update-toast">
      <span>Доступно обновление приложения</span>
      <button className="btn btn-primary" onClick={() => updateServiceWorker()}>
        Обновить
      </button>
    </div>
  )
}
