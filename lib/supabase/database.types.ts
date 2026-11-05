
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "admin_users": {
                  Row: {
                    "created_at": string,"email": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"event_deletion_identities": {
                  Row: {
                    "created_at": string,"id": string,"identity_key": string,"identity_value": string,"kind": string,"source_namespace": string,"source_url": string | null,"tombstone_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"identity_key": string,"identity_value": string,"kind": string,"source_namespace": string,"source_url"?: string | null,"tombstone_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"identity_key"?: string,"identity_value"?: string,"kind"?: string,"source_namespace"?: string,"source_url"?: string | null,"tombstone_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_deletion_identities_tombstone_id_fkey"
      columns: ["tombstone_id"]
isOneToOne: false
      referencedRelation: "event_deletion_tombstones"
      referencedColumns: ["id"]
    }
                  ]
                },"event_deletion_tombstones": {
                  Row: {
                    "deleted_at": string,"deleted_by": string,"event_snapshot": NonNullable<Json>,"id": string,"original_event_id": string,"original_slug": string,"original_title": string,"reason": string | null,"released_at": string | null,"released_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "deleted_at"?: string,"deleted_by": string,"event_snapshot": NonNullable<Json>,"id"?: string,"original_event_id": string,"original_slug": string,"original_title": string,"reason"?: string | null,"released_at"?: string | null,"released_by"?: string | null
                  }
                  Update: {
                    "deleted_at"?: string,"deleted_by"?: string,"event_snapshot"?: NonNullable<Json>,"id"?: string,"original_event_id"?: string,"original_slug"?: string,"original_title"?: string,"reason"?: string | null,"released_at"?: string | null,"released_by"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"event_occurrences": {
                  Row: {
                    "created_at": string,"ends_at": string | null,"event_id": string,"id": string,"starts_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"ends_at"?: string | null,"event_id": string,"id"?: string,"starts_at": string
                  }
                  Update: {
                    "created_at"?: string,"ends_at"?: string | null,"event_id"?: string,"id"?: string,"starts_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_occurrences_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    }
                  ]
                },"event_reports": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"review_status": string,"source_url": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"review_status"?: string,"source_url": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"review_status"?: string,"source_url"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"event_sources": {
                  Row: {
                    "collected_at": string,"created_at": string,"event_id": string,"external_id": string | null,"id": string,"last_checked_at": string | null,"original_url": string,"provider": string
                  }
                  ComputedFields: never
                  Insert: {
                    "collected_at"?: string,"created_at"?: string,"event_id": string,"external_id"?: string | null,"id"?: string,"last_checked_at"?: string | null,"original_url": string,"provider": string
                  }
                  Update: {
                    "collected_at"?: string,"created_at"?: string,"event_id"?: string,"external_id"?: string | null,"id"?: string,"last_checked_at"?: string | null,"original_url"?: string,"provider"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_sources_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "address": string | null,"application_end_at": string | null,"application_start_at": string | null,"application_url": string | null,"audiences": (string)[],"category": Database["public"]['Enums']["event_category"],"contact": string | null,"created_at": string,"description": string | null,"event_end_at": string | null,"event_start_at": string | null,"id": string,"image_url": string | null,"is_demo": boolean,"is_featured": boolean,"is_free": boolean | null,"last_verified_at": string | null,"latitude": number | null,"location_name": string | null,"location_source_url": string | null,"location_verified_at": string | null,"longitude": number | null,"official_url": string | null,"operating_hours": string | null,"organizer": string | null,"organizer_url": string | null,"performer_groups": (string)[],"performer_people": (string)[],"price_text": string | null,"published_at": string | null,"review_status": Database["public"]['Enums']["event_review_status"],"schedule_mode": string,"slug": string,"source_name": string,"source_url": string,"summary": string | null,"title": string,"updated_at": string,"view_count": number
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"application_end_at"?: string | null,"application_start_at"?: string | null,"application_url"?: string | null,"audiences"?: (string)[],"category": Database["public"]['Enums']["event_category"],"contact"?: string | null,"created_at"?: string,"description"?: string | null,"event_end_at"?: string | null,"event_start_at"?: string | null,"id"?: string,"image_url"?: string | null,"is_demo"?: boolean,"is_featured"?: boolean,"is_free"?: boolean | null,"last_verified_at"?: string | null,"latitude"?: number | null,"location_name"?: string | null,"location_source_url"?: string | null,"location_verified_at"?: string | null,"longitude"?: number | null,"official_url"?: string | null,"operating_hours"?: string | null,"organizer"?: string | null,"organizer_url"?: string | null,"performer_groups"?: (string)[],"performer_people"?: (string)[],"price_text"?: string | null,"published_at"?: string | null,"review_status"?: Database["public"]['Enums']["event_review_status"],"schedule_mode"?: string,"slug": string,"source_name": string,"source_url": string,"summary"?: string | null,"title": string,"updated_at"?: string,"view_count"?: number
                  }
                  Update: {
                    "address"?: string | null,"application_end_at"?: string | null,"application_start_at"?: string | null,"application_url"?: string | null,"audiences"?: (string)[],"category"?: Database["public"]['Enums']["event_category"],"contact"?: string | null,"created_at"?: string,"description"?: string | null,"event_end_at"?: string | null,"event_start_at"?: string | null,"id"?: string,"image_url"?: string | null,"is_demo"?: boolean,"is_featured"?: boolean,"is_free"?: boolean | null,"last_verified_at"?: string | null,"latitude"?: number | null,"location_name"?: string | null,"location_source_url"?: string | null,"location_verified_at"?: string | null,"longitude"?: number | null,"official_url"?: string | null,"operating_hours"?: string | null,"organizer"?: string | null,"organizer_url"?: string | null,"performer_groups"?: (string)[],"performer_people"?: (string)[],"price_text"?: string | null,"published_at"?: string | null,"review_status"?: Database["public"]['Enums']["event_review_status"],"schedule_mode"?: string,"slug"?: string,"source_name"?: string,"source_url"?: string,"summary"?: string | null,"title"?: string,"updated_at"?: string,"view_count"?: number
                  }
                  Relationships: [
                    
                  ]
                },"places": {
                  Row: {
                    "address": string | null,"category": string,"created_at": string,"id": string,"image_url": string | null,"is_published": boolean,"latitude": number,"longitude": number,"map_url": string | null,"name": string,"official_url": string | null,"slug": string,"summary": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"category": string,"created_at"?: string,"id"?: string,"image_url"?: string | null,"is_published"?: boolean,"latitude": number,"longitude": number,"map_url"?: string | null,"name": string,"official_url"?: string | null,"slug": string,"summary"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string | null,"category"?: string,"created_at"?: string,"id"?: string,"image_url"?: string | null,"is_published"?: boolean,"latitude"?: number,"longitude"?: number,"map_url"?: string | null,"name"?: string,"official_url"?: string | null,"slug"?: string,"summary"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"site_feedback": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"image_path": string | null,"link_url": string | null,"review_status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"image_path"?: string | null,"link_url"?: string | null,"review_status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"image_path"?: string | null,"link_url"?: string | null,"review_status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "canonicalize_event_url_path":
{ Args: { "p_path": string }; Returns: string
                           },
"consume_public_submission_rate_limit":
{ Args: { "p_key_hash": string,"p_limit": number,"p_scope": string,"p_window_seconds": number }; Returns: {
              "allowed": boolean,"retry_after_seconds": number
            }[]
                           },
"create_event_with_source":
{ Args: { "p_event": Json,"p_occurrences"?: Json,"p_source_checked_at"?: string }; Returns: string
                           },
"decode_event_url_component":
{ Args: { "p_plus_as_space"?: boolean,"p_value": string }; Returns: string
                           },
"delete_event_and_exclude":
{ Args: { "p_event_id": string,"p_reason"?: string }; Returns: string
                           },
"event_deletion_identity_key":
{ Args: { "p_kind": string,"p_namespace": string,"p_value": string }; Returns: string
                           },
"event_deletion_identity_keys":
{ Args: { "p_external_id"?: string,"p_slug": string,"p_source_url": string }; Returns: {
              "identity_key": string,"identity_value": string,"kind": string,"source_namespace": string,"source_url": string
            }[]
                           },
"event_source_global_namespace":
{ Args: { "p_source_url": string }; Returns: string
                           },
"event_source_namespace":
{ Args: { "p_source_url": string }; Returns: string
                           },
"extract_event_source_external_id":
{ Args: { "p_source_url": string }; Returns: string
                           },
"increment_event_view":
{ Args: { "p_slug": string }; Returns: number
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_event_collection_excluded":
{ Args: { "p_external_id": string,"p_slug": string,"p_source_url": string }; Returns: boolean
                           },
"lock_event_deletion_identity_keys":
{ Args: { "p_external_id"?: string,"p_slug": string,"p_source_url": string }; Returns: undefined
                           },
"normalize_event_source_url":
{ Args: { "p_source_url": string }; Returns: string
                           },
"release_event_collection_exclusion":
{ Args: { "p_tombstone_id": string }; Returns: boolean
                           },
"update_event_with_source":
{ Args: { "p_event": Json,"p_event_id": string,"p_occurrences"?: Json,"p_source_checked_at"?: string }; Returns: string
                           }
          }
          Enums: {
            "event_category": "performance"|"festival"|"experience"|"education"|"exhibition"|"other","event_review_status": "pending"|"published"|"rejected"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "event_category": ["performance", "festival", "experience", "education", "exhibition", "other"],"event_review_status": ["pending", "published", "rejected"]
          }
        }
} as const
