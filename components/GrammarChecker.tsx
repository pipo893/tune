
import React, { useState, useCallback } from 'react';
import { checkGrammar } from '../services/geminiService';
import { GrammarCorrection } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';

const GrammarChecker: React.FC = () => {
  const [text, setText] = useState("I has been to the store yesterday and buyed some milk.");
  const [correction, setCorrection] = useState<GrammarCorrection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckGrammar = useCallback(async () => {
    if (!text.trim()) {
      setError('Please enter some text to check.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setCorrection(null);
    try {
      const result = await checkGrammar(text);
      setCorrection(result);
    } catch (err) {
      setError('Failed to check grammar. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [text]);

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Grammar Checker</h2>
        <p className="text-slate-600 mb-4">Write some text, and our AI will correct it and explain the errors.</p>
        <div className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text here..."
            className="w-full h-40 px-3 py-2 text-slate-900 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          />
          <div className="self-end">
            <Button onClick={handleCheckGrammar} isLoading={isLoading} disabled={!text.trim()}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              Check Grammar
            </Button>
          </div>
        </div>
      </div>

      {error && <div className="p-6 pt-0 text-red-600">{error}</div>}
      
      {isLoading && <Spinner />}

      {correction && (
        <div className="p-6 border-t border-slate-200 bg-slate-50">
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Corrected Text</h3>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
                        {correction.correctedText}
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Explanations</h3>
                    <ul className="space-y-3">
                        {correction.explanations.map((exp, index) => (
                            <li key={index} className="p-3 bg-white border border-slate-200 rounded-md">
                                <p className="text-sm text-slate-600">
                                    <span className="line-through text-red-500">{exp.original}</span> &rarr; <span className="font-semibold text-green-600">{exp.correction}</span>
                                </p>
                                <p className="text-xs text-slate-500 mt-1">{exp.reason}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
      )}
    </Card>
  );
};

export default GrammarChecker;
