import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, ChatMessage } from '../api.service';

@Component({
  selector: 'app-tutor',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="card chat-card pop">
      <h2>🧑‍🏫 {{ subject }} Tutor</h2>
      <p class="muted">I'll help you figure it out — step by step. I won't just give you the answer! 😉</p>

      <div class="chat" #chatBox>
        @if (messages.length === 0) {
          <div class="bubble assistant">
            Hi! I'm Buddy 🤖 What {{ subject.toLowerCase() }} question are you working on today?
          </div>
        }
        @for (m of messages; track $index) {
          <div class="bubble" [class.user]="m.role === 'user'" [class.assistant]="m.role === 'assistant'">
            {{ m.content }}
          </div>
        }
        @if (loading) {
          <div class="bubble assistant thinking">Buddy is thinking… 💭</div>
        }
        @if (error) {
          <div class="bubble error">{{ error }}</div>
        }
      </div>

      <form class="composer" (ngSubmit)="send()">
        <input
          [(ngModel)]="draft"
          name="draft"
          placeholder="Type your question here…"
          autocomplete="off"
          [disabled]="loading"
        />
        <button class="btn" type="submit" [disabled]="loading || !draft.trim()">Send 🚀</button>
      </form>
    </div>
  `,
  styles: [
    `
      .chat-card { display: flex; flex-direction: column; min-height: 70vh; }
      .chat { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 10px 0; }
      .bubble {
        max-width: 80%; padding: 12px 16px; border-radius: 18px;
        font-size: 1.05rem; line-height: 1.45; white-space: pre-wrap;
      }
      .bubble.assistant { background: #efeaff; border-bottom-left-radius: 4px; align-self: flex-start; }
      .bubble.user { background: var(--purple); color: white; border-bottom-right-radius: 4px; align-self: flex-end; }
      .bubble.thinking { opacity: 0.7; font-style: italic; }
      .bubble.error { background: #ffe3ea; color: #b3123f; align-self: center; }
      .composer { display: flex; gap: 10px; margin-top: 12px; }
      .composer input { flex: 1; }
    `,
  ],
})
export class TutorComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  @ViewChild('chatBox') chatBox?: ElementRef<HTMLDivElement>;

  subject = this.route.snapshot.paramMap.get('subject') ?? 'Math';
  messages: ChatMessage[] = [];
  draft = '';
  loading = false;
  error = '';

  send(): void {
    const content = this.draft.trim();
    if (!content || this.loading) return;
    this.messages.push({ role: 'user', content });
    this.draft = '';
    this.loading = true;
    this.error = '';
    this.scrollDown();

    this.api.chat(this.subject, this.messages).subscribe({
      next: (res) => {
        this.messages.push({ role: 'assistant', content: res.reply });
        this.loading = false;
        this.scrollDown();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail ?? 'Oops, something went wrong. Try again!';
      },
    });
  }

  private scrollDown(): void {
    setTimeout(() => {
      const el = this.chatBox?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
