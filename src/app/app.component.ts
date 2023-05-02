import { Component, Input } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { FeatureCollection } from 'geojson';
import { MapComponent } from 'ngx-mapbox-gl';

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
  mapLoading: boolean = true;



  markers: Array<{ latitude: number; longitude: number; type?: string }> = [];

  getClusterRadius(zoom: number) {
    return Math.min(
      Math.max(
        50 / Math.pow(2, zoom - 9),
        5
      ),
      50
    );
  }
  
  


  onMapLoad(map: mapboxgl.Map) {
    this.mapLoading = false;
    map.loadImage(
      './assets/Icon.png',
      (error, image) => {
        if (error) {
          console.error('Error loading custom marker image:', error);
          return;
        }
        if (image) {
          map.addImage('custom-marker', image as HTMLImageElement | ImageBitmap);
        } else {
          console.error('Image is undefined.');
        }
      }
    );
  }
  

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

  async fetchLocationInfo(latitude: number, longitude: number): Promise<string> {
    const geocodingAPIURL = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibGFzaHZhcmRpIiwiYSI6ImNsZmd6MzgzbzFibjYzdG56Y2JvbDVscGcifQ.U3o0WZs8iM9EhWIJ1XoBzQ`;

    try {
      const response = await fetch(geocodingAPIURL);
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        console.log(data)
        return data.features[0].text;
      } else {
        console.error('No location information found');
        return 'Unknown Location';
      }
    } catch (error) {
      console.error('Error fetching location information:', error);
      return 'Error Fetching Location';
    }
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

  markersGeoJSON: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };
  async onMarkerClick(marker: { latitude: number; longitude: number }, event: any) {
    if (this.userLocation) {
      const markerCoords = event.lngLat;

      const distanceInMeters = this.userLocation.distanceTo(markerCoords);
      const distanceInKilometers = distanceInMeters / 1000;
      console.log(`დისტანცია: ${distanceInKilometers.toFixed(2)} კილომეტრი`);
      const randomCacheBuster = Math.floor(Math.random() * 100000);
      this.infoBoxImageSrc = `https://source.unsplash.com/random/200x100?Taxi&${randomCacheBuster}`;
      this.infoBoxHeader = await this.fetchLocationInfo(marker.latitude, marker.longitude);
      this.infoBoxDistance = `დისტანცია: ${distanceInKilometers.toFixed(
        2
      )} კილომეტრი`;

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

  convertToGeoJSON(markers: Array<{ latitude: number; longitude: number; icon: string; type?: string }>): any {
    const features = markers.map(marker => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [marker.longitude, marker.latitude], // include coordinates property
      },
      properties: {
        icon: marker.icon,
      },
    }));

    return {
      type: 'FeatureCollection',
      features: features,
    };
  }
  generateNearbyMarkers(
    count: number,
    range: number
  ): Array<{ latitude: number; longitude: number; type?: string }> {
    const locations = [
      [41.75055219714324, 44.78023479204452],
      [41.6865265867009, 44.85223384228217],
      [41.688759215492254, 44.840749507126716],
      [41.68252794730424, 44.831863115564175],
      [41.79514546293498, 44.82234117479674],
    ];

    const markers = [];

    for (let i = 0; i < count; i++) {
      const randomLocationIndex = Math.floor(Math.random() * locations.length);
      const [latitude, longitude] = locations[randomLocationIndex];

      const randomLat = latitude + (Math.random() * 2 - 1) * range;
      const randomLng = longitude + (Math.random() * 2 - 1) * range;

      markers.push({ latitude: randomLat, longitude: randomLng });

      this.markersGeoJSON.features.push({
        type: 'Feature',
        properties: { markerType: 'location' },
        geometry: {
          type: 'Point',
          coordinates: [randomLng, randomLat],
        },
      });

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
        this.markers = this.generateNearbyMarkers(30, 0.001);

        this.addLocationMarkers();

        if (callback) {
          callback();
        }
      },
      (error) => {
        console.error('Error getting user location:', error);
      }
    );
  }

  addLocationMarkers() {
    const locations = [
      [41.75055219714324, 44.78023479204452],
      [41.6865265867009, 44.85223384228217],
      [41.688759215492254, 44.840749507126716],
      [41.68252794730424, 44.831863115564175],
      [41.79514546293498, 44.82234117479674],
    ];

    for (const [latitude, longitude] of locations) {
      this.markersGeoJSON.features.push({
        type: 'Feature',
        properties: { markerType: 'location' },
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      });
    }
  }

  async onLayerMarkerClick(event: any) {
    const coordinates = event.lngLat;
    const marker = { latitude: coordinates.lat, longitude: coordinates.lng };

    if (this.userLocation) {
      const markerCoords = event.lngLat;

      const distanceInMeters = this.userLocation.distanceTo(markerCoords);
      const distanceInKilometers = distanceInMeters / 1000;
      console.log(`დისტანცია: ${distanceInKilometers.toFixed(2)} კილომეტრი`);

      const randomCacheBuster = Math.floor(Math.random() * 100000);
      this.infoBoxImageSrc = `https://source.unsplash.com/random/200x100?Taxi&${randomCacheBuster}`;
      this.infoBoxHeader = await this.fetchLocationInfo(marker.latitude, marker.longitude);
      this.infoBoxDistance = `დისტანცია: ${distanceInKilometers.toFixed(
        2
      )} კილომეტრი`;

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

  ngOnInit() {
    this.getUserLocation();
  }
}
