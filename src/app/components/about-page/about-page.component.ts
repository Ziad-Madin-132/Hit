import { Component, Input, OnInit, AfterViewInit, OnDestroy, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ServiceItem, OfferItem, Settings } from '../../models';
import { ApiService } from '../../api.service';

declare var lucide: any;

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css'
})
export class AboutPageComponent implements OnInit, AfterViewInit, OnDestroy {
  services: ServiceItem[] = [];
  offers: OfferItem[] = [];
  settings: Settings | null = null;
  safeMapUrl: SafeResourceUrl | null = null;

  isMobileMenuOpen = false;
  inviteToken: string | null = null;
  private scrollListener!: () => void;

  constructor(private renderer: Renderer2, private el: ElementRef, private apiService: ApiService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('inviteToken')) {
      this.inviteToken = params.get('inviteToken');
    }
    
    this.apiService.getSettings('').subscribe({
      next: (s) => {
        this.settings = s;
        if (s.mapUrl) {
          this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(s.mapUrl);
        }
      },
      error: (err) => console.error('Failed to fetch settings', err)
    });

    this.apiService.getPublicOffers().subscribe({
      next: (res) => {
        this.offers = res;
      },
      error: (err) => console.error('Failed to fetch offers', err)
    });

    this.apiService.getServices().subscribe({
      next: (res) => {
        this.services = res;
      },
      error: (err) => console.error('Failed to fetch services', err)
    });
  }

  ngAfterViewInit() {

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    } else {
      // Retry in case script is still loading
      setTimeout(() => {
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }, 500);
    }

    const navbar = this.el.nativeElement.querySelector('#navbar');
    this.scrollListener = this.renderer.listen('window', 'scroll', () => {
      if (window.scrollY > 50) {
        if (navbar) {
          this.renderer.setStyle(navbar, 'background', 'rgba(92, 15, 28, 0.95)');
          this.renderer.setStyle(navbar, 'backdrop-filter', 'blur(20px)');
          this.renderer.setStyle(navbar, 'border-bottom', '1px solid rgba(255,255,255,0.05)');
        }
      } else {
        if (navbar) {
          this.renderer.setStyle(navbar, 'background', 'transparent');
          this.renderer.setStyle(navbar, 'backdrop-filter', 'none');
          this.renderer.setStyle(navbar, 'border-bottom', 'none');
        }
      }
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.renderer.setStyle(entry.target, 'opacity', '1');
          this.renderer.setStyle(entry.target, 'transform', 'translateY(0)');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const revealElements = this.el.nativeElement.querySelectorAll('.reveal-element');
    revealElements.forEach((el: any, i: number) => {
      this.renderer.setStyle(el, 'opacity', '0');
      this.renderer.setStyle(el, 'transform', 'translateY(30px)');
      this.renderer.setStyle(el, 'transition', `all 0.7s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.1}s`);
      revealObserver.observe(el);
    });
  }

  ngOnDestroy() {
    if (this.scrollListener) {
      this.scrollListener();
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobile() {
    this.isMobileMenuOpen = false;
  }

  scrollTo(event: Event, targetId: string) {
    event.preventDefault();
    const target = this.el.nativeElement.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    this.closeMobile();
  }
}
