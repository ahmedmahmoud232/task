/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  ListTodo, 
  Calendar,
  Filter,
  ChevronRight,
  LayoutGrid,
  BarChart3,
  Activity,
  User,
  Baby,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Mic,
  Palette,
  Bell,
  Star,
  Gift,
  Settings,
  ChevronLeft,
  Edit3,
  Stethoscope,
  Pill,
  ShoppingBag,
  MoreHorizontal,
  Sparkles,
  Wand2,
  BrainCircuit
} from 'lucide-react';

import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---

type Language = 'en' | 'ar';
type Priority = 'low' | 'medium' | 'high';
type TaskType = 'vaccination' | 'medicine' | 'requirements' | 'doctor' | 'other';
type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';
type SortOption = 'createdAt' | 'priority' | 'reminderAt';

interface Child {
  id: string;
  name: string;
  age: number;
  points: number;
  avatar: string;
}

interface ParentTask {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: Priority;
  color: string;
  reminderAt?: string;
  recurrence: Recurrence;
  childId?: string;
  completed: boolean;
  createdAt: number;
  imageAttachment?: string;
  audioAttachment?: string;
  isAlarmEnabled?: boolean;
}

interface ChildTask {
  id: string;
  childId: string;
  title: string;
  startTime: string;
  endTime: string;
  points: number;
  prizeImage?: string;
  reminder: boolean;
  completed: boolean;
}

type ViewType = 'parent_tasks' | 'children' | 'dashboard';

// --- Constants ---

const TASK_TYPES: { value: TaskType; label: string; icon: any }[] = [
  { value: 'vaccination', label: 'Vaccination', icon: Stethoscope },
  { value: 'medicine', label: 'Medicine', icon: Pill },
  { value: 'requirements', label: 'Requirements', icon: ShoppingBag },
  { value: 'doctor', label: 'Doctor', icon: Activity },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

const COLORS = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6'];

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };

