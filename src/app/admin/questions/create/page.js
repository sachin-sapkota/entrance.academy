'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, authenticatedFetch } from '@/lib/supabase';
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Eye,
  Save,
  Send,
  Copy,
  HelpCircle,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Target,
  Brain,
  Star,
  Clock,
  Trash2,
  Database,
  Plus,
  BarChart3,
  BookOpen,
  Users,
  Edit3,
  RefreshCw,
  Download
} from 'lucide-react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import LatexRenderer, { ProcessLatexText } from '../../../components/LatexRenderer';

// Helper function for authenticated file uploads
const uploadFileWithAuth = async (file, entityType, entityId = null) => {
  try {
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

// Updated example JSON without domain and estimated_time_seconds
const exampleQuestionBankJSON = `[
  {
    "text": "Which theory explains the gradual change in species over time?",
    "options": [
      { "text": "Theory of Evolution", "key": "A" },
      { "text": "Theory of Relativity", "key": "B" },
      { "text": "Cell Theory", "key": "C" },
      { "text": "Atomic Theory", "key": "D" }
    ],
    "correctAnswer": "A",
    "explanation": "The Theory of Evolution by Charles Darwin explains how species change over time through natural selection.",
    "difficulty": "medium",
    "cognitive_level": "understanding",
    "importance_points": 3,
    "tags": ["evolution", "darwin", "natural-selection"]
  },
  {
    "text": "What is the powerhouse of the cell?",
    "options": [
      { "text": "Nucleus", "key": "A" },
      { "text": "Mitochondria", "key": "B" },
      { "text": "Ribosome", "key": "C" },
      { "text": "Endoplasmic Reticulum", "key": "D" }
    ],
    "correctAnswer": "B",
    "explanation": "Mitochondria are called the powerhouse of the cell because they produce ATP through cellular respiration.",
    "difficulty": "easy",
    "cognitive_level": "recall",
    "importance_points": 2,
    "tags": ["cell-biology", "mitochondria", "atp"]
  },
  {
    "text": "What is the general formula for alkanes?",
    "options": [
      { "text": "CnH2n", "key": "A" },
      { "text": "CnH2n+2", "key": "B" },
      { "text": "CnH2n-2", "key": "C" },
      { "text": "CnHn", "key": "D" }
    ],
    "correctAnswer": "B",
    "explanation": "Alkanes are saturated hydrocarbons with the general formula CnH2n+2, where n is the number of carbon atoms.",
    "difficulty": "medium",
    "cognitive_level": "recall",
    "importance_points": 3,
    "tags": ["organic-chemistry", "alkanes", "hydrocarbons"]
  }
]`;

// LocalStorage keys
const STORAGE_KEYS = {
  BULK_SESSION: 'question_bulk_session',
  INDIVIDUAL_SESSION: 'question_individual_session'
};

export default function CreateQuestionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState('individual'); // 'individual' or 'bulk'
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [domains, setDomains] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const fileInputRef = useRef(null);

  // Session management with localStorage
  const [sessionId, setSessionId] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Individual question state
  const [formData, setFormData] = useState({
    domain: '',
    subdomain: '',
    text: '',
    options: [
      { text: '', image: null, key: 'A' },
      { text: '', image: null, key: 'B' },
      { text: '', image: null, key: 'C' },
      { text: '', image: null, key: 'D' }
    ],
    correctAnswer: '',
    explanation: '',
    hint: '',
    reference_material: '',
    tags: [],
    difficulty: 'medium',
    cognitive_level: 'understanding',
    importance_points: 3,
    question_image: null
  });

  // Bulk import state
  const [bulkData, setBulkData] = useState({
    domain: '',
    subdomain: '',
    json_input: '',
    parsed_questions: [],
    parse_error: ''
  });

  useEffect(() => {
    initializeSession();
    fetchDomainsAndSubdomains();
    loadSessionFromStorage();

    // Check for edit mode
    const questionId = searchParams?.get('edit');
    if (questionId) {
      setMode('individual');
      loadQuestionForEdit(questionId);
    }

    // Save to localStorage on page unload
    const handleBeforeUnload = (e) => {
      saveSessionToStorage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('visibilitychange', saveSessionToStorage);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('visibilitychange', saveSessionToStorage);
    };
  }, [searchParams]);

  // Auto-save to localStorage when data changes
  useEffect(() => {
    if (mode === 'bulk' && (bulkData.json_input || bulkData.parsed_questions.length > 0)) {
      saveSessionToStorage();
      setHasUnsavedChanges(true);
    }
  }, [bulkData, mode]);

  useEffect(() => {
    if (mode === 'individual' && (formData.text || formData.domain)) {
      saveSessionToStorage();
      setHasUnsavedChanges(true);
    }
  }, [formData, mode]);

  const initializeSession = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    setSessionId(newSessionId);
  };

  const saveSessionToStorage = useCallback(() => {
    if (!sessionId) return;

    try {
      const sessionData = {
        sessionId,
        mode,
        timestamp: Date.now(),
        bulkData: mode === 'bulk' ? bulkData : null,
        formData: mode === 'individual' ? formData : null
      };

      const storageKey = mode === 'bulk' ? STORAGE_KEYS.BULK_SESSION : STORAGE_KEYS.INDIVIDUAL_SESSION;
      localStorage.setItem(storageKey, JSON.stringify(sessionData));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
    }
  }, [sessionId, mode, bulkData, formData]);

  const loadSessionFromStorage = () => {
    try {
      const bulkSession = localStorage.getItem(STORAGE_KEYS.BULK_SESSION);
      const individualSession = localStorage.getItem(STORAGE_KEYS.INDIVIDUAL_SESSION);

      if (bulkSession) {
        const session = JSON.parse(bulkSession);
        if (session.bulkData && (session.bulkData.json_input || session.bulkData.parsed_questions.length > 0)) {
          setBulkData(session.bulkData);
          setLastSaved(new Date(session.timestamp));
        }
      }

      if (individualSession) {
        const session = JSON.parse(individualSession);
        if (session.formData && (session.formData.text || session.formData.domain)) {
          setFormData(session.formData);
          setLastSaved(new Date(session.timestamp));
        }
      }
    } catch (error) {
      console.error('Failed to load session from localStorage:', error);
    }
  };

  const clearSessionStorage = () => {
    localStorage.removeItem(STORAGE_KEYS.BULK_SESSION);
    localStorage.removeItem(STORAGE_KEYS.INDIVIDUAL_SESSION);
    setHasUnsavedChanges(false);
    setLastSaved(null);
  };

  const fetchDomainsAndSubdomains = async () => {
    try {
      const [domainsResponse, subdomainsResponse] = await Promise.all([
        supabase.from('domains').select('*').eq('is_active', true).order('display_order'),
        supabase.from('question_categories').select(`
          *,
          domain:domains(id, name, code, color_code)
        `).eq('is_active', true).order('display_order')
      ]);

      if (domainsResponse.error) throw domainsResponse.error;
      if (subdomainsResponse.error) throw subdomainsResponse.error;

      setDomains(domainsResponse.data || []);
      setSubdomains(subdomainsResponse.data || []);
    } catch (error) {
      console.error('Error fetching domains and subdomains:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (mode === 'bulk') {
      setBulkData(prev => ({ ...prev, [field]: value }));
      // Auto-clear subdomain if domain changes
      if (field === 'domain') {
        setBulkData(prev => ({ ...prev, subdomain: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (field === 'domain') {
        setFormData(prev => ({ ...prev, subdomain: '' }));
      }
    }
  };

  const handleOptionChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, text: value } : opt
      )
    }));
  };

  const handleImageUpload = async (type, index = null, questionIndex = null) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setUploadingImage(true);
        
        try {
          const result = await uploadFileWithAuth(file, 'question', sessionId);
          
          if (result.success) {
            const imageUrl = result.file.url;
            
            if (mode === 'bulk' && questionIndex !== null) {
              // Handle bulk mode image upload
              setBulkData(prev => {
                const updatedQuestions = [...prev.parsed_questions];
                if (type === 'question') {
                  updatedQuestions[questionIndex].image = imageUrl;
                } else if (type === 'option' && index !== null) {
                  updatedQuestions[questionIndex].options[index].image = imageUrl;
                }
                return { ...prev, parsed_questions: updatedQuestions };
              });
            } else {
              // Handle individual mode image upload
              if (type === 'question') {
                setFormData(prev => ({ ...prev, question_image: imageUrl }));
              } else if (type === 'option' && index !== null) {
                setFormData(prev => ({
                  ...prev,
                  options: prev.options.map((opt, i) => 
                    i === index ? { ...opt, image: imageUrl } : opt
                  )
                }));
              }
            }
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

  const removeImage = (type, index = null, questionIndex = null) => {
    if (mode === 'bulk' && questionIndex !== null) {
      setBulkData(prev => {
        const updatedQuestions = [...prev.parsed_questions];
        if (type === 'question') {
          delete updatedQuestions[questionIndex].image;
        } else if (type === 'option' && index !== null) {
          delete updatedQuestions[questionIndex].options[index].image;
        }
        return { ...prev, parsed_questions: updatedQuestions };
      });
    } else {
      if (type === 'question') {
        setFormData(prev => ({ ...prev, question_image: null }));
      } else if (type === 'option' && index !== null) {
        setFormData(prev => ({
          ...prev,
          options: prev.options.map((opt, i) => 
            i === index ? { ...opt, image: null } : opt
          )
        }));
      }
    }
  };

  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  // Load question for editing
  const loadQuestionForEdit = async (questionId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          category:question_categories(
            id, name, code,
            domain:domains(id, name, code)
          )
        `)
        .eq('id', questionId)
        .single();

      if (error) throw error;

      if (data) {
        // Parse the correct_answer which is stored as JSON string
        let correctAnswer = '';
        try {
          const parsed = JSON.parse(data.correct_answer);
          correctAnswer = typeof parsed === 'string' ? parsed : parsed.toString();
        } catch {
          correctAnswer = data.correct_answer;
        }

        setFormData({
          domain: data.category?.domain?.code || '',
          subdomain: data.category?.code || '',
          text: data.text || '',
          options: Array.isArray(data.options) && data.options.length === 4 ? data.options : [
            { text: '', image: null, key: 'A' },
            { text: '', image: null, key: 'B' },
            { text: '', image: null, key: 'C' },
            { text: '', image: null, key: 'D' }
          ],
          correctAnswer: correctAnswer,
          explanation: data.explanation || '',
          hint: data.hint || '',
          reference_material: data.reference_material || '',
          tags: data.tags || [],
          difficulty: data.difficulty_level || 'medium',
          cognitive_level: data.cognitive_level || 'understanding',
          importance_points: data.importance_points || 3,
          question_image: data.question_image_url
        });
      }
    } catch (error) {
      console.error('Error loading question for edit:', error);
      alert('Failed to load question for editing');
    } finally {
      setLoading(false);
    }
  };

  // Validate individual form
  const validateIndividualForm = () => {
    const errors = [];
    
    if (!formData.domain) errors.push('Domain is required');
    if (!formData.subdomain) errors.push('Subdomain is required');
    if (!formData.text.trim()) errors.push('Question text is required');
    if (formData.options.some(opt => !opt.text.trim())) errors.push('All options must be filled');
    if (!formData.correctAnswer) errors.push('Correct answer must be selected');
    if (!formData.explanation.trim()) errors.push('Explanation is required');
    
    return errors;
  };

  // Handle individual question submit
  const handleIndividualSubmit = async () => {
    const errors = validateIndividualForm();
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    setLoading(true);
    
    try {
      const questionId = searchParams?.get('edit');
      const isEdit = !!questionId;
      
      const questionData = {
        domain: formData.domain,
        subdomain: formData.subdomain,
        text: formData.text,
        options: formData.options,
        correctAnswer: formData.correctAnswer,
        explanation: formData.explanation,
        hint: formData.hint,
        reference_material: formData.reference_material,
        tags: formData.tags,
        difficulty: formData.difficulty,
        cognitive_level: formData.cognitive_level,
        importance_points: formData.importance_points,
        question_image: formData.question_image,
        ...(isEdit && { id: questionId })
      };

      const url = isEdit ? '/api/admin/questions/update' : '/api/admin/questions/create';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(questionData),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(isEdit ? 'Question updated successfully!' : 'Question created successfully!');
        if (!isEdit) {
          // Reset form for new question
          setFormData({
            domain: formData.domain, // Keep domain selected
            subdomain: formData.subdomain, // Keep subdomain selected  
            text: '',
            options: [
              { text: '', image: null, key: 'A' },
              { text: '', image: null, key: 'B' },
              { text: '', image: null, key: 'C' },
              { text: '', image: null, key: 'D' }
            ],
            correctAnswer: '',
            explanation: '',
            hint: '',
            reference_material: '',
            tags: [],
            difficulty: 'medium',
            cognitive_level: 'understanding',
            importance_points: 3,
            question_image: null
          });
        } else {
          router.push('/admin/questions');
        }
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Updated parseBulkJSON function
  const parseBulkJSON = () => {
    try {
      setBulkData(prev => ({ ...prev, parse_error: '' }));
      const parsed = JSON.parse(bulkData.json_input);
      
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of questions');
      }

      const validatedQuestions = parsed.map((q, index) => {
        if (!q.text || !q.options || !q.correctAnswer) {
          throw new Error(`Question ${index + 1}: Missing required fields (text, options, correctAnswer)`);
        }
        
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Question ${index + 1}: Must have exactly 4 options`);
        }

        if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
          throw new Error(`Question ${index + 1}: correctAnswer must be A, B, C, or D`);
        }

        // LaTeX decode helper
        const decodeLatex = (str) => typeof str === 'string' ? str.replace(/\\/g, '\\') : str;
        // Auto-wrap LaTeX commands in $...$ if not already wrapped
        const autoWrapLatex = (str) => {
          if (typeof str !== 'string') return str;
          // Only wrap if not already inside $...$ or $$...$$
          // Match common LaTeX commands: \\command{...} or \\frac{...}{...} etc.
          // This is a simple heuristic, not a full parser
          return str.replace(/(\\[a-zA-Z]+\{[^}]+\})/g, (match) => {
            // If already inside $...$, skip
            const before = str.slice(0, str.indexOf(match));
            const after = str.slice(str.indexOf(match) + match.length);
            const alreadyWrapped = /\$[^$]*$/.test(before) && /^[^$]*\$/.test(after);
            return alreadyWrapped ? match : `$${match}$`;
          });
        };

        const processField = (str) => autoWrapLatex(decodeLatex(str));

        return {
          ...q,
          text: processField(q.text),
          explanation: processField(q.explanation),
          id: `temp_${Date.now()}_${index}`,
          options: q.options.map((opt, optIndex) => ({
            text: processField(typeof opt === 'string' ? opt : opt.text),
            image: opt.image || null,
            key: ['A', 'B', 'C', 'D'][optIndex]
          })),
          difficulty: q.difficulty || 'medium',
          cognitive_level: q.cognitive_level || 'understanding',
          importance_points: q.importance_points || 3,
          tags: q.tags || []
        };
      });

      setBulkData(prev => ({ ...prev, parsed_questions: validatedQuestions }));
      
    } catch (error) {
      setBulkData(prev => ({ 
        ...prev, 
        parse_error: error.message, 
        parsed_questions: [] 
      }));
    }
  };

  const handleBulkSubmit = async () => {
    if (bulkData.parsed_questions.length === 0) {
      alert('Please parse questions first');
      return;
    }

    if (!bulkData.domain || !bulkData.subdomain) {
      alert('Please select domain and subdomain');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔐 Making authenticated request to create questions...');
      
      const response = await authenticatedFetch('/api/admin/questions/bulk-create', {
        method: 'POST',
        body: JSON.stringify({
          domain: bulkData.domain,
          subdomain: bulkData.subdomain,
          questions: bulkData.parsed_questions
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully created ${data.created_count} questions!`);
        // Clear the session and form
        setBulkData({
          domain: bulkData.domain, // Keep domain and subdomain selected
          subdomain: bulkData.subdomain,
          json_input: '',
          parsed_questions: [],
          parse_error: ''
        });
        clearSessionStorage();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating questions:', error);
      alert('Failed to create questions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSubdomainsByDomain = (domainCode) => {
    return subdomains.filter(sub => sub.domain?.code === domainCode);
  };

  const getDomainColor = (domainCode) => {
    const domain = domains.find(d => d.code === domainCode);
    return domain?.color_code || '#3B82F6';
  };

  const getSubdomainName = (subdomainCode) => {
    const subdomain = subdomains.find(s => s.code === subdomainCode);
    return subdomain?.name || subdomainCode;
  };

  const getDomainName = (domainCode) => {
    const domain = domains.find(d => d.code === domainCode);
    return domain?.name || domainCode;
  };

  // Update question in preview mode
  const updateQuestionInPreview = (questionIndex, field, value) => {
    setBulkData(prev => {
      const updatedQuestions = [...prev.parsed_questions];
      if (field === 'options') {
        updatedQuestions[questionIndex].options = value;
      } else {
        updatedQuestions[questionIndex][field] = value;
      }
      return { ...prev, parsed_questions: updatedQuestions };
    });
  };

  const renderModeSelector = () => (
    <div className="mb-8">
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setMode('individual')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            mode === 'individual'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Plus className="w-4 h-4" />
          Individual Question
        </button>
        <button
          onClick={() => setMode('bulk')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            mode === 'bulk'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Database className="w-4 h-4" />
          Bulk Import
        </button>
      </div>
    </div>
  );

  const renderSessionInfo = () => {
    if (!lastSaved && !hasUnsavedChanges) return null;

    return (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {hasUnsavedChanges ? (
              <>
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-orange-700">Unsaved changes</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-700">Auto-saved to localStorage</span>
              </>
            )}
          </div>
          
          {lastSaved && (
            <span className="text-blue-600">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          
          <button
            onClick={clearSessionStorage}
            className="text-red-600 hover:text-red-700 text-xs"
          >
            Clear session
          </button>
        </div>
      </div>
    );
  };

  const renderBulkImportInterface = () => (
    <div className="space-y-6">
      {renderSessionInfo()}
      
      {/* Domain and Subdomain Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 border border-gray-200"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Target Domain & Subdomain
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Domain *
            </label>
            <select
              value={bulkData.domain}
              onChange={(e) => handleInputChange('domain', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-800"
            >
              <option value="">Select domain...</option>
              {domains.map(domain => (
                <option key={domain.id} value={domain.code}>{domain.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Subdomain *
            </label>
            <select
              value={bulkData.subdomain}
              onChange={(e) => handleInputChange('subdomain', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-800"
              disabled={!bulkData.domain}
            >
              <option value="">Select subdomain...</option>
              {getSubdomainsByDomain(bulkData.domain).map(subdomain => (
                <option key={subdomain.id} value={subdomain.code}>{subdomain.name}</option>
              ))}
            </select>
          </div>
        </div>

        {bulkData.domain && bulkData.subdomain && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Questions will be added to: <strong>{getDomainName(bulkData.domain)} → {getSubdomainName(bulkData.subdomain)}</strong></span>
            </div>
          </div>
        )}
      </motion.div>

      {/* JSON Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Questions JSON
          </h2>
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
                  navigator.clipboard.writeText(exampleQuestionBankJSON);
                  alert('Example copied to clipboard!');
                }}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </div>
            <pre className="text-xs text-gray-600 overflow-x-auto max-h-64">
              {exampleQuestionBankJSON}
            </pre>
          </div>
        )}
        
        <div className="space-y-4">
          <textarea
            value={bulkData.json_input}
            onChange={(e) => handleInputChange('json_input', e.target.value)}
            placeholder="Paste your questions JSON here..."
            rows={12}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm placeholder:text-gray-800 text-gray-900"
          />
          
          {bulkData.parse_error && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="text-sm text-red-700">
                <strong>Parse Error:</strong> {bulkData.parse_error}
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={parseBulkJSON}
              disabled={!bulkData.json_input.trim()}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Parse Questions</span>
            </button>

            {bulkData.parsed_questions.length > 0 && (
              <>
                <div className="flex items-center text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {bulkData.parsed_questions.length} questions parsed successfully
                </div>
                
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview & Edit</span>
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Submit Section */}
      {bulkData.parsed_questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleBulkSubmit}
              disabled={loading || !bulkData.domain || !bulkData.subdomain || bulkData.parsed_questions.length === 0}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Questions...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Create {bulkData.parsed_questions.length} Questions</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );

  // Individual Question Form
  const renderIndividualQuestionForm = () => {
    const questionId = searchParams?.get('edit');
    const isEdit = !!questionId;

    return (
      <div className="space-y-6">
        {renderSessionInfo()}
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            {isEdit ? 'Edit Question' : 'Create New Question'}
          </h2>
          <p className="text-gray-600">
            {isEdit ? 'Update question details and content' : 'Add a new question to the question bank'}
          </p>
        </motion.div>

        {/* Domain & Subdomain Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Domain *
              </label>
              <select
                value={formData.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-800"
              >
                <option value="">Select domain...</option>
                {domains.map(domain => (
                  <option key={domain.id} value={domain.code}>{domain.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Subdomain *
              </label>
              <select
                value={formData.subdomain}
                onChange={(e) => handleInputChange('subdomain', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-800"
                disabled={!formData.domain}
              >
                <option value="">Select subdomain...</option>
                {getSubdomainsByDomain(formData.domain).map(subdomain => (
                  <option key={subdomain.id} value={subdomain.code}>{subdomain.name}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.domain && formData.subdomain && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span>Question will be added to: <strong>{getDomainName(formData.domain)} → {getSubdomainName(formData.subdomain)}</strong></span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Question Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Content</h3>
          
          <div className="space-y-6">
            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Question Text *
              </label>
              <textarea
                value={formData.text}
                onChange={(e) => handleInputChange('text', e.target.value)}
                placeholder="Enter your question here..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-800 text-gray-900"
              />
            </div>

            {/* Question Image */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Question Image</label>
              {formData.question_image ? (
                <div className="relative inline-block group">
                  <img
                    src={formData.question_image}
                    alt="Question"
                    className="max-w-full h-40 object-contain rounded border border-gray-200"
                  />
                  <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleImageUpload('question')}
                      disabled={uploadingImage}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                      title="Change image"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeImage('question')}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleImageUpload('question')}
                  disabled={uploadingImage}
                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 px-4 py-3 border border-dashed border-gray-300 rounded-lg hover:border-blue-300 disabled:opacity-50 w-full justify-center"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span>{uploadingImage ? 'Uploading...' : 'Add Question Image'}</span>
                </button>
              )}
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Answer Options *</label>
              <div className="space-y-4">
                {formData.options.map((option, index) => (
                  <div key={option.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-medium text-sm">
                        {option.key}
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${option.key} text`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-800 text-gray-900"
                        />
                        
                        {/* Option Image */}
                        {option.image ? (
                          <div className="relative inline-block group">
                            <img
                              src={option.image}
                              alt={`Option ${option.key}`}
                              className="max-w-full h-24 object-contain rounded border border-gray-200"
                            />
                            <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleImageUpload('option', index)}
                                disabled={uploadingImage}
                                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                title="Change image"
                              >
                                <Upload className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => removeImage('option', index)}
                                className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                                title="Remove image"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleImageUpload('option', index)}
                            disabled={uploadingImage}
                            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 px-2 py-1 border border-dashed border-gray-300 rounded hover:border-blue-300 disabled:opacity-50"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>{uploadingImage ? 'Uploading...' : 'Add image'}</span>
                          </button>
                        )}
                      </div>
                      
                      {/* Correct Answer Radio */}
                      <div className="flex-shrink-0 pt-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          value={option.key}
                          checked={formData.correctAnswer === option.key}
                          onChange={(e) => handleInputChange('correctAnswer', e.target.value)}
                          className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <span className="ml-2 text-xs text-gray-500">Correct</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Explanation & Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Explanation & Details</h3>
          
          <div className="space-y-6">
            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Explanation *
              </label>
              <textarea
                value={formData.explanation}
                onChange={(e) => handleInputChange('explanation', e.target.value)}
                placeholder="Explain why the correct answer is right..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-800 text-gray-900"
              />
            </div>

            {/* Hint */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Hint</label>
              <input
                type="text"
                value={formData.hint}
                onChange={(e) => handleInputChange('hint', e.target.value)}
                placeholder="Optional hint for students..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-800 text-gray-900"
              />
            </div>

            {/* Reference Material */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Reference Material</label>
              <input
                type="text"
                value={formData.reference_material}
                onChange={(e) => handleInputChange('reference_material', e.target.value)}
                placeholder="Book chapter, page number, etc..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-800 text-gray-900"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tags (press Enter to add)..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-800 text-gray-900"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const tag = e.target.value.trim();
                    if (tag) {
                      addTag(tag);
                      e.target.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Question Properties */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Properties</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Difficulty Level</label>
              <select
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="very_easy">Very Easy</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="very_hard">Very Hard</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Cognitive Level</label>
              <select
                value={formData.cognitive_level}
                onChange={(e) => handleInputChange('cognitive_level', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="recall">Recall</option>
                <option value="understanding">Understanding</option>
                <option value="application">Application</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Importance (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.importance_points}
                onChange={(e) => handleInputChange('importance_points', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.push('/admin/questions')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleIndividualSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isEdit ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Update Question' : 'Create Question'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Full Preview Modal with Editing
  const renderPreviewModal = () => (
    <AnimatePresence>
      {showPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl max-w-6xl max-h-[95vh] w-full overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-6 h-6 text-purple-600" />
                Preview & Edit Questions ({bulkData.parsed_questions.length})
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Editing Instructions */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Edit3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">Editing Instructions</h3>
                    <p className="text-sm text-blue-700">
                      • Click on any text (question, options, explanation) to edit directly<br/>
                      • Use the "Edit Mode" button to enable/disable editing for a question<br/>
                      • Add images by clicking the image icons<br/>
                      • Changes are automatically saved to your session
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-8">
                {bulkData.parsed_questions.map((question, questionIndex) => (
                  <div key={question.id} className={`border rounded-lg p-6 transition-all ${
                    editingQuestion === questionIndex 
                      ? 'border-green-300 bg-green-50 shadow-lg' 
                      : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          Question {questionIndex + 1}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => setEditingQuestion(editingQuestion === questionIndex ? null : questionIndex)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                          editingQuestion === questionIndex 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                        {editingQuestion === questionIndex ? 'Done Editing' : 'Edit Mode'}
                      </button>
                    </div>

                    {/* Question Text */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                      {editingQuestion === questionIndex ? (
                        <textarea
                          value={question.text}
                          onChange={(e) => updateQuestionInPreview(questionIndex, 'text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          rows={3}
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="text-gray-900 bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group"
                          onClick={() => setEditingQuestion(questionIndex)}
                          title="Click to edit question text"
                        >
                          <ProcessLatexText text={question.text} />
                          <span className="ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit3 className="w-4 h-4 inline" />
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Question Image */}
                    <div className="mb-4">
                      {question.image ? (
                        <div className="relative inline-block group">
                          <img
                            src={question.image}
                            alt="Question"
                            className="max-w-full h-32 object-contain rounded border border-gray-200"
                          />
                          <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleImageUpload('question', null, questionIndex)}
                              disabled={uploadingImage}
                              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                              title="Change image"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeImage('question', null, questionIndex)}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                              title="Remove image"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleImageUpload('question', null, questionIndex)}
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

                    {/* Options */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                      <div className="space-y-3">
                        {question.options.map((option, optIndex) => {
                          const isCorrect = option.key === question.correctAnswer;
                          return (
                            <div key={option.key} className={`border rounded-lg p-3 ${
                              isCorrect ? 'border-green-300 bg-green-50' : 'border-gray-200'
                            }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                                    isCorrect ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {option.key}
                                  </div>
                                  
                                  <div className="flex-1">
                                    {editingQuestion === questionIndex ? (
                                      <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => {
                                          const updatedOptions = [...question.options];
                                          updatedOptions[optIndex].text = e.target.value;
                                          updateQuestionInPreview(questionIndex, 'options', updatedOptions);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                      />
                                    ) : (
                                      <span 
                                        className="text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors group"
                                        onClick={() => setEditingQuestion(questionIndex)}
                                        title="Click to edit option text"
                                      >
                                        <ProcessLatexText text={option.text} />
                                        <span className="ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Edit3 className="w-3 h-3 inline" />
                                        </span>
                                      </span>
                                    )}
                                    
                                    {option.image && (
                                      <div className="mt-2 relative inline-block group">
                                        <img
                                          src={option.image}
                                          alt={`Option ${option.key}`}
                                          className="max-w-full h-20 object-contain rounded border border-gray-200"
                                        />
                                        <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => handleImageUpload('option', optIndex, questionIndex)}
                                            disabled={uploadingImage}
                                            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                            title="Change image"
                                          >
                                            <Upload className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => removeImage('option', optIndex, questionIndex)}
                                            className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                                            title="Remove image"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {!option.image && (
                                    <button
                                      onClick={() => handleImageUpload('option', optIndex, questionIndex)}
                                      disabled={uploadingImage}
                                      className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                                      title="Add image"
                                    >
                                      <ImageIcon className="w-4 h-4" />
                                    </button>
                                  )}
                                  {isCorrect && (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Explanation</label>
                      {editingQuestion === questionIndex ? (
                        <textarea
                          value={question.explanation || ''}
                          onChange={(e) => updateQuestionInPreview(questionIndex, 'explanation', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          rows={3}
                        />
                      ) : (
                        <div 
                          className="text-gray-700 bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group"
                          onClick={() => setEditingQuestion(questionIndex)}
                          title="Click to edit explanation"
                        >
                          <ProcessLatexText text={question.explanation || 'No explanation provided'} />
                          <span className="ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit3 className="w-4 h-4 inline" />
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Additional Properties */}
                    {editingQuestion === questionIndex && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                          <select
                            value={question.difficulty}
                            onChange={(e) => updateQuestionInPreview(questionIndex, 'difficulty', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          >
                            <option value="very_easy">Very Easy</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                            <option value="very_hard">Very Hard</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cognitive Level</label>
                          <select
                            value={question.cognitive_level}
                            onChange={(e) => updateQuestionInPreview(questionIndex, 'cognitive_level', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          >
                            <option value="recall">Recall</option>
                            <option value="understanding">Understanding</option>
                            <option value="application">Application</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Importance (1-10)</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={question.importance_points}
                            onChange={(e) => updateQuestionInPreview(questionIndex, 'importance_points', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center p-6 border-t border-gray-200">
              <span className="text-sm text-gray-600">
                {bulkData.parsed_questions.length} questions ready for import
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    handleBulkSubmit();
                  }}
                  disabled={!bulkData.domain || !bulkData.subdomain}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  Import All Questions
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/questions')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create Questions</h1>
                <p className="text-gray-600">Add individual questions or import in bulk</p>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          {renderModeSelector()}

          {/* Content */}
          {mode === 'individual' ? (
            renderIndividualQuestionForm()
          ) : (
            renderBulkImportInterface()
          )}
        </div>

        {/* Preview Modal */}
        {renderPreviewModal()}
      </div>
    </ProtectedRoute>
  );
} 