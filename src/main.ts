import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { migrateLocalStorage } from './app/shared/data/data-version';

// Clear stale persisted state from older data versions before any service reads it.
migrateLocalStorage();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
