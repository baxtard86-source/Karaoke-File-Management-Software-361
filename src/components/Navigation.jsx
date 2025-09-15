import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSettings, FiMic, FiList, FiMusic } = FiIcons;

function Navigation() {
  const location = useLocation();

  const navItems = [
    {
      path: '/admin',
      label: 'Admin',
      icon: FiSettings
    },
    {
      path: '/singer',
      label: 'Cantante',
      icon: FiMic
    },
    {
      path: '/playlist',
      label: 'Scaletta',
      icon: FiList
    }
  ];

  return (
    <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiMusic} className="text-2xl text-karaoke-gold" />
            <span className="text-xl font-bold text-white">Karaoke Manager</span>
          </div>
          
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              
              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                      isActive
                        ? 'bg-karaoke-purple text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <SafeIcon icon={item.icon} className="text-lg" />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;