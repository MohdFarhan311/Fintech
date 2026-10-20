# FlexTenure

> **Demo and testing only.** This project is made only for demonstration and testing purposes. It does not process real payments or transfer money.

FlexTenure is a React and Express application for merchant onboarding, customer accounts, and purchase plan records. It is an early-stage product prototype: it does not collect payments, create card mandates, verify credit, or settle funds.

## Repository layout

```text
backend/
  middleware/   JWT authentication and role checks
  models/       User, Merchant, Transaction, Pilot (Mongoose)
  routes/       Authentication, merchant/customer dashboards, plans, enquiries
  server.js     Express API and production frontend hosting
frontend/
  public/       HTML shell
  src/
    components/ Shared UI
    context/    Authentication state
    pages/      Public pages and customer/merchant workspaces
    App.js      Client-side routes
package.json    Root development scripts
```

This is one Express API application with route modules, plus one React frontend. The route modules are not separate microservices.

## Requirements

- Node.js 18 or newer
- MongoDB (local instance or MongoDB Atlas)

## Run locally

1. Install packages from the repository root: `npm install`, then `npm run install:all`.
2. Copy `backend/.env.example` to `backend/.env` and set a private, randomly generated `JWT_SECRET` and a valid `MONGO_URI`.
3. Run `npm run dev` from the repository root. The React app is served at `http://localhost:3000`; the API is at `http://localhost:5000`.

The API can start when MongoDB is unavailable so its health endpoint remains reachable, but database-backed registration, login, and dashboards will not work until MongoDB connects. Check `GET /api/health`; it returns HTTP 200 when connected and HTTP 503 when the database is unavailable.

## Current functionality

- Customer and merchant registration and login with JWT authentication.
- Merchant business profile management and plan record creation for an existing customer account.
- Merchant and customer dashboards showing stored plan information.
- Public merchant enquiry form.
- Role-protected API routes and dashboard pages.

Plan records support an explicitly simulated payment flow. Customers can record demo success or failure attempts; successful simulations update balances, while failed simulations do not. These records are for demonstration only and are not proof of a charge, repayment, approval, or settlement. The application never collects payment credentials or transfers money.

## Production build

Build the frontend with `npm run build`. Set the production environment variables for the backend, including `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL`, then start the backend with `npm start` from the repository root. When `frontend/build` exists, Express serves the React app and its client-side routes from the same origin as `/api`.

Deploy the repository as one backend service with the frontend build included, or deploy the frontend separately and set its API proxy/base URL accordingly. Configure HTTPS, production database access controls, backups, and secret management in the hosting provider before onboarding real users.

## Demo payment system

Eligible customer plans have a **Pay Now · Demo** action. The confirmation screen lets the customer simulate success or failure. Successful demo payments reduce the stored plan balance and advance its schedule; failures are recorded without changing the balance. Request keys and conditional single-document MongoDB updates prevent duplicate submissions from deducting twice. Receipts and merchant history are visibly marked as demo activity. No payment gateway, provider, external API, real payment details, or live money movement is used.

Run the backend checks with `npm test --prefix backend`.

## Fresh AWS EC2 Setup

This procedure rebuilds the app on a new Ubuntu 22.04 or 24.04 EC2 instance. The repository documents Node.js 18+ and its manifests do not define a stricter `engines` range; these commands install Node.js 22 LTS and npm. Install Git and `curl` too:

```bash
sudo apt-get update
sudo apt-get install -y git curl
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh | bash
```

Reconnect to SSH to load `nvm`, then:

```bash
nvm install 22
nvm use 22
node --version
npm --version
git --version
```

Install MongoDB Community 8.0. First import the MongoDB signing key:

```bash
sudo apt-get update
sudo apt-get install -y gnupg curl
curl -fsSL https://pgp.mongodb.com/server-8.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
```

For Ubuntu 24.04 (Noble), add this package source:

```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
```

For Ubuntu 22.04 (Jammy), use this source line instead:

```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
```

Then install and start MongoDB:

```bash
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl enable --now mongod
sudo systemctl status mongod --no-pager
```

