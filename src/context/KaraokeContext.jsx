import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const KaraokeContext = createContext();

const initialState = {
  songs: [],
  playlist: [],
  currentSession: null,
  isIndexing: false,
  searchResults: [],
  filters: {
    artist: '',
    title: '',
    genre: '',
    year: ''
  }
};

function karaokeReducer(state, action) {
  switch (action.type) {
    case 'SET_SONGS':
      return { ...state, songs: action.payload };
    
    case 'SET_INDEXING':
      return { ...state, isIndexing: action.payload };
    
    case 'ADD_TO_PLAYLIST':
      const existsInPlaylist = state.playlist.find(item => item.song.id === action.payload.song.id);
      if (existsInPlaylist) return state;
      
      return {
        ...state,
        playlist: [...state.playlist, {
          id: uuidv4(),
          song: action.payload.song,
          singerName: action.payload.singerName || 'Cantante Anonimo',
          addedAt: new Date().toISOString(),
          status: 'pending'
        }]
      };
    
    case 'REMOVE_FROM_PLAYLIST':
      return {
        ...state,
        playlist: state.playlist.filter(item => item.id !== action.payload)
      };
    
    case 'UPDATE_PLAYLIST_ITEM':
      return {
        ...state,
        playlist: state.playlist.map(item =>
          item.id === action.payload.id
            ? { ...item, ...action.payload.updates }
            : item
        )
      };
    
    case 'REORDER_PLAYLIST':
      return { ...state, playlist: action.payload };
    
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
    
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case 'CLEAR_PLAYLIST':
      return { ...state, playlist: [] };
    
    default:
      return state;
  }
}

export function KaraokeProvider({ children }) {
  const [state, dispatch] = useReducer(karaokeReducer, initialState);

  useEffect(() => {
    const savedData = localStorage.getItem('karaokeData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        dispatch({ type: 'SET_SONGS', payload: data.songs || [] });
        dispatch({ type: 'SET_CURRENT_SESSION', payload: data.currentSession || null });
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const dataToSave = {
      songs: state.songs,
      currentSession: state.currentSession
    };
    localStorage.setItem('karaokeData', JSON.stringify(dataToSave));
  }, [state.songs, state.currentSession]);

  const value = {
    state,
    dispatch,
    actions: {
      setSongs: (songs) => dispatch({ type: 'SET_SONGS', payload: songs }),
      setIndexing: (isIndexing) => dispatch({ type: 'SET_INDEXING', payload: isIndexing }),
      addToPlaylist: (song, singerName) => dispatch({ 
        type: 'ADD_TO_PLAYLIST', 
        payload: { song, singerName } 
      }),
      removeFromPlaylist: (id) => dispatch({ type: 'REMOVE_FROM_PLAYLIST', payload: id }),
      updatePlaylistItem: (id, updates) => dispatch({ 
        type: 'UPDATE_PLAYLIST_ITEM', 
        payload: { id, updates } 
      }),
      reorderPlaylist: (newOrder) => dispatch({ type: 'REORDER_PLAYLIST', payload: newOrder }),
      setCurrentSession: (session) => dispatch({ type: 'SET_CURRENT_SESSION', payload: session }),
      setSearchResults: (results) => dispatch({ type: 'SET_SEARCH_RESULTS', payload: results }),
      setFilters: (filters) => dispatch({ type: 'SET_FILTERS', payload: filters }),
      clearPlaylist: () => dispatch({ type: 'CLEAR_PLAYLIST' })
    }
  };

  return (
    <KaraokeContext.Provider value={value}>
      {children}
    </KaraokeContext.Provider>
  );
}

export function useKaraoke() {
  const context = useContext(KaraokeContext);
  if (!context) {
    throw new Error('useKaraoke must be used within a KaraokeProvider');
  }
  return context;
}