import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OfferItem, ServiceItem, Settings } from './models';

export interface BackendServiceType {
  id: number;
  name: string;
  desc: string;
  price: number;
  visible: boolean;
}

export interface BackendCustomer {
  phoneNumber: string;
  availableDiscount: number;
  freeWashes: number;
  inviteToken?: string;
  hasInvited?: boolean;
  invitationCount?: number;
  visitCount?: number;
  createdAt: string;
}

export interface BackendTransaction {
  id: number;
  customerPhone: string;
  service: BackendServiceType;
  originalPrice: number;
  discountApplied: number;
  finalPrice: number;
  date: string;
}

export interface AdminDailyStats {
  dailyRevenue: number;
  discountedCustomers: number;
  yesterdayRevenue?: number;
  monthlyRevenue?: number;
}

export interface MediaAsset {
  id: number;
  assetKey: string;
  url: string;
  altText?: string;
  assetType: string;
}

export interface SiteContent {
  id: number;
  contentKey: string;
  title?: string;
  body?: string;
  mediaAsset?: MediaAsset;
  section?: string;
  sortOrder: number;
  enabled: boolean;
}

export interface NotificationLog {
  id: number;
  customerPhone?: string;
  channel: string;
  recipient: string;
  templateName?: string;
  message?: string;
  status: string;
  providerResponse?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://hitbackend-lvxc6gsv.b4a.run/api';
  private httpOptions = { withCredentials: true };

  constructor(private http: HttpClient) {}

  // Wash Operations
  getServices(): Observable<BackendServiceType[]> {
    return this.http.get<BackendServiceType[]>(`${this.baseUrl}/wash/services`, this.httpOptions);
  }

  getPublicOffers(): Observable<OfferItem[]> {
    return this.http.get<OfferItem[]>(`${this.baseUrl}/wash/offers`, this.httpOptions);
  }

  getAdminServices(token: string): Observable<ServiceItem[]> {
    return this.http.get<ServiceItem[]>(`${this.baseUrl}/admin/services?token=${token}`, this.httpOptions);
  }

  createService(token: string, service: Omit<ServiceItem, 'id'>): Observable<ServiceItem> {
    return this.http.post<ServiceItem>(`${this.baseUrl}/admin/services?token=${token}`, service, this.httpOptions);
  }

  updateService(token: string, service: ServiceItem): Observable<ServiceItem> {
    return this.http.put<ServiceItem>(`${this.baseUrl}/admin/services/${service.id}?token=${token}`, service, this.httpOptions);
  }

