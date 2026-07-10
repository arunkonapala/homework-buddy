import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SUBJECTS } from '../api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero card pop">
      <h1>Hi there! 👋</h1>
      <p>Pick a subject and let's learn together. Ask me anything about your homework!</p>
    </section>

    <div class="subjects">
      @for (s of subjects; track s.name) {
        <a class="subject card pop" [routerLink]="['/tutor', s.name]" [style.--accent]="s.color">
          <span class="emoji">{{ s.emoji }}</span>
          <span class="name">{{ s.name }}</span>
          <span class="cta">Ask the tutor →</span>
        </a>
      }
    </div>

    <div class="quick">
      <a class="card quick-card pop" routerLink="/quiz">📝 <b>Take a Quiz</b><span class="muted">Test what you know</span></a>
      <a class="card quick-card pop" routerLink="/flashcards">🃏 <b>Flashcards</b><span class="muted">Practice & remember</span></a>
      <a class="card quick-card pop" routerLink="/progress">⭐ <b>My Progress</b><span class="muted">See how you're doing</span></a>
    </div>
  `,
  styles: [
    `
      .hero { text-align: center; margin-bottom: 20px; background: linear-gradient(135deg, #7c5cff, #a58bff); color: white; }
      .hero p { font-size: 1.1rem; margin: 0; }
      .subjects { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 20px; }
      .subject {
        display: flex; flex-direction: column; align-items: center; gap: 6px;
        text-decoration: none; color: var(--text);
        border-top: 6px solid var(--accent);
        transition: transform 0.15s ease;
      }
      .subject:hover { transform: translateY(-4px) scale(1.02); }
      .emoji { font-size: 3rem; }
      .name { font-size: 1.3rem; font-weight: 800; }
      .cta { color: var(--accent); font-weight: 600; }
      .quick { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
      .quick-card { display: flex; flex-direction: column; gap: 4px; text-decoration: none; color: var(--text); font-size: 1.05rem; }
      .quick-card:hover { transform: translateY(-3px); }
    `,
  ],
})
export class HomeComponent {
  subjects = SUBJECTS;
}
