# Stock Management System (SAMS) - Setup Instructions

Since this project was generated in manual mode, please follow these steps to initialize and run the application.

## 1. Backend Setup (Django)

Open your terminal and run the following commands:

```bash
cd sams_backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install django djangorestframework django-cors-headers

# Initialize Database
python manage.py makemigrations store
python manage.py migrate

# Create Admin User (Important for Login)
python manage.py createsuperuser
# Follow prompts to set username (e.g., admin) and password

# Run Server
python manage.py runserver
```

Backend will run at: `http://localhost:8000`

## 2. Frontend Setup (React)

Open a **new** terminal window and run:

```bash
cd sams_frontend

# Install dependencies
npm install

# Run Development Server
npm run dev
```

Frontend will run at: `http://localhost:5173`

## 3. Usage

1. Open `http://localhost:5173` in your browser.
2. Login with the superuser credentials you created.
3. **Dashboard**: Check stats.
4. **Products**: Add "Blazer", "School Name". Then expand it and "Add Size" (e.g., 28, 30).
5. **Stock In**: Select Product -> Size -> Add Quantity.
6. **Billing**: Select Item -> Size -> Add to Bill -> Generate Bill (PDF).
"# Stock_Manager" 