  deleteService(token: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/services/${id}?token=${token}`, this.httpOptions);
  }

  getOffers(token: string): Observable<OfferItem[]> {
    return this.http.get<OfferItem[]>(`${this.baseUrl}/admin/offers?token=${token}`, this.httpOptions);
  }

  createOffer(token: string, offer: Omit<OfferItem, 'id'>): Observable<OfferItem> {
    return this.http.post<OfferItem>(`${this.baseUrl}/admin/offers?token=${token}`, offer, this.httpOptions);
  }

  updateOffer(token: string, offer: OfferItem): Observable<OfferItem> {
    return this.http.put<OfferItem>(`${this.baseUrl}/admin/offers/${offer.id}?token=${token}`, offer, this.httpOptions);
  }

  deleteOffer(token: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/offers/${id}?token=${token}`, this.httpOptions);
  }

  getSettings(token: string): Observable<Settings> {
    return this.http.get<Settings>(`${this.baseUrl}/admin/settings?token=${token}`, this.httpOptions);
  }

  updateSettings(token: string, settings: Settings): Observable<Settings> {
    return this.http.put<Settings>(`${this.baseUrl}/admin/settings?token=${token}`, settings, this.httpOptions);
  }

  getCustomer(phone: string): Observable<BackendCustomer> {
    return this.http.get<BackendCustomer>(`${this.baseUrl}/wash/customer/${phone}`, this.httpOptions);
  }

  getCustomerByToken(token: string): Observable<BackendCustomer> {
    return this.http.get<BackendCustomer>(`${this.baseUrl}/wash/customer/by-token/${token}`, this.httpOptions);
  }

  processVisit(phone: string, serviceId: number, token: string, useReferralDiscount: boolean = true, useFreeWash: boolean = false, manualDiscountPct: number = 0, offerId: number | null = null, isLargeCar: boolean = false): Observable<BackendTransaction> {
    const payload = { 
      phone, 
      serviceId,
      useReferralDiscount,
      useFreeWash,
      manualDiscountPct,
      offerId,
      isLargeCar
    };
    return this.http.post<BackendTransaction>(`${this.baseUrl}/wash/visit?token=${token}`, payload, this.httpOptions);
  }

  inviteFriends(inviterPhone: string, friendsPhones: string[]): Observable<string> {
    return this.http.post(`${this.baseUrl}/wash/invite`, { inviterPhone, friendsPhones }, { responseType: 'text', withCredentials: true });
  }

  // Admin Operations (Protected by token)
  getDailyStats(token: string): Observable<AdminDailyStats> {
    return this.http.get<AdminDailyStats>(`${this.baseUrl}/admin/stats/daily?token=${token}`, this.httpOptions);
  }

  getAllCustomers(token: string): Observable<BackendCustomer[]> {
    return this.http.get<BackendCustomer[]>(`${this.baseUrl}/admin/customers?token=${token}`, this.httpOptions);
  }

  createCustomerOnly(token: string, phone: string): Observable<BackendCustomer> {
    return this.http.post<BackendCustomer>(`${this.baseUrl}/admin/customers?token=${token}`, { phone }, this.httpOptions);
  }

  updateCustomer(token: string, customer: BackendCustomer): Observable<BackendCustomer> {
    return this.http.put<BackendCustomer>(`${this.baseUrl}/admin/customers/${encodeURIComponent(customer.phoneNumber)}?token=${token}`, customer, this.httpOptions);
  }

  deleteCustomer(token: string, phone: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/customers/${encodeURIComponent(phone)}?token=${token}`, this.httpOptions);
  }

  getCurrentUsernames(token: string): Observable<{admin: string, cashier: string}> {
    return this.http.get<{admin: string, cashier: string}>(`${this.baseUrl}/admin/auth/current-usernames?token=${token}`, this.httpOptions);
  }

  updateAdminCredentials(token: string, currentPassword: string, newUsername: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/auth/update-admin-credentials?token=${token}`, { currentPassword, newUsername, newPassword }, this.httpOptions);
  }

  updateCashierCredentials(token: string, newUsername: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/auth/update-cashier-credentials?token=${token}`, { newUsername, newPassword }, this.httpOptions);
  }

  downloadCsvReport(token: string, period: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/admin/reports/csv/${period}?token=${token}`, {
      ...this.httpOptions,
      responseType: 'blob'
    });
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, { username, password }, this.httpOptions);
  }

  getGroupedReferrals(token: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/referrals/grouped?token=${token}`, this.httpOptions);
  }

  getContent(section?: string): Observable<SiteContent[]> {
    const query = section ? `?section=${encodeURIComponent(section)}` : '';
    return this.http.get<SiteContent[]>(`${this.baseUrl}/content${query}`, this.httpOptions);
  }

  getMediaAssets(): Observable<MediaAsset[]> {
    return this.http.get<MediaAsset[]>(`${this.baseUrl}/content/media`, this.httpOptions);
  }

  getNotificationLogs(token: string, customerPhone?: string): Observable<NotificationLog[]> {
    const customerQuery = customerPhone ? `&customerPhone=${encodeURIComponent(customerPhone)}` : '';
    return this.http.get<NotificationLog[]>(`${this.baseUrl}/admin/notification-logs?token=${token}${customerQuery}`, this.httpOptions);
  }

  getCurrentSession(): Observable<{ role: string; token: string }> {
    return this.http.get<{ role: string; token: string }>(`${this.baseUrl}/auth/me`, this.httpOptions);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/logout`, {}, this.httpOptions);
  }

  getCustomerHistory(token: string, phone: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/customers/${encodeURIComponent(phone)}/transactions?token=${token}`, this.httpOptions);
  }

  getTodaysDiscounts(token: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/discounts/today?token=${token}`, this.httpOptions);
  }

  downloadPdfReport(token: string, period: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/admin/reports/pdf/${period}?token=${token}`, {
      ...this.httpOptions,
      responseType: 'blob'
    });
  }

  getReportData(token: string, period: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/reports/data/${period}?token=${token}`, this.httpOptions);
  }
}
