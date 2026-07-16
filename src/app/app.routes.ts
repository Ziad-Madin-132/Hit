import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
export const routes: Routes = [
  { path: '', component: AppComponent },
  { path: 'hit-secure-access', component: AppComponent },
  { path: 'car_wash/api/hit-secure-access', component: AppComponent },
  { path: 'car_wash/api/owner', component: AppComponent },
  { path: 'car_wash/api/share', component: AppComponent },
  { path: 'car_wash/api/about', component: AppComponent },
  { path: '**', redirectTo: '/car_wash/api/about', pathMatch: 'full' }
];
