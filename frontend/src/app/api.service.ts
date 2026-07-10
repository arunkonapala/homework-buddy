import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface QuizQuestion {
  question: string;
  choices: string[];
  answer_index: number;
  explanation: string;
}

export interface Flashcard {
  id: number;
  subject: string;
  topic: string;
  front: string;
  back: string;
  box: number;
}

export interface Progress {
  recent: { subject: string; topic: string; score: number; total: number; created_at: string }[];
  subjects: Record<string, { attempts: number; avg_pct: number; best_pct: number }>;
  weak_topics: { subject: string; topic: string; pct: number }[];
  streak_days: number;
  total_quizzes: number;
}

export const SUBJECTS = [
  { name: 'Math', emoji: '➗', color: '#7c5cff' },
  { name: 'Science', emoji: '🔬', color: '#06d6a0' },
  { name: 'English', emoji: '📚', color: '#ef476f' },
  { name: 'Social Studies', emoji: '🌎', color: '#118ab2' },
];

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  chat(subject: string, messages: ChatMessage[]): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>('/api/tutor/chat', { subject, messages });
  }

  generateQuiz(subject: string, topic: string, numQuestions: number): Observable<{ questions: QuizQuestion[] }> {
    return this.http.post<{ questions: QuizQuestion[] }>('/api/quiz/generate', {
      subject,
      topic,
      num_questions: numQuestions,
    });
  }

  submitQuiz(subject: string, topic: string, score: number, total: number): Observable<unknown> {
    return this.http.post('/api/quiz/submit', { subject, topic, score, total });
  }

  generateFlashcards(subject: string, topic: string, count: number): Observable<{ created: number }> {
    return this.http.post<{ created: number }>('/api/flashcards/generate', { subject, topic, count });
  }

  reviewFlashcards(subject: string): Observable<{ cards: Flashcard[]; mastered: number; total: number }> {
    return this.http.get<{ cards: Flashcard[]; mastered: number; total: number }>('/api/flashcards/review', {
      params: subject ? { subject } : {},
    });
  }

  answerFlashcard(id: number, correct: boolean): Observable<{ box: number; mastered: boolean }> {
    return this.http.post<{ box: number; mastered: boolean }>(`/api/flashcards/${id}/answer`, { correct });
  }

  progress(): Observable<Progress> {
    return this.http.get<Progress>('/api/progress');
  }
}