const TRANSLATIONS = {
  en: {
    appName: 'FamilyFlow',
    appSubtitle: 'Parental Command Center',
    myTasks: 'My Tasks',
    newest: 'Newest',
    priority: 'Priority',
    dueDate: 'Due Date',
    all: 'All',
    vaccination: 'Vaccination',
    medicine: 'Medicine',
    requirements: 'Requirements',
    doctor: 'Doctor',
    other: 'Other',
    noTasks: 'No tasks found. Try adjusting your filters!',
    category: 'Category',
    reminder: 'Reminder',
    assignedTo: 'Assigned To',
    created: 'Created',
    childrenProfiles: 'Children Profiles',
    noChildren: 'Add your children to start assigning tasks!',
    yearsOld: 'Years Old',
    activeTasks: 'Active Tasks',
    assignNewTask: 'Assign New Task',
    navTasks: 'Tasks',
    navFamily: 'Family',
    navStats: 'Stats',
    newParentTask: 'New Parent Task',
    editTask: 'Edit Task',
    taskTitle: 'Task Title',
    description: 'Description',
    taskType: 'Task Type',
    priorityLabel: 'Priority',
    reminderLabel: 'Reminder',
    recurrenceLabel: 'Recurrence',
    assignToChild: 'Assign to Child',
    colorTag: 'Color Tag',
    photo: 'Photo',
    audio: 'Audio',
    createTask: 'Create Task',
    saveChanges: 'Save Changes',
    delete: 'Delete',
    addChildProfile: 'Add Child Profile',
    childName: 'Child\'s Name',
    age: 'Age',
    ageRequirement: 'Task account requires age 4+',
    createProfile: 'Create Profile',
    assignTaskTo: 'Assign Task to',
    taskName: 'Task Name',
    from: 'From',
    to: 'To',
    rewardPoints: 'Reward Points',
    prizeImageUrl: 'Prize Image URL',
    enableAlert: 'Enable Alert',
    assignTask: 'Assign Task',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    none: 'None',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    dashboardSoon: 'Dashboard Coming Soon',
    setAlarm: 'Set as Alarm/Alert',
    activeAlarm: 'Active Alarm/Alert',
    attachments: 'Attachments',
    changePhoto: 'Change Photo',
    addPhoto: 'Add Photo',
    audioAdded: 'Audio Added',
    addAudio: 'Add Audio',
    stop: 'Stop',
    recorded: 'Recorded',
    photoAdded: 'Photo Added',
    aiManager: 'AI Time Manager',
    aiOptimize: 'Optimize Schedule',
    aiThinking: 'AI is thinking...',
    aiSuggestion: 'AI Suggestion',
    aiClose: 'Close',
    aiApply: 'Apply Suggestions',
    aiNoTasks: 'Add some tasks first so I can help you manage your time!',
    aiSmartBreakdown: 'Smart Breakdown',
    aiBreakdownThinking: 'Breaking down task...',
    aiBreakdownTitle: 'Suggested Sub-tasks',
    aiAddSelected: 'Add Selected Tasks',
    aiSelectChild: 'Select Child',
  },
  ar: {
    appName: 'فاميلي فلو',
    appSubtitle: 'مركز قيادة الوالدين',
    myTasks: 'مهامي',
    newest: 'الأحدث',
    priority: 'الأولوية',
    dueDate: 'موعد الاستحقاق',
    all: 'الكل',
    vaccination: 'تطعيم',
    medicine: 'دواء',
    requirements: 'متطلبات',
    doctor: 'طبيب',
    other: 'أخرى',
    noTasks: 'لم يتم العثور على مهام. حاول تغيير الفلاتر!',
    category: 'التصنيف',
    reminder: 'تذكير',
    assignedTo: 'مسند إلى',
    created: 'أنشئت في',
    childrenProfiles: 'ملفات الأطفال',
    noChildren: 'أضف أطفالك للبدء في إسناد المهام!',
    yearsOld: 'سنوات',
    activeTasks: 'المهام النشطة',
    assignNewTask: 'إسناد مهمة جديدة',
    navTasks: 'المهام',
    navFamily: 'العائلة',
    navStats: 'الإحصائيات',
    newParentTask: 'مهمة والدية جديدة',
    editTask: 'تعديل المهمة',
    taskTitle: 'عنوان المهمة',
    description: 'الوصف',
    taskType: 'نوع المهمة',
    priorityLabel: 'الأولوية',
    reminderLabel: 'تذكير',
    recurrenceLabel: 'التكرار',
    assignToChild: 'إسناد لطفل',
    colorTag: 'علامة اللون',
    photo: 'صورة',
    audio: 'صوت',
    createTask: 'إنشاء مهمة',
    saveChanges: 'حفظ التغييرات',
    delete: 'حذف',
    addChildProfile: 'إضافة ملف طفل',
    childName: 'اسم الطفل',
    age: 'العمر',
    ageRequirement: 'حساب المهام يتطلب عمر 4 سنوات فأكثر',
    createProfile: 'إنشاء ملف',
    assignTaskTo: 'إسناد مهمة لـ',
    taskName: 'اسم المهمة',
    from: 'من',
    to: 'إلى',
    rewardPoints: 'نقاط المكافأة',
    prizeImageUrl: 'رابط صورة الجائزة',
    enableAlert: 'تفعيل التنبيه',
    assignTask: 'إسناد المهمة',
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    none: 'بدون',
    daily: 'يومي',
    weekly: 'أسبوعي',
    monthly: 'شهري',
    dashboardSoon: 'لوحة التحكم قريباً',
    setAlarm: 'ضبط كمنبه/تنبيه',
    activeAlarm: 'منبه/تنبيه نشط',
    attachments: 'المرفقات',
    changePhoto: 'تغيير الصورة',
    addPhoto: 'إضافة صورة',
    audioAdded: 'تم إضافة صوت',
    addAudio: 'إضافة صوت',
    stop: 'إيقاف',
    recorded: 'تم التسجيل',
    photoAdded: 'تم إضافة صورة',
    aiManager: 'مدير الوقت الذكي',
    aiOptimize: 'تحسين الجدول',
    aiThinking: 'الذكاء الاصطناعي يفكر...',
    aiSuggestion: 'اقتراح الذكاء الاصطناعي',
    aiClose: 'إغلاق',
    aiApply: 'تطبيق الاقتراحات',
    aiNoTasks: 'أضف بعض المهام أولاً حتى أتمكن من مساعدتك في إدارة وقتك!',
    aiSmartBreakdown: 'تقسيم ذكي',
    aiBreakdownThinking: 'جاري تقسيم المهمة...',
    aiBreakdownTitle: 'المهام الفرعية المقترحة',
    aiAddSelected: 'إضافة المهام المختارة',
    aiSelectChild: 'اختر الطفل',
  }
};

// --- Components ---

