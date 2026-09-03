/**
 * Chatbot Service - University Counseling Expert
 */
import { buildChatContext } from './chatbot-db.helper.js';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `You are **UniBuddy**, an expert University Counseling Assistant for FindMyUni — Pakistan's most comprehensive university database with 336 universities.

## YOUR ROLE
You are a warm, knowledgeable counselor who helps Pakistani students find the right university. You have access to REAL data from the database and should ALWAYS use it.

## KEY RULES
1. ALWAYS query the database - Never make up university data. Use the context provided.
2. Ask smart questions - When vague, ask 2-3 follow-up questions.
3. Be specific - Give university names, rankings, programs, deadlines.
4. Be encouraging - Students are stressed about admissions.
5. Use data - Show rankings, program counts, deadline countdowns.

## STUDENT PROFILING
When a student asks "which university should I choose?", ask:
1. What level? (BS/MS/PhD)
2. What field? (CS, Engineering, Business, Medical, etc.)
3. Budget? (Public=affordable / Private=premium)
4. Preferred city? (Islamabad, Lahore, Karachi, etc.)

## HOW TO RECOMMEND
- University name and ranking (#1 in Pakistan, QS World #383)
- Why it fits THIS student
- Programs in their field
- Deadline status
- Public or Private

## FORMAT
🏛️ **NUST** — #1 in Pakistan, QS World #383
   Programs: CS, Engineering, Business
   Deadline: Sep 15, 2026 (12 days left)

## IMPORTANT
- You have REAL data for 336 universities. Use it!
- Never say "I don't know" without checking the database context.
- Always be helpful and student-focused.`;

// Conversation state
const conversationStates = new Map();

function getState(cid) {
  if (!conversationStates.has(cid)) {
    conversationStates.set(cid, { profile: {}, messages: [] });
  }
  return conversationStates.get(cid);
}

function detectProfile(message, state) {
  const lower = message.toLowerCase();
  const p = state.profile;
  
  if (lower.includes('bs') || lower.includes('bachelor') || lower.includes('undergrad') || lower.includes('fsc')) p.level = 'BS';
  else if (lower.includes('ms') || lower.includes('master') || lower.includes('mphil')) p.level = 'MS';
  else if (lower.includes('phd') || lower.includes('doctorate')) p.level = 'PhD';
  
  const fields = {'computer science':'CS','cs':'CS','software':'CS','engineering':'Engineering',
    'business':'Business','mba':'Business','medical':'Medicine','mbbs':'Medicine',
    'pharmacy':'Pharmacy','law':'Law','education':'Education','arts':'Arts',
    'data science':'Data Science','ai':'AI','artificial intelligence':'AI','finance':'Business'};
  for (const [k,v] of Object.entries(fields)) { if (lower.includes(k)) { p.field = v; break; } }
  
  if (lower.includes('public') || lower.includes('government') || lower.includes('cheap')) p.sector = 'Public';
  else if (lower.includes('private') || lower.includes('premium')) p.sector = 'Private';
  
  const cities = ['islamabad','lahore','karachi','peshawar','quetta','faisalabad','multan','rawalpindi'];
  for (const c of cities) { if (lower.includes(c)) { p.location = c[0].toUpperCase()+c.slice(1); break; } }
  
  state.profile = p;
}

function isComplete(p) { return p && p.level && p.field; }

class ChatbotService {
  async sendMessage(text, conversationId = null) {
    try {
      const cid = conversationId || 'default';
      const state = getState(cid);
      detectProfile(text, state);
      state.messages.push({ role: 'user', content: text });
      if (state.messages.length > 10) state.messages = state.messages.slice(-10);
      
      const lower = text.toLowerCase().trim();
      
      if (['hello','hi','hey','salam','assalam'].some(g => lower === g)) {
        return this._resp("Hello! 👋 I'm UniBuddy, your university counseling assistant. I have access to data on 336 Pakistani universities. What would you like to know?", cid, 'identity');
      }
      if (lower.includes('who are you') || lower.includes('your name') || lower === 'help') {
        return this._resp("I'm UniBuddy 🎓, your personal university counselor!\n\nI can help you with:\n• Finding the right university for your field\n• Checking admission deadlines\n• Comparing universities\n• Scholarship information\n• Program details\n\nWhat would you like to know?", cid, 'identity');
      }
      
      const dbContext = await buildChatContext(text);
      const history = state.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      
      let profileCtx = '';
      if (Object.keys(state.profile).length > 0) {
        const p = state.profile;
        profileCtx = `\n\nSTUDENT PROFILE:\n${p.level ? '- Level: '+p.level : ''}${p.field ? '\n- Field: '+p.field : ''}${p.sector ? '\n- Budget: '+p.sector : ''}${p.location ? '\n- Location: '+p.location : ''}`;
      }
      
      const askingRec = lower.includes('which') || lower.includes('recommend') || lower.includes('suggest') || lower.includes('best') || lower.includes('should i');
      if (askingRec && !isComplete(state.profile)) {
        const missing = [];
        if (!state.profile.level) missing.push('**What level?** (BS, MS, or PhD)');
        if (!state.profile.field) missing.push('**What field?** (CS, Engineering, Business, etc.)');
        if (!state.profile.sector) missing.push('**Budget?** (Public=affordable or Private=premium)');
        if (missing.length > 0) {
          return this._resp(`I'd love to help you find the best university! Let me understand your needs:\n\n${missing.join('\n')}\n\nOnce I know this, I can give personalized recommendations from 336 universities.`, cid, 'profiling');
        }
      }
      
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT + profileCtx + (dbContext ? `\n\nDATABASE CONTEXT:\n${dbContext}` : '') },
        ...history, { role: 'user', content: text }
      ];
      
      const answer = await this._callAPI(messages);
      state.messages.push({ role: 'assistant', content: answer });
      return this._resp(answer, cid, 'database');
    } catch (error) {
      console.error('Chatbot error:', error);
      return this._resp("I'm having trouble accessing the database right now. Please try again in a moment. 🏫", conversationId, 'error');
    }
  }
  
  async _callAPI(messages) {
    if (!OPENROUTER_API_KEY) throw new Error("API key not configured");
    let attempts = 0;
    while (attempts < 3) {
      try {
        const r = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'HTTP-Referer': window.location.origin, 'X-Title': 'FindMyUni' },
          body: JSON.stringify({ model: OPENROUTER_MODEL, messages, temperature: 0.7, max_tokens: 1024 })
        });
        if (!r.ok) { if (r.status === 429 && attempts < 2) { attempts++; await new Promise(res => setTimeout(res, 2000*attempts)); continue; } throw new Error(`API ${r.status}`); }
        const d = await r.json();
        return d?.choices?.[0]?.message?.content || "Please try again.";
      } catch (e) { if (attempts < 2) { attempts++; await new Promise(res => setTimeout(res, 1000*attempts)); continue; } throw e; }
    }
  }
  
  _resp(answer, cid, source) {
    return { message_id: Math.random().toString(36).substring(2,15), conversation_id: cid, answer, source, confidence: 'high', timestamp: new Date().toISOString(), web_search_used: false };
  }
  
  async getChatHistory() { return []; }
  async clearChatHistory() { return true; }
  async getSuggestions(context) {
    const s = {
      home: ['Which university is best for CS in Pakistan?','What are the top 5 universities?','When do admissions open?','Compare NUST vs FAST'],
      default: ['Help me find the right university','What are admission deadlines?','Compare two universities','Tell me about scholarships']
    };
    return s[context] || s.default;
  }
  a
