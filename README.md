# CourseGuardian Hub

A modern educational platform built with Django backend and React frontend, designed for managing courses, lessons, and PDF learning materials with secure access control.

## 🚀 Features

- **User Management**: Role-based authentication (Admin/Student) with JWT tokens
- **Course Management**: Create and manage courses with structured lessons
- **PDF Learning Materials**: Secure PDF upload and viewing with watermarks
- **Enrollment System**: Students can enroll in courses and access their materials
- **Responsive UI**: Modern React interface with Tailwind CSS
- **Real-time Authentication**: Demo mode for testing without backend

## 🏗️ Architecture

### Backend (Django)
- **Framework**: Django 5.2.5 with Django REST Framework
- **Database**: PostgreSQL (configured for Supabase)
- **Authentication**: JWT tokens with SimpleJWT
- **File Storage**: Supabase for PDF storage and signed URLs
- **API Structure**: RESTful endpoints with proper error handling

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **UI Library**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context for authentication
- **Routing**: React Router for navigation
- **Icons**: Lucide React
## Sample View
![alt text](/attachments/image.png)
![alt text](/attachments/image2.png)

# Admin Panel
![alt text](/attachments/admin_panel_img.png)
## 📁 Project Structure

```
edtech/
├── edtech/                 # Django project root
│   ├── settings.py         # Django settings
│   ├── urls.py            # Main URL configuration
│   └── wsgi.py            # WSGI configuration
├── courses/               # Main Django app
│   ├── models.py          # Data models (Course, Lesson, LessonPDF)
│   ├── views.py           # API views and authentication
│   ├── api.py             # ViewSets for REST API
│   ├── serializers.py     # DRF serializers
│   ├── signals.py         # Django signals
│   ├── profile.py         # User profile model
│   ├── enrollment.py      # Enrollment management
│   ├── storage.py         # Supabase storage integration
│   └── migrations/        # Database migrations
└── lesson_pdfs/           # Uploaded PDF files

frontend/courseguardian-hub-main/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   └── dashboard/    # Dashboard-specific components
│   ├── contexts/         # React contexts (AuthContext)
│   ├── pages/           # Page components
│   │   ├── auth/        # Authentication pages
│   │   └── dashboard/   # Dashboard pages
│   ├── services/        # API services
│   ├── types/           # TypeScript type definitions
│   └── hooks/           # Custom React hooks
├── public/              # Static assets
└── package.json         # Frontend dependencies
```

## 🛠️ Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL database
- Supabase account (for PDF storage)

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd edtech
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment Configuration**
Create a `.env` file in the `edtech` directory:
```env
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database configuration
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=5432

# Supabase configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE=your_service_role_key
SUPABASE_BUCKET=courses
```

5. **Apply migrations**
```bash
python manage.py migrate
```

6. **Create superuser**
```bash
python manage.py createsuperuser
```

7. **Run the server**
```bash
python manage.py runserver
```

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend/courseguardian-hub-main
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Start development server**
```bash
npm run dev
# or
yarn dev
```

## 🔧 Admin Management

### Django Admin Panel
The platform uses Django's built-in admin panel for all administrative tasks:

**Admin Features Available:**
- **Course Management**: Create, edit, delete courses with descriptions
- **Lesson Management**: Add lessons to courses with inline editing
- **PDF Upload & Management**: Upload PDFs directly to lessons with Supabase integration
- **User Management**: Manage user accounts, roles, and permissions
- **Enrollment Management**: View and manage student enrollments
- **Bulk Operations**: Import/export data, bulk actions
- **Advanced Filtering**: Search and filter across all models

**Accessing Admin Panel:**
1. Navigate to `/admin` in the frontend (for admin users)
2. Click "Open Django Admin Panel" button
3. Or directly visit: `http://localhost:8000/admin/`

**Admin Login:**
- Use any admin account credentials
- Demo admin: `admin` / `admin123`

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/me/` - Get current user info

### Courses
- `GET /api/courses/` - List all courses
- `POST /api/courses/` - Create new course (Admin only)
- `GET /api/courses/{id}/` - Get course details
- `POST /api/courses/{id}/enroll/` - Enroll in course
- `POST /api/courses/{id}/unenroll/` - Unenroll from course
- `GET /api/courses/my-courses/` - Get user's enrolled courses

### Lessons
- `GET /api/lessons/` - List lessons (filtered by course)
- `POST /api/lessons/{id}/upload_pdf/` - Upload PDF to lesson (Admin only)

### PDF Management
- `GET /api/lessonpdfs/` - List lesson PDFs
- `POST /api/lessonpdfs/upload/` - Upload PDF file
- `GET /api/lessonpdfs/{id}/view_pdf/` - Get signed PDF URL

## 👥 User Roles

### Admin
- Create and manage courses
- Upload and manage lesson PDFs
- View all courses and enrollments
- Full system access

### Student
- Enroll in courses
- View enrolled course materials
- Access lesson PDFs
- View personal progress

## 🔐 Authentication

### Demo Mode
The platform includes a demo mode for testing:
- **Admin credentials**: `admin` / `admin123`
- **Student credentials**: `student` / `student123`

### JWT Authentication
- Uses Django REST Framework with SimpleJWT
- Access tokens expire in 1 day
- Refresh tokens expire in 7 days
- Automatic token refresh handled by frontend

## 📚 Features in Detail

### Course Management
- Create courses with titles and descriptions
- Organize content into lessons
- Track enrollment statistics
- Manage course access permissions

### PDF Learning System
- Secure PDF upload to Supabase storage
- Signed URLs with expiration for secure access
- User-specific watermarks on PDFs
- Organized by course and lesson structure

### Enrollment System
- Students can enroll in multiple courses
- Admins can manage course enrollments
- Access control based on enrollment status
- Progress tracking capabilities

### User Interface
- Responsive design for all devices
- Modern React components with TypeScript
- Intuitive navigation and user experience
- Real-time form validation and error handling

## 🚀 Deployment

### Backend Deployment
1. Set up production database
2. Configure environment variables
3. Collect static files: `python manage.py collectstatic`
4. Use production WSGI server (Gunicorn/uWSGI)
5. Set up reverse proxy (Nginx/Apache)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy static files to web server
3. Configure API base URL for production
4. Set up proper CORS headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the code
- Review the API endpoints for available functionality

## 🔮 Future Enhancements

- Video lesson support
- Quiz and assessment system
- Progress tracking and analytics
- Discussion forums
- Mobile application
- Advanced PDF annotation tools
- Offline content access
- Multi-language support
- Payment integration for premium courses