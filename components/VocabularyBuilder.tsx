
import React, { useState, useCallback } from 'react';
import { getWordInfo } from '../services/geminiService';
import { WordInfo } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';

const VocabularyBuilder: React.FC = () => {
  const [word, setWord] = useState('');
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) {
      setError('Please enter a word.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setWordInfo(null);
    try {
      const info = await getWordInfo(word);
      setWordInfo(info);
    } catch (err) {
      setError('Failed to fetch word information. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [word]);

  return (
    <Card className="max-w-3xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Vocabulary Builder</h2>
        <p className="text-slate-600 mb-4">Enter a word to get its definition, example sentence, synonyms, and antonyms.</p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="e.g., ubiquitous"
            className="flex-grow w-full px-3 py-2 text-slate-900 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          />
          <Button type="submit" isLoading={isLoading} disabled={!word.trim()}>
            Look Up
          </Button>
        </form>
      </div>

      {error && <div className="p-6 pt-0 text-red-600">{error}</div>}
      
      {isLoading && <Spinner />}

      {wordInfo && (
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <h3 className="text-3xl font-bold capitalize text-indigo-600 mb-4">{wordInfo.word}</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-700">Definition</h4>
              <p className="text-slate-600">{wordInfo.definition}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-700">Example</h4>
              <p className="text-slate-600 italic">"{wordInfo.example}"</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-700">Synonyms</h4>
              <div className="flex flex-wrap gap-2">
                {wordInfo.synonyms.map((s, i) => (
                  <span key={i} className="bg-sky-100 text-sky-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-700">Antonyms</h4>
              <div className="flex flex-wrap gap-2">
                {wordInfo.antonyms.map((a, i) => (
                  <span key={i} className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default VocabularyBuilder;
