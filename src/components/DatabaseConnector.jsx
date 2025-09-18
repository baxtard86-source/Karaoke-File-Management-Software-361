import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { fetchManager, EXAMPLE_URLS, DATA_TEMPLATES } from '../utils/fetchUtils';
import { useKaraoke } from '../context/KaraokeContext';

const { FiCloud, FiDatabase, FiCheck, FiAlertCircle, FiRefreshCw, FiLink, FiHelpCircle, FiExternalLink, FiCopy, FiEye } = FiIcons;

function DatabaseConnector() {
  const { state, actions } = useKaraoke();
  const [cloudUrl, setCloudUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [showExamples, setShowExamples] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [urlValidation, setUrlValidation] = useState(null);
  const [testingUrl, setTestingUrl] = useState(false);

  // Valida URL mentre l'utente digita
  useEffect(() => {
    if (!cloudUrl.trim()) {
      setUrlValidation(null);
      return;
    }

    const validation = fetchManager.validateURL(cloudUrl);
    setUrlValidation(validation);
  }, [cloudUrl]);

  // Carica URL salvato all'avvio
  useEffect(() => {
    const savedUrl = localStorage.getItem('karaokeCloudUrl');
    const savedSync = localStorage.getItem('karaokeLastSync');
    
    if (savedUrl) {
      setCloudUrl(savedUrl);
    }
    if (savedSync) {
      setLastSync(savedSync);
    }
  }, []);

  const testConnection = async () => {
    if (!cloudUrl.trim()) {
      alert('Inserisci un URL per testare la connessione');
      return;
    }

    const validation = fetchManager.validateURL(cloudUrl);
    if (!validation.valid) {
      setConnectionStatus({
        type: 'error',
        message: `URL non valido: ${validation.error}`
      });
      return;
    }

    setTestingUrl(true);
    setConnectionStatus(null);

    try {
      const response = await fetchManager.fetchWithRetry(cloudUrl);
      const contentType = response.headers.get('content-type');
      
      setConnectionStatus({
        type: 'success',
        message: `Connessione riuscita! Content-Type: ${contentType}`,
        details: {
          status: response.status,
          contentType,
          size: response.headers.get('content-length') || 'Sconosciuto'
        }
      });

    } catch (error) {
      const suggestions = fetchManager.getSuggestions(error.message, cloudUrl);
      setConnectionStatus({
        type: 'error',
        message: error.message,
        suggestions
      });
    } finally {
      setTestingUrl(false);
    }
  };

  const fetchSongsFromCloud = async (url) => {
    try {
      const data = await fetchManager.fetchJSON(url);
      
      // Normalizza i dati delle canzoni
      let songs = [];
      
      if (Array.isArray(data)) {
        songs = data;
      } else if (data.songs && Array.isArray(data.songs)) {
        songs = data.songs;
      } else if (data.data && Array.isArray(data.data)) {
        songs = data.data;
      } else if (data.results && Array.isArray(data.results)) {
        songs = data.results;
      } else {
        throw new Error('Formato dati non riconosciuto. Atteso array di canzoni o oggetto con proprietà songs/data/results.');
      }

      // Valida e normalizza ogni canzone
      const normalizedSongs = songs.map((song, index) => {
        if (!song || typeof song !== 'object') {
          throw new Error(`Canzone ${index + 1}: formato non valido`);
        }

        // Gestisci diversi formati di campo
        const title = song.title || song.name || song.song_name || song.track || `Titolo Sconosciuto ${index + 1}`;
        const artist = song.artist || song.performer || song.artist_name || song.singer || 'Artista Sconosciuto';

        return {
          id: song.id || song._id || song.song_id || `cloud_${Date.now()}_${index}`,
          title: String(title).trim(),
          artist: String(artist).trim(),
          album: song.album || song.album_name || '',
          year: song.year ? parseInt(song.year) : null,
          genre: song.genre || song.category || '',
          duration: song.duration ? parseInt(song.duration) : 0,
          size: song.size ? parseInt(song.size) : 0,
          path: song.path || song.url || song.file_path || '',
          lastModified: song.lastModified || song.updated_at || song.created_at || new Date().toISOString(),
          source: 'cloud'
        };
      });

      return normalizedSongs;

    } catch (error) {
      console.error('Errore nel caricamento cloud:', error);
      throw error;
    }
  };

  const connectToCloud = async () => {
    if (!cloudUrl.trim()) {
      alert('Inserisci un URL valido per il database cloud');
      return;
    }

    const validation = fetchManager.validateURL(cloudUrl);
    if (!validation.valid) {
      setConnectionStatus({
        type: 'error',
        message: `URL non valido: ${validation.error}`
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus(null);

    try {
      const songs = await fetchSongsFromCloud(cloudUrl);
      
      if (songs.length === 0) {
        throw new Error('Nessuna canzone trovata nel database cloud');
      }

      // Rimuovi canzoni cloud esistenti e aggiungi le nuove
      actions.removeSongsBySource('cloud');
      actions.addSongs(songs);
      
      setConnectionStatus({
        type: 'success',
        message: `Connesso con successo! Caricate ${songs.length} canzoni.`,
        count: songs.length,
        urlType: validation.type
      });
      setLastSync(new Date().toISOString());
      
      // Salva URL per riconnessioni future
      localStorage.setItem('karaokeCloudUrl', cloudUrl);
      localStorage.setItem('karaokeLastSync', new Date().toISOString());

    } catch (error) {
      const suggestions = fetchManager.getSuggestions(error.message, cloudUrl);
      setConnectionStatus({
        type: 'error',
        message: error.message,
        suggestions
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const syncFromCloud = async () => {
    const savedUrl = localStorage.getItem('karaokeCloudUrl');
    if (savedUrl) {
      setCloudUrl(savedUrl);
      await connectToCloud();
    } else {
      alert('Nessun URL cloud salvato. Inserisci un nuovo indirizzo.');
    }
  };

  const copyExample = (url) => {
    setCloudUrl(url);
    navigator.clipboard?.writeText(url);
  };

  const copyTemplate = (template) => {
    const templateStr = JSON.stringify(template, null, 2);
    navigator.clipboard?.writeText(templateStr);
  };

  const cloudSongs = state.songs.filter(song => song.source === 'cloud').length;

  return (
    <div className="space-y-6">
      {/* Configurazione Database Cloud */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-xl p-6 border border-white/10"
      >
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <SafeIcon icon={FiCloud} className="mr-2" />
          Database Cloud
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">
              Indirizzo Database Cloud
            </label>
            <div className="relative">
              <SafeIcon 
                icon={FiLink} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="url"
                placeholder="https://api.example.com/karaoke/songs.json"
                value={cloudUrl}
                onChange={(e) => setCloudUrl(e.target.value)}
                className={`w-full pl-10 pr-12 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                  urlValidation?.valid === false
                    ? 'border-red-500/50 focus:border-red-500'
                    : urlValidation?.valid === true
                    ? 'border-green-500/50 focus:border-green-500'
                    : 'border-white/20 focus:border-karaoke-purple'
                }`}
              />
              {urlValidation && (
                <SafeIcon 
                  icon={urlValidation.valid ? FiCheck : FiAlertCircle} 
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    urlValidation.valid ? 'text-green-400' : 'text-red-400'
                  }`}
                />
              )}
            </div>
            
            {/* Validazione URL */}
            {urlValidation && !urlValidation.valid && (
              <p className="text-red-400 text-sm mt-1">
                {urlValidation.error}
              </p>
            )}
            {urlValidation && urlValidation.valid && (
              <p className="text-green-400 text-sm mt-1">
                URL valido - Tipo: {urlValidation.type}
              </p>
            )}

            <div className="flex items-center space-x-2 mt-2">
              <button
                onClick={() => setShowExamples(!showExamples)}
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
              >
                <SafeIcon icon={FiExternalLink} className="mr-1 text-xs" />
                Esempi URL
              </button>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-purple-400 hover:text-purple-300 text-sm flex items-center"
              >
                <SafeIcon icon={FiEye} className="mr-1 text-xs" />
                Formati Dati
              </button>
            </div>
          </div>

          {/* Esempi URL */}
          {showExamples && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
            >
              <h4 className="text-blue-200 font-medium mb-3">Esempi di URL supportati:</h4>
              <div className="space-y-2">
                {Object.entries(EXAMPLE_URLS).map(([type, url]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300 font-mono text-xs truncate flex-1 mr-2">
                      {url}
                    </span>
                    <button
                      onClick={() => copyExample(url)}
                      className="text-blue-400 hover:text-blue-300 flex items-center"
                    >
                      <SafeIcon icon={FiCopy} className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Template Dati */}
          {showTemplates && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4"
            >
              <h4 className="text-purple-200 font-medium mb-3">Formati dati supportati:</h4>
              <div className="space-y-3">
                {Object.entries(DATA_TEMPLATES).map(([type, template]) => (
                  <div key={type} className="bg-white/5 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-200 font-medium text-sm">{template.description}</span>
                      <button
                        onClick={() => copyTemplate(template.example)}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <SafeIcon icon={FiCopy} className="text-xs" />
                      </button>
                    </div>
                    <pre className="text-gray-300 text-xs overflow-x-auto">
                      {JSON.stringify(template.example, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Status Connessione */}
          {connectionStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${
                connectionStatus.type === 'success'
                  ? 'bg-green-500/20 border-green-500/30 text-green-200'
                  : 'bg-red-500/20 border-red-500/30 text-red-200'
              }`}
            >
              <div className="flex items-center mb-2">
                <SafeIcon 
                  icon={connectionStatus.type === 'success' ? FiCheck : FiAlertCircle} 
                  className="mr-2" 
                />
                <span className="font-medium">
                  {connectionStatus.type === 'success' ? 'Connessione Riuscita' : 'Errore di Connessione'}
                </span>
              </div>
              <p className="text-sm">{connectionStatus.message}</p>
              
              {connectionStatus.count && (
                <p className="text-sm mt-1 font-medium">
                  {connectionStatus.count} canzoni caricate - Tipo: {connectionStatus.urlType}
                </p>
              )}

              {connectionStatus.suggestions && (
                <div className="mt-3 p-3 bg-white/10 rounded">
                  <h5 className="font-medium mb-2">💡 Suggerimenti per risolvere:</h5>
                  <ul className="text-sm space-y-1">
                    {connectionStatus.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Controlli */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 rounded-xl p-6 border border-white/10"
      >
        <h3 className="text-xl font-semibold text-white mb-4">Controlli Database</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={testConnection}
            disabled={!cloudUrl.trim() || testingUrl}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <SafeIcon 
              icon={testingUrl ? FiRefreshCw : FiHelpCircle} 
              className={`mr-2 ${testingUrl ? 'animate-spin' : ''}`} 
            />
            {testingUrl ? 'Test in corso...' : 'Test Connessione'}
          </button>

          <button
            onClick={connectToCloud}
            disabled={!cloudUrl.trim() || isConnecting || !urlValidation?.valid}
            className="bg-karaoke-purple hover:bg-karaoke-purple/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <SafeIcon 
              icon={isConnecting ? FiRefreshCw : FiDatabase} 
              className={`mr-2 ${isConnecting ? 'animate-spin' : ''}`} 
            />
            {isConnecting ? 'Connessione...' : 'Carica Database'}
          </button>

          <button
            onClick={syncFromCloud}
            disabled={isConnecting || !lastSync}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <SafeIcon icon={FiRefreshCw} className="mr-2" />
            Sincronizza
          </button>
        </div>

        <div className="mt-6 text-center text-gray-300 space-y-2">
          <p>
            Canzoni cloud: <span className="text-karaoke-gold font-bold">{cloudSongs}</span>
          </p>
          {lastSync && (
            <p className="text-sm">
              Ultimo sync: <span className="text-karaoke-purple">
                {new Date(lastSync).toLocaleString()}
              </span>
            </p>
          )}
        </div>
      </motion.div>

      {/* Guida Rapida */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
      >
        <div className="flex items-start">
          <SafeIcon icon={FiHelpCircle} className="text-blue-400 mr-3 mt-1 flex-shrink-0" />
          <div className="text-blue-200">
            <h4 className="font-medium mb-2">Guida Rapida Database Cloud</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h5 className="font-medium text-blue-100 mb-2">🌐 Servizi Consigliati:</h5>
                <ul className="space-y-1 ml-4">
                  <li>• <strong>GitHub Raw:</strong> Gratuito, veloce, affidabile</li>
                  <li>• <strong>JSONBin:</strong> API dedicata per JSON</li>
                  <li>• <strong>Supabase:</strong> Database completo</li>
                  <li>• <strong>Firebase:</strong> Realtime database</li>
                </ul>
              </div>
              
              <div>
                <h5 className="font-medium text-blue-100 mb-2">⚠️ Problemi Comuni:</h5>
                <ul className="space-y-1 ml-4">
                  <li>• <strong>CORS:</strong> Usa servizi che supportano CORS</li>
                  <li>• <strong>Timeout:</strong> Verifica velocità connessione</li>
                  <li>• <strong>404:</strong> Controlla URL e file esistente</li>
                  <li>• <strong>JSON:</strong> Valida formato con JSONLint</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-600/20 rounded-lg">
              <h5 className="font-medium text-blue-100 mb-1">🚀 Suggerimento Pro:</h5>
              <p className="text-sm">
                Per la massima compatibilità, usa GitHub Raw: carica il file JSON su GitHub 
                e usa l'URL "Raw" che ottieni cliccando sul pulsante Raw nella visualizzazione del file.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default DatabaseConnector;