import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// Safari has legacy gesture events that can bypass viewport zoom limits.
const preventPinchZoom = (event: Event) => event.preventDefault()
document.addEventListener('gesturestart', preventPinchZoom, { passive: false })
document.addEventListener('gesturechange', preventPinchZoom, { passive: false })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
