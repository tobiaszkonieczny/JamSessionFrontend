import {Component, OnInit, OnDestroy, AfterViewInit, inject, signal} from '@angular/core';
import {JamSessionType} from '../model/jamSession.type';
import {DatePipe, NgIf} from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelect, MatOption} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {Router} from '@angular/router';
import * as Leaflet from 'leaflet';
import {MatCard, MatCardContent} from '@angular/material/card';
import { JamSessionDomainService } from '../services/jam-session-domain.service';

@Component({
  selector: 'app-jam-session-list',
  imports: [
    MatFormFieldModule,
    MatSelect,
    MatOption,
    MatButtonModule,
    MatIcon,
    MatCard,
    MatCardContent,
    NgIf
  ],
  templateUrl: './jam-session-list.component.html',
  styleUrl: './jam-session-list.component.css'
})
export class JamSessionListComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly jamSessionDomain = inject(JamSessionDomainService);
  private readonly router = inject(Router);

  jamSessions = signal<JamSessionType[]>([]);
  map?: Leaflet.Map;
  markers: Leaflet.Layer[] = [];
  private mapReady = false;

  selectedGenre = signal<string | null>(null);
  selectedInstrument = signal<string | null>(null);
  
  genresOptions = signal<string[]>([]);
  instrumentOptions = signal<string[]>([]);

  readonly isLoading = this.jamSessionDomain.isLoadingAllJamSessions;

  ngOnInit(): void {
    (window as any).angularNavigateToJam = (id: number) => this.navigateToPage(id);
  }

  ngAfterViewInit(): void {
    this.initMap();
    setTimeout(() => this.map?.invalidateSize(), 50);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    if (this.map) return;
    this.map = Leaflet.map('jamSessionsMap', {
      center: [50.292262, 18.667510],
      zoom: 6,
      minZoom: 3,
      maxZoom: 18
    });
    Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    this.map.whenReady(() => {
      this.mapReady = true;
      this.map?.invalidateSize();
      this.loadJamSessions();
    });
    window.addEventListener('load', () => {
      setTimeout(() => this.map?.invalidateSize(), 0);
    });
  }

  private loadJamSessions(): void {
    this.jamSessionDomain.getAllJamSessions().subscribe({
      next: (jamSessions) => {
        this.jamSessions.set(jamSessions.slice(0, 20));
        this.buildFilterOptions();
        this.renderMarkers();
      }
    });
  }

  private renderMarkers(): void {
    if (!this.map || !this.mapReady) return;
    this.markers.forEach(layer => this.map?.removeLayer(layer));
    this.markers = [];
    this.jamSessions().forEach(js => {
      const lat = js.location.latitude;
      const lng = js.location.longitude;
      const highlight = this.matchesFilters(js);
      const marker = Leaflet.circleMarker([lat, lng], {
        radius: highlight ? 10 : 7,
        color: highlight ? '#6366f1' : '#9ca3af',
        weight: highlight ? 3 : 1.5,
        fillColor: highlight ? '#6366f1' : '#ffffff',
        fillOpacity: highlight ? 0.9 : 0.4
      });
      const startTime = js.startTime;
      marker.bindPopup(this.buildPopupHtml(js, startTime));
      marker.addTo(this.map!);
      this.markers.push(marker);
    });
    this.fitToMarkers();
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  private fitToMarkers(): void {
    if (!this.map || this.markers.length === 0) return;
    const group = Leaflet.featureGroup(this.markers as Leaflet.Marker[]);
    const bounds = group.getBounds();
    if (!bounds.isValid()) return;
    this.safeFitBounds(bounds);
  }

  private buildPopupHtml(js: JamSessionType, startTime: string): string {
    const datePipe = new DatePipe('en-US');
    const formatted = datePipe.transform(startTime, 'dd-MM-yyyy HH:mm');
    return `
      <div class="popup-content">
        <strong>${js.owner.name}</strong><br/>
        Genre: ${js.musicGenre.name}<br/>
        Start: ${formatted}<br/>
        <button class="popup-btn" onclick="window.angularNavigateToJam(${js.id})">Open</button>
      </div>
    `;
  }

  onFilterChanged(): void {
    this.renderMarkers();
  }

  clearGenre(): void {
    this.selectedGenre.set(null);
    this.onFilterChanged();
  }

  clearInstrument(): void {
    this.selectedInstrument.set(null);
    this.onFilterChanged();
  }

  clearAllFilters(): void {
    this.selectedGenre.set(null);
    this.selectedInstrument.set(null);
    this.onFilterChanged();
  }

  navigateToPage(id: number): void {
    this.router.navigate([`/jam-session-page/${id}`]);
  }

  private safeFitBounds(bounds: Leaflet.LatLngBounds): void {
    if (!this.map) return;
    const size = this.map.getSize();
    if (size.x < 100 || size.y < 100) {
      setTimeout(() => this.safeFitBounds(bounds), 100);
      return;
    }
    const padded = bounds.pad(0.2);
    const targetZoom = this.map.getBoundsZoom(padded);
    const finalZoom = Math.max(targetZoom, 3);
    const center = padded.getCenter();
    this.map.setView(center, finalZoom, { animate: false });
  }

  private buildFilterOptions(): void {
    const genres = new Set<string>();
    const instruments = new Set<string>();
    this.jamSessions().forEach(js => {
      if (js.musicGenre?.name) genres.add(js.musicGenre.name);
      js.requiredInstruments?.forEach(i => instruments.add(i.name));
      js.confirmedInstruments?.forEach(i => { if(i.instrumentName) instruments.add(i.instrumentName); });
    });
    this.genresOptions.set(Array.from(genres).sort());
    this.instrumentOptions.set(Array.from(instruments).sort());
  }

  private matchesFilters(js: JamSessionType): boolean {
    if (this.selectedGenre() && js.musicGenre?.name !== this.selectedGenre()) return false;
    if (this.selectedInstrument()) {
      const inRequired = js.requiredInstruments?.some(i => i.name === this.selectedInstrument());
      const inConfirmed = js.confirmedInstruments?.some(i => i.name === this.selectedInstrument());
      if (!inRequired && !inConfirmed) return false;
    }
    return true;
  }
}
