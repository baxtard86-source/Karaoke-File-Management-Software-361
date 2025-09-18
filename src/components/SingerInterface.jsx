import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useKaraoke } from '../context/KaraokeContext';
import { fetchManager } from '../utils/fetchUtils';
import Fuse from 'fuse.js';

const { FiSearch, FiPlus, FiMusic, FiCheck, FiHeart, FiStar, FiUser, FiMic, FiCloud, FiHardDrive, FiAlertCircle } = FiIcons;

function SingerInterface() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const { state, actions } = useKaraoke();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [addedSongs, setAddedSongs] = useState(new Set());
  const [singerName, setSingerName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [pendingSong, setPendingSong] = useState(null);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudError, setCloudError] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('all');

  // Verifica se la sessione è valida
  const isValidSession = !sessionId || (state.currentSession && state.currentSession.id === sessionId);

  // Carica database cloud se specificato nell'URL
  useEffect(() => {
    const cloudUrl = searchParams.get('cloud');
    if (cloudUrl && state.songs.length === 0) {
      loadCloudDatabase(decodeURIComponent(cloudUrl));
    }
  }, [searchParams, state.songs.length]);

  const loadCloudDatabase = async (url) => {
    setIsLoadingCloud(true);
    setCloudError(null);

    try {
      const validation = fetchManager.validateURL(url);
      if (!validation.valid) {
        throw new Error(`URL non valido: ${validation.error}`);
      }

      const data = await fetchManager.fetchJSON(url);
      
      // Normalizza i dati delle canzoni
      let songs = [];
      if (Array.isArray(data)) {
        songs = data;
      } else if (data.songs && Array.isArray(data.songs)) {
        songs = data.songs;
      } else if (data.data && Array.isArray(data.data)) {
        songs = data.data;
      } else {
        throw new Error('Formato dati non riconosciuto');
      }

      const normalizedSongs = songs.map((song, index) => ({
        id: song.id || `cloud_${Date.now()}_${index}`,
        title: song.title || song.name || 'Titolo Sconosciuto',
        artist: song.artist || song.performer || 'Artista Sconosciuto',
        album: song.album || '',
        year: song.year ? parseInt(song.year) : null,
        genre: song.genre || '',
        duration: song.duration ? parseInt(song.duration) : 0,
        size: song.size ? parseInt(song.size) : 0,
        path: song.path || song.url || '',
        lastModified: song.lastModified || new Date().toISOString(),
        source: 'cloud'
      }));

      actions.setSongs(normalizedSongs);

    } catch (error) {
      console.error('Errore caricamento cloud:', error);
      const suggestions = fetchManager.getSuggestions(error.message, url);
      setCloudError({
        message: error.message,
        suggestions
      });
    } finally {
      setIsLoadingCloud(false);
    }
  };

  // Configurazione Fuse.js per ricerca fuzzy
  const fuse = useMemo(() => {
    const options = {
      keys: ['title', 'artist', 'album'],
      threshold: 0.3,
      includeScore: true
    };
    return new Fuse(state.songs, options);
  }, [state.songs]);

  // Filtri e ricerca
  const filteredSongs = useMemo(() => {
    let songs = state.songs;

    // Filtro per sorgente
    if (sourceFilter !== 'all') {
      songs = songs.filter(song => song.source === sourceFilter);
    }

    // Ricerca
    if (!searchTerm.trim()) {
      return songs.slice(0, 20); // Mostra solo i primi 20 se non c'è ricerca
    }
    
    const searchResults = fuse.search(searchTerm);
    const matchedSongs = searchResults.map(result => result.item);
    
    // Applica filtro sorgente anche ai risultati di ricerca
    if (sourceFilter !== 'all') {
      return matchedSongs.filter(song => song.source === sourceFilter);
    }
    
    return matchedSongs;
  }, [state.songs, searchTerm, fuse, sourceFilter]);

  const handleAddToPlaylist = (song) => {
    if (addedSongs.has(song.id)) return;

    // Se non c'è un nome cantante salvato, chiedi di inserirlo
    if (!singerName.trim()) {
      setPendingSong(song);
      setShowNamePrompt(true);
      return;
    }

    // Aggiungi direttamente se il nome è già presente
    addSongWithName(song, singerName);
  };

  const addSongWithName = (song, name) => {
    actions.addToPlaylist(song, name.trim());
    setAddedSongs(prev => new Set([...prev, song.id]));

    // Feedback visivo
    setTimeout(() => {
      setAddedSongs(prev => {
        const newSet = new Set(prev);
        newSet.delete(song.id);
        return newSet;
      });
    }, 3000);
  };

  const handleNameSubmit = () => {
    if (!singerName.trim()) {
      alert('Inserisci il tuo nome per continuare');
      return;
    }

    if (pendingSong) {
      addSongWithName(pendingSong, singerName);
      setPendingSong(null);
    }
    setShowNamePrompt(false);
  };

  const handleNameCancel = () => {
    setShowNamePrompt(false);
    setPendingSong(null);
  };

  // Schermata di caricamento cloud
  if (isLoadingCloud) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 border border-white/10 rounded-xl p-8 text-center max-w-md"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <SafeIcon icon={FiCloud} className="text-4xl text-karaoke-purple mx-auto mb-4" />
          </motion.div>
          <h2 className="text-xl font-semibold text-white mb-2">Caricamento Database</h2>
          <p className="text-gray-300">
            Connessione al database cloud in corso...
          </p>
        </motion.div>
      </div>
    );
  }

  // Errore di caricamento cloud
  if (cloudError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center max-w-lg"
        >
          <SafeIcon icon={FiAlertCircle} className="text-4xl text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Errore Database Cloud</h2>
          <p className="text-gray-300 mb-4">
            {cloudError.message}
          </p>
          
          {cloudError.suggestions && (
            <div className="bg-white/10 rounded-lg p-4 mb-4 text-left">
              <h3 className="font-medium text-red-200 mb-2">💡 Suggerimenti:</h3>
              <ul className="text-sm text-red-200 space-y-1">
                {cloudError.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="bg-karaoke-purple hover:bg-karaoke-purple/80 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Riprova
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center max-w-md"
        >
          <SafeIcon icon={FiMusic} className="text-4xl text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Sessione Non Valida</h2>
          <p className="text-gray-300">
            La sessione richiesta non è attiva o non esiste. Contatta il DJ per ottenere un link valido.
          </p>
        </motion.div>
      </div>
    );
  }

  if (state.songs.length === 0 && !isLoadingCloud) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 border border-white/10 rounded-xl p-8 text-center max-w-md"
        >
          <SafeIcon icon={FiMusic} className="text-4xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Database Non Disponibile</h2>
          <p className="text-gray-300">
            Il database delle canzoni non è ancora stato configurato. Contatta il DJ per iniziare.
          </p>
        </motion.div>
      </div>
    );
  }

  const isCloudMode = searchParams.get('cloud') || state.songs.some(song => song.source === 'cloud');
  const cloudSongs = state.songs.filter(song => song.source === 'cloud').length;
  const localSongs = state.songs.filter(song => song.source === 'local').length;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-karaoke-purple to-karaoke-pink rounded-2xl p-6 mb-6 text-center"
        >
          <div className="flex items-center justify-center space-x-2 mb-3">
            <SafeIcon icon={FiMusic} className="text-4xl text-white" />
            {isCloudMode && (
              <SafeIcon icon={FiCloud} className="text-2xl text-white/80" />
            )}
            {localSongs > 0 && (
              <SafeIcon icon={FiHardDrive} className="text-2xl text-white/80" />
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            🎤 Interfaccia Cantante
          </h1>
          <p className="text-white/80">
            Cerca e aggiungi i tuoi brani preferiti alla scaletta!
          </p>
          
          {/* Indicatori modalità */}
          <div className="mt-3 flex items-center justify-center space-x-4 flex-wrap">
            {state.currentSession && (
              <div className="inline-block bg-white/20 rounded-full px-4 py-1">
                <span className="text-white text-sm font-medium">
                  {state.currentSession.name}
                </span>
              </div>
            )}
            
            {cloudSongs > 0 && (
              <div className="inline-block bg-karaoke-gold/20 rounded-full px-4 py-1 flex items-center">
                <SafeIcon icon={FiCloud} className="text-karaoke-gold mr-1 text-sm" />
                <span className="text-karaoke-gold text-sm font-medium">
                  {cloudSongs} Cloud
                </span>
              </div>
            )}

            {localSongs > 0 && (
              <div className="inline-block bg-green-500/20 rounded-full px-4 py-1 flex items-center">
                <SafeIcon icon={FiHardDrive} className="text-green-400 mr-1 text-sm" />
                <span className="text-green-400 text-sm font-medium">
                  {localSongs} Locali
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Campo Nome Cantante */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6"
        >
          <div className="flex items-center space-x-3 mb-3">
            <SafeIcon icon={FiUser} className="text-karaoke-gold text-xl" />
            <h3 className="text-lg font-semibold text-white">Il tuo nome</h3>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Inserisci il tuo nome..."
              value={singerName}
              onChange={(e) => setSingerName(e.target.value)}
              className="w-full pl-4 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-karaoke-purple text-lg"
            />
          </div>
          <p className="text-gray-300 text-sm mt-2">
            Il tuo nome apparirà nella scaletta per identificare chi deve cantare
          </p>
        </motion.div>

        {/* Ricerca e Filtri */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6"
        >
          <div className="space-y-4">
            {/* Barra di ricerca */}
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Cerca brani, artisti, album..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-karaoke-purple text-lg"
              />
            </div>

            {/* Filtri per sorgente */}
            {(cloudSongs > 0 || localSongs > 0) && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-300 text-sm font-medium">Sorgente:</span>
                <button
                  onClick={() => setSourceFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    sourceFilter === 'all'
                      ? 'bg-karaoke-purple text-white'
                      : 'bg-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  Tutte ({state.songs.length})
                </button>
                {cloudSongs > 0 && (
                  <button
                    onClick={() => setSourceFilter('cloud')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center ${
                      sourceFilter === 'cloud'
                        ? 'bg-karaoke-gold text-white'
                        : 'bg-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    <SafeIcon icon={FiCloud} className="mr-1 text-xs" />
                    Cloud ({cloudSongs})
                  </button>
                )}
                {localSongs > 0 && (
                  <button
                    onClick={() => setSourceFilter('local')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center ${
                      sourceFilter === 'local'
                        ? 'bg-green-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    <SafeIcon icon={FiHardDrive} className="mr-1 text-xs" />
                    Locali ({localSongs})
                  </button>
                )}
              </div>
            )}

            <div className="text-center text-gray-300">
              {searchTerm ? (
                <span>Trovati {filteredSongs.length} risultati</span>
              ) : (
                <span>Mostrando {filteredSongs.length} di {state.songs.length} brani disponibili</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Lista Brani */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden"
        >
          <div className="max-h-96 overflow-y-auto">
            {filteredSongs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <SafeIcon icon={FiSearch} className="text-4xl mx-auto mb-4 opacity-50" />
                <p>Nessun brano trovato</p>
                <p className="text-sm mt-2">Prova con termini di ricerca diversi</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {filteredSongs.map((song, index) => {
                  const isAdded = addedSongs.has(song.id);
                  const isInPlaylist = state.playlist.some(item => item.song.id === song.id);

                  return (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-white/5 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedSong(song)}>
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-karaoke-purple to-karaoke-pink rounded-xl flex items-center justify-center relative">
                                <SafeIcon icon={FiMusic} className="text-white text-xl" />
                                {song.source === 'cloud' && (
                                  <SafeIcon icon={FiCloud} className="text-karaoke-gold text-xs absolute -top-1 -right-1 bg-white rounded-full p-0.5" />
                                )}
                                {song.source === 'local' && (
                                  <SafeIcon icon={FiHardDrive} className="text-green-400 text-xs absolute -top-1 -right-1 bg-white rounded-full p-0.5" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white truncate text-lg">{song.title}</h4>
                              <p className="text-gray-300 truncate">{song.artist}</p>
                              {song.album && (
                                <p className="text-gray-400 text-sm truncate">{song.album}</p>
                              )}
                              <div className="flex items-center space-x-3 mt-1">
                                {song.year && (
                                  <span className="text-xs bg-karaoke-gold/20 text-karaoke-gold px-2 py-1 rounded-full">
                                    {song.year}
                                  </span>
                                )}
                                {song.genre && (
                                  <span className="text-xs bg-karaoke-purple/20 text-karaoke-purple px-2 py-1 rounded-full">
                                    {song.genre}
                                  </span>
                                )}
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  song.source === 'cloud'
                                    ? 'bg-karaoke-gold/20 text-karaoke-gold'
                                    : 'bg-green-500/20 text-green-400'
                                }`}>
                                  {song.source === 'cloud' ? 'Cloud' : 'Locale'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAddToPlaylist(song)}
                            disabled={isInPlaylist}
                            className={`p-3 rounded-xl transition-all font-medium ${
                              isInPlaylist
                                ? 'bg-green-600 text-white cursor-not-allowed'
                                : isAdded
                                ? 'bg-green-600 text-white'
                                : 'bg-karaoke-purple hover:bg-karaoke-purple/80 text-white opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <SafeIcon icon={isInPlaylist || isAdded ? FiCheck : FiPlus} className="text-xl" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Statistiche Scaletta */}
        {state.playlist.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center"
          >
            <SafeIcon icon={FiHeart} className="text-2xl text-green-400 mx-auto mb-2" />
            <p className="text-green-200 font-medium">
              Ci sono {state.playlist.length} brani nella scaletta!
            </p>
          </motion.div>
        )}

        {/* Modal Nome Cantante */}
        {showNamePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-karaoke-purple to-karaoke-pink rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <SafeIcon icon={FiMic} className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Inserisci il tuo nome</h3>
                <p className="text-gray-300 mb-6">
                  Il tuo nome apparirà nella scaletta così il DJ saprà chi chiamare sul palco
                </p>
                
                <input
                  type="text"
                  placeholder="Il tuo nome..."
                  value={singerName}
                  onChange={(e) => setSingerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-karaoke-purple mb-6"
                  autoFocus
                />
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleNameSubmit}
                    disabled={!singerName.trim()}
                    className="flex-1 bg-karaoke-purple hover:bg-karaoke-purple/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Aggiungi Brano
                  </button>
                  <button
                    onClick={handleNameCancel}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal Dettagli Brano */}
        {selectedSong && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-40"
            onClick={() => setSelectedSong(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-karaoke-purple to-karaoke-pink rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                  <SafeIcon icon={FiStar} className="text-white text-2xl" />
                  {selectedSong.source === 'cloud' && (
                    <SafeIcon icon={FiCloud} className="text-karaoke-gold text-sm absolute -top-1 -right-1 bg-white rounded-full p-1" />
                  )}
                  {selectedSong.source === 'local' && (
                    <SafeIcon icon={FiHardDrive} className="text-green-400 text-sm absolute -top-1 -right-1 bg-white rounded-full p-1" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{selectedSong.title}</h3>
                <p className="text-gray-300 mb-4">{selectedSong.artist}</p>
                {selectedSong.album && (
                  <p className="text-gray-400 text-sm mb-2">Album: {selectedSong.album}</p>
                )}
                <div className="flex justify-center space-x-2 mb-6">
                  {selectedSong.year && (
                    <span className="bg-karaoke-gold/20 text-karaoke-gold px-3 py-1 rounded-full text-sm">
                      {selectedSong.year}
                    </span>
                  )}
                  {selectedSong.genre && (
                    <span className="bg-karaoke-purple/20 text-karaoke-purple px-3 py-1 rounded-full text-sm">
                      {selectedSong.genre}
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm flex items-center ${
                    selectedSong.source === 'cloud'
                      ? 'bg-karaoke-gold/20 text-karaoke-gold'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    <SafeIcon 
                      icon={selectedSong.source === 'cloud' ? FiCloud : FiHardDrive} 
                      className="mr-1 text-xs" 
                    />
                    {selectedSong.source === 'cloud' ? 'Cloud' : 'Locale'}
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      handleAddToPlaylist(selectedSong);
                      setSelectedSong(null);
                    }}
                    disabled={state.playlist.some(item => item.song.id === selectedSong.id)}
                    className="flex-1 bg-karaoke-purple hover:bg-karaoke-purple/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    <SafeIcon icon={FiPlus} className="inline mr-2" />
                    Aggiungi
                  </button>
                  <button
                    onClick={() => setSelectedSong(null)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default SingerInterface;