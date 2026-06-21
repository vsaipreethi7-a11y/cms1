# CMS Nexus Deployment Guide

This guide will walk you through deploying CMS Nexus to **Vercel** with a cloud-hosted **MySQL** database.

---

## 1. Setup a Cloud MySQL Database

Since Vercel is serverless, your local MySQL database (`localhost`) won't be accessible. You need to provision a cloud database.

### Option A: Aiven (Recommended - Free Tier available)
1. Go to [Aiven](https://aiven.io/) and sign up.
2. Create a new **MySQL** service.
3. Choose the free tier plan and click **Create Service**.
4. Once the service is running, copy the **URI** connection string. It will look like:
   `mysql://avnadmin:password@host:port/defaultdb?ssl-mode=REQUIRED`

### Option B: TiDB Cloud (Serverless MySQL)
1. Sign up on [TiDB Cloud](https://pingcap.com/products/tidb-cloud).
2. Create a free **Serverless** cluster.
3. Once active, click **Connect**, choose **General Connection**, and retrieve your connection string.

---

## 2. Initialize the Database Schema

Import the tables needed for the application:
1. Connect to your new cloud database using a MySQL client (e.g., DBeaver, TablePlus, or command line).
2. Open and run the SQL queries inside the [schema.sql](file:///d:/CMS%20P/sql/schema.sql) file.
   * This creates the required tables: `cms_connections`, `cms_content_items`, `assignments`, and `ai_agent_reports`.

---

## 3. Deploy to Vercel

### Option A: Via GitHub Integration (Recommended)
1. Commit and push your local codebase to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Prepare for Vercel deployment"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Go to [Vercel](https://vercel.com/) and log in.
3. Click **Add New** > **Project**.
4. Import your GitHub repository.
5. In the **Environment Variables** section, add the following:
   * **`DATABASE_URL`**: Your cloud MySQL connection string (e.g. `mysql://avnadmin:password@host:port/defaultdb?ssl-mode=REQUIRED`).
   * **`GROQ_API_KEY`**: Your Groq API key (`gsk_...`).
6. Click **Deploy**.

### Option B: Via Vercel CLI
1. Open your terminal in the project directory and install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Link your project to Vercel:
   ```bash
   vercel
   ```
3. Set the environment variables in Vercel:
   ```bash
   vercel env add DATABASE_URL
   vercel env add GROQ_API_KEY
   ```
4. Deploy to production:
   ```bash
   vercel --prod
   ```
