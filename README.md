# Placement Management System

A comprehensive web application to streamline the campus placement process for colleges. It connects students, placement officers (admins), and companies, facilitating efficient management of recruitment drives, applications, and communication.

## Features

### For Students
- **Profile Management**: Build and update professional profiles with resumes, skills, and portfolio links.
- **Drive Discovery**: View upcoming placement drives and job opportunities.
- **One-Click Apply**: Apply to eligible drives with a single click.
- **Application Tracking**: Monitor the status of applications in real-time.
- **AI Chatbot**: Get instant answers to placement-related queries using the integrated Gemini AI assistant.

### For Administrators (Placement Officers)
- **Dashboard**: Overview of placement statistics, recent activities, and quick actions.
- **Student Management**: View and manage student profiles.
- **Company & Drive Management**: Create and manage company profiles and recruitment drives.
- **Application Processing**: Review applications, shortlist candidates, and update statuses in bulk.
- **Analytics**: Visual insights into placement trends and performance.

## Tech Stack

- **Frontend**: HTML5, CSS3 (Custom Design System), JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens) with HTTP-Only Cookies
- **AI Integration**: Google Gemini 1.5 Flash API
- **Security**: Helmet, Rate Limiting, XSS Clean, HPP, Bcrypt

## Installation (Local Setup)

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/placement-manager.git
    cd placement-manager
    ```

2.  **Backend Setup**
    ```bash
    cd server
    npm install
    ```
    - Create a `.env` file in the `server` directory (see `.env.example`).
    - Set up your MySQL database and import `database_schema.sql`.

3.  **Frontend Setup**
    - The frontend is a static site. You can serve it using a simple HTTP server or open `client/index.html` directly (though some features requiring API calls need the backend running).
    - For development, you can use Live Server in VS Code.

4.  **Run the Application**
    - Start the backend server:
      ```bash
      cd server
      npm run dev
      ```
    - Open the frontend in your browser (e.g., `http://127.0.0.1:5500/client/index.html`).

## Environment Variables

Create a `.env` file in the `server` directory with the following:

```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=placement_system

# Security
JWT_SECRET=your_super_secret_random_string_at_least_32_chars
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
ADMIN_KEY=secret_admin_key_123

# AI Integration
GEMINI_API_KEY=your_gemini_api_key_here
```

## Deployment

### Backend (Render/Railway)
1.  Push the code to GitHub.
2.  Connect your repository to Render or Railway.
3.  Set the Root Directory to `server`.
4.  Add the environment variables in the dashboard.
5.  Deploy!

### Frontend (Vercel/Netlify)
1.  Push the code to GitHub.
2.  Connect your repository to Vercel or Netlify.
3.  Set the Root Directory to `client`.
4.  Update `client/js/config.js` to point to your deployed backend URL.
5.  Deploy!

## Screenshots

*(Add screenshots of Dashboard, Drive List, and Chatbot here)*

## Credits

Developed by [Your Name] for the Advanced Agentic Coding project.
