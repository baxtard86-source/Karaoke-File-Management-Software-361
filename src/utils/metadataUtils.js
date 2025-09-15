// Utility per formattazione durata
export const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '--:--';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Utility per validazione file MP3
export const isValidMP3File = (file) => {
  const validTypes = ['audio/mpeg', 'audio/mp3'];
  const validExtensions = ['.mp3'];
  
  return validTypes.includes(file.type) || 
         validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
};

// Utility per pulizia metadati
export const cleanMetadata = (metadata) => {
  return {
    ...metadata,
    title: metadata.title?.trim() || '',
    artist: metadata.artist?.trim() || '',
    album: metadata.album?.trim() || '',
    genre: typeof metadata.genre === 'string' ? metadata.genre.trim() : 
           Array.isArray(metadata.genre) ? metadata.genre[0]?.trim() || '' : '',
    year: metadata.year ? parseInt(metadata.year) : null
  };
};