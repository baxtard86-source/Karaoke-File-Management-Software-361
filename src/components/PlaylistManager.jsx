import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useKaraoke } from '../context/KaraokeContext';
import { format } from 'date-fns';

const { 
  FiList, FiPlay, FiPause, FiSkipForward, FiTrash2, FiClock, FiUser, 
  FiMusic, FiCheck, FiX, FiRotateCcw, FiMic, FiStar 
} = FiIcons;

function PlaylistManager() {
  const { state, actions } = useKaraoke();
  const [draggedItem, setDraggedItem] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'playing': return 'text-green-400 bg-green-400/20';
      case 'completed': return 'text-blue-400 bg-blue-400/20';
      case 'skipped': return 'text-red-400 bg-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'playing': return FiPlay;
      case 'completed': return FiCheck;
      case 'skipped': return FiX;
      default: return FiClock;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'playing': return 'In Corso';
      case 'completed': return 'Completato';
      case 'skipped': return 'Saltato';
      default: return 'In Attesa';
    }
  };

  const handleStatusChange = (itemId, newStatus) => {
    actions.updatePlaylistItem(itemId, { status: newStatus });
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const currentIndex = state.playlist.findIndex(item => item.id === draggedItem.id);
    const targetIndex = state.playlist.findIndex(item => item.id === targetItem.id);

    const newPlaylist = [...state.playlist];
    newPlaylist.splice(currentIndex, 1);
    newPlaylist.splice(targetIndex, 0, draggedItem);

    actions.reorderPlaylist(newPlaylist);
    setDraggedItem(null);
  };

  const nextSong = () => {
    const currentPlaying = state.playlist.find(item => item.status === 'playing');
    if (currentPlaying) {
      actions.updatePlaylistItem(currentPlaying.id, { status: 'completed' });
    }

    const nextPending = state.playlist.find(item => item.status === 'pending');
    if (nextPending) {
      actions.updatePlaylistItem(nextPending.id, { status: 'playing' });
    }
  };

  const resetPlaylist = () => {
    if (confirm('Sei sicuro di voler resettare tutti gli stati della scaletta?')) {
      state.playlist.forEach(item => {
        if (item.status !== 'pending') {
          actions.updatePlaylistItem(item.id, { status: 'pending' });
        }
      });
    }
  };

  const clearCompleted = () => {
    if (confirm('Sei sicuro di voler rimuovere tutti i brani completati?')) {
      const completedItems = state.playlist.filter(item => item.status === 'completed');
      completedItems.forEach(item => {
        actions.removeFromPlaylist(item.id);
      });
    }
  };

  const stats = {
    total: state.playlist.length,
    pending: state.playlist.filter(item => item.status === 'pending').length,
    playing: state.playlist.filter(item => item.status === 'playing').length,
    completed: state.playlist.filter(item => item.status === 'completed').length,
    skipped: state.playlist.filter(item => item.status === 'skipped').length
  };

  // Raggruppa i cantanti unici
  const uniqueSingers = [...new Set(state.playlist.map(item => item.singerName))].length;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <SafeIcon icon={FiList} className="mr-3" />
                Gestione Scaletta
              </h1>
              <p className="text-gray-300">Gestisci l'ordine e lo stato dei brani</p>
            </div>
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextSong}
                disabled={!stats.playing && !stats.pending}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
              >
                <SafeIcon icon={FiSkipForward} className="mr-2" />
                Prossimo
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetPlaylist}
                disabled={stats.total === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
              >
                <SafeIcon icon={FiRotateCcw} className="mr-2" />
                Reset
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearCompleted}
                disabled={stats.completed === 0}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
              >
                <SafeIcon icon={FiTrash2} className="mr-2" />
                Pulisci
              </motion.button>
            </div>
          </div>

          {/* Statistiche */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-gray-300 text-sm">Totale</div>
            </div>
            <div className="bg-karaoke-purple/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-karaoke-purple">{uniqueSingers}</div>
              <div className="text-gray-300 text-sm">Cantanti</div>
            </div>
            <div className="bg-yellow-400/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-gray-300 text-sm">In Attesa</div>
            </div>
            <div className="bg-green-400/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.playing}</div>
              <div className="text-gray-300 text-sm">In Corso</div>
            </div>
            <div className="bg-blue-400/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.completed}</div>
              <div className="text-gray-300 text-sm">Completati</div>
            </div>
            <div className="bg-red-400/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.skipped}</div>
              <div className="text-gray-300 text-sm">Saltati</div>
            </div>
          </div>
        </motion.div>

        {/* Lista Scaletta */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
          {state.playlist.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <SafeIcon icon={FiMusic} className="text-6xl mx-auto mb-6 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Scaletta Vuota</h3>
              <p>I brani aggiunti dai cantanti appariranno qui</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              <AnimatePresence>
                {state.playlist.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, item)}
                    className={`p-6 hover:bg-white/5 transition-all duration-300 cursor-move ${
                      item.status === 'playing' ? 'bg-green-500/10 border-l-4 border-green-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        {/* Numero posizione */}
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>

                        {/* Info brano e cantante */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-white truncate text-lg">{item.song.title}</h4>
                            <div className="flex items-center bg-karaoke-gold/20 text-karaoke-gold px-3 py-1 rounded-full text-sm font-medium">
                              <SafeIcon icon={FiMic} className="mr-1 text-xs" />
                              {item.singerName}
                            </div>
                          </div>
                          
                          <p className="text-gray-300 truncate flex items-center">
                            <SafeIcon icon={FiUser} className="mr-1 text-sm" />
                            {item.song.artist}
                          </p>
                          
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-gray-400 text-sm">
                              Aggiunto: {format(new Date(item.addedAt), 'HH:mm')}
                            </span>
                            {item.song.year && (
                              <span className="text-xs bg-karaoke-gold/20 text-karaoke-gold px-2 py-1 rounded-full">
                                {item.song.year}
                              </span>
                            )}
                            {item.song.genre && (
                              <span className="text-xs bg-karaoke-purple/20 text-karaoke-purple px-2 py-1 rounded-full">
                                {item.song.genre}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex-shrink-0">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(item.status)}`}>
                            <SafeIcon icon={getStatusIcon(item.status)} className="mr-1" />
                            {getStatusText(item.status)}
                          </div>
                        </div>
                      </div>

                      {/* Controlli */}
                      <div className="flex items-center space-x-2 ml-4">
                        {item.status === 'pending' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStatusChange(item.id, 'playing')}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            title="Inizia"
                          >
                            <SafeIcon icon={FiPlay} />
                          </motion.button>
                        )}

                        {item.status === 'playing' && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleStatusChange(item.id, 'completed')}
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                              title="Completa"
                            >
                              <SafeIcon icon={FiCheck} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleStatusChange(item.id, 'skipped')}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                              title="Salta"
                            >
                              <SafeIcon icon={FiX} />
                            </motion.button>
                          </>
                        )}

                        {(item.status === 'completed' || item.status === 'skipped') && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStatusChange(item.id, 'pending')}
                            className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                            title="Reimposta"
                          >
                            <SafeIcon icon={FiRotateCcw} />
                          </motion.button>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => actions.removeFromPlaylist(item.id)}
                          className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                          title="Rimuovi"
                        >
                          <SafeIcon icon={FiTrash2} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Istruzioni */}
        {state.playlist.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
          >
            <h4 className="font-medium text-blue-200 mb-3">💡 Suggerimenti</h4>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li>• Trascina i brani per riordinare la scaletta</li>
              <li>• Il nome del cantante è mostrato accanto al titolo del brano</li>
              <li>• Usa i pulsanti per cambiare lo stato dei brani</li>
              <li>• "Prossimo" completa automaticamente il brano corrente e inizia il successivo</li>
              <li>• "Reset" riporta tutti i brani allo stato "In Attesa"</li>
              <li>• "Pulisci" rimuove tutti i brani completati</li>
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default PlaylistManager;