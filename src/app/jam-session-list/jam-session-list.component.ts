import {Component, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import {JamSessionService} from '../services/jam-session.service';
import {JamSessionType} from '../model/jamSession.type';
import {DatePipe, NgIf} from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelect, MatOption} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {Router} from '@angular/router';
import * as Leaflet from 'leaflet';
import {MatCard, MatCardContent} from '@angular/material/card';

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
  jamSessions: JamSessionType[] = [];
  map?: Leaflet.Map;
  markers: Leaflet.Layer[] = [];
  private mapReady: boolean = false;

  // Filter selections
  selectedGenre: string | null = null;
  selectedInstrument: string | null = null;

  // Option lists
  genresOptions: string[] = [];
  instrumentOptions: string[] = [];

  constructor(private jamSessionService: JamSessionService, private router: Router
  ) {

  }

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

  private initMap() {
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

  private loadJamSessions() {
    this.jamSessionService.getAllJamSessions().subscribe({
      next: (jamSessions: JamSessionType[]) => {
        this.jamSessions = jamSessions.slice(0, 20);
        this.buildFilterOptions();
        this.renderMarkers();
      }
    });
  }

  private renderMarkers() {
    if (!this.map || !this.mapReady) return;
    this.markers.forEach(layer => this.map?.removeLayer(layer));
    this.markers = [];
    this.jamSessions.forEach(js => {
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

  private fitToMarkers() {
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

  onFilterChanged() {
    this.renderMarkers();
  }

  clearGenre() { this.selectedGenre = null; this.onFilterChanged(); }
  clearInstrument() { this.selectedInstrument = null; this.onFilterChanged(); }
  clearAllFilters() { this.selectedGenre = this.selectedInstrument = null; this.onFilterChanged(); }

  navigateToPage(id: number) {
    this.router.navigate([`/jam-session-page/${id}`]);
  }

  private safeFitBounds(bounds: Leaflet.LatLngBounds) {
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

  private buildFilterOptions() {
    const genres = new Set<string>();
    const instruments = new Set<string>();
    this.jamSessions.forEach(js => {
      if (js.musicGenre?.name) genres.add(js.musicGenre.name);
      js.requiredInstruments?.forEach(i => instruments.add(i.name));
      js.confirmedInstruments?.forEach(i => { if(i.instrumentName) instruments.add(i.instrumentName); });
    });
    this.genresOptions = Array.from(genres).sort();
    this.instrumentOptions = Array.from(instruments).sort();
  }

  private matchesFilters(js: JamSessionType): boolean {
    if (this.selectedGenre && js.musicGenre?.name !== this.selectedGenre) return false;
    if (this.selectedInstrument) {
      const inRequired = js.requiredInstruments?.some(i => i.name === this.selectedInstrument);
      const inConfirmed = js.confirmedInstruments?.some(i => i.name === this.selectedInstrument);
      if (!inRequired && !inConfirmed) return false;
    }
    return true;
  }

}
