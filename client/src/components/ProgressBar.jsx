export default function ProgressBar({ progress, speed, label }) {
  return (
    <div className="w-full animate-fade-in-up">
      <div className="flex justify-between text-sm text-gray-400 mb-2">
        <span>{label || 'Transferring...'}</span>
        <span className="font-mono">{speed} MB/s</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-300 relative overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          {progress < 100 && <div className="absolute inset-0 shimmer-bar" />}
        </div>
      </div>
      <div className="text-right text-sm text-gray-400 mt-1 font-mono">{progress}%</div>
    </div>
  )
}