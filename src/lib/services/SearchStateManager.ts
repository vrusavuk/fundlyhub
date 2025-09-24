/**
 * Centralized search state manager
 * Provides a service layer for complex search state management
 */

export interface SearchState {
  query: string;
  results: any[];
  suggestions: any[];
  recentSearches: any[];
  loading: boolean;
  error: string | null;
  selectedIndex: number;
  filters: {
    type?: string;
    category?: string;
  };
}

export type SearchStateAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_RESULTS'; payload: any[] }
  | { type: 'SET_SUGGESTIONS'; payload: any[] }
  | { type: 'SET_RECENT_SEARCHES'; payload: any[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SELECTED_INDEX'; payload: number }
  | { type: 'SET_FILTERS'; payload: Partial<SearchState['filters']> }
  | { type: 'CLEAR_STATE' }
  | { type: 'RESET_SELECTION' };

export const initialSearchState: SearchState = {
  query: '',
  results: [],
  suggestions: [],
  recentSearches: [],
  loading: false,
  error: null,
  selectedIndex: -1,
  filters: {},
};

export function searchStateReducer(
  state: SearchState,
  action: SearchStateAction
): SearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return {
        ...state,
        query: action.payload,
        error: null,
        selectedIndex: -1,
      };
    case 'SET_RESULTS':
      return {
        ...state,
        results: action.payload,
        loading: false,
        error: null,
      };
    case 'SET_SUGGESTIONS':
      return {
        ...state,
        suggestions: action.payload,
      };
    case 'SET_RECENT_SEARCHES':
      return {
        ...state,
        recentSearches: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'SET_SELECTED_INDEX':
      return {
        ...state,
        selectedIndex: action.payload,
      };
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        selectedIndex: -1,
      };
    case 'CLEAR_STATE':
      return {
        ...initialSearchState,
        recentSearches: state.recentSearches, // Preserve recent searches
      };
    case 'RESET_SELECTION':
      return {
        ...state,
        selectedIndex: -1,
      };
    default:
      return state;
  }
}

export class SearchStateManager {
  private listeners: Set<(state: SearchState) => void> = new Set();
  private state: SearchState = initialSearchState;

  constructor(initialState?: Partial<SearchState>) {
    if (initialState) {
      this.state = { ...this.state, ...initialState };
    }
  }

  getState(): SearchState {
    return { ...this.state };
  }

  dispatch(action: SearchStateAction): void {
    const prevState = this.state;
    this.state = searchStateReducer(this.state, action);
    
    if (this.state !== prevState) {
      this.notifyListeners();
    }
  }

  subscribe(listener: (state: SearchState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('SearchStateManager: Error in listener:', error);
      }
    });
  }

  // Convenience methods
  setQuery(query: string): void {
    this.dispatch({ type: 'SET_QUERY', payload: query });
  }

  setResults(results: any[]): void {
    this.dispatch({ type: 'SET_RESULTS', payload: results });
  }

  setLoading(loading: boolean): void {
    this.dispatch({ type: 'SET_LOADING', payload: loading });
  }

  setError(error: string | null): void {
    this.dispatch({ type: 'SET_ERROR', payload: error });
  }

  clearState(): void {
    this.dispatch({ type: 'CLEAR_STATE' });
  }
}