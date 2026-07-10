import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, QuizQuestion, SUBJECTS } from '../api.service';

type Stage = 'setup' | 'loading' | 'playing' | 'done';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [FormsModule],
  template: `
    @switch (stage) {
      @case ('setup') {
        <div class="card pop">
          <h2>📝 Quiz Time!</h2>
          <p class="muted">Pick a subject (and a topic if you want) and I'll make a quiz just for you.</p>
          <div class="form">
            <select [(ngModel)]="subject">
              @for (s of subjects; track s.name) {
                <option [value]="s.name">{{ s.emoji }} {{ s.name }}</option>
              }
            </select>
            <input [(ngModel)]="topic" placeholder="Topic (like fractions, planets…) — optional" />
            <select [(ngModel)]="numQuestions">
              <option [ngValue]="3">3 questions</option>
              <option [ngValue]="5">5 questions</option>
              <option [ngValue]="10">10 questions</option>
            </select>
            <button class="btn" (click)="start()">Make my quiz! ✨</button>
          </div>
          @if (error) { <p class="err">{{ error }}</p> }
        </div>
      }
      @case ('loading') {
        <div class="card pop center"><h2>🪄 Making your quiz…</h2><p class="muted">This takes a few seconds.</p></div>
      }
      @case ('playing') {
        <div class="card pop">
          <p class="muted">Question {{ index + 1 }} of {{ questions.length }} · Score: {{ score }} ⭐</p>
          <h2>{{ current.question }}</h2>
          <div class="choices">
            @for (c of current.choices; track $index) {
              <button
                class="choice"
                [class.correct]="answered && $index === current.answer_index"
                [class.wrong]="answered && $index === picked && $index !== current.answer_index"
                [disabled]="answered"
                (click)="pick($index)"
              >
                {{ letters[$index] }}. {{ c }}
              </button>
            }
          </div>
          @if (answered) {
            <div class="feedback pop" [class.good]="picked === current.answer_index">
              <b>{{ picked === current.answer_index ? '🎉 Correct!' : '💪 Nice try!' }}</b>
              <p>{{ current.explanation }}</p>
              <button class="btn" (click)="next()">
                {{ index + 1 < questions.length ? 'Next question →' : 'See my score! 🏁' }}
              </button>
            </div>
          }
        </div>
      }
      @case ('done') {
        <div class="card pop center">
          <h1>{{ emoji() }}</h1>
          <h2>You got {{ score }} out of {{ questions.length }}!</h2>
          <p class="muted">{{ praise() }}</p>
          <div class="row">
            <button class="btn" (click)="reset()">Another quiz! 🔁</button>
          </div>
        </div>
      }
    }
  `,
  styles: [
    `
      .form { display: flex; flex-direction: column; gap: 12px; max-width: 420px; }
      .center { text-align: center; }
      .center h1 { font-size: 4rem; }
      .choices { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
      .choice {
        font-family: inherit; font-size: 1.05rem; font-weight: 600; text-align: left;
        padding: 14px 18px; border-radius: 14px; border: 2px solid #e3ddff;
        background: white; color: var(--text); cursor: pointer;
      }
      .choice:hover:not(:disabled) { border-color: var(--purple); background: #f4f0ff; }
      .choice.correct { border-color: var(--green); background: #e2fbf3; }
      .choice.wrong { border-color: var(--red); background: #ffe9ef; }
      .feedback { margin-top: 16px; padding: 16px; border-radius: 14px; background: #fff4d6; }
      .feedback.good { background: #e2fbf3; }
      .feedback .btn { margin-top: 8px; }
      .row { display: flex; gap: 10px; justify-content: center; }
      .err { color: var(--red); font-weight: 600; }
    `,
  ],
})
export class QuizComponent {
  private api = inject(ApiService);

  subjects = SUBJECTS;
  letters = ['A', 'B', 'C', 'D'];

  stage: Stage = 'setup';
  subject = 'Math';
  topic = '';
  numQuestions = 5;
  error = '';

  questions: QuizQuestion[] = [];
  index = 0;
  score = 0;
  picked = -1;
  answered = false;

  get current(): QuizQuestion {
    return this.questions[this.index];
  }

  start(): void {
    this.stage = 'loading';
    this.error = '';
    this.api.generateQuiz(this.subject, this.topic, this.numQuestions).subscribe({
      next: (res) => {
        this.questions = res.questions;
        this.index = 0;
        this.score = 0;
        this.answered = false;
        this.stage = 'playing';
      },
      error: (err) => {
        this.stage = 'setup';
        this.error = err.error?.detail ?? 'Could not make a quiz right now. Try again!';
      },
    });
  }

  pick(i: number): void {
    if (this.answered) return;
    this.picked = i;
    this.answered = true;
    if (i === this.current.answer_index) this.score++;
  }

  next(): void {
    if (this.index + 1 < this.questions.length) {
      this.index++;
      this.answered = false;
      this.picked = -1;
    } else {
      this.stage = 'done';
      this.api.submitQuiz(this.subject, this.topic, this.score, this.questions.length).subscribe();
    }
  }

  reset(): void {
    this.stage = 'setup';
  }

  emoji(): string {
    const pct = this.score / this.questions.length;
    return pct === 1 ? '🏆' : pct >= 0.8 ? '🌟' : pct >= 0.6 ? '😃' : '💪';
  }

  praise(): string {
    const pct = this.score / this.questions.length;
    if (pct === 1) return 'PERFECT SCORE! You are amazing!';
    if (pct >= 0.8) return 'Wow, great job! You really know your stuff!';
    if (pct >= 0.6) return 'Nice work! A little more practice and you will ace it!';
    return 'Good effort! Practice makes perfect — try the tutor or flashcards!';
  }
}
