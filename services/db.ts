import { User, UserRole, Test, Question, QuizResult } from '@/types'

const STORAGE_KEYS = {
  USERS: 'numl_users',
  TESTS: 'numl_tests',
  RESULTS: 'numl_results',
}

class Database {
  constructor() {
    this.initializeData()
  }

  private initializeData() {
    if (typeof window === 'undefined') return

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      const defaultUsers: User[] = [
        { id: 'admin1', username: 'admin', password: 'password', role: UserRole.ADMIN },
        { id: 'admin1', username: 'shazain', password: '123456', role: UserRole.ADMIN },

      ]
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers))
    }

    if (!localStorage.getItem(STORAGE_KEYS.TESTS)) {
      localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify([]))
    }

    if (!localStorage.getItem(STORAGE_KEYS.RESULTS)) {
      localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify([]))
    }
  }

  // User Management
  login(username: string, password: string): User | null {
    const users = this.getUsers()
    const user = users.find(u => u.username === username && u.password === password)
    return user || null
  }

  register(username: string, password: string): User {
    const users = this.getUsers()
    
    if (users.find(u => u.username === username)) {
      throw new Error('Username already exists')
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      password,
      role: UserRole.STUDENT,
    }

    users.push(newUser)
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
    return newUser
  }

  private getUsers(): User[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.USERS)
    return data ? JSON.parse(data) : []
  }

  // Test Management
  getTests(): Test[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.TESTS)
    return data ? JSON.parse(data) : []
  }

  getTestById(id: string): Test | null {
    const tests = this.getTests()
    return tests.find(t => t.id === id) || null
  }

  createTest(title: string, description: string): Test {
    const tests = this.getTests()
    const newTest: Test = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      questions: [],
      createdAt: new Date().toISOString(),
    }
    tests.push(newTest)
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests))
    return newTest
  }

  deleteTest(id: string) {
    let tests = this.getTests()
    tests = tests.filter(t => t.id !== id)
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests))
  }

  addQuestionToTest(testId: string, question: Question) {
    const tests = this.getTests()
    const test = tests.find(t => t.id === testId)
    if (test) {
      test.questions.push(question)
      localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests))
    }
  }

  removeQuestionFromTest(testId: string, questionId: string) {
    const tests = this.getTests()
    const test = tests.find(t => t.id === testId)
    if (test) {
      test.questions = test.questions.filter(q => q.id !== questionId)
      localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests))
    }
  }

  // Results Management
  getResults(): QuizResult[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.RESULTS)
    return data ? JSON.parse(data) : []
  }

  saveResult(result: QuizResult) {
    const results = this.getResults()
    results.push(result)
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results))
  }
}

export const db = new Database()
