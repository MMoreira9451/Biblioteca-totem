"""
Database initialization script.
Creates initial data including admin user and sample books.
"""
import sys
from typing import Optional

from app.main import create_app
from app.db.session import db
from app.models.user import User, UserRole
from app.models.book import Book, BookStatus
from app.core.security import hash_password
from app.config import get_config


def create_admin_user(config) -> User:
    """Create default admin user."""
    admin = User(
        email=config.ADMIN_EMAIL,
        password_hash=hash_password(config.ADMIN_PASSWORD),
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,
        is_active=True
    )
    return admin


def create_sample_books() -> list[Book]:
    """Create sample books for testing."""
    books = [
        Book(
            title="Cien años de soledad",
            author="Gabriel García Márquez",
            isbn="9780060883287",
            barcode="001001001",
            publisher="Harper & Row",
            publication_year=1967,
            language="es",
            subject="Literatura Latinoamericana",
            description="Una obra maestra del realismo mágico",
            location="A-001-01",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="El túnel",
            author="Ernesto Sabato",
            isbn="9789500739104",
            barcode="001001002",
            publisher="Planeta",
            publication_year=1948,
            language="es",
            subject="Literatura Argentina",
            description="Novela psicológica existencialista",
            location="A-001-02",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="Rayuela",
            author="Julio Cortázar",
            isbn="9788420471839",
            barcode="001001003",
            publisher="Alfaguara",
            publication_year=1963,
            language="es",
            subject="Literatura Argentina",
            description="Novela experimental innovadora",
            location="A-001-03",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="La casa de los espíritus",
            author="Isabel Allende",
            isbn="9788401240752",
            barcode="001001004",
            publisher="Plaza & Janés",
            publication_year=1982,
            language="es",
            subject="Literatura Chilena",
            description="Saga familiar con elementos mágicos",
            location="A-001-04",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="Ficciones",
            author="Jorge Luis Borges",
            isbn="9788420633848",
            barcode="001001005",
            publisher="Alianza Editorial",
            publication_year=1944,
            language="es",
            subject="Literatura Argentina",
            description="Colección de cuentos fantásticos",
            location="A-001-05",
            status=BookStatus.AVAILABLE
        ),
        # Computer Science books
        Book(
            title="Clean Code",
            author="Robert C. Martin",
            isbn="9780132350884",
            barcode="002001001",
            publisher="Prentice Hall",
            publication_year=2008,
            language="en",
            subject="Computer Science",
            description="A handbook of agile software craftsmanship",
            location="B-001-01",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="Design Patterns",
            author="Gang of Four",
            isbn="9780201633610",
            barcode="002001002",
            publisher="Addison-Wesley",
            publication_year=1994,
            language="en",
            subject="Computer Science",
            description="Elements of reusable object-oriented software",
            location="B-001-02",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="Introduction to Algorithms",
            author="Thomas H. Cormen",
            isbn="9780262033848",
            barcode="002001003",
            publisher="MIT Press",
            publication_year=2009,
            language="en",
            subject="Computer Science",
            description="Comprehensive introduction to algorithms",
            location="B-001-03",
            status=BookStatus.AVAILABLE
        )
    ]
    return books


def create_sample_students() -> list[User]:
    """Create sample student users."""
    students = [
        User(
            email="juan.perez@uai.edu",
            student_id="2021001",
            password_hash=hash_password("student123"),
            first_name="Juan",
            last_name="Pérez",
            role=UserRole.STUDENT,
            is_active=True
        ),
        User(
            email="maria.gonzalez@uai.edu",
            student_id="2021002",
            password_hash=hash_password("student123"),
            first_name="María",
            last_name="González",
            role=UserRole.STUDENT,
            is_active=True
        ),
        User(
            email="carlos.rodriguez@uai.edu",
            student_id="2021003",
            password_hash=hash_password("student123"),
            first_name="Carlos",
            last_name="Rodríguez",
            role=UserRole.STUDENT,
            is_active=True
        )
    ]
    return students


def init_db():
    """Initialize database with sample data."""
    app = create_app()
    config = get_config()
    
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        
        # Check if admin already exists
        existing_admin = db.session.query(User).filter(
            User.email == config.ADMIN_EMAIL
        ).first()
        
        if existing_admin:
            print(f"Admin user already exists: {config.ADMIN_EMAIL}")
        else:
            print("Creating admin user...")
            admin = create_admin_user(config)
            db.session.add(admin)
            print(f"Admin user created: {config.ADMIN_EMAIL}")
        
        # Check if books already exist
        existing_books = db.session.query(Book).count()
        if existing_books > 0:
            print(f"Database already has {existing_books} books")
        else:
            print("Creating sample books...")
            books = create_sample_books()
            for book in books:
                db.session.add(book)
            print(f"Created {len(books)} sample books")
        
        # Check if students already exist
        existing_students = db.session.query(User).filter(
            User.role == UserRole.STUDENT
        ).count()
        
        if existing_students > 0:
            print(f"Database already has {existing_students} students")
        else:
            print("Creating sample students...")
            students = create_sample_students()
            for student in students:
                db.session.add(student)
            print(f"Created {len(students)} sample students")
        
        try:
            db.session.commit()
            print("Database initialization completed successfully!")
            print("\nDefault login credentials:")
            print(f"Admin: {config.ADMIN_EMAIL} / {config.ADMIN_PASSWORD}")
            print("Students: *.perez@uai.edu, *.gonzalez@uai.edu, *.rodriguez@uai.edu / student123")
            
        except Exception as e:
            db.session.rollback()
            print(f"Error initializing database: {str(e)}")
            sys.exit(1)


if __name__ == "__main__":
    init_db()