"use client"

import { CldUploadWidget } from 'next-cloudinary'
import Image from 'next/image'
import { useCallback } from 'react'
import { Upload } from 'lucide-react'  // Using lucide-react instead

interface ImageUploadProps {
  onChange: (value: string) => void
  value: string
  disabled?: boolean
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onChange,
  value,
  disabled
}) => {
  const handleUpload = useCallback((result: any) => {
    onChange(result.info.secure_url)
  }, [onChange])

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  return (
    <CldUploadWidget 
      onUpload={handleUpload} 
      uploadPreset={uploadPreset}
      options={{
        maxFiles: 1
      }}
    >
      {({ open }) => {
        return (
          <div
  onClick={() => !disabled && open?.()}
  className={`relative border-dashed border-2 p-20 flex flex-col justify-center items-center gap-4 transition
    ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-70"}
    border-neutral-300 text-neutral-600`}
>

            <Upload size={50} />  {/* Changed from TbPhotoPlus to Upload */}
            <div className="font-semibold text-lg">
              Click to upload
            </div>
            {value && (
              <div className="absolute inset-0 w-full h-full">
                <Image
                  fill 
                  style={{ objectFit: 'cover' }} 
                  src={value} 
                  alt="Uploaded" 
                />
              </div>
            )}
          </div>
        )
      }}
    </CldUploadWidget>
  )
}

export default ImageUpload
