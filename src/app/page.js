'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { motion } from 'framer-motion';
import { 
  Clock, 
  FileText, 
  BookOpen, 
  Users, 
  Trophy,
  Brain,
  Target,
  TrendingUp,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  BarChart3,
  Shield,
  Zap,
  Award,
  ChevronRight,
  GraduationCap,
  Smartphone,
  Globe,
  Lock,
  Lightbulb,
  MessageSquare,
  Heart
} from 'lucide-react';
import Footer from './components/Footer';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  );
}

function HomePage() {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const router = useRouter();
  const [livePracticeSets, setLivePracticeSets] = useState([]);
  const [loadingPracticeSets, setLoadingPracticeSets] = useState(true);
  const [stats, setStats] = useState({
    totalTests: '500+',
    totalQuestions: '5,000+',
    successRate: '95%',
    avgImprovement: '40%'
  });

  // Sample MCQ Questions Database
  const questionBank = {
    physics: [
      {
        question: "Why does quantum tunneling allow particles to pass through energy barriers they classically shouldn't be able to cross?",
        options: ["Particles gain energy temporarily", "Wave nature creates probability distributions", "Barriers become permeable", "Time dilation effects occur"],
        correct: 1,
        explanation: "Quantum mechanics describes particles as probability waves, where the wave function can extend beyond classical barriers, allowing finite probability of transmission."
      },
      {
        question: "What fundamental principle explains why you cannot simultaneously know a particle's exact position and momentum?",
        options: ["Observer effect disturbance", "Measurement apparatus limitations", "Intrinsic quantum uncertainty", "Classical measurement errors"],
        correct: 2,
        explanation: "Heisenberg's uncertainty principle reflects fundamental quantum nature - not measurement limitations but intrinsic indeterminacy of complementary properties."
      },
      {
        question: "Why do superconductors expel magnetic fields rather than just conducting without resistance?",
        options: ["Perfect diamagnetism property", "Infinite conductivity effect", "Temperature-dependent behavior", "Crystal structure changes"],
        correct: 0,
        explanation: "The Meissner effect demonstrates perfect diamagnetism where superconductors actively expel magnetic fields, distinct from perfect conductivity which would only prevent field changes."
      },
      {
        question: "What causes the delayed choice quantum eraser to retroactively determine particle behavior?",
        options: ["Information travels backward in time", "Measurement collapses past possibilities", "Quantum entanglement transcends time", "Observer consciousness affects reality"],
        correct: 1,
        explanation: "The measurement choice determines which information becomes available, retroactively defining whether interference patterns existed, highlighting the role of information in quantum mechanics."
      },
      {
        question: "Why does General Relativity predict that time dilation occurs near massive objects?",
        options: ["Gravitational forces slow atomic motion", "Space-time curvature affects light paths", "Clocks run slower in gravity", "Time itself becomes curved"],
        correct: 3,
        explanation: "Einstein's theory shows gravity isn't a force but space-time curvature, where massive objects bend time itself, causing temporal intervals to stretch."
      },
      {
        question: "What principle explains why black holes have an information paradox?",
        options: ["Quantum mechanics requires information conservation", "Event horizons prevent escape", "Hawking radiation lacks information", "Singularities destroy data"],
        correct: 0,
        explanation: "Quantum mechanics demands information conservation (unitarity), but black hole evaporation via Hawking radiation appears to destroy information, creating a fundamental conflict."
      },
      {
        question: "Why do Cooper pairs form in superconductors despite electrons normally repelling each other?",
        options: ["Phonon-mediated attractive interaction", "Reduced electromagnetic repulsion", "Quantum tunneling effects", "Crystal lattice shielding"],
        correct: 0,
        explanation: "Electrons interact with the crystal lattice (phonons), creating an effective attractive interaction between electrons with opposite momenta and spins."
      },
      {
        question: "What makes dark energy fundamentally different from dark matter in cosmological models?",
        options: ["Different gravitational effects", "Opposite interaction strengths", "Dark energy causes acceleration", "Distinct detection methods"],
        correct: 2,
        explanation: "Dark matter gravitationally attracts and clumps, while dark energy provides repulsive pressure causing cosmic acceleration, representing opposite effects on expansion."
      },
      {
        question: "Why does quantum entanglement not allow faster-than-light communication despite instantaneous correlations?",
        options: ["No information transfers between particles", "Correlations don't carry usable data", "Measurement results remain random", "All of the above"],
        correct: 3,
        explanation: "While correlations are instantaneous, each measurement yields random results until compared with the partner's results, preventing superluminal information transfer."
      },
      {
        question: "What principle explains why antimatter and matter annihilate completely into energy?",
        options: ["Conservation of charge", "Mass-energy equivalence", "Quantum field theory", "Particle-antiparticle symmetry"],
        correct: 2,
        explanation: "Quantum field theory shows particles and antiparticles as excitations of the same field with opposite properties, naturally leading to complete annihilation."
      }
    ],
         chemistry: [
      {
        question: "Why do SN2 reactions show complete stereochemical inversion while SN1 reactions lead to racemization?",
        options: ["Different leaving group abilities", "Backside attack vs. planar carbocation", "Solvent polarity effects", "Temperature dependencies"],
        correct: 1,
        explanation: "SN2 involves direct backside nucleophilic attack causing inversion, while SN1 forms a planar carbocation intermediate allowing attack from either face."
      },
      {
        question: "What principle explains why aromatic compounds resist addition reactions that alkenes readily undergo?",
        options: ["Resonance stabilization energy", "Increased electron density", "Ring strain effects", "Hybridization differences"],
        correct: 0,
        explanation: "Aromatic stabilization energy (typically 20-36 kcal/mol) makes addition reactions thermodynamically unfavorable as they destroy aromaticity."
      },
      {
        question: "Why do transition metals exhibit variable oxidation states while main group metals typically don't?",
        options: ["d-orbital energy similarities", "Nuclear charge variations", "Ionic radius differences", "Crystal field effects"],
        correct: 0,
        explanation: "Transition metals have d-orbitals with similar energies to valence s-orbitals, allowing multiple electron removal without prohibitive energy costs."
      },
      {
        question: "What makes alpha-amino acids exist predominantly as zwitterions in aqueous solution?",
        options: ["Hydrophobic interactions", "Internal proton transfer equilibrium", "Hydrogen bonding networks", "Electrostatic stabilization"],
        correct: 1,
        explanation: "The amino group (basic) and carboxyl group (acidic) undergo intramolecular proton transfer, creating a dipolar ion stabilized by the aqueous environment."
      },
      {
        question: "Why do enzymes show saturation kinetics while simple catalysts exhibit first-order behavior?",
        options: ["Enzyme denaturation occurs", "Substrate binding site limitation", "Product inhibition effects", "Conformational changes"],
        correct: 1,
        explanation: "Enzymes have limited active sites; at high substrate concentrations, all sites become occupied (Vmax reached), unlike simple catalysts with unlimited binding."
      },
      {
        question: "What thermodynamic principle explains why protein folding is spontaneous despite entropy decrease?",
        options: ["Hydrophobic effect dominates", "Enthalpy changes compensate", "Temperature-dependent equilibrium", "Gibbs free energy minimization"],
        correct: 3,
        explanation: "While protein folding decreases conformational entropy, the hydrophobic effect and intramolecular interactions create favorable ΔG = ΔH - TΔS."
      },
      {
        question: "Why do Lewis acids activate electrophiles in organic reactions rather than act as electron acceptors directly?",
        options: ["Coordinate with leaving groups", "Polarize electron-rich bonds", "Stabilize carbocation intermediates", "All of the above"],
        correct: 3,
        explanation: "Lewis acids enhance electrophilicity by coordinating to electron-rich sites, polarizing bonds, and stabilizing charged intermediates through electron pair acceptance."
      },
      {
        question: "What mechanism allows hemoglobin to show cooperative oxygen binding while myoglobin doesn't?",
        options: ["Different heme structures", "Quaternary structure changes", "Allosteric regulation", "Conformational transitions"],
        correct: 1,
        explanation: "Hemoglobin's tetrameric structure allows conformational changes upon O₂ binding that affect other subunits, while monomeric myoglobin lacks this communication."
      },
      {
        question: "Why do protic solvents favor SN1 and E1 mechanisms over SN2 and E2?",
        options: ["Stabilize ionic intermediates", "Increase nucleophile basicity", "Reduce activation energy", "Prevent side reactions"],
        correct: 0,
        explanation: "Protic solvents stabilize carbocation and transition state charge development through hydrogen bonding, favoring mechanisms with ionic intermediates."
      },
      {
        question: "What property makes graphene exhibit extraordinary electrical conductivity despite being a single carbon layer?",
        options: ["Delocalized π-electrons", "Zero bandgap semiconductor", "Dirac cone electronic structure", "All of the above"],
        correct: 3,
        explanation: "Graphene's unique electronic properties arise from delocalized π-electrons forming Dirac cones at the Fermi level, creating zero-gap behavior and high mobility."
      }
    ],
         botany: [
      {
        question: "Why do C4 plants outcompete C3 plants in hot, dry environments despite having more complex photosynthetic machinery?",
        options: ["Higher water use efficiency", "Reduced photorespiration losses", "Enhanced carbon concentrating mechanism", "All of the above"],
        correct: 3,
        explanation: "C4 plants concentrate CO₂ around RuBisCO, reducing photorespiration, improving water efficiency, and maintaining photosynthesis under stress conditions."
      },
      {
        question: "What mechanism explains why mycorrhizal associations benefit plants beyond simple nutrient exchange?",
        options: ["Enhanced pathogen resistance", "Improved drought tolerance", "Extended soil exploration", "All of the above"],
        correct: 3,
        explanation: "Mycorrhizae provide systemic resistance, improve water uptake, expand nutrient access area, and create beneficial microbiome interactions."
      },
      {
        question: "Why do plants exhibit apical dominance, and how does auxin coordinate this response?",
        options: ["Prevents resource competition", "Auxin inhibits lateral bud growth", "Maintains directional growth", "All of the above"],
        correct: 3,
        explanation: "Apical dominance optimizes light capture through auxin-mediated suppression of lateral buds, ensuring resources focus on primary growth."
      },
      {
        question: "What evolutionary advantage explains why many plants developed secondary metabolites that are toxic to herbivores?",
        options: ["Chemical defense strategy", "Metabolic waste disposal", "Energy storage mechanism", "Reproductive enhancement"],
        correct: 0,
        explanation: "Secondary metabolites evolved as chemical defenses, deterring herbivory and providing competitive advantages despite metabolic costs."
      },
      {
        question: "Why do CAM plants open their stomata at night rather than during the day like most other plants?",
        options: ["Temporal CO₂ storage strategy", "Reduced water loss mechanism", "Temperature optimization", "All of the above"],
        correct: 3,
        explanation: "CAM plants fix CO₂ at night when temperatures are lower and humidity higher, storing it as malate to minimize water loss."
      },
      {
        question: "What principle explains why phloem transport can move in any direction while xylem transport is unidirectional?",
        options: ["Active vs. passive transport", "Pressure-flow vs. transpiration-pull", "Living vs. dead tissue", "All of the above"],
        correct: 3,
        explanation: "Phloem uses living sieve elements with active loading creating pressure gradients from source to sink, while xylem relies on transpiration pull."
      },
      {
        question: "Why do many flowering plants exhibit self-incompatibility mechanisms that prevent self-fertilization?",
        options: ["Maintains genetic diversity", "Prevents inbreeding depression", "Promotes outcrossing", "All of the above"],
        correct: 3,
        explanation: "Self-incompatibility systems evolved to maintain genetic variation, avoid deleterious recessive alleles, and promote adaptive evolution."
      },
      {
        question: "What mechanism allows nitrogen-fixing bacteria in root nodules to protect nitrogenase from oxygen damage?",
        options: ["Leghemoglobin oxygen scavenging", "Spatial compartmentalization", "Temporal regulation", "All of the above"],
        correct: 3,
        explanation: "Plants provide leghemoglobin to bind oxygen, create specialized nodule environments, and coordinate bacterial metabolism to protect nitrogenase."
      },
      {
        question: "Why do plants produce volatile organic compounds (VOCs) that attract predators of their herbivorous insects?",
        options: ["Indirect defense mechanism", "Tritrophic interaction strategy", "Chemical communication system", "All of the above"],
        correct: 3,
        explanation: "VOCs represent sophisticated indirect defense, recruiting natural enemies of herbivores through chemical signals that benefit plant fitness."
      },
      {
        question: "What evolutionary pressure led to the development of double fertilization in angiosperms?",
        options: ["Nutritional resource optimization", "Reproductive assurance", "Genetic recombination enhancement", "Endosperm development control"],
        correct: 0,
        explanation: "Double fertilization ensures endosperm development only when fertilization succeeds, preventing wasteful resource investment in unfertilized ovules."
      }
    ],
    zoology: [
      {
        question: "Why do deep-sea fish often possess bioluminescent organs while surface fish rarely do?",
        options: ["Energy conservation in cold water", "Communication in aphotic zone", "Protection from UV radiation", "Enhanced metabolism"],
        correct: 1,
        explanation: "In the aphotic zone where sunlight doesn't penetrate, bioluminescence serves as the primary means of communication, predator avoidance, and prey attraction."
      },
      {
        question: "What evolutionary advantage explains why most venomous snakes have heat-sensing pit organs?",
        options: ["Temperature regulation", "Enhanced prey detection", "Predator detection", "Mate recognition"],
        correct: 1,
        explanation: "Heat-sensing pit organs allow venomous snakes to detect warm-blooded prey even in complete darkness, maximizing hunting efficiency for their metabolically expensive venom."
      },
      {
        question: "Why do migratory birds change their gut morphology during different phases of migration?",
        options: ["Digestive efficiency optimization", "Weight reduction for flight", "Immune system enhancement", "Reproductive preparation"],
        correct: 0,
        explanation: "Birds adaptively modify gut size and structure to optimize nutrient absorption during feeding phases and minimize weight during active flight phases of migration."
      },
      {
        question: "What mechanism allows tardigrades to survive extreme dehydration that would kill most other animals?",
        options: ["Specialized kidney function", "Cryptobiotic state induction", "Enhanced membrane stability", "Accelerated protein synthesis"],
        correct: 1,
        explanation: "Tardigrades enter cryptobiosis, replacing cellular water with protective sugars and proteins, essentially halting all metabolic processes until rehydration occurs."
      },
      {
        question: "Why do social insects like bees exhibit haplodiploidy while most other social animals are diploid?",
        options: ["Enhanced genetic diversity", "Increased altruistic behavior", "Improved disease resistance", "Simplified reproduction"],
        correct: 1,
        explanation: "Haplodiploidy increases relatedness between sisters (75%) compared to parents (50%), making altruistic behavior toward siblings evolutionarily advantageous over reproduction."
      },
      {
        question: "What explains the convergent evolution of echolocation in both bats and dolphins?",
        options: ["Similar brain structure", "Identical genetic mutations", "Comparable environmental pressures", "Shared ancestral traits"],
        correct: 2,
        explanation: "Both groups independently evolved echolocation to navigate and hunt in environments where vision is limited (darkness for bats, murky water for dolphins)."
      },
      {
        question: "Why do many parasites have more complex life cycles than their free-living relatives?",
        options: ["Increased genetic recombination", "Host immune system evasion", "Enhanced dispersal mechanisms", "Improved resource utilization"],
        correct: 1,
        explanation: "Complex life cycles with multiple hosts allow parasites to evade host immune responses, reset infection dynamics, and exploit different ecological niches."
      },
      {
        question: "What advantage does countercurrent blood flow provide in fish gills compared to concurrent flow?",
        options: ["Reduced energy expenditure", "Maximum oxygen extraction efficiency", "Protection from pathogens", "Enhanced buoyancy control"],
        correct: 1,
        explanation: "Countercurrent flow maintains a constant concentration gradient across the gill surface, allowing up to 85% oxygen extraction versus ~50% with concurrent flow."
      },
      {
        question: "Why do hibernating mammals periodically wake up during winter despite energy conservation goals?",
        options: ["Temperature regulation", "Waste elimination needs", "Immune system maintenance", "Memory consolidation"],
        correct: 2,
        explanation: "Periodic arousal allows hibernating mammals to restore immune function, clear metabolic wastes, and prevent cellular damage from prolonged hypothermia."
      },
      {
        question: "What evolutionary pressure led to the development of warning coloration in toxic animals?",
        options: ["Mate attraction", "Thermoregulation", "Predator education", "Camouflage enhancement"],
        correct: 2,
        explanation: "Aposematic coloration educates predators to avoid toxic prey, benefiting both predator (avoids harm) and prey (avoids predation) through learned avoidance behavior."
      }
    ]
  };

  // State for interactive MCQ
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [questionSubject, setQuestionSubject] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Load practice sets for non-authenticated users
    if (!isAuthenticated && !isLoading) {
      loadLivePracticeSets();
    }
  }, [isAuthenticated, isLoading]);

  // Function to get a random question
  const getRandomQuestion = () => {
    const subjects = ['physics', 'chemistry', 'botany', 'zoology'];
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    const subjectQuestions = questionBank[randomSubject];
    const randomQuestion = subjectQuestions[Math.floor(Math.random() * subjectQuestions.length)];
    
    setCurrentQuestion(randomQuestion);
    setQuestionSubject(randomSubject);
    setSelectedOption(null);
    setShowResult(false);
  };

  // Initialize with a random question
  useEffect(() => {
    getRandomQuestion();
  }, []);

  // Handle option selection
  const handleOptionSelect = (optionIndex) => {
    if (showResult) return; // Prevent changing after showing result
    
    setSelectedOption(optionIndex);
    setShowResult(true);
  };

  // Function to get next question
  const getNextQuestion = () => {
    getRandomQuestion();
  };

  const loadLivePracticeSets = async () => {
    try {
      setLoadingPracticeSets(true);
      const response = await fetch('/api/practice-sets');
      const data = await response.json();
      
      if (data.success) {
        setLivePracticeSets(data.practiceSets?.slice(0, 6) || []);
      } else {
        console.error('Failed to load practice sets:', data.message);
      }
    } catch (error) {
      console.error('Error loading practice sets:', error);
    } finally {
      setLoadingPracticeSets(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; 
  }

  const features = [
    {
      icon: Brain,
      title: "Smart Assessment",
      description: "AI-powered question selection adapts to your learning pace and identifies knowledge gaps.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: BarChart3,
      title: "Detailed Analytics",
      description: "Comprehensive performance tracking with insights into strengths and improvement areas.",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: Clock,
      title: "Timed Practice",
      description: "Realistic exam conditions with customizable time limits to build confidence.",
      color: "from-purple-500 to-violet-600"
    },
    {
      icon: Trophy,
      title: "Achievement System",
      description: "Gamified learning with badges, streaks, and leaderboards to keep you motivated.",
      color: "from-orange-500 to-amber-600"
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Study anywhere, anytime with our fully responsive mobile-first design.",
      color: "from-pink-500 to-rose-600"
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Enterprise-grade security with anti-cheating measures and data protection.",
      color: "from-cyan-500 to-blue-600"
    }
  ];



  const subjects = [
    { name: "Physics", count: "1,000+ Questions", color: "bg-green-100 text-green-800" },
    { name: "Chemistry", count: "1,000+ Questions", color: "bg-yellow-100 text-yellow-800" },
    { name: "Zoology", count: "1,200+ Questions", color: "bg-red-100 text-red-800" },
    { name: "Botany", count: "1,500+ Questions", color: "bg-purple-100 text-purple-800" },
    { name: "MAT", count: "800+ Questions", color: "bg-pink-100 text-pink-800" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/50 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Entrance.academy
              </span>
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Features
              </Link>
              <Link href="#subjects" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Subjects
              </Link>
              <Link href="/forum" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Community
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                href="/login"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/signup"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </Link>
              </motion.div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <Link 
                href="/login"
                className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/signup"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6"
              >
                <Zap className="w-4 h-4 mr-2" />
                Trusted by Students
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Master Your
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block">
                  Exams with AI
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 mb-8 max-w-2xl">
                Transform your exam preparation with our intelligent MCQ platform. Get personalized insights, practice with real exam conditions, and boost your confidence.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/signup"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/live-tests"
                    className="border-2 border-slate-300 text-slate-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 flex items-center justify-center"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Try Demo
                  </Link>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6"
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">{stats.totalTests}</div>
                  <div className="text-sm text-slate-600">Active Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">{stats.totalQuestions}</div>
                  <div className="text-sm text-slate-600">Total Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">{stats.successRate}</div>
                  <div className="text-sm text-slate-600">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">{stats.avgImprovement}</div>
                  <div className="text-sm text-slate-600">Avg Improvement</div>
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="absolute top-4 left-4 flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-semibold text-slate-900">Sample MCQ Question</div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        questionSubject === 'physics' ? 'bg-blue-100 text-blue-800' :
                        questionSubject === 'chemistry' ? 'bg-yellow-100 text-yellow-800' :
                        questionSubject === 'botany' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {questionSubject}
                      </span>
                      <button
                        onClick={getNextQuestion}
                        className="text-slate-500 hover:text-slate-700 transition-colors"
                        title="Try another question"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                                     {currentQuestion && (
                     <div className="bg-slate-50 rounded-xl p-4 mb-4">
                       <p className="text-slate-700 mb-4 text-sm">{currentQuestion.question}</p>
                       <div className="space-y-2">
                         {currentQuestion.options.map((option, index) => {
                           let optionClass = "flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-all duration-200 ";
                           
                           if (selectedOption === null) {
                             // Before selection - all options are clickable
                             optionClass += "hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200";
                           } else {
                             // After selection - show results
                             if (index === currentQuestion.correct) {
                               optionClass += "bg-green-100 border border-green-300 text-green-900";
                             } else if (index === selectedOption && index !== currentQuestion.correct) {
                               optionClass += "bg-red-100 border border-red-300 text-red-900";
                             } else {
                               optionClass += "opacity-50";
                             }
                           }
                           
                           return (
                             <div
                               key={index}
                               className={optionClass}
                               onClick={() => handleOptionSelect(index)}
                             >
                               <div className="flex items-center space-x-2">
                                 <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                   selectedOption === null 
                                     ? "border-2 border-slate-400" 
                                     : index === currentQuestion.correct
                                     ? "bg-green-500"
                                     : index === selectedOption && index !== currentQuestion.correct
                                     ? "bg-red-500"
                                     : "border-2 border-slate-400"
                                 }`}>
                                   {selectedOption !== null && index === currentQuestion.correct && (
                                     <CheckCircle className="w-3 h-3 text-white" />
                                   )}
                                   {selectedOption !== null && index === selectedOption && index !== currentQuestion.correct && (
                                     <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                     </svg>
                                   )}
                                 </div>
                                 <span className={`text-sm ${
                                   selectedOption === null 
                                     ? 'text-slate-800 font-medium' 
                                     : selectedOption !== null && index === currentQuestion.correct 
                                     ? 'font-semibold text-green-900' 
                                     : selectedOption !== null && index === selectedOption && index !== currentQuestion.correct
                                     ? 'font-semibold text-red-900'
                                     : 'text-slate-700 font-medium'
                                 }`}>
                                   {option}
                                 </span>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                      
                                             {showResult && (
                         <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                           <div className="flex items-start space-x-2">
                             <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                             <div>
                               <div className="text-blue-900 font-medium text-xs mb-1">Explanation:</div>
                               <div className="text-blue-800 text-xs leading-tight">{currentQuestion.explanation}</div>
                             </div>
                           </div>
                         </div>
                       )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    {showResult ? (
                      <span className={`font-medium flex items-center ${
                        selectedOption === currentQuestion.correct ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedOption === currentQuestion.correct ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Correct Answer!
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Try Again
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">Click an option to see result</span>
                    )}
                    <span className="text-slate-500">Interactive Demo</span>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -left-4 bg-green-500 text-white p-3 rounded-xl shadow-lg"
              >
                <Trophy className="w-6 h-6" />
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                className="absolute -bottom-4 -right-4 bg-blue-500 text-white p-3 rounded-xl shadow-lg"
              >
                <Target className="w-6 h-6" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Everything You Need to
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Excel</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools and insights you need to master your exams and achieve your academic goals.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section id="subjects" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Master Every
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"> Subject</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive question banks covering all major subjects with thousands of carefully curated MCQs.
            </p>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">{subject.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${subject.color}`}>
                    {subject.count}
                  </span>
                </div>
                <Link 
                  href="/signup"
                  className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Start Practicing
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Practice Sets */}
      {!loadingPracticeSets && livePracticeSets.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Featured
                <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent"> Practice Sets</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Try our popular practice sets and experience the Entrance.academy difference.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {livePracticeSets.map((set, index) => (
                <motion.div
                  key={set.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Live
                    </span>
                    <div className="flex items-center text-slate-600 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {set.estimatedTime || 60} mins
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{set.title}</h3>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{set.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-slate-600 text-sm">
                      <FileText className="w-4 h-4 mr-1" />
                      {set.questionsCount} Questions
                    </div>
                   
                  </div>
                  
                  <Link 
                    href="/signup"
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 text-center block"
                  >
                    Start Practice
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}



      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-white/10 rounded-full"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to Ace Your Exams?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of successful students and start your journey to exam excellence today. No credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/signup"
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </motion.div>
              <span className="text-blue-200">or</span>
              <Link 
                href="/live-tests"
                className="text-white border-2 border-white/30 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-200"
              >
                Try Demo Test
              </Link>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-blue-200 text-sm">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Free 7-day trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                No setup required
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Cancel anytime
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomePage />
    </Suspense>
  );
}
