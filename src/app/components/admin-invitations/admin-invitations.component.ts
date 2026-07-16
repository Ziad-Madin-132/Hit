import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../api.service';

interface GroupedReferral {
  inviterPhone: string;
  invitedPhones: string[];
  count: number;
}

@Component({
  selector: 'app-admin-invitations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="invitations-container" dir="rtl">
      <div class="header">
        <h2>سجل الدعوات</h2>
        <p>متابعة العملاء الذين قاموا بدعوة أصدقائهم</p>
      </div>

      <div class="loading" *ngIf="loading">
        <i class="fas fa-spinner fa-spin"></i> جاري تحميل البيانات...
      </div>
      
      <div class="error" *ngIf="error">
        {{ error }}
      </div>

      <div class="table-wrapper" *ngIf="!loading && !error">
        <table class="data-table">
          <thead>
            <tr>
              <th>رقم الداعي</th>
              <th>عدد الدعوات</th>
              <th>أرقام الأصدقاء المدعوين</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ref of referrals">
              <td><span class="phone-badge">{{ ref.inviterPhone }}</span></td>
              <td><span class="count-badge">{{ ref.count }}</span></td>
              <td>
                <div class="phones-list">
                  <span class="friend-phone" *ngFor="let phone of ref.invitedPhones" dir="ltr">{{ phone }}</span>
                </div>
              </td>
            </tr>
            <tr *ngIf="referrals.length === 0">
              <td colspan="3" class="text-center">لا توجد دعوات مسجلة حتى الآن.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .invitations-container {
      padding: 20px;
      font-family: 'Inter', sans-serif;
    }
    .header {
      margin-bottom: 24px;
    }
    .header h2 {
      margin: 0;
      color: var(--hit-darkred, #7A1525);
      font-size: 24px;
      font-weight: 800;
    }
    .header p {
      margin: 5px 0 0 0;
      color: #666;
      font-size: 14px;
    }
    .table-wrapper {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      overflow: hidden;
      border: 1px solid #eee;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table th, .data-table td {
      padding: 16px;
      text-align: right;
      border-bottom: 1px solid #f0f0f0;
    }
    .data-table th {
      background: #fafafa;
      font-weight: 700;
      color: #444;
      font-size: 14px;
    }
    .data-table tbody tr:hover {
      background: #fdfdfd;
    }
    .phone-badge {
      background: #fef0f0;
      color: var(--hit-red, #9B1B30);
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      display: inline-block;
      direction: ltr;
    }
    .count-badge {
      background: var(--hit-orange, #F47920);
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 13px;
    }
    .phones-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .friend-phone {
      background: #f5f5f5;
      border: 1px solid #ddd;
      color: #555;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 13px;
      font-family: monospace;
    }
    .loading, .error, .text-center {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    .error { color: red; }
  `]
})
export class AdminInvitationsComponent implements OnInit {
  @Input() token = '';
  referrals: GroupedReferral[] = [];
  loading = true;
  error = '';
  
  constructor(private api: ApiService) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    if (!this.token) {
      this.error = 'لا توجد جلسة دخول صالحة';
      this.loading = false;
      return;
    }
    
    this.api.getGroupedReferrals(this.token).subscribe({
      next: (data) => {
        this.referrals = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'حدث خطأ أثناء تحميل البيانات';
        this.loading = false;
      }
    });
  }
}
