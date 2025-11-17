
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import VocabularyBuilder from './components/VocabularyBuilder';
import PronunciationPractice from './components/PronunciationPractice';
import ConversationSimulator from './components/ConversationSimulator';
import ReadingComprehension from './components/ReadingComprehension';
import GrammarChecker from './components/GrammarChecker';
import { Tab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Vocabulary);

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case Tab.Vocabulary:
        return <VocabularyBuilder />;
      case Tab.Pronunciation:
        return <PronunciationPractice />;
      case Tab.Conversation:
        return <ConversationSimulator />;
      case Tab.Reading:
        return <ReadingComprehension />;
      case Tab.Grammar:
        return <GrammarChecker />;
      default:
        return <VocabularyBuilder />;
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-6">
          {renderContent()}
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-slate-500">
        <p>&copy; 2024 LingoSphere AI. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
