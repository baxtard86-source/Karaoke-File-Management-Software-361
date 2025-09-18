import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useKaraoke } from '../context/KaraokeContext';

const { FiBarChart3, FiPieChart, FiTrendingUp, FiMusic } = FiIcons;

function Stats() {
  const { state } = useKaraoke();

  // Statistiche per artisti
  const artistStats = useMemo(() => {
    const counts = {};
    state.songs.forEach(song => {
      counts[song.artist] = (counts[song.artist] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([artist, count]) => ({ artist, count }));
  }, [state.songs]);

  // Statistiche per generi
  const genreStats = useMemo(() => {
    const counts = {};
    state.songs.forEach(song => {
      if (song.genre) {
        counts[song.genre] = (counts[song.genre] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([genre, count]) => ({ genre, count }));
  }, [state.songs]);

  // Statistiche per anni
  const yearStats = useMemo(() => {
    const counts = {};
    state.songs.forEach(song => {
      if (song.year) {
        const decade = Math.floor(song.year / 10) * 10;
        counts[decade] = (counts[decade] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([decade, count]) => ({ decade: `${decade}s`, count }));
  }, [state.songs]);

  const totalSize = useMemo(() => {
    return state.songs.reduce((total, song) => total + song.size, 0);
  }, [state.songs]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Statistiche Generali */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-karaoke-purple/20 border border-karaoke-purple/30 rounded-lg p-6 text-center"
        >
          <SafeIcon icon={FiMusic} className="text-3xl text-karaoke-purple mx-auto mb-3" />
          <div className="text-2xl font-bold text-white">{state.songs.length}</div>
          <div className="text-gray-300">Brani Totali</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-karaoke-pink/20 border border-karaoke-pink/30 rounded-lg p-6 text-center"
        >
          <SafeIcon icon={FiBarChart3} className="text-3xl text-karaoke-pink mx-auto mb-3" />
          <div className="text-2xl font-bold text-white">{artistStats.length}</div>
          <div className="text-gray-300">Artisti Unici</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-karaoke-gold/20 border border-karaoke-gold/30 rounded-lg p-6 text-center"
        >
          <SafeIcon icon={FiPieChart} className="text-3xl text-karaoke-gold mx-auto mb-3" />
          <div className="text-2xl font-bold text-white">{genreStats.length}</div>
          <div className="text-gray-300">Generi</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-6 text-center"
        >
          <SafeIcon icon={FiTrendingUp} className="text-3xl text-blue-400 mx-auto mb-3" />
          <div className="text-2xl font-bold text-white">{formatFileSize(totalSize)}</div>
          <div className="text-gray-300">Dimensione Totale</div>
        </motion.div>
      </div>

      {/* Grafici Semplificati - Solo se ci sono dati */}
      {state.songs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Artisti */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Top 5 Artisti</h3>
            <div className="space-y-3">
              {artistStats.slice(0, 5).map((item, index) => (
                <div key={item.artist} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-karaoke-purple rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {index + 1}
                    </div>
                    <span className="text-white truncate">{item.artist}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="h-2 bg-karaoke-purple rounded-full" 
                      style={{ width: `${(item.count / artistStats[0].count) * 100}px` }}
                    />
                    <span className="text-karaoke-gold font-bold text-sm">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Generi */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Generi Principali</h3>
            <div className="space-y-3">
              {genreStats.slice(0, 5).map((item, index) => {
                const colors = ['bg-karaoke-purple', 'bg-karaoke-pink', 'bg-karaoke-gold', 'bg-blue-500', 'bg-green-500'];
                return (
                  <div key={item.genre} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`} />
                      <span className="text-white truncate">{item.genre}</span>
                    </div>
                    <span className="text-gray-300 font-medium">{item.count} brani</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Timeline Decenni */}
      {yearStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Distribuzione per Decenni</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {yearStats.map((item, index) => (
              <div key={item.decade} className="text-center">
                <div 
                  className="bg-karaoke-gold rounded-lg p-4 mb-2 relative overflow-hidden"
                  style={{ 
                    height: `${Math.max(60, (item.count / Math.max(...yearStats.map(y => y.count))) * 120)}px`,
                    opacity: 0.7 + (item.count / Math.max(...yearStats.map(y => y.count))) * 0.3
                  }}
                >
                  <div className="absolute bottom-2 left-0 right-0 text-center">
                    <span className="text-gray-900 font-bold text-lg">{item.count}</span>
                  </div>
                </div>
                <span className="text-gray-300 text-sm font-medium">{item.decade}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Lista Completa Top Artisti */}
      {artistStats.length > 5 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Tutti i Top Artisti</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {artistStats.map((item, index) => (
              <div key={item.artist} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-karaoke-purple rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="text-white font-medium truncate">{item.artist}</span>
                </div>
                <span className="text-karaoke-gold font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Messaggio se non ci sono dati */}
      {state.songs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl p-12 border border-white/10 text-center"
        >
          <SafeIcon icon={FiMusic} className="text-6xl text-gray-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">Nessun Dato Disponibile</h3>
          <p className="text-gray-300">
            Indicizza alcuni brani per vedere le statistiche della tua libreria karaoke
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default Stats;