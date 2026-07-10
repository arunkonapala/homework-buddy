import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header>
      <a routerLink="/" class="logo">🚀 Homework Buddy</a>
      <nav>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">🏠 Home</a>
        <a routerLink="/quiz" routerLinkActive="active">📝 Quiz</a>
        <a routerLink="/flashcards" routerLinkActive="active">🃏 Flashcards</a>
        <a routerLink="/progress" routerLinkActive="active">⭐ Progress</a>
      </nav>
    </header>
    <main>
      <router-outlet />
    </main>
  `,
  styles: [
    `
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        padding: 14px 24px;
        background: var(--purple);
        box-shadow: 0 4px 14px rgba(90, 62, 230, 0.3);
      }
      .logo {
        font-size: 1.5rem;
        font-weight: 800;
        color: white;
        text-decoration: none;
      }
      nav { display: flex; gap: 6px; flex-wrap: wrap; }
      nav a {
        color: #e9e3ff;
        text-decoration: none;
        font-weight: 600;
        padding: 8px 14px;
        border-radius: 12px;
      }
      nav a.active, nav a:hover { background: rgba(255, 255, 255, 0.2); color: white; }
      main { max-width: 900px; margin: 0 auto; padding: 24px 16px 60px; }
    `,
  ],
})
export class AppComponent {}