export default function App() {
  // --- State ---
  const [children, setChildren] = useState<Child[]>(() => {
    const saved = localStorage.getItem('family_children');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [parentTasks, setParentTasks] = useState<ParentTask[]>(() => {
    const saved = localStorage.getItem('family_parent_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [childTasks, setChildTasks] = useState<ChildTask[]>(() => {
    const saved = localStorage.getItem('family_child_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [view, setView] = useState<ViewType>('parent_tasks');
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('family_language');
    return (saved as Language) || 'en';
  });
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ParentTask | null>(null);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [isAssigningTask, setIsAssigningTask] = useState<string | null>(null); // Child ID
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiBreakdownTasks, setAiBreakdownTasks] = useState<{title: string, startTime: string, endTime: string}[]>([]);
  const [isBreakdownLoading, setIsBreakdownLoading] = useState(false);
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // Sorting & Filtering State
  const [sortOption, setSortOption] = useState<SortOption>('createdAt');
  const [categoryFilter, setCategoryFilter] = useState<TaskType | 'all'>('all');

  // --- Audio Handlers ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('family_children', JSON.stringify(children));
    localStorage.setItem('family_parent_tasks', JSON.stringify(parentTasks));
    localStorage.setItem('family_child_tasks', JSON.stringify(childTasks));
    localStorage.setItem('family_language', language);
  }, [children, parentTasks, childTasks, language]);

  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[language][key] || key;
  const isRtl = language === 'ar';

  // --- Handlers ---

  const handleAddChild = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const age = parseInt(formData.get('age') as string);

    if (age < 4) {
      alert("Child must be older than 4 years to have a task account.");
      return;
    }

    const newChild: Child = {
      id: crypto.randomUUID(),
      name,
      age,
      points: 0,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    };

    setChildren([...children, newChild]);
    setIsAddingChild(false);
  };

  const handleAddParentTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newTask: ParentTask = {
      id: crypto.randomUUID(),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as TaskType,
      priority: formData.get('priority') as Priority,
      color: formData.get('color') as string,
      reminderAt: formData.get('reminderAt') as string,
      recurrence: formData.get('recurrence') as Recurrence,
      childId: formData.get('childId') as string,
      completed: false,
      createdAt: Date.now(),
      audioAttachment: recordedAudioUrl || undefined,
      imageAttachment: selectedImageUrl || undefined,
      isAlarmEnabled: formData.get('isAlarmEnabled') === 'on',
    };

    setParentTasks([newTask, ...parentTasks]);
    setIsAddingTask(false);
    setRecordedAudioUrl(null);
    setSelectedImageUrl(null);
  };

  const closeSelectedTask = () => {
    setSelectedTask(null);
    setAiBreakdownTasks([]);
    setRecordedAudioUrl(null);
    setSelectedImageUrl(null);
    if (isRecording) stopRecording();
  };

  const handleUpdateParentTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTask) return;
    
    const formData = new FormData(e.currentTarget);
    
    const updatedTask: ParentTask = {
      ...selectedTask,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as TaskType,
      priority: formData.get('priority') as Priority,
      color: formData.get('color') as string,
      reminderAt: formData.get('reminderAt') as string,
      recurrence: formData.get('recurrence') as Recurrence,
      childId: formData.get('childId') as string,
      imageAttachment: selectedImageUrl || selectedTask.imageAttachment,
      audioAttachment: recordedAudioUrl || selectedTask.audioAttachment,
      isAlarmEnabled: formData.get('isAlarmEnabled') === 'on',
    };

    setParentTasks(parentTasks.map(t => t.id === selectedTask.id ? updatedTask : t));
    closeSelectedTask();
  };

  const handleAiOptimize = async () => {
    if (parentTasks.length === 0 && childTasks.length === 0) {
      alert(t('aiNoTasks'));
      return;
    }

    setIsAiLoading(true);
    setShowAiModal(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const prompt = `
        You are an expert family time manager. 
        Analyze the following tasks and provide 3-5 concise, actionable suggestions to make the family schedule more efficient.
        Focus on:
        1. Task grouping (e.g., doing all errands at once).
        2. Priority adjustments based on task types.
        3. Better timing for child tasks.
        
        Language: ${language === 'ar' ? 'Arabic' : 'English'}.
        
        Parent Tasks: ${JSON.stringify(parentTasks.map(t => ({ title: t.title, type: t.type, priority: t.priority })))}
        Child Tasks: ${JSON.stringify(childTasks.map(t => ({ title: t.title, start: t.startTime, end: t.endTime })))}
      `;

      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
      });

      setAiSuggestion(response.text || "No suggestions found.");
    } catch (error) {
      console.error("AI Error:", error);
      setAiSuggestion("Sorry, I encountered an error while thinking. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiBreakdown = async (task: ParentTask) => {
    setIsBreakdownLoading(true);
    setAiBreakdownTasks([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const prompt = `
        You are an expert family organizer. 
        Break down the following parent task into 3-5 specific, small, and actionable child tasks.
        Each sub-task should have a title, a suggested start time, and a suggested end time (in HH:MM format).
        Return the result as a JSON array of objects with keys: title, startTime, endTime.
        
        Language: ${language === 'ar' ? 'Arabic' : 'English'}.
        
        Parent Task: ${task.title}
        Description: ${task.description}
      `;

      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                startTime: { type: Type.STRING },
                endTime: { type: Type.STRING },
              },
              required: ["title", "startTime", "endTime"],
            },
          },
        },
      });

      const suggestions = JSON.parse(response.text || "[]");
      setAiBreakdownTasks(suggestions);
    } catch (error) {
      console.error("AI Breakdown Error:", error);
      alert("Failed to generate sub-tasks. Please try again.");
    } finally {
      setIsBreakdownLoading(false);
    }
  };

  const handleAssignChildTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newTask: ChildTask = {
      id: crypto.randomUUID(),
      childId: isAssigningTask!,
      title: formData.get('title') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      points: parseInt(formData.get('points') as string),
      prizeImage: formData.get('prizeImage') as string,
      reminder: formData.get('reminder') === 'on',
      completed: false,
    };

    setChildTasks([newTask, ...childTasks]);
    setIsAssigningTask(null);
  };

  const toggleParentTask = (id: string) => {
    setParentTasks(parentTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteParentTask = (id: string) => {
    setParentTasks(parentTasks.filter(t => t.id !== id));
  };

  // --- Logic ---

  const processedParentTasks = useMemo(() => {
    let result = [...parentTasks];

    // Category Filter
    if (categoryFilter !== 'all') {
      result = result.filter(t => t.type === categoryFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'priority') {
        return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      }
      if (sortOption === 'reminderAt') {
        if (!a.reminderAt) return 1;
        if (!b.reminderAt) return -1;
        return new Date(a.reminderAt).getTime() - new Date(b.reminderAt).getTime();
      }
      return b.createdAt - a.createdAt;
    });

    return result;
  }, [parentTasks, sortOption, categoryFilter]);

  // --- Views ---

  const renderParentTasks = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-semibold">{t('myTasks')}</h2>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <select 
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className={`bg-white border border-black/5 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider appearance-none focus:outline-none focus:ring-2 focus:ring-black/5 ${isRtl ? 'pl-8 pr-3' : 'pr-8 pl-3'}`}
            >
              <option value="createdAt">{t('newest')}</option>
              <option value="priority">{t('priority')}</option>
              <option value="reminderAt">{t('dueDate')}</option>
            </select>
            <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-black/20 ${isRtl ? 'left-2' : 'right-2'}`}>
              <Filter size={14} />
            </div>
          </div>
          <button 
            onClick={handleAiOptimize}
            className="bg-amber-100 text-amber-600 p-3 rounded-2xl shadow-lg hover:scale-95 transition-transform flex items-center gap-2"
            title={t('aiOptimize')}
          >
            <Sparkles size={24} />
          </button>
          <button 
            onClick={() => setIsAddingTask(true)}
            className="bg-black text-white p-3 rounded-2xl shadow-lg hover:scale-95 transition-transform"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
            categoryFilter === 'all' ? 'bg-black text-white' : 'bg-white text-black/40 border border-black/5'
          }`}
        >
          {t('all')}
        </button>
        {TASK_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => setCategoryFilter(type.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
              categoryFilter === type.value ? 'bg-black text-white' : 'bg-white text-black/40 border border-black/5'
            }`}
          >
            <type.icon size={14} />
            {t(type.value as any)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {processedParentTasks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-black/10 text-black/40">
            <ListTodo size={48} className="mx-auto mb-4 opacity-20" />
            <p>{t('noTasks')}</p>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {processedParentTasks.map(task => (
            <motion.div 
              layout
              key={task.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white p-5 rounded-3xl border border-black/5 shadow-sm group relative overflow-hidden transition-all cursor-pointer hover:border-black/10 ${task.completed ? 'bg-emerald-50/30' : ''}`}
              onClick={() => setSelectedTask(task)}
            >
              <div className={`absolute top-0 w-2 h-full ${isRtl ? 'right-0' : 'left-0'}`} style={{ backgroundColor: task.color }} />
              
              {/* Completion Visual Feedback */}
              <AnimatePresence>
                {task.completed && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`absolute top-4 text-emerald-500 ${isRtl ? 'left-4' : 'right-4'}`}
                  >
                    <CheckCircle2 size={32} strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-start gap-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleParentTask(task.id);
                  }} 
                  className={`mt-1 transition-transform active:scale-75 ${task.completed ? 'text-emerald-500' : 'text-black/20 hover:text-black/40'}`}
                >
                  {task.completed ? <CheckCircle2 /> : <Circle />}
                </button>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold text-lg ${task.completed ? 'line-through text-black/30' : ''}`}>{task.title}</h3>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest ${
                      task.priority === 'high' ? 'bg-red-100 text-red-600' : 
                      task.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {t(task.priority as any)}
                    </span>
                    {task.recurrence !== 'none' && (
                      <span className="bg-black/5 text-black/40 text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest flex items-center gap-1">
                        <Settings size={10} />
                        {t(task.recurrence as any)}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm text-black/60 mb-4 ${isRtl ? 'pl-12' : 'pr-12'}`}>{task.description}</p>
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    {task.imageAttachment && (
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-black/5">
                        <img src={task.imageAttachment} alt="Task" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    {task.audioAttachment && (
                      <div className="flex-grow p-3 bg-black/5 rounded-2xl flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white">
                          <Mic size={14} />
                        </div>
                        <audio controls src={task.audioAttachment} className="h-8 flex-grow" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-black/5">
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-bold tracking-widest text-black/30">{t('category')}</p>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-black/60">
                        {(() => {
                          const TypeIcon = TASK_TYPES.find(t => t.value === task.type)?.icon || MoreHorizontal;
                          return <TypeIcon size={14} />;
                        })()}
                        <span>{t(task.type as any)}</span>
                      </div>
                    </div>

                    {task.reminderAt && (
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase font-bold tracking-widest text-black/30">{t('reminder')}</p>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-black/60">
                          {task.isAlarmEnabled ? <AlertCircle size={14} className="text-red-500 animate-pulse" /> : <Bell size={14} />}
                          <span>{new Date(task.reminderAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                        </div>
                      </div>
                    )}

                    {task.childId && (
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase font-bold tracking-widest text-black/30">{t('assignedTo')}</p>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-black/60">
                          <Baby size={14} />
                          <span>{children.find(c => c.id === task.childId)?.name}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-bold tracking-widest text-black/30">{t('created')}</p>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-black/60">
                        <Calendar size={14} />
                        <span>{new Date(task.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteParentTask(task.id);
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-2 text-black/20 hover:text-red-500 transition-opacity ${isRtl ? 'mr-auto' : 'ml-auto'}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderChildren = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-semibold">{t('childrenProfiles')}</h2>
        <button 
          onClick={() => setIsAddingChild(true)}
          className="bg-black text-white p-3 rounded-2xl shadow-lg hover:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-dashed border-black/10 text-black/40">
            <Baby size={48} className="mx-auto mb-4 opacity-20" />
            <p>{t('noChildren')}</p>
          </div>
        )}
        {children.map(child => (
          <div key={child.id} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <img src={child.avatar} alt={child.name} className="w-16 h-16 rounded-2xl bg-black/5" />
              <div>
                <h3 className="text-xl font-bold">{child.name}</h3>
                <p className="text-sm text-black/40">{child.age} {t('yearsOld')}</p>
              </div>
              <div className={`${isRtl ? 'mr-auto' : 'ml-auto'} flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-bold`}>
                <Star size={14} fill="currentColor" />
                <span>{child.points}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-[10px] uppercase font-bold tracking-widest text-black/30">{t('activeTasks')}</p>
              {childTasks.filter(t => t.childId === child.id && !t.completed).map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-black/5 rounded-2xl text-sm">
                  <span className="font-medium">{task.title}</span>
                  <div className="flex items-center gap-2 text-black/40">
                    <Clock size={14} />
                    <span>{task.startTime}</span>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setIsAssigningTask(child.id)}
                className="w-full py-3 border-2 border-dashed border-black/10 rounded-2xl text-sm font-bold text-black/40 hover:border-black/20 hover:text-black/60 transition-all"
              >
                {t('assignNewTask')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const closeAddTask = () => {
    setIsAddingTask(false);
    setRecordedAudioUrl(null);
    setSelectedImageUrl(null);
    if (isRecording) stopRecording();
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-black selection:text-white pb-32" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shadow-black/10">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-tight">{t('appName')}</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 font-bold">{t('appSubtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="px-3 py-1.5 rounded-xl bg-black/5 text-[10px] font-black uppercase tracking-widest hover:bg-black/10 transition-colors"
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>
            <button className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-black/40 hover:bg-black/10 transition-colors">
              <Bell size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-black/5 overflow-hidden border-2 border-white shadow-sm">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Parent" alt="Parent" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {view === 'parent_tasks' && renderParentTasks()}
          {view === 'children' && renderChildren()}
          {view === 'dashboard' && (
            <div className="text-center py-20">
              <BarChart3 size={64} className="mx-auto mb-4 opacity-10" />
              <h2 className="text-2xl font-serif font-semibold opacity-40">{t('dashboardSoon')}</h2>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-lg bg-black/90 text-white rounded-[2.5rem] shadow-2xl backdrop-blur-xl border border-white/10 p-2 flex items-center justify-between z-30 ${isRtl ? 'flex-row-reverse' : ''}`}>
        {[
          { id: 'parent_tasks', icon: ListTodo, label: t('navTasks') },
          { id: 'children', icon: Baby, label: t('navFamily') },
          { id: 'dashboard', icon: BarChart3, label: t('navStats') },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as ViewType)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[2rem] transition-all ${
              view === item.id ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon size={20} />
            <span className="text-sm font-bold tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {isAddingTask && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={closeAddTask}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              className="relative w-full max-w-xl bg-white rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleAddParentTask} className="p-8 space-y-6 max-h-[85vh] overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-serif font-bold">{t('newParentTask')}</h2>
                  <button type="button" onClick={closeAddTask} className="text-black/20 hover:text-black transition-colors">
                    <ChevronLeft size={32} className={isRtl ? 'rotate-180' : ''} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('taskTitle')}</label>
                    <input required name="title" type="text" placeholder={t('taskTitle')} className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-black/5" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('description')}</label>
                    <textarea name="description" placeholder={t('description')} className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 h-24 focus:ring-2 focus:ring-black/5" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('taskType')}</label>
                      <select name="type" className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-black/5 appearance-none">
                        {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{TRANSLATIONS[language][t.value as keyof typeof TRANSLATIONS['en']] || t.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('priorityLabel')}</label>
                      <select name="priority" className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-black/5 appearance-none">
                        <option value="low">{t('low')}</option>
                        <option value="medium">{t('medium')}</option>
                        <option value="high">{t('high')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('reminderLabel')}</label>
                      <input name="reminderAt" type="datetime-local" className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-black/5" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('recurrenceLabel')}</label>
                      <select name="recurrence" className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-black/5 appearance-none">
                        <option value="none">{t('none')}</option>
                        <option value="daily">{t('daily')}</option>
                        <option value="weekly">{t('weekly')}</option>
                        <option value="monthly">{t('monthly')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-red-500" />
                      <span className="font-bold text-sm">{t('setAlarm')}</span>
                    </div>
                    <input name="isAlarmEnabled" type="checkbox" className="w-6 h-6 rounded-lg accent-black" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('assignToChild')}</label>
                    <select name="childId" className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-black/5 appearance-none">
                      <option value="">{t('none')}</option>
                      {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('colorTag')}</label>
                    <div className="flex gap-3">
                      {COLORS.map(c => (
                        <label key={c} className="relative cursor-pointer">
                          <input type="radio" name="color" value={c} className="sr-only peer" defaultChecked={c === COLORS[0]} />
                          <div className="w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-black transition-all" style={{ backgroundColor: c }} />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <label className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold cursor-pointer transition-all ${
                      selectedImageUrl ? 'bg-emerald-500 text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'
                    }`}>
                      <ImageIcon size={20} />
                      <span>{selectedImageUrl ? t('photoAdded') : t('photo')}</span>
                      <input type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} />
                    </label>
                    <button 
                      type="button" 
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all ${
                        isRecording 
                          ? 'bg-red-500 text-white animate-pulse' 
                          : recordedAudioUrl 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-black/5 text-black/40 hover:bg-black/10'
                      }`}
                    >
                      <Mic size={20} />
                      <span>{isRecording ? t('stop') : recordedAudioUrl ? t('recorded') : t('audio')}</span>
                    </button>
                  </div>
                  {(recordedAudioUrl || selectedImageUrl) && !isRecording && (
                    <div className="space-y-3">
                      {selectedImageUrl && (
                        <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-black/5">
                          <img src={selectedImageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setSelectedImageUrl(null)}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      {recordedAudioUrl && (
                        <div className="p-3 bg-black/5 rounded-2xl flex items-center gap-3">
                          <audio src={recordedAudioUrl} controls className="h-8 flex-grow" />
                          <button 
                            type="button" 
                            onClick={() => setRecordedAudioUrl(null)}
                            className="p-2 text-red-500 hover:bg-red-50 text-xs font-bold uppercase"
                          >
                            {t('delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full py-5 bg-black text-white rounded-[2rem] font-bold text-lg shadow-xl shadow-black/20 hover:scale-[0.98] transition-transform">
                  {t('createTask')}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={closeSelectedTask}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              className="relative w-full max-w-xl bg-white rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleUpdateParentTask} className="p-8 space-y-6 max-h-[85vh] overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-serif font-bold">{t('editTask')}</h2>
                  <button type="button" onClick={closeSelectedTask} className="text-black/20 hover:text-black transition-colors">
                    <ChevronLeft size={32} className={isRtl ? 'rotate-180' : ''} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('taskTitle')}</label>
                    <input required name="title" type="text" defaultValue={selectedTask.title} className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-black/5" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('description')}</label>
                    <textarea name="description" defaultValue={selectedTask.description} className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 h-24 focus:ring-2 focus:ring-black/5" />
                  </div>

                  {/* AI Smart Breakdown Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleAiBreakdown(selectedTask)}
                      disabled={isBreakdownLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl font-bold text-sm hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                      {isBreakdownLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                          <span>{t('aiBreakdownThinking')}</span>
                        </>
                      ) : (
                        <>
                          <Wand2 size={18} />
                          <span>{t('aiSmartBreakdown')}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* AI Breakdown Results */}
                  <AnimatePresence>
                    {aiBreakdownTasks.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-2"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('aiBreakdownTitle')}</label>
                          <button 
                            type="button" 
                            onClick={() => setAiBreakdownTasks([])}
                            className="text-[10px] uppercase font-bold text-red-500"
                          >
                            {t('aiClose')}
                          </button>
                        </div>
                        <div className="space-y-2">
                          {aiBreakdownTasks.map((task, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-amber-50/50 border border-amber-100/50 rounded-2xl text-sm">
                              <div className="flex flex-col">
                                <span className="font-medium text-amber-900">{task.title}</span>
                                <span className="text-[10px] text-amber-600/60">{task.startTime} - {task.endTime}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!selectedTask.childId) {
                                    alert(t('aiSelectChild'));
                                    return;
                                  }
                                  const newTask: ChildTask = {
                                    id: crypto.randomUUID(),
                                    childId: selectedTask.childId,
                                    title: task.title,
                                    startTime: task.startTime,
                                    endTime: task.endTime,
                                    points: 10,
                                    reminder: false,
                                    completed: false,
                                  };
                                  setChildTasks([newTask, ...childTasks]);
                                  setAiBreakdownTasks(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="p-2 bg-amber-100 text-amber-600 rounded-xl hover:bg-amber-200 transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('taskType')}</label>
                      <select name="type" defaultValue={selectedTask.type} className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-black/5 appearance-none">
                        {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{TRANSLATIONS[language][t.value as keyof typeof TRANSLATIONS['en']] || t.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('priorityLabel')}</label>
                      <select name="priority" defaultValue={selectedTask.priority} className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-black/5 appearance-none">
                        <option value="low">{t('low')}</option>
                        <option value="medium">{t('medium')}</option>
                        <option value="high">{t('high')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('reminderLabel')}</label>
                      <input name="reminderAt" type="datetime-local" defaultValue={selectedTask.reminderAt} className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-black/5" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('recurrenceLabel')}</label>
                      <select name="recurrence" defaultValue={selectedTask.recurrence} className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-black/5 appearance-none">
                        <option value="none">{t('none')}</option>
                        <option value="daily">{t('daily')}</option>
                        <option value="weekly">{t('weekly')}</option>
                        <option value="monthly">{t('monthly')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-red-500" />
                      <span className="font-bold text-sm">{t('activeAlarm')}</span>
                    </div>
                    <input name="isAlarmEnabled" type="checkbox" defaultChecked={selectedTask.isAlarmEnabled} className="w-6 h-6 rounded-lg accent-black" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('assignToChild')}</label>
                    <select name="childId" defaultValue={selectedTask.childId || ""} className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-black/5 appearance-none">
                      <option value="">{t('none')}</option>
                      {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('colorTag')}</label>
                    <div className="flex gap-3">
                      {COLORS.map(c => (
                        <label key={c} className="relative cursor-pointer">
                          <input type="radio" name="color" value={c} className="sr-only peer" defaultChecked={c === selectedTask.color} />
                          <div className="w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-black transition-all" style={{ backgroundColor: c }} />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('attachments')}</label>
                    <div className="flex gap-4">
                      <label className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold cursor-pointer transition-all ${
                        (selectedImageUrl || selectedTask.imageAttachment) ? 'bg-emerald-500 text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'
                      }`}>
                        <ImageIcon size={20} />
                        <span>{(selectedImageUrl || selectedTask.imageAttachment) ? t('changePhoto') : t('addPhoto')}</span>
                        <input type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} />
                      </label>
                      <button 
                        type="button" 
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all ${
                          isRecording 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : (recordedAudioUrl || selectedTask.audioAttachment) 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-black/5 text-black/40 hover:bg-black/10'
                        }`}
                      >
                        <Mic size={20} />
                        <span>{isRecording ? t('stop') : (recordedAudioUrl || selectedTask.audioAttachment) ? t('audioAdded') : t('addAudio')}</span>
                      </button>
                    </div>

                    {(selectedImageUrl || selectedTask.imageAttachment) && (
                      <div className="relative w-full h-48 rounded-3xl overflow-hidden border border-black/5 shadow-inner">
                        <img src={selectedImageUrl || selectedTask.imageAttachment} alt="Task" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => {
                            setSelectedImageUrl(null);
                            // If it was the original attachment, we might need a way to clear it in state
                            // For simplicity, we'll just allow overriding
                          }}
                          className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-full shadow-xl"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}

                    {(recordedAudioUrl || selectedTask.audioAttachment) && (
                      <div className="p-4 bg-black/5 rounded-3xl flex items-center gap-4">
                        <Mic size={24} className="text-black/40" />
                        <audio src={recordedAudioUrl || selectedTask.audioAttachment} controls className="h-10 flex-grow" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      deleteParentTask(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    className="flex-1 py-5 bg-red-50 text-red-600 rounded-[2rem] font-bold text-lg hover:bg-red-100 transition-colors"
                  >
                    {t('delete')}
                  </button>
                  <button type="submit" className="flex-[2] py-5 bg-black text-white rounded-[2rem] font-bold text-lg shadow-xl shadow-black/20 hover:scale-[0.98] transition-transform">
                    {t('saveChanges')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isAddingChild && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingChild(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-8">
              <h2 className="text-2xl font-serif font-bold mb-6">{t('addChildProfile')}</h2>
              <form onSubmit={handleAddChild} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('childName')}</label>
                  <input required name="name" type="text" placeholder={t('childName')} className="w-full bg-black/5 border-none rounded-2xl px-5 py-4" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('age')}</label>
                  <input required name="age" type="number" min="1" placeholder="e.g., 6" className="w-full bg-black/5 border-none rounded-2xl px-5 py-4" />
                  <p className="text-[10px] text-amber-600 font-medium">*{t('ageRequirement')}</p>
                </div>
                <button type="submit" className="w-full py-5 bg-black text-white rounded-[2rem] font-bold shadow-xl">
                  {t('createProfile')}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isAssigningTask && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAssigningTask(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-xl bg-white rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl p-8">
              <h2 className="text-2xl font-serif font-bold mb-6">{t('assignTaskTo')} {children.find(c => c.id === isAssigningTask)?.name}</h2>
              <form onSubmit={handleAssignChildTask} className="space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('taskName')}</label>
                  <input required name="title" type="text" placeholder={t('taskName')} className="w-full bg-black/5 border-none rounded-2xl px-5 py-4" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('from')}</label>
                    <input required name="startTime" type="time" className="w-full bg-black/5 border-none rounded-2xl px-5 py-4" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('to')}</label>
                    <input required name="endTime" type="time" className="w-full bg-black/5 border-none rounded-2xl px-5 py-4" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('rewardPoints')}</label>
                    <input required name="points" type="number" defaultValue="10" className="w-full bg-black/5 border-none rounded-2xl px-5 py-4" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-black/40">{t('prizeImageUrl')}</label>
                    <input name="prizeImage" type="text" placeholder="URL to prize image" className="w-full bg-black/5 border-none rounded-2xl px-5 py-4" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Bell className="text-black/40" />
                    <span className="font-bold text-sm">{t('enableAlert')}</span>
                  </div>
                  <input name="reminder" type="checkbox" className="w-6 h-6 rounded-lg accent-black" />
                </div>
                <button type="submit" className="w-full py-5 bg-black text-white rounded-[2rem] font-bold shadow-xl">
                  {t('assignTask')}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => !isAiLoading && setShowAiModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                  <BrainCircuit size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold">{t('aiManager')}</h2>
                  <p className="text-[10px] uppercase tracking-widest text-black/40 font-bold">{t('aiSuggestion')}</p>
                </div>
              </div>

              <div className="min-h-[200px] flex flex-col justify-center">
                {isAiLoading ? (
                  <div className="flex flex-col items-center gap-4 py-10">
                    <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin" />
                    <p className="text-sm font-medium text-black/40 animate-pulse">{t('aiThinking')}</p>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100/50 text-amber-900/80 leading-relaxed whitespace-pre-wrap italic">
                      {aiSuggestion}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setShowAiModal(false)}
                  disabled={isAiLoading}
                  className="flex-1 py-4 bg-black/5 text-black font-bold rounded-2xl hover:bg-black/10 transition-colors disabled:opacity-50"
                >
                  {t('aiClose')}
                </button>
                {!isAiLoading && (
                  <button 
                    onClick={() => setShowAiModal(false)}
                    className="flex-1 py-4 bg-black text-white font-bold rounded-2xl shadow-xl hover:scale-95 transition-transform"
                  >
                    {t('aiApply')}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
