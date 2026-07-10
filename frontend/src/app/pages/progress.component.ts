import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { ApiService, Progress } from '../api.service';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [DatePipe, KeyValuePipe],
  template: `
    @if (data; as p) {
      <div class="stats">
        <div class="card stat pop"><span class="big">🔥 {{ p.streak_days }}</span><span class="muted">day streak</span></div>
        <div class="card stat pop"><span class="big">📝 {{ p.total_quizzes }}</span><span class="muted">quizzes taken</span></div>
      </div>

      <div class="card pop">
        <h2>📊 Subjects</h2>
        @if ((p.subjects | keyvalue).length === 0) {
          <p class="muted">No quizzes yet — take one and your scores will show up here!</p>
        }
        @for (s of p.subjects | keyvalue; track s.key) {
          <div class="subj">
            <div class="subj-head">
              <b>{{ s.key }}</b>
              <span class="muted">{{ s.value.attempts }} quizzes · best {{ s.value.best_pct }}%</span>
            </div>
            <div class="bar"><div class="fill" [style.width.%]="s.value.avg_pct"></div></div>
            <span class="pct">{{ s.value.avg_pct }}% average</span>
          </div>
        }
      </div>

      @if (p.weak_topics.length > 0) {
        <div class="card pop" style="margin-top:16px">
          <h2>💪 Practice these next</h2>
          <p class="muted">Topics under 60% — a little practice here goes a long way (great info for parents too!).</p>
          @for (w of p.weak_topics; track w.topic) {
            <div class="weak"><b>{{ w.topic }}</b> <span class="muted">({{ w.subject }})</span> — {{ w.pct }}%</div>
          }
        </div>
      }

      @if (p.recent.length > 0) {
        <div class="card pop" style="margin-top:16px">
          <h2>🕐 Recent quizzes</h2>
          <table>
            <thead><tr><th>When</th><th>Subject</th><th>Topic</th><th>Score</th></tr></thead>
            <tbody>
              @for (r of p.recent; track $index) {
                <tr>
                  <td>{{ r.created_at + 'Z' | date: 'MMM d, h:mm a' }}</td>
                  <td>{{ r.subject }}</td>
                  <td>{{ r.topic }}</td>
                  <td><b>{{ r.score }}/{{ r.total }}</b></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    } @else {
      <div class="card center pop"><p class="muted">Loading your progress… ⭐</p></div>
    }
  `,
  styles: [
    `
      .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
      .stat { text-align: center; }
      .big { display: block; font-size: 2.2rem; font-weight: 800; }
      .subj { margin-bottom: 14px; }
      .subj-head { display: flex; justify-content: space-between; margin-bottom: 4px; }
      .bar { height: 16px; background: #ece8ff; border-radius: 8px; overflow: hidden; }
      .fill { height: 100%; background: linear-gradient(90deg, var(--green), #4de3b8); border-radius: 8px; }
      .pct { font-size: 0.9rem; color: var(--muted); }
      .weak { padding: 6px 0; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #eee9ff; }
      th { color: var(--muted); font-size: 0.9rem; }
      .center { text-align: center; }
    `,
  ],
})
export class ProgressComponent implements OnInit {
  private api = inject(ApiService);
  data?: Progress;

  ngOnInit(): void {
    this.api.progress().subscribe((p) => (this.data = p));
  }
}
