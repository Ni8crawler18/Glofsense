declare module './firebase' {
  import { FirebaseApp } from 'firebase/app';
  import { Analytics } from 'firebase/analytics';
  import { Database } from 'firebase/database';

  const app: FirebaseApp;
  const database: Database;
  const analytics: Analytics;

  export { app, database, analytics };
}