These are the MongoDB 8.0 Ubuntu installation steps for the selected LTS releases ([official guide](https://www.mongodb.com/docs/v8.0/tutorial/install-mongodb-on-ubuntu/)). Leave MongoDB bound to localhost and never open inbound port 27017.

Clone the requested repository and install packages from the root and both app directories using the repository's scripts:

```bash
git clone https://github.com/MohdFarhan311/Fintech.git
cd Fintech
npm install
npm run install:all
```

The root install installs `concurrently`; `npm run install:all` runs `npm install` in `backend/` and `frontend/`. The root `build` script builds React, and the root `start` script starts the backend.

Create the backend environment file and restrict its permissions:

```bash
cp backend/.env.example backend/.env
chmod 600 backend/.env
```

Edit `backend/.env` locally on the instance. These are the actual variables read by the backend or present in its environment template:

| Name | Required setting/use |
| --- | --- |
| `PORT` | Express port; set to `5000` for the direct EC2 setup below (the server defaults to 5000). |
| `MONGO_URI` | Mongoose connection URI. For MongoDB running on this EC2 host, use `mongodb://127.0.0.1:27017/flextenure`. For a separate MongoDB service, use its private/secured URI and ensure its network rules allow this EC2 instance only. The URI database path should be `flextenure`. |
| `JWT_SECRET` | Signing key for authentication tokens, which expire after seven days. Generate it directly into `backend/.env` with the no-output command below. Do not print it, paste it into chat, commit it, or put it in shell history. Store a protected copy in an approved secrets manager for recovery. |
| `NODE_ENV` | Set to `production` so Express serves `frontend/build` when it exists. |
| `CLIENT_URL` | The exact browser origin permitted by CORS. For direct access use `http://<EC2-PUBLIC-DNS>:5000` (or the public IP with port 5000). For local development this is `http://localhost:3000`. |

Generate the secret directly into the ignored environment file without displaying it or putting the secret in shell history:

```bash
node -e 'const fs=require("fs"),crypto=require("crypto");const p="backend/.env";const s=fs.readFileSync(p,"utf8");fs.writeFileSync(p,s.replace(/^JWT_SECRET=.*$/m,"JWT_SECRET="+crypto.randomBytes(48).toString("base64")));'
```

This replaces the placeholder in `backend/.env`. Keep the file mode at `600`; never commit the real file.

For local MongoDB, start and enable the service, keeping its default local-only listener:

```bash
sudo systemctl enable --now mongod
sudo systemctl is-active mongod
mongosh "mongodb://127.0.0.1:27017/flextenure" --eval 'db.runCommand({ ping: 1 })'
```

The app creates the `flextenure` database and collections when it first writes records; there is no database initialization script. MongoDB must remain private: do not add port 27017 to the EC2 security group or bind MongoDB to a public interface. For a separately hosted database, use a provider URI in `MONGO_URI`, protect its credentials, and restrict its network access to the EC2 instance. If the URI contains reserved characters in the username or password, percent-encode them as required by the MongoDB connection URI format.

Build and start the production app from the repository root:

```bash
npm run build
npm start
```

Keep `npm start` running using an appropriate service/process manager for the instance. With `NODE_ENV=production`, Express serves the built frontend and API from the same origin on port 5000. Visit `http://<EC2-PUBLIC-DNS>:5000`. The frontend calls relative `/api/...` paths, so production needs no separate frontend API setting. Verify locally with `curl -i http://127.0.0.1:5000/api/health`; HTTP 200 with `"database":"connected"` means the database is connected. When MongoDB is down or unavailable, the server can still listen, but this endpoint returns HTTP 503 and database-backed functions will not work.

Configure the EC2 security group's inbound rules for the selected deployment:

- TCP 22 (SSH) from your own current public IP only.
- TCP 5000 from the client IPs that need the app. Restrict it to your own IP while evaluating if that is sufficient.
- Never allow inbound TCP 27017. If a reverse proxy and HTTPS are configured separately, expose only the proxy's required web ports and restrict port 5000 to that proxy.

For development, `npm run dev` starts the Express and React development processes; open `http://<EC2-PUBLIC-DNS>:3000` and allow TCP 3000 if accessing it remotely. The frontend's `package.json` proxy sends `/api` requests to `http://localhost:5000`. This proxy is for the React development server only; it does not apply to the production build. If the browser reports a proxy/network error, first check that the backend is listening on 5000 and that `GET /api/health` succeeds, then confirm the frontend proxy is still `http://localhost:5000`. If API calls work locally but fail remotely, check the security group, `CLIENT_URL` including scheme/port, and that the browser uses the same host/origin configured there. MongoDB connection errors usually mean `mongod` is stopped, `MONGO_URI` has the wrong host/database, or a hosted database does not allow this instance.

## MongoDB Backup and Restore

Cloning GitHub restores the source code only. It does **not** restore MongoDB data. The application database name, from `backend/.env.example`, is `flextenure`.

### Inspect the existing database

On the existing EC2 instance, check that MongoDB is running and inspect database/collection names and approximate record counts without changing data:

```bash
sudo systemctl is-active mongod
mongosh "mongodb://127.0.0.1:27017/flextenure" --quiet --eval 'db.getSiblingDB("flextenure").getCollectionNames().forEach(function (name) { print(name + ": " + db.getSiblingDB("flextenure").getCollection(name).countDocuments({})); })'
```

Save the output somewhere secure outside the instance so it can be compared after restoration. This prints collection names and counts only, not record contents.

### Back up and move the database off EC2

The MongoDB Database Tools provide `mongodump` and `mongorestore`. Check whether they are installed (`mongodump --version`); if not, install the package for this Ubuntu version using the [official Database Tools installation guide](https://www.mongodb.com/docs/database-tools/installation/). Create a compressed archive under the Ubuntu user's home directory:

```bash
umask 077
mongodump --uri="mongodb://127.0.0.1:27017/flextenure" --archive="$HOME/flextenure.archive.gz" --gzip
```

Store the archive outside EC2 before deleting or terminating the old instance. One option is a private S3 bucket with public access blocked and server-side encryption enabled. Use an EC2 IAM role or a local AWS profile with only the required bucket permissions; do not put AWS access keys in Git or a command-line argument. For a bucket configured with SSE-S3 encryption, upload with:

```bash
aws s3 cp "$HOME/flextenure.archive.gz" s3://<PRIVATE-BUCKET>/<PRIVATE-PREFIX>/flextenure.archive.gz --sse AES256
```

Do not use a public bucket or public ACL. Verify the object exists in the private bucket and retain its bucket/key, encryption key details (if using KMS), and access method securely. Keep a second protected backup if the data matters. Do not leave the only copy on the EC2 root volume.

### Restore on the new instance and verify

Install and start MongoDB on the new instance as above. Retrieve the archive from the private bucket (with the right IAM permissions) into a private location:

```bash
umask 077
aws s3 cp s3://<PRIVATE-BUCKET>/<PRIVATE-PREFIX>/flextenure.archive.gz "$HOME/flextenure.archive.gz"
```

On a **new, empty target database**, restore the `flextenure` namespace. This command does not use `--drop` and should not be run against data you intend to retain or merge:

```bash
mongorestore --uri="mongodb://127.0.0.1:27017/flextenure" --archive="$HOME/flextenure.archive.gz" --gzip --nsInclude='flextenure.*'
```

Run the same read-only collection count command from the inspection section against the new instance and compare each collection and count with the saved old-instance output. Also check the API health endpoint and sign in to verify that the application can read restored records. If the target already contains records, stop and resolve the migration plan before restoring; do not use destructive restore options casually.

### Preserve secrets and understand EC2 storage

Keep every real `.env` file, database dump, and database credential out of GitHub. `.gitignore` excludes `.env*` except `.env.example`; confirm with `git check-ignore backend/.env`. The committed `backend/.env.example` must contain only placeholders/default local configuration, never production secrets. Store the real `JWT_SECRET`, any hosted MongoDB credentials, and AWS/KMS recovery information in a password manager or cloud secrets manager with access limited to operators. During migration, configure the same values securely on the new host. Preserving the same `JWT_SECRET` lets existing signed tokens continue to verify until expiry; rotating it invalidates existing login tokens and users must sign in again. Never commit the real environment file.

Stopping an EBS-backed EC2 instance retains its attached EBS volumes and data. Terminating/deleting an instance deletes volumes whose `DeleteOnTermination` setting is enabled (the root volume is typically set to delete); instance-store data is lost when the instance terminates. Neither stopping nor retaining a volume is a backup. A database stored only on the old instance's local/root storage can be lost when the instance or volume is deleted. Verify an off-instance dump and a successful restore before deleting the old EC2 instance or its volumes. See AWS's [instance termination behavior](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/how-ec2-instance-termination-works.html).

## Security and Recovery Checklist

Complete these items before deleting the old EC2 instance:

- [ ] Updated README committed and pushed to the repository.
- [ ] `.gitignore` excludes `node_modules`, frontend build output, database dumps/exports, logs, and real environment files.
- [ ] `backend/.env.example` remains committed and contains placeholders/defaults only.
- [ ] A MongoDB backup exists outside EC2 in private, access-controlled storage.
- [ ] Required secrets and recovery credentials are stored securely outside GitHub.
- [ ] The restore procedure has been tested on a new instance, with collection counts compared.
- [ ] Frontend pages, backend health/API, authentication, customer and merchant dashboards, and simulated demo payments have been tested after restoration.
- [ ] Current AWS security group rules keep MongoDB port 27017 private and limit SSH access.
- [ ] The new instance's application and database remain available after a reboot, if required for the deployment.
