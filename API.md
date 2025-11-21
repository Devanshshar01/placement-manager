# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

### Register Student
- **URL**: `/auth/register/student`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123!",
    "roll_number": "CS101",
    "branch": "CSE",
    "cgpa": 8.5
  }
  ```
- **Response**: `201 Created` with User object and Cookie.

### Register Admin
- **URL**: `/auth/register/admin`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "Password123!",
    "admin_key": "secret_admin_key_123"
  }
  ```
- **Response**: `201 Created` with User object and Cookie.

### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "Password123!",
    "role": "student"
  }
  ```
- **Response**: `200 OK` with User object and Cookie.

### Logout
- **URL**: `/auth/logout`
- **Method**: `POST`
- **Response**: `200 OK` (Clears cookie).

## Student Routes

### Get Profile
- **URL**: `/student/profile`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>` (or Cookie)
- **Response**: Student profile details.

### Update Profile
- **URL**: `/student/profile`
- **Method**: `PUT`
- **Body**:
  ```json
  {
    "skills": ["Java", "Python"],
    "resume_link": "https://example.com/resume.pdf",
    "linkedin_link": "https://linkedin.com/in/johndoe"
  }
  ```

### Apply for Drive
- **URL**: `/student/apply/:driveId`
- **Method**: `POST`
- **Response**: Application status.

## Admin Routes

### Create Company
- **URL**: `/company`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "Google",
    "website": "https://google.com",
    "location": "Bangalore"
  }
  ```

### Create Drive
- **URL**: `/drive`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "company_id": 1,
    "job_title": "Software Engineer",
    "job_description": "Develop scalable applications.",
    "eligible_branches": ["CSE", "IT"],
    "min_cgpa": 7.5,
    "salary_package": "12 LPA",
    "deadline": "2023-12-31",
    "drive_date": "2024-01-15"
  }
  ```

### Update Application Status
- **URL**: `/admin/applications/:id/status`
- **Method**: `PUT`
- **Body**:
  ```json
  {
    "status": "Shortlisted"
  }
  ```

## Chatbot

### Chat Query
- **URL**: `/chatbot/query`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "message": "What companies are visiting next week?",
    "history": []
  }
  ```
- **Response**: Streaming text response.
