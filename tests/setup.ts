process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/loginbook?schema=public";
process.env.APP_URL ??= "http://localhost:3000";
process.env.SESSION_SECRET ??= "test-session-secret-32-bytes-minimum";
process.env.CSRF_SECRET ??= "test-csrf-secret-32-bytes-minimum";
process.env.LOCAL_UPLOAD_DIR ??= "./uploads";
process.env.STORAGE_DRIVER ??= "local";

