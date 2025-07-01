'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { 
  ArrowLeft, 
  MessageSquare,
  Clock,
  Eye,
  User,
  Heart,
  Reply,
  Send,
  MoreVertical,
  Star,
  ThumbsUp,
  ThumbsDown,
  Share,
  Flag,
  Pin,
  Edit,
  Trash2,
  HelpCircle,
  Lightbulb,
  GraduationCap,
  AlertTriangle
} from 'lucide-react';
import { authenticatedFetch } from '../../../lib/supabase';

export default function TopicPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.topicId;

  const { user } = useSelector((state) => state.auth);
  const [topic, setTopic] = useState(null);
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(null);
  const [error, setError] = useState('');

  // Load topic and replies
  useEffect(() => {
    const loadTopic = async () => {
      try {
        const response = await fetch(`/api/forum/topics/${topicId}`);
        if (response.ok) {
          const data = await response.json();
          setTopic(data.topic);
          setReplies(data.replies);
        } else if (response.status === 404) {
          setError('Topic not found');
        } else {
          setError('Failed to load topic');
        }
      } catch (error) {
        console.error('Error loading topic:', error);
        setError('An error occurred while loading the topic');
      } finally {
        setIsLoading(false);
      }
    };

    if (topicId) {
      loadTopic();
    }
  }, [topicId]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'help': return HelpCircle;
      case 'study': return GraduationCap;
      case 'suggestions': return Lightbulb;
      case 'technical': return AlertTriangle;
      default: return MessageSquare;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'help': return 'orange';
      case 'study': return 'purple';
      case 'suggestions': return 'yellow';
      case 'technical': return 'red';
      default: return 'blue';
    }
  };

  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const handleReply = async (e, parentId = null) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to reply');
      return;
    }

    if (!newReply.trim()) {
      setError('Please enter a reply');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await authenticatedFetch('/api/forum/replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic_id: topicId,
          content: newReply,
          author_id: user.id,
          parent_reply_id: parentId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (parentId) {
          // Add as nested reply
          setReplies(prev => prev.map(reply => {
            if (reply.id === parentId) {
              return {
                ...reply,
                nested_replies: [...reply.nested_replies, data.reply]
              };
            }
            return reply;
          }));
        } else {
          // Add as main reply
          setReplies(prev => [...prev, data.reply]);
        }

        setNewReply('');
        setShowReplyForm(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      setError('An error occurred while posting the reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading topic...</p>
        </div>
      </div>
    );
  }

  if (error && !topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">{error}</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/forum')}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg"
          >
            Back to Forum
          </motion.button>
        </div>
      </div>
    );
  }

  if (!topic) {
    return null;
  }

  const CategoryIcon = getCategoryIcon(topic.category);
  const categoryColor = getCategoryColor(topic.category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/forum')}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Forum</span>
            </motion.button>
            
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 bg-gradient-to-br from-${categoryColor}-500 to-${categoryColor}-600 rounded-xl flex items-center justify-center`}>
                <CategoryIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Discussion Topic</h1>
                <p className="text-sm text-slate-600">{topic.category} • {replies.length} replies</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Share className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h4 className="font-semibold text-red-900">Error</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Original Topic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-slate-200 mb-8"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {topic.is_pinned && (
                <Pin className="w-4 h-4 text-green-600" />
              )}
              <span className={`px-3 py-1 bg-${categoryColor}-50 text-${categoryColor}-700 text-sm font-medium rounded-full`}>
                {topic.category}
              </span>
              {topic.likes_count > 10 && (
                <div className="flex items-center space-x-1 text-yellow-600">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">Popular</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{topic.views} views</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{getRelativeTime(topic.created_at)}</span>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-4">{topic.title}</h1>
          
          <div className="prose prose-slate max-w-none mb-6">
            {topic.content.split('\n').map((paragraph, index) => (
              <p key={index} className="text-slate-700 mb-3">{paragraph}</p>
            ))}
          </div>

          {topic.tags && topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {topic.tags.map(tag => (
                <span 
                  key={tag}
                  className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900">{topic.author?.full_name || 'Anonymous'}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{topic.author?.role || 'User'}</span>
                  </div>
                  <span className="text-sm text-slate-500">Member since {getRelativeTime(topic.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Heart className="w-4 h-4" />
                <span>{topic.likes_count || 0}</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowReplyForm(showReplyForm === 'main' ? null : 'main')}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                <Reply className="w-4 h-4" />
                <span>Reply</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Reply Form */}
        <AnimatePresence>
          {showReplyForm === 'main' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl p-6 border border-slate-200 mb-8"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Write a Reply</h3>
              <form onSubmit={(e) => handleReply(e)}>
                <textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder={user ? "Share your thoughts, experiences, or ask follow-up questions..." : "Please log in to reply"}
                  rows={4}
                  disabled={!user}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none disabled:opacity-50"
                />
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-500">
                    {user ? "Be respectful and helpful in your response" : "You must be logged in to reply"}
                  </p>
                  <div className="flex items-center space-x-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowReplyForm(null)}
                      className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      Cancel
                    </motion.button>
                    {user ? (
                      <motion.button
                        type="submit"
                        disabled={isSubmitting || !newReply.trim()}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Posting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Post Reply</span>
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/login?returnTo=' + encodeURIComponent(`/forum/${topicId}`))}
                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Log In to Reply
                      </motion.button>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Replies */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </h2>

          <AnimatePresence>
            {replies.map((reply, index) => (
              <motion.div
                key={reply.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 border border-slate-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-slate-900">{reply.author?.full_name || 'Anonymous'}</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{reply.author?.role || 'User'}</span>
                        <span className="text-sm text-slate-500">{getRelativeTime(reply.created_at)}</span>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </motion.button>
                    </div>
                    
                    <p className="text-slate-700 mb-4">{reply.content}</p>
                    
                    <div className="flex items-center space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 px-3 py-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{reply.likes_count || 0}</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowReplyForm(showReplyForm === reply.id ? null : reply.id)}
                        className="flex items-center space-x-2 px-3 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Reply className="w-4 h-4" />
                        <span>Reply</span>
                      </motion.button>
                    </div>

                    {/* Nested Reply Form */}
                    <AnimatePresence>
                      {showReplyForm === reply.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-slate-200"
                        >
                          <form onSubmit={(e) => handleReply(e, reply.id)}>
                            <textarea
                              value={newReply}
                              onChange={(e) => setNewReply(e.target.value)}
                              placeholder={user ? `Reply to ${reply.author?.full_name || 'Anonymous'}...` : "Please log in to reply"}
                              rows={3}
                              disabled={!user}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none disabled:opacity-50"
                            />
                            <div className="flex items-center justify-end space-x-3 mt-3">
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowReplyForm(null)}
                                className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                              >
                                Cancel
                              </motion.button>
                              {user ? (
                                <motion.button
                                  type="submit"
                                  disabled={isSubmitting || !newReply.trim()}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                >
                                  {isSubmitting ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Posting...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4" />
                                      <span>Reply</span>
                                    </>
                                  )}
                                </motion.button>
                              ) : (
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => router.push('/login?returnTo=' + encodeURIComponent(`/forum/${topicId}`))}
                                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                  Log In
                                </motion.button>
                              )}
                            </div>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Nested Replies */}
                    {reply.nested_replies && reply.nested_replies.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                        {reply.nested_replies.map((nestedReply) => (
                          <div key={nestedReply.id} className="flex items-start space-x-4 bg-slate-50 p-4 rounded-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="font-semibold text-slate-900 text-sm">{nestedReply.author?.full_name || 'Anonymous'}</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{nestedReply.author?.role || 'User'}</span>
                                <span className="text-xs text-slate-500">{getRelativeTime(nestedReply.created_at)}</span>
                              </div>
                              
                              <p className="text-slate-700 text-sm mb-3">{nestedReply.content}</p>
                              
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center space-x-2 px-3 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>{nestedReply.likes_count || 0}</span>
                              </motion.button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {replies.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-8 border border-slate-200 text-center"
            >
              <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No replies yet</h3>
              <p className="text-slate-600 mb-4">Be the first to share your thoughts on this topic!</p>
              {user ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowReplyForm('main')}
                  className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  Write First Reply
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/login?returnTo=' + encodeURIComponent(`/forum/${topicId}`))}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Log In to Reply
                </motion.button>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
} 