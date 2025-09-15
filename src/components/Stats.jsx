import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useKaraoke } from '../context/KaraokeContext';
import ReactECharts from 'echarts-for-react';

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
      .sort(([,a], [,b]) => b - a)
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
      .sort(([,a], [,b]) => b - a)
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

  // Configurazione grafico artisti
  const artistChartOption = {
    title: {
      text: 'Top 10 Artisti',
      textStyle: { color: '#ffffff', fontSize: 16 }
    },
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#9ca3af' },
      axisLine: { lineStyle: { color: '#374151' } }
    },
    yAxis: {
      type: 'category',
      data: artistStats.map(item => item.artist),
      axisLabel: { color: '#9ca3af' },
      axisLine: { lineStyle: { color: '#374151' } }
    },
    series: [{
      type: 'bar',
      data: artistStats.map(item => item.count),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#8b5cf6' },
            { offset: 1, color: '#ec4899' }
          ]
        }
      }
    }]
  };

  // Configurazione grafico generi
  const genreChartOption = {
    title: {
      text: 'Distribuzione Generi',
      textStyle: { color: '#ffffff', fontSize: 16 }
    },
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: 'Generi',
      type: 'pie',
      radius: ['40%', '70%'],
      data: genreStats.map((item, index) => ({
        value: item.count,
        name: item.genre,
        itemStyle: {
          color: [
            '#8b5cf6', '#ec4899', '#ffd700', '#3b82f6',
            '#10b981', '#f59e0b', '#ef4444', '#6366f1'
          ][index % 8]
        }
      })),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      label: {
        color: '#9ca3af'
      }
    }]
  };

  // Configurazione grafico anni
  const yearChartOption = {
    title: {
      text: 'Distribuzione per Decenni',
      textStyle: { color: '#ffffff', fontSize: 16 }
    },
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: yearStats.map(item => item.decade),
      axisLabel: { color: '#9ca3af' },
      axisLine: { lineStyle: { color: '#374151' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#9ca3af' },
      axisLine: { lineStyle: { color: '#374151' } }
    },
    series: [{
      type: 'line',
      data: yearStats.map(item => item.count),
      smooth: true,
      lineStyle: {
        color: '#ffd700',
        width: 3
      },
      itemStyle: {
        color: '#ffd700'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(255, 215, 0, 0.3)' },
            { offset: 1, color: 'rgba(255, 215, 0, 0.1)' }
          ]
        }
      }
    }]
  };

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

      {/* Grafici */}
      {state.songs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grafico Artisti */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <ReactECharts
              option={artistChartOption}
              style={{ height: '300px' }}
              theme="dark"
            />
          </motion.div>

          {/* Grafico Generi */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <ReactECharts
              option={genreChartOption}
              style={{ height: '300px' }}
              theme="dark"
            />
          </motion.div>
        </div>
      )}

      {/* Grafico Timeline */}
      {yearStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl p-6 border border-white/10"
        >
          <ReactECharts
            option={yearChartOption}
            style={{ height: '300px' }}
            theme="dark"
          />
        </motion.div>
      )}

      {/* Lista Top Artisti */}
      {artistStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Top Artisti per Numero di Brani</h3>
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
    </div>
  );
}

export default Stats;