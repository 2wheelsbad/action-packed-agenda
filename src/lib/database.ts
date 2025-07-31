import Database from '@tauri-apps/plugin-sql';

// Database instance
let db: Database | null = null;

// Initialize database connection
export async function initDatabase(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:app.db');
  }
  return db;
}

// Types based on our database schema
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeLog {
  id: string;
  activity: string;
  duration: number;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

// Todo operations
export const todoOperations = {
  async getAll(): Promise<Todo[]> {
    const database = await initDatabase();
    const result = await database.select<Todo[]>(
      'SELECT * FROM todos ORDER BY created_at DESC'
    );
    return result;
  },

  async create(text: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<void> {
    const database = await initDatabase();
    await database.execute(
      'INSERT INTO todos (text, priority) VALUES (?, ?)',
      [text, priority]
    );
  },

  async update(id: string, updates: Partial<Pick<Todo, 'text' | 'completed' | 'priority'>>): Promise<void> {
    const database = await initDatabase();
    const setParts: string[] = [];
    const values: (string | number | boolean)[] = [];

    if (updates.text !== undefined) {
      setParts.push('text = ?');
      values.push(updates.text);
    }
    if (updates.completed !== undefined) {
      setParts.push('completed = ?');
      setParts.push('completed_at = ?');
      values.push(updates.completed);
      values.push(updates.completed ? new Date().toISOString() : null);
    }
    if (updates.priority !== undefined) {
      setParts.push('priority = ?');
      values.push(updates.priority);
    }

    setParts.push('updated_at = datetime("now")');
    values.push(id);

    await database.execute(
      `UPDATE todos SET ${setParts.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    const database = await initDatabase();
    await database.execute('DELETE FROM todos WHERE id = ?', [id]);
  }
};

// Time log operations
export const timeLogOperations = {
  async getAll(): Promise<TimeLog[]> {
    const database = await initDatabase();
    const result = await database.select<TimeLog[]>(
      'SELECT * FROM time_logs ORDER BY created_at DESC'
    );
    return result;
  },

  async create(activity: string, duration: number): Promise<void> {
    const database = await initDatabase();
    await database.execute(
      'INSERT INTO time_logs (activity, duration) VALUES (?, ?)',
      [activity, duration]
    );
  },

  async delete(id: string): Promise<void> {
    const database = await initDatabase();
    await database.execute('DELETE FROM time_logs WHERE id = ?', [id]);
  }
};

// Calendar event operations
export const calendarOperations = {
  async getAll(): Promise<CalendarEvent[]> {
    const database = await initDatabase();
    const result = await database.select<CalendarEvent[]>(
      'SELECT * FROM calendar_events ORDER BY date ASC'
    );
    return result;
  },

  async create(title: string, date: string): Promise<void> {
    const database = await initDatabase();
    await database.execute(
      'INSERT INTO calendar_events (title, date) VALUES (?, ?)',
      [title, date]
    );
  },

  async delete(id: string): Promise<void> {
    const database = await initDatabase();
    await database.execute('DELETE FROM calendar_events WHERE id = ?', [id]);
  }
};

// Note operations
export const noteOperations = {
  async getAll(): Promise<Note[]> {
    const database = await initDatabase();
    const result = await database.select<Note[]>(
      'SELECT * FROM notes ORDER BY created_at DESC'
    );
    // Parse tags from JSON string
    return result.map(note => ({
      ...note,
      tags: note.tags ? JSON.parse(note.tags as string) : null
    }));
  },

  async create(title: string, content: string, tags: string[] = []): Promise<void> {
    const database = await initDatabase();
    await database.execute(
      'INSERT INTO notes (title, content, tags) VALUES (?, ?, ?)',
      [title, content || null, JSON.stringify(tags)]
    );
  },

  async update(id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'tags'>>): Promise<void> {
    const database = await initDatabase();
    const setParts: string[] = [];
    const values: (string | number | boolean)[] = [];

    if (updates.title !== undefined) {
      setParts.push('title = ?');
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      setParts.push('content = ?');
      values.push(updates.content);
    }
    if (updates.tags !== undefined) {
      setParts.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }

    setParts.push('updated_at = datetime("now")');
    values.push(id);

    await database.execute(
      `UPDATE notes SET ${setParts.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    const database = await initDatabase();
    await database.execute('DELETE FROM notes WHERE id = ?', [id]);
  }
};