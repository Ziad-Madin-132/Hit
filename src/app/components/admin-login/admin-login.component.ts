import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  @Output() loginRequested = new EventEmitter<{token: string, role: string}>();

  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private api: ApiService) {}

  submit() {
    this.error = '';
    this.loading = true;
    this.api.login(this.username.trim(), this.password).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.loginRequested.emit({ token: res.token, role: res.role });
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 0) {
          this.error = 'لا يمكن الاتصال بالخادم. يرجى التأكد من أن الخادم يعمل.';
          return;
        }
        this.error = err.error?.error || 'بيانات الدخول غير صحيحة';
      }
    });
  }
}
