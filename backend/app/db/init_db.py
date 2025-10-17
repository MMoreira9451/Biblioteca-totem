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
        ),
        # Additional test books with EAN-13 barcodes
        Book(
            title="El principito",
            author="Antoine de Saint-Exupéry",
            isbn="9788478887194",
            barcode="1234567890128",
            publisher="Salamandra",
            publication_year=1943,
            language="es",
            subject="Literatura Francesa",
            description="Fábula filosófica sobre la naturaleza humana",
            location="A-002-01",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="Don Quijote de la Mancha",
            author="Miguel de Cervantes",
            isbn="9788420412146",
            barcode="1234567890135",
            publisher="Alfaguara",
            publication_year=1605,
            language="es",
            subject="Literatura Española",
            description="La obra maestra de la literatura española",
            location="A-002-02",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="La Odisea",
            author="Homero",
            isbn="9788420674094",
            barcode="1234567890142",
            publisher="Alianza Editorial",
            publication_year=-800,
            language="es",
            subject="Literatura Clásica",
            description="Poema épico griego clásico",
            location="A-002-03",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="1984",
            author="George Orwell",
            isbn="9780451524935",
            barcode="2234567890123",
            publisher="Signet Classic",
            publication_year=1949,
            language="en",
            subject="Ciencia Ficción",
            description="Distopía sobre el totalitarismo y la vigilancia",
            location="C-001-01",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="El amor en los tiempos del cólera",
            author="Gabriel García Márquez",
            isbn="9788497592451",
            barcode="2234567890130",
            publisher="Mondadori",
            publication_year=1985,
            language="es",
            subject="Literatura Latinoamericana",
            description="Historia de amor que trasciende el tiempo",
            location="A-002-04",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="Crimen y Castigo",
            author="Fiódor Dostoyevski",
            isbn="9788420655741",
            barcode="2234567890147",
            publisher="Alianza Editorial",
            publication_year=1866,
            language="es",
            subject="Literatura Rusa",
            description="Novela psicológica sobre culpa y redención",
            location="A-003-01",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="Python Crash Course",
            author="Eric Matthes",
            isbn="9781593279288",
            barcode="3234567890122",
            publisher="No Starch Press",
            publication_year=2019,
            language="en",
            subject="Computer Science",
            description="A hands-on introduction to programming",
            location="B-002-01",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="The Pragmatic Programmer",
            author="Andrew Hunt & David Thomas",
            isbn="9780135957059",
            barcode="3234567890139",
            publisher="Addison-Wesley",
            publication_year=2019,
            language="en",
            subject="Computer Science",
            description="Your journey to mastery",
            location="B-002-02",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="JavaScript: The Good Parts",
            author="Douglas Crockford",
            isbn="9780596517748",
            barcode="3234567890146",
            publisher="O'Reilly Media",
            publication_year=2008,
            language="en",
            subject="Computer Science",
            description="Unearthing the excellence in JavaScript",
            location="B-002-03",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="Sapiens: De animales a dioses",
            author="Yuval Noah Harari",
            isbn="9788499926711",
            barcode="4234567890121",
            publisher="Debate",
            publication_year=2014,
            language="es",
            subject="Historia",
            description="Una breve historia de la humanidad",
            location="D-001-01",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="Cómo ganar amigos e influir sobre las personas",
            author="Dale Carnegie",
            isbn="9781439167342",
            barcode="4234567890138",
            publisher="Simon & Schuster",
            publication_year=1936,
            language="es",
            subject="Autoayuda",
            description="El libro clásico sobre relaciones humanas",
            location="D-001-02",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="El código Da Vinci",
            author="Dan Brown",
            isbn="9780307474278",
            barcode="4234567890145",
            publisher="Doubleday",
            publication_year=2003,
            language="es",
            subject="Thriller",
            description="Misterio y símbolos religiosos",
            location="C-002-01",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="Harry Potter y la piedra filosofal",
            author="J.K. Rowling",
            isbn="9788498382662",
            barcode="5234567890120",
            publisher="Salamandra",
            publication_year=1997,
            language="es",
            subject="Fantasía",
            description="El comienzo de la saga mágica",
            location="C-002-02",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="El señor de los anillos: La comunidad del anillo",
            author="J.R.R. Tolkien",
            isbn="9788445077528",
            barcode="5234567890137",
            publisher="Minotauro",
            publication_year=1954,
            language="es",
            subject="Fantasía",
            description="La épica aventura en la Tierra Media",
            location="C-002-03",
            status=BookStatus.AVAILABLE
        ),
        Book(
            title="El arte de la guerra",
            author="Sun Tzu",
            isbn="9788441419087",
            barcode="5234567890144",
            publisher="EDAF",
            publication_year=-500,
            language="es",
            subject="Estrategia",
            description="Tratado militar chino clásico",
            location="D-002-01",
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