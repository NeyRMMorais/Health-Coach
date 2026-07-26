import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import {
  Apple,
  LogIn,
  LogOut,
  Sliders,
  Sparkles,
  Flame,
  Activity,
  Plus,
  Scale,
  Settings,
  RefreshCw,
  Heart,
  Copy,
  MessageSquare,
  Bookmark
} from 'lucide-react';

import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, FoodLog, SavedMeal } from './types';
import ProfileModal from './components/ProfileModal';
import FeedbackModal from './components/FeedbackModal';
import SavedMealsModal from './components/SavedMealsModal';
import MetricCircle from './components/MetricCircle';
import FoodLogSection from './components/FoodLogSection';
import MealGenerator from './components/MealGenerator';
import AnalyticsDashboard from './components/AnalyticsDashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSavedMealsOpen, setIsSavedMealsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tracker' | 'suggest' | 'analytics'>('tracker');
  const [authError, setAuthError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyAvailability = () => {
    const limitVal = profile?.dailyCaloricLimit ?? 2000;
    const pTargetVal = profile?.proteinTarget ?? 130;
    const cTargetVal = profile?.carbsTarget ?? 220;
    const fTargetVal = profile?.fatsTarget ?? 65;

    const remainingCalories = Math.max(0, limitVal - todayCalories);
    const remainingProtein = Math.max(0, pTargetVal - todayProtein);
    const remainingCarbs = Math.max(0, cTargetVal - todayCarbs);
    const remainingFats = Math.max(0, fTargetVal - todayFats);

    const text = `[Availability:
Calories: ${remainingCalories}/${limitVal}
Proteins: ${remainingProtein}g/${pTargetVal}g
Carbohydrates: ${remainingCarbs}g/${cTargetVal}g
Fats: ${remainingFats}g/${fTargetVal}g]`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);

  const handleAddFeedback = async (feedbackData: { type: 'bug' | 'improvement'; text: string }) => {
    if (!user) return;
    const feedbackId = doc(collection(db, 'feedback')).id;
    const path = `feedback/${feedbackId}`;
    try {
      const newFeedback = {
        id: feedbackId,
        userId: user.uid,
        ...feedbackData,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'feedback', feedbackId), newFeedback);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      throw err;
    }
  };

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) {
        try {
          const guestSaved = localStorage.getItem('guest_saved_meals');
          setSavedMeals(guestSaved ? JSON.parse(guestSaved) : []);

          const guestLogs = localStorage.getItem('guest_food_logs');
          setFoodLogs(guestLogs ? JSON.parse(guestLogs) : []);

          const guestProf = localStorage.getItem('guest_profile');
          if (guestProf) {
            setProfile(JSON.parse(guestProf));
          } else {
            setProfile({
              userId: 'guest',
              dailyCaloricLimit: 2000,
              proteinTarget: 130,
              carbsTarget: 220,
              fatsTarget: 65,
              weight: 75.0,
              targetWeight: 72.0,
              dietaryPreferences: [],
            });
          }
        } catch (e) {
          console.error('Failed to load guest data from localStorage:', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Monitor Profile, Food Logs, and Saved Meals when User is Authenticated
  useEffect(() => {
    if (!user) return;

    // 1. Profile Snap Listener
    const profilePath = `users/${user.uid}`;
    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      async (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // If profile doesn't exist, bootstrap a default profile automatically
          await initializeDefaultProfile(user.uid);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, profilePath);
      }
    );

    // 2. Food Logs Snap Listener
    const logsPath = `users/${user.uid}/foodLogs`;
    const unsubLogs = onSnapshot(
      collection(db, logsPath),
      (snapshot) => {
        const loadedLogs: FoodLog[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedLogs.push({
            id: docSnap.id,
            userId: data.userId,
            name: data.name,
            mealType: data.mealType,
            calories: data.calories,
            protein: data.protein,
            carbs: data.carbs,
            fats: data.fats,
            date: data.date,
            time: data.time || '12:00',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as FoodLog);
        });

        // Client-side sort: newest first
        loadedLogs.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });

        setFoodLogs(loadedLogs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, logsPath);
      }
    );

    // 3. Saved Meals Snap Listener
    const savedMealsPath = `users/${user.uid}/savedMeals`;
    const unsubSavedMeals = onSnapshot(
      collection(db, savedMealsPath),
      (snapshot) => {
        const loadedMeals: SavedMeal[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedMeals.push({
            id: docSnap.id,
            userId: data.userId,
            name: data.name,
            mealType: data.mealType,
            calories: data.calories,
            protein: data.protein,
            carbs: data.carbs,
            fats: data.fats,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as SavedMeal);
        });

        // Client-side sort: newest first
        loadedMeals.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });

        setSavedMeals(loadedMeals);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, savedMealsPath);
      }
    );

    return () => {
      unsubProfile();
      unsubLogs();
      unsubSavedMeals();
    };
  }, [user]);

  // Initializing profile with realistic defaults
  const initializeDefaultProfile = async (uid: string) => {
    const path = `users/${uid}`;
    try {
      const defaultProfile: UserProfile = {
        userId: uid,
        dailyCaloricLimit: 2000,
        proteinTarget: 130,
        carbsTarget: 220,
        fatsTarget: 65,
        weight: 75.0,
        targetWeight: 72.0,
        dietaryPreferences: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', uid), defaultProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleSignIn = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError('The Google sign-in window was closed before completing authentication. Please click the button again to retry.');
      } else if (err?.code === 'auth/blocked-by-popup-opener' || err?.message?.includes('popup')) {
        setAuthError('The sign-in popup was blocked. Please enable popups in your browser settings or click the "Open in New Tab" link below to login.');
      } else {
        setAuthError(err?.message || 'An unexpected error occurred during authentication. Please try again.');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const handleSaveProfile = async (updatedFields: Partial<UserProfile>) => {
    if (!user) {
      const updated = { ...(profile || {}), ...updatedFields } as UserProfile;
      setProfile(updated);
      localStorage.setItem('guest_profile', JSON.stringify(updated));
      return;
    }
    const path = `users/${user.uid}`;
    try {
      const updatedProfile = {
        ...profile,
        ...updatedFields,
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleAddLog = async (logData: Omit<FoodLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      const newLog: FoodLog = {
        id: 'guest_log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        userId: 'guest',
        ...logData,
      };
      const updatedLogs = [newLog, ...foodLogs];
      setFoodLogs(updatedLogs);
      localStorage.setItem('guest_food_logs', JSON.stringify(updatedLogs));
      return;
    }
    const logId = doc(collection(db, `users/${user.uid}/foodLogs`)).id;
    const path = `users/${user.uid}/foodLogs/${logId}`;
    try {
      const newLog = {
        id: logId,
        userId: user.uid,
        ...logData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, `users/${user.uid}/foodLogs`, logId), newLog);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!user) {
      const updatedLogs = foodLogs.filter((l) => l.id !== logId);
      setFoodLogs(updatedLogs);
      localStorage.setItem('guest_food_logs', JSON.stringify(updatedLogs));
      return;
    }
    const path = `users/${user.uid}/foodLogs/${logId}`;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/foodLogs`, logId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleUpdateLog = async (logId: string, updatedFields: Partial<FoodLog>) => {
    if (!user) {
      const updatedLogs = foodLogs.map((l) => (l.id === logId ? { ...l, ...updatedFields } : l));
      setFoodLogs(updatedLogs);
      localStorage.setItem('guest_food_logs', JSON.stringify(updatedLogs));
      return;
    }
    const path = `users/${user.uid}/foodLogs/${logId}`;
    try {
      const updatedLog = {
        ...updatedFields,
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, `users/${user.uid}/foodLogs`, logId), updatedLog, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Helper to log suggested meals from the generator
  const handleLogSuggestedMeal = async (meal: {
    name: string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    await handleAddLog({
      ...meal,
      date: todayStr,
      time: timeStr,
    });
  };

  // Saved Meal CRUD handlers
  const handleAddSavedMeal = async (mealData: Omit<SavedMeal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const mealId = user ? doc(collection(db, `users/${user.uid}/savedMeals`)).id : 'guest_meal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newMeal: SavedMeal = {
      id: mealId,
      userId: user ? user.uid : 'guest',
      ...mealData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSavedMeals((prev) => {
      const updated = [newMeal, ...prev.filter(m => m.id !== mealId)];
      if (!user) {
        localStorage.setItem('guest_saved_meals', JSON.stringify(updated));
      }
      return updated;
    });

    if (user) {
      const path = `users/${user.uid}/savedMeals/${mealId}`;
      try {
        const firestoreMeal = {
          id: mealId,
          userId: user.uid,
          ...mealData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, `users/${user.uid}/savedMeals`, mealId), firestoreMeal);
      } catch (err) {
        console.error('Firestore save meal error (retained locally):', err);
      }
    }
  };

  const handleDeleteSavedMeal = async (mealId: string) => {
    setSavedMeals((prev) => {
      const updated = prev.filter((m) => m.id !== mealId);
      if (!user) {
        localStorage.setItem('guest_saved_meals', JSON.stringify(updated));
      }
      return updated;
    });

    if (user) {
      const path = `users/${user.uid}/savedMeals/${mealId}`;
      try {
        await deleteDoc(doc(db, `users/${user.uid}/savedMeals`, mealId));
      } catch (err) {
        console.error('Firestore delete saved meal error:', err);
      }
    }
  };

  const handleUpdateSavedMeal = async (mealId: string, updatedFields: Partial<SavedMeal>) => {
    setSavedMeals((prev) => {
      const updated = prev.map((m) => (m.id === mealId ? { ...m, ...updatedFields } : m));
      if (!user) {
        localStorage.setItem('guest_saved_meals', JSON.stringify(updated));
      }
      return updated;
    });

    if (user) {
      const path = `users/${user.uid}/savedMeals/${mealId}`;
      try {
        const updatedMeal = {
          ...updatedFields,
          updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, `users/${user.uid}/savedMeals`, mealId), updatedMeal, { merge: true });
      } catch (err) {
        console.error('Firestore update saved meal error:', err);
      }
    }
  };

  const handleLogSavedMealToDiary = async (meal: SavedMeal) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    await handleAddLog({
      name: meal.name,
      mealType: meal.mealType,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      date: todayStr,
      time: timeStr,
    });
  };

  // Calculate current date's total nutrition log
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = foodLogs.filter((log) => log.date === todayStr);

  const todayCalories = todayLogs.reduce((sum, log) => sum + log.calories, 0);
  const todayProtein = todayLogs.reduce((sum, log) => sum + log.protein, 0);
  const todayCarbs = todayLogs.reduce((sum, log) => sum + log.carbs, 0);
  const todayFats = todayLogs.reduce((sum, log) => sum + log.fats, 0);

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Apple className="h-12 w-12 text-emerald-600 animate-bounce mb-3" />
        <h2 className="font-bold text-slate-800 text-lg">Initializing Health Coach...</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to Firestore secure database</p>
      </div>
    );
  }

  // Welcome / Authentication Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="unauth-landing-page">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl p-8 space-y-8 text-center"
          >
            {/* App Brand */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-emerald-50 p-4 rounded-full">
                <Apple className="h-10 w-10 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-800">Health Coach</h1>
              <p className="text-sm text-slate-500 font-medium">A smarter way to fuel your goals.</p>
            </div>

            {/* Visual/Marketing Features List */}
            <div className="space-y-4 text-left border-t border-slate-50 pt-6">
              <div className="flex gap-3">
                <div className="shrink-0 bg-emerald-50 h-6 w-6 rounded-full flex items-center justify-center text-xs">⚡</div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">AI Quick Log</h4>
                  <p className="text-xs text-slate-400">Describe what you ate in plain text, and let AI estimate the nutritional breakdown.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="shrink-0 bg-emerald-50 h-6 w-6 rounded-full flex items-center justify-center text-xs">🎯</div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Calorie & Macro Goals</h4>
                  <p className="text-xs text-slate-400">Set clear daily targets for protein, carbs, and fats to stay on track.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="shrink-0 bg-emerald-50 h-6 w-6 rounded-full flex items-center justify-center text-xs">🥗</div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Gemini Wholesome Recipes</h4>
                  <p className="text-xs text-slate-400">Generate creative meal options tailored specifically to your biometric targets and restrictions.</p>
                </div>
              </div>
            </div>

            {/* Login Action */}
            <div className="space-y-4">
              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-left text-xs text-rose-700 space-y-1.5"
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    <span className="shrink-0 text-rose-500">⚠️</span>
                    <span>Sign-In Issue</span>
                  </div>
                  <p className="leading-relaxed text-rose-600/90">{authError}</p>
                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={handleSignIn}
                      className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded font-bold text-[10px] transition"
                    >
                      Retry Sign-In
                    </button>
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded font-bold text-[10px] transition inline-block text-center"
                    >
                      Open in New Tab ↗
                    </a>
                  </div>
                </motion.div>
              )}
              <button
                onClick={handleSignIn}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl py-3 text-sm transition flex items-center justify-center gap-2.5 shadow hover:shadow-md"
              >
                <LogIn className="h-4 w-4" />
                Sign In with Google
              </button>
              <p className="text-[10px] text-slate-400 leading-normal px-4">
                We use secure Firebase Authentication to save your dietary profile and meal logs reliably in the cloud.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Humble branding footer */}
        <footer className="py-6 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            <span>Wholesome nutrition insights powered by Google AI Studio</span>
            <span>•</span>
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
          </p>
        </footer>
      </div>
    );
  }

  // Dashboard targets percentages
  const limit = profile?.dailyCaloricLimit ?? 2000;
  const pTarget = profile?.proteinTarget ?? 130;
  const cTarget = profile?.carbsTarget ?? 220;
  const fTarget = profile?.fatsTarget ?? 65;

  const pPct = Math.min(Math.round((todayProtein / pTarget) * 100), 100);
  const cPct = Math.min(Math.round((todayCarbs / cTarget) * 100), 100);
  const fPct = Math.min(Math.round((todayFats / fTarget) * 100), 100);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="auth-dashboard">
      <main className="flex-1 pb-16">
        {/* Header bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Left side brand */}
            <div className="flex items-center gap-2">
              <Apple className="h-6 w-6 text-emerald-600" />
              <span className="font-extrabold text-slate-800 text-md tracking-tight">Health Coach</span>
            </div>

            {/* Right side user menu */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSavedMealsOpen(true)}
                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5"
                title="Saved Meal Ideas Library"
              >
                <Bookmark className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                <span className="hidden sm:inline text-xs font-semibold">Saved Library ({savedMeals.length})</span>
              </button>

              <div className="h-6 w-[1px] bg-slate-100" />

              <button
                onClick={() => setIsFeedbackOpen(true)}
                className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 rounded-xl transition flex items-center gap-1"
                title="Report Bug / Suggest Improvement"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-semibold">Feedback</span>
              </button>

              <div className="h-6 w-[1px] bg-slate-100" />

              <button
                onClick={() => setIsProfileOpen(true)}
                className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 rounded-xl transition flex items-center gap-1"
                title="Profile & Goals Settings"
              >
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-semibold">Goals</span>
              </button>

              <div className="h-6 w-[1px] bg-slate-100" />

              {/* User Identity */}
              <div className="flex items-center gap-2">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-7 w-7 rounded-full border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="hidden md:inline text-xs font-bold text-slate-600 truncate max-w-[120px]">
                  {user.displayName?.split(' ')[0]}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
          
          {/* Main Visual Tabs (Daily Tracker vs Meal Generator vs Analytics) */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm max-w-md">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                activeTab === 'tracker'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              📊 Tracker
            </button>
            <button
              onClick={() => setActiveTab('suggest')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center justify-center gap-1 ${
                activeTab === 'suggest'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Sparkles className="h-3 w-3 text-amber-400 fill-amber-400" />
              Meal Suggester
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center justify-center gap-1 ${
                activeTab === 'analytics'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              📈 Analytics
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'tracker' && (
              <motion.div
                key="tracker-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Visual Bento Dashboard (Calories & Macros Summary) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Calorie Progress Circle */}
                  <div className="relative bg-white rounded-2xl border border-slate-100 shadow-md p-6 flex flex-col items-center justify-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 text-center">
                      Energy Progress (Today)
                    </h3>
                    {/* Copy Availability Button */}
                    <button
                      onClick={handleCopyAvailability}
                      className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-50 border border-transparent hover:border-slate-100/60 transition shadow-none hover:shadow-sm"
                      title="Copy remaining availability to clipboard for Gemini"
                    >
                      {copied ? (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          ✓ Copied
                        </span>
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <MetricCircle value={todayCalories} target={limit} />
                  </div>

                  {/* Macros Progress Bars */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 flex flex-col justify-between md:col-span-2 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Macronutrients Targets (Today)
                    </h3>

                    <div className="space-y-4">
                      {/* Protein */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            Protein
                          </span>
                          <span className="text-slate-500 font-medium">
                            <strong>{todayProtein}g</strong> / {pTarget}g ({pPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Carbs */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-indigo-500" />
                            Carbohydrates
                          </span>
                          <span className="text-slate-500 font-medium">
                            <strong>{todayCarbs}g</strong> / {cTarget}g ({cPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${cPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Fats */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Fats
                          </span>
                          <span className="text-slate-500 font-medium">
                            <strong>{todayFats}g</strong> / {fTarget}g ({fPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${fPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Weight & preferences summary bar */}
                    <div className="border-t border-slate-50 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                      <div className="flex items-center gap-3">
                        <span>Current Weight: <strong className="text-slate-700">{profile?.weight || 0} kg</strong></span>
                        <span>Target: <strong className="text-slate-700">{profile?.targetWeight || 0} kg</strong></span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {profile?.dietaryPreferences?.map((pref) => (
                          <span key={pref} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">
                            {pref}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diary & Input Form Area */}
                <FoodLogSection
                  logs={foodLogs}
                  profile={profile}
                  savedMeals={savedMeals}
                  onAddLog={handleAddLog}
                  onDeleteLog={handleDeleteLog}
                  onUpdateLog={handleUpdateLog}
                  onSaveToLibrary={handleAddSavedMeal}
                  onOpenSavedMealsModal={() => setIsSavedMealsOpen(true)}
                />
              </motion.div>
            )}

            {activeTab === 'suggest' && (
              <motion.div
                key="suggest-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* AI Meal Generator */}
                <MealGenerator
                  userGoal={profile?.dailyCaloricLimit ? `Deficit / Limit: ${profile.dailyCaloricLimit} kcal` : 'Eat healthy'}
                  userDietaryPreferences={profile?.dietaryPreferences || []}
                  savedMeals={savedMeals}
                  onLogMeal={handleLogSuggestedMeal}
                  onSaveToLibrary={handleAddSavedMeal}
                />
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <AnalyticsDashboard
                  logs={foodLogs}
                  profile={profile}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Goal & Prefs Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={handleAddFeedback}
      />

      {/* Saved Meals Library Modal */}
      <SavedMealsModal
        isOpen={isSavedMealsOpen}
        onClose={() => setIsSavedMealsOpen(false)}
        savedMeals={savedMeals}
        onAddSavedMeal={handleAddSavedMeal}
        onDeleteSavedMeal={handleDeleteSavedMeal}
        onUpdateSavedMeal={handleUpdateSavedMeal}
        onLogSavedMeal={handleLogSavedMealToDiary}
      />

      {/* Humble branding footer */}
      <footer className="py-8 border-t border-slate-100 text-center bg-white">
        <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <span>Wholesome nutrition insights powered by Google AI Studio</span>
          <span>•</span>
          <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
        </p>
      </footer>
    </div>
  );
}
