import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminPanel from './components/AdminPanel';
import SingerInterface from './components/SingerInterface';
import PlaylistManager from './components/PlaylistManager';
import { KaraokeProvider } from './context/KaraokeContext';
import Navigation from './components/Navigation';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <KaraokeProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <Navigation />
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/admin" replace />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/singer/:sessionId?" element={<SingerInterface />} />
                <Route path="/playlist" element={<PlaylistManager />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </Router>
    </KaraokeProvider>
  );
}

export default App;