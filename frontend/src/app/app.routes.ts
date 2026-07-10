import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { TutorComponent } from './pages/tutor.component';
import { QuizComponent } from './pages/quiz.component';
import { FlashcardsComponent } from './pages/flashcards.component';
import { ProgressComponent } from './pages/progress.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'tutor/:subject', component: TutorComponent },
  { path: 'quiz', component: QuizComponent },
  { path: 'flashcards', component: FlashcardsComponent },
  { path: 'progress', component: ProgressComponent },
  { path: '**', redirectTo: '' },
];
