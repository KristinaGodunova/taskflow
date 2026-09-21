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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      reorder_tasks: {
        Args: {
          p_updates: {
            id: string;
            column_id: string;
            position: number;
          }[];
        };
        Returns: void;
      };
      invite_user_by_email: {
        Args: {
          p_board_id: string;
          p_email: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Board = Database['public']['Tables']['boards']['Row'];
export type BoardMember = Database['public']['Tables']['board_members']['Row'];
export type Column = Database['public']['Tables']['columns']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];