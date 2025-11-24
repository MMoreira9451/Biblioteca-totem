import logging
import json
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from sqlalchemy import text

from app.config import get_config
from app.db.session import db
from app.db.bootstrap import initialize_database
from app.api import books, loans, auth, users
from app.models import user, book, loan


def create_app() -> Flask:
    """Create and configure Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    config = get_config()
    app.config.from_object(config)

    app.url_map.strict_slashes = False    
    # Configure logging
    setup_logging(app)
    
    # Initialize extensions
    db.init_app(app)
    CORS(app, 
     resources={
         r"/*": {
             "origins": config.ALLOWED_ORIGINS,
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "max_age": 3600
         }
     })
    JWTManager(app)
    Migrate(app, db)
    initialize_database(app)
    
    # Register blueprints
    app.register_blueprint(auth.bp, url_prefix="/auth")
    app.register_blueprint(books.bp, url_prefix="/books")
    app.register_blueprint(loans.bp, url_prefix="/loans")
    app.register_blueprint(users.bp, url_prefix="/users")  # New users endpoint
    
    # Register error handlers
    register_error_handlers(app)
    
    # Health check endpoint
    @app.route("/healthz")
    def health_check():
        """Health check endpoint for monitoring."""
        try:
            # Test database connection
            db.session.execute(text("SELECT 1"))
            return jsonify({
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "version": "1.0.0"
            })
        except Exception as e:
            app.logger.error(f"Health check failed: {str(e)}")
            return jsonify({
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }), 503
    
    @app.route("/")
    def root():
        """Root endpoint with API information."""
        return jsonify({
            "name": "Library Kiosk API",
            "version": "1.0.0",
            "description": "API for UAI Library Kiosk System",
            "endpoints": {
                "health": "/healthz",
                "auth": "/auth/*",
                "books": "/books/*",
                "loans": "/loans/*",
                "users": "/users/*"
            }
        })
    
    return app


def setup_logging(app: Flask) -> None:
    """Configure application logging."""
    log_level = getattr(logging, app.config.get("LOG_LEVEL", "INFO"))
    log_format = app.config.get("LOG_FORMAT", "json")
    
    if log_format == "json":
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s %(levelname)s [%(name)s] %(message)s'
        )
    
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    handler.setLevel(log_level)
    
    app.logger.addHandler(handler)
    app.logger.setLevel(log_level)
    
    # Disable werkzeug logging in production
    if not app.debug:
        logging.getLogger('werkzeug').setLevel(logging.WARNING)


class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging."""
    
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
        
        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
            
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_entry)


def register_error_handlers(app: Flask) -> None:
    """Register global error handlers."""
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Not Found",
            "message": "The requested resource was not found",
            "status_code": 404
        }), 404
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            "error": "Bad Request",
            "message": "The request was invalid",
            "status_code": 400
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            "error": "Unauthorized",
            "message": "Authentication required",
            "status_code": 401
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            "error": "Forbidden",
            "message": "Insufficient permissions",
            "status_code": 403
        }), 403
    
    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f"Internal server error: {str(error)}")
        db.session.rollback()
        return jsonify({
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "status_code": 500
        }), 500


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=8000, debug=app.config.get("DEBUG", False))
