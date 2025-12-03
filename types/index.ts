export enum UserRole {
    ADMIN = 'ADMIN',
    STUDENT = 'STUDENT',
  }
  
  export interface User {
    id: string
    username: string
    password: string
    role: UserRole
  }
  
  export enum QuizCategory {
    ENGLISH = 'English',
    MATH = 'Math',
    CHEMISTRY = 'Chemistry',
    PHYSICS = 'Physics',
    SCIENCE = 'Science',
    GENERAL_KNOWLEDGE = 'General Knowledge',
    COMPUTER = 'Computer',
    HISTORY = 'History',
  }
  
  export interface Question {
    id: string
    text: string
    category: QuizCategory
    options: string[]
    correctAnswerIndex: number
  }
  
  export interface Test {
    id: string
    title: string
    description: string
    questions: Question[]
    createdAt: string
  }
  
  export interface QuizResult {
    id: string
    testId: string
    testTitle: string
    studentId: string
    studentName: string
    score: number
    totalQuestions: number
    passed: boolean
    date: string
    categoryBreakdown: Record<string, number>
    status: 'COMPLETED' | 'FAILED_CHEATING'
  }
  
  export const PASSING_PERCENTAGE = 50
  