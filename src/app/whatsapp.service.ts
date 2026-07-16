import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

const API_BASE = 'https://hitbackend-lvxc6gsv.b4a.run/api';

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  recipient?: string;
  method?: string;
  timestamp?: string;
  error?: string;
  code?: string;
  simulated?: boolean;
  warning?: string;
  metaError?: any;
}

export interface ValidatePhoneResponse {
  valid: boolean;
  normalized?: string;
  error?: string;
  code?: string;
}

@Injectable({ providedIn: 'root' })
export class WhatsAppService {

  constructor(private http: HttpClient) {}

  validatePhone(phone: string): Observable<ValidatePhoneResponse> {
    return this.http.post<ValidatePhoneResponse>(`${API_BASE}/whatsapp/validate-phone`, { phone })
      .pipe(
        timeout(10000),
        catchError((err: HttpErrorResponse) => {
          console.error('[WhatsAppService] Validate phone error:', err);
          return throwError(() => err);
        })
      );
  }

  sendMessage(phone: string, message: string): Observable<SendMessageResponse> {
    console.log('[WhatsAppService] Sending message:', { phone, message: message.substring(0, 50) + '...' });
    
    return this.http.post<SendMessageResponse>(`${API_BASE}/whatsapp/send`, { phone, message })
      .pipe(
        timeout(30000),
        catchError((err: HttpErrorResponse) => {
          console.error('[WhatsAppService] Send message error:');
          console.error('  Status:', err.status);
          console.error('  Error:', JSON.stringify(err.error, null, 2));
          
          let errorMessage = 'فشل في إرسال الرسالة';
          let errorCode = 'UNKNOWN_ERROR';
          
          if (err.status === 0) {
            errorMessage = 'لا يمكن الاتصال بالخادم - تأكد من تشغيل الـ server';
          } else if (err.error) {
            errorMessage = err.error.error || err.error.message || JSON.stringify(err.error);
            errorCode = err.error.code || 'API_ERROR';
            if (err.error.metaError) {
              console.error('  Meta Error:', JSON.stringify(err.error.metaError, null, 2));
            }
          }
          
          return throwError(() => new Error(JSON.stringify({
            success: false,
            error: errorMessage,
            code: errorCode,
            status: err.status,
            details: err.error,
          })));
        })
      );
  }

  checkServerHealth(): Observable<boolean> {
    return this.http.get<{ status: string; whatsapp: { configured: boolean } }>(`${API_BASE}/health`)
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  /**
   * Normalize phone number for Saudi and international formats
   */
  normalizePhone(phone: string): string {
    let normalized = phone.replace(/[\s\-\(\)]/g, '');

    if (normalized.startsWith('05') && normalized.length === 10) {
      return '+966' + normalized.substring(1);
    }
    
    if (normalized.startsWith('5') && normalized.length === 9) {
      return '+966' + normalized;
    }

    if (normalized.startsWith('00')) {
      normalized = '+' + normalized.substring(2);
    }

    if (normalized.startsWith('+')) {
      normalized = '+' + normalized.substring(1).replace(/^0+/, '');
    } else {
      if (/^9665\d{8}$/.test(normalized)) {
        // already in correct format, but without +
        normalized = '+' + normalized;
      } else {
        normalized = '+' + normalized.replace(/^0+/, '');
      }
    }

    if (normalized === '+') return phone;
    return normalized;
  }

  isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Saudi mobile: 05XXXXXXXX or 5XXXXXXXX or 9665XXXXXXXX or +9665XXXXXXXX
    const saudiRegex = /^(?:\+?966|0)?5[0-9]{8}$/;
    
    if (saudiRegex.test(cleaned)) {
      return true;
    }
    
    // Fallback standard E.164
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    return e164Regex.test(cleaned);
  }
}
