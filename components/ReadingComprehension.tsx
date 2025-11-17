
import React, { useState, useCallback, useEffect } from 'react';
import { generateReadingContent } from '../services/geminiService';
import { ComprehensionContent } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';

const ReadingComprehension: React.FC = () => {
  const [content, setContent] = useState<ComprehensionContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setContent(null);
    setUserAnswers([]);
    setShowResults(false);
    try {
      const newContent = await generateReadingContent();
      setContent(newContent);
      setUserAnswers(new Array(newContent.questions.length).fill(''));
    } catch (err) {
      setError('Failed to generate reading content. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(true);
  };

  const getScore = () => {
    if (!content) return 0;
    return content.questions.reduce((score, question, index) => {
      return score + (userAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="p-6 flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Reading Comprehension</h2>
            <p className="text-slate-600">Read the story and answer the questions that follow.</p>
        </div>
        <Button onClick={fetchContent} isLoading={isLoading} variant="secondary">
            Generate New Story
        </Button>
      </div>

      <div className="p-6 border-t border-slate-200">
        {isLoading && <Spinner />}
        {error && <div className="text-red-600 text-center">{error}</div>}

        {content && (
          <div>
            <article className="prose prose-slate max-w-none bg-slate-50 p-4 rounded-md">
              <h3 className="text-xl font-semibold mb-2">The Story</h3>
              <p>{content.story}</p>
            </article>

            <form onSubmit={handleSubmit} className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Questions</h3>
              <div className="space-y-6">
                {content.questions.map((q, qIndex) => (
                  <div key={qIndex}>
                    <p className="font-medium text-slate-800">{qIndex + 1}. {q.question}</p>
                    <div className="mt-2 space-y-2">
                      {q.options.map((option, oIndex) => {
                        const isCorrect = showResults && option === q.correctAnswer;
                        const isSelected = userAnswers[qIndex] === option;
                        const isIncorrect = showResults && isSelected && !isCorrect;

                        return (
                          <label key={oIndex} className={`flex items-center p-3 rounded-md border transition-colors ${
                            isCorrect ? 'bg-green-100 border-green-300' :
                            isIncorrect ? 'bg-red-100 border-red-300' :
                            'bg-white border-slate-300'
                          }`}>
                            <input
                              type="radio"
                              name={`question-${qIndex}`}
                              value={option}
                              checked={isSelected}
                              onChange={() => handleAnswerChange(qIndex, option)}
                              disabled={showResults}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 disabled:opacity-70"
                            />
                            <span className="ml-3 text-sm text-slate-700">{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {!showResults && <Button type="submit" className="mt-8" disabled={userAnswers.some(a => a === '')}>Check Answers</Button>}
            </form>
            
            {showResults && (
              <div className="mt-8 p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-indigo-800">Results</h3>
                <p className="text-2xl font-bold text-indigo-600 mt-2">You scored {getScore()} out of {content.questions.length}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReadingComprehension;
