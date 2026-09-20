export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PriorityType = 'low' | 'medium' | 'high';
export type MemberRole = 'owner' | 'member';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          avatar_url?: string | null;
        };
      };
      boards: {
        Row: {
          id: string;
          title: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          owner_id?: string;
          created_at?: string;
        };
      };
      board_members: {
        Row: {
          id: string;
          board_id: string;
          user_id: string;
          role: MemberRole;
        };
        Insert: {
          id?: string;
          board_id: string;
          user_id: string;
          role?: MemberRole;
        };
        Update: {
          id?: string;
          board_id?: string;
          user_id?: string;
          role?: MemberRole;
        };
      };
      columns: {
        Row: {
          id: string;
          board_id: string;
          title: string;
          position: number;
        };
        Insert: {
          id?: string;
          board_id: string;
          title: string;
          position?: number;
        };
        Update: {
          id?: string;
          board_id?: string;
          title?: string;
          position?: number;
        };
      };
      tasks: {
        Row: {
          id: string;
          column_id: string;
          title: string;
          description: string | null;
          priority: PriorityType;
          due_date: string | null;
          assignee_id: string | null;
          position: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          column_id: string;
          title: string;
          description?: string | null;
          priority?: PriorityType;
          due_date?: string | null;
          assignee_id?: string | null;
          position?: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          column_id?: string;
          title?: string;
          description?: string | null;
          priority?: PriorityType;
          due_date?: string | null;
          assignee_id?: string | null;
          position?: number;
          created_by?: string;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
  };
}

// Экспорт удобных типов для таблиц
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Board = Database['public']['Tables']['boards']['Row'];
export type BoardMember = Database['public']['Tables']['board_members']['Row'];
export type Column = Database['public']['Tables']['columns']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];