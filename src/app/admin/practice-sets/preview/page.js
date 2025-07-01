'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Save,
  Send,
  Eye,
  Book,
  AlertCircle,
  Edit2,
  Upload,
  X,
  Check,
  Trash2,
  Image as ImageIcon,
  FileText,
  BookOpen,
  Users
} from 'lucide-react';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import LatexRenderer, { ProcessLatexText } from '@/app/components/LatexRenderer';

// Sidebar Component for Navigation
function PreviewSidebar({ 
  questions, 
  onQuestionClick,
  practiceSet 
}) {
  const [activeQuestion, setActiveQuestion] = useState(null);
  
  // Track which question is currently visible
  useEffect(() => {
    const handleScroll = () => {
      const questionElements = document.querySelectorAll('[data-question-index]');
      
      for (let element of questionElements) {
        const rect = element.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
          const index = element.getAttribute('data-question-index');
          setActiveQuestion(parseInt(index));
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [questions]);

  const handleQuestionClick = (questionIndex) => {
    setActiveQuestion(questionIndex);
    onQuestionClick(questionIndex);
  };

  return (
    <div className="w-80 bg-white border border-gray-200 rounded-xl shadow-sm m-4 sticky top-20 self-start">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1 truncate">
            {practiceSet.title}
          </h2>
          <div className="text-sm text-gray-600 mb-2">
            {questions.length} Questions • {(practiceSet.domains || []).length} Domains
          </div>
        </div>
        
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Questions
            </div>
            <div className="text-lg font-bold text-gray-900">{questions.length}</div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Domains
            </div>
            <div className="text-lg font-bold text-gray-900">{(practiceSet.domains || []).length}</div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Preview
            </div>
            <div className="text-lg font-bold text-gray-900">Live</div>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Question Navigation</h3>
          <p className="text-xs text-gray-500 mb-3">Click any number to jump to that question</p>
        </div>
        
        {/* Question Grid - Scrollable with hidden scrollbar */}
        <div className="max-h-72 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-5 gap-2 p-2">
            {questions.map((question, questionIndex) => {
              const isActive = activeQuestion === questionIndex;
              
              return (
                <button
                  key={questionIndex}
                  onClick={() => handleQuestionClick(questionIndex)}
                  aria-label={`Question ${questionIndex + 1}`}
                  className={`
                    w-10 h-10 rounded-lg text-sm font-semibold border-2 transition-all duration-200
                    hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${isActive 
                      ? 'bg-purple-100 text-purple-700 border-purple-300 ring-2 ring-purple-200 ring-offset-1' 
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                    }
                  `}
                  title={`Question ${questionIndex + 1} - ${question.domain || 'Uncategorized'}`}
                >
                  {questionIndex + 1}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
              <span className="text-gray-600">Currently viewing</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
              <span className="text-gray-600">Other questions</span>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar { 
          display: none;
        }
      `}</style>
    </div>
  );
}

export default function PreviewPracticeSet() {
  const router = useRouter();
  const [practiceSet, setPracticeSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const fetchPracticeSet = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionIdParam = urlParams.get('sessionId');
        
        if (!sessionIdParam) {
          console.error('Preview page - No session ID in URL');
          router.push('/admin/practice-sets/create');
          return;
        }

        setSessionId(sessionIdParam);
        console.log('Preview page - Fetching data for session:', sessionIdParam);

        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            const response = await apiGet(`/api/admin/practice-sets/draft?sessionId=${sessionIdParam}`);
            const data = await response.json();

            console.log('Preview page - API response (attempt', retryCount + 1, '):', data);

            if (data.success && data.draft) {
              setPracticeSet({
                title: data.draft.title,
                description: data.draft.description,
                domains: data.draft.domains,
                questions: data.draft.questions
              });
              console.log('Preview page - Practice set loaded:', {
                title: data.draft.title,
                questionsCount: data.draft.questions?.length || 0
              });
              return;
            } else if (retryCount === maxRetries - 1) {
              console.error('Preview page - Draft not found after retries:', data);
              alert('Draft not found or expired. Please try creating the practice set again.');
              router.push('/admin/practice-sets/create');
              return;
            } else {
              console.warn('Preview page - Retrying in 500ms...');
              await new Promise(resolve => setTimeout(resolve, 500));
              retryCount++;
            }
          } catch (fetchError) {
            console.error('Preview page - Fetch error (attempt', retryCount + 1, '):', fetchError);
            if (retryCount === maxRetries - 1) {
              throw fetchError;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            retryCount++;
          }
        }
      } catch (error) {
        console.error('Error fetching practice set:', error);
        alert('Failed to load practice set. Please try again.');
        router.push('/admin/practice-sets/create');
      } finally {
        setLoading(false);
      }
    };

    fetchPracticeSet();
  }, [router]);

  // Auto-save function
  const autoSaveDraft = useCallback(async () => {
    if (!sessionId || !practiceSet) return;

    setAutoSaving(true);
    
    try {
      const response = await apiPut('/api/admin/practice-sets/draft', {
        sessionId,
        title: practiceSet.title,
        description: practiceSet.description,
        domains: practiceSet.domains,
        questions: practiceSet.questions
      });

      const data = await response.json();
      
      if (data.success) {
        setLastSaved(new Date());
        console.log('Auto-saved successfully');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [sessionId, practiceSet]);

  // Debounced auto-save
  useEffect(() => {
    if (!practiceSet || !sessionId) return;

    const timer = setTimeout(() => {
      autoSaveDraft();
    }, 2000);

    return () => clearTimeout(timer);
  }, [practiceSet, autoSaveDraft]);

  const handlePublish = async () => {
    if (!practiceSet || !sessionId) return;

    setLoading(true);
    
    try {
      await autoSaveDraft();

      const response = await apiPost('/api/admin/practice-sets/publish', {
        sessionId,
        isLive: true
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        router.push('/admin/practice-sets');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error publishing practice set:', error);
      alert('Failed to publish practice set');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!practiceSet || !sessionId) return;

    setLoading(true);
    
    try {
      await autoSaveDraft();

      const response = await apiPost('/api/admin/practice-sets/publish', {
        sessionId,
        isLive: false
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        router.push('/admin/practice-sets');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving practice set:', error);
      alert('Failed to save practice set');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (type, questionIndex, optionIndex = null, currentValue) => {
    setEditingField({ type, questionIndex, optionIndex });
    setEditValue(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = () => {
    if (!editingField || !practiceSet) return;

    const { type, questionIndex, optionIndex } = editingField;
    const updatedQuestions = [...practiceSet.questions];
    const questionToUpdate = updatedQuestions[questionIndex];

    if (!questionToUpdate) return;

    switch (type) {
      case 'question':
        questionToUpdate.text = editValue;
        break;
      case 'option':
        if (optionIndex !== null && questionToUpdate.options[optionIndex]) {
          questionToUpdate.options[optionIndex].text = editValue;
        }
        break;
      case 'explanation':
        questionToUpdate.explanation = editValue;
        break;
      case 'correctAnswer':
        questionToUpdate.correctAnswer = editValue;
        break;
    }

    setPracticeSet({
      ...practiceSet,
      questions: updatedQuestions
    });

    cancelEditing();
  };

  const handleImageUpload = async (questionIndex, type, optionIndex = null) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploadingImage(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', type === 'question' ? 'question' : 'option');

      console.log('Uploading image:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        entityType: type === 'question' ? 'question' : 'option'
      });

      try {
        // Get authentication token for the upload
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No active session. Please log in again.');
        }

        // Use regular fetch with auth headers but WITHOUT Content-Type
        // FormData automatically sets the correct multipart/form-data content type
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'X-Supabase-Auth': session.access_token
            // DO NOT set Content-Type - let browser set it automatically for FormData
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Upload failed');
        }

        const data = await response.json();
        console.log('Upload response:', data);
        
        const imageUrl = data.file?.url || data.url;

        if (!imageUrl) {
          throw new Error('No image URL returned from upload');
        }

        // Update the image URL in the question/option
        const updatedQuestions = [...practiceSet.questions];
        const questionToUpdate = updatedQuestions[questionIndex];

        if (!questionToUpdate) return;

        if (type === 'question') {
          questionToUpdate.image = imageUrl;
        } else if (type === 'option' && optionIndex !== null) {
          if (!questionToUpdate.options[optionIndex].image) {
            questionToUpdate.options[optionIndex] = {
              ...questionToUpdate.options[optionIndex],
              image: imageUrl
            };
          } else {
            questionToUpdate.options[optionIndex].image = imageUrl;
          }
        }

        setPracticeSet({
          ...practiceSet,
          questions: updatedQuestions
        });

        console.log('Image uploaded successfully:', imageUrl);
      } catch (error) {
        console.error('Upload error details:', {
          error,
          message: error.message,
          stack: error.stack
        });
        
        // Show more detailed error to user
        let errorMessage = 'Failed to upload image: ';
        if (error.message.includes('session')) {
          errorMessage += 'Please log in again.';
        } else {
          errorMessage += error.message;
        }
        
        alert(errorMessage);
      } finally {
        setUploadingImage(false);
      }
    };

    input.click();
  };

  const removeImage = (questionIndex, type, optionIndex = null) => {
    const updatedQuestions = [...practiceSet.questions];
    const questionToUpdate = updatedQuestions[questionIndex];

    if (!questionToUpdate) return;

    if (type === 'question') {
      delete questionToUpdate.image;
    } else if (type === 'option' && optionIndex !== null) {
      delete questionToUpdate.options[optionIndex].image;
    }

    setPracticeSet({
      ...practiceSet,
      questions: updatedQuestions
    });
  };

  const scrollToQuestion = (questionIndex) => {
    const element = document.querySelector(`[data-question-index="${questionIndex}"]`);
    if (element) {
      const navbarHeight = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (!practiceSet) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading preview...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const hasQuestions = (practiceSet.questions || []).length > 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push(`/admin/practice-sets/create${sessionId ? `?sessionId=${sessionId}` : ''}`)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Edit</span>
                </button>
                <div className="text-gray-400">/</div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{practiceSet.title}</h1>
                  <p className="text-sm text-gray-600">Editable Preview - Click any text or image to edit</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Auto-save status */}
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {autoSaving && (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  )}
                  {lastSaved && !autoSaving && (
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  )}
                </div>
                
                <button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Draft</span>
                </button>
                
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish Live</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex max-w-7xl mx-auto">
          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Practice Set Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 mb-6 border border-gray-200"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Book className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{practiceSet.title}</h2>
                  {practiceSet.description && (
                    <p className="text-gray-600 mb-4">{practiceSet.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Domains: {(practiceSet.domains || []).join(', ')}</span>
                    <span>•</span>
                    <span>{(practiceSet.questions || []).length} Questions</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* No Questions Message */}
            {!hasQuestions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center"
              >
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Questions Found</h3>
                <p className="text-yellow-700 mb-4">
                  This practice set doesn't have any questions yet. Please go back and add some questions.
                </p>
                <button
                  onClick={() => router.push(`/admin/practice-sets/create${sessionId ? `?sessionId=${sessionId}` : ''}`)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Add Questions
                </button>
              </motion.div>
            )}

            {/* Questions */}
            {hasQuestions && (
              <div className="space-y-6">
                {practiceSet.questions.map((question, questionIndex) => (
                  <motion.div
                    key={questionIndex}
                    data-question-index={questionIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: questionIndex * 0.05 }}
                    className="bg-white rounded-xl p-6 border border-gray-200"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="w-8 h-8 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center text-sm font-bold">
                          {questionIndex + 1}
                        </span>
                        <span className="text-sm text-blue-600 font-medium">
                          {question.domain || 'Uncategorized'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {editingField?.type === 'correctAnswer' && 
                         editingField?.questionIndex === questionIndex ? (
                          <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            className="px-2 py-1 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            autoFocus
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        ) : (
                          <span 
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full cursor-pointer hover:bg-green-200"
                            onClick={() => startEditing('correctAnswer', questionIndex, null, question.correctAnswer)}
                          >
                            Answer: {question.correctAnswer}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Text */}
                    <div className="mb-6">
                      {editingField?.type === 'question' && 
                       editingField?.questionIndex === questionIndex ? (
                        <div className="relative">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                e.preventDefault();
                                saveEdit();
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelEditing();
                              }
                            }}
                            className="w-full p-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                            rows={3}
                            placeholder="Enter question text... (Ctrl+Enter to save, Esc to cancel)"
                            autoFocus
                          />
                          <div className="absolute bottom-2 right-2 flex space-x-2">
                            <button
                              onClick={cancelEditing}
                              className="p-1 text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={saveEdit}
                              className="p-1 text-green-500 hover:text-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="text-lg text-gray-900 leading-relaxed group relative cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                          onClick={() => startEditing('question', questionIndex, null, question.text)}
                        >
                          <ProcessLatexText text={question.text} />
                          <Edit2 className="w-4 h-4 text-gray-400 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      
                      {/* Question Image */}
                      <div className="mt-4">
                        {question.image ? (
                          <div className="relative inline-block group">
                            <img
                              src={question.image}
                              alt="Question"
                              className="max-w-full h-auto rounded-lg border border-gray-200"
                            />
                            <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleImageUpload(questionIndex, 'question')}
                                disabled={uploadingImage}
                                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                                title="Change image"
                              >
                                <Upload className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeImage(questionIndex, 'question')}
                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                title="Remove image"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleImageUpload(questionIndex, 'question')}
                            disabled={uploadingImage}
                            className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 px-3 py-2 border border-dashed border-gray-300 rounded-lg hover:border-blue-300 disabled:opacity-50"
                          >
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-sm">
                              {uploadingImage ? 'Uploading...' : 'Add image'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3 mb-6">
                      {(question.options || []).map((option, optIndex) => {
                        const isCorrect = option.key === question.correctAnswer;
                        const isEditingOption = editingField?.type === 'option' && 
                                              editingField?.questionIndex === questionIndex &&
                                              editingField?.optionIndex === optIndex;
                        
                        return (
                          <div
                            key={optIndex}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                              isCorrect 
                                ? 'bg-green-50 border-green-300 text-green-900'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {option.key}
                              </div>
                              <div className="flex-1">
                                {isEditingOption ? (
                                  <div className="relative">
                                    <textarea
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.ctrlKey) {
                                          e.preventDefault();
                                          saveEdit();
                                        } else if (e.key === 'Escape') {
                                          e.preventDefault();
                                          cancelEditing();
                                        }
                                      }}
                                      className="w-full p-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      rows={2}
                                      placeholder="Enter option text... (Ctrl+Enter to save, Esc to cancel)"
                                      autoFocus
                                    />
                                    <div className="absolute bottom-1 right-1 flex space-x-1">
                                      <button
                                        onClick={cancelEditing}
                                        className="p-1 text-gray-500 hover:text-gray-700 bg-white rounded"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={saveEdit}
                                        className="p-1 text-green-500 hover:text-green-700 bg-white rounded"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div 
                                    className="group relative cursor-pointer hover:bg-gray-100 p-1 rounded"
                                    onClick={() => startEditing('option', questionIndex, optIndex, option.text)}
                                  >
                                    <ProcessLatexText text={option.text} />
                                    <Edit2 className="w-3 h-3 text-gray-400 absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                )}
                                
                                {/* Option Image */}
                                {option.image ? (
                                  <div className="mt-2 relative inline-block group">
                                    <img
                                      src={option.image}
                                      alt={`Option ${option.key}`}
                                      className="max-w-full h-24 object-contain rounded border border-gray-200"
                                    />
                                    <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleImageUpload(questionIndex, 'option', optIndex)}
                                        disabled={uploadingImage}
                                        className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                        title="Change image"
                                      >
                                        <Upload className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => removeImage(questionIndex, 'option', optIndex)}
                                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                                        title="Remove image"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleImageUpload(questionIndex, 'option', optIndex)}
                                    disabled={uploadingImage}
                                    className="mt-2 flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 px-2 py-1 border border-dashed border-gray-300 rounded hover:border-blue-300 disabled:opacity-50"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    <span>{uploadingImage ? 'Uploading...' : 'Add image'}</span>
                                  </button>
                                )}
                              </div>
                              {isCorrect && (
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center justify-between">
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-2" />
                          Explanation
                        </span>
                        {!question.explanation && !editingField && (
                          <button
                            onClick={() => startEditing('explanation', questionIndex, null, '')}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Add explanation
                          </button>
                        )}
                      </h4>
                      {editingField?.type === 'explanation' && 
                       editingField?.questionIndex === questionIndex ? (
                        <div className="relative">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                e.preventDefault();
                                saveEdit();
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelEditing();
                              }
                            }}
                            className="w-full p-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={3}
                            placeholder="Add explanation... (Ctrl+Enter to save, Esc to cancel)"
                            autoFocus
                          />
                          <div className="absolute bottom-2 right-2 flex space-x-2">
                            <button
                              onClick={cancelEditing}
                              className="p-1 text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={saveEdit}
                              className="p-1 text-green-500 hover:text-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : question.explanation ? (
                        <div 
                          className="text-blue-800 text-sm leading-relaxed group relative cursor-pointer hover:bg-blue-100 p-1 rounded"
                          onClick={() => startEditing('explanation', questionIndex, null, question.explanation)}
                        >
                          <ProcessLatexText text={question.explanation} />
                          <Edit2 className="w-3 h-3 text-blue-600 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm italic">No explanation provided</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          {hasQuestions && (
            <PreviewSidebar
              questions={practiceSet.questions}
              onQuestionClick={scrollToQuestion}
              practiceSet={practiceSet}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 