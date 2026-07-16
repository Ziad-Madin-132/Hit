import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { WhatsAppService } from '../../whatsapp.service';

@Component({
  selector: 'app-invite-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invite-page.component.html',
  styleUrl: './invite-page.component.css'
})
export class InvitePageComponent implements OnInit {
  inviterPhone = '';
  maskedPhone = '';
  friends: string[] = ['', '', '', '', ''];
  successMessage = '';
  errorMessage = '';
  isBusy = false;
  invitationCount = 0;
  completed = false;

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  legalConsent = false;

  constructor(private apiService: ApiService, private wa: WhatsAppService) {}

  ngOnInit() {
    // Extract inviteToken from URL
    const params = new URLSearchParams(window.location.search);
    if (params.has('inviteToken')) {
      const token = params.get('inviteToken')!;
      this.isBusy = true;
      this.apiService.getCustomerByToken(token).subscribe({
        next: (cust) => {
          this.inviterPhone = cust.phoneNumber;
          this.invitationCount = cust.invitationCount || 0;
          this.completed = this.invitationCount >= 5;
          
          if (this.inviterPhone && this.inviterPhone.length >= 4) {
             this.maskedPhone = '********' + this.inviterPhone.slice(-4);
          } else {
             this.maskedPhone = this.inviterPhone;
          }
          this.isBusy = false;
        },
        error: () => {
          this.errorMessage = 'رابط الدعوة غير صالح أو منتهي الصلاحية.';
          this.isBusy = false;
        }
      });
    } else {
      this.errorMessage = 'رابط الدعوة غير صالح أو غير مكتمل. يرجى استخدام الرابط الخاص بك المرسل عبر الواتساب.';
    }
  }



  sendInvitation() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.inviterPhone) {
      this.errorMessage = 'يجب إدخال رقم هاتفك أولاً.';
      return;
    }

    const validFriends = this.friends
      .filter(f => f && f.trim().length > 0)
      .map(f => this.wa.normalizePhone(f));
      
    if (validFriends.length === 0) {
      this.errorMessage = 'يرجى إدخال رقم هاتف صديق واحد على الأقل.';
      return;
    }

    this.isBusy = true;
    this.apiService.inviteFriends(this.inviterPhone, validFriends).subscribe({
      next: (res) => {
        this.isBusy = false;
        this.invitationCount += validFriends.length;
        if (this.invitationCount >= 5) {
           this.completed = true;
        } else {
           this.successMessage = "🎉 أحسنت! تم إرسال الدعوات بنجاح. يمكنك الاستمرار في دعوة المزيد.";
           // Don't reset all friends if we want to keep the inputs there, just clear the sent ones
           // The sent ones were in validFriends. For simplicity, just clear them all.
           this.friends = ['', '', '', '', ''];
        }
      },
      error: (err) => {
        this.isBusy = false;
        this.errorMessage = err.error || 'حدث خطأ أثناء إرسال الدعوات.';
      }
    });
  }
}
