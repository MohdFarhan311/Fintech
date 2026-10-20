// Create a database-scoped user for the application during first-time setup.
// Keep the root account for database administration only.
const appDatabase = db.getSiblingDB('flextenure');

appDatabase.createUser({
  user: process.env.MONGO_APP_USERNAME,
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [{ role: 'readWrite', db: 'flextenure' }],
});
