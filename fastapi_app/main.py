import os
import re
from typing import Any

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
import supabase as supabase_sdk

create_client = getattr(supabase_sdk, 'create_client')

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_ROLE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
supabase: Any = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
origins = [item.strip() for item in os.getenv('CORS_ORIGIN', 'http://localhost:3000').split(',') if item.strip()]
app = FastAPI(title='iNotebook API')
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
bearer = HTTPBearer(auto_error=False)


class AuthBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=5)
    name: str | None = None


class NoteBody(BaseModel):
    title: str = Field(min_length=3)
    description: str = Field(min_length=5)
    tag: str = ''


class RawTextBody(BaseModel):
    rawText: str = Field(min_length=10)


def session_response(session: Any) -> dict[str, Any]:
    if not session or not session.access_token:
        raise HTTPException(400, 'Email confirmation may be required before login')
    return {'success': True, 'authToken': session.access_token}


def current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict[str, Any]:
    token = credentials.credentials if credentials else request.headers.get('auth-token')
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'Authentication required')
    try:
        user = supabase.auth.get_user(token).user
        if not user:
            raise ValueError('Invalid user')
        return {'id': str(user.id), 'email': user.email or ''}
    except Exception as error:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'Invalid or expired token') from error


def public_note(row: dict[str, Any]) -> dict[str, Any]:
    return {**row, '_id': row.get('id')}


@app.get('/health')
def health():
    return {'success': True, 'message': 'FastAPI backend is running'}


@app.get('/')
def root():
    return {'success': True, 'message': 'API is live'}


@app.post('/api/auth/createUser')
def create_user(body: AuthBody):
    try:
        result = supabase.auth.sign_up({'email': body.email, 'password': body.password, 'options': {'data': {'name': body.name or body.email.split('@')[0]}}})
        return session_response(result.session)
    except Exception as error:
        raise HTTPException(400, str(error)) from error


@app.post('/api/auth/login')
def login(body: AuthBody):
    try:
        result = supabase.auth.sign_in_with_password({'email': body.email, 'password': body.password})
        return session_response(result.session)
    except Exception as error:
        raise HTTPException(400, 'Please try to login with correct credentials') from error


@app.post('/api/auth/getuser')
def get_user(user: dict[str, Any] = Depends(current_user)):
    return user


@app.get('/api/notes/fetchnotes')
def fetch_notes(user: dict[str, Any] = Depends(current_user)):
    result = supabase.table('notes').select('*').eq('user_id', user['id']).order('created_at', desc=True).execute()
    return [public_note(row) for row in (result.data or [])]


@app.post('/api/notes/addnote')
def add_note(body: NoteBody, user: dict[str, Any] = Depends(current_user)):
    result = supabase.table('notes').insert({'user_id': user['id'], **body.model_dump()}).execute()
    return public_note(result.data[0])


@app.put('/api/notes/updatenote/{note_id}')
def update_note(note_id: str, body: NoteBody, user: dict[str, Any] = Depends(current_user)):
    result = supabase.table('notes').update(body.model_dump()).eq('id', note_id).eq('user_id', user['id']).execute()
    if not result.data:
        raise HTTPException(404, 'Not Found')
    return public_note(result.data[0])


@app.delete('/api/notes/deletenote/{note_id}')
def delete_note(note_id: str, user: dict[str, Any] = Depends(current_user)):
    result = supabase.table('notes').delete().eq('id', note_id).eq('user_id', user['id']).execute()
    if not result.data:
        raise HTTPException(404, 'Not Found')
    return {'Success': 'Note has been deleted', 'note': public_note(result.data[0])}


@app.get('/api/notes/searchnote')
def search_notes(q: str = Query('', min_length=1), user: dict[str, Any] = Depends(current_user)):
    query = q.strip()
    if not query:
        return []
    result = supabase.table('notes').select('*').eq('user_id', user['id']).or_(f'title.ilike.%{query}%,description.ilike.%{query}%,tag.ilike.%{query}%').execute()
    return [public_note(row) for row in (result.data or [])]


def sentences(text: str) -> list[str]:
    return [part.strip() for part in re.split(r'(?<=[.!?])\s+', re.sub(r'\s+', ' ', text.strip())) if part.strip()]


def fallback_summary(text: str) -> dict[str, Any]:
    items = sentences(text)
    summary = ' '.join(items[:2])[:280] or text[:280]
    return {'summary': summary or 'No summary could be generated.', 'bullets': items[:4] or [summary], 'provider': 'fallback'}


COMMON_TAGS = ['Work', 'Study', 'Personal', 'Ideas', 'Shopping', 'Health', 'Finance', 'Travel', 'Projects', 'Important', 'General']
KEYWORDS = {'Work': ['meeting', 'office', 'client', 'deadline', 'team'], 'Projects': ['project', 'feature', 'bug', 'code', 'api', 'deploy'], 'Study': ['study', 'exam', 'learn', 'class', 'course'], 'Shopping': ['buy', 'shopping', 'grocery', 'price'], 'Health': ['doctor', 'medicine', 'workout', 'gym', 'health'], 'Finance': ['money', 'budget', 'salary', 'bill', 'bank'], 'Travel': ['travel', 'trip', 'flight', 'hotel'], 'Ideas': ['idea', 'brainstorm', 'concept', 'creative'], 'Important': ['urgent', 'important', 'todo', 'reminder'], 'Personal': ['family', 'friend', 'birthday', 'hobby']}


def detect_tag(text: str) -> str:
    lowered = text.lower()
    scores: dict[str, int] = {tag: sum(word in lowered for word in words) for tag, words in KEYWORDS.items()}
    if not scores:
        return 'General'
    best_tag, best_score = max(scores.items(), key=lambda item: item[1])
    return best_tag if best_score else 'General'


@app.post('/api/ai/summarize')
def summarize(payload: dict[str, Any], user: dict[str, Any] = Depends(current_user)):
    description = str(payload.get('description', '')).strip()
    if len(description) < 10:
        raise HTTPException(400, 'Description must be at least 10 characters long')
    return {'success': True, **fallback_summary(f"{payload.get('title', '')}. {description}")}


@app.post('/api/ai/autotag')
def autotag(payload: dict[str, Any], user: dict[str, Any] = Depends(current_user)):
    text = f"{payload.get('title', '')} {payload.get('description', '')}".strip()
    if len(text) < 10:
        raise HTTPException(400, 'Provide a bit more content so we can suggest a tag')
    tag = detect_tag(text)
    return {'success': True, 'tag': tag, 'suggestions': [tag] + [item for item in COMMON_TAGS if item != tag][:3], 'provider': 'fallback'}


@app.post('/api/ai/createNoteFromRawText')
def create_note_from_text(payload: RawTextBody, user: dict[str, Any] = Depends(current_user)):
    items = sentences(payload.rawText)
    return {'success': True, 'title': items[0] if items else 'Untitled note', 'description': ' '.join(items[1:]) or payload.rawText.strip(), 'tag': 'General'}