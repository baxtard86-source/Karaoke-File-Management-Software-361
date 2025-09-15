import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useKaraoke } from '../context/KaraokeContext';
import Fuse from 'fuse.js';

const { FiSearch, FiPlus, FiMusic, FiCheck, FiHeart, FiStar, FiUser, FiMic } = FiIcons;

function SingerInterface() {
  const { sessionId } = useParams();
  const { state, actions } = useKaraoke();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [addedSongs, setAddedSongs] = useState(new Set());
  const [singerName, setSingerName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [pendingSong, setPendingSong] = useState(null);

  // Verifica se la sessione è valida
  const isValidSession = !sessionId || (state.currentSession && state.currentSession.id === sessionId);

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
    if (!searchTerm.trim()) {
      return state.songs.slice(0, 20); // Mostra solo i primi 20 se non c'è ricerca
    }
    const results = fuse.search(searchTerm);
    return results.map(result => result.item);
  }, [state.songs, searchTerm, fuse]);

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

  if (state.songs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 border border-white/10 rounded-xl p-8 text-center max-w-md"
        >
          <SafeIcon icon={FiMusic} className="text-4xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Libreria Vuota</h2>
          <p className="text-gray-300">
            La libreria karaoke non è ancora stata configurata. Contatta il DJ per iniziare.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-karaoke-purple to-karaoke-pink rounded-2xl p-6 mb-6 text-center"
        >
          <SafeIcon icon={FiMusic} className="text-4xl text-white mx-auto mb-3" />
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            🎤 Interfaccia Cantante
          </h1>
          <p className="text-white/80">
            Cerca e aggiungi i tuoi brani preferiti alla scaletta!
          </p>
          {state.currentSession && (
            <div className="mt-3 inline-block bg-white/20 rounded-full px-4 py-1">
              <span className="text-white text-sm font-medium">
                {state.currentSession.name}
              </span>
            </div>
          )}
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

        {/* Ricerca */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6"
        >
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
          <div className="mt-4 text-center text-gray-300">
            {searchTerm ? (
              <span>Trovati {filteredSongs.length} risultati</span>
            ) : (
              <span>Digita per cercare tra {state.songs.length} brani disponibili</span>
            )}
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
                              <div className="w-12 h-12 bg-gradient-to-br from-karaoke-purple to-karaoke-pink rounded-xl flex items-center justify-center">
                                <SafeIcon icon={FiMusic} className="text-white text-xl" />
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
                <div className="w-20 h-20 bg-gradient-to-br from-karaoke-purple to-karaoke-pink rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <SafeIcon icon={FiStar} className="text-white text-2xl" />
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