import os
import json
import re
from typing import Any

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
import httpx
import supabase as supabase_sdk

create_client = getattr(supabase_sdk, 'create_client')

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_ROLE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '').strip()
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash').strip()
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
    parts = [part.strip() for part in re.split(r'(?<=[.!?])\s+', re.sub(r'\s+', ' ', text.strip())) if part.strip()]
    unique_parts: list[str] = []
    seen: set[str] = set()
    for part in parts:
        normalized = re.sub(r'[^a-z0-9]+', ' ', part.lower()).strip()
        if normalized and normalized not in seen:
            seen.add(normalized)
            unique_parts.append(part)
    return unique_parts


def fallback_summary(text: str) -> dict[str, Any]:
    items = sentences(text)
    summary = ' '.join(items[:2])[:280] or re.sub(r'\s+', ' ', text.strip())[:280]
    bullets = items[:4] or [summary]
    return {'summary': summary or 'No summary could be generated.', 'bullets': bullets, 'provider': 'fallback'}


def gemini_json(prompt: str) -> dict[str, Any] | None:
    if not GEMINI_API_KEY:
        return None
    try:
        response = httpx.post(
            f'https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent',
            params={'key': GEMINI_API_KEY},
            json={
                'contents': [{'parts': [{'text': prompt}]}],
                'generationConfig': {'temperature': 0.2, 'responseMimeType': 'application/json'},
            },
            timeout=20,
        )
        response.raise_for_status()
        candidates = response.json().get('candidates', [])
        text = candidates[0]['content']['parts'][0]['text'].strip()
        text = re.sub(r'^```(?:json)?\s*|\s*```$', '', text, flags=re.IGNORECASE)
        result = json.loads(text)
        return result if isinstance(result, dict) else None
    except (httpx.HTTPError, KeyError, IndexError, json.JSONDecodeError, TypeError, ValueError):
        return None


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
    title = str(payload.get('title', '')).strip()
    source = f'{title}. {description}' if title and title.lower() not in description.lower() else description
    generated = gemini_json(
        'Summarize the following note for a busy person. Remove repetition. '
        'Return only JSON with a concise string field "summary" and an array field "bullets" '
        'containing 2 to 4 distinct, useful points. Do not invent facts.\n\n'
        f'Note:\n{source}'
    )
    if generated:
        summary = str(generated.get('summary', '')).strip()
        bullets = [str(item).strip() for item in generated.get('bullets', []) if str(item).strip()]
        if summary and bullets:
            return {'success': True, 'summary': summary, 'bullets': bullets[:4], 'provider': 'gemini'}
    return {'success': True, **fallback_summary(source)}


@app.post('/api/ai/autotag')
def autotag(payload: dict[str, Any], user: dict[str, Any] = Depends(current_user)):
    text = f"{payload.get('title', '')} {payload.get('description', '')}".strip()
    if len(text) < 10:
        raise HTTPException(400, 'Provide a bit more content so we can suggest a tag')
    generated = gemini_json(
        f'Choose the single best category for this note. Return only JSON with a string field "tag". '
        f'The tag must be exactly one of: {", ".join(COMMON_TAGS)}.\n\nNote:\n{text}'
    )
    if generated:
        tag = str(generated.get('tag', '')).strip()
        tag = next((item for item in COMMON_TAGS if item.lower() == tag.lower()), '')
        if tag:
            return {'success': True, 'tag': tag, 'suggestions': [tag] + [item for item in COMMON_TAGS if item != tag][:3], 'provider': 'gemini'}
    tag = detect_tag(text)
    return {'success': True, 'tag': tag, 'suggestions': [tag] + [item for item in COMMON_TAGS if item != tag][:3], 'provider': 'fallback'}


@app.post('/api/ai/createNoteFromRawText')
def create_note_from_text(payload: RawTextBody, user: dict[str, Any] = Depends(current_user)):
    raw_text = re.sub(r'\s+', ' ', payload.rawText.strip())
    items = sentences(raw_text)
    if not items:
        return {'success': True, 'title': 'Untitled note', 'description': raw_text, 'tag': 'General'}

    generated = gemini_json(
        f'Convert this raw text into a useful note. Return only JSON with string fields "title", '
        f'"description", and "tag". The title must be concise (3 to 8 words), must not copy the full '
        f'description, and the description must preserve the important meaning without repetition. '
        f'Choose tag from exactly: {", ".join(COMMON_TAGS)}. Do not invent facts.\n\nRaw text:\n{raw_text}'
    )
    if generated:
        title = str(generated.get('title', '')).strip()
        description = str(generated.get('description', '')).strip()
        tag = str(generated.get('tag', '')).strip()
        tag = next((item for item in COMMON_TAGS if item.lower() == tag.lower()), 'General')
        if 3 <= len(title) <= 100 and len(description) >= 5 and title.lower() != description.lower():
            return {'success': True, 'title': title, 'description': description, 'tag': tag, 'provider': 'gemini'}

    first_sentence = items[0].rstrip('.!?').strip()
    words = first_sentence.split()
    if len(items) > 1:
        title = first_sentence[:80]
        description = ' '.join(items[1:]).strip()
    else:
        title = ' '.join(words[:5]).rstrip(',;:')[:80] or 'Untitled note'
        description = raw_text

    if len(title) < 3:
        title = 'Untitled note'
    return {'success': True, 'title': title, 'description': description, 'tag': detect_tag(raw_text)}