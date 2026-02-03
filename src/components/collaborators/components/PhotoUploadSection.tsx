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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 flex items-center gap-6">
      <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative group">
        {photoPreview ? (
          <img src={photoPreview} className="w-full h-full object-cover" alt="Preview" />
        ) : (
          <Image className="text-gray-300 h-12 w-12" />
        )}
        {uploadingPhoto && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="animate-spin text-white" />
          </div>
        )}
      </div>
      
      <div>
        <button 
          onClick={() => photoInputRef.current?.click()} 
          className="px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl flex items-center gap-2 transition-all active:scale-95"
        >
          <Camera className="h-4 w-4" /> {photoPreview ? 'Alterar' : 'Adicionar'}
        </button>
        <p className="text-xs text-gray-500 mt-2 font-medium">
          JPG, PNG ou GIF. Máximo 5MB.
        </p>
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