// src/components/collaborators/components/PhotoUploadSection.tsx
import { Camera, Image, Loader2 } from 'lucide-react'

interface PhotoUploadSectionProps {
  photoPreview: string | null
  uploadingPhoto: boolean
  photoInputRef: React.RefObject<HTMLInputElement>
  setPhotoPreview: (preview: string | null) => void
  onPhotoSelected?: (file: File | null) => void
}

export function PhotoUploadSection({
  photoPreview,
  uploadingPhoto,
  photoInputRef,
  setPhotoPreview,
  onPhotoSelected
}: PhotoUploadSectionProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={() => photoInputRef.current?.click()}
        className="w-40 h-40 rounded-full bg-gray-50 border-[6px] border-white shadow-xl overflow-hidden flex items-center justify-center relative group cursor-pointer hover:border-gray-100 transition-all"
      >
        {photoPreview ? (
          <img src={photoPreview} className="w-full h-full object-cover" alt="Preview" />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-300 gap-2">
            <Image className="h-12 w-12" />
          </div>
        )}

        {uploadingPhoto && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-white h-8 w-8" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
          <Camera className="text-white h-8 w-8" />
        </div>
      </div>

      <button
        onClick={() => photoInputRef.current?.click()}
        className="text-[10px] uppercase font-black tracking-[0.2em] text-[#1e3a8a] hover:text-[#112240] transition-colors py-1 px-3 rounded-full hover:bg-blue-50"
      >
        {photoPreview ? 'Alterar Foto' : 'Adicionar Foto'}
      </button>

      <input
        type="file"
        hidden
        ref={photoInputRef}
        accept="image/*"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) {
            const r = new FileReader()
            r.onload = (ev) => setPhotoPreview(ev.target?.result as string)
            r.readAsDataURL(f)
            if (onPhotoSelected) onPhotoSelected(f)
          } else {
            if (onPhotoSelected) onPhotoSelected(null)
          }
        }}
      />
    </div>
  )
}