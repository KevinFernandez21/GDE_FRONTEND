import { useState, useEffect } from 'react'

interface DeviceIPHook {
  deviceIP: string | null
  isLoading: boolean
  error: string | null
  isProduction: boolean
}

export function useDeviceIP(): DeviceIPHook {
  const [deviceIP, setDeviceIP] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProduction, setIsProduction] = useState(false)
  
  // IP configurada en las variables de entorno
  const configuredIP = process.env.NEXT_PUBLIC_DEVICE_IP

  useEffect(() => {
    const detectDeviceIP = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Detectar si estamos en producción
        const isProd = window.location.hostname.includes('vercel.app') || 
                       window.location.hostname.includes('netlify.app') ||
                       process.env.NODE_ENV === 'production'
        
        setIsProduction(isProd)

        if (isProd) {
          // En producción, no necesitamos detectar IP
          setDeviceIP(null)
          setIsLoading(false)
          return
        }

        // Try to get IP from WebRTC
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        })

        pc.createDataChannel('')
        
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate
            const ipMatch = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/)
            if (ipMatch && ipMatch[1] && !ipMatch[1].startsWith('127.')) {
              setDeviceIP(ipMatch[1])
              pc.close()
            }
          }
        }

        // Fallback: try to get IP from a simple request or use configured IP
        setTimeout(async () => {
          if (!deviceIP) {
            try {
              // First try to use configured IP
              if (configuredIP) {
                setDeviceIP(configuredIP)
                setIsLoading(false)
                return
              }
              
              // This is a fallback method - in a real app you might want to use
              // a service that returns the client's IP
              const response = await fetch('https://api.ipify.org?format=json')
              const data = await response.json()
              setDeviceIP(data.ip)
            } catch (fallbackError) {
              console.warn('Could not detect device IP:', fallbackError)
              // Use configured IP as final fallback
              if (configuredIP) {
                setDeviceIP(configuredIP)
              } else {
                setError('No se pudo detectar la IP del dispositivo')
              }
            }
          }
          setIsLoading(false)
        }, 3000)

      } catch (err) {
        console.error('Error detecting device IP:', err)
        setError('Error al detectar la IP del dispositivo')
        setIsLoading(false)
      }
    }

    detectDeviceIP()
  }, [])

  return { deviceIP, isLoading, error, isProduction }
}
