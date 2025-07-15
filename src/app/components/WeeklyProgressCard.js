'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, BarChart3, Calendar, Clock } from 'lucide-react';

export default function WeeklyProgressCard({ userStats, loadingStats = false }) {
  const [hoveredWeek, setHoveredWeek] = useState(null);

  if (loadingStats) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 overflow-hidden h-full flex flex-col max-h-[580px]">
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gradient-to-r from-slate-200/60 via-slate-100/60 to-slate-200/60 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!userStats?.weeklyProgress || userStats.weeklyProgress.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 overflow-hidden h-full flex flex-col max-h-[580px]">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative mb-4"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 via-green-100 to-teal-100 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
              <span className="text-xs">📊</span>
            </div>
          </motion.div>
          <h4 className="font-bold text-slate-800 mb-2 text-lg">Track Your Progress</h4>
          <p className="text-slate-500 text-sm mb-6 text-center max-w-sm leading-relaxed">
            Complete tests to unlock detailed weekly progress analytics and performance insights
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold text-sm rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <span>Start Your First Test</span>
          </motion.button>
        </div>
      </div>
    );
  }

  const weeklyProgress = userStats.weeklyProgress;
  const latestWeek = weeklyProgress[weeklyProgress.length - 1];
  const previousWeek = weeklyProgress.length > 1 ? weeklyProgress[weeklyProgress.length - 2] : null;
  const trend = previousWeek ? latestWeek.averageScore - previousWeek.averageScore : 0;
  const overallAverage = Math.round(weeklyProgress.reduce((sum, week) => sum + week.averageScore, 0) / weeklyProgress.length);

  const getScoreColor = (score) => {
    if (score >= 80) return 'emerald';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 overflow-hidden h-full flex flex-col max-h-[580px]">
      {/* Modern Header */}
      <div className="relative p-5 bg-gradient-to-br from-emerald-900/95 via-green-900/95 to-teal-900/95 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-teal-600/20"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Weekly Progress</h3>
              <p className="text-green-200 text-sm">Performance trends</p>
            </div>
          </div>
          {weeklyProgress && weeklyProgress.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <span className="text-white text-xs font-semibold">{weeklyProgress.length}w</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Line Chart */}
        <div className="p-4">
          <div className="relative h-40 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 overflow-hidden mb-4 shadow-sm">
            {/* Y-axis labels */}
            <div className="absolute left-2 top-3 bottom-3 flex flex-col justify-between text-xs text-slate-500 font-medium z-10">
              <span className="leading-none">100</span>
              <span className="leading-none">75</span>
              <span className="leading-none">50</span>
              <span className="leading-none">25</span>
              <span className="leading-none">0</span>
            </div>

            {/* Line Chart SVG */}
            <div className="absolute inset-0 -left-40 h-full">
              <svg viewBox="0 0 400 160" className="w-full h-full">
                {/* Definitions */}
                <defs>
                  <pattern id="weeklyGrid" width="50" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 0 0 L 50 0" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
                    <path d="M 0 32 L 50 32" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
                    <path d="M 0 0 L 0 32" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
                  </pattern>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7" />
                    <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                
                {/* Grid */}
                <rect width="600" height="160" fill="url(#weeklyGrid)" />
                
                {/* Generate smooth curve */}
                {(() => {
                  const svgWidth = 400;
                  const svgHeight = 160;
                  const margin = { top: 20, right: 15, bottom: 20, left: 15 };
                  const chartWidth = svgWidth - margin.left - margin.right;
                  const chartHeight = svgHeight - margin.top - margin.bottom;

                  // Generate data points with actual pixel coordinates
                  const points = weeklyProgress.map((week, index) => {
                    const x = margin.left + (index / Math.max(weeklyProgress.length - 1, 1)) * chartWidth;
                    const y = margin.top + chartHeight - (week.averageScore / 100) * chartHeight;
                    return { x, y, score: week.averageScore, tests: week.tests };
                  });

                  // Create smooth curve using cardinal spline
                  const createSmoothPath = (points, tension = 0.3) => {
                    if (points.length < 2) return '';
                    
                    let path = `M ${points[0].x} ${points[0].y}`;
                    
                    for (let i = 1; i < points.length; i++) {
                      const p0 = points[i - 2] || points[i - 1];
                      const p1 = points[i - 1];
                      const p2 = points[i];
                      const p3 = points[i + 1] || points[i];
                      
                      const cp1x = p1.x + (p2.x - p0.x) * tension;
                      const cp1y = p1.y + (p2.y - p0.y) * tension;
                      const cp2x = p2.x - (p3.x - p1.x) * tension;
                      const cp2y = p2.y - (p3.y - p1.y) * tension;
                      
                      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
                    }
                    
                    return path;
                  };

                  const smoothPath = createSmoothPath(points);
                  const areaPath = smoothPath + ` L ${points[points.length - 1].x} ${margin.top + chartHeight} L ${points[0].x} ${margin.top + chartHeight} Z`;

                  return (
                    <g>
                      {/* Area under curve */}
                      <motion.path
                        d={areaPath}
                        fill="url(#areaGradient)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />

                      {/* Smooth line */}
                      <motion.path
                        d={smoothPath}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        style={{ filter: "drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))" }}
                      />

                      {/* Data points */}
                      {points.map((point, index) => {
                        const isLatest = index === points.length - 1;
                        const isFirst = index === 0;
                        return (
                          <motion.g key={index}>
                            {/* Point shadow */}
                            <motion.circle
                              cx={point.x}
                              cy={point.y + 1}
                              r={isLatest ? "5" : "4"}
                              fill="rgba(59, 130, 246, 0.2)"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                            />
                            
                            {/* Main point */}
                            <motion.circle
                              cx={point.x}
                              cy={point.y}
                              r={isLatest ? "5" : "4"}
                              fill="white"
                              stroke="#3b82f6"
                              strokeWidth={isLatest ? "3" : "2.5"}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                              className="cursor-pointer hover:stroke-blue-600"
                              onMouseEnter={() => setHoveredWeek(index)}
                              onMouseLeave={() => setHoveredWeek(null)}
                              style={{ filter: "drop-shadow(0 2px 4px rgba(59, 130, 246, 0.2))" }}
                            />
                            
                            {/* Latest point pulse effect */}
                            {isLatest && (
                              <motion.circle
                                cx={point.x}
                                cy={point.y}
                                r="8"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                opacity="0.4"
                                initial={{ scale: 0 }}
                                animate={{ scale: [1, 1.4, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              />
                            )}

                            {/* Tooltip */}
                            {hoveredWeek === index && (
                              <foreignObject 
                                x={Math.max(10, Math.min(310, point.x - 40))} 
                                y={Math.max(5, point.y - 30)} 
                                width="80" 
                                height="25"
                              >
                                <div className="flex justify-center">
                                  <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs py-1.5 px-3 rounded-lg shadow-xl border border-slate-700">
                                    <div className="font-semibold text-center">{point.score}%</div>
                                    <div className="text-slate-300 text-center">{point.tests} tests</div>
                                  </div>
                                </div>
                              </foreignObject>
                            )}
                          </motion.g>
                        );
                      })}
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>

        {/* Compact Weekly Details - Scrollable */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar max-h-[380px]">
          {weeklyProgress.slice(-3).reverse().map((week, index) => {
            const weekDate = new Date(week.week);
            const isLatest = index === 0;
            const colorScheme = getScoreColor(week.averageScore);

            return (
              <motion.div
                key={week.week}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`group relative p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                  isLatest 
                    ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border-blue-200 shadow-md' 
                    : 'bg-gradient-to-r from-white to-slate-50/60 border-slate-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Compact Week Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-8 rounded-full ${
                      colorScheme === 'emerald' ? 'bg-gradient-to-b from-blue-400 to-blue-600' :
                      colorScheme === 'yellow' ? 'bg-gradient-to-b from-amber-400 to-orange-500' :
                      'bg-gradient-to-b from-red-400 to-red-600'
                    }`}></div>

                    <div>
                      <p className="font-bold text-slate-800 text-sm flex items-center">
                        {weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {isLatest && (
                          <span className="ml-2 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                            Latest
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {weekDate.toLocaleDateString('en-US', { year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm ${
                      colorScheme === 'emerald' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200' :
                      colorScheme === 'yellow' ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200' :
                      'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200'
                    }`}>
                      {week.averageScore}%
                    </div>
                  </div>
                </div>

                {/* Compact Metrics */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-7 h-7 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200">
                        <span className="text-xs font-bold text-blue-700">{week.tests}</span>
                      </div>
                      <span className="text-xs text-slate-600 font-medium">tests</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <div className="text-sm font-bold text-blue-600">{week.averageScore}%</div>
                      <span className="text-xs text-slate-600 font-medium">avg</span>
                    </div>
                  </div>

                  <div className="flex-1 max-w-28 ml-4">
                    <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${week.averageScore}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                        className={`absolute h-full rounded-full shadow-sm ${
                          colorScheme === 'emerald' ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500' :
                          colorScheme === 'yellow' ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500' :
                          'bg-gradient-to-r from-red-400 via-red-500 to-red-600'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Subtle Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </motion.div>
            );
          })}
        </div>

        {/* Modern Action Footer */}
        <div className="p-4 bg-gradient-to-r from-emerald-50/80 to-green-50/80 backdrop-blur-sm border-t border-emerald-200/50">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-2 gap-3 text-center"
          >
            <div>
              <div className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {trend > 0 ? '📈' : trend < 0 ? '📉' : '📊'}
              </div>
              <div className="text-xs font-medium text-slate-700">Trend</div>
              <div className="text-xs text-slate-500">
                {trend > 0 ? 'Improving' : trend < 0 ? 'Declining' : 'Stable'}
              </div>
            </div>

            <div>
              <div className="text-lg font-bold text-emerald-600">{overallAverage}%</div>
              <div className="text-xs font-medium text-slate-700">Average</div>
              <div className="text-xs text-slate-500">{weeklyProgress.length} weeks</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 