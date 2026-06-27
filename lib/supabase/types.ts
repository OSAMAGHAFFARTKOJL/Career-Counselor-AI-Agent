export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_type: string;
          extracted_text: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['resumes']['Row']>;
        Update: Partial<Database['public']['Tables']['resumes']['Row']>;
        Relationships: [];
      };
      analyses: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          summary: string | null;
          payload: unknown;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['analyses']['Row']>;
        Update: Partial<Database['public']['Tables']['analyses']['Row']>;
        Relationships: [];
      };
    };
  };
};