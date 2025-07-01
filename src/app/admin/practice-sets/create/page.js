'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiPost, apiPut, apiGet, apiDelete } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Eye,
  FileText,
  CheckCircle,
  AlertCircle,
  Save,
  Send,
  Copy,
  HelpCircle,
  X
} from 'lucide-react';
import ProtectedRoute from '../../../components/ProtectedRoute';

// Helper function for authenticated file uploads
const uploadFileWithAuth = async (file, entityType, entityId = null) => {
  try {
    // Get current session for authentication
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      throw new Error('No authenticated session found');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    if (entityId) {
      formData.append('entityId', entityId.toString());
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    });

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export default function CreatePracticeSet() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domains: [],
    testType: 'practice',
    duration: 120,
    totalQuestions: 50,
    difficulty: 'medium',
    passingPercentage: 40,
    instructions: '',
    isFree: true,
    price: 0,
    // Negative marking fields
    enableNegativeMarking: true,
    negativeMarkingRatio: 0.25,
    isScheduled: false,
    scheduledDate: '',
    scheduledTime: '',
    registrationDeadline: '',
    availableUntil: ''
  });
  const [jsonInput, setJsonInput] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [parseError, setParseError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [draftId, setDraftId] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [practiceSetId, setPracticeSetId] = useState(null);
  const [activeTab, setActiveTab] = useState('practice-set'); 
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Individual question form state
  const [individualQuestion, setIndividualQuestion] = useState({
    domain: '',
    text: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    difficulty: 'medium',
    questionImage: null,
    optionImages: { A: null, B: null, C: null, D: null }
  });

  // Question set state
  const [questionSetForm, setQuestionSetForm] = useState({
    name: '',
    description: '',
    questionsJson: ''
  });

  // Test type definitions
  const testTypes = [
    { value: 'practice', label: 'Practice Set', description: 'Standard practice question set' },
    { value: 'full_syllabus', label: 'Full Syllabus Test', description: 'Comprehensive test covering all topics' },
    { value: 'domain_specific', label: 'Domain Specific', description: 'Focus on specific subject areas' },
    { value: 'weekly_domain', label: 'Weekly Domain Test', description: 'Weekly test for specific domains' },
    { value: 'weekly_full', label: 'Weekly Full Test', description: 'Weekly comprehensive test' },
    { value: 'daily_quiz', label: 'Daily Quiz', description: 'Short daily practice quiz' },
    { value: 'mini_quiz', label: 'Mini Quiz', description: 'Quick assessment with few questions' }
  ];

  const difficultyLevels = [
    { value: 'very_easy', label: 'Very Easy' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'very_hard', label: 'Very Hard' }
  ];

  const exampleJSON = `[
  {
    "domain": "Botany",
    "text": "For any three sets A, B, C if A ∪ B = A ∪ C & A ∩ B = A ∩ C, then?",
    "options": [
      { "text": "A = B", "image": null },
      { "text": "A = C", "image": null },
      { "text": "B = C", "image": null },
      { "text": "A = B = C", "image": null }
    ],
    "correctAnswer": "C",
    "explanation": "From the given conditions A ∪ B = A ∪ C and A ∩ B = A ∩ C, we can derive that B = C using set theory.",
    "image": null,
    "difficulty": "medium"
  },
  {
    "domain": "Physics",
    "text": "The domain of 1/√((x−4)(x−5)) is?",
    "options": [
      { "text": "(-∞,4)∪(5,∞)", "image": null },
      { "text": "(-∞,4]∪[5,∞)", "image": null },
      { "text": "(-∞,4]∪(5,∞)", "image": null },
      { "text": "None", "image": null }
    ],
    "correctAnswer": "A",
    "explanation": "For the function to be defined, the expression under the square root must be positive: (x−4)(x−5) > 0.",
    "image": null,
    "difficulty": "hard"
  },
  {
    "domain": "Chemistry",
    "text": "What is the molecular formula of benzene?",
    "options": [
      { "text": "C6H6", "image": null },
      { "text": "C6H12", "image": null },
      { "text": "C8H8", "image": null },
      { "text": "C6H14", "image": null }
    ],
    "correctAnswer": "A",
    "explanation": "Benzene has the molecular formula C6H6, consisting of 6 carbon atoms and 6 hydrogen atoms arranged in a ring structure.",
    "image": null,
    "difficulty": "easy"
  },
  {
    "domain": "Zoology",
    "text": "Which of the following is the largest mammal?",
    "options": [
      { "text": "African Elephant", "image": null },
      { "text": "Blue Whale", "image": null },
      { "text": "Giraffe", "image": null },
      { "text": "Hippopotamus", "image": null }
    ],
    "correctAnswer": "B",
    "explanation": "The Blue Whale is the largest mammal and the largest animal ever known to have lived on Earth.",
    "image": null,
    "difficulty": "easy"
  },
  {
    "domain": "MAT",
    "text": "If 2x + 3y = 12 and x - y = 1, what is the value of x?",
    "options": [
      { "text": "3", "image": null },
      { "text": "2", "image": null },
      { "text": "4", "image": null },
      { "text": "5", "image": null }
    ],
    "correctAnswer": "A",
    "explanation": "Solving the system of equations: From x - y = 1, we get x = y + 1. Substituting into 2x + 3y = 12: 2(y + 1) + 3y = 12, which gives y = 2 and x = 3.",
    "image": null,
    "difficulty": "medium"
  }
]  `;

  // Auto-save function
  const autoSaveDraft = async () => {
    if (!sessionId || autoSaving) return;
    
    console.log('Auto-saving draft:', {
      sessionId,
      questionsCount: parsedQuestions.length,
      title: formData.title
    });
    
    setAutoSaving(true);
    try {
      // Sanitize numeric values to prevent empty string errors
      const sanitizedData = {
        sessionId,
        title: formData.title,
        description: formData.description,
        domains: formData.domains,
        questions: parsedQuestions,
        // Enhanced fields
        testType: formData.testType,
        duration: formData.duration === '' ? 120 : Number(formData.duration) || 120,
        totalQuestions: formData.totalQuestions === '' ? 50 : Number(formData.totalQuestions) || 50,
        difficulty: formData.difficulty,
        passingPercentage: formData.passingPercentage === '' ? 40 : Number(formData.passingPercentage) || 40,
        instructions: formData.instructions,
        isFree: formData.isFree,
        price: formData.price === '' ? 0 : Number(formData.price) || 0,
        // Negative marking fields
        enableNegativeMarking: formData.enableNegativeMarking,
        negativeMarkingRatio: formData.negativeMarkingRatio === '' ? 0.25 : Number(formData.negativeMarkingRatio) || 0.25,
        isScheduled: formData.isScheduled,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        registrationDeadline: formData.registrationDeadline,
        availableUntil: formData.availableUntil
      };

      const response = await apiPut('/api/admin/practice-sets/draft', sanitizedData);

      const data = await response.json();
      console.log('Auto-save response:', data);
      if (data.success) {
        setLastSaved(new Date());
        console.log('Auto-save successful');
      } else {
        console.error('Auto-save failed:', data.message);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  // Initialize or restore session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Check URL params for editing existing practice set
        const urlParams = new URLSearchParams(window.location.search);
        const existingId = urlParams.get('edit');
        const existingSessionId = urlParams.get('sessionId');
        
        // Try to restore from localStorage first
        const savedSessionId = localStorage.getItem('practiceSetSessionId');
        const savedPracticeSetId = localStorage.getItem('practiceSetId');
        
        // Try to restore session from URL or localStorage
        const sessionToRestore = existingSessionId || savedSessionId;
        
        if (sessionToRestore && !existingId) {
          try {
            const response = await apiGet(`/api/admin/practice-sets/draft?sessionId=${sessionToRestore}`);
            const data = await response.json();
            
            if (data.success && data.draft) {
              setSessionId(sessionToRestore);
              setPracticeSetId(data.draft.practiceSetId);
              setFormData({
                title: data.draft.title || '',
                description: data.draft.description || '',
                domains: data.draft.domains || [],
                testType: data.draft.testType || 'practice',
                duration: data.draft.duration || 120,
                totalQuestions: data.draft.totalQuestions || 50,
                difficulty: data.draft.difficulty || 'medium',
                passingPercentage: data.draft.passingPercentage || 40,
                instructions: data.draft.instructions || '',
                isFree: data.draft.isFree || true,
                price: data.draft.price || 0,
                enableNegativeMarking: data.draft.enableNegativeMarking !== undefined ? data.draft.enableNegativeMarking : true,
                negativeMarkingRatio: data.draft.negativeMarkingRatio || 0.25,
                isScheduled: data.draft.isScheduled || false,
                scheduledDate: data.draft.scheduledDate || '',
                scheduledTime: data.draft.scheduledTime || '',
                registrationDeadline: data.draft.registrationDeadline || '',
                availableUntil: data.draft.availableUntil || ''
              });
              setParsedQuestions(data.draft.questions || []);
              
              // Save to localStorage and URL
              localStorage.setItem('practiceSetSessionId', sessionToRestore);
              localStorage.setItem('practiceSetId', data.draft.practiceSetId);
              
              // Update URL to include sessionId for future refreshes
              const newUrl = new URL(window.location);
              newUrl.searchParams.set('sessionId', sessionToRestore);
              window.history.replaceState({}, '', newUrl);
              
              console.log('Session restored successfully:', sessionToRestore);
              return;
            } else {
              console.warn('Failed to restore session:', data.message);
              // Session expired, clear localStorage
              localStorage.removeItem('practiceSetSessionId');
              localStorage.removeItem('practiceSetId');
            }
          } catch (error) {
            console.error('Failed to restore session:', error);
            localStorage.removeItem('practiceSetSessionId');
            localStorage.removeItem('practiceSetId');
          }
        }
        
        if (existingId) {
          // Start editing session for existing practice set
          const response = await apiPost('/api/admin/practice-sets/draft', {
            practiceSetId: existingId
          });

          const data = await response.json();
          if (data.success) {
            setSessionId(data.sessionId);
            setPracticeSetId(existingId);
            if (data.draft) {
              setFormData({
                title: data.draft.title || '',
                description: data.draft.description || '',
                domains: data.draft.domains || [],
                testType: data.draft.testType || 'practice',
                duration: data.draft.duration || 120,
                totalQuestions: data.draft.totalQuestions || 50,
                difficulty: data.draft.difficulty || 'medium',
                passingPercentage: data.draft.passingPercentage || 40,
                instructions: data.draft.instructions || '',
                isFree: data.draft.isFree || true,
                price: data.draft.price || 0,
                enableNegativeMarking: data.draft.enableNegativeMarking !== undefined ? data.draft.enableNegativeMarking : true,
                negativeMarkingRatio: data.draft.negativeMarkingRatio || 0.25,
                isScheduled: data.draft.isScheduled || false,
                scheduledDate: data.draft.scheduledDate || '',
                scheduledTime: data.draft.scheduledTime || '',
                registrationDeadline: data.draft.registrationDeadline || '',
                availableUntil: data.draft.availableUntil || ''
              });
              setParsedQuestions(data.draft.questions || []);
            }
            
            // Save to localStorage and URL
            localStorage.setItem('practiceSetSessionId', data.sessionId);
            localStorage.setItem('practiceSetId', existingId);
            
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('sessionId', data.sessionId);
            newUrl.searchParams.delete('edit');
            window.history.replaceState({}, '', newUrl);
          } else if (response.status === 409) {
            alert('This practice set is being edited by someone else.');
            router.push('/admin/practice-sets');
          } else {
            alert('Failed to start editing session: ' + data.message);
            router.push('/admin/practice-sets');
          }
        } else {
          // Create new practice set only if no session could be restored
          console.log('Creating new practice set session...');
          
          const response = await apiPost('/api/admin/practice-sets/draft', {
            title: 'Untitled Practice Set',
            description: '',
            domains: [],
            testType: 'practice',
            duration: 120,
            totalQuestions: 50,
            difficulty: 'medium',
            passingPercentage: 40,
            instructions: '',
            isFree: true,
            price: 0,
            enableNegativeMarking: true,
            negativeMarkingRatio: 0.25,
            isScheduled: false,
            scheduledDate: '',
            scheduledTime: '',
            registrationDeadline: '',
            availableUntil: ''
          });

          const data = await response.json();
          if (data.success) {
            setSessionId(data.sessionId);
            setPracticeSetId(data.practiceSetId);
            setFormData({
              title: data.draft.title || '',
              description: data.draft.description || '',
              domains: data.draft.domains || [],
              testType: data.draft.testType || 'practice',
              duration: data.draft.duration || 120,
              totalQuestions: data.draft.totalQuestions || 50,
              difficulty: data.draft.difficulty || 'medium',
              passingPercentage: data.draft.passingPercentage || 40,
              instructions: data.draft.instructions || '',
              isFree: data.draft.isFree || true,
              price: data.draft.price || 0,
              enableNegativeMarking: data.draft.enableNegativeMarking !== undefined ? data.draft.enableNegativeMarking : true,
              negativeMarkingRatio: data.draft.negativeMarkingRatio || 0.25,
              isScheduled: data.draft.isScheduled || false,
              scheduledDate: data.draft.scheduledDate || '',
              scheduledTime: data.draft.scheduledTime || '',
              registrationDeadline: data.draft.registrationDeadline || '',
              availableUntil: data.draft.availableUntil || ''
            });
            
            // Save to localStorage and URL
            localStorage.setItem('practiceSetSessionId', data.sessionId);
            localStorage.setItem('practiceSetId', data.practiceSetId);
            
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('sessionId', data.sessionId);
            window.history.replaceState({}, '', newUrl);
            
            console.log('New session created successfully:', data.sessionId);
          } else {
            alert('Failed to create new practice set: ' + data.message);
          }
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };

    initializeSession();
  }, [router]);

  // Auto-save when data changes
  useEffect(() => {
    if (sessionId) {
      const timeoutId = setTimeout(() => {
        autoSaveDraft();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [formData, parsedQuestions, sessionId]);

  // Clean up session on unmount and handle beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (sessionId) {
        // Auto-save before leaving
        autoSaveDraft();
        // Note: Don't clean up session on page refresh, only on actual navigation away
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && sessionId) {
        // Auto-save when page becomes hidden
        autoSaveDraft();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Only clean up if we're actually unmounting (not just refreshing)
      // The session will be restored on next load via localStorage
    };
  }, [sessionId]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // For number inputs, ensure we store proper numeric values or defaults
    if (type === 'number') {
      const numericFields = {
        duration: 120,
        totalQuestions: 50,
        passingPercentage: 40,
        price: 0,
        negativeMarkingRatio: 0.25
      };
      
      // If value is empty, keep it empty for user experience (they're still typing)
      // The auto-save function will handle the sanitization
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDomainsChange = (e) => {
    const domains = e.target.value.split(',').map(d => d.trim()).filter(d => d);
    setFormData(prev => ({
      ...prev,
      domains
    }));
  };

  const parseJSON = () => {
    try {
      setParseError('');
      const parsed = JSON.parse(jsonInput);
      
      // Validate structure
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of questions');
      }

      const validatedQuestions = parsed.map((q, index) => {
        if (!q.domain || !q.text || !q.options || !q.correctAnswer) {
          throw new Error(`Question ${index + 1}: Missing required fields (domain, text, options, correctAnswer)`);
        }
        
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Question ${index + 1}: Must have exactly 4 options`);
        }

        if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
          throw new Error(`Question ${index + 1}: correctAnswer must be A, B, C, or D`);
        }

        return {
          ...q,
          id: `temp_${Date.now()}_${index}`,
          options: q.options.map((opt, optIndex) => ({
            text: typeof opt === 'string' ? opt : opt.text,
            image: opt.image || null,
            key: ['A', 'B', 'C', 'D'][optIndex]
          }))
        };
      });

      setParsedQuestions(validatedQuestions);
      
      // Auto-fill domains if not already set
      if (formData.domains.length === 0) {
        const uniqueDomains = [...new Set(validatedQuestions.map(q => q.domain))];
        setFormData(prev => ({
          ...prev,
          domains: uniqueDomains
        }));
      }

    } catch (error) {
      setParseError(error.message);
      setParsedQuestions([]);
    }
  };

  const handleImageUpload = async (questionIndex, type, optionIndex = null) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setUploadingImage(true);
        
        try {
          const result = await uploadFileWithAuth(file, 'question', questionIndex);
          
          if (result.success) {
            const imageUrl = result.file.url;
            
            setParsedQuestions(prev => {
              const updated = [...prev];
              if (type === 'question') {
                updated[questionIndex].image = imageUrl;
              } else if (type === 'option' && optionIndex !== null) {
                updated[questionIndex].options[optionIndex].image = imageUrl;
              }
              return updated;
            });
          } else {
            alert('Failed to upload image: ' + result.message);
          }
        } catch (error) {
          console.error('Image upload error:', error);
          alert('Failed to upload image');
        } finally {
          setUploadingImage(false);
        }
      }
    };
    
    input.click();
  };

  const removeImage = (questionIndex, type, optionIndex = null) => {
    setParsedQuestions(prev => {
      const updated = [...prev];
      if (type === 'question') {
        updated[questionIndex].image = null;
      } else if (type === 'option' && optionIndex !== null) {
        updated[questionIndex].options[optionIndex].image = null;
      }
      return updated;
    });
  };

  const handlePreview = async () => {
    console.log('Preview clicked - questions count:', parsedQuestions.length);
    console.log('Preview clicked - session ID:', sessionId);
    
    if (parsedQuestions.length === 0) {
      alert('Please parse questions first');
      return;
    }

    if (!sessionId) {
      alert('Session not initialized. Please refresh the page.');
      return;
    }

    // Show loading state
    setLoading(true);
    
    try {
      console.log('Starting auto-save before preview...');
      
      // Ensure we have the latest data
      const saveData = {
        sessionId,
        title: formData.title,
        description: formData.description,
        domains: formData.domains,
        questions: parsedQuestions
      };
      
      console.log('Saving data:', {
        sessionId: saveData.sessionId,
        questionsCount: saveData.questions.length,
        title: saveData.title
      });
      
      // Auto-save before preview with explicit error handling
      const response = await apiPut('/api/admin/practice-sets/draft', saveData);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to save draft');
      }
      
      console.log('Auto-save completed successfully, navigating to preview...');
      
      // Small delay to ensure save is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to preview with session ID
      router.push(`/admin/practice-sets/preview?sessionId=${sessionId}`);
    } catch (error) {
      console.error('Preview failed:', error);
      alert(`Failed to save draft before preview: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Clean up session
  const cleanupSession = async () => {
    if (sessionId) {
      try {
        const response = await apiDelete(`/api/admin/practice-sets/draft?sessionId=${sessionId}`);
        const data = await response.json();
        
        if (data.success && data.message) {
          // Show user what happened
          console.log(data.message);
          // You could also show a toast notification here if you have a toast system
        }
        
        // Clear localStorage
        localStorage.removeItem('practiceSetSessionId');
        localStorage.removeItem('practiceSetId');
        
        // Clear session state
        setSessionId(null);
        setPracticeSetId(null);
      } catch (error) {
        console.error('Failed to cleanup session:', error);
        // Still clear localStorage even if API call fails
        localStorage.removeItem('practiceSetSessionId');
        localStorage.removeItem('practiceSetId');
        setSessionId(null);
        setPracticeSetId(null);
      }
    }
  };

  const handleCancel = async () => {
    let confirmMessage = 'Are you sure you want to cancel?';
    
    if (practiceSetId && practiceSetId !== 'new') {
      confirmMessage = 'Are you sure you want to stop editing? The practice set will be saved as a draft.';
    } else {
      confirmMessage = 'Are you sure you want to cancel? Any unsaved changes will be lost.';
    }
    
    if (confirm(confirmMessage)) {
      await cleanupSession();
      router.push('/admin/practice-sets');
    }
  };

  const handleSave = async (publish = false) => {
    if (!formData.title || parsedQuestions.length === 0) {
      alert('Please fill in title and add questions');
      return;
    }

    if (!sessionId) {
      alert('Session not initialized. Please refresh the page.');
      return;
    }

    setLoading(true);
    
    try {
      // First auto-save current state
      await autoSaveDraft();

      // Then publish
      const response = await apiPost('/api/admin/practice-sets/publish', {
        sessionId,
        isLive: publish
      });

      const data = await response.json();
      
      if (data.success) {
        // Clean up session after successful save
        await cleanupSession();
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

  // Handle individual question creation
  const handleIndividualQuestionSubmit = async () => {
    if (!individualQuestion.domain || !individualQuestion.text || !individualQuestion.correctAnswer) {
      alert('Please fill in all required fields');
      return;
    }

    if (individualQuestion.options.some(opt => !opt.trim())) {
      alert('Please fill in all options');
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiPost('/api/admin/questions/create', {
        domain: individualQuestion.domain,
        text: individualQuestion.text,
        options: individualQuestion.options,
        correctAnswer: individualQuestion.correctAnswer,
        explanation: individualQuestion.explanation,
        difficulty: individualQuestion.difficulty,
        questionImage: individualQuestion.questionImage,
        optionImages: individualQuestion.optionImages
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Question created successfully!');
        // Reset form
        setIndividualQuestion({
          domain: '',
          text: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          explanation: '',
          difficulty: 'medium',
          questionImage: null,
          optionImages: { A: null, B: null, C: null, D: null }
        });
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  // Handle question set creation
  const handleQuestionSetSubmit = async () => {
    if (!questionSetForm.name || !questionSetForm.questionsJson) {
      alert('Please fill in name and questions JSON');
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiPost('/api/admin/question-sets', {
        name: questionSetForm.name,
        description: questionSetForm.description,
        questionsJson: questionSetForm.questionsJson
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Question set created successfully with ${data.domainDistribution ? Object.values(data.domainDistribution).reduce((a, b) => a + b, 0) : 0} questions!`);
        // Reset form
        setQuestionSetForm({
          name: '',
          description: '',
          questionsJson: ''
        });
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating question set:', error);
      alert('Failed to create question set');
    } finally {
      setLoading(false);
    }
  };

  // Handle individual question image upload
  const handleIndividualImageUpload = async (type, optionKey = null) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setUploadingImage(true);
        
        try {
          const result = await uploadFileWithAuth(file, 'question');
          
          if (result.success) {
            const imageUrl = result.file.url;
            
            setIndividualQuestion(prev => {
              if (type === 'question') {
                return { ...prev, questionImage: imageUrl };
              } else if (type === 'option' && optionKey) {
                return { 
                  ...prev, 
                  optionImages: { 
                    ...prev.optionImages, 
                    [optionKey]: imageUrl 
                  } 
                };
              }
              return prev;
            });
          } else {
            alert('Failed to upload image: ' + result.message);
          }
        } catch (error) {
          console.error('Image upload error:', error);
          alert('Failed to upload image');
        } finally {
          setUploadingImage(false);
        }
      }
    };
    
    input.click();
  };

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Practice Sets</span>
                </button>
                <div className="text-gray-400">/</div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {practiceSetId && practiceSetId !== 'new' ? 'Edit Practice Set' : 'Question Management'}
                </h1>
              </div>
              
              {/* Auto-save status */}
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                {autoSaving && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                )}
                {lastSaved && !autoSaving && (
                  <span>
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                {sessionId && (
                  <span className="text-green-600">
                    Session active
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('practice-set')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'practice-set'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Practice Set (JSON)
              </button>
              <button
                onClick={() => setActiveTab('question-set')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'question-set'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Question Set (200 Questions)
              </button>
              <button
                onClick={() => setActiveTab('individual')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'individual'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Individual Question
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Practice Set Tab */}
          {activeTab === 'practice-set' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* Basic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Practice Set Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Mathematics Mock Test 1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Test Type *
                    </label>
                    <select
                      name="testType"
                      value={formData.testType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      {testTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-700 mt-1">
                      {testTypes.find(t => t.value === formData.testType)?.description}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Brief description of the practice set"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Domains (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.domains.join(', ')}
                      onChange={handleDomainsChange}
                      placeholder="e.g., Mathematics, Physics, Chemistry"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                    />
                    <p className="text-xs text-gray-700 mt-1">
                      Domains will be auto-detected from questions if left empty
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Test Configuration */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Configuration</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      min="1"
                      max="480"
                      placeholder="120"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Total Questions *
                    </label>
                    <input
                      type="number"
                      name="totalQuestions"
                      value={formData.totalQuestions}
                      onChange={handleInputChange}
                      min="1"
                      max="200"
                      placeholder="50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Difficulty Level *
                    </label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      {difficultyLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Passing Percentage *
                    </label>
                    <input
                      type="number"
                      name="passingPercentage"
                      value={formData.passingPercentage}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      placeholder="40"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                    />
                  </div>
                </div>
                
                {/* Negative Marking Configuration */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Negative Marking</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="enableNegativeMarking"
                          checked={formData.enableNegativeMarking}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            enableNegativeMarking: e.target.checked
                          }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Enable Negative Marking</span>
                          <p className="text-xs text-gray-700">Deduct marks for incorrect answers</p>
                        </div>
                      </label>
                    </div>
                    
                    {formData.enableNegativeMarking && (
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Negative Marking Ratio
                        </label>
                        <div className="flex items-center space-x-2">
                                                     <input
                             type="number"
                             name="negativeMarkingRatio"
                             value={formData.negativeMarkingRatio}
                             onChange={handleInputChange}
                             min="0"
                             max="1"
                             step="0.01"
                             placeholder="0.25"
                             className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                           />
                          <span className="text-sm text-gray-700">× marks</span>
                        </div>
                        <p className="text-xs text-gray-700 mt-1">
                          E.g., 0.25 means 1/4th mark will be deducted for each wrong answer
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Instructions
                  </label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    placeholder="Special instructions for test takers (optional)"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                  />
                </div>
              </motion.div>

              {/* Access & Pricing */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Access & Pricing</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Test Access Type
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="testAccess"
                          checked={formData.isFree}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            isFree: true,
                            price: 0
                          }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Free Test</span>
                          <p className="text-xs text-gray-700">Accessible to all students including free users</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="testAccess"
                          checked={!formData.isFree}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            isFree: false,
                            price: 1 // Set a default price for paid tests
                          }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Paid Test</span>
                          <p className="text-xs text-gray-700">Only available to premium subscribers</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> {formData.isFree 
                        ? 'Free tests are accessible to all students including free users.' 
                        : 'Paid tests are only available to premium subscribers.'
                      }
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Scheduling (Optional) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduling (Optional)</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isScheduled"
                      name="isScheduled"
                      checked={formData.isScheduled}
                      onChange={(e) => setFormData(prev => ({ ...prev, isScheduled: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isScheduled" className="text-sm font-medium text-gray-900">
                      Schedule this test for a specific date and time
                    </label>
                  </div>
                  
                  {formData.isScheduled && (
                    <div className="space-y-4 pl-7">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Test Date *
                          </label>
                          <input
                            type="date"
                            name="scheduledDate"
                            value={formData.scheduledDate}
                            onChange={handleInputChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Test Time *
                          </label>
                          <input
                            type="time"
                            name="scheduledTime"
                            value={formData.scheduledTime}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Registration Deadline
                          </label>
                          <input
                            type="date"
                            name="registrationDeadline"
                            value={formData.registrationDeadline}
                            onChange={handleInputChange}
                            max={formData.scheduledDate}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                          />
                          <p className="text-xs text-gray-700 mt-1">
                            Leave empty to use test date as deadline
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Available Until
                          </label>
                          <input
                            type="date"
                            name="availableUntil"
                            value={formData.availableUntil}
                            onChange={handleInputChange}
                            min={formData.scheduledDate}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                          />
                          <p className="text-xs text-gray-700 mt-1">
                            Leave empty for no end date
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <strong>Scheduling Info:</strong> Scheduled tests will appear in the upcoming tests section 
                          and will only be available during the specified time period.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* JSON Input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Questions JSON</h2>
                  <button
                    onClick={() => setShowExample(!showExample)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Show Example</span>
                  </button>
                </div>
                
                {showExample && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">Example JSON Format:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(exampleJSON);
                          alert('Example copied to clipboard!');
                        }}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {exampleJSON}
                    </pre>
                  </div>
                )}
                
                <div className="space-y-4">
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder="Paste your ChatGPT OCR JSON result here..."
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm placeholder:text-gray-500 text-gray-900"
                  />
                  
                  {parseError && (
                    <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div className="text-sm text-red-700">
                        <strong>Parse Error:</strong> {parseError}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={parseJSON}
                    disabled={!jsonInput.trim()}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Parse Questions</span>
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Preview */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 border border-gray-200 sticky top-8"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Questions Preview ({parsedQuestions.length})
                </h2>
                
                {parsedQuestions.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {parsedQuestions.slice(0, 3).map((question, index) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-blue-600">
                            {question.domain} - Q{index + 1}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleImageUpload(index, 'question')}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Add image to question"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-900 mb-3">{question.text}</div>
                        
                        {question.image && (
                          <div className="relative mb-3">
                            <img
                              src={question.image}
                              alt="Question"
                              className="max-w-full h-32 object-contain rounded"
                            />
                            <button
                              onClick={() => removeImage(index, 'question')}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        
                        <div className="space-y-1">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`flex items-center justify-between p-2 rounded text-xs ${
                                option.key === question.correctAnswer
                                  ? 'bg-green-50 text-green-800'
                                  : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              <span>
                                <strong>{option.key}.</strong> {option.text}
                              </span>
                              <div className="flex items-center space-x-1">
                                {option.image ? (
                                  <div className="relative">
                                    <img
                                      src={option.image}
                                      alt={`Option ${option.key}`}
                                      className="w-8 h-8 object-cover rounded"
                                    />
                                    <button
                                      onClick={() => removeImage(index, 'option', optIndex)}
                                      className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                      <X className="w-2 h-2" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleImageUpload(index, 'option', optIndex)}
                                    className="p-1 text-gray-400 hover:text-blue-600"
                                    title="Add image to option"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                  </button>
                                )}
                                {option.key === question.correctAnswer && (
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {parsedQuestions.length > 3 && (
                      <div className="text-center text-sm text-gray-500">
                        ... and {parsedQuestions.length - 3} more questions
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No questions parsed yet</p>
                    <p className="text-sm">Parse your JSON to see preview</p>
                  </div>
                )}
                
                {parsedQuestions.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                    <button
                      onClick={handlePreview}
                      disabled={loading || parsedQuestions.length === 0}
                      className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-700 px-4 py-2 rounded-lg font-medium"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>Full Preview</span>
                        </>
                      )}
                    </button>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSave(false)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Draft</span>
                      </button>
                      
                      <button
                        onClick={() => handleSave(true)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                      >
                        <Send className="w-4 h-4" />
                        <span>Publish</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
          )}

          {/* Question Set Tab */}
          {activeTab === 'question-set' && (
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Question Set (200 Questions)</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Create a comprehensive question set with exactly 200 questions across Botany, Zoology, MAT, Physics, and Chemistry domains.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Question Set Name *
                    </label>
                    <input
                      type="text"
                      value={questionSetForm.name}
                      onChange={(e) => setQuestionSetForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Comprehensive MCQ Set 2024"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Description
                    </label>
                    <textarea
                      value={questionSetForm.description}
                      onChange={(e) => setQuestionSetForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the question set"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Questions JSON *
                    </label>
                    <p className="text-xs text-gray-700 mb-2">
                      Paste JSON array with questions from all domains: Botany, Zoology, MAT, Physics, Chemistry
                    </p>
                    <textarea
                      value={questionSetForm.questionsJson}
                      onChange={(e) => setQuestionSetForm(prev => ({ ...prev, questionsJson: e.target.value }))}
                      placeholder="Paste your questions JSON here..."
                      rows={15}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm placeholder:text-gray-500 text-gray-900"
                    />
                  </div>

                  <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-700">
                      <strong>Note:</strong> Ensure your JSON includes questions from all 5 domains: Botany, Zoology, MAT, Physics, and Chemistry. 
                      Each question should have domain, text, options (4), correctAnswer (A/B/C/D), and explanation fields.
                      <br />
                      <a 
                        href="/sample-question-set.json" 
                        download="sample-question-set.json"
                        className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        📁 Download Sample JSON Format
                      </a>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleQuestionSetSubmit}
                    disabled={loading || !questionSetForm.name || !questionSetForm.questionsJson}
                    className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating Question Set...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Create Question Set</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Individual Question Tab */}
          {activeTab === 'individual' && (
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Individual Question</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Create a single question with image upload support for question and options.
                </p>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Domain *
                      </label>
                      <select
                        value={individualQuestion.domain}
                        onChange={(e) => setIndividualQuestion(prev => ({ ...prev, domain: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      >
                        <option value="">Select Domain</option>
                        <option value="Botany">Botany</option>
                        <option value="Zoology">Zoology</option>
                        <option value="MAT">MAT (Mental Agility Test)</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Difficulty
                      </label>
                      <select
                        value={individualQuestion.difficulty}
                        onChange={(e) => setIndividualQuestion(prev => ({ ...prev, difficulty: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      >
                        <option value="very_easy">Very Easy</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="very_hard">Very Hard</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Question Text *
                    </label>
                    <div className="space-y-2">
                      <textarea
                        value={individualQuestion.text}
                        onChange={(e) => setIndividualQuestion(prev => ({ ...prev, text: e.target.value }))}
                        placeholder="Enter your question here..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleIndividualImageUpload('question')}
                          disabled={uploadingImage}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span>Add Image</span>
                        </button>
                        {individualQuestion.questionImage && (
                          <div className="flex items-center space-x-2">
                            <img
                              src={individualQuestion.questionImage}
                              alt="Question"
                              className="w-8 h-8 object-cover rounded"
                            />
                            <button
                              onClick={() => setIndividualQuestion(prev => ({ ...prev, questionImage: null }))}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Options *
                    </label>
                    <div className="space-y-3">
                      {['A', 'B', 'C', 'D'].map((optionKey, index) => (
                        <div key={optionKey} className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-medium text-sm">
                            {optionKey}
                          </div>
                          <input
                            type="text"
                            value={individualQuestion.options[index]}
                            onChange={(e) => {
                              const newOptions = [...individualQuestion.options];
                              newOptions[index] = e.target.value;
                              setIndividualQuestion(prev => ({ ...prev, options: newOptions }));
                            }}
                            placeholder={`Option ${optionKey}`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                          />
                          <button
                            onClick={() => handleIndividualImageUpload('option', optionKey)}
                            disabled={uploadingImage}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                          {individualQuestion.optionImages[optionKey] && (
                            <div className="flex items-center space-x-1">
                              <img
                                src={individualQuestion.optionImages[optionKey]}
                                alt={`Option ${optionKey}`}
                                className="w-6 h-6 object-cover rounded"
                              />
                              <button
                                onClick={() => setIndividualQuestion(prev => ({ 
                                  ...prev, 
                                  optionImages: { ...prev.optionImages, [optionKey]: null } 
                                }))}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Correct Answer *
                    </label>
                    <select
                      value={individualQuestion.correctAnswer}
                      onChange={(e) => setIndividualQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select Correct Answer</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Explanation
                    </label>
                    <textarea
                      value={individualQuestion.explanation}
                      onChange={(e) => setIndividualQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                      placeholder="Explain why this is the correct answer..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                    />
                  </div>
                  
                  <button
                    onClick={handleIndividualQuestionSubmit}
                    disabled={loading || !individualQuestion.domain || !individualQuestion.text || !individualQuestion.correctAnswer || individualQuestion.options.some(opt => !opt.trim())}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating Question...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Create Question</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 