// components/ui/image-upload.tsx - FIXED VERSION
'use client'

import { useCallback, useState, useRef, ChangeEvent } from 'react'
import { Upload, X } from 'lucide-react'

interface ImageUploadProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function ImageUpload({
  value,
  onChange,
  disabled
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setPreview(result)
      onChange(result)
    }
    reader.readAsDataURL(file)
  }, [onChange])

  const handleRemove = useCallback(() => {
    setPreview(null)
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onChange])

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={disabled}
      />

      {/* Upload area */}
      <div
        onClick={handleClick}
        className={`relative border-dashed border-2 p-20 flex flex-col justify-center items-center gap-4 transition
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-70"}
          border-neutral-300 text-neutral-600`}
      >
        {preview ? (
          <>
            {/* Preview image */}
            <div className="relative w-full h-48">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <p className="text-sm text-neutral-500">
              Click to change or drag a new image
            </p>
          </>
        ) : (
          <>
            <Upload size={40} />
            <div className="text-center">
              <p className="font-medium">Upload an image</p>
              <p className="text-sm text-neutral-500">
                Click to browse or drag and drop
              </p>
            </div>
          </>
        )}
      </div>

      {/* Help text */}
      <p className="text-xs text-neutral-500">
        Recommended: 1200x630px, JPG, PNG or WebP. Max 5MB.
      </p>
    </div>
  )
}