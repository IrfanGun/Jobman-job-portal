// Supabase Database types used for typed queries in the skeleton.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: number;
          name: string;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: number;
          full_name: string | null;
          email: string;
          role: "JOB_SEEKER" | "RECRUITER" | "ADMIN" | string;
          company_id: number | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          full_name?: string | null;
          email: string;
          role: "JOB_SEEKER" | "RECRUITER" | "ADMIN" | string;
          company_id?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      job_postings: {
        Row: {
          id: number;
          company_id: number;
          title: string;
          status: "OPEN" | "CLOSED" | "DRAFT" | string;
          posted_at: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: number;
          company_id: number;
          title: string;
          status?: "OPEN" | "CLOSED" | "DRAFT" | string;
          posted_at?: string | null;
          expires_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["job_postings"]["Insert"]>;
        Relationships: [];
      };
      job_applications: {
        Row: {
          id: number;
          job_posting_id: number;
          job_seeker_id: number;
          status:
            | "SUBMITTED"
            | "REVIEWING"
            | "REJECTED"
            | "OFFERED"
            | "EXPIRED"
            | string;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          job_posting_id: number;
          job_seeker_id: number;
          status?:
            | "SUBMITTED"
            | "REVIEWING"
            | "REJECTED"
            | "OFFERED"
            | "EXPIRED"
            | string;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["job_applications"]["Insert"]>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: number;
          job_seeker_id: number;
          recruiter_id: number;
          job_posting_id: number | null;
          job_application_id: number | null;
          status:
            | "ACTIVE"
            | "JOB_CLOSED"
            | "APPLICATION_EXPIRED"
            | "BLOCKED"
            | "ARCHIVED"
            | string;
          last_message_id: number | null;
          last_message_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          job_seeker_id: number;
          recruiter_id: number;
          job_posting_id?: number | null;
          job_application_id?: number | null;
          status?:
            | "ACTIVE"
            | "JOB_CLOSED"
            | "APPLICATION_EXPIRED"
            | "BLOCKED"
            | "ARCHIVED"
            | string;
          last_message_id?: number | null;
          last_message_at?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: number;
          conversation_id: number;
          sender_id: number;
          body: string | null;
          status: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED" | string;
          failed_reason: string | null;
          created_at: string | null;
          sent_at: string | null;
          delivered_at: string | null;
          read_at: string | null;
        };
        Insert: {
          id?: number;
          conversation_id: number;
          sender_id: number;
          body?: string | null;
          status?:
            | "PENDING"
            | "SENT"
            | "DELIVERED"
            | "READ"
            | "FAILED"
            | string;
          failed_reason?: string | null;
          created_at?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      message_attachments: {
        Row: {
          id: number;
          message_id: number;
          file_url: string;
          file_name: string;
          file_type: string;
          file_size_bytes: number;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          message_id: number;
          file_url: string;
          file_name: string;
          file_type: string;
          file_size_bytes: number;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["message_attachments"]["Insert"]>;
        Relationships: [];
      };
      contact_blocks: {
        Row: {
          id: number;
          blocker_id: number;
          blocked_id: number;
          reason: string | null;
          is_active: boolean | null;
          created_at: string | null;
          revoked_at: string | null;
        };
        Insert: {
          id?: number;
          blocker_id: number;
          blocked_id: number;
          reason?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          revoked_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["contact_blocks"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: number;
          user_id: number;
          type: string;
          message_id: number | null;
          is_read: boolean | null;
          created_at: string | null;
          read_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: number;
          type: string;
          message_id?: number | null;
          is_read?: boolean | null;
          created_at?: string | null;
          read_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
