// // app/admin/tickets/validate/page.tsx
// "use client"

// import { useState, useRef, useEffect } from "react"
// import { CheckCircle, XCircle, AlertCircle, QrCode, RefreshCw, Keyboard } from "lucide-react"

// type ValidationResult = {
//   valid: boolean
//   alreadyUsed?: boolean
//   error?: string
//   validatedAt?: string
//   ticket?: {
//     id: string
//     event: string
//     eventDate?: string
//     location?: string
//     ticketType: string
//     price?: number
//     holder: string
//     email?: string | null
//     validatedAt?: string
//   }
// }

// export default function ValidateTicketPage() {
//   const [mode, setMode] = useState<"manual" | "camera">("manual")
//   const [inputValue, setInputValue] = useState("")
//   const [loading, setLoading] = useState(false)
//   const [result, setResult] = useState<ValidationResult | null>(null)
//   const [scanCount, setScanCount] = useState(0)
//   const inputRef = useRef<HTMLInputElement>(null)

//   // Auto-focus input on mount and after each scan
//   useEffect(() => {
//     if (mode === "manual") {
//       inputRef.current?.focus()
//     }
//   }, [mode, result])

//   const validateTicket = async (qrCode: string) => {
//     if (!qrCode.trim()) return
//     setLoading(true)
//     setResult(null)

//     try {
//       const res = await fetch("/api/admin/tickets/validate", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ qrCode: qrCode.trim() }),
//       })

//       const data = await res.json()
//       setResult(data)
//       setScanCount(c => c + 1)
//     } catch (err) {
//       setResult({ valid: false, error: "Network error. Please try again." })
//     } finally {
//       setLoading(false)
//       setInputValue("")
//       // Re-focus for next scan
//       setTimeout(() => inputRef.current?.focus(), 100)
//     }
//   }

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     validateTicket(inputValue)
//   }

//   const handleReset = () => {
//     setResult(null)
//     setInputValue("")
//     inputRef.current?.focus()
//   }

//   const resultBg = result
//     ? result.valid
//       ? "bg-green-50 border-green-200"
//       : result.alreadyUsed
//       ? "bg-yellow-50 border-yellow-200"
//       : "bg-red-50 border-red-200"
//     : ""

//   const ResultIcon = result
//     ? result.valid
//       ? CheckCircle
//       : result.alreadyUsed
//       ? AlertCircle
//       : XCircle
//     : null

//   const iconColor = result
//     ? result.valid
//       ? "text-green-500"
//       : result.alreadyUsed
//       ? "text-yellow-500"
//       : "text-red-500"
//     : ""

//   return (
//     <div className="max-w-lg mx-auto">
//       {/* Header */}
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold text-gray-900">Ticket Validator</h1>
//         <p className="text-gray-500 text-sm mt-1">
//           Scan or enter a ticket QR code to validate entry
//         </p>
//       </div>

//       {/* Scan counter */}
//       {scanCount > 0 && (
//         <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 flex items-center justify-between">
//           <span className="text-blue-700 text-sm font-medium">
//             Tickets validated this session
//           </span>
//           <span className="text-blue-900 font-bold text-lg">{scanCount}</span>
//         </div>
//       )}

//       {/* Mode toggle */}
//       <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
//         <button
//           onClick={() => setMode("manual")}
//           className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
//             mode === "manual"
//               ? "bg-white text-gray-900 shadow-sm"
//               : "text-gray-500 hover:text-gray-700"
//           }`}
//         >
//           <Keyboard className="w-4 h-4" />
//           Manual / Scanner
//         </button>
//         <button
//           onClick={() => setMode("camera")}
//           className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
//             mode === "camera"
//               ? "bg-white text-gray-900 shadow-sm"
//               : "text-gray-500 hover:text-gray-700"
//           }`}
//         >
//           <QrCode className="w-4 h-4" />
//           Camera (coming soon)
//         </button>
//       </div>

