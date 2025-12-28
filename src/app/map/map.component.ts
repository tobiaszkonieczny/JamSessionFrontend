import {AfterViewInit, Component, EventEmitter, Input, Output, OnDestroy} from '@angular/core';
import * as Leaflet from 'leaflet'

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements AfterViewInit, OnDestroy {
    map: Leaflet.Map | undefined
    centroid: Leaflet.LatLngExpression = [50.292262, 18.667510]
    lastMarker: Leaflet.Marker | undefined;
    @Output() coordinatesSelected = new EventEmitter<{ lat: number, lng: number }>();
    @Input() givenCoordinates: Leaflet.LatLngExpression|undefined
  @Input() height: number = 400;
  private resizeObserver?: ResizeObserver;

   myCustomIcon = Leaflet.icon({
    iconUrl: '/marker-icon.svg',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  initMap(){
      this.map = Leaflet.map('map', {
        center: this.givenCoordinates ? this.givenCoordinates : { lat: 50.292262, lng: 18.667510 },
        zoom: 12
      });
    const tiles = Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom: 18,
      minZoom: 2,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    })
    tiles.addTo(this.map)
    this.map.on('click', (e: Leaflet.LeafletMouseEvent) => {
      const coord = e.latlng;
      const lat = coord.lat;
      const lng = coord.lng;

      console.log(`You clicked the map at latitude: ${lat} and longitude: ${lng}`);

      if (this.lastMarker) {
        this.lastMarker.remove();
      }
      this.lastMarker = Leaflet.marker([lat, lng], {icon: this.myCustomIcon}).addTo(this.map!);
      this.coordinatesSelected.emit({ lat, lng });
    });


  }

  ngOnChanges() {
    if (this.map && this.givenCoordinates) {
      this.map.setView(this.givenCoordinates, 12);
      if (this.lastMarker) {
        this.lastMarker.remove();
      }
      this.lastMarker = Leaflet.marker(this.givenCoordinates, {icon: this.myCustomIcon}).addTo(this.map);
    }
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 0);
  }

  ngOnInit(){ }

  ngAfterViewInit(){
    this.initMap();
    if (this.map && this.givenCoordinates) {
      this.map.setView(this.givenCoordinates, 12);
      if (this.lastMarker) {
        this.lastMarker.remove();
      }
      this.lastMarker = Leaflet.marker(this.givenCoordinates, {icon: this.myCustomIcon}).addTo(this.map);
    }
    setTimeout(() => this.map?.invalidateSize(), 50);
    // Observe container size changes to keep map fully rendered
    const mapEl = document.getElementById('map');
    if (mapEl) {
      this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
      this.resizeObserver.observe(mapEl);
    }
  }

  forceResize(){
    this.map?.invalidateSize();
  }

  ngOnDestroy(){
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

}

