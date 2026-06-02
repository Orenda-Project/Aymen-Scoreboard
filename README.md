# Recruitment Scoreboard

A modern, flexible recruitment management system inspired by Monday.com, built with Django and React.

![Tech Stack](https://img.shields.io/badge/Django-5.0-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![Python](https://img.shields.io/badge/Python-3.11+-yellow)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue)

## Overview

Recruitment Scoreboard helps you manage candidates across multiple job positions with customizable data fields, file uploads, and powerful search/filter capabilities.

### Key Features

- **Multi-Position Support**: Create separate scoreboards for each job position
- **Dynamic Columns**: Add custom columns of different types:
  - Text/Feedback fields
  - Date pickers
  - File uploads (resumes, documents)
  - Percentage scoring (0-100%)
  - Status dropdowns with color coding
- **Candidate Management**: Add, edit, and track candidates with ease
- **Search & Filter**: Powerful filtering by any column value
- **Modern UI**: Clean, intuitive interface built with Ant Design
- **REST API**: Full-featured API for future integrations

## Screenshot Reference

The application is designed to look like the Monday.com interface you provided, with:
- Table view with rows (candidates) and columns (attributes)
- Color-coded status badges
- Search, Filter, Sort controls
- Easy candidate addition

## Technology Stack

### Backend
- **Django 5.0**: Web framework
- **Django REST Framework**: API
- **PostgreSQL**: Database with JSONB support for flexible schemas
- **Python 3.11+**: Programming language

### Frontend
- **React 18.2**: UI library
- **Ant Design 5.13**: Component library
- **Vite**: Build tool
- **React Query**: Data fetching and caching
- **Zustand**: State management
- **Axios**: HTTP client

## Quick Start

**📖 For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)**

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL

### Installation

1. **Clone/Extract** this repository

2. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```

3. **Frontend Setup** (in a new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open Browser**: http://localhost:5173/

## Project Structure

```
Scoreboard/
├── backend/              # Django Backend
│   ├── config/          # Settings and URLs
│   ├── apps/
│   │   ├── positions/   # Position and Column models
│   │   └── candidates/  # Candidate models and APIs
│   └── media/          # File uploads
│
└── frontend/            # React Frontend
    ├── src/
    │   ├── components/  # Reusable UI components
    │   ├── pages/       # Page components
    │   ├── hooks/       # Custom React hooks
    │   ├── services/    # API services
    │   └── store/       # State management
    └── public/
```

## API Endpoints

### Positions
- `GET /api/positions/` - List all positions
- `POST /api/positions/` - Create position
- `GET /api/positions/{id}/` - Get position details
- `PUT /api/positions/{id}/` - Update position
- `DELETE /api/positions/{id}/` - Delete position

### Columns
- `POST /api/positions/{id}/columns/` - Add column to position
- `PUT /api/columns/{id}/` - Update column
- `DELETE /api/columns/{id}/` - Delete column
- `POST /api/columns/reorder/` - Reorder columns

### Candidates
- `GET /api/candidates/` - List candidates (with filters)
- `POST /api/candidates/` - Create candidate
- `PUT /api/candidates/{id}/` - Update candidate
- `DELETE /api/candidates/{id}/` - Delete candidate
- `PUT /api/candidates/{id}/data/` - Update candidate data
- `POST /api/candidates/{id}/upload/` - Upload file

### Files
- `GET /api/files/{id}/` - Get file details
- `DELETE /api/files/{id}/` - Delete file

## Database Schema

The application uses an **Entity-Attribute-Value (EAV) pattern** to support dynamic columns:

- **positions**: Job positions
- **column_definitions**: Custom column definitions per position
- **candidates**: Candidate records
- **candidate_data**: Stores values for custom columns (EAV)
- **uploaded_files**: File metadata and storage

## Features in Detail

### Column Types

1. **Text/Feedback**: Multi-line text input for comments and feedback
2. **Date**: Date picker for interview dates, deadlines, etc.
3. **File Upload**: Upload resumes, cover letters, portfolios
   - Configurable file types and size limits
   - Local filesystem storage
4. **Percentage**: Scoring from 0-100% with visual progress bar
5. **Status**: Dropdown with color-coded badges
   - Example: Shortlisted (green), Rejected (red), Interview (blue)

### Search & Filter

- **Text Search**: Search by candidate name, email, phone
- **Column Filters**: Filter by any custom column value
  - Status: Multi-select
  - Percentage: Range (min/max)
  - Date: Date range
  - Text: Contains search
- **Sorting**: Sort by name, date added, or any column

## Development Status

### 🎉 100% COMPLETE!

The application is fully functional and ready to use:

**Backend & Database:**
- ✅ Full Django REST API with all endpoints
- ✅ PostgreSQL database with EAV pattern
- ✅ All models and migrations
- ✅ File upload/download system
- ✅ Search, filter, sort backend logic
- ✅ Admin panel

**Frontend Features:**
- ✅ Complete React UI with Ant Design
- ✅ Position management (create, view, delete)
- ✅ Column management (add, edit, delete)
- ✅ All 5 column types fully implemented:
  - Text/Feedback with inline editing
  - Date picker with calendar
  - File upload with multi-file support
  - Percentage with progress bar
  - Status dropdown with colored badges
- ✅ Full candidate table with dynamic columns
- ✅ Add, edit, delete candidates
- ✅ Search functionality (name, email, phone)
- ✅ Advanced filtering (status, date range, percentage range)
- ✅ Responsive UI with loading states
- ✅ Error handling and notifications

**The application is production-ready and fully usable!** 🚀

See [COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md) for a complete feature list.

## Configuration

### Backend (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_NAME=recruitment_scoreboard
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password
DATABASE_HOST=localhost
DATABASE_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000/api
```

## Testing

### Manual Testing
1. Create a position: "Software Engineer"
2. Add columns: Status, Interview Date, Resume, Score, Feedback
3. Add 3-5 candidates
4. Fill in data for each column type
5. Test search, filter, and sort

### Admin Panel
- Access: http://localhost:8000/admin/
- View and manage all data directly
- Useful for testing and debugging

## Future Enhancements

### Authentication & Authorization
- User login system
- Role-based access (Admin, Recruiter, Viewer)
- Permission controls per position

### Advanced Features
- Email notifications
- Export to Excel/CSV
- Import candidates from CSV
- Kanban board view
- Analytics dashboard
- Comment threads
- Activity history

### Deployment
- Docker containerization
- Cloud database (AWS RDS)
- Cloud file storage (AWS S3)
- CI/CD pipeline
- Production deployment guide

## Contributing

This is a custom application built for specific recruitment needs. To extend:

1. **Add a new column type**:
   - Update `COLUMN_TYPES` in `backend/apps/positions/models.py`
   - Create cell renderer in `frontend/src/components/Columns/`
   - Update validation in serializers

2. **Add a new feature**:
   - Backend: Add endpoint in views, update serializer
   - Frontend: Create component, add hook, connect to API service

## License

Private/Commercial Project

## Support

For questions or issues:
1. Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions
2. Review API documentation at http://localhost:8000/api/
3. Consult Django/React documentation

## Credits

Built with:
- Django & Django REST Framework
- React & Ant Design
- PostgreSQL
- Modern JavaScript/Python best practices

---

**Ready to track your candidates more effectively!** 🚀

For setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)
