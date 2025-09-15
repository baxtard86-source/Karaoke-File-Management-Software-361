import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FileIndexer from './FileIndexer';
import SongLibrary from './SongLibrary';
import SessionManager from './SessionManager';
import Stats from './Stats';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('indexer');

  const tabs = [
    { id: 'indexer', label: 'Indicizzazione' },
    { id: 'library', label: 'Libreria' },
    { id: 'session', label: 'Sessione' },
    { id: 'stats', label: 'Statistiche' }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Pannello Amministratore</h1>
          <p className="text-gray-300">Gestisci la libreria karaoke e le sessioni</p>
        </motion.div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-karaoke-purple text-white border-b-2 border-karaoke-gold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'indexer' && <FileIndexer />}
            {activeTab === 'library' && <SongLibrary />}
            {activeTab === 'session' && <SessionManager />}
            {activeTab === 'stats' && <Stats />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;