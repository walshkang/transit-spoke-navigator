import { } from 'googlemaps';

declare global {
  interface Window {
    google: typeof google;
  }
}

export {};