#!/usr/bin/env python3
"""
Scoreboard - Local SQLite Backend
No external dependencies; uses Python stdlib only.
Run with:  python server.py
"""

import http.server
import json
import sqlite3
import hashlib
import hmac
import os
import re
import uuid
import base64
import socketserver
import mimetypes
from datetime import datetime, timezone
from urllib.parse import urlparse

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scoreboard.db')
PORT = int(os.environ.get('PORT', 5000))


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def new_id():
    return str(uuid.uuid4())


def open_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = open_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id            TEXT PRIMARY KEY,
            name          TEXT NOT NULL,
            email         TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at    TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token      TEXT PRIMARY KEY,
            user_id    TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS workspaces (
            id         TEXT PRIMARY KEY,
            name       TEXT NOT NULL,
            owner_id   TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS workspace_members (
            workspace_id TEXT NOT NULL,
            user_id      TEXT NOT NULL,
            role         TEXT NOT NULL DEFAULT 'owner',
            PRIMARY KEY (workspace_id, user_id),
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS positions (
            id              TEXT PRIMARY KEY,
            workspace_id    TEXT NOT NULL,
            name            TEXT NOT NULL,
            description     TEXT NOT NULL DEFAULT '',
            color           TEXT NOT NULL DEFAULT '#1890ff',
            is_active       INTEGER NOT NULL DEFAULT 1,
            sort_order      INTEGER NOT NULL DEFAULT 0,
            custom_statuses TEXT NOT NULL DEFAULT '[]',
            created_at      TEXT NOT NULL,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS cols (
            id          TEXT PRIMARY KEY,
            position_id TEXT NOT NULL,
            name        TEXT NOT NULL,
            type        TEXT NOT NULL DEFAULT 'text',
            is_fixed    INTEGER NOT NULL DEFAULT 0,
            sort_order  INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS candidates (
            id          TEXT PRIMARY KEY,
            position_id TEXT NOT NULL,
            sort_order  INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL,
            FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS cand_values (
            candidate_id TEXT NOT NULL,
            col_id       TEXT NOT NULL,
            value        TEXT,
            PRIMARY KEY (candidate_id, col_id),
            FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
            FOREIGN KEY (col_id)       REFERENCES cols(id)       ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS files (
            id            TEXT PRIMARY KEY,
            candidate_id  TEXT NOT NULL,
            col_id        TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type     TEXT NOT NULL,
            size_bytes    INTEGER NOT NULL,
            data          TEXT NOT NULL,
            uploaded_at   TEXT NOT NULL,
            FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
        );
    """)
    conn.commit()
    conn.close()
    print("[DB] Initialized: " + DB_PATH)


def hash_password(password):
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return base64.b64encode(salt + key).decode()


def verify_password(password, stored):
    try:
        raw = base64.b64decode(stored.encode())
        salt, key = raw[:16], raw[16:]
        new_key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
        return hmac.compare_digest(key, new_key)
    except Exception:
        return False


def create_session(db, user_id):
    token = str(uuid.uuid4())
    db.execute(
        "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, user_id, now_iso())
    )
    return token


def get_user_by_token(db, token):
    if not token:
        return None
    row = db.execute(
        "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = ?",
        (token,)
    ).fetchone()
    return dict(row) if row else None


class Handler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        status = args[1] if len(args) > 1 else '?'
        try:
            print("  " + self.command + " " + self.path + " -> " + str(status))
        except Exception:
            pass

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def respond(self, data, status=200):
        body = json.dumps(data, default=str).encode('utf-8')
        self.send_response(status)
        self._cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def err(self, msg, status=400):
        self.respond({'error': msg}, status)

    def read_json(self):
        length = int(self.headers.get('Content-Length', 0))
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw)
        except Exception:
            return {}

    def bearer_token(self):
        auth = self.headers.get('Authorization', '')
        return auth[7:] if auth.startswith('Bearer ') else None

    ROUTES = [
        ('POST',   r'/api/auth/register$',                                       'auth_register'),
        ('POST',   r'/api/auth/login$',                                          'auth_login'),
        ('POST',   r'/api/auth/logout$',                                         'auth_logout'),
        ('POST',   r'/api/auth/refresh$',                                        'auth_refresh'),
        ('GET',    r'/api/auth/me$',                                             'auth_me'),
        ('GET',    r'/api/workspaces$',                                          'workspaces_list'),
        ('POST',   r'/api/workspaces$',                                          'workspaces_create'),
        ('PUT',    r'/api/workspaces/([^/]+)$',                                  'workspace_update'),
        ('DELETE', r'/api/workspaces/([^/]+)$',                                  'workspace_delete'),
        ('GET',    r'/api/workspaces/([^/]+)/positions$',                        'positions_list'),
        ('POST',   r'/api/workspaces/([^/]+)/positions$',                        'positions_create'),
        ('PUT',    r'/api/workspaces/([^/]+)/positions/([^/]+)$',                'position_update'),
        ('DELETE', r'/api/workspaces/([^/]+)/positions/([^/]+)$',                'position_delete'),
        ('PATCH',  r'/api/workspaces/([^/]+)/positions/([^/]+)/toggle-active$',  'position_toggle'),
        ('PATCH',  r'/api/workspaces/([^/]+)/positions/([^/]+)/custom-statuses$','position_custom_statuses'),
        ('GET',    r'/api/positions/([^/]+)/candidates$',                        'candidates_list'),
        ('POST',   r'/api/positions/([^/]+)/candidates$',                        'candidates_create'),
        ('PATCH',  r'/api/positions/([^/]+)/candidates/reorder$',                'candidates_reorder'),
        ('DELETE', r'/api/positions/([^/]+)/candidates/([^/]+)$',                'candidate_delete'),
        ('PATCH',  r'/api/positions/([^/]+)/candidates/([^/]+)/values$',         'candidate_values'),
        ('POST',   r'/api/positions/([^/]+)/columns$',                           'column_create'),
        ('DELETE', r'/api/positions/([^/]+)/columns/([^/]+)$',                   'column_delete'),
        ('POST',   r'/api/files/upload$',                                        'file_upload'),
        ('GET',    r'/api/files/([^/]+)/url$',                                   'file_url'),
        ('DELETE', r'/api/files/([^/]+)$',                                       'file_delete'),
        ('GET',    r'/api/workspaces/([^/]+)/analytics$',                        'analytics'),
        ('GET',    r'/api/health$',                                              'health'),
    ]

    def dispatch(self, method):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip('/')
        for route_method, pattern, handler_name in self.ROUTES:
            if route_method != method:
                continue
            m = re.match(pattern, path)
            if m:
                db = open_db()
                try:
                    getattr(self, handler_name)(db, *m.groups())
                    db.commit()
                except Exception as exc:
                    db.rollback()
                    import traceback
                    traceback.print_exc()
                    try:
                        self.err('Internal server error', 500)
                    except Exception:
                        pass
                finally:
                    db.close()
                return
        # For GET requests, try to serve static frontend files
        if method == 'GET':
            self._serve_static(parsed.path)
            return
        self.err('Not found', 404)

    def _serve_static(self, req_path):
        dist_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend', 'dist')
        if not os.path.isdir(dist_dir):
            self.err('Not found', 404)
            return
        # Strip leading slash and resolve file path
        rel = req_path.lstrip('/')
        file_path = os.path.realpath(os.path.join(dist_dir, rel))
        # Prevent path traversal
        if not file_path.startswith(os.path.realpath(dist_dir)):
            self.err('Forbidden', 403)
            return
        # If directory or file doesn't exist, serve index.html (SPA fallback)
        if not os.path.isfile(file_path):
            file_path = os.path.join(dist_dir, 'index.html')
        if not os.path.isfile(file_path):
            self.err('Not found', 404)
            return
        mime, _ = mimetypes.guess_type(file_path)
        mime = mime or 'application/octet-stream'
        with open(file_path, 'rb') as f:
            data = f.read()
        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):    self.dispatch('GET')
    def do_POST(self):   self.dispatch('POST')
    def do_PUT(self):    self.dispatch('PUT')
    def do_PATCH(self):  self.dispatch('PATCH')
    def do_DELETE(self): self.dispatch('DELETE')

    # -- Health --

    def health(self, db):
        self.respond({'status': 'ok', 'timestamp': now_iso()})

    # -- Auth --

    def auth_register(self, db):
        body = self.read_json()
        name = (body.get('name') or '').strip()
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''
        if not name or not email or not password:
            return self.err('Name, email and password are required')
        if len(password) < 6:
            return self.err('Password must be at least 6 characters')
        if db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
            return self.err('Email already registered', 409)
        user_id = new_id()
        db.execute(
            "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, name, email, hash_password(password), now_iso())
        )
        ws_id = new_id()
        db.execute(
            "INSERT INTO workspaces (id, name, owner_id, created_at) VALUES (?, ?, ?, ?)",
            (ws_id, name + "'s Workspace", user_id, now_iso())
        )
        db.execute(
            "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')",
            (ws_id, user_id)
        )
        token = create_session(db, user_id)
        self.respond({'accessToken': token, 'refreshToken': token,
                      'user': {'id': user_id, 'name': name, 'email': email}}, 201)

    def auth_login(self, db):
        body = self.read_json()
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''
        row = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if not row or not verify_password(password, row['password_hash']):
            return self.err('Invalid email or password', 401)
        token = create_session(db, row['id'])
        self.respond({'accessToken': token, 'refreshToken': token,
                      'user': {'id': row['id'], 'name': row['name'], 'email': row['email']}})

    def auth_logout(self, db):
        token = self.bearer_token()
        if token:
            db.execute("DELETE FROM sessions WHERE token = ?", (token,))
        self.respond({'message': 'Logged out'})

    def auth_refresh(self, db):
        body = self.read_json()
        token = body.get('refreshToken') or self.bearer_token() or ''
        user = get_user_by_token(db, token)
        if not user:
            return self.err('Invalid token', 401)
        self.respond({'accessToken': token, 'refreshToken': token})

    def auth_me(self, db):
        user = get_user_by_token(db, self.bearer_token())
        if not user:
            return self.err('Unauthorized', 401)
        self.respond({'id': user['id'], 'name': user['name'], 'email': user['email']})

    # -- Workspaces --

    def workspaces_list(self, db):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        rows = db.execute(
            "SELECT w.id, w.name, w.created_at, wm.role FROM workspaces w "
            "JOIN workspace_members wm ON wm.workspace_id = w.id "
            "WHERE wm.user_id = ? ORDER BY w.created_at",
            (user['id'],)
        ).fetchall()
        self.respond([{'id': r['id'], 'name': r['name'], 'role': r['role'], 'createdAt': r['created_at']} for r in rows])

    def workspaces_create(self, db):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        body = self.read_json()
        name = (body.get('name') or '').strip()
        if not name: return self.err('Name is required')
        ws_id = new_id()
        ts = now_iso()
        db.execute("INSERT INTO workspaces (id, name, owner_id, created_at) VALUES (?, ?, ?, ?)",
                   (ws_id, name, user['id'], ts))
        db.execute("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')",
                   (ws_id, user['id']))
        self.respond({'id': ws_id, 'name': name, 'role': 'owner', 'createdAt': ts}, 201)

    def workspace_update(self, db, ws_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        if not self._member(db, ws_id, user['id']): return self.err('Access denied', 403)
        body = self.read_json()
        name = (body.get('name') or '').strip()
        if not name: return self.err('Name required')
        db.execute("UPDATE workspaces SET name = ? WHERE id = ?", (name, ws_id))
        self.respond({'id': ws_id, 'name': name})

    def workspace_delete(self, db, ws_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        if not self._member(db, ws_id, user['id']): return self.err('Access denied', 403)
        db.execute("DELETE FROM workspaces WHERE id = ?", (ws_id,))
        self.respond({'message': 'Workspace deleted'})

    # -- Positions --

    def _col_dict(self, c):
        return {'id': c['id'], 'name': c['name'], 'type': c['type'],
                'isFixed': bool(c['is_fixed']), 'sortOrder': c['sort_order']}

    def positions_list(self, db, ws_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        if not self._member(db, ws_id, user['id']): return self.err('Access denied', 403)
        positions = db.execute(
            "SELECT * FROM positions WHERE workspace_id = ? ORDER BY sort_order", (ws_id,)
        ).fetchall()
        result = []
        for pos in positions:
            cols = db.execute("SELECT * FROM cols WHERE position_id = ? ORDER BY sort_order", (pos['id'],)).fetchall()
            result.append({
                'id': pos['id'], 'name': pos['name'], 'description': pos['description'],
                'color': pos['color'], 'isActive': bool(pos['is_active']),
                'sortOrder': pos['sort_order'],
                'customStatuses': json.loads(pos['custom_statuses'] or '[]'),
                'createdAt': pos['created_at'],
                'columns': [self._col_dict(c) for c in cols],
            })
        self.respond(result)

    def positions_create(self, db, ws_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        if not self._member(db, ws_id, user['id']): return self.err('Access denied', 403)
        body = self.read_json()
        name = (body.get('name') or '').strip()
        description = (body.get('description') or '').strip()
        color = body.get('color') or '#1890ff'
        if not name: return self.err('Name required')
        max_order = db.execute(
            "SELECT COALESCE(MAX(sort_order), -1) as m FROM positions WHERE workspace_id = ?", (ws_id,)
        ).fetchone()['m']
        pos_id = new_id()
        ts = now_iso()
        db.execute(
            "INSERT INTO positions (id, workspace_id, name, description, color, is_active, sort_order, custom_statuses, created_at) "
            "VALUES (?, ?, ?, ?, ?, 1, ?, '[]', ?)",
            (pos_id, ws_id, name, description, color, max_order + 1, ts)
        )
        default_cols = [
            ('Name', 'text', 1, 0), ('Email', 'text', 1, 1), ('Phone', 'text', 1, 2),
            ('Status', 'status', 1, 3), ('Notes', 'text', 0, 4),
        ]
        cols_out = []
        for col_name, col_type, is_fixed, sort_order in default_cols:
            col_id = new_id()
            db.execute(
                "INSERT INTO cols (id, position_id, name, type, is_fixed, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
                (col_id, pos_id, col_name, col_type, is_fixed, sort_order)
            )
            cols_out.append({'id': col_id, 'name': col_name, 'type': col_type,
                             'isFixed': bool(is_fixed), 'sortOrder': sort_order})
        self.respond({'id': pos_id, 'name': name, 'description': description, 'color': color,
                      'isActive': True, 'sortOrder': max_order + 1, 'customStatuses': [],
                      'createdAt': ts, 'columns': cols_out}, 201)

    def position_update(self, db, ws_id, pos_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        if not self._member(db, ws_id, user['id']): return self.err('Access denied', 403)
        body = self.read_json()
        name = (body.get('name') or '').strip()
        description = body.get('description') or ''
        color = body.get('color') or '#1890ff'
        cs = json.dumps(body.get('customStatuses', []))
        db.execute(
            "UPDATE positions SET name=?, description=?, color=?, custom_statuses=? WHERE id=? AND workspace_id=?",
            (name, description, color, cs, pos_id, ws_id)
        )
        self.respond({'id': pos_id, 'name': name})

    def position_delete(self, db, ws_id, pos_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        if not self._member(db, ws_id, user['id']): return self.err('Access denied', 403)
        db.execute("DELETE FROM positions WHERE id=? AND workspace_id=?", (pos_id, ws_id))
        self.respond({'message': 'Position deleted'})

    def position_toggle(self, db, ws_id, pos_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        if not self._member(db, ws_id, user['id']): return self.err('Access denied', 403)
        db.execute(
            "UPDATE positions SET is_active = CASE WHEN is_active=1 THEN 0 ELSE 1 END WHERE id=? AND workspace_id=?",
            (pos_id, ws_id)
        )
        pos = db.execute("SELECT is_active FROM positions WHERE id=?", (pos_id,)).fetchone()
        self.respond({'id': pos_id, 'isActive': bool(pos['is_active'])})

    def position_custom_statuses(self, db, ws_id, pos_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        if not self._member(db, ws_id, user['id']): return self.err('Access denied', 403)
        body = self.read_json()
        cs = json.dumps(body.get('customStatuses', []))
        db.execute("UPDATE positions SET custom_statuses=? WHERE id=? AND workspace_id=?", (cs, pos_id, ws_id))
        self.respond({'message': 'Updated'})

    # -- Columns --

    def column_create(self, db, pos_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        body = self.read_json()
        name = (body.get('name') or '').strip()
        col_type = body.get('type') or 'text'
        if not name: return self.err('Name required')
        max_order = db.execute(
            "SELECT COALESCE(MAX(sort_order), -1) as m FROM cols WHERE position_id=?", (pos_id,)
        ).fetchone()['m']
        col_id = new_id()
        db.execute("INSERT INTO cols (id, position_id, name, type, is_fixed, sort_order) VALUES (?, ?, ?, ?, 0, ?)",
                   (col_id, pos_id, name, col_type, max_order + 1))
        self.respond({'id': col_id, 'name': name, 'type': col_type, 'isFixed': False, 'sortOrder': max_order + 1}, 201)

    def column_delete(self, db, pos_id, col_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        db.execute("DELETE FROM cols WHERE id=? AND position_id=?", (col_id, pos_id))
        self.respond({'message': 'Column deleted'})

    # -- Candidates --

    def _cand_dict(self, db, c):
        values = db.execute(
            "SELECT cv.col_id, cv.value, co.name AS col_name FROM cand_values cv "
            "JOIN cols co ON co.id = cv.col_id WHERE cv.candidate_id=?", (c['id'],)
        ).fetchall()
        files = db.execute(
            "SELECT id, col_id, original_name, mime_type, size_bytes, uploaded_at FROM files WHERE candidate_id=?",
            (c['id'],)
        ).fetchall()
        return {
            'id': c['id'], 'positionId': c['position_id'], 'sortOrder': c['sort_order'],
            'createdAt': c['created_at'],
            'data': {v['col_name']: v['value'] for v in values},
            'columnData': {v['col_id']: v['value'] for v in values},
            'files': [{'id': f['id'], 'columnId': f['col_id'], 'originalName': f['original_name'],
                       'mimeType': f['mime_type'], 'sizeBytes': f['size_bytes'], 'uploadedAt': f['uploaded_at']}
                      for f in files],
        }

    def candidates_list(self, db, pos_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        rows = db.execute("SELECT * FROM candidates WHERE position_id=? ORDER BY sort_order", (pos_id,)).fetchall()
        self.respond([self._cand_dict(db, r) for r in rows])

    def candidates_create(self, db, pos_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        body = self.read_json()
        name = (body.get('name') or '').strip()
        email = (body.get('email') or '').strip()
        phone = (body.get('phone') or '').strip()
        if not name: return self.err('Name required')
        max_order = db.execute(
            "SELECT COALESCE(MAX(sort_order), -1) as m FROM candidates WHERE position_id=?", (pos_id,)
        ).fetchone()['m']
        cand_id = new_id()
        db.execute("INSERT INTO candidates (id, position_id, sort_order, created_at) VALUES (?, ?, ?, ?)",
                   (cand_id, pos_id, max_order + 1, now_iso()))
        for col_name, val in [('Name', name), ('Email', email), ('Phone', phone)]:
            if not val: continue
            col = db.execute("SELECT id FROM cols WHERE position_id=? AND name=?", (pos_id, col_name)).fetchone()
            if col:
                db.execute("INSERT OR IGNORE INTO cand_values (candidate_id, col_id, value) VALUES (?, ?, ?)",
                           (cand_id, col['id'], val))
        row = db.execute("SELECT * FROM candidates WHERE id=?", (cand_id,)).fetchone()
        self.respond(self._cand_dict(db, row), 201)

    def candidate_delete(self, db, pos_id, cand_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        db.execute("DELETE FROM candidates WHERE id=? AND position_id=?", (cand_id, pos_id))
        self.respond({'message': 'Candidate deleted'})

    def candidate_values(self, db, pos_id, cand_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        body = self.read_json()
        values = body.get('values', {})
        cols = db.execute("SELECT id, name FROM cols WHERE position_id=?", (pos_id,)).fetchall()
        name_to_id = {c['name']: c['id'] for c in cols}
        id_set = {c['id'] for c in cols}
        for key, value in values.items():
            col_id = key if key in id_set else name_to_id.get(key)
            if not col_id: continue
            db.execute(
                "INSERT INTO cand_values (candidate_id, col_id, value) VALUES (?, ?, ?) "
                "ON CONFLICT(candidate_id, col_id) DO UPDATE SET value=excluded.value",
                (cand_id, col_id, value)
            )
        self.respond({'message': 'Values updated'})

    def candidates_reorder(self, db, pos_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        order = self.read_json().get('order', [])
        for i, cid in enumerate(order):
            db.execute("UPDATE candidates SET sort_order=? WHERE id=?", (i, cid))
        self.respond({'message': 'Reordered'})

    # -- Files --

    def file_upload(self, db):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        body = self.read_json()
        candidate_id = body.get('candidateId') or ''
        column_id = body.get('columnId') or ''
        file_name = body.get('fileName') or 'file'
        mime_type = body.get('mimeType') or 'application/octet-stream'
        file_data = body.get('data') or ''
        if not candidate_id or not column_id or not file_data:
            return self.err('candidateId, columnId, and data (base64) are required')
        try:
            raw_bytes = base64.b64decode(file_data + '==')
        except Exception:
            return self.err('Invalid base64 data')
        if len(raw_bytes) > 10 * 1024 * 1024:
            return self.err('File too large (max 10 MB)')
        pos = db.execute("SELECT position_id FROM candidates WHERE id=?", (candidate_id,)).fetchone()
        if pos:
            col = db.execute(
                "SELECT id FROM cols WHERE position_id=? AND (id=? OR name=?)",
                (pos['position_id'], column_id, column_id)
            ).fetchone()
            if col: column_id = col['id']
        existing = db.execute("SELECT id FROM files WHERE candidate_id=? AND col_id=?",
                              (candidate_id, column_id)).fetchone()
        if existing:
            db.execute("DELETE FROM files WHERE id=?", (existing['id'],))
        file_id = new_id()
        ts = now_iso()
        db.execute(
            "INSERT INTO files (id, candidate_id, col_id, original_name, mime_type, size_bytes, data, uploaded_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (file_id, candidate_id, column_id, file_name, mime_type, len(raw_bytes), file_data, ts)
        )
        self.respond({'id': file_id, 'candidateId': candidate_id, 'columnId': column_id,
                      'originalName': file_name, 'mimeType': mime_type,
                      'sizeBytes': len(raw_bytes), 'uploadedAt': ts}, 201)

    def file_url(self, db, file_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        row = db.execute("SELECT * FROM files WHERE id=?", (file_id,)).fetchone()
        if not row: return self.err('File not found', 404)
        data_url = "data:" + row['mime_type'] + ";base64," + row['data']
        self.respond({'url': data_url, 'expiresIn': 86400,
                      'file': {'id': row['id'], 'originalName': row['original_name'],
                               'mimeType': row['mime_type'], 'sizeBytes': row['size_bytes']}})

    def file_delete(self, db, file_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        db.execute("DELETE FROM files WHERE id=?", (file_id,))
        self.respond({'message': 'File deleted'})

    # -- Analytics --

    def analytics(self, db, ws_id):
        user = get_user_by_token(db, self.bearer_token())
        if not user: return self.err('Unauthorized', 401)
        if not self._member(db, ws_id, user['id']): return self.err('Access denied', 403)
        positions = db.execute(
            "SELECT * FROM positions WHERE workspace_id=? ORDER BY sort_order", (ws_id,)
        ).fetchall()
        summary = []
        total = 0
        for pos in positions:
            candidates = db.execute("SELECT id FROM candidates WHERE position_id=?", (pos['id'],)).fetchall()
            status_counts = {}
            for cand in candidates:
                sv = db.execute(
                    "SELECT cv.value FROM cand_values cv JOIN cols co ON co.id=cv.col_id "
                    "WHERE cv.candidate_id=? AND co.name='Status'", (cand['id'],)
                ).fetchone()
                status = sv['value'] if sv and sv['value'] else 'Unknown'
                status_counts[status] = status_counts.get(status, 0) + 1
            count = len(candidates)
            total += count
            summary.append({'positionId': pos['id'], 'positionName': pos['name'],
                            'color': pos['color'], 'isActive': bool(pos['is_active']),
                            'totalCandidates': count, 'statusBreakdown': status_counts})
        self.respond({'totalCandidates': total, 'positions': summary})

    def _member(self, db, ws_id, user_id):
        row = db.execute(
            "SELECT role FROM workspace_members WHERE workspace_id=? AND user_id=?",
            (ws_id, user_id)
        ).fetchone()
        return row is not None


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


if __name__ == '__main__':
    init_db()
    server = ThreadedHTTPServer(('', PORT), Handler)
    print("")
    print("=" * 48)
    print("  Scoreboard - Local Backend")
    print("  http://localhost:" + str(PORT))
    print("  Database: scoreboard.db")
    print("  Press Ctrl+C to stop")
    print("=" * 48)
    print("")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[STOP] Server stopped.")
