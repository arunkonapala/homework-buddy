import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, Flashcard, SUBJECTS } from '../api.service';

@Component({
  selector: 'app-flashcards',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="card pop">
      <h2>🃏 Flashcards</h2>
      <p class="muted">
        Flip the card, then tell me if you knew it. Cards you miss come back more often!
        @if (total > 0) { <b> Mastered: {{ mastered }} / {{ total }} 🏅</b> }
      </p>

      <div class="maker">
        <select [(ngModel)]="subject">
          @for (s of subjects; track s.name) {
            <option [value]="s.name">{{ s.emoji }} {{ s.name }}</option>
          }
        </select>
        <input [(ngModel)]="topic" placeholder="Topic (like multiplication, water cycle…)" />
        <button class="btn secondary" (click)="makeCards()" [disabled]="making || !topic.trim()">
          {{ making ? 'Making cards… 🪄' : 'Make new cards ✨' }}
        </button>
      </div>
      @if (error) { <p class="err">{{ error }}</p> }
    </div>

    @if (cards.length > 0 && current) {
      <div class="flash-area">
        <p class="muted center">Card {{ index + 1 }} of {{ cards.length }} · {{ current.subject }} · {{ current.topic }}</p>
        <div class="flashcard" [class.flipped]="flipped" (click)="flipped = !flipped">
          <div class="face front"><span>{{ current.front }}</span><small>Tap to flip 🔄</small></div>
          <div class="face back"><span>{{ current.back }}</span></div>
        </div>
        @if (flipped) {
          <div class="verdict pop">
            <button class="btn green" (click)="answer(true)">I knew it! 😄</button>
            <button class="btn red" (click)="answer(false)">Still learning 🤔</button>
          </div>
        }
      </div>
    } @else if (!loading && !making) {
      <div class="card center pop" style="margin-top:16px">
        <p>No cards to review right now — make some with the button above! 🎈</p>
      </div>
    }
  `,
  styles: [
    `
      .maker { display: flex; gap: 10px; flex-wrap: wrap; }
      .maker input { flex: 1; min-width: 200px; }
      .center { text-align: center; }
      .err { color: var(--red); font-weight: 600; }
      .flash-area { margin-top: 20px; }
      .flashcard {
        position: relative; height: 260px; cursor: pointer;
        transform-style: preserve-3d; transition: transform 0.5s;
      }
      .flashcard.flipped { transform: rotateY(180deg); }
      .face {
        position: absolute; inset: 0; backface-visibility: hidden;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 12px; padding: 24px; text-align: center;
        border-radius: var(--radius); font-size: 1.4rem; font-weight: 600;
        box-shadow: 0 6px 20px rgba(124, 92, 255, 0.15);
      }
      .front { background: white; }
      .front small { color: var(--muted); font-weight: 400; }
      .back { background: var(--yellow); transform: rotateY(180deg); }
      .verdict { display: flex; gap: 12px; justify-content: center; margin-top: 16px; }
    `,
  ],
})
export class FlashcardsComponent implements OnInit {
  private api = inject(ApiService);

  subjects = SUBJECTS;
  subject = 'Math';
  topic = '';

  cards: Flashcard[] = [];
  index = 0;
  flipped = false;
  mastered = 0;
  total = 0;
  loading = false;
  making = false;
  error = '';

  get current(): Flashcard | undefined {
    return this.cards[this.index];
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.reviewFlashcards('').subscribe({
      next: (res) => {
        this.cards = res.cards;
        this.mastered = res.mastered;
        this.total = res.total;
        this.index = 0;
        this.flipped = false;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  makeCards(): void {
    this.making = true;
    this.error = '';
    this.api.generateFlashcards(this.subject, this.topic.trim(), 8).subscribe({
      next: () => {
        this.making = false;
        this.topic = '';
        this.load();
      },
      error: (err) => {
        this.making = false;
        this.error = err.error?.detail ?? 'Could not make cards right now. Try again!';
      },
    });
  }

  answer(correct: boolean): void {
    const card = this.current;
    if (!card) return;
    this.api.answerFlashcard(card.id, correct).subscribe();
    this.flipped = false;
    if (this.index + 1 < this.cards.length) {
      this.index++;
    } else {
      this.load();
    }
  }
}
