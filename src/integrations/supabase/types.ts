export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      investments: {
        Row: {
          amount: number;
          confirmed_at: string | null;
          created_at: string;
          expected_return: number;
          id: string;
          note: string | null;
          payout_address: string;
          payout_network: string;
          plan_id: string;
          plan_name: string;
          return_pct: number;
          start_date: string;
          status: string;
          term_days: number;
          tx_id: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          confirmed_at?: string | null;
          created_at?: string;
          expected_return: number;
          id?: string;
          note?: string | null;
          payout_address: string;
          payout_network: string;
          plan_id: string;
          plan_name: string;
          return_pct: number;
          start_date?: string;
          status?: string;
          term_days?: number;
          tx_id?: string | null;
          user_id?: string;
        };
        Update: {
          amount?: number;
          confirmed_at?: string | null;
          created_at?: string;
          expected_return?: number;
          id?: string;
          note?: string | null;
          payout_address?: string;
          payout_network?: string;
          plan_id?: string;
          plan_name?: string;
          return_pct?: number;
          start_date?: string;
          status?: string;
          term_days?: number;
          tx_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          country: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          investor_type: string | null;
          notes: string | null;
          phone: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          country?: string | null;
          created_at?: string;
          email: string;
          full_name: string;
          id?: string;
          investor_type?: string | null;
          notes?: string | null;
          phone?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          country?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          investor_type?: string | null;
          notes?: string | null;
          phone?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          bonus_earned: number;
          created_at: string;
          email: string;
          id: string;
          name: string;
          ref_code: string | null;
          referred_by: string | null;
        };
        Insert: {
          bonus_earned?: number;
          created_at?: string;
          email?: string;
          id: string;
          name?: string;
          ref_code?: string | null;
          referred_by?: string | null;
        };
        Update: {
          bonus_earned?: number;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          ref_code?: string | null;
          referred_by?: string | null;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          bonus_earned: number;
          count: number;
          created_at: string;
          ref_code: string;
        };
        Insert: {
          bonus_earned?: number;
          count?: number;
          created_at?: string;
          ref_code: string;
        };
        Update: {
          bonus_earned?: number;
          count?: number;
          created_at?: string;
          ref_code?: string;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          created_at: string;
          id: string;
          status: string;
          ticket_id: string;
          transcript: Json;
          updated_at: string;
          user_email: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          status?: string;
          ticket_id: string;
          transcript?: Json;
          updated_at?: string;
          user_email?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          status?: string;
          ticket_id?: string;
          transcript?: Json;
          updated_at?: string;
          user_email?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      register_referral: {
        Args: { _bonus?: number; _ref_code: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
