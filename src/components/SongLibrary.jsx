import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useKaraoke } from '../context/KaraokeContext';
import { formatDuration } from '../utils/metadataUtils';
import Fuse from 'fuse.js';

const { FiSearch, FiPlus, FiMusic, FiUser, FiCalendar, FiDisc, FiClock } = FiIcons;

function SongLibrary() {
  const { state, actions } = useKaraoke();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    artist: '',
    genre: '',
    year: ''
  });

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

    // Applica ricerca fuzzy
    if (searchTerm.trim()) {
      const results = fuse.search(searchTerm);
      songs = results.map(result => result.item);
    }

    // Applica filtri
    if (selectedFilters.artist) {
      songs = songs.filter(song => 
        song.artist.toLowerCase().includes(selectedFilters.artist.toLowerCase())
      );
    }
    
    if (selectedFilters.genre) {
      songs = songs.filter(song => 
        song.genre.toLowerCase().includes(selectedFilters.genre.toLowerCase())
      );
    }
    
    if (selectedFilters.year) {
      songs = songs.filter(song => song.year.toString().includes(selectedFilters.year));
    }

    return songs;
  }, [state.songs, searchTerm, selectedFilters, fuse]);

  // Estrai valori unici per i filtri
  const uniqueArtists = useMemo(() => 
    [...new Set(state.songs.map(song => song.artist))].sort()
  , [state.songs]);

  const uniqueGenres = useMemo(() => 
    [...new Set(state.songs.map(song => song.genre).filter(Boolean))].sort()
  , [state.songs]);

  const uniqueYears = useMemo(() => 
    [...new Set(state.songs.map(song => song.year).filter(Boolean))].sort().reverse()
  , [state.songs]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFilters({ artist: '', genre: '', year: '' });
  };

  const handleAddToPlaylist = (song) => {
    const singerName = prompt('Inserisci il nome del cantante:');
    if (singerName && singerName.trim()) {
      actions.addToPlaylist(song, singerName.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-karaoke-purple/20 border border-karaoke-purple/30 rounded-lg p-4 text-center">
          <SafeIcon icon={FiMusic} className="text-2xl text-karaoke-purple mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{state.songs.length}</div>
          <div className="text-gray-300 text-sm">Brani Totali</div>
        </div>
        
        <div className="bg-karaoke-pink/20 border border-karaoke-pink/30 rounded-lg p-4 text-center">
          <SafeIcon icon={FiUser} className="text-2xl text-karaoke-pink mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{uniqueArtists.length}</div>
          <div className="text-gray-300 text-sm">Artisti</div>
        </div>
        
        <div className="bg-karaoke-gold/20 border border-karaoke-gold/30 rounded-lg p-4 text-center">
          <SafeIcon icon={FiDisc} className="text-2xl text-karaoke-gold mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{uniqueGenres.length}</div>
          <div className="text-gray-300 text-sm">Generi</div>
        </div>
        
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
          <SafeIcon icon={FiCalendar} className="text-2xl text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{filteredSongs.length}</div>
          <div className="text-gray-300 text-sm">Risultati</div>
        </div>
      </div>

      {/* Filtri e Ricerca */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Ricerca */}
          <div className="lg:col-span-2">
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca brani, artisti, album..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-karaoke-purple"
              />
            </div>
          </div>

          {/* Filtro Artista */}
          <div>
            <select
              value={selectedFilters.artist}
              onChange={(e) => setSelectedFilters({...selectedFilters, artist: e.target.value})}
              className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-karaoke-purple"
            >
              <option value="">Tutti gli artisti</option>
              {uniqueArtists.map(artist => (
                <option key={artist} value={artist} className="bg-gray-800">{artist}</option>
              ))}
            </select>
          </div>

          {/* Filtro Genere */}
          <div>
            <select
              value={selectedFilters.genre}
              onChange={(e) => setSelectedFilters({...selectedFilters, genre: e.target.value})}
              className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-karaoke-purple"
            >
              <option value="">Tutti i generi</option>
              {uniqueGenres.map(genre => (
                <option key={genre} value={genre} className="bg-gray-800">{genre}</option>
              ))}
            </select>
          </div>

          {/* Pulsante Clear */}
          <div>
            <button
              onClick={clearFilters}
              className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Pulisci Filtri
            </button>
          </div>
        </div>
      </div>

      {/* Lista Brani */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          {filteredSongs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <SafeIcon icon={FiMusic} className="text-4xl mx-auto mb-4 opacity-50" />
              <p>Nessun brano trovato</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredSongs.map((song, index) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-karaoke-purple/30 rounded-lg flex items-center justify-center">
                            <SafeIcon icon={FiMusic} className="text-karaoke-purple" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">{song.title}</h4>
                          <p className="text-gray-300 text-sm truncate">{song.artist}</p>
                          {song.album && (
                            <p className="text-gray-400 text-xs truncate">{song.album}</p>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0 text-right">
                          <div className="text-gray-400 text-xs space-y-1">
                            {song.year && <div>{song.year}</div>}
                            {song.genre && <div>{song.genre}</div>}
                            <div className="flex items-center">
                              <SafeIcon icon={FiClock} className="mr-1" />
                              {formatDuration(song.duration)}
                            </div>
                            <div>{formatFileSize(song.size)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddToPlaylist(song)}
                        className="p-2 bg-karaoke-purple hover:bg-karaoke-purple/80 text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <SafeIcon icon={FiPlus} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SongLibrary;