import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useKaraoke } from '../context/KaraokeContext';
import { parseBlob } from 'music-metadata-browser';

const { FiFolder, FiPlay, FiPause, FiCheck, FiAlertCircle, FiRefreshCw } = FiIcons;

function FileIndexer() {
  const { state, actions } = useKaraoke();
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [indexingProgress, setIndexingProgress] = useState(0);
  const [indexedCount, setIndexedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const folderInputRef = useRef(null);

  const handleFolderSelect = async (event) => {
    const files = Array.from(event.target.files);
    const mp3Files = files.filter(file => file.name.toLowerCase().endsWith('.mp3'));
    
    if (mp3Files.length === 0) {
      alert('Nessun file MP3 trovato nella cartella selezionata');
      return;
    }

    setSelectedFolder({
      name: 'Cartella Karaoke',
      fileCount: mp3Files.length,
      files: mp3Files
    });
  };

  const extractMetadata = async (file) => {
    try {
      const metadata = await parseBlob(file);
      const common = metadata.common;
      
      return {
        id: `${file.name}_${file.lastModified}`,
        filename: file.name,
        title: common.title || file.name.replace('.mp3', ''),
        artist: common.artist || 'Artista Sconosciuto',
        album: common.album || '',
        year: common.year || '',
        genre: common.genre ? common.genre[0] : '',
        duration: Math.round(metadata.format.duration || 0),
        size: file.size,
        path: file.webkitRelativePath || file.name,
        lastModified: new Date(file.lastModified).toISOString()
      };
    } catch (error) {
      console.warn('Error parsing metadata for:', file.name, error);
      return {
        id: `${file.name}_${file.lastModified}`,
        filename: file.name,
        title: file.name.replace('.mp3', ''),
        artist: 'Artista Sconosciuto',
        album: '',
        year: '',
        genre: '',
        duration: 0,
        size: file.size,
        path: file.webkitRelativePath || file.name,
        lastModified: new Date(file.lastModified).toISOString()
      };
    }
  };

  const startIndexing = async () => {
    if (!selectedFolder) return;

    actions.setIndexing(true);
    setIndexingProgress(0);
    setIndexedCount(0);
    setTotalFiles(selectedFolder.files.length);

    const songs = [];
    
    for (let i = 0; i < selectedFolder.files.length; i++) {
      const file = selectedFolder.files[i];
      setCurrentFile(file.name);
      
      try {
        const metadata = await extractMetadata(file);
        songs.push(metadata);
        
        setIndexedCount(i + 1);
        setIndexingProgress(((i + 1) / selectedFolder.files.length) * 100);
        
        // Piccolo delay per mostrare il progresso
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error('Error processing file:', file.name, error);
      }
    }

    actions.setSongs(songs);
    actions.setIndexing(false);
    setCurrentFile('');
  };

  const clearLibrary = () => {
    if (confirm('Sei sicuro di voler cancellare tutta la libreria?')) {
      actions.setSongs([]);
      setSelectedFolder(null);
      setIndexingProgress(0);
      setIndexedCount(0);
      setTotalFiles(0);
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selezione Cartella */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <SafeIcon icon={FiFolder} className="mr-2" />
            Selezione Cartella
          </h3>
          
          <div className="space-y-4">
            <div>
              <input
                ref={folderInputRef}
                type="file"
                webkitdirectory=""
                multiple
                accept=".mp3"
                onChange={handleFolderSelect}
                className="hidden"
                id="folder-input"
              />
              <label
                htmlFor="folder-input"
                className="block w-full p-4 border-2 border-dashed border-gray-400 rounded-lg text-center cursor-pointer hover:border-karaoke-purple transition-colors"
              >
                <SafeIcon icon={FiFolder} className="text-3xl text-gray-400 mx-auto mb-2" />
                <span className="text-gray-300">Seleziona cartella karaoke</span>
              </label>
            </div>
            
            {selectedFolder && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/20 border border-green-500/30 rounded-lg p-4"
              >
                <div className="flex items-center text-green-400 mb-2">
                  <SafeIcon icon={FiCheck} className="mr-2" />
                  <span className="font-medium">Cartella selezionata</span>
                </div>
                <p className="text-white font-medium">{selectedFolder.name}</p>
                <p className="text-gray-300">{selectedFolder.fileCount} file MP3 trovati</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Controlli Indicizzazione */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Controlli</h3>
          
          <div className="space-y-4">
            <button
              onClick={startIndexing}
              disabled={!selectedFolder || state.isIndexing}
              className="w-full bg-karaoke-purple hover:bg-karaoke-purple/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <SafeIcon icon={state.isIndexing ? FiRefreshCw : FiPlay} className={`mr-2 ${state.isIndexing ? 'animate-spin' : ''}`} />
              {state.isIndexing ? 'Indicizzazione in corso...' : 'Avvia Indicizzazione'}
            </button>
            
            <button
              onClick={clearLibrary}
              disabled={state.isIndexing}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Cancella Libreria
            </button>
            
            <div className="text-center text-gray-300">
              <p>Brani in libreria: <span className="text-karaoke-gold font-bold">{state.songs.length}</span></p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progresso Indicizzazione */}
      {state.isIndexing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Progresso Indicizzazione</h3>
          
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-karaoke-purple to-karaoke-pink"
                style={{ width: `${indexingProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            <div className="flex justify-between text-gray-300">
              <span>{indexedCount} / {totalFiles} file</span>
              <span>{Math.round(indexingProgress)}%</span>
            </div>
            
            {currentFile && (
              <div className="text-center">
                <p className="text-gray-400">Elaborando:</p>
                <p className="text-white font-medium truncate">{currentFile}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Informazioni */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
      >
        <div className="flex items-start">
          <SafeIcon icon={FiAlertCircle} className="text-blue-400 mr-3 mt-1 flex-shrink-0" />
          <div className="text-blue-200">
            <h4 className="font-medium mb-2">Informazioni Importanti</h4>
            <ul className="space-y-1 text-sm">
              <li>• Seleziona una cartella contenente file MP3 con metadati</li>
              <li>• I metadati verranno estratti automaticamente dai file</li>
              <li>• Il processo può richiedere alcuni minuti per grandi collezioni</li>
              <li>• I dati vengono salvati localmente nel browser</li>
              <li>• Supporta file MP3 con tag ID3v1, ID3v2 e altri formati</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default FileIndexer;