//       {/* Input form */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
//         <form onSubmit={handleSubmit}>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             QR Code / Ticket ID
//           </label>
//           <div className="flex gap-3">
//             <input
//               ref={inputRef}
//               type="text"
//               value={inputValue}
//               onChange={(e) => setInputValue(e.target.value)}
//               placeholder="Scan QR code or paste ticket ID..."
//               className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
//               autoComplete="off"
//               autoFocus
//             />
//             <button
//               type="submit"
//               disabled={loading || !inputValue.trim()}
//               className="px-5 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//             >
//               {loading ? (
//                 <RefreshCw className="w-4 h-4 animate-spin" />
//               ) : (
//                 "Validate"
//               )}
//             </button>
//           </div>
//           <p className="text-xs text-gray-400 mt-2">
//             💡 If using a barcode scanner, just scan — it submits automatically
//           </p>
//         </form>
//       </div>

//       {/* Result */}
//       {result && (
//         <div className={`rounded-2xl border-2 p-6 ${resultBg}`}>
//           <div className="flex items-start gap-4">
//             {ResultIcon && (
//               <ResultIcon className={`w-8 h-8 flex-shrink-0 mt-0.5 ${iconColor}`} />
//             )}
//             <div className="flex-1">
//               {result.valid ? (
//                 <>
//                   <h2 className="text-green-800 font-bold text-lg mb-1">✅ Valid Ticket</h2>
//                   <p className="text-green-700 text-sm mb-4">Entry granted — ticket marked as used</p>
//                   {result.ticket && (
//                     <div className="bg-white rounded-xl p-4 space-y-2 border border-green-100">
//                       <Row label="Event" value={result.ticket.event} />
//                       <Row label="Ticket type" value={result.ticket.ticketType} />
//                       <Row label="Holder" value={result.ticket.holder} />
//                       {result.ticket.email && (
//                         <Row label="Email" value={result.ticket.email} />
//                       )}
//                       {result.ticket.location && (
//                         <Row label="Location" value={result.ticket.location} />
//                       )}
//                       {result.ticket.validatedAt && (
//                         <Row
//                           label="Validated at"
//                           value={new Date(result.ticket.validatedAt).toLocaleTimeString()}
//                         />
//                       )}
//                       <div className="pt-2 border-t border-gray-100">
//                         <p className="text-xs text-gray-400 font-mono break-all">
//                           ID: {result.ticket.id}
//                         </p>
//                       </div>
//                     </div>
//                   )}
//                 </>
//               ) : result.alreadyUsed ? (
//                 <>
//                   <h2 className="text-yellow-800 font-bold text-lg mb-1">⚠️ Already Used</h2>
//                   <p className="text-yellow-700 text-sm mb-3">
//                     This ticket was already scanned
//                     {result.validatedAt && (
//                       <> at {new Date(result.validatedAt).toLocaleString()}</>
//                     )}
//                   </p>
//                   {result.ticket && (
//                     <div className="bg-white rounded-xl p-4 border border-yellow-100">
//                       <Row label="Event" value={result.ticket.event} />
//                       <Row label="Holder" value={result.ticket.holder} />
//                     </div>
//                   )}
//                 </>
//               ) : (
//                 <>
//                   <h2 className="text-red-800 font-bold text-lg mb-1">❌ Invalid Ticket</h2>
//                   <p className="text-red-700 text-sm">{result.error || "This ticket is not valid"}</p>
//                 </>
//               )}
//             </div>
//           </div>

//           <button
//             onClick={handleReset}
//             className="mt-4 w-full py-2 rounded-xl border border-current text-sm font-medium transition-all hover:opacity-80"
//           >
//             Scan Next Ticket
//           </button>
//         </div>
//       )}
//     </div>
//   )
// }

// function Row({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="flex justify-between items-start gap-4">
//       <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
//       <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
//     </div>
//   )
// }

// app/admin/tickets/validate/page.tsx
"use client"

