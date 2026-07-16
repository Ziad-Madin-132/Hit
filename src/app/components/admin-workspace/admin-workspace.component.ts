import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientRecord, OfferItem, ServiceItem, Settings } from '../../models';
import { WhatsAppService } from '../../whatsapp.service';
import { ApiService, BackendCustomer, AdminDailyStats, BackendServiceType } from '../../api.service';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-admin-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-workspace.component.html',
  styleUrl: './admin-workspace.component.css'
})
export class AdminWorkspaceComponent implements OnInit {
  @Input() token: string | null = null;
  @Input() role: string | null = null;
  @Output() logoutRequested = new EventEmitter<void>();

  // nav
  activeSection: 'home' | 'services' | 'offers' | 'addClient' | 'clients' | 'settings' | 'invitations' = 'home';
  sidebarOpen = false;

  // data
  backendServices: BackendServiceType[] = [];
  backendCustomers: BackendCustomer[] = [];
  backendDailyStats: AdminDailyStats = { dailyRevenue: 0, discountedCustomers: 0 };
  services: ServiceItem[] = [];
  offers: OfferItem[] = [];
  clients: ClientRecord[] = [];
  settings: Settings = {
    siteName: '', heroTitle: '', heroDesc: '', phone: '', whatsapp: '', address: '',
    aboutImage: '', aboutTitle: '', aboutText1: '', aboutText2: '', mapUrl: '', brands: [],
    colors: { p: '#8B1528', a: '#E86A15', g: '#D4A24E', bg: '#FDF8F5' },
    hours: [],
    waTemplates: { oil: '', wash: '', welcome: '' }
  };

  // stats
  stats = { services: 0, offers: 0, clients: 0, oilClients: 0, dailyRevenue: 0, discountedCustomers: 0, yesterdayRevenue: 0, monthlyRevenue: 0 };

  // invitations
  invitationsList: any[] = [];

  // reports
  todaysDiscounts: any[] = [];
  customerHistory: any[] = [];
  selectedCustomerHistoryPhone: string | null = null;
  historyModalOpen = false;

  // pdf reports
  reportData: any = null;
  reportPeriodLabel = '';
  isGeneratingReport = false;

  // add client
  pickedSvcId: number | null = null;
  selectedServiceName = '';
  selectedServiceDesc = '';
  selectedServicePrice = '';

  // discounts
  useRefDiscount = true;
  manualDiscountPct = 0;
  selectedOfferId: number | null = null;
  useFreeWash = false;
  customerAvailableDiscount = 0;
  customerFreeWashes = 0;

  // service modal
  svcEditId: number | null = null;
  svcName = '';
  svcDesc = '';
  svcPrice = 0;
  svcLargeCarFee = 20;
  svcVis = true;

  // offer modal
  offEditId: number | null = null;
  offTitle = '';
  offDesc = '';
  offStart = '';
  offEnd = '';
  offImg = '';
  offPreview = '';
  offDiscountPct = 0;

  // client modal
  cliEditId: any = null;
  cliPhone = '';
  cliService = '';

  // delete modal
  delId: any = null;
  delType = '';

  // search
  cliSearch = '';
  clientTab: 'all' | 'today' = 'all';

  // clock
  currentTime = '';

  // toast
  toasts: Array<{ id: number; msg: string; type: string }> = [];

  // settings color inputs
  cP = '#8B1528';
  cA = '#E86A15';
  cG = '#D4A24E';
  cBg = '#FDF8F5';

  // settings text
  sName = '';
  sHero = '';
  sDesc = '';
  sPhone = '';
  sWA = '';
  sAddr = '';

  sAboutImage = '';
  sAboutTitle = '';
  sAboutText1 = '';
  sAboutText2 = '';
  sMapUrl = '';
  newBrandUrl = '';
  sBrands: string[] = [];
  sLargeCarFee = 20;

  sHours: any[] = [];
  waTemplateOil = '';
  waTemplateWash = '';
  waTemplateWelcome = '';



  private toastId = 0;

  // WhatsApp
  waBusy = false;
  waError = '';

