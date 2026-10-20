# Application Setup and Deployment

This guide installs and runs the application on a fresh Ubuntu 22.04 or 24.04 EC2 instance. Start after connecting to the instance over SSH. The procedure installs Git, Node.js, npm, MongoDB, and the application dependencies, then builds and launches the app with a new, empty database.

## Application overview

The website is a prototype for customer and merchant account workflows. Users can register, sign in, view dashboards, manage merchant profiles, and create and review purchase plan records. The payment flow lets users simulate successful or failed demo payments.

**For demonstration and testing only:** the website does not process real payments, collect payment credentials, verify credit, create card mandates, or transfer money. Demo records are not evidence of a real charge, repayment, or settlement.

## Before starting

In the EC2 security group, allow inbound TCP 22 from your current public IP. For direct browser access, also allow TCP 5000 from the IP addresses that need the app. Do not open TCP 27017; MongoDB will run locally on the instance.

You need the repository's HTTPS or SSH clone URL and the public DNS name (or public IP) of the EC2 instance.

## Step 1: Update Ubuntu and install basic tools

Run these commands after SSH login:

```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y git curl ca-certificates gnupg
```

## Step 2: Install Node.js and npm

Install Node.js 22 LTS with nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

Confirm the tools are available:

```bash
node --version
npm --version
git --version
```

## Step 3: Install a fresh MongoDB server

Import the MongoDB 8.0 package signing key and add the correct Ubuntu repository automatically:

```bash
curl -fsSL https://pgp.mongodb.com/server-8.0.asc | sudo gpg --dearmor --yes -o /usr/share/keyrings/mongodb-server-8.0.gpg
. /etc/os-release
case "$VERSION_CODENAME" in
  noble|jammy) echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu $VERSION_CODENAME/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list ;;
  *) echo "Unsupported Ubuntu release: $VERSION_CODENAME (use Ubuntu 22.04 or 24.04)"; exit 1 ;;
esac
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl enable --now mongod
sudo systemctl status mongod --no-pager
```

MongoDB is configured for local use. Do not expose port 27017 in the EC2 security group or bind MongoDB to a public interface.

## Step 4: Clone the repository

Replace the example URL with the repository clone URL and use the directory created by Git:

```bash
git clone https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

For a private repository, configure an authorized SSH deploy key or another secure Git authentication method before cloning. Do not put access tokens directly in the clone URL.

## Step 5: Install application packages

Run from the repository root:

```bash
npm install
npm run install:all
```

The first command installs the root development utility. The second installs the backend and frontend packages.

## Step 6: Configure the application environment

Create the backend environment file and restrict access to it:

```bash
cp backend/.env.example backend/.env
chmod 600 backend/.env
```

Set production values for `PORT`, `MONGO_URI`, `NODE_ENV`, and `CLIENT_URL`. Replace `YOUR_EC2_PUBLIC_DNS` with the instance's actual public DNS name (or use its public IP):

```bash
sed -i 's|^PORT=.*|PORT=5000|; s|^MONGO_URI=.*|MONGO_URI=mongodb://127.0.0.1:27017/applicationdb|; s|^NODE_ENV=.*|NODE_ENV=production|; s|^CLIENT_URL=.*|CLIENT_URL=http://YOUR_EC2_PUBLIC_DNS:5000|' backend/.env
```

Generate a private JWT signing key directly into the environment file. This command does not print the secret:

```bash
node -e 'const fs=require("fs"),crypto=require("crypto");const p="backend/.env";const s=fs.readFileSync(p,"utf8");fs.writeFileSync(p,s.replace(/^JWT_SECRET=.*$/m,"JWT_SECRET="+crypto.randomBytes(48).toString("base64")));'
chmod 600 backend/.env
```

Keep the real `backend/.env` private and out of source control. `CLIENT_URL` must exactly match the browser origin, including `http://` and `:5000` for this direct setup.

## Step 7: Check the new MongoDB instance

This is a fresh, empty database. No database download, import, restore, or seed step is needed. The database and collections are created when the app first writes data.

```bash
sudo systemctl is-active mongod
mongosh "mongodb://127.0.0.1:27017/applicationdb" --eval 'db.runCommand({ ping: 1 })'
```

The first command should print `active`; the ping should return `ok: 1`.

## Step 8: Build the frontend

From the repository root:

```bash
npm run build
```

The production frontend is written to `frontend/build`. The Express server serves it alongside the API.

## Step 9: Start the application

Start the production server from the repository root:

```bash
npm start
```

Keep this SSH session open while the command runs. The app listens on port 5000. In a browser, visit:

```text
http://YOUR_EC2_PUBLIC_DNS:5000
```

Replace the example host with the EC2 public DNS name or public IP. For a long-running production deployment, use a process manager or configure a systemd service so the app starts after reboot.

## Step 10: Verify the deployment

Open a second SSH session and check the API and MongoDB connection:

```bash
curl -i http://127.0.0.1:5000/api/health
```

A healthy response has HTTP 200 and includes `"database":"connected"`. HTTP 503 means the API cannot connect to MongoDB. Check that `mongod` is active and that `MONGO_URI` in `backend/.env` is `mongodb://127.0.0.1:27017/applicationdb`.

If the site does not load from your browser, confirm the EC2 security group permits TCP 5000 from your client address and that `CLIENT_URL` matches the browser URL. Never open TCP 27017 to the internet.

## Local development

To run the backend and React development server together instead of the production build, configure `CLIENT_URL=http://localhost:3000` and run:

```bash
npm run dev
```

Open `http://localhost:3000`. The React development server proxies API requests to `http://localhost:5000`.

## Project structure

```text
backend/     Express API, authentication, routes, and MongoDB models
frontend/    React user interface
package.json Root install, development, build, and start scripts
```

The app provides customer and merchant registration, authentication, dashboards, plan records, and a simulated demo payment flow. It does not connect to a payment provider or move money.
