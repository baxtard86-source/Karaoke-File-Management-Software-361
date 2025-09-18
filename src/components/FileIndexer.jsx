import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useKaraoke } from '../context/KaraokeContext';
import DatabaseConnector from './DatabaseConnector';

const { FiCloud, FiHardDrive, FiCheck, FiAlertCircle, FiRefreshCw } = FiIcons;

function FileIndexer() {
  const { state, actions } = useKaraoke();
  const [localFiles, setLocalFiles] = useState([]);
  const [isProcessingLocal, setIsProcessingLocal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('cloud');

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const audioFiles = files.filter(file => 
      file.type.startsWith('audio/') || 
      file.name.toLowerCase().endsWith('.mp3') ||
      file.name.toLowerCase().endsWith('.wav') ||
      file.name.toLowerCase().endsWith('.ogg')
    );
    
    if (audioFiles.length === 0) {
      alert('Seleziona almeno un file audio valido (.mp3, .wav, .ogg)');
      return;
    }

    setLocalFiles(audioFiles);
    processLocalFiles(audioFiles);
  };

  const processLocalFiles = async (files) => {
    setIsProcessingLocal(true);
    setConnectionStatus(null);

    try {
      const songs = files.map((file, index) => {
        // Estrai info dal nome del file
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Rimuovi estensione
        const parts = fileName.split(' - ');
        
        let title = fileName;
        let artist = 'Artista Sconosciuto';
        
        if (parts.length >= 2) {
          artist = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        }

        return {
          id: `local_${Date.now()}_${index}`,
          title,
          artist,
          album: '',
          year: null,
          genre: '',
          duration: 0,
          size: file.size,
          path: URL.createObjectURL(file),
          lastModified: new Date(file.lastModified).toISOString(),
          source: 'local',
          file: file
        };
      });

      // Rimuovi file locali esistenti e aggiungi i nuovi
      actions.removeSongsBySource('local');
      actions.addSongs(songs);
      
      setConnectionStatus({
        type: 'success',
        message: `Caricati ${songs.length} file locali con successo!`,
        count: songs.length
      });

    } catch (error) {
      setConnectionStatus({
        type: 'error',
        message: `Errore nel caricamento file: ${error.message}`
      });
    } finally {
      setIsProcessingLocal(false);
    }
  };

  const clearDatabase = () => {
    if (confirm('Sei sicuro di voler cancellare tutto il database?')) {
      actions.setSongs([]);
      setConnectionStatus(null);
      setLocalFiles([]);
      localStorage.removeItem('karaokeCloudUrl');
      localStorage.removeItem('karaokeLastSync');
    }
  };

  const cloudSongs = state.songs.filter(song => song.source === 'cloud').length;
  const localSongs = state.songs.filter(song => song.source === 'local').length;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-3 px-4 font-medium transition-all flex items-center justify-center ${
              activeTab === 'cloud'
                ? 'bg-karaoke-purple text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <SafeIcon icon={FiCloud} className="mr-2" />
            Database Cloud
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-3 px-4 font-medium transition-all flex items-center justify-center ${
              activeTab === 'local'
                ? 'bg-karaoke-purple text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <SafeIcon icon={FiHardDrive} className="mr-2" />
            File Locali
          </button>
        </div>
      </div>

      {/* Contenuto Tab Cloud */}
      {activeTab === 'cloud' && <DatabaseConnector />}

      {/* Contenuto Tab Local */}
      {activeTab === 'local' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload File Locali */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <SafeIcon icon={FiHardDrive} className="mr-2" />
              File Locali
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">
                  Carica File Audio
                </label>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="audio/*,.mp3,.wav,.ogg"
                    onChange={handleFileUpload}
                    disabled={isProcessingLocal}
                    className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-karaoke-purple file:text-white hover:file:bg-karaoke-purple/80"
                  />
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Formati supportati: MP3, WAV, OGG. Nome file formato: "Artista - Titolo.mp3"
                </p>
              </div>

              {connectionStatus && activeTab === 'local' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${
                    connectionStatus.type === 'success'
                      ? 'bg-green-500/20 border-green-500/30 text-green-200'
                      : 'bg-red-500/20 border-red-500/30 text-red-200'
                  }`}
                >
                  <div className="flex items-center">
                    <SafeIcon 
                      icon={connectionStatus.type === 'success' ? FiCheck : FiAlertCircle} 
                      className="mr-2" 
                    />
                    <span className="font-medium">
                      {connectionStatus.type === 'success' ? 'Caricamento Riuscito' : 'Errore di Caricamento'}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{connectionStatus.message}</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Controlli Locali */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Controlli Locali</h3>
            
            <div className="space-y-4">
              <div className="text-center text-gray-300 space-y-2">
                <p>
                  File locali: <span className="text-karaoke-gold font-bold">{localSongs}</span>
                </p>
                <p>
                  Totale database: <span className="text-karaoke-purple font-bold">{state.songs.length}</span>
                </p>
              </div>

              {localFiles.length > 0 && (
                <div className="bg-white/5 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <h4 className="text-white font-medium mb-2">File caricati:</h4>
                  {localFiles.map((file, index) => (
                    <div key={index} className="text-gray-300 text-sm truncate">
                      {file.name}
                    </div>
                  ))}
                </div>
              )}

              {isProcessingLocal && (
                <div className="text-center">
                  <SafeIcon icon={FiRefreshCw} className="animate-spin text-karaoke-purple text-2xl mx-auto mb-2" />
                  <p className="text-gray-300">Elaborazione file in corso...</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Controlli Generali */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Database Generale</h3>
            <p className="text-gray-300">
              Totale: {state.songs.length} brani ({cloudSongs} cloud + {localSongs} locali)
            </p>
          </div>
          <button
            onClick={clearDatabase}
            disabled={isProcessingLocal}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Cancella Tutto
          </button>
        </div>
      </div>

      {/* Stato Connessione */}
      {state.songs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2 flex items-center">
                <SafeIcon icon={FiCheck} className="mr-2 text-green-400" />
                Database Attivo
              </h3>
              <p className="text-gray-300">
                {state.songs.length} canzoni disponibili nel sistema
              </p>
              <div className="flex items-center space-x-4 mt-2">
                {cloudSongs > 0 && (
                  <span className="text-blue-400 text-sm flex items-center">
                    <SafeIcon icon={FiCloud} className="mr-1" />
                    {cloudSongs} Cloud
                  </span>
                )}
                {localSongs > 0 && (
                  <span className="text-green-400 text-sm flex items-center">
                    <SafeIcon icon={FiHardDrive} className="mr-1" />
                    {localSongs} Locali
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-green-400 font-medium text-lg">ONLINE</div>
              <div className="text-gray-300 text-sm">
                Sistema ibrido attivo
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default FileIndexer;