  constructor(private wa: WhatsAppService, private apiService: ApiService) {}

  ngOnInit(): void {
    if (this.role === 'CASHIER') {
      this.activeSection = 'clients';
      this.clientTab = 'today';
    }
    if (!this.token) {
      this.logoutRequested.emit();
      return;
    }
    this.refreshAll();
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
    setInterval(() => {
      if (this.activeSection !== 'settings') {
        this.refreshAll();
      }
    }, 60000); // 1 minute polling for real-time updates
  }

  addBrand() {
    if (this.newBrandUrl.trim()) {
      this.sBrands.push(this.newBrandUrl.trim());
      this.newBrandUrl = '';
    }
  }

  removeBrand(index: number) {
    this.sBrands.splice(index, 1);
  }

  loadSet(): void {
    if(!this.token) return;
    this.apiService.getSettings(this.token).subscribe(s => {
      this.sName = s.siteName || '';
      this.sHero = s.heroTitle || '';
      this.sDesc = s.heroDesc || '';
      this.sPhone = s.phone || '';
      this.sWA = s.whatsapp || '';
      this.sAddr = s.address || '';

      this.sAboutImage = s.aboutImage || '';
      this.sAboutTitle = s.aboutTitle || '';
      this.sAboutText1 = s.aboutText1 || '';
      this.sAboutText2 = s.aboutText2 || '';
      this.sMapUrl = s.mapUrl || '';
      this.sBrands = s.brands || [];
      this.sLargeCarFee = s.largeCarFee || 20;

      this.cP = s.colors?.p || '#8B1528';
      this.cA = s.colors?.a || '#E86A15';
      this.cG = s.colors?.g || '#D4A24E';
      this.cBg = s.colors?.bg || '#FDF8F5';
      this.sHours = s.hours || [];
      this.waTemplateOil = s.waTemplates?.oil || '';
      this.waTemplateWash = s.waTemplates?.wash || '';
      this.waTemplateWelcome = s.waTemplates?.welcome || '';

      setTimeout(() => {
        const area = document.getElementById('hoursEditArea');
        if (area) {
          area.innerHTML = s.hours.map((h: any, i: number) =>
            `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <span style="font-size:12px;font-weight:700;color:var(--db-muted);min-width:55px;">${this.esc(h.day)}</span>
              <input type="time" class="fi-db" value="${this.esc(h.from)}" style="max-width:120px;" dir="ltr" data-hi="${i}" data-ht="from">
              <span style="color:var(--db-dim);">-</span>
              <input type="time" class="fi-db" value="${this.esc(h.to)}" style="max-width:120px;" dir="ltr" data-hi="${i}" data-ht="to">
            </div>`
          ).join('');
        }
      }, 50);
    });

    if (this.role === 'ADMIN') {
      this.apiService.getCurrentUsernames(this.token).subscribe(res => {
        this.adminUsername = res.admin;
        this.cashierUsername = res.cashier;
      });
    }
  }

  saveSet(): void {
    if(!this.token) return;
    const pl = {
      siteName: this.sName.trim(),
      heroTitle: this.sHero.trim(),
      heroDesc: this.sDesc.trim(),
      phone: this.sPhone.trim(),
      whatsapp: this.sWA.trim(),
      address: this.sAddr.trim(),

      aboutImage: this.sAboutImage.trim(),
      aboutTitle: this.sAboutTitle.trim(),
      aboutText1: this.sAboutText1.trim(),
      aboutText2: this.sAboutText2.trim(),
      mapUrl: this.sMapUrl.trim(),
      brands: this.sBrands,
      largeCarFee: this.sLargeCarFee,

      colors: { p: this.cP, a: this.cA, g: this.cG, bg: this.cBg },
      hours: this.sHours,
      waTemplates: { oil: this.waTemplateOil, wash: this.waTemplateWash, welcome: this.waTemplateWelcome }
    };

    const area = document.getElementById('hoursEditArea');
    if (area) {
      const inputs = area.querySelectorAll('input[data-hi]');
      inputs.forEach(inp => {
        const idx = parseInt((inp as HTMLElement).dataset['hi']!);
        const type = (inp as HTMLElement).dataset['ht'] as 'from' | 'to';
        if (pl.hours[idx]) pl.hours[idx][type] = (inp as HTMLInputElement).value;
      });
    }

    this.apiService.updateSettings(this.token, pl as Settings).subscribe({
      next: (saved) => {
        this.settings = saved;
        this.applyColors();
        this.toast('تم الحفظ', 'ok');
      },
      error: () => this.toast('حدث خطأ أثناء حفظ الإعدادات', 'er')
    });
  }

  refreshAll(): void {
    if (!this.token) return;
    this.toast('جاري تحديث البيانات...', 'in');

    this.apiService.getAdminServices(this.token).subscribe({
      next: (res) => {
        this.services = res;
        this.backendServices = res;
        this.updStats();
      },
      error: () => this.toast('فشل تحديث الخدمات', 'er')
    });
    this.apiService.getDailyStats(this.token).subscribe({
      next: (res) => {
        this.backendDailyStats = res;
        this.stats.dailyRevenue = res.dailyRevenue;
        this.stats.yesterdayRevenue = res.yesterdayRevenue || 0;
        this.stats.monthlyRevenue = res.monthlyRevenue || 0;
        this.stats.discountedCustomers = res.discountedCustomers;
      },
      error: () => this.toast('فشل تحديث الإحصائيات', 'er')
    });
    this.apiService.getAllCustomers(this.token).subscribe({
      next: (res) => {
        this.backendCustomers = res;
        this.updStats();
      },
      error: () => this.toast('فشل تحديث العملاء', 'er')
    });

    this.apiService.getOffers(this.token).subscribe({
      next: (res) => {
        this.offers = res;
        this.updStats();
      },
      error: () => this.toast('فشل تحديث العروض', 'er')
    });
    this.apiService.getSettings(this.token).subscribe({
      next: (res) => {
        this.settings = res;
        this.applyColors();
        if (this.activeSection === 'settings') {
          this.loadSet();
        }
      },
      error: () => this.toast('فشل تحديث الإعدادات', 'er')
    });
    this.apiService.getGroupedReferrals(this.token).subscribe({
      next: (res) => {
        this.invitationsList = res;
      },
      error: () => this.toast('فشل تحديث الدعوات', 'er')
    });
    this.apiService.getTodaysDiscounts(this.token).subscribe({
      next: (res) => {
        this.todaysDiscounts = res;
        this.toast('تم التحديث بنجاح', 'ok');
      },
      error: () => this.toast('فشل تحديث خصومات اليوم', 'er')
    });
  }

  selectedCustomerTotalSpent: number = 0;
  selectedCustomerTotalDiscounts: number = 0;

  viewCustomerHistory(phone: string): void {
    if (!this.token) return;
    this.selectedCustomerHistoryPhone = phone;
    this.apiService.getCustomerHistory(this.token, phone).subscribe({
      next: (res) => {
        this.customerHistory = res;
        this.selectedCustomerTotalSpent = this.customerHistory.reduce((sum, t) => sum + t.finalPrice, 0);
        this.selectedCustomerTotalDiscounts = this.customerHistory.reduce((sum, t) => sum + (t.originalPrice - t.finalPrice), 0);
        this.historyModalOpen = true;
      },
      error: () => this.toast('فشل في جلب سجل العميل', 'er')
    });
  }

  closeCustomerHistory(): void {
    this.historyModalOpen = false;
    this.selectedCustomerHistoryPhone = null;
    this.customerHistory = [];
    this.selectedCustomerTotalSpent = 0;
    this.selectedCustomerTotalDiscounts = 0;
  }

