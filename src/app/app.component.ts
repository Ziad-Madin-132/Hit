import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { AdminWorkspaceComponent } from './components/admin-workspace/admin-workspace.component';
import { InvitePageComponent } from './components/invite-page/invite-page.component';
import { AboutPageComponent } from './components/about-page/about-page.component';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminLoginComponent, AdminWorkspaceComponent, InvitePageComponent, AboutPageComponent],
  templateUrl: './app.component.custom.html',
  styleUrl: './app.component.custom.css'
})
export class AppComponent implements OnInit {
  currentView: 'login' | 'owner' | 'share' | 'about' = (window.location.pathname.includes('/hit-secure-access') || window.location.pathname.includes('/login')) ? 'login' : window.location.pathname.includes('/owner') ? 'owner' : window.location.pathname.includes('/share') ? 'share' : 'about';
  
  // Auth is kept only in memory for the active browser session.
  token: string | null = null;
  role: string | null = null;
  inviteToken: string | null = null;

  constructor(private api: ApiService, private titleService: Title) {}

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    if (params.has('inviteToken')) {
      this.inviteToken = params.get('inviteToken');
    }

    // We do not restore session from cookies anymore.
    // Every time the page reloads, the user must login again.
    this.syncRoute();
  }

  handleLoginSuccess(event: { token: string, role: string }): void {
    this.token = event.token;
    this.role = event.role;
    
    this.currentView = 'owner';
    this.navigateToView('owner');
  }

  logout(): void {
    this.currentView = 'login';
    this.token = null;
    this.role = null;
    this.api.logout().subscribe({ next: () => {}, error: () => {} });
    this.navigateToView('login');
  }

  goTo(path: 'share' | 'about' | 'owner' | 'login'): void {
    this.currentView = path;
    this.navigateToView(path);
  }

  isOwnerView(): boolean {
    return this.currentView === 'owner';
  }

  isPublicView(): boolean {
    return this.currentView === 'share' || this.currentView === 'about';
  }

  private syncRoute(): void {
    const path = window.location.pathname;
    
    // Check if accessing admin route
    if (path.includes('/owner')) {
      if (this.token) {
        this.currentView = 'owner';
      } else {
        // Redirect to login if trying to access owner without token
        this.currentView = 'login';
        this.navigateToView('login');
      }
    } else if (path.includes('/share')) {
      this.currentView = 'share';
    } else if (path.includes('/about')) {
      this.currentView = 'about';
    } else if (path.includes('/hit-secure-access') || path.includes('/login')) {
      if (this.token) {
        // Already logged in, redirect to owner
        this.currentView = 'owner';
        this.navigateToView('owner');
      } else {
        this.currentView = 'login';
      }
    } else {
      this.currentView = 'about';
      this.navigateToView('about');
    }
  }

  showShellHeader(): boolean {
    return this.currentView === 'share';
  }

  private navigateToView(path: 'login' | 'owner' | 'share' | 'about'): void {
    let target = '';
    let pageTitle = 'مؤسسة هيت للتجارة';

    if (path === 'login') {
      target = '/car_wash/api/hit-secure-access';
      pageTitle = 'تسجيل الدخول - لوحة التحكم';
    } else if (path === 'owner') {
      target = '/car_wash/api/owner';
      pageTitle = 'لوحة التحكم - مؤسسة هيت';
    } else if (path === 'share') {
      target = '/car_wash/api/share';
      pageTitle = 'دعوة الأصدقاء - مؤسسة هيت';
    } else {
      target = '/car_wash/api/about';
      pageTitle = 'عن المغسلة - مؤسسة هيت';
    }

    this.titleService.setTitle(pageTitle);

    if (this.inviteToken && (path === 'share' || path === 'about')) {
      target += `?inviteToken=${this.inviteToken}`;
    }
    window.history.pushState({}, '', target);
  }
}
