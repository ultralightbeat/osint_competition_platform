import bcrypt


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash"""
    password_bytes = password.encode('utf-8')[:72]
    stored_hash = hashed.encode('utf-8') if isinstance(hashed, str) else hashed
    return bcrypt.checkpw(password_bytes, stored_hash)
