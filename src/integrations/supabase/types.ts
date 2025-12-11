export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_generated_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          prompt: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          prompt: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          prompt?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          event_date: string | null
          id: string
          is_competition: boolean | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          event_date?: string | null
          id?: string
          is_competition?: boolean | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          event_date?: string | null
          id?: string
          is_competition?: boolean | null
          title?: string
        }
        Relationships: []
      }
      assignment_completions: {
        Row: {
          assignment_id: string
          completed_at: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          assignment_id: string
          completed_at?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          completed_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_completions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assigned_to: string[] | null
          assigned_to_all: boolean | null
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          type: string | null
        }
        Insert: {
          assigned_to?: string[] | null
          assigned_to_all?: boolean | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          type?: string | null
        }
        Update: {
          assigned_to?: string[] | null
          assigned_to_all?: boolean | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          xp_required: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          xp_required?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          xp_required?: number | null
        }
        Relationships: []
      }
      battle_leaderboard: {
        Row: {
          average_time_seconds: number | null
          battles_played: number | null
          battles_won: number | null
          best_streak: number | null
          id: string
          total_score: number | null
          updated_at: string
          user_id: string
          username: string
          win_streak: number | null
        }
        Insert: {
          average_time_seconds?: number | null
          battles_played?: number | null
          battles_won?: number | null
          best_streak?: number | null
          id?: string
          total_score?: number | null
          updated_at?: string
          user_id: string
          username: string
          win_streak?: number | null
        }
        Update: {
          average_time_seconds?: number | null
          battles_played?: number | null
          battles_won?: number | null
          best_streak?: number | null
          id?: string
          total_score?: number | null
          updated_at?: string
          user_id?: string
          username?: string
          win_streak?: number | null
        }
        Relationships: []
      }
      battle_participants: {
        Row: {
          battle_id: string
          id: string
          is_correct: boolean | null
          joined_at: string
          score: number | null
          status: string | null
          submission_code: string | null
          submission_time: string | null
          user_id: string
          username: string
        }
        Insert: {
          battle_id: string
          id?: string
          is_correct?: boolean | null
          joined_at?: string
          score?: number | null
          status?: string | null
          submission_code?: string | null
          submission_time?: string | null
          user_id: string
          username: string
        }
        Update: {
          battle_id?: string
          id?: string
          is_correct?: boolean | null
          joined_at?: string
          score?: number | null
          status?: string | null
          submission_code?: string | null
          submission_time?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_participants_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "code_battles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_completions: {
        Row: {
          challenge_id: string
          completed_at: string | null
          id: string
          submission_code: string | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          id?: string
          submission_code?: string | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          id?: string
          submission_code?: string | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "coding_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string | null
          deadline: string | null
          description: string | null
          id: string
          title: string
          xp_reward: number | null
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          title: string
          xp_reward?: number | null
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      code_battles: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          difficulty: string | null
          ended_at: string | null
          id: string
          max_participants: number | null
          problem_statement: string
          started_at: string | null
          starter_code: string | null
          status: string | null
          test_cases: Json | null
          time_limit_seconds: number | null
          title: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          difficulty?: string | null
          ended_at?: string | null
          id?: string
          max_participants?: number | null
          problem_statement: string
          started_at?: string | null
          starter_code?: string | null
          status?: string | null
          test_cases?: Json | null
          time_limit_seconds?: number | null
          title: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          difficulty?: string | null
          ended_at?: string | null
          id?: string
          max_participants?: number | null
          problem_statement?: string
          started_at?: string | null
          starter_code?: string | null
          status?: string | null
          test_cases?: Json | null
          time_limit_seconds?: number | null
          title?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      code_hub_snippets: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_featured: boolean | null
          language: string
          likes_count: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          language?: string
          likes_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          language?: string
          likes_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      code_review_requests: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          requester_id: string
          snippet_id: string
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          requester_id: string
          snippet_id: string
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          requester_id?: string
          snippet_id?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_review_requests_snippet_id_fkey"
            columns: ["snippet_id"]
            isOneToOne: false
            referencedRelation: "code_hub_snippets"
            referencedColumns: ["id"]
          },
        ]
      }
      code_reviews: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          rating: number | null
          reviewer_id: string
          snippet_id: string
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          rating?: number | null
          reviewer_id: string
          snippet_id: string
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          rating?: number | null
          reviewer_id?: string
          snippet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_reviews_snippet_id_fkey"
            columns: ["snippet_id"]
            isOneToOne: false
            referencedRelation: "code_hub_snippets"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_challenges: {
        Row: {
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          difficulty: string | null
          id: string
          is_active: boolean | null
          language: string | null
          solution_hint: string | null
          starter_code: string | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          solution_hint?: string | null
          starter_code?: string | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          solution_hint?: string | null
          starter_code?: string | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      creative_hub_posts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mystery_challenge_completions: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id?: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mystery_challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "mystery_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      mystery_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          time_limit_minutes: number | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          time_limit_minutes?: number | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          time_limit_minutes?: number | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      pair_programming_rooms: {
        Row: {
          code_content: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          language: string | null
          max_participants: number | null
          name: string
        }
        Insert: {
          code_content?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          max_participants?: number | null
          name: string
        }
        Update: {
          code_content?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          max_participants?: number | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          full_name: string
          grade: string | null
          id: string
          level: number | null
          section: string | null
          technovista_id: string | null
          updated_at: string | null
          user_id: string
          xp_points: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          full_name: string
          grade?: string | null
          id?: string
          level?: number | null
          section?: string | null
          technovista_id?: string | null
          updated_at?: string | null
          user_id: string
          xp_points?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          grade?: string | null
          id?: string
          level?: number | null
          section?: string | null
          technovista_id?: string | null
          updated_at?: string | null
          user_id?: string
          xp_points?: number | null
        }
        Relationships: []
      }
      project_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string | null
          created_at: string | null
          demo_url: string | null
          description: string | null
          files: string[] | null
          github_url: string | null
          id: string
          is_featured: boolean | null
          status: string | null
          team_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          demo_url?: string | null
          description?: string | null
          files?: string[] | null
          github_url?: string | null
          id?: string
          is_featured?: boolean | null
          status?: string | null
          team_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          demo_url?: string | null
          description?: string | null
          files?: string[] | null
          github_url?: string | null
          id?: string
          is_featured?: boolean | null
          status?: string | null
          team_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      review_responses: {
        Row: {
          created_at: string | null
          feedback: string
          id: string
          rating: number | null
          request_id: string
          reviewer_id: string
          xp_earned: number | null
        }
        Insert: {
          created_at?: string | null
          feedback: string
          id?: string
          rating?: number | null
          request_id: string
          reviewer_id: string
          xp_earned?: number | null
        }
        Update: {
          created_at?: string | null
          feedback?: string
          id?: string
          rating?: number | null
          request_id?: string
          reviewer_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "code_review_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      room_participants: {
        Row: {
          cursor_position: Json | null
          id: string
          is_host: boolean | null
          joined_at: string
          room_id: string
          user_id: string
          username: string
        }
        Insert: {
          cursor_position?: Json | null
          id?: string
          is_host?: boolean | null
          joined_at?: string
          room_id: string
          user_id: string
          username: string
        }
        Update: {
          cursor_position?: Json | null
          id?: string
          is_host?: boolean | null
          joined_at?: string
          room_id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "pair_programming_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          leader_id: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          leader_id?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          leader_id?: string | null
          name?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_contributions: {
        Row: {
          contribution_count: number | null
          contribution_date: string
          contribution_type: string | null
          id: string
          user_id: string
        }
        Insert: {
          contribution_count?: number | null
          contribution_date: string
          contribution_type?: string | null
          id?: string
          user_id: string
        }
        Update: {
          contribution_count?: number | null
          contribution_date?: string
          contribution_type?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          streak_protected_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_protected_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_protected_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visitor_logs: {
        Row: {
          created_at: string
          id: string
          ip_hash: string | null
          page_visited: string | null
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          page_visited?: string | null
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          page_visited?: string | null
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member"],
    },
  },
} as const
