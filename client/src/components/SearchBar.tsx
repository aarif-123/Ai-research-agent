import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (company: string) => void;
  isStreaming: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isStreaming }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed && !isStreaming) {
      onSearch(trimmed);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search any company — e.g. Apple, Tesla, NVIDIA..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isStreaming}
          autoFocus
        />
        <button
          type="submit"
          className="search-btn"
          disabled={isStreaming || !query.trim()}
        >
          {isStreaming ? (
            <span className="search-loading">
              <span className="spinner" />
              Analyzing
            </span>
          ) : (
            'Analyze'
          )}
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
