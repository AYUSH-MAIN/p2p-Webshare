import { useRef, useState } from 'react'

export default function DropZone({ onFile, disabled }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) validateAndEmit(file)
  }

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (file) validateAndEmit(file)
  }

  const validateAndEmit = (file) => {
    if (file.size > 50 * 1024 * 1024) {
      alert('File must be under 50MB for this MVP.')
      return
    }
    onFile(file)
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
        transition-all duration-200 select-none
        ${disabled ? 'opacity-40 cursor-not-allowed border-gray-700' : 
          dragging ? 'border-violet-400 bg-violet-500/10 scale-[1.02]' : 
          'border-gray-600 hover:border-violet-500 hover:bg-violet-500/5'}
      `}
    >
      <div className="text-5xl mb-4">📂</div>
      <p className="text-gray-300 text-lg font-medium">
        {dragging ? 'Drop it!' : 'Drag & drop a file here'}
      </p>
      <p className="text-gray-500 text-sm mt-1">or click to browse · max 50MB</p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}