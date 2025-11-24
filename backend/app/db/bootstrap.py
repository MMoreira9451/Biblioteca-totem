"""
Utility helpers to ensure the database schema exists and the default admin user is present.
"""

from flask import Flask
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import db
from app.models.user import User, UserRole
from app.models.book import Book, BookStatus
from app.core.security import hash_password
from app.config import get_config

DEMO_STUDENTS = [
    {
        "email": "juan.perez@uai.edu",
        "student_id": "2021001",
        "first_name": "Juan",
        "last_name": "Pérez",
    },
    {
        "email": "maria.gonzalez@uai.edu",
        "student_id": "2021002",
        "first_name": "María",
        "last_name": "González",
    },
    {
        "email": "carlos.rodriguez@uai.edu",
        "student_id": "2021003",
        "first_name": "Carlos",
        "last_name": "Rodríguez",
    },
]

SAMPLE_BOOKS = [
    {
        "title": "El principito",
        "author": "Antoine de Saint-Exupéry",
        "barcode": "1234567890128",
        "isbn": "9788478887194",
        "publisher": "Salamandra",
        "publication_year": 1943,
        "subject": "Literatura",
        "location": "A-001-01",
    },
    {
        "title": "Cien años de soledad",
        "author": "Gabriel García Márquez",
        "barcode": "001001001",
        "isbn": "9780060883287",
        "publisher": "Harper & Row",
        "publication_year": 1967,
        "subject": "Literatura",
        "location": "A-001-02",
    },
    {
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "barcode": "002001001",
        "isbn": "9780132350884",
        "publisher": "Prentice Hall",
        "publication_year": 2008,
        "subject": "Informática",
        "location": "B-001-01",
    },
]


def initialize_database(app: Flask) -> None:
    """Create missing tables and ensure the default admin user exists."""
    config = get_config()

    with app.app_context():
        try:
            db.create_all()
        except SQLAlchemyError as exc:
            app.logger.error(f"Failed to create database tables: {exc}")
            raise

        ensure_admin_user(app, config)
        ensure_demo_students(app)
        ensure_sample_books(app)


def ensure_admin_user(app: Flask, config) -> None:
    """Ensure the default admin user exists."""
    admin = db.session.query(User).filter(User.email == config.ADMIN_EMAIL).first()
    if admin:
        return

    app.logger.info("Creating default admin user")
    admin = User(
        email=config.ADMIN_EMAIL,
        first_name="Admin",
        last_name="User",
        password_hash=hash_password(config.ADMIN_PASSWORD),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.session.add(admin)
    db.session.commit()
    app.logger.info("Default admin user created successfully")


def ensure_demo_students(app: Flask) -> None:
    """Ensure demo student accounts exist for the quick-login buttons."""
    created = 0
    for student_data in DEMO_STUDENTS:
        existing = db.session.query(User).filter(User.email == student_data["email"]).first()
        if existing:
            continue

        user = User(
            email=student_data["email"],
            student_id=student_data["student_id"],
            first_name=student_data["first_name"],
            last_name=student_data["last_name"],
            password_hash=hash_password("student123"),
            role=UserRole.STUDENT,
            is_active=True,
        )
        db.session.add(user)
        created += 1

    if created:
        db.session.commit()
        app.logger.info(f"Created {created} demo student account(s)")


def ensure_sample_books(app: Flask) -> None:
    """Seed a minimal catalog so scans tengan resultados."""
    existing_count = db.session.query(Book).count()
    if existing_count:
        return

    books = []
    for data in SAMPLE_BOOKS:
        books.append(
            Book(
                title=data["title"],
                author=data["author"],
                barcode=data["barcode"],
                isbn=data.get("isbn"),
                publisher=data.get("publisher"),
                publication_year=data.get("publication_year"),
                subject=data.get("subject"),
                location=data.get("location"),
                language="es",
                status=BookStatus.AVAILABLE,
            )
        )

    db.session.add_all(books)
    db.session.commit()
    app.logger.info(f"Seeded {len(books)} sample books for testing")
