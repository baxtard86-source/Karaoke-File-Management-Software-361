import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useKaraoke } from '../context/KaraokeContext';
import { v4 as uuidv4 } from 'uuid';

const { FiPlay, FiPause, FiSquare, FiUsers, FiLink, FiCopy, FiCheck } = FiIcons;

function SessionManager() {
  const { state, actions } = useKaraoke();
  const [sessionName, setSessionName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const createSession = () => {
    if (!sessionName.trim()) {
      alert('Inserisci un nome per la sessione');
      return;
    }

    const session = {
      id: uuidv4(),
      name: sessionName.trim(),
      createdAt: new Date().toISOString(),
      status: 'active',
      participantCount: 0
    };

    actions.setCurrentSession(session);
    setSessionName('');
  };

  const endSession = () => {
    if (confirm('Sei sicuro di voler terminare la sessione corrente?')) {
      actions.setCurrentSession(null);
      actions.clearPlaylist();
    }
  };

  const generateSingerLink = () => {
    if (!state.currentSession) return '';
    return `${window.location.origin}${window.location.pathname}#/singer/${state.currentSession.id}`;
  };

  const copyLink = async () => {
    const link = generateSingerLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      // Fallback per browser che non supportano clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {!state.currentSession ? (
        /* Creazione Nuova Sessione */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Crea Nuova Sessione</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Nome Sessione</label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="es. Serata Karaoke - Sabato"
                className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-karaoke-purple"
                onKeyPress={(e) => e.key === 'Enter' && createSession()}
              />
            </div>
            
            <button
              onClick={createSession}
              disabled={!sessionName.trim()}
              className="w-full bg-karaoke-purple hover:bg-karaoke-purple/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <SafeIcon icon={FiPlay} className="mr-2" />
              Avvia Sessione
            </button>
          </div>
        </motion.div>
      ) : (
        /* Sessione Attiva */
        <div className="space-y-6">
          {/* Informazioni Sessione */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <SafeIcon icon={FiPlay} className="mr-2 text-green-400" />
                  Sessione Attiva
                </h3>
                <p className="text-gray-300">{state.currentSession.name}</p>
              </div>
              
              <div className="text-right">
                <div className="text-green-400 font-medium">LIVE</div>
                <div className="text-gray-300 text-sm">
                  {new Date(state.currentSession.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Statistiche */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <SafeIcon icon={FiUsers} className="text-xl text-blue-400 mx-auto mb-1" />
                <div className="text-white font-medium">{state.playlist.length}</div>
                <div className="text-gray-400 text-xs">Richieste</div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <SafeIcon icon={FiPlay} className="text-xl text-green-400 mx-auto mb-1" />
                <div className="text-white font-medium">
                  {state.playlist.filter(item => item.status === 'playing').length}
                </div>
                <div className="text-gray-400 text-xs">In Corso</div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <SafeIcon icon={FiPause} className="text-xl text-yellow-400 mx-auto mb-1" />
                <div className="text-white font-medium">
                  {state.playlist.filter(item => item.status === 'pending').length}
                </div>
                <div className="text-gray-400 text-xs">In Attesa</div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <SafeIcon icon={FiCheck} className="text-xl text-purple-400 mx-auto mb-1" />
                <div className="text-white font-medium">
                  {state.playlist.filter(item => item.status === 'completed').length}
                </div>
                <div className="text-gray-400 text-xs">Completati</div>
              </div>
            </div>

            {/* Link per Cantanti */}
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3 flex items-center">
                <SafeIcon icon={FiLink} className="mr-2" />
                Link per Cantanti
              </h4>
              
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={generateSingerLink()}
                  readOnly
                  className="flex-1 py-2 px-3 bg-white/10 border border-white/20 rounded text-white text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyLink}
                  className={`px-4 py-2 rounded transition-colors ${
                    copiedLink 
                      ? 'bg-green-600 text-white' 
                      : 'bg-karaoke-purple hover:bg-karaoke-purple/80 text-white'
                  }`}
                >
                  <SafeIcon icon={copiedLink ? FiCheck : FiCopy} className="mr-1" />
                  {copiedLink ? 'Copiato!' : 'Copia'}
                </motion.button>
              </div>
              
              <p className="text-gray-400 text-xs mt-2">
                Condividi questo link con i cantanti per permettere loro di aggiungere brani alla scaletta
              </p>
            </div>

            {/* Controlli */}
            <div className="flex space-x-4 mt-6">
              <button
                onClick={endSession}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <SafeIcon icon={FiSquare} className="mr-2" />
                Termina Sessione
              </button>
            </div>
          </motion.div>

          {/* Istruzioni per l'uso */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
          >
            <h4 className="font-medium text-blue-200 mb-3">Come funziona</h4>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li>• Condividi il link con i cantanti</li>
              <li>• I cantanti possono cercare e aggiungere brani alla scaletta</li>
              <li>• Gestisci l'ordine e lo stato dei brani dalla sezione "Scaletta"</li>
              <li>• Termina la sessione quando la serata è finita</li>
            </ul>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default SessionManager;