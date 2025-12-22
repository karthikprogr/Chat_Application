import { useState, useRef } from 'react'
import { HiPhotograph, HiX } from 'react-icons/hi'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase/config'
import { toast } from 'react-toastify'

const ImageUpload = ({ onImageSelect, onCancel }) => {
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)

    // Upload to Firebase Storage
    uploadImage(file)
  }

  const uploadImage = async (file) => {
    try {
      setUploading(true)
      const timestamp = Date.now()
      const storageRef = ref(storage, `chat-images/${timestamp}_${file.name}`)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(progress)
        },
        (error) => {
          console.error('Upload error:', error)
          toast.error('Failed to upload image')
          setUploading(false)
          setPreview(null)
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          setUploading(false)
          onImageSelect(downloadURL)
          toast.success('Image uploaded!')
        }
      )
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setPreview(null)
    setUploadProgress(0)
    setUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (onCancel) onCancel()
  }

  return (
    <div className="relative">
      {preview ? (
        <div className="p-4 bg-gray-50 rounded-lg border-2 border-blue-500">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 rounded-lg mx-auto"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-white font-semibold mb-2">
                    Uploading... {Math.round(uploadProgress)}%
                  </div>
                  <div className="w-48 h-2 bg-gray-300 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            {!uploading && (
              <button
                onClick={handleCancel}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <HiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Upload Image"
        >
          <HiPhotograph className="w-5 h-5" />
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

export default ImageUpload
