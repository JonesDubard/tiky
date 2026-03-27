"use client"

import { useState, useRef, useEffect } from "react"
import jsQR from "jsqr" 
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Keyboard,
  Camera,
  CameraOff,
  History as HistoryIcon,
} from "lucide-react"

type ValidationResult = {
  valid: boolean
  alreadyUsed?: boolean
  error?: string
  validatedAt?: string
  ticket?: {
    id: string
    event: string
    eventDate?: string
    location?: string
    ticketType: string
    price?: number
    holder: string
    email?: string | null
    validatedAt?: string
  }
}

export default function ValidateTicketPage() {
  const [mode, setMode] = useState<"manual" | "camera">("manual")
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [history, setHistory] = useState<ValidationResult[]>([])

  const lastScannedRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // --- AUDIO UTILITY ---
  const playTone = (frequency: number, duration: number) => {
    if (typeof window === "undefined") return
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.frequency.value = frequency
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration)

      oscillator.start()
      oscillator.stop(audioCtx.currentTime + duration)
    } catch (e) {
      console.error("Audio feedback failed", e)
    }
  }

  // --- CAMERA CONTROLS ---
  useEffect(() => {
    if (mode === "manual") {
      stopCamera()
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      startCamera()
    }
    return () => stopCamera()
  }, [mode])

  const startCamera = async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraActive(true)
        startScanning()
      }
    } catch (err: any) {
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow access."
          : "Could not access camera. Try manual entry."
      )
    }
  }

  const stopCamera = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  // --- SCANNING LOGIC ---
  const startScanning = () => {
    scanIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      // Use the jsqr import directly
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      })

      if (code?.data && code.data !== lastScannedRef.current) {
        console.log("QR Detected:", code.data)
        lastScannedRef.current = code.data
        validateTicket(code.data)
        // Reset the "lock" after 5 seconds
        setTimeout(() => { lastScannedRef.current = null }, 5000)
      }
    }, 250) // Scans 4 times per second
  }

  // --- API VALIDATION ---
  const validateTicket = async (qrCode: string) => {
    if (!qrCode.trim() || loading) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/admin/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: qrCode.trim() }),
      })

      const data = await res.json()
      setHistory((prev) => [data, ...prev].slice(0, 5))

      if (res.ok && data.valid) {
        playTone(880, 0.15)
        if (navigator.vibrate) navigator.vibrate(100)
        setResult(data)
        setScanCount((c) => c + 1)

        if (mode === "camera") {
          setTimeout(() => setResult(null), 3000)
        }
      } else {
        playTone(220, 0.2)
        setTimeout(() => playTone(180, 0.3), 200)
        if (navigator.vibrate) navigator.vibrate([100, 50, 100])
        setResult({
          valid: false,
          alreadyUsed: data.alreadyUsed,
          error: data.error || "Invalid Ticket",
          ticket: data.ticket,
        })
      }
    } catch (err) {
      playTone(110, 0.5)
      setResult({ valid: false, error: "Network error." })
    } finally {
      setLoading(false)
      setInputValue("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    validateTicket(inputValue)
  }

  // --- UI HELPERS ---
  const resultBg = result?.valid ? "bg-green-50 border-green-300" : result?.alreadyUsed ? "bg-yellow-50 border-yellow-300" : "bg-red-50 border-red-300"
  const ResultIcon = result?.valid ? CheckCircle : result?.alreadyUsed ? AlertCircle : XCircle
  const iconColor = result?.valid ? "text-green-500" : result?.alreadyUsed ? "text-yellow-500" : "text-red-500"

  return (
    <div className="max-w-lg mx-auto p-4 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ticket Validator</h1>
        <p className="text-gray-500 text-sm">Scan QR or enter ID</p>
      </div>

      {scanCount > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 flex items-center justify-between">
          <span className="text-blue-700 text-sm font-medium">Session Total</span>
          <span className="text-blue-900 font-bold text-xl">{scanCount}</span>
        </div>
      )}

      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
        <button onClick={() => setMode("manual")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === "manual" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
          <Keyboard className="w-4 h-4" /> Manual
        </button>
        <button onClick={() => setMode("camera")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === "camera" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
          <Camera className="w-4 h-4" /> Camera
        </button>
      </div>

      {mode === "manual" ? (
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input ref={inputRef} type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ticket ID..." className="flex-1 px-4 py-3 border rounded-xl font-mono text-sm" />
            <button type="submit" disabled={loading} className="px-5 py-3 bg-orange-500 text-white rounded-xl font-bold">
              {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : "Validate"}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-6 relative">
          {cameraError ? (
            <div className="p-8 text-center text-red-600">{cameraError}</div>
          ) : (
            <>
              <video ref={videoRef} className="w-full" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 border-2 border-dashed border-orange-500/50 rounded-xl relative">
                  {cameraActive && <div className="absolute inset-x-0 top-0 h-1 bg-orange-500 animate-[scan_2s_ease-in-out_infinite]" />}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {result && (
        <div className={`rounded-2xl border-2 p-6 mb-6 transition-all ${resultBg}`}>
          <div className="flex gap-4">
            <ResultIcon className={`w-8 h-8 ${iconColor}`} />
            <div className="flex-1">
              <h2 className="font-bold text-lg">{result.valid ? "Valid Ticket" : result.alreadyUsed ? "Already Used" : "Invalid"}</h2>
              {result.ticket && (
                <div className="mt-3 space-y-1 bg-white/50 p-3 rounded-lg text-sm">
                  <Row label="Holder" value={result.ticket.holder} />
                  <Row label="Type" value={result.ticket.ticketType} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4 text-gray-500 px-1">
            <HistoryIcon className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Recent Activity</span>
          </div>
          <div className="space-y-2">
            {history.map((item, i) => (
              <div key={i} className={`p-3 rounded-xl border flex justify-between items-center bg-white ${i === 0 ? "border-orange-200" : "opacity-60"}`}>
                <div className="text-sm font-medium">{item.ticket?.holder || "Unknown"}</div>
                <div className={`text-[10px] font-bold ${item.valid ? "text-green-600" : "text-red-600"}`}>
                  {item.valid ? "OK" : "FAIL"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}