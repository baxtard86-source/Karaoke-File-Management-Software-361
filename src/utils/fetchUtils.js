// Utility per gestione fetch con retry e fallback
export class FetchManager {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  async fetchWithRetry(url, options = {}, attempt = 1) {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      mode: 'cors',
      credentials: 'omit',
      timeout: 10000
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      // Crea controller per timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalOptions.timeout);
      
      const response = await fetch(url, {
        ...finalOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;

    } catch (error) {
      console.error(`Fetch attempt ${attempt} failed:`, error);

      // Se è l'ultimo tentativo, rilancia l'errore
      if (attempt >= this.retryAttempts) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout: Il server non risponde entro 10 secondi');
        }
        if (error.message.includes('CORS')) {
          throw new Error('Errore CORS: Il server non permette richieste cross-origin');
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Connessione fallita: Verifica URL e connessione internet');
        }
        throw error;
      }

      // Attendi prima del retry
      await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      return this.fetchWithRetry(url, options, attempt + 1);
    }
  }

  async fetchJSON(url, options = {}) {
    const response = await this.fetchWithRetry(url, options);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Prova a leggere come testo per debug
      const text = await response.text();
      console.error('Response is not JSON:', text.substring(0, 200));
      throw new Error('La risposta non è in formato JSON valido');
    }

    return response.json();
  }

  // Validatore URL migliorato
  validateURL(url) {
    try {
      const urlObj = new URL(url);
      
      // Verifica protocollo
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('URL deve usare protocollo HTTP o HTTPS');
      }

      // Verifica che non sia localhost se in produzione
      const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(urlObj.hostname);
      const isProduction = window.location.protocol === 'https:';
      
      if (isProduction && isLocalhost) {
        throw new Error('URL localhost non accessibile in produzione');
      }

      return {
        valid: true,
        url: urlObj.toString(),
        type: this.detectURLType(url)
      };

    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  detectURLType(url) {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('supabase.co')) return 'supabase';
    if (urlLower.includes('firebase')) return 'firebase';
    if (urlLower.includes('github') && urlLower.includes('raw')) return 'github-raw';
    if (urlLower.includes('githubusercontent.com')) return 'github-raw';
    if (urlLower.includes('.json')) return 'json-file';
    if (urlLower.includes('/api/')) return 'api-rest';
    
    return 'unknown';
  }

  // Suggerimenti per fix comuni
  getSuggestions(error, url) {
    const suggestions = [];
    
    if (error.includes('CORS')) {
      suggestions.push('• Usa un servizio che supporta CORS come GitHub Raw o JSONBin');
      suggestions.push('• Per Supabase: abilita CORS nelle impostazioni API');
      suggestions.push('• Prova con un proxy CORS: https://cors-anywhere.herokuapp.com/' + url);
    }
    
    if (error.includes('Timeout')) {
      suggestions.push('• Verifica la velocità della connessione internet');
      suggestions.push('• Il server potrebbe essere sovraccarico, riprova più tardi');
      suggestions.push('• Usa un servizio più veloce come GitHub Raw');
    }
    
    if (error.includes('Failed to fetch')) {
      suggestions.push('• Verifica che l\'URL sia corretto e accessibile');
      suggestions.push('• Controlla la connessione internet');
      suggestions.push('• Il server potrebbe essere offline');
    }

    if (error.includes('404')) {
      suggestions.push('• L\'URL non esiste o è stato spostato');
      suggestions.push('• Verifica l\'indirizzo completo del file');
    }

    return suggestions;
  }
}

// Istanza globale
export const fetchManager = new FetchManager();

// Esempi di URL validi per diversi servizi
export const EXAMPLE_URLS = {
  'github-raw': 'https://raw.githubusercontent.com/username/repo/main/songs.json',
  'jsonbin': 'https://api.jsonbin.io/v3/b/YOUR_BIN_ID',
  'supabase': 'https://your-project.supabase.co/rest/v1/songs?select=*',
  'firebase': 'https://your-project.firebaseio.com/songs.json',
  'static-json': 'https://your-domain.com/data/songs.json'
};

// Template per diversi formati di dati
export const DATA_TEMPLATES = {
  simple: {
    description: 'Array semplice di canzoni',
    example: [
      {
        "id": "1",
        "title": "Titolo Canzone",
        "artist": "Nome Artista",
        "album": "Nome Album",
        "year": 2023,
        "genre": "Pop"
      }
    ]
  },
  nested: {
    description: 'Oggetto con array songs',
    example: {
      "songs": [
        {
          "id": "1",
          "title": "Titolo Canzone",
          "artist": "Nome Artista"
        }
      ]
    }
  },
  supabase: {
    description: 'Formato Supabase con metadati',
    example: [
      {
        "id": 1,
        "created_at": "2023-01-01T00:00:00.000Z",
        "title": "Titolo Canzone",
        "artist": "Nome Artista",
        "album": "Nome Album",
        "year": 2023,
        "genre": "Pop"
      }
    ]
  }
};