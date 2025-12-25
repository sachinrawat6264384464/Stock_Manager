import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sams_backend.settings')
try:
    django.setup()
except Exception as e:
    print(f"Error setting up Django: {e}")
    exit(1)

from django.contrib.auth.models import User

def create_admin():
    try:
        username = 'admin'
        password = 'password123'
        email = 'admin@example.com'
        
        if not User.objects.filter(username=username).exists():
            print(f"Creating superuser '{username}'...")
            User.objects.create_superuser(username, email, password)
            print(f"SUCCESS: Superuser created!")
            print(f"Username: {username}")
            print(f"Password: {password}")
        else:
            print(f"Superuser '{username}' already exists.")
            # Set password again just in case
            u = User.objects.get(username=username)
            u.set_password(password)
            u.save()
            print(f"Password reset to: {password}")
            
    except Exception as e:
        print(f"Failed to create superuser: {e}")

if __name__ == '__main__':
    create_admin()
