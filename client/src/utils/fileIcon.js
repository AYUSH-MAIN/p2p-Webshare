export function getFileIcon(name = '') {
  const ext = name.split('.').pop().toLowerCase()
  const map = {
    pdf: '📕', doc: '📄', docx: '📄', txt: '📄',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️',
    mp3: '🎵', wav: '🎵', flac: '🎵',
    mp4: '🎬', mov: '🎬', avi: '🎬', mkv: '🎬',
    zip: '🗜️', rar: '🗜️', '7z': '🗜️',
    js: '📜', ts: '📜', jsx: '📜', tsx: '📜', json: '📜', py: '📜', html: '📜', css: '📜',
    xls: '📊', xlsx: '📊', csv: '📊',
    ppt: '📈', pptx: '📈',
  }
  return map[ext] || '📁'
}