# Fullstack Chat App

[![App Link](https://img.shields.io/badge/View%20Deployed%20App-Render-blue)](https://fullstack-chat-app-glyx.onrender.com/)

A real-time chat application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO, styled with Tailwind CSS and DaisyUI.

## Features

*   User authentication (signup/login) using JWT.
*   Real-time messaging between users using Socket.IO.
*   Display online users.
*   Responsive design.
*   Emoji picker for messages.
*   (Optional: Image uploads via Cloudinary if configured).

## Technologies Used

**Frontend:**

*   React (v19) with TypeScript
*   Vite
*   Tailwind CSS
*   DaisyUI
*   Zustand (State Management)
*   React Router DOM (v7)
*   Socket.IO Client
*   Axios
*   Lucide Icons

**Backend:**

*   Node.js with TypeScript
*   Express.js
*   MongoDB (with Mongoose)
*   Socket.IO
*   JSON Web Token (JWT) for authentication
*   bcryptjs for password hashing
*   Cookie Parser
*   dotenv for environment variables
*   CORS
*   Cloudinary for image storage

## Prerequisites

*   Node.js (v18 or higher recommended)
*   npm or yarn
*   MongoDB (local instance or MongoDB Atlas cluster)

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/fullstack-chat-app.git
    cd fullstack-chat-app
    ```

2.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd ../frontend
    npm install
    ```

4.  **Configure Backend Environment Variables:**
    *   Navigate back to the `backend` directory: `cd ../backend`
    *   Create a `.env` file by copying the example: `cp .env.example .env`
    *   Open the `.env` file and update the following variables:
        *   `PORT`: The port the backend server will run on (default: 5000).
        *   `MONGODB_URI`: Your MongoDB connection string.
        *   `JWT_SECRET`: A strong, secret key for signing JWTs.
        *   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: (Optional) Your Cloudinary credentials if you plan to use image uploads.

## Running the Application

1.  **Start the Backend Server:**
    *   Make sure you are in the `backend` directory.
    *   Run the development server (uses nodemon for auto-reloading):
        ```bash
        npm run dev
        ```
    *   Or, run the production build:
        ```bash
        npm start
        ```
    *   The backend server should now be running (typically on `http://localhost:5000`).

2.  **Start the Frontend Development Server:**
    *   Open a *new terminal window/tab*.
    *   Navigate to the `frontend` directory:
        ```bash
        cd frontend
        ```
    *   Run the development server:
        ```bash
        npm run dev
        ```
    *   The frontend development server should now be running (typically on `http://localhost:5173` or another port specified by Vite). Open this URL in your browser.

You should now be able to access the chat application, sign up, log in, and chat in real-time.