  downloadReport(period: string): void {
    if (!this.token) return;
    this.isGeneratingReport = true;

    const labels: any = { 'DAILY': 'يومي', 'WEEKLY': 'أسبوعي', 'MONTHLY': 'شهري', 'YEARLY': 'سنوي' };
    this.reportPeriodLabel = labels[period.toUpperCase()] || period;

    this.apiService.getReportData(this.token, period).subscribe({
      next: (data) => {
        this.reportData = data;
        // Wait a bit for angular to render the hidden report div
        setTimeout(() => {
          const element = document.getElementById('pdf-report-content');
          if (element) {
            // Unhide temporarily
            element.style.display = 'block';

            const opt = {
              margin:       [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
              filename:     `تقرير_هيت_${this.reportPeriodLabel}.pdf`,
              image:        { type: 'jpeg' as const, quality: 0.98 },
              html2canvas:  { scale: 2, useCORS: true },
              jsPDF:        { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
            };

            html2pdf().from(element).set(opt).save().then(() => {
              element.style.display = 'none';
              this.isGeneratingReport = false;
              this.reportData = null;
            }).catch(() => {
              element.style.display = 'none';
              this.isGeneratingReport = false;
              this.reportData = null;
            });
          }
        }, 500);
      },
      error: () => {
        alert('حدث خطأ أثناء تحميل بيانات التقرير');
        this.isGeneratingReport = false;
      }
    });
  }

  updStats(): void {
    this.stats.services = this.services.length;
    this.stats.offers = this.offers.length;
    this.stats.clients = this.backendCustomers.length;
    this.stats.oilClients = 0;
  }

  get waOilTemplate(): string {
    return this.settings.waTemplates?.oil || '🎉 شكراً لزيارتك، لقد حصلت على غسلة سيارة مجانية في مركز PETRO HIT.';
  }

  get waWashTemplate(): string {
    return this.settings.waTemplates?.wash || '🚗 شكراً لاختيارك مركز PETRO HIT، نتمنى رؤيتك مرة أخرى قريباً.';
  }

  getTemplateForService(service: string): string {
    return service === 'oil' ? this.waOilTemplate : this.waWashTemplate;
  }

  /* ===== NAV ===== */
  go(section: 'home' | 'services' | 'offers' | 'addClient' | 'clients' | 'settings' | 'invitations'): void {
    this.activeSection = section;
    this.sidebarOpen = false;
    if (section === 'home') this.updStats();
    if (section === 'services') this.renSvc();
    if (section === 'offers') this.renOff();
    if (section === 'clients') this.renCli();
    if (section === 'settings') this.loadSet();
    if (section === 'addClient') this.initAddClient();
  }



  togSB(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSB(): void {
    this.sidebarOpen = false;
  }

  /* ===== TOAST ===== */
  toast(msg: string, type: 'ok' | 'er' | 'in' | 'wn' = 'in'): void {
    const id = ++this.toastId;
    this.toasts.push({ id, msg, type });
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 3200);
  }

  /* ===== MODALS ===== */
  openMo(id: string): void {
    document.getElementById(id)?.classList.add('on');
    document.body.style.overflow = 'hidden';
  }

  clMo(id: string): void {
    document.getElementById(id)?.classList.remove('on');
    document.body.style.overflow = '';
  }

  /* ===== SERVICES ===== */
  renSvc(): void {
    // used to refresh tables if needed; currently template binds directly
  }



  openSvcMo(): void {
    this.svcEditId = null;
    this.svcName = '';
    this.svcDesc = '';
    this.svcPrice = 0;
    this.svcLargeCarFee = 20;
    this.svcVis = true;
    document.getElementById('svcMoT')!.textContent = 'إضافة خدمة';
    this.openMo('svcMo');
  }

  editSvc(id: number): void {
    const s = this.services.find(x => x.id === id);
    if (!s) return;
    this.svcEditId = id;
    this.svcName = s.name;
    this.svcDesc = s.desc;
    this.svcPrice = s.price;
    this.svcLargeCarFee = s.largeCarFee ?? 20;
    this.svcVis = s.visible;
    document.getElementById('svcMoT')!.textContent = 'تعديل الخدمة';
    this.openMo('svcMo');
  }

  saveSvc(): void {
    const name = (document.getElementById('sName') as HTMLInputElement).value.trim();
    const desc = (document.getElementById('sDesc') as HTMLInputElement).value.trim();
    const price = Number((document.getElementById('sPrice') as HTMLInputElement).value);
    const largeCarFee = Number((document.getElementById('sLargeCarFee') as HTMLInputElement).value);

    if (!name) { this.toast('أدخل اسم الخدمة', 'er'); return; }
    if (price <= 0) { this.toast('أدخل سعر صحيح', 'er'); return; }
    if (!this.token) return;

    const payload = { name, desc, price, largeCarFee, visible: this.svcVis };
    if (this.svcEditId != null) {
      this.apiService.updateService(this.token, { id: this.svcEditId, ...payload }).subscribe({
        next: () => {
          this.toast('تم تعديل الخدمة', 'ok');
          this.clMo('svcMo');
          this.refreshAll();
        },
        error: () => this.toast('حدث خطأ أثناء حفظ الخدمة', 'er')
      });
    } else {
      this.apiService.createService(this.token, payload).subscribe({
        next: () => {
          this.toast('تم إضافة الخدمة', 'ok');
          this.clMo('svcMo');
          this.refreshAll();
        },
        error: () => this.toast('حدث خطأ أثناء حفظ الخدمة', 'er')
      });
    }
  }
  confirmDel(id: any, type: string): void {
    this.delId = id;
    this.delType = type;
    const names: any = { service: 'الخدمة', offer: 'العرض', client: 'العميل' };
    document.getElementById('delMsg')!.textContent = `هل أنت متأكد من حذف ${names[type] || 'هذا العنصر'}؟`;
    this.openMo('delMo');
  }

  doDel(): void {
    if (!this.token) return;
    const done = (msg: string) => {
      this.toast(msg, 'ok');
      this.clMo('delMo');
      this.refreshAll();
    };
    const fail = () => this.toast('حدث خطأ أثناء الحذف', 'er');

    if (this.delType === 'service') {
      this.apiService.deleteService(this.token, Number(this.delId)).subscribe({ next: () => done('تم حذف الخدمة'), error: fail });
    } else if (this.delType === 'offer') {
      this.apiService.deleteOffer(this.token, Number(this.delId)).subscribe({ next: () => done('تم حذف العرض'), error: fail });
    } else if (this.delType === 'client') {
      this.apiService.deleteCustomer(this.token, String(this.delId)).subscribe({ next: () => done('تم حذف العميل'), error: fail });
    }
  }
  /* ===== OFFERS ===== */
  renOff(): void {}

  openOffMo(): void {
    this.offEditId = null;
    this.offTitle = '';
    this.offDesc = '';
    this.offStart = '';
    this.offEnd = '';
    this.offImg = '';
    this.offPreview = '';
    this.offDiscountPct = 0;
    document.getElementById('offMoT')!.textContent = 'إضافة عرض';
    this.openMo('offMo');
  }

  editOff(id: number): void {
    const o = this.offers.find(x => x.id === id);
    if (!o) return;
    this.offEditId = id;
    this.offTitle = o.title;
    this.offDesc = o.desc;
    this.offStart = o.startDate;
    this.offEnd = o.endDate;
    this.offImg = o.image;
    this.offPreview = o.image;
    this.offDiscountPct = o.discountPct || 0;
    document.getElementById('offMoT')!.textContent = 'تعديل العرض';
    this.openMo('offMo');
  }

  prevOffImg(files: FileList | null): void {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.offImg = e.target?.result as string;
      this.offPreview = this.offImg;
    };
    reader.readAsDataURL(file);
  }

  saveOff(): void {
    const title = this.offTitle.trim();
    const desc = this.offDesc.trim();
    const sD = this.offStart;
    const eD = this.offEnd;

    if (!title) { this.toast('أدخل عنوان العرض', 'er'); return; }
    if (!this.token) return;

    const payload = { title, desc, image: this.offImg, startDate: sD, endDate: eD, discountPct: this.offDiscountPct };
    if (this.offEditId != null) {
      this.apiService.updateOffer(this.token, { id: this.offEditId, ...payload }).subscribe({
        next: () => {
          this.toast('تم تعديل العرض', 'ok');
          this.clMo('offMo');
          this.refreshAll();
        },
        error: () => this.toast('حدث خطأ أثناء حفظ العرض', 'er')
      });
    } else {
      this.apiService.createOffer(this.token, payload).subscribe({
        next: () => {
          this.toast('تم إضافة العرض', 'ok');
          this.clMo('offMo');
          this.refreshAll();
        },
        error: () => this.toast('حدث خطأ أثناء حفظ العرض', 'er')
      });
    }
  }
  /* ===== ADD CLIENT ===== */
  initAddClient(): void {
    this.pickedSvcId = null;
    this.selectedServiceName = '';
    this.selectedServiceDesc = '';
    this.selectedServicePrice = '';
    this.useRefDiscount = true;
    this.useFreeWash = false;
    this.manualDiscountPct = 0;
    this.selectedOfferId = null;
    this.customerAvailableDiscount = 0;
    document.getElementById('selectedSummary')?.classList.remove('show');
  }

  onPhoneInput(): void {
    const phone = (document.getElementById('cPhone') as HTMLInputElement)?.value.trim() || '';
    if (phone.length > 5) {
      const normalizedPhone = this.wa.normalizePhone(phone);
      const existingCust = this.backendCustomers.find(c => c.phoneNumber === normalizedPhone);
      if (existingCust) {
        this.customerAvailableDiscount = existingCust.availableDiscount || 0;
        this.customerFreeWashes = existingCust.freeWashes || 0;
      } else {
        this.customerAvailableDiscount = 0;
        this.customerFreeWashes = 0;
      }
    } else {
      this.customerAvailableDiscount = 0;
      this.customerFreeWashes = 0;
    }
  }

  get visibleServices(): ServiceItem[] {
    return this.services.filter(s => s.visible);
  }

  isLargeCar = false;

  doPick(svc: ServiceItem): void {
    this.pickedSvcId = svc.id;
    this.selectedServiceName = svc.name;
    this.selectedServiceDesc = svc.desc;
    this.updateSelectedServicePrice(svc.price);
    document.querySelectorAll('#svcPickArea .svc-pick').forEach(el => el.classList.remove('picked'));
    document.getElementById('svc-' + svc.id)?.classList.add('picked');
    document.getElementById('ssIcon')!.innerHTML = `<i class="fas ${this.getSvcIcon(svc.name)}"></i>`;
    document.getElementById('ssName')!.textContent = svc.name;
    document.getElementById('ssDesc')!.textContent = svc.desc;
    document.getElementById('selectedSummary')?.classList.add('show');
  }

  onLargeCarToggle(): void {
    if (this.pickedSvcId != null) {
      const svc = this.services.find(s => s.id === this.pickedSvcId);
      if (svc) {
        this.updateSelectedServicePrice(svc.price);
      }
    }
  }

  private updateSelectedServicePrice(basePrice: number): void {
    let extraFee = 0;
    if (this.isLargeCar && this.pickedSvcId != null) {
      const svc = this.services.find(s => s.id === this.pickedSvcId);
      extraFee = svc?.largeCarFee ?? 20;
    }
    this.selectedServicePrice = (basePrice + extraFee) + ' ر.س';
    const ssPrice = document.getElementById('ssPrice');
    if (ssPrice) ssPrice.textContent = this.selectedServicePrice;
  }

  clearPick(): void {
    this.pickedSvcId = null;
    this.selectedServiceName = '';
    this.selectedServiceDesc = '';
    this.selectedServicePrice = '';
    this.isLargeCar = false;
    document.getElementById('selectedSummary')?.classList.remove('show');
    document.querySelectorAll('#svcPickArea .svc-pick').forEach(el => el.classList.remove('picked'));
  }

  addCli(): void {
    const phone = (document.getElementById('cPhone') as HTMLInputElement)?.value.trim() || '';
    const phoneEl = document.getElementById('cPhone') as HTMLInputElement;

    if (!phone) {
      phoneEl.classList.add('err-border');
      phoneEl.focus();
      this.toast('أدخل رقم الهاتف', 'er');
      return;
    }

    const normalizedPhone = this.wa.normalizePhone(phone);
    if (!this.wa.isValidPhone(phone)) {
      phoneEl.classList.add('err-border');
      phoneEl.focus();
      this.toast('رقم الهاتف غير صالح', 'er');
      return;
    }

    if (this.pickedSvcId == null) {
      document.getElementById('svcPickArea')?.classList.add('shake');
      setTimeout(() => document.getElementById('svcPickArea')?.classList.remove('shake'), 400);
      this.toast('اضغط على الخدمة المطلوبة', 'er');
      return;
    }

    const svc = this.services.find(s => s.id === this.pickedSvcId);

    this.waError = '';
    this.waBusy = true;

    if (!this.token) return;
    this.apiService.processVisit(
      normalizedPhone,
      this.pickedSvcId,
      this.token,
      this.useRefDiscount,
      this.useFreeWash,
      this.manualDiscountPct,
      this.selectedOfferId,
      this.isLargeCar
    ).subscribe({
      next: (tx) => {
        this.waBusy = false;

        let successMsg = `تمت إضافة الزيارة بنجاح. السعر قبل الخصم: ${tx.originalPrice} ر.س. السعر النهائي: ${tx.finalPrice} ر.س. (خصم: ${tx.discountApplied}%)`;
        this.toast(successMsg, 'ok');

        this.refreshAll();

        // WhatsApp notification is handled by the Spring backend and logged in PostgreSQL.
      },
      error: (err) => {
        this.waBusy = false;
        this.toast('حدث خطأ أثناء حفظ الزيارة في النظام', 'er');
        console.error(err);
      }
    });

    this.initAddClient();
    this.updStats();
  }

  getClients(): ClientRecord[] {
    return this.backendCustomers.map((c, index) => ({
      id: index + 1,
      phone: c.phoneNumber,
      service: 'wash',
      serviceName: '',
      date: c.createdAt,
      timestamp: new Date(c.createdAt).getTime()
    }));
  }
  /* ===== CLIENTS ===== */
  renCli(): void {
    // template binds directly to filteredClients
  }

  get filteredCustomers(): BackendCustomer[] {
    const term = this.cliSearch.trim();
    let items = [...this.backendCustomers].reverse();
    if (this.clientTab === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      items = items.filter(c => {
         const cDate = c.createdAt ? String(c.createdAt).split('T')[0] : '';
         return cDate === todayStr;
      });
    }
    if (term) {
      items = items.filter(c => c.phoneNumber.includes(term));
    }
    return items;
  }

  get recentCustomers(): BackendCustomer[] {
    return [...this.backendCustomers].reverse().slice(0, 5);
  }

  formatDate(ts: number): string {
    const d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  getServiceBadge(service: string): string {
    return service === 'oil' ? 'bdg-oil' : 'bdg-wash';
  }

  getSvcIcon(name: string): string {
    const map: any = {
      'غسيل خارجي': 'fa-car',
      'غسيل VIP': 'fa-crown',
      'تغيير زيت': 'fa-oil-can',
      'سيراميك': 'fa-gem',
      'تنظيف مكيفات': 'fa-snowflake',
      'تلميع داخلي': 'fa-spray-can-sparkles',
      'غسيل دراجات': 'fa-motorcycle'
    };
    return map[name] || 'fa-concierge-bell';
  }

  getServiceName(id: number): string {
    return this.services.find(s => s.id === id)?.name || 'غير محدد';
  }

  // add client only modal
  addCliPhone = '';

  openAddCliMo(): void {
    this.addCliPhone = '';
    this.openMo('addCliMo');
  }

  doAddCliOnly(): void {
    const phone = this.addCliPhone.trim();
    if (!phone) {
      this.toast('أدخل رقم الهاتف', 'er');
      return;
    }
    const normalizedPhone = this.wa.normalizePhone(phone);
    if (!this.wa.isValidPhone(phone)) {
      this.toast('رقم الهاتف غير صالح - استخدم التنسيق: 05XXXXXXXX أو +9665XXXXXXXX', 'er');
      return;
    }
    if (!this.token) return;
    this.apiService.createCustomerOnly(this.token, normalizedPhone).subscribe({
      next: () => {
        this.toast('تم إضافة العميل بنجاح', 'ok');
        this.clMo('addCliMo');
        this.refreshAll();
      },
      error: () => {
        this.toast('حدث خطأ أثناء إضافة العميل', 'er');
      }
    });
  }

  editCli(id: any): void {
    const c = this.backendCustomers.find(x => x.phoneNumber === id);
    if (!c) return;
    this.cliEditId = c.phoneNumber as any;
    this.cliPhone = c.phoneNumber;
    this.cliService = 'wash';
    this.openMo('cliMo');
  }

  updCli(): void {
    if (this.cliEditId == null || !this.token) return;
    const customer = this.backendCustomers.find(c => c.phoneNumber === this.cliEditId);
    if (!customer) return;

    this.apiService.updateCustomer(this.token, customer).subscribe({
      next: () => {
        this.clMo('cliMo');
        this.refreshAll();
        this.toast('تم حفظ بيانات العميل في قاعدة البيانات', 'ok');
      },
      error: () => this.toast('حدث خطأ أثناء حفظ بيانات العميل', 'er')
    });
  }

  applyColors(): void {
    const root = document.documentElement;
    root.style.setProperty('--p', this.cP || this.settings.colors.p);
    root.style.setProperty('--a', this.cA || this.settings.colors.a);
    root.style.setProperty('--g', this.cG || this.settings.colors.g);
  }
  /* ===== UTILS ===== */
  updateClock(): void {
    const n = new Date();
    this.currentTime = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0') + ':' + String(n.getSeconds()).padStart(2, '0');
  }

  encodeURIComponent(str: string): string {
    return encodeURIComponent(str);
  }

  // Security and Settings
  adminUsername = '';
  adminOldPass = '';
  adminNewPass = '';

  cashierUsername = '';
  cashierNewPass = '';

  updateAdminPassword(): void {
    if (!this.token) return;
    if (!this.adminOldPass) {
      this.toast('الرجاء إدخال كلمة المرور الحالية', 'er');
      return;
    }
    this.apiService.updateAdminCredentials(this.token, this.adminOldPass, this.adminUsername, this.adminNewPass).subscribe({
      next: (res) => {
        this.toast('تم تحديث بيانات الأدمن بنجاح', 'ok');
        this.adminOldPass = '';
        this.adminNewPass = '';
        if (this.adminUsername && this.adminUsername.trim() !== '') {
           this.toast('تم تغيير بيانات الدخول، يرجى تسجيل الدخول مجدداً', 'wn');
           setTimeout(() => this.logoutRequested.emit(), 2000);
        }
      },
      error: (err) => {
        this.toast(err.error?.error || 'خطأ في التحديث', 'er');
      }
    });
  }

  resetCashierPassword(): void {
    if (!this.token) return;
    if (!this.cashierNewPass && !this.cashierUsername) {
      this.toast('الرجاء إدخال بيانات جديدة للكاشير', 'er');
      return;
    }
    this.apiService.updateCashierCredentials(this.token, this.cashierUsername, this.cashierNewPass).subscribe({
      next: (res) => {
        this.toast('تم تحديث بيانات الكاشير بنجاح', 'ok');
        this.cashierNewPass = '';
      },
      error: (err) => {
        this.toast(err.error?.error || 'خطأ في التحديث', 'er');
      }
    });
  }


  copyInviteLink(token?: string): void {
    if (!token) {
      this.toast('لا يوجد رابط دعوة لهذا العميل', 'wn');
      return;
    }
    const link = `${window.location.origin}/car_wash/api/about?inviteToken=${token}`;
    navigator.clipboard.writeText(link).then(() => {
      this.toast('تم نسخ الرابط 📋', 'ok');
    });
  }

  // Legal Consent
  legalConsent = false;

  esc(str: string): string {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str || ''));
    return d.innerHTML;
  }
}







