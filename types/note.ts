export interface Note {
  id: number;
  title: string;
  content: string | null;
  content_type: string;
  source_url: string | null;
  file_path: string | null;
  subject: string | null;
  topic: string | null;
  short_summary: string | null;
  key_points: string | null;
  exam_revision_notes: string | null;
  ai_processed: boolean;
  processing_status: string;
  user_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface Question {
  id: number;
  note_id: number;
  note_title?: string | null;
  question_type: string;
  question_text: string;
  answer: string | null;
  options: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  related_note_id: number | null;
  related_reminder_id: number | null;
  created_at: string;
}

export interface Reminder {
  id: number;
  note_id: number;
  next_review_at: string;
  interval: number;
  revision_day: number;
  status: string;
  review_count: number;
  last_reviewed_at: string | null;
  email_sent_at: string | null;
  scheduled_question_id: number | null;
  answer_token: string | null;
  user_answer: string | null;
  answer_submitted_at: string | null;
  answer_source: 'web' | 'email' | null;
  created_at: string;
}

export interface SearchResult {
  id: number;
  title: string;
  content: string;
  content_type: string;
  subject: string | null;
  topic: string | null;
  short_summary: string | null;
  similarity: number;
  created_at: string;
}

export interface Flashcard {
  id: number;
  note_id: number;
  front: string;
  back: string;
  next_review_at: string;
  interval: number;
  ease_factor: number;
  repetitions: number;
  last_reviewed_at: string | null;
  created_at: string;
}
