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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      budget_targets: {
        Row: {
          agente: string
          anno: number
          created_at: string
          id: string
          importo: number
          mese: number
        }
        Insert: {
          agente: string
          anno: number
          created_at?: string
          id?: string
          importo: number
          mese: number
        }
        Update: {
          agente?: string
          anno?: number
          created_at?: string
          id?: string
          importo?: number
          mese?: number
        }
        Relationships: []
      }
      cliente_incentivazioni: {
        Row: {
          anno: number
          codice_cliente: string
          created_at: string
          created_by: string
          id: string
          incidenza: number
          nome_cliente: string
          note: string | null
          righe: Json
          totale_fatturato: number
          totale_premi: number
        }
        Insert: {
          anno: number
          codice_cliente: string
          created_at?: string
          created_by: string
          id?: string
          incidenza: number
          nome_cliente: string
          note?: string | null
          righe: Json
          totale_fatturato: number
          totale_premi: number
        }
        Update: {
          anno?: number
          codice_cliente?: string
          created_at?: string
          created_by?: string
          id?: string
          incidenza?: number
          nome_cliente?: string
          note?: string | null
          righe?: Json
          totale_fatturato?: number
          totale_premi?: number
        }
        Relationships: []
      }
      clienti_anagrafica: {
        Row: {
          email: string | null
          indirizzo: string | null
          nome_cliente: string
          partita_iva: string | null
          provincia: string | null
          telefono: string | null
        }
        Insert: {
          email?: string | null
          indirizzo?: string | null
          nome_cliente: string
          partita_iva?: string | null
          provincia?: string | null
          telefono?: string | null
        }
        Update: {
          email?: string | null
          indirizzo?: string | null
          nome_cliente?: string
          partita_iva?: string | null
          provincia?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      sales_records: {
        Row: {
          agente: string
          anno: number
          articolo: string
          azienda: string
          azienda_nome: string
          codice_cliente: string
          created_at: string
          fattura_riga: string | null
          id: string
          imponibile: number
          marchio: string
          mese: number
          nome_cliente: string
          provvigione: number
          user_id: string
        }
        Insert: {
          agente?: string
          anno: number
          articolo: string
          azienda: string
          azienda_nome: string
          codice_cliente: string
          created_at?: string
          fattura_riga?: string | null
          id?: string
          imponibile?: number
          marchio?: string
          mese: number
          nome_cliente: string
          provvigione?: number
          user_id: string
        }
        Update: {
          agente?: string
          anno?: number
          articolo?: string
          azienda?: string
          azienda_nome?: string
          codice_cliente?: string
          created_at?: string
          fattura_riga?: string | null
          id?: string
          imponibile?: number
          marchio?: string
          mese?: number
          nome_cliente?: string
          provvigione?: number
          user_id?: string
        }
        Relationships: []
      }
      user_agents: {
        Row: {
          agente: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          agente: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          agente?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          can_view_provvigioni: boolean
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          can_view_provvigioni?: boolean
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          can_view_provvigioni?: boolean
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_budget_data: {
        Args: { p_agente?: string; p_anno: number }
        Returns: Json
      }
      get_cliente_detail: { Args: { p_codice_cliente: string }; Returns: Json }
      get_clienti_list: { Args: { p_agente?: string }; Returns: Json }
      get_dashboard_stats: {
        Args: {
          p_agente?: string
          p_anno?: number
          p_azienda?: string
          p_mese?: number
        }
        Returns: Json
      }
      get_distinct_agents: { Args: never; Returns: string[] }
      get_fatturato_riepilogo: { Args: { p_agente?: string }; Returns: Json }
      get_filter_options: { Args: never; Returns: Json }
      get_marchi_stats: {
        Args: {
          p_agente?: string
          p_azienda_nome?: string
          p_mese_a?: number
          p_mese_da?: number
        }
        Returns: Json
      }
      get_marchio_clienti_stats: {
        Args: {
          p_agente?: string
          p_anno?: number
          p_azienda_nome?: string
          p_famiglia: string
        }
        Returns: Json
      }
      get_provvigioni_chart: {
        Args: {
          p_agente?: string
          p_azienda?: string
          p_mese_a?: number
          p_mese_da?: number
        }
        Returns: Json
      }
      get_provvigioni_grouped:
        | {
            Args: { p_anno?: number; p_azienda?: string; p_mese?: number }
            Returns: Json
          }
        | {
            Args: {
              p_agente?: string
              p_anno?: number
              p_azienda?: string
              p_mese?: number
              p_mese_a?: number
              p_mese_da?: number
            }
            Returns: Json
          }
      get_record_count: { Args: never; Returns: number }
      get_user_agents: { Args: { _user_id: string }; Returns: string[] }
      get_visible_agents: { Args: never; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
