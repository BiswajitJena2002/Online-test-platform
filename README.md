# Online Test Web Application

A full-stack web application for conducting online tests with an Admin interface for uploading questions and a User interface for taking the test.

## Features
- **Admin**: Upload questions via JSON.
- **User**: Take timed tests with auto-marking.
- **Resume Capability**: Resume test from where you left off (Session based).
- **Result Analysis**: Detailed breakdown of correct, wrong, and skipped answers.
- **Responsive UI**: Clean design using Vanilla CSS.

## Tech Stack
- **Backend**: Node.js, Express
- **Frontend**: React, Vite
- **Storage**: In-memory (Reset on server restart)

## Prerequisites
- Node.js installed.

## Setup & Run

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```
Server runs on `http://localhost:5000`.

### 2. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
App runs on `http://localhost:5173`.

## Usage
1. Open Frontend (`http://localhost:5173`).
2. Go to **Admin Upload** (Link in Navbar).
3. Click **Load Sample** then **Upload Questions**.
4. Go back to Home and start the test.
5. Finish the test and view results.

## Sample Question Format
```json
[
  {
    "question_id": 1,
    "question": "What is 2+2?",
    "options": { "a": "3", "b": "4", "c": "5", "d": "6" },
    "correct_answer": "b"
  }
]
```
