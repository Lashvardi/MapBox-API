import { Component, Input } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'busbookMap';
  infoBoxImageSrc: string | null = null;
  infoBoxHeader: string | null = null;
  infoBoxDistance: string | null = null;

  isValidCoordinate(coord: any): boolean {
    if (!Array.isArray(coord) || coord.length !== 2) {
      return false;
    }

    const [longitude, latitude] = coord;
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  async getDirections(
    origin: mapboxgl.LngLatLike,
    destination: mapboxgl.LngLatLike
  ) {
    const originCoords =
      origin instanceof mapboxgl.LngLat
        ? [origin.lng, origin.lat]
        : (origin as [number, number]);
    const destinationCoords =
      destination instanceof mapboxgl.LngLat
        ? [destination.lng, destination.lat]
        : (destination as [number, number]);

    if (
      !this.isValidCoordinate(originCoords) ||
      !this.isValidCoordinate(destinationCoords)
    ) {
      console.error('Invalid origin or destination coordinates:', {
        origin: originCoords,
        destination: destinationCoords,
      });
      return;
    }

    const directionsAPIURL = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords[0]},${originCoords[1]};${destinationCoords[0]},${destinationCoords[1]}?access_token=pk.eyJ1IjoibGFzaHZhcmRpIiwiYSI6ImNsZmd6MzgzbzFibjYzdG56Y2JvbDVscGcifQ.U3o0WZs8iM9EhWIJ1XoBzQ&geometries=geojson`;

    try {
      const response = await fetch(directionsAPIURL);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];

        this.routeGeoJSON = {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: route.geometry,
                properties: {},
              },
            ],
          },
        };
      } else {
        console.error('No routes found');
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
    }
  }

  markers: Array<{ latitude: number; longitude: number }> = [];
  onMarkerClick(marker: { latitude: number; longitude: number }) {
    if (this.userLocation) {
      const markerCoords = new mapboxgl.LngLat(
        marker.longitude,
        marker.latitude
      );
      const distanceInMeters = this.userLocation.distanceTo(markerCoords);
      const distanceInKilometers = distanceInMeters / 1000;
      console.log(`დისტანცია: ${distanceInKilometers.toFixed(2)} კილომეტრი`);
      const randomCacheBuster = Math.floor(Math.random() * 100000);
      this.infoBoxImageSrc = `https://source.unsplash.com/random/200x100?Taxi&${randomCacheBuster}`;
      this.infoBoxHeader = 'სატესტო ტექსტი';
      this.infoBoxDistance = `დისტანცია: ${distanceInKilometers.toFixed(2)} კილომეტრი`;


      this.getDirections(this.userLocation, [
        marker.longitude,
        marker.latitude,
      ]);
    } else {
      console.warn('User location not available');
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        this.userLocation = new mapboxgl.LngLat(userCoords[0], userCoords[1]);
        this.getDirections(userCoords, [marker.longitude, marker.latitude]);
      },
      (error) => {
        console.error('Error getting user location:', error);
      }
    );
  }
  generateNearbyMarkers(
    latitude: number,
    longitude: number,
    count: number,
    range: number
  ) {
    const markers = [];

    for (let i = 0; i < count; i++) {
      const randomLat = latitude + (Math.random() * 2 - 1) * range;
      const randomLng = longitude + (Math.random() * 2 - 1) * range;

      markers.push({ latitude: randomLat, longitude: randomLng });
    }

    return markers;
  }

  routeGeoJSON: mapboxgl.GeoJSONSourceRaw | null = null;
  userLocation: mapboxgl.LngLat | null = null;

  getUserLocation(callback?: () => void) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        this.userLocation = new mapboxgl.LngLat(userCoords[0], userCoords[1]);

        // Generate markers near the user's location
        this.markers = this.generateNearbyMarkers(
          userCoords[1],
          userCoords[0],
          100,
          0.1
        );

        if (callback) {
          callback();
        }
      },
      (error) => {
        console.error('Error getting user location:', error);
      }
    );
  }

  ngOnInit() {
    this.getUserLocation();
  }
}
