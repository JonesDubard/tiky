console.log('Cloudinary config:', {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  hasCloudName: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
})

'use client'

import { CldUploadWidget } from 'next-cloudinary'
import Image from 'next/image'
import { useState } from 'react'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  return (
    <div className="space-y-4">
      {value && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <Image
            fill
            className="object-cover"
            src={value}
            alt="Event image"
          />
        </div>
      )}
      
      <CldUploadWidget
        uploadPreset="tikky_events"
        options={{
          maxFiles: 1,
          sources: ['local', 'url', 'camera'],
          multiple: false,
          cropping: true,
          croppingAspectRatio: 16/9,
          showSkipCropButton: false,
        }}
        onSuccess={(result) => {
          setIsUploading(false)
          if (result.info && typeof result.info === 'object' && 'secure_url' in result.info) {
            onChange(result.info.secure_url as string)
          }
        }}
        onOpen={() => setIsUploading(true)}
        onClose={() => setIsUploading(false)}
      >
        {({ open }) => (
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={() => open()}
            className={`
              w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${disabled 
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50 text-gray-700'
              }
            `}
          >
            {isUploading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-2"></div>
                Uploading...
              </div>
            ) : (
              <>
                <div className="text-3xl mb-2">📷</div>
                <div className="font-medium">Upload Event Photo</div>
                <p className="text-sm text-gray-500 mt-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Recommended: 16:9 ratio, max 5MB
                </p>
              </>
            )}
          </button>
        )}
      </CldUploadWidget>
      
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          disabled={disabled}
          className="text-sm text-red-600 hover:text-red-800 disabled:text-gray-400"
        >
          Remove image
        </button>
      )}
    </div>
  )
}