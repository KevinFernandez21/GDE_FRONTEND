"use client"

import { useState, useEffect } from 'react'

interface DeviceIPResult {
  deviceIP: string | null
  isLoading: boolean
  error: string | null
  isProduction: boolean
}

export function useDeviceIP(): DeviceIPResult {
  const [deviceIP, setDeviceIP] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProduction, setIsProduction] = useState(false)

  useEffect(() => {
    const detectIP = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check if we're in production (Vercel or any non-localhost)
        const isProd = process.env.NODE_ENV === 'production' || 
                      (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
        setIsProduction(isProd)

        if (isProd) {
          // In production, use the full deployment URL host
          setDeviceIP(window.location.host)
          setIsLoading(false)
          return
        }

        // In development, try to get local IP via ipconfig output exposed by a tiny helper
        // Fallback to WebRTC if helper not available
        try {
          // Try PowerShell ipconfig through a dev-only endpoint (optional)
          const devHelperUrl = (process.env.NEXT_PUBLIC_DEV_IP_HELPER || '').trim()
          if (devHelperUrl) {
            try {
              const res = await fetch(devHelperUrl, { signal: AbortSignal.timeout(1200) })
              if (res.ok) {
                const text = await res.text()
                const ipMatch = text.match(/IPv4 Address[\. ]*: *([0-9]{1,3}(\.[0-9]{1,3}){3})/i)
                if (ipMatch) {
                  setDeviceIP(ipMatch[1])
                  setIsLoading(false)
                  return
                }
              }
            } catch (_) {}
          }

          // Fallback: get IP from WebRTC candidates
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
              if (ipMatch) {
                const ip = ipMatch[1]
                // Prefer typical LAN ranges 192.168.x.x / 10.x.x.x / 172.16-31.x.x
                const isLan = ip.startsWith('192.168.') || ip.startsWith('10.') || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
                if (isLan) {
                  setDeviceIP(ip)
                  setIsLoading(false)
                  pc.close()
                }
              }
            }
          }

          // Fallback timeout
          setTimeout(() => {
            if (isLoading) {
              // Last resort: show localhost
              setDeviceIP('localhost:3000')
              setIsLoading(false)
            }
            pc.close()
          }, 3000)

        } catch (webrtcError) {
          console.log('WebRTC method failed, using localhost')
          setDeviceIP('localhost')
          setIsLoading(false)
        }

      } catch (err) {
        console.error('Error detecting device IP:', err)
        setError('No se pudo detectar la IP del dispositivo')
        setDeviceIP('localhost')
        setIsLoading(false)
      }
    }

    detectIP()
  }, [])

  return {
    deviceIP,
    isLoading,
    error,
    isProduction
  }
}
