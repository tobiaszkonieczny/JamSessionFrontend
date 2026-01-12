import { Component, Input, signal, effect, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { ImageService } from '../services/image.service';

@Component({
  selector: 'app-lazy-image',
  standalone: true,
  imports: [NgStyle],
  template: `
    <div class="lazy-image-container" [ngStyle]="containerStyle()">
      @if (isLoading()) {
        <div class="image-skeleton">
          <div class="skeleton-shimmer"></div>
        </div>
      }
      @if (imageDataUrl() && !hasError()) {
        <img 
          [src]="imageDataUrl()" 
          [alt]="alt()"
          [class]="imageClass()"
          (load)="onImageLoad()"
          (error)="onImageError()"
          [style.display]="isLoading() ? 'none' : 'block'"
        />
      }
    </div>
  `,
  styles: [`
    .lazy-image-container {
      position: relative;
      overflow: hidden;
      background-color: #f0f0f0;
      max-height: unset !important;
    }

    .image-skeleton {
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.3s ease;
    }
  `]
})
export class LazyImageComponent {
  private imageService = inject(ImageService);

  // Inputs
  imageId = signal<string | number | null>(null);
  alt = signal<string>('Image');
  imageClass = signal<string>('');
  containerStyle = signal<any>({});

  // State
  imageDataUrl = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);

  @Input() set src(value: string | number | null | undefined) {
    this.imageId.set(value || null);
  }

  @Input() set altText(value: string) {
    this.alt.set(value);
  }

  @Input() set cssClass(value: string) {
    this.imageClass.set(value);
  }

  @Input() set style(value: any) {
    this.containerStyle.set(value);
  }

  constructor() {
    // React to imageId changes
    effect(() => {
      const id = this.imageId();
      if (id) {
        this.loadImage(id);
      } else {
        this.imageDataUrl.set(null);
        this.isLoading.set(false);
      }
    });
  }

  private loadImage(imageId: string | number): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.imageService.getImageAsDataUrl(imageId).subscribe({
      next: (dataUrl) => {
        this.imageDataUrl.set(dataUrl);
      },
      error: (err) => {
        console.error('Error loading image:', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  onImageLoad(): void {
    this.isLoading.set(false);
  }

  onImageError(): void {
    this.hasError.set(true);
    this.isLoading.set(false);
  }
}
