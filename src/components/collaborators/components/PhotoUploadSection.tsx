// src/components/collaborators/components/PhotoUploadSection.tsx
import { Camera, Image, Loader2 } from 'lucide-react'

interface PhotoUploadSectionProps {
  photoPreview: string | null
  uploadingPhoto: boolean
  photoInputRef: React.RefObject<HTMLInputElement>
  setPhotoPreview: (preview: string | null) => void
}

export function PhotoUploadSection({
  photoPreview,
  uploadingPhoto,
  photoInputRef,
  setPhotoPreview
}: PhotoUploadSectionProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-32 h-32 rounded-full bg-white border-4 border-gray-100 shadow-md overflow-hidden flex items-center justify-center relative group">
        {photoPreview ? (
          <img src={photoPreview} className="w-full h-full object-cover" alt="Preview" />
        ) : (
          <Image className="text-gray-300 h-10 w-10" />
        )}
        {uploadingPhoto && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="animate-spin text-white" />
          </div>
        )}
        <button
          onClick={() => photoInputRef.current?.click()}
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs uppercase tracking-widest"
        >
          Alterar
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={() => photoInputRef.current?.click()}
          className="text-[10px] uppercase font-black tracking-[0.2em] text-[#1e3a8a] hover:underline"
        >
          {photoPreview ? 'Alterar Foto' : 'Adicionar Foto'}
        </button>
      </div>

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
          }
        }}
      />
    </div>
  )
}