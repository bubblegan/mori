<img width="1596" alt="Screenshot 2024-11-12 at 1 42 58 PM" src="https://github.com/user-attachments/assets/964b5154-ae4e-4216-a060-37e0a5eda965">

## Important

- This project is still in alpha, and there are constant changes happening.
- There may be bugs and breaking changes. Feedback is deeply appreciated.
- Please do not leak your OpenAI key or database string, as they contain sensitive information.

## Motivations

I started this open-source project because I found that most existing solutions, like those using SaltEdge, have limitations. For example, SaltEdge can only pull data from banks for a limited timeframe, making it hard to track expenses over longer periods.

I realized that leveraging AI to read and extract text from credit card PDF statements is a more efficient way to store and categorize expenses. By storing this data in a database, we can streamline the entire process. My goal is to create a self-hosted, local-first solution—much like Firefly or ActualBudget—where users have more control over their data.

## Features

The main feature to upload credit card PDFs or zip files containing credit card PDFs will work as follows:

[Video Demo](https://streamable.com/cjh94w)

- Additional features like tagging, adding notes, and full CRUD functionality for categories and statements.

- I will take some time to document everything, so stay tuned.

## Architecture

### Stack

- Next.js: For server-side rendering and frontend development.
- TurboRepo: To manage the monorepo for both frontend and backend.
- Hono.js + BullMQ: Hono handles the backend, with BullMQ managing background jobs.
- Prisma.js: Type-safe database ORM for managing relational data.
- pdf2pic + Tesseract OCR: Converts PDFs to images and runs OCR to extract text from images.
- TRPC: Provides a type-safe API between client and server.
- shadCN: For accessible and customizable UI components.

### Architecture Diagram

![architecture-map](https://github.com/user-attachments/assets/289fe6e6-17c8-4941-9cee-0cafcd84c225)

### Parsing workflow

1. **Background Job Processing**  
   PDF statements are sent to the background job server for processing.

1. **Parsing Workflow**

   - **Convert PDFs to Images**: The PDF files are converted into images.
   - **OCR (Optical Character Recognition)**: OCR is run on the images to extract text from the statement.
   - **OpenAI API**: The extracted text is sent to the OpenAI API, which returns parsed expenses, categorized according to custom rules.

1. **Frontend Options**  
   On the frontend, users can:
   - Store the parsed data in the database
   - Download it as a CSV file
   - Edit the data before taking any further action

## Database and OpenAI key

### Open AI Key

1. Visit the [OpenAI website](https://platform.openai.com/signup/) and sign up for an account. If you already have one, log in instead.

2. Once logged in, go to [Api Key Dashboard](https://platform.openai.com/api-keys)

3. Click the Create new secret key button.

4. Make sure to copy and securely store your API key, as you will not be able to view it again once you leave the page. You can always create another key if needed.

This [medium](https://medium.com/@lorenzozar/how-to-get-your-own-openai-api-key-f4d44e60c327) guide here should be quite useful.

Make sure you have sufficient credit in your OpenAI account for billing purposes. It costs approximately $0.03 USD per credit card statement. Detailed cost calculations will be provided here.

### Postgresql DB Connection

You can setup postgresql locally, but here is the guide on setting up in supabase

1. Create a Supabase Account

   - Go to the [Supabase website](https://supabase.com/) and sign up for an account.
   - If you already have an account, simply log in.

1. Create a New Project

   - After logging in, click the **New Project** button on your dashboard.
   - Enter your project details:
     - **Name**: Choose a unique name for your project.
     - **Organization**: Select your organization or create a new one if necessary.
     - **Database Password**: Create a secure password for your database. Keep this password safe since you'll need it to connect to your database later.
     - **Region**: Choose the closest server location to optimize performance.

   Once done, click **Create new project**.

1. Wait for the Database to be Set Up

   - It may take a few minutes for Supabase to set up your PostgreSQL database. Once ready, you’ll be taken to your project dashboard.

1. Retrieve Your Database Connection String

   - From your project dashboard, navigate to the **Settings** tab.
   - Under **Database**, you’ll see details for connecting to your database.
   - Look for **Connection String** or **Database URL**. It will look something like this:

   ```plaintext
   postgres://username:password@host:port/database
   ```

You will need this connection string to connect your application to the Supabase database.

5. Save Your Connection String
   - Make sure to copy and securely store the connection string. You will need it to set up the database in your app.

## Docker Setup

### Prerequisite

1. **Docker**
   - Install docker
   - Run Docker

### Installation

1. Clone the repo into a public GitHub repository.

   ```sh
   git clone https://github.com/bubblegan/self-hosted-expense-tracker.git
   ```

1. Go to the app folder

   ```sh
   cd self-hosted-expense-tracker
   ```

1. Run npm install

   ```sh
   npm install
   ```

1. Set up your `.env` file

   - Use `openssl rand -base64 32` to generate a key and add it under `NEXTAUTH_SECRET`.
   - Add Open AI key to `OPENAI_API_KEY`.
   - Add Postgresql database connection string to `DATABASE_URL`.

1. Run prisma migrate for the first time to migrate database.

   ```sh
    npx prisma migrate deploy --schema apps/web/prisma/schema.prisma
   ```

1. Run Docker Compose and build

   ```sh
   docker compose up --build
   ```

## Development Setup

### Prerequisite

1. NodeJs
1. Ghostscript and graphicsmagick
   - Both Ghostscript and Graphicsmagick are require to PDF parsing on the background.
   - Follow this [guide](https://github.com/yakovmeister/pdf2image/blob/HEAD/docs/gm-installation.md) to install both of them

### Installation

1. Clone the repo into a public GitHub repository.

   ```sh
   git clone https://github.com/bubblegan/self-hosted-expense-tracker.git
   ```

1. Go to the app folder

   ```sh
   cd self-hosted-expense-tracker
   ```

1. Run npm install

   ```sh
   npm install
   ```

1. Set up your `.env` file

   - Use `openssl rand -base64 32` to generate a key and add it under `NEXTAUTH_SECRET`.
   - Add Open AI key to `OPENAI_API_KEY`.
   - Add Postgresql database connection string to `DATABASE_URL`.

1. Run prisma migrate for the first time to migrate database.

   ```sh
    npx prisma migrate deploy --schema apps/web/prisma/schema.prisma
   ```

1. Run in development mode

   ```sh
   npm run dev
   ```

## Start Up Guide

1.  Go to `/sign-up` to create account with `username` and `password` after everything has set up.

1.  The categories will be seeded from `/apps/web/prisma/categoryList.json`.

## Roadmap

Will put this into proper format soon :

- Support for different self-hosting databases like SQLite and MySQL.
- Hosting guide for various VPS providers.
- Support for different LLM models beyond those provided by OpenAI.
- Calendar view for tracking expenses.
- And much more.
