// Keep the app account aligned with the current Compose environment on every
// startup, including when /data/db already contains an older initialization.
const appDatabase = db.getSiblingDB('flextenure');
const username = process.env.MONGO_APP_USERNAME;
const password = process.env.MONGO_APP_PASSWORD;

if (!username || !password) {
  throw new Error('MONGO_APP_USERNAME and MONGO_APP_PASSWORD are required');
}

if (appDatabase.getUser(username)) {
  appDatabase.updateUser(username, {
    pwd: password,
    roles: [{ role: 'readWrite', db: 'flextenure' }],
  });
} else {
  appDatabase.createUser({
    user: username,
    pwd: password,
    roles: [{ role: 'readWrite', db: 'flextenure' }],
  });
}