import { useState, useRef, useEffect, useCallback } from "react"
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
  const lastScannedRef = useRef<string | null>(null)

  const [history, setHistory] = useState<ValidationResult[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const jsQRRef = useRef<any>(null)
  const playTone = (frequency: number, duration: number) => {
  if (typeof window === "undefined") return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    
    // Smooth volume ramp to avoid "clicking" sounds
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error("Audio feedback failed", e);
  }
};
  

  // Load jsQR from CDN
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js"
    script.onload = () => {
      jsQRRef.current = (window as any).jsQR
    }
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (mode === "manual") {
      stopCamera()
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      startCamera()
    }
  }, [mode])

  useEffect(() => {
    return () => stopCamera()
  }, [])

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
          ? "Camera permission denied. Please allow camera access and try again."
          : "Could not access camera. Try manual entry instead."
      )
    }
  }

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const startScanning = () => {
    scanIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || !jsQRRef.current) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQRRef.current(imageData.data, imageData.width, imageData.height)

      if (code?.data && code.data !== lastScannedRef.current) {
  lastScannedRef.current = code.data; // Block further scans immediately
  validateTicket(code.data);
  
  // Allow scanning the same code again after 5 seconds
  setTimeout(() => { lastScannedRef.current = null; }, 5000);
}
    }, 300)
  }

  const validateTicket = async (qrCode: string) => {
    if (!qrCode.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: qrCode.trim() }),
      });

      const data = await res.json();

      // Add to history list (Keep last 5)
      setHistory(prev => [data, ...prev].slice(0, 5));

      if (res.ok && data.valid) {
        playTone(880, 0.15); 
        if (navigator.vibrate) navigator.vibrate(100); 
        
        setResult(data);
        setScanCount((c) => c + 1);

        if (mode === "camera") {
          setTimeout(() => {
            setResult(null);
            lastScannedRef.current = null;
          }, 3000);
        }
      } else {
        playTone(220, 0.2); 
        setTimeout(() => playTone(180, 0.3), 200); 
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
        
        setResult({
          valid: false,
          alreadyUsed: data.alreadyUsed,
          error: data.error || "Invalid Ticket",
          ticket: data.ticket,
        });
      }
    } catch (err) {
      playTone(110, 0.5); 
      setResult({ valid: false, error: "Network error. Check connection." });
    } finally {
      setLoading(false);
      setInputValue("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    validateTicket(inputValue)
  }

  const handleReset = () => {
    setResult(null)
    setInputValue("")
    if (mode === "manual") inputRef.current?.focus()
  }

  const resultBg = result
    ? result.valid
      ? "bg-green-50 border-green-300"
      : result.alreadyUsed
      ? "bg-yellow-50 border-yellow-300"
      : "bg-red-50 border-red-300"
    : ""

  const ResultIcon = result
    ? result.valid
      ? CheckCircle
      : result.alreadyUsed
      ? AlertCircle
      : XCircle
    : null

  const iconColor = result
    ? result.valid
      ? "text-green-500"
      : result.alreadyUsed
      ? "text-yellow-500"
      : "text-red-500"
    : ""

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ticket Validator</h1>
        <p className="text-gray-500 text-sm mt-1">
          Scan QR code or enter ticket ID to validate entry
        </p>
      </div>

      {/* Scan counter */}
      {scanCount > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 flex items-center justify-between">
          <span className="text-blue-700 text-sm font-medium">Validated this session</span>
          <span className="text-blue-900 font-bold text-xl">{scanCount}</span>
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === "manual"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Keyboard className="w-4 h-4" />
          Manual / Scanner
        </button>
        <button
          onClick={() => setMode("camera")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === "camera"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Camera className="w-4 h-4" />
          Camera Scan
        </button>
      </div>

      {/* Manual input */}
      {mode === "manual" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QR Code value or Ticket ID
            </label>
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Paste QR code value or ticket ID..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                autoComplete="off"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="px-5 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Validate"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              💡 Works with ticket ID or the QR code UUID value
            </p>
          </form>
        </div>
      )}

      {/* Camera scanner */}
      {mode === "camera" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {cameraError ? (
            <div className="p-8 text-center">
              <CameraOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-red-600 text-sm font-medium">{cameraError}</p>
              <button
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-t-2xl"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 relative">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-lg" />
                  {/* Scan line animation */}
                  {cameraActive && (
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-orange-500 opacity-80 animate-[scan_2s_ease-in-out_infinite]" />
                  )}
                </div>
              </div>

              {loading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-t-2xl">
                  <RefreshCw className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          )}

          <div className="p-4 text-center bg-gray-50 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {cameraActive
                ? "Point camera at ticket QR code"
                : "Starting camera..."}
            </p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-2xl border-2 p-6 ${resultBg}`}>
          <div className="flex items-start gap-4">
            {ResultIcon && (
              <ResultIcon className={`w-8 h-8 flex-shrink-0 mt-0.5 ${iconColor}`} />
            )}
            <div className="flex-1">
              {result.valid ? (
                <>
                  <h2 className="text-green-800 font-bold text-lg mb-1">✅ Valid Ticket</h2>
                  <p className="text-green-700 text-sm mb-4">Entry granted — ticket marked as used</p>
                  {result.ticket && (
                    <div className="bg-white rounded-xl p-4 space-y-2 border border-green-100">
                      <Row label="Event" value={result.ticket.event} />
                      <Row label="Ticket type" value={result.ticket.ticketType} />
                      <Row label="Holder" value={result.ticket.holder} />
                      {result.ticket.email && (
                        <Row label="Email" value={result.ticket.email} />
                      )}
                      {result.ticket.location && (
                        <Row label="Location" value={result.ticket.location} />
                      )}
                      {result.ticket.validatedAt && (
                        <Row
                          label="Validated at"
                          value={new Date(result.ticket.validatedAt).toLocaleTimeString()}
                        />
                      )}
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-400 font-mono break-all">
                          ID: {result.ticket.id}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : result.alreadyUsed ? (
                <>
                  <h2 className="text-yellow-800 font-bold text-lg mb-1">⚠️ Already Used</h2>
                  <p className="text-yellow-700 text-sm mb-3">
                    This ticket was already scanned
                    {result.validatedAt && (
                      <> at {new Date(result.validatedAt).toLocaleString()}</>
                    )}
                  </p>
                  {result.ticket && (
                    <div className="bg-white rounded-xl p-4 border border-yellow-100">
                      <Row label="Event" value={result.ticket.event} />
                      <Row label="Holder" value={result.ticket.holder} />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-red-800 font-bold text-lg mb-1">❌ Invalid Ticket</h2>
                  <p className="text-red-700 text-sm">{result.error || "This ticket is not valid"}</p>
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleReset}
            className="mt-4 w-full py-2.5 rounded-xl border-2 border-current text-sm font-medium transition-all hover:opacity-70"
          >
            Scan Next Ticket
          </button>
        </div>
      )}

      {/* History */}

      {history.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4 text-gray-600 px-1">
            <HistoryIcon className="w-4 h-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Recent Scans</h3>
          </div>
          <div className="space-y-3">
            {history.map((item, idx) => (
              <div 
                key={idx} 
                className={`flex items-center justify-between p-3 rounded-xl border bg-white shadow-sm transition-all ${
                  idx === 0 ? "scale-105 border-blue-200" : "opacity-70 border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.valid ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className={`w-5 h-5 ${item.alreadyUsed ? 'text-yellow-500' : 'text-red-500'}`} />
                  )}
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-none">
                      {item.ticket?.holder || "Unknown Holder"}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase">
                      {item.ticket?.ticketType || "General Entry"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] font-bold ${item.valid ? 'text-green-600' : 'text-red-600'}`}>
                    {item.valid ? 'VALID' : item.alreadyUsed ? 'USED' : 'INVALID'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scan line CSS animation */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(224px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  )
}