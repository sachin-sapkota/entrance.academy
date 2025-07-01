'use client';
import { ProcessLatexText } from './LatexRenderer';

export default function QuestionCard({ 
  question, 
  questionNumber, 
  selectedAnswer, 
  onAnswerChange, 
  isSubmitted 
}) {
  const handleOptionChange = (optionKey) => {
    if (!isSubmitted) {
      onAnswerChange(question.id, optionKey);
    }
  };

  const getOptionStyle = (optionKey) => {
    if (!isSubmitted) {
      return selectedAnswer === optionKey 
        ? 'bg-blue-50 border-blue-300 text-blue-900' 
        : 'bg-white border-slate-200 hover:border-slate-300';
    }
    
    // After submission, show correct/incorrect
    if (optionKey === question.correctAnswer) {
      return 'bg-green-50 border-green-300 text-green-900';
    }
    if (selectedAnswer === optionKey && optionKey !== question.correctAnswer) {
      return 'bg-red-50 border-red-300 text-red-900';
    }
    return 'bg-slate-50 border-slate-200 text-slate-400';
  };

  return (
    <div id={`question-${question.id}`} className="mb-8">
      <div className="mb-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-orange-600 text-sm font-medium">{questionNumber}</span>
          </div>
          <div className="flex-1">
            <p className="text-slate-900 font-medium leading-relaxed">
              <ProcessLatexText text={question.text} />
            </p>
            {question.image && (
              <div className="mt-3">
                <img 
                  src={question.image} 
                  alt={`Question ${questionNumber} diagram`}
                  className="w-32 h-24 sm:w-40 sm:h-32 object-contain rounded grayscale opacity-80"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="ml-10 space-y-2">
        {question.options.map((option) => (
          <label
            key={option.key}
            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${getOptionStyle(option.key)}`}
            onClick={() => handleOptionChange(option.key)}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={option.key}
              checked={selectedAnswer === option.key}
              onChange={() => handleOptionChange(option.key)}
              disabled={isSubmitted}
              className="hidden"
            />
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-3 ${
              selectedAnswer === option.key 
                ? 'border-blue-500 bg-blue-500' 
                : 'border-slate-300'
            }`}>
              {selectedAnswer === option.key && (
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              )}
            </div>
            <div className="flex-1">
              <span className="text-slate-800">
                <ProcessLatexText text={option.text} />
              </span>
              {option.image && (
                <div className="mt-2">
                  <img 
                    src={option.image} 
                    alt={`Option ${option.key}`}
                    className="w-12 h-9 sm:w-14 sm:h-11 object-contain rounded grayscale opacity-80"
                  />
                </div>
              )}
            </div>
          </label>
        ))}
      </div>

      {/* Explanation (shown after submission) */}
      {isSubmitted && question.explanation && (
        <div className="ml-10 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <ProcessLatexText text={question.explanation} />
          </p>
        </div>
      )}
    </div>
  );
} 