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
      acupoint_meridians: {
        Row: {
          channel_type: string | null
          code: string
          created_at: string
          id: string
          name_en: string
          name_ru: string
          polarity: string | null
        }
        Insert: {
          channel_type?: string | null
          code: string
          created_at?: string
          id?: string
          name_en: string
          name_ru: string
          polarity?: string | null
        }
        Update: {
          channel_type?: string | null
          code?: string
          created_at?: string
          id?: string
          name_en?: string
          name_ru?: string
          polarity?: string | null
        }
        Relationships: []
      }
      acupoints: {
        Row: {
          chinese: string | null
          contraindications: string | null
          created_at: string
          depth_mm: string | null
          id: string
          indications: string | null
          is_caution: boolean
          location_description: string | null
          manipulation_default: string | null
          meridian_id: string | null
          name_ru: string | null
          pinyin: string | null
          svg_marker_x: number | null
          svg_marker_y: number | null
          svg_view: string | null
          who_code: string
        }
        Insert: {
          chinese?: string | null
          contraindications?: string | null
          created_at?: string
          depth_mm?: string | null
          id?: string
          indications?: string | null
          is_caution?: boolean
          location_description?: string | null
          manipulation_default?: string | null
          meridian_id?: string | null
          name_ru?: string | null
          pinyin?: string | null
          svg_marker_x?: number | null
          svg_marker_y?: number | null
          svg_view?: string | null
          who_code: string
        }
        Update: {
          chinese?: string | null
          contraindications?: string | null
          created_at?: string
          depth_mm?: string | null
          id?: string
          indications?: string | null
          is_caution?: boolean
          location_description?: string | null
          manipulation_default?: string | null
          meridian_id?: string | null
          name_ru?: string | null
          pinyin?: string | null
          svg_marker_x?: number | null
          svg_marker_y?: number | null
          svg_view?: string | null
          who_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "acupoints_meridian_id_fkey"
            columns: ["meridian_id"]
            isOneToOne: false
            referencedRelation: "acupoint_meridians"
            referencedColumns: ["id"]
          },
        ]
      }
      acupuncture_protocol_points: {
        Row: {
          acupoint_id: string
          created_at: string
          depth_mm: string | null
          ea_duration_min: number | null
          ea_freq_hz: number | null
          ea_pair_with: string | null
          id: string
          manipulation: string | null
          moxa: boolean
          notes: string | null
          order_index: number
          protocol_id: string
          retention_min: number | null
          side: string | null
        }
        Insert: {
          acupoint_id: string
          created_at?: string
          depth_mm?: string | null
          ea_duration_min?: number | null
          ea_freq_hz?: number | null
          ea_pair_with?: string | null
          id?: string
          manipulation?: string | null
          moxa?: boolean
          notes?: string | null
          order_index?: number
          protocol_id: string
          retention_min?: number | null
          side?: string | null
        }
        Update: {
          acupoint_id?: string
          created_at?: string
          depth_mm?: string | null
          ea_duration_min?: number | null
          ea_freq_hz?: number | null
          ea_pair_with?: string | null
          id?: string
          manipulation?: string | null
          moxa?: boolean
          notes?: string | null
          order_index?: number
          protocol_id?: string
          retention_min?: number | null
          side?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acupuncture_protocol_points_acupoint_id_fkey"
            columns: ["acupoint_id"]
            isOneToOne: false
            referencedRelation: "acupoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acupuncture_protocol_points_ea_pair_with_fkey"
            columns: ["ea_pair_with"]
            isOneToOne: false
            referencedRelation: "acupoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acupuncture_protocol_points_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "acupuncture_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      acupuncture_protocols: {
        Row: {
          contraindications: string | null
          created_at: string
          created_by: string | null
          description: string | null
          frequency: string | null
          id: string
          indications: string | null
          is_archived: boolean
          is_template: boolean
          name: string
          session_count: number | null
          session_duration_min: number | null
          slug: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          contraindications?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          indications?: string | null
          is_archived?: boolean
          is_template?: boolean
          name: string
          session_count?: number | null
          session_duration_min?: number | null
          slug?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          contraindications?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          indications?: string | null
          is_archived?: boolean
          is_template?: boolean
          name?: string
          session_count?: number | null
          session_duration_min?: number | null
          slug?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_smoke_checks: {
        Row: {
          created_at: string
          deploy_id: string | null
          deploy_status: string | null
          error: string | null
          id: string
          label: string
          latency_ms: number | null
          route: string
          status: string
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          deploy_id?: string | null
          deploy_status?: string | null
          error?: string | null
          id?: string
          label: string
          latency_ms?: number | null
          route: string
          status: string
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          deploy_id?: string | null
          deploy_status?: string | null
          error?: string | null
          id?: string
          label?: string
          latency_ms?: number | null
          route?: string
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      agent_runs: {
        Row: {
          created_at: string
          final_answer: string | null
          id: string
          model: string
          patient_id: string | null
          pending_approval: Json | null
          status: string
          steps: Json
          task: string
          total_steps: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          final_answer?: string | null
          id?: string
          model?: string
          patient_id?: string | null
          pending_approval?: Json | null
          status?: string
          steps?: Json
          task: string
          total_steps?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          final_answer?: string | null
          id?: string
          model?: string
          patient_id?: string | null
          pending_approval?: Json | null
          status?: string
          steps?: Json
          task?: string
          total_steps?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversation_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          model: string | null
          patient_id: string | null
          patient_name: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          model?: string | null
          patient_id?: string | null
          patient_name?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          model?: string | null
          patient_id?: string | null
          patient_name?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "ai_conversation_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          attachments: Json
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_cost: number | null
          image_model: string | null
          image_path: string | null
          image_refs: string[] | null
          model: string | null
          role: string
          user_id: string
        }
        Insert: {
          attachments?: Json
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          image_cost?: number | null
          image_model?: string | null
          image_path?: string | null
          image_refs?: string[] | null
          model?: string | null
          role: string
          user_id: string
        }
        Update: {
          attachments?: Json
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_cost?: number | null
          image_model?: string | null
          image_path?: string | null
          image_refs?: string[] | null
          model?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_batches: {
        Row: {
          chain_log: Json
          conversation_id: string | null
          created_at: string
          error: string | null
          file_paths: string[]
          final_result: string | null
          id: string
          model: string
          partial_results: Json
          processed_files: number
          status: string
          subbatch_size: number
          task: string
          total_files: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chain_log?: Json
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          file_paths?: string[]
          final_result?: string | null
          id?: string
          model?: string
          partial_results?: Json
          processed_files?: number
          status?: string
          subbatch_size?: number
          task: string
          total_files?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chain_log?: Json
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          file_paths?: string[]
          final_result?: string | null
          id?: string
          model?: string
          partial_results?: Json
          processed_files?: number
          status?: string
          subbatch_size?: number
          task?: string
          total_files?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_batches_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_cache: {
        Row: {
          cache_key: string
          computed_at: string
          payload: Json
        }
        Insert: {
          cache_key: string
          computed_at?: string
          payload: Json
        }
        Update: {
          cache_key?: string
          computed_at?: string
          payload?: Json
        }
        Relationships: []
      }
      anthropometry_measurements: {
        Row: {
          age_months: number | null
          bmi: number | null
          bmi_percentile: number | null
          bmi_z_score: number | null
          bsa: number | null
          created_at: string
          foot_length_cm: number | null
          harmony: string | null
          head_circumference_cm: number | null
          head_percentile: number | null
          head_z_score: number | null
          height_cm: number | null
          height_percentile: number | null
          height_z_score: number | null
          id: string
          measurement_date: string
          notes: string | null
          patient_id: string
          penile_circumference_cm: number | null
          penile_length_cm: number | null
          physical_development: string | null
          reference_standard: string | null
          sex: string
          shoe_size_ru: number | null
          tanner_stage: number | null
          updated_at: string
          waist_circumference_cm: number | null
          waist_height_ratio: number | null
          weight_kg: number | null
          weight_percentile: number | null
          weight_z_score: number | null
        }
        Insert: {
          age_months?: number | null
          bmi?: number | null
          bmi_percentile?: number | null
          bmi_z_score?: number | null
          bsa?: number | null
          created_at?: string
          foot_length_cm?: number | null
          harmony?: string | null
          head_circumference_cm?: number | null
          head_percentile?: number | null
          head_z_score?: number | null
          height_cm?: number | null
          height_percentile?: number | null
          height_z_score?: number | null
          id?: string
          measurement_date?: string
          notes?: string | null
          patient_id: string
          penile_circumference_cm?: number | null
          penile_length_cm?: number | null
          physical_development?: string | null
          reference_standard?: string | null
          sex?: string
          shoe_size_ru?: number | null
          tanner_stage?: number | null
          updated_at?: string
          waist_circumference_cm?: number | null
          waist_height_ratio?: number | null
          weight_kg?: number | null
          weight_percentile?: number | null
          weight_z_score?: number | null
        }
        Update: {
          age_months?: number | null
          bmi?: number | null
          bmi_percentile?: number | null
          bmi_z_score?: number | null
          bsa?: number | null
          created_at?: string
          foot_length_cm?: number | null
          harmony?: string | null
          head_circumference_cm?: number | null
          head_percentile?: number | null
          head_z_score?: number | null
          height_cm?: number | null
          height_percentile?: number | null
          height_z_score?: number | null
          id?: string
          measurement_date?: string
          notes?: string | null
          patient_id?: string
          penile_circumference_cm?: number | null
          penile_length_cm?: number | null
          physical_development?: string | null
          reference_standard?: string | null
          sex?: string
          shoe_size_ru?: number | null
          tanner_stage?: number | null
          updated_at?: string
          waist_circumference_cm?: number | null
          waist_height_ratio?: number | null
          weight_kg?: number | null
          weight_percentile?: number | null
          weight_z_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "anthropometry_measurements_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_requests: {
        Row: {
          child_age: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          notes: string | null
          parent_name: string | null
          problem_description: string
          status: string
          updated_at: string
        }
        Insert: {
          child_age: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          parent_name?: string | null
          problem_description: string
          status?: string
          updated_at?: string
        }
        Update: {
          child_age?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          parent_name?: string | null
          problem_description?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      article_dictations: {
        Row: {
          audio_paths: string[]
          cleaned_dictation: string | null
          cleaning_model: string | null
          created_at: string
          fragments: Json
          id: string
          raw_dictation: string
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_paths?: string[]
          cleaned_dictation?: string | null
          cleaning_model?: string | null
          created_at?: string
          fragments?: Json
          id?: string
          raw_dictation?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_paths?: string[]
          cleaned_dictation?: string | null
          cleaning_model?: string | null
          created_at?: string
          fragments?: Json
          id?: string
          raw_dictation?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          author_email: string
          content: string
          created_at: string
          id: string
          is_approved: boolean
          post_id: string
          user_id: string
        }
        Insert: {
          author_email: string
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          post_id: string
          user_id: string
        }
        Update: {
          author_email?: string
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_images: {
        Row: {
          created_at: string
          id: string
          image_path: string
          object_position: string
          post_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_path: string
          object_position?: string
          post_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string
          object_position?: string
          post_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          card_annotation: string | null
          card_background_path: string | null
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_path: string | null
          is_published: boolean
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          card_annotation?: string | null
          card_background_path?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_path?: string | null
          is_published?: boolean
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          card_annotation?: string | null
          card_background_path?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_path?: string | null
          is_published?: boolean
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          created_at: string
          id: string
          image_path: string
          is_published: boolean
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path: string
          is_published?: boolean
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string
          is_published?: boolean
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklist_responses: {
        Row: {
          anonymous_id: string | null
          answers: Json
          checklist_slug: string
          created_at: string
          duration_sec: number | null
          id: string
          result_level: string
          result_score: number | null
          user_agent: string | null
        }
        Insert: {
          anonymous_id?: string | null
          answers: Json
          checklist_slug: string
          created_at?: string
          duration_sec?: number | null
          id?: string
          result_level: string
          result_score?: number | null
          user_agent?: string | null
        }
        Update: {
          anonymous_id?: string | null
          answers?: Json
          checklist_slug?: string
          created_at?: string
          duration_sec?: number | null
          id?: string
          result_level?: string
          result_score?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      clinical_case_images: {
        Row: {
          caption: string | null
          case_id: string
          created_at: string
          id: string
          image_path: string
          sort_order: number | null
        }
        Insert: {
          caption?: string | null
          case_id: string
          created_at?: string
          id?: string
          image_path: string
          sort_order?: number | null
        }
        Update: {
          caption?: string | null
          case_id?: string
          created_at?: string
          id?: string
          image_path?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_case_images_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "clinical_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_cases: {
        Row: {
          category: Database["public"]["Enums"]["case_category"]
          conclusions: string | null
          created_at: string
          history: string
          id: string
          is_published: boolean
          recommendations: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["case_category"]
          conclusions?: string | null
          created_at?: string
          history: string
          id?: string
          is_published?: boolean
          recommendations?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["case_category"]
          conclusions?: string | null
          created_at?: string
          history?: string
          id?: string
          is_published?: boolean
          recommendations?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      complaint_repertorizations: {
        Row: {
          complaint: string
          created_at: string
          id: string
          notes: string | null
          patient_id: string | null
          ranking: Json
          selected_remedies: Json
          selected_rubrics: Json
          statements: Json
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          complaint: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          ranking?: Json
          selected_remedies?: Json
          selected_rubrics?: Json
          statements?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          complaint?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          ranking?: Json
          selected_remedies?: Json
          selected_rubrics?: Json
          statements?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_repertorizations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_cases: {
        Row: {
          created_at: string
          has_insurance: boolean | null
          id: string
          notification_email: string | null
          parent_name: string | null
          parent_phone: string | null
          parent_telegram: string | null
          parent_whatsapp: string | null
          patient_acknowledged_at: string | null
          patient_full_name: string
          patient_next_step: string | null
          patient_telegram: string | null
          patient_whatsapp: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          has_insurance?: boolean | null
          id?: string
          notification_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_telegram?: string | null
          parent_whatsapp?: string | null
          patient_acknowledged_at?: string | null
          patient_full_name?: string
          patient_next_step?: string | null
          patient_telegram?: string | null
          patient_whatsapp?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          has_insurance?: boolean | null
          id?: string
          notification_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_telegram?: string | null
          parent_whatsapp?: string | null
          patient_acknowledged_at?: string | null
          patient_full_name?: string
          patient_next_step?: string | null
          patient_telegram?: string | null
          patient_whatsapp?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consultation_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          round_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type?: string
          id?: string
          round_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          round_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_documents_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "consultation_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_rounds: {
        Row: {
          ai_assessment: string | null
          ai_assessment_date: string | null
          case_id: string
          complaints: string | null
          created_at: string
          doctor_conclusion: string | null
          doctor_conclusion_date: string | null
          id: string
          is_complete: boolean | null
          medical_history: string | null
          round_number: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_assessment?: string | null
          ai_assessment_date?: string | null
          case_id: string
          complaints?: string | null
          created_at?: string
          doctor_conclusion?: string | null
          doctor_conclusion_date?: string | null
          id?: string
          is_complete?: boolean | null
          medical_history?: string | null
          round_number?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_assessment?: string | null
          ai_assessment_date?: string | null
          case_id?: string
          complaints?: string | null
          created_at?: string
          doctor_conclusion?: string | null
          doctor_conclusion_date?: string | null
          id?: string
          is_complete?: boolean | null
          medical_history?: string | null
          round_number?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_rounds_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "consultation_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      content_translations: {
        Row: {
          auto_generated: boolean
          card_annotation: string | null
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          keywords: string[]
          locale: string
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          source_hash: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          auto_generated?: boolean
          card_annotation?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          keywords?: string[]
          locale?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          source_hash?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          auto_generated?: boolean
          card_annotation?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          keywords?: string[]
          locale?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          source_hash?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      diagnosis_recommendations: {
        Row: {
          category: string
          created_at: string
          diagnosis_group: string
          icd_code: string | null
          id: string
          is_base: boolean
          item_text: string
          keywords: string[]
          sort_order: number
          subtype: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          diagnosis_group: string
          icd_code?: string | null
          id?: string
          is_base?: boolean
          item_text: string
          keywords?: string[]
          sort_order?: number
          subtype: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          diagnosis_group?: string
          icd_code?: string | null
          id?: string
          is_base?: boolean
          item_text?: string
          keywords?: string[]
          sort_order?: number
          subtype?: string
          updated_at?: string
        }
        Relationships: []
      }
      diet_recommendations: {
        Row: {
          category: string
          created_at: string
          diet_label: string
          diet_type: string
          id: string
          is_recommended: boolean
          item_text: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          diet_label: string
          diet_type: string
          id?: string
          is_recommended?: boolean
          item_text: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          diet_label?: string
          diet_type?: string
          id?: string
          is_recommended?: boolean
          item_text?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      disease_article_drafts: {
        Row: {
          article_id: string | null
          chunks: Json
          content: string
          created_at: string
          description: string | null
          draft_key: string
          error_message: string | null
          format_progress: string | null
          format_status: string
          formatted_content: string
          id: string
          last_chunk_done: number
          slug: string | null
          tags: string | null
          title: string | null
          total_chunks: number
          updated_at: string
          user_id: string
        }
        Insert: {
          article_id?: string | null
          chunks?: Json
          content?: string
          created_at?: string
          description?: string | null
          draft_key: string
          error_message?: string | null
          format_progress?: string | null
          format_status?: string
          formatted_content?: string
          id?: string
          last_chunk_done?: number
          slug?: string | null
          tags?: string | null
          title?: string | null
          total_chunks?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          article_id?: string | null
          chunks?: Json
          content?: string
          created_at?: string
          description?: string | null
          draft_key?: string
          error_message?: string | null
          format_progress?: string | null
          format_status?: string
          formatted_content?: string
          id?: string
          last_chunk_done?: number
          slug?: string | null
          tags?: string | null
          title?: string | null
          total_chunks?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      disease_articles: {
        Row: {
          age_group: string
          article_content: string | null
          audio_path: string | null
          bento_image_1: Json | null
          bento_image_2: Json | null
          bento_image_3: Json | null
          card_annotation: string | null
          card_background_path: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          keywords: string[] | null
          slug: string
          sort_order: number | null
          thumbnail_path: string | null
          title: string
          updated_at: string
          video_path: string | null
        }
        Insert: {
          age_group?: string
          article_content?: string | null
          audio_path?: string | null
          bento_image_1?: Json | null
          bento_image_2?: Json | null
          bento_image_3?: Json | null
          card_annotation?: string | null
          card_background_path?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          keywords?: string[] | null
          slug: string
          sort_order?: number | null
          thumbnail_path?: string | null
          title: string
          updated_at?: string
          video_path?: string | null
        }
        Update: {
          age_group?: string
          article_content?: string | null
          audio_path?: string | null
          bento_image_1?: Json | null
          bento_image_2?: Json | null
          bento_image_3?: Json | null
          card_annotation?: string | null
          card_background_path?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          keywords?: string[] | null
          slug?: string
          sort_order?: number | null
          thumbnail_path?: string | null
          title?: string
          updated_at?: string
          video_path?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      embedding_batches: {
        Row: {
          chain_log: Json
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          partial_results: Json
          processed_rubrics: number
          rubric_ids: string[]
          status: string
          subbatch_size: number
          total_rubrics: number
          updated_at: string
        }
        Insert: {
          chain_log?: Json
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          partial_results?: Json
          processed_rubrics?: number
          rubric_ids: string[]
          status?: string
          subbatch_size?: number
          total_rubrics?: number
          updated_at?: string
        }
        Update: {
          chain_log?: Json
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          partial_results?: Json
          processed_rubrics?: number
          rubric_ids?: string[]
          status?: string
          subbatch_size?: number
          total_rubrics?: number
          updated_at?: string
        }
        Relationships: []
      }
      extemporaneous_ingredients: {
        Row: {
          amount: string
          created_at: string
          id: string
          ingredient_name: string
          prescription_id: string
          sort_order: number | null
          unit: string
        }
        Insert: {
          amount: string
          created_at?: string
          id?: string
          ingredient_name: string
          prescription_id: string
          sort_order?: number | null
          unit?: string
        }
        Update: {
          amount?: string
          created_at?: string
          id?: string
          ingredient_name?: string
          prescription_id?: string
          sort_order?: number | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "extemporaneous_ingredients_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      extemporaneous_substances: {
        Row: {
          category: string
          compatible_forms: Database["public"]["Enums"]["extemporaneous_form_type"][]
          created_at: string
          default_unit: string
          description: string | null
          id: string
          is_base: boolean
          latin_name: string
          russian_name: string
        }
        Insert: {
          category?: string
          compatible_forms?: Database["public"]["Enums"]["extemporaneous_form_type"][]
          created_at?: string
          default_unit?: string
          description?: string | null
          id?: string
          is_base?: boolean
          latin_name: string
          russian_name: string
        }
        Update: {
          category?: string
          compatible_forms?: Database["public"]["Enums"]["extemporaneous_form_type"][]
          created_at?: string
          default_unit?: string
          description?: string | null
          id?: string
          is_base?: boolean
          latin_name?: string
          russian_name?: string
        }
        Relationships: []
      }
      icd10_codes: {
        Row: {
          category: string | null
          code: string
          created_at: string
          name_ru: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          name_ru: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          name_ru?: string
        }
        Relationships: []
      }
      image_references: {
        Row: {
          created_at: string
          description: string | null
          id: string
          path: string
          source_message_id: string | null
          tags: string[]
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          path: string
          source_message_id?: string | null
          tags?: string[]
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          path?: string
          source_message_id?: string | null
          tags?: string[]
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lab_results: {
        Row: {
          confidence: number | null
          consultation_case_id: string | null
          created_at: string
          id: string
          is_abnormal: boolean | null
          needs_review: boolean
          notes: string | null
          patient_id: string | null
          reference_max: number | null
          reference_min: number | null
          source_document: string | null
          test_code: string | null
          test_date: string
          test_group: string
          test_name: string
          unit: string
          updated_at: string
          value: number
        }
        Insert: {
          confidence?: number | null
          consultation_case_id?: string | null
          created_at?: string
          id?: string
          is_abnormal?: boolean | null
          needs_review?: boolean
          notes?: string | null
          patient_id?: string | null
          reference_max?: number | null
          reference_min?: number | null
          source_document?: string | null
          test_code?: string | null
          test_date?: string
          test_group: string
          test_name: string
          unit: string
          updated_at?: string
          value: number
        }
        Update: {
          confidence?: number | null
          consultation_case_id?: string | null
          created_at?: string
          id?: string
          is_abnormal?: boolean | null
          needs_review?: boolean
          notes?: string | null
          patient_id?: string | null
          reference_max?: number | null
          reference_min?: number | null
          source_document?: string | null
          test_code?: string | null
          test_date?: string
          test_group?: string
          test_name?: string
          unit?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_consultation_case_id_fkey"
            columns: ["consultation_case_id"]
            isOneToOne: false
            referencedRelation: "consultation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_synonyms_queue: {
        Row: {
          consultation_case_id: string | null
          created_at: string
          id: string
          patient_id: string | null
          raw_name: string
          raw_unit: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_document: string | null
          status: string
          suggested_test_id: string | null
          suggested_test_name: string | null
          updated_at: string
        }
        Insert: {
          consultation_case_id?: string | null
          created_at?: string
          id?: string
          patient_id?: string | null
          raw_name: string
          raw_unit?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_document?: string | null
          status?: string
          suggested_test_id?: string | null
          suggested_test_name?: string | null
          updated_at?: string
        }
        Update: {
          consultation_case_id?: string | null
          created_at?: string
          id?: string
          patient_id?: string | null
          raw_name?: string
          raw_unit?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_document?: string | null
          status?: string
          suggested_test_id?: string | null
          suggested_test_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_synonyms_queue_consultation_case_id_fkey"
            columns: ["consultation_case_id"]
            isOneToOne: false
            referencedRelation: "consultation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_synonyms_queue_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_synonyms_queue_suggested_test_id_fkey"
            columns: ["suggested_test_id"]
            isOneToOne: false
            referencedRelation: "lab_tests_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_tests_catalog: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          kdl_slug: string | null
          name: string
          notes: string | null
          pathway_node_refs: Json
          price_auto: number | null
          price_auto_sources: Json | null
          price_auto_updated_at: string | null
          price_avg: number | null
          ref_range_male: string | null
          reference_ranges: Json
          short_name: string | null
          synonyms: Json
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          kdl_slug?: string | null
          name: string
          notes?: string | null
          pathway_node_refs?: Json
          price_auto?: number | null
          price_auto_sources?: Json | null
          price_auto_updated_at?: string | null
          price_avg?: number | null
          ref_range_male?: string | null
          reference_ranges?: Json
          short_name?: string | null
          synonyms?: Json
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          kdl_slug?: string | null
          name?: string
          notes?: string | null
          pathway_node_refs?: Json
          price_auto?: number | null
          price_auto_sources?: Json | null
          price_auto_updated_at?: string | null
          price_avg?: number | null
          ref_range_male?: string | null
          reference_ranges?: Json
          short_name?: string | null
          synonyms?: Json
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      map_findings: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          label: string
          map_id: string
          node_id: string | null
          pathway_id: string | null
          severity: string
          source_ref: Json
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          label: string
          map_id: string
          node_id?: string | null
          pathway_id?: string | null
          severity?: string
          source_ref?: Json
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          label?: string
          map_id?: string
          node_id?: string | null
          pathway_id?: string | null
          severity?: string
          source_ref?: Json
        }
        Relationships: [
          {
            foreignKeyName: "map_findings_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "metabolic_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_findings_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      map_pathway_reviews: {
        Row: {
          ai_status: string | null
          created_at: string
          divergence: string | null
          id: string
          kept: string
          map_id: string
          note: string | null
          pathway_id: string
          reviewer_id: string | null
          rules_status: string | null
          updated_at: string
        }
        Insert: {
          ai_status?: string | null
          created_at?: string
          divergence?: string | null
          id?: string
          kept: string
          map_id: string
          note?: string | null
          pathway_id: string
          reviewer_id?: string | null
          rules_status?: string | null
          updated_at?: string
        }
        Update: {
          ai_status?: string | null
          created_at?: string
          divergence?: string | null
          id?: string
          kept?: string
          map_id?: string
          note?: string | null
          pathway_id?: string
          reviewer_id?: string | null
          rules_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_pathway_reviews_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "metabolic_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_pathway_reviews_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      map_recommendations: {
        Row: {
          age_warning: string | null
          application_point: string | null
          catalog_id: string | null
          contra_warning: string | null
          created_at: string
          evidence_level: number
          finding_ids: string[]
          id: string
          include_in_print: boolean
          is_accepted: boolean | null
          is_manual: boolean
          map_id: string
          pathway_id: string | null
          priority: number
          rationale: string | null
          target_node_id: string | null
          updated_at: string
        }
        Insert: {
          age_warning?: string | null
          application_point?: string | null
          catalog_id?: string | null
          contra_warning?: string | null
          created_at?: string
          evidence_level?: number
          finding_ids?: string[]
          id?: string
          include_in_print?: boolean
          is_accepted?: boolean | null
          is_manual?: boolean
          map_id: string
          pathway_id?: string | null
          priority?: number
          rationale?: string | null
          target_node_id?: string | null
          updated_at?: string
        }
        Update: {
          age_warning?: string | null
          application_point?: string | null
          catalog_id?: string | null
          contra_warning?: string | null
          created_at?: string
          evidence_level?: number
          finding_ids?: string[]
          id?: string
          include_in_print?: boolean
          is_accepted?: boolean | null
          is_manual?: boolean
          map_id?: string
          pathway_id?: string | null
          priority?: number
          rationale?: string | null
          target_node_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_recommendations_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "treatment_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_recommendations_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "metabolic_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_recommendations_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      map_schemas: {
        Row: {
          created_at: string
          id: string
          map_id: string
          pathway_code: string
          scene: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          map_id: string
          pathway_code: string
          scene: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          map_id?: string
          pathway_code?: string
          scene?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_schemas_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "metabolic_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      materia_medica_sections: {
        Row: {
          body: string
          body_ru: string | null
          created_at: string
          heading: string
          id: string
          remedy_id: string
          source: string
          source_url: string | null
          updated_at: string
        }
        Insert: {
          body: string
          body_ru?: string | null
          created_at?: string
          heading: string
          id?: string
          remedy_id: string
          source?: string
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          body_ru?: string | null
          created_at?: string
          heading?: string
          id?: string
          remedy_id?: string
          source?: string
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materia_medica_sections_remedy_id_fkey"
            columns: ["remedy_id"]
            isOneToOne: false
            referencedRelation: "repertory_remedies"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_digests: {
        Row: {
          contraindications: string | null
          created_at: string
          dosage_info: string | null
          id: string
          indications: string | null
          medication_name: string
          pharmacological_group: string | null
          synonyms: string | null
          updated_at: string
        }
        Insert: {
          contraindications?: string | null
          created_at?: string
          dosage_info?: string | null
          id?: string
          indications?: string | null
          medication_name: string
          pharmacological_group?: string | null
          synonyms?: string | null
          updated_at?: string
        }
        Update: {
          contraindications?: string | null
          created_at?: string
          dosage_info?: string | null
          id?: string
          indications?: string | null
          medication_name?: string
          pharmacological_group?: string | null
          synonyms?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          created_at: string
          dosage: string | null
          dosage_form: string | null
          id: string
          latin_name: string
          trade_name: string | null
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          dosage_form?: string | null
          id?: string
          latin_name: string
          trade_name?: string | null
        }
        Update: {
          created_at?: string
          dosage?: string | null
          dosage_form?: string | null
          id?: string
          latin_name?: string
          trade_name?: string | null
        }
        Relationships: []
      }
      memo_send_log: {
        Row: {
          channel: string
          content_kind: string
          error: string | null
          id: string
          plan_id: string
          recipient: string | null
          sent_at: string
          sent_by: string | null
          status: string
        }
        Insert: {
          channel: string
          content_kind: string
          error?: string | null
          id?: string
          plan_id: string
          recipient?: string | null
          sent_at?: string
          sent_by?: string | null
          status: string
        }
        Update: {
          channel?: string
          content_kind?: string
          error?: string | null
          id?: string
          plan_id?: string
          recipient?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "memo_send_log_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memo_send_log_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans_search"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      metabolic_map_snapshots: {
        Row: {
          created_at: string
          created_by: string | null
          findings: Json
          id: string
          pathway_status: Json
          patient_id: string
          snapshot_date: string
          visit_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          findings?: Json
          id?: string
          pathway_status?: Json
          patient_id: string
          snapshot_date?: string
          visit_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          findings?: Json
          id?: string
          pathway_status?: Json
          patient_id?: string
          snapshot_date?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metabolic_map_snapshots_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metabolic_map_snapshots_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "patient_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      metabolic_maps: {
        Row: {
          aggregate_summary: Json
          created_at: string
          created_by: string | null
          id: string
          last_aggregated_at: string | null
          meta: Json
          notes: string | null
          patient_id: string
          source_visit_id: string | null
          updated_at: string
        }
        Insert: {
          aggregate_summary?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          last_aggregated_at?: string | null
          meta?: Json
          notes?: string | null
          patient_id: string
          source_visit_id?: string | null
          updated_at?: string
        }
        Update: {
          aggregate_summary?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          last_aggregated_at?: string | null
          meta?: Json
          notes?: string | null
          patient_id?: string
          source_visit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metabolic_maps_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      mm_import_jobs: {
        Row: {
          chain_log: Json
          created_at: string
          created_by: string | null
          cursor_idx: number
          error: string | null
          failed: number
          id: string
          inserted_sections: number
          processed_remedies: number
          skipped: number
          source: string
          status: string
          total_remedies: number
          updated_at: string
        }
        Insert: {
          chain_log?: Json
          created_at?: string
          created_by?: string | null
          cursor_idx?: number
          error?: string | null
          failed?: number
          id?: string
          inserted_sections?: number
          processed_remedies?: number
          skipped?: number
          source?: string
          status?: string
          total_remedies?: number
          updated_at?: string
        }
        Update: {
          chain_log?: Json
          created_at?: string
          created_by?: string | null
          cursor_idx?: number
          error?: string | null
          failed?: number
          id?: string
          inserted_sections?: number
          processed_remedies?: number
          skipped?: number
          source?: string
          status?: string
          total_remedies?: number
          updated_at?: string
        }
        Relationships: []
      }
      operations_journal: {
        Row: {
          assistant_name: string | null
          child_notes: string | null
          communication_notes: string | null
          complications: string | null
          created_at: string
          diagnosis: string
          id: string
          operation_date: string
          operation_name: string
          parent_notes: string | null
          patient_birth_date: string
          patient_name: string
          postop_course: string | null
          protocol_notes: string | null
          surgeon_name: string
          updated_at: string
        }
        Insert: {
          assistant_name?: string | null
          child_notes?: string | null
          communication_notes?: string | null
          complications?: string | null
          created_at?: string
          diagnosis: string
          id?: string
          operation_date?: string
          operation_name: string
          parent_notes?: string | null
          patient_birth_date: string
          patient_name: string
          postop_course?: string | null
          protocol_notes?: string | null
          surgeon_name?: string
          updated_at?: string
        }
        Update: {
          assistant_name?: string | null
          child_notes?: string | null
          communication_notes?: string | null
          complications?: string | null
          created_at?: string
          diagnosis?: string
          id?: string
          operation_date?: string
          operation_name?: string
          parent_notes?: string | null
          patient_birth_date?: string
          patient_name?: string
          postop_course?: string | null
          protocol_notes?: string | null
          surgeon_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      orchestrator_call_metrics: {
        Row: {
          attempt: number
          created_at: string
          duration_ms: number
          error_kind: string | null
          error_message: string | null
          id: number
          model: string
          ok: boolean
          purpose: string
        }
        Insert: {
          attempt: number
          created_at?: string
          duration_ms: number
          error_kind?: string | null
          error_message?: string | null
          id?: number
          model: string
          ok: boolean
          purpose: string
        }
        Update: {
          attempt?: number
          created_at?: string
          duration_ms?: number
          error_kind?: string | null
          error_message?: string | null
          id?: number
          model?: string
          ok?: boolean
          purpose?: string
        }
        Relationships: []
      }
      parents_material_leads: {
        Row: {
          consent: boolean
          created_at: string
          email: string | null
          id: string
          material_id: string
          name: string | null
          phone: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          consent?: boolean
          created_at?: string
          email?: string | null
          id?: string
          material_id: string
          name?: string | null
          phone?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          consent?: boolean
          created_at?: string
          email?: string | null
          id?: string
          material_id?: string
          name?: string | null
          phone?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parents_material_leads_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "parents_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      parents_materials: {
        Row: {
          audience: string | null
          created_at: string
          description: string | null
          description_en: string | null
          download_count: number
          emoji: string | null
          file_path: string | null
          file_size_bytes: number | null
          gated: boolean
          id: string
          image_path: string | null
          image_url: string | null
          is_published: boolean
          kind: string
          long_description: string | null
          long_description_en: string | null
          og_image_path: string | null
          pages_count: number | null
          seo_description: string | null
          seo_description_en: string | null
          seo_title: string | null
          seo_title_en: string | null
          slug: string | null
          sort_order: number
          source: string | null
          title: string
          title_en: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          audience?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          download_count?: number
          emoji?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          gated?: boolean
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_published?: boolean
          kind: string
          long_description?: string | null
          long_description_en?: string | null
          og_image_path?: string | null
          pages_count?: number | null
          seo_description?: string | null
          seo_description_en?: string | null
          seo_title?: string | null
          seo_title_en?: string | null
          slug?: string | null
          sort_order?: number
          source?: string | null
          title: string
          title_en?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          audience?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          download_count?: number
          emoji?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          gated?: boolean
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_published?: boolean
          kind?: string
          long_description?: string | null
          long_description_en?: string | null
          og_image_path?: string | null
          pages_count?: number | null
          seo_description?: string | null
          seo_description_en?: string | null
          seo_title?: string | null
          seo_title_en?: string | null
          slug?: string | null
          sort_order?: number
          source?: string | null
          title?: string
          title_en?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      pathway_schemas: {
        Row: {
          pathway_code: string
          scene: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          pathway_code: string
          scene: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          pathway_code?: string
          scene?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      pathway_severity_texts: {
        Row: {
          created_at: string
          id: string
          pathway_id: string
          severity: string
          text_plain: string | null
          text_pro: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          pathway_id: string
          severity: string
          text_plain?: string | null
          text_pro?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          pathway_id?: string
          severity?: string
          text_plain?: string | null
          text_pro?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathway_severity_texts_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_texts: {
        Row: {
          actions: string | null
          connections: string | null
          created_at: string
          evidence: string | null
          id: string
          pathway_id: string
          register: string
          risks: string | null
          summary: string | null
          updated_at: string
          what_broken: string | null
        }
        Insert: {
          actions?: string | null
          connections?: string | null
          created_at?: string
          evidence?: string | null
          id?: string
          pathway_id: string
          register: string
          risks?: string | null
          summary?: string | null
          updated_at?: string
          what_broken?: string | null
        }
        Update: {
          actions?: string | null
          connections?: string | null
          created_at?: string
          evidence?: string | null
          id?: string
          pathway_id?: string
          register?: string
          risks?: string | null
          summary?: string | null
          updated_at?: string
          what_broken?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pathway_texts_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      pathways: {
        Row: {
          consequences: Json
          created_at: string
          description: string | null
          edges: Json
          group: string | null
          group_order: number | null
          id: string
          is_active: boolean
          name: string
          nodes: Json
          rules: Json
          sex: string | null
          slug: string
          svg_scene: Json | null
          svg_template: string | null
          updated_at: string
        }
        Insert: {
          consequences?: Json
          created_at?: string
          description?: string | null
          edges?: Json
          group?: string | null
          group_order?: number | null
          id?: string
          is_active?: boolean
          name: string
          nodes?: Json
          rules?: Json
          sex?: string | null
          slug: string
          svg_scene?: Json | null
          svg_template?: string | null
          updated_at?: string
        }
        Update: {
          consequences?: Json
          created_at?: string
          description?: string | null
          edges?: Json
          group?: string | null
          group_order?: number | null
          id?: string
          is_active?: boolean
          name?: string
          nodes?: Json
          rules?: Json
          sex?: string | null
          slug?: string
          svg_scene?: Json | null
          svg_template?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      patient_cards: {
        Row: {
          ai_reasoning: string | null
          communication_notes: string | null
          created_at: string
          diagnosis: string | null
          has_insurance: boolean | null
          id: string
          notes: string | null
          parent_name: string | null
          parent_phone: string | null
          parent_telegram: string | null
          parent_whatsapp: string | null
          patient_full_name: string
          patient_specifics: string | null
          patient_telegram: string | null
          patient_whatsapp: string | null
          treatment_plan: string | null
          treatment_tactics: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_reasoning?: string | null
          communication_notes?: string | null
          created_at?: string
          diagnosis?: string | null
          has_insurance?: boolean | null
          id?: string
          notes?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_telegram?: string | null
          parent_whatsapp?: string | null
          patient_full_name?: string
          patient_specifics?: string | null
          patient_telegram?: string | null
          patient_whatsapp?: string | null
          treatment_plan?: string | null
          treatment_tactics?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_reasoning?: string | null
          communication_notes?: string | null
          created_at?: string
          diagnosis?: string | null
          has_insurance?: boolean | null
          id?: string
          notes?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_telegram?: string | null
          parent_whatsapp?: string | null
          patient_full_name?: string
          patient_specifics?: string | null
          patient_telegram?: string | null
          patient_whatsapp?: string | null
          treatment_plan?: string | null
          treatment_tactics?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_diagnosis_timeline: {
        Row: {
          confidence: number | null
          consultation_case_id: string | null
          created_at: string
          created_by: string | null
          diagnosis_text: string
          icd10: string | null
          id: string
          needs_review: boolean
          patient_id: string | null
          source_date: string | null
          source_document: string | null
          source_type: string | null
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          consultation_case_id?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis_text: string
          icd10?: string | null
          id?: string
          needs_review?: boolean
          patient_id?: string | null
          source_date?: string | null
          source_document?: string | null
          source_type?: string | null
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          consultation_case_id?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis_text?: string
          icd10?: string | null
          id?: string
          needs_review?: boolean
          patient_id?: string | null
          source_date?: string | null
          source_document?: string | null
          source_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_diagnosis_timeline_consultation_case_id_fkey"
            columns: ["consultation_case_id"]
            isOneToOne: false
            referencedRelation: "consultation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_diagnosis_timeline_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          card_id: string
          created_at: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          uploaded_by: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_type?: string
          id?: string
          uploaded_by?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          uploaded_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_guardians: {
        Row: {
          created_at: string
          id: string
          patient_id: string
          relation: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id: string
          relation?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string
          relation?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_guardians_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_lab_documents: {
        Row: {
          created_at: string
          created_by: string | null
          document_date: string | null
          document_type: string | null
          file_mime: string | null
          file_url: string | null
          full_text: string | null
          id: string
          notes: string | null
          parsed_summary: string | null
          parsed_values: Json | null
          patient_id: string
          source_lab: string | null
          title: string
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_date?: string | null
          document_type?: string | null
          file_mime?: string | null
          file_url?: string | null
          full_text?: string | null
          id?: string
          notes?: string | null
          parsed_summary?: string | null
          parsed_values?: Json | null
          patient_id: string
          source_lab?: string | null
          title: string
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_date?: string | null
          document_type?: string | null
          file_mime?: string | null
          file_url?: string | null
          full_text?: string | null
          id?: string
          notes?: string | null
          parsed_summary?: string | null
          parsed_values?: Json | null
          patient_id?: string
          source_lab?: string | null
          title?: string
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_lab_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_lab_documents_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "patient_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_visits: {
        Row: {
          created_at: string
          created_by: string | null
          diagnosis: string | null
          icd_code: string | null
          id: string
          next_visit_date: string | null
          patient_id: string
          protocol_data: Json
          protocol_type: string
          updated_at: string
          visit_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          icd_code?: string | null
          id?: string
          next_visit_date?: string | null
          patient_id: string
          protocol_data?: Json
          protocol_type: string
          updated_at?: string
          visit_date?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          icd_code?: string | null
          id?: string
          next_visit_date?: string | null
          patient_id?: string
          protocol_data?: Json
          protocol_type?: string
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string
          history_number: string | null
          id: string
          last_name: string | null
          parent_name: string | null
          patronymic: string | null
          phone: string | null
          sex: string | null
          share_simple_only: boolean
          telegram_username: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name: string
          history_number?: string | null
          id?: string
          last_name?: string | null
          parent_name?: string | null
          patronymic?: string | null
          phone?: string | null
          sex?: string | null
          share_simple_only?: boolean
          telegram_username?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string
          history_number?: string | null
          id?: string
          last_name?: string | null
          parent_name?: string | null
          patronymic?: string | null
          phone?: string | null
          sex?: string | null
          share_simple_only?: boolean
          telegram_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      peptides: {
        Row: {
          composition: string | null
          course_duration: string | null
          created_at: string
          evidence_level: string | null
          expected_effect: string | null
          group_name: string | null
          id: string
          indications: string | null
          is_active: boolean
          monitoring: string | null
          name: string
          notes: string | null
          onco_risk: string | null
          rf_status: string | null
          side_effects: string | null
          sort_order: number
          target_organ: string | null
          typical_schedule: string | null
          updated_at: string
        }
        Insert: {
          composition?: string | null
          course_duration?: string | null
          created_at?: string
          evidence_level?: string | null
          expected_effect?: string | null
          group_name?: string | null
          id?: string
          indications?: string | null
          is_active?: boolean
          monitoring?: string | null
          name: string
          notes?: string | null
          onco_risk?: string | null
          rf_status?: string | null
          side_effects?: string | null
          sort_order?: number
          target_organ?: string | null
          typical_schedule?: string | null
          updated_at?: string
        }
        Update: {
          composition?: string | null
          course_duration?: string | null
          created_at?: string
          evidence_level?: string | null
          expected_effect?: string | null
          group_name?: string | null
          id?: string
          indications?: string | null
          is_active?: boolean
          monitoring?: string | null
          name?: string
          notes?: string | null
          onco_risk?: string | null
          rf_status?: string | null
          side_effects?: string | null
          sort_order?: number
          target_organ?: string | null
          typical_schedule?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      podcasts: {
        Row: {
          audio_url: string | null
          category: string | null
          cover_path: string | null
          created_at: string
          description: string | null
          external_url: string | null
          id: string
          is_published: boolean
          sort_order: number
          source: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          category?: string | null
          cover_path?: string | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          source?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          category?: string | null
          cover_path?: string | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          source?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          created_at: string
          dosage_form: string | null
          dose: string | null
          duration: string | null
          frequency: string | null
          id: string
          medication_latin_name: string
          prescription_id: string
          quantity: number
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          dosage_form?: string | null
          dose?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          medication_latin_name: string
          prescription_id: string
          quantity?: number
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          dosage_form?: string | null
          dose?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          medication_latin_name?: string
          prescription_id?: string
          quantity?: number
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          doctor_name: string
          extemporaneous_form_type: string | null
          id: string
          patient_id: string
          prescription_date: string
          prescription_type: string
          signa: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_name?: string
          extemporaneous_form_type?: string | null
          id?: string
          patient_id: string
          prescription_date?: string
          prescription_type?: string
          signa?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_name?: string
          extemporaneous_form_type?: string | null
          id?: string
          patient_id?: string
          prescription_date?: string
          prescription_type?: string
          signa?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      price_parse_log: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          error: string | null
          id: string
          price_result: number | null
          sources_count: number | null
          status: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          error?: string | null
          id?: string
          price_result?: number | null
          sources_count?: number | null
          status: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          error?: string | null
          id?: string
          price_result?: number | null
          sources_count?: number | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      protocol_template_items: {
        Row: {
          catalog_id: string | null
          created_at: string
          day_pattern: string | null
          dilution_solvent: string | null
          dilution_volume: number | null
          dose: number | null
          dose_unit: string | null
          dosing_schedule: string | null
          duration_days: number | null
          frequency: string | null
          id: string
          infusion_rate: string | null
          name_snapshot: string | null
          notes: string | null
          order_index: number
          potency: string | null
          repertory_remedy_id: string | null
          route_override: string | null
          section_category: Database["public"]["Enums"]["treatment_category"]
          template_id: string
          time_of_day: string[] | null
        }
        Insert: {
          catalog_id?: string | null
          created_at?: string
          day_pattern?: string | null
          dilution_solvent?: string | null
          dilution_volume?: number | null
          dose?: number | null
          dose_unit?: string | null
          dosing_schedule?: string | null
          duration_days?: number | null
          frequency?: string | null
          id?: string
          infusion_rate?: string | null
          name_snapshot?: string | null
          notes?: string | null
          order_index?: number
          potency?: string | null
          repertory_remedy_id?: string | null
          route_override?: string | null
          section_category: Database["public"]["Enums"]["treatment_category"]
          template_id: string
          time_of_day?: string[] | null
        }
        Update: {
          catalog_id?: string | null
          created_at?: string
          day_pattern?: string | null
          dilution_solvent?: string | null
          dilution_volume?: number | null
          dose?: number | null
          dose_unit?: string | null
          dosing_schedule?: string | null
          duration_days?: number | null
          frequency?: string | null
          id?: string
          infusion_rate?: string | null
          name_snapshot?: string | null
          notes?: string | null
          order_index?: number
          potency?: string | null
          repertory_remedy_id?: string | null
          route_override?: string | null
          section_category?: Database["public"]["Enums"]["treatment_category"]
          template_id?: string
          time_of_day?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "protocol_template_items_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "treatment_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_template_items_remedy_id_fkey"
            columns: ["repertory_remedy_id"]
            isOneToOne: false
            referencedRelation: "repertory_remedies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_template_items_repertory_remedy_id_fkey"
            columns: ["repertory_remedy_id"]
            isOneToOne: false
            referencedRelation: "repertory_remedies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "protocol_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_template_items_backup_20260619: {
        Row: {
          catalog_id: string | null
          created_at: string | null
          day_pattern: string | null
          dilution_solvent: string | null
          dilution_volume: number | null
          dose: number | null
          dose_unit: string | null
          dosing_schedule: string | null
          duration_days: number | null
          frequency: string | null
          id: string | null
          infusion_rate: string | null
          name_snapshot: string | null
          notes: string | null
          order_index: number | null
          potency: string | null
          repertory_remedy_id: string | null
          route_override: string | null
          section_category:
            | Database["public"]["Enums"]["treatment_category"]
            | null
          template_id: string | null
          time_of_day: string[] | null
        }
        Insert: {
          catalog_id?: string | null
          created_at?: string | null
          day_pattern?: string | null
          dilution_solvent?: string | null
          dilution_volume?: number | null
          dose?: number | null
          dose_unit?: string | null
          dosing_schedule?: string | null
          duration_days?: number | null
          frequency?: string | null
          id?: string | null
          infusion_rate?: string | null
          name_snapshot?: string | null
          notes?: string | null
          order_index?: number | null
          potency?: string | null
          repertory_remedy_id?: string | null
          route_override?: string | null
          section_category?:
            | Database["public"]["Enums"]["treatment_category"]
            | null
          template_id?: string | null
          time_of_day?: string[] | null
        }
        Update: {
          catalog_id?: string | null
          created_at?: string | null
          day_pattern?: string | null
          dilution_solvent?: string | null
          dilution_volume?: number | null
          dose?: number | null
          dose_unit?: string | null
          dosing_schedule?: string | null
          duration_days?: number | null
          frequency?: string | null
          id?: string | null
          infusion_rate?: string | null
          name_snapshot?: string | null
          notes?: string | null
          order_index?: number | null
          potency?: string | null
          repertory_remedy_id?: string | null
          route_override?: string | null
          section_category?:
            | Database["public"]["Enums"]["treatment_category"]
            | null
          template_id?: string | null
          time_of_day?: string[] | null
        }
        Relationships: []
      }
      protocol_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_days: number | null
          id: string
          is_archived: boolean
          mode: Database["public"]["Enums"]["plan_mode"]
          name: string
          tags: string[] | null
          target_patient: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_days?: number | null
          id?: string
          is_archived?: boolean
          mode?: Database["public"]["Enums"]["plan_mode"]
          name: string
          tags?: string[] | null
          target_patient?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_days?: number | null
          id?: string
          is_archived?: boolean
          mode?: Database["public"]["Enums"]["plan_mode"]
          name?: string
          tags?: string[] | null
          target_patient?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pubmed_search_presets: {
        Row: {
          created_at: string
          filters: Json
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer_text: string | null
          answered_at: string | null
          author_email: string
          author_name: string
          created_at: string
          id: string
          is_published: boolean
          question_text: string
          status: string
          updated_at: string
        }
        Insert: {
          answer_text?: string | null
          answered_at?: string | null
          author_email: string
          author_name: string
          created_at?: string
          id?: string
          is_published?: boolean
          question_text: string
          status?: string
          updated_at?: string
        }
        Update: {
          answer_text?: string | null
          answered_at?: string | null
          author_email?: string
          author_name?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question_text?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      reference_ranges: {
        Row: {
          age_max_years: number
          age_min_years: number
          analyte_code: string
          created_at: string
          id: string
          method: string | null
          phase: string | null
          ref_high: number | null
          ref_low: number | null
          sex: string
          source: string | null
          status: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          age_max_years?: number
          age_min_years?: number
          analyte_code: string
          created_at?: string
          id?: string
          method?: string | null
          phase?: string | null
          ref_high?: number | null
          ref_low?: number | null
          sex: string
          source?: string | null
          status?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          age_max_years?: number
          age_min_years?: number
          analyte_code?: string
          created_at?: string
          id?: string
          method?: string | null
          phase?: string | null
          ref_high?: number | null
          ref_low?: number | null
          sex?: string
          source?: string | null
          status?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referral_specialists: {
        Row: {
          contact_note: string
          created_at: string
          doctor_name: string
          id: string
          is_active: boolean
          phone: string
          sort_order: number
          specialty: string
          updated_at: string
        }
        Insert: {
          contact_note?: string
          created_at?: string
          doctor_name: string
          id?: string
          is_active?: boolean
          phone?: string
          sort_order?: number
          specialty: string
          updated_at?: string
        }
        Update: {
          contact_note?: string
          created_at?: string
          doctor_name?: string
          id?: string
          is_active?: boolean
          phone?: string
          sort_order?: number
          specialty?: string
          updated_at?: string
        }
        Relationships: []
      }
      repertories: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          license: string | null
          name: string
          source: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          license?: string | null
          name: string
          source?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          license?: string | null
          name?: string
          source?: string | null
        }
        Relationships: []
      }
      repertory_chapters: {
        Row: {
          created_at: string
          id: string
          name_en: string
          name_ru: string
          ord: number
        }
        Insert: {
          created_at?: string
          id?: string
          name_en: string
          name_ru: string
          ord: number
        }
        Update: {
          created_at?: string
          id?: string
          name_en?: string
          name_ru?: string
          ord?: number
        }
        Relationships: []
      }
      repertory_remedies: {
        Row: {
          abbrev: string | null
          created_at: string
          id: string
          name_latin: string
          name_ru: string | null
          repertory_id: string | null
          slug: string
        }
        Insert: {
          abbrev?: string | null
          created_at?: string
          id?: string
          name_latin: string
          name_ru?: string | null
          repertory_id?: string | null
          slug: string
        }
        Update: {
          abbrev?: string | null
          created_at?: string
          id?: string
          name_latin?: string
          name_ru?: string | null
          repertory_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "repertory_remedies_repertory_id_fkey"
            columns: ["repertory_id"]
            isOneToOne: false
            referencedRelation: "repertories"
            referencedColumns: ["id"]
          },
        ]
      }
      repertory_rubric_remedies: {
        Row: {
          created_at: string
          grade: number
          id: string
          remedy_id: string
          repertory_id: string
          rubric_id: string
        }
        Insert: {
          created_at?: string
          grade: number
          id?: string
          remedy_id: string
          repertory_id: string
          rubric_id: string
        }
        Update: {
          created_at?: string
          grade?: number
          id?: string
          remedy_id?: string
          repertory_id?: string
          rubric_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repertory_rubric_remedies_remedy_id_fkey"
            columns: ["remedy_id"]
            isOneToOne: false
            referencedRelation: "repertory_remedies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repertory_rubric_remedies_repertory_id_fkey"
            columns: ["repertory_id"]
            isOneToOne: false
            referencedRelation: "repertories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repertory_rubric_remedies_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "repertory_rubrics"
            referencedColumns: ["id"]
          },
        ]
      }
      repertory_rubrics: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          kent_page: number | null
          name: string
          name_ru: string | null
          name_ru_reviewed: boolean
          name_ru_source: string | null
          parent_id: string | null
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          kent_page?: number | null
          name: string
          name_ru?: string | null
          name_ru_reviewed?: boolean
          name_ru_source?: string | null
          parent_id?: string | null
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          kent_page?: number | null
          name?: string
          name_ru?: string | null
          name_ru_reviewed?: boolean
          name_ru_source?: string | null
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repertory_rubrics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "repertory_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repertory_rubrics_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "repertory_rubrics"
            referencedColumns: ["id"]
          },
        ]
      }
      research_article_attachments: {
        Row: {
          article_id: string
          created_at: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          sort_order: number | null
        }
        Insert: {
          article_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_type?: string
          id?: string
          sort_order?: number | null
        }
        Update: {
          article_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "research_article_attachments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "research_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      research_article_comments: {
        Row: {
          article_id: string
          author_email: string
          author_name: string
          content: string
          created_at: string
          id: string
          is_approved: boolean
          user_id: string
        }
        Insert: {
          article_id: string
          author_email: string
          author_name: string
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          user_id: string
        }
        Update: {
          article_id?: string
          author_email?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "research_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      research_article_reactions: {
        Row: {
          article_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_article_reactions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "research_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      research_articles: {
        Row: {
          age_group: string
          category: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_path: string | null
          is_published: boolean
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          age_group?: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_path?: string | null
          is_published?: boolean
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          age_group?: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_path?: string | null
          is_published?: boolean
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_platforms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          last_scraped_at: string | null
          logo_key: string
          platform_name: string
          rating: string | null
          review_count: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          last_scraped_at?: string | null
          logo_key: string
          platform_name: string
          rating?: string | null
          review_count?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          last_scraped_at?: string | null
          logo_key?: string
          platform_name?: string
          rating?: string | null
          review_count?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      rubric_embeddings: {
        Row: {
          embedded_at: string
          embedding: unknown
          model: string
          rubric_id: string
          source_text: string
        }
        Insert: {
          embedded_at?: string
          embedding: unknown
          model?: string
          rubric_id: string
          source_text: string
        }
        Update: {
          embedded_at?: string
          embedding?: unknown
          model?: string
          rubric_id?: string
          source_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubric_embeddings_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: true
            referencedRelation: "repertory_rubrics"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          conditions: string
          created_at: string
          description: string
          experience_years: number
          full_name: string
          id: string
          is_published: boolean
          mission: string
          photo_path: string | null
          professor_opinion: string
          sort_order: number | null
          specialties: string[]
          updated_at: string
        }
        Insert: {
          conditions: string
          created_at?: string
          description: string
          experience_years: number
          full_name: string
          id?: string
          is_published?: boolean
          mission: string
          photo_path?: string | null
          professor_opinion: string
          sort_order?: number | null
          specialties: string[]
          updated_at?: string
        }
        Update: {
          conditions?: string
          created_at?: string
          description?: string
          experience_years?: number
          full_name?: string
          id?: string
          is_published?: boolean
          mission?: string
          photo_path?: string | null
          professor_opinion?: string
          sort_order?: number | null
          specialties?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      translation_batches: {
        Row: {
          chain_log: Json
          chapter_id: string | null
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          model: string
          partial_results: Json
          processed_rubrics: number
          rubric_ids: Json
          scope: string
          status: string
          subbatch_size: number
          total_rubrics: number
          updated_at: string
        }
        Insert: {
          chain_log?: Json
          chapter_id?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          model?: string
          partial_results?: Json
          processed_rubrics?: number
          rubric_ids?: Json
          scope?: string
          status?: string
          subbatch_size?: number
          total_rubrics?: number
          updated_at?: string
        }
        Update: {
          chain_log?: Json
          chapter_id?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          model?: string
          partial_results?: Json
          processed_rubrics?: number
          rubric_ids?: Json
          scope?: string
          status?: string
          subbatch_size?: number
          total_rubrics?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "translation_batches_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "repertory_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_path: string
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_path: string
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_path?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      treatment_catalog: {
        Row: {
          acupuncture_protocol_id: string | null
          age_max_years: number | null
          age_min_years: number | null
          application_point: string | null
          catalog_priority: number
          category: Database["public"]["Enums"]["treatment_category"]
          contraindications: string | null
          created_at: string
          created_by: string | null
          default_dilution_solvent: string | null
          default_dilution_volume: number | null
          default_dose: number | null
          default_duration_days: number | null
          default_frequency: string | null
          default_route_label: string | null
          dose_range_max: number | null
          dose_range_min: number | null
          dose_unit: string | null
          evidence_level: number
          form: string | null
          glucose_only: boolean
          id: string
          infusion_rate: string | null
          inn: string | null
          is_active: boolean
          is_off_label: boolean
          is_rx: boolean
          light_sensitive: boolean
          mm_application_point: string | null
          mm_contraindications: string[] | null
          mm_evidence_level: string | null
          mm_priority: number | null
          mm_targets: string[] | null
          name: string
          notes: string | null
          pack_size: string | null
          pack_size_num: number | null
          parse_query: string | null
          patient_info: Json
          potency: string | null
          price_auto: number | null
          price_auto_sources: Json | null
          price_auto_updated_at: string | null
          price_currency: string | null
          price_override: number | null
          price_source_note: string | null
          price_source_preference: string
          price_updated_at: string | null
          remedy_id: string | null
          search_vector: unknown
          subcategory: string | null
          tags: string[] | null
          targets: string[]
          time_of_day_default: string[] | null
          units_per_dose_num: number | null
          updated_at: string
        }
        Insert: {
          acupuncture_protocol_id?: string | null
          age_max_years?: number | null
          age_min_years?: number | null
          application_point?: string | null
          catalog_priority?: number
          category: Database["public"]["Enums"]["treatment_category"]
          contraindications?: string | null
          created_at?: string
          created_by?: string | null
          default_dilution_solvent?: string | null
          default_dilution_volume?: number | null
          default_dose?: number | null
          default_duration_days?: number | null
          default_frequency?: string | null
          default_route_label?: string | null
          dose_range_max?: number | null
          dose_range_min?: number | null
          dose_unit?: string | null
          evidence_level?: number
          form?: string | null
          glucose_only?: boolean
          id?: string
          infusion_rate?: string | null
          inn?: string | null
          is_active?: boolean
          is_off_label?: boolean
          is_rx?: boolean
          light_sensitive?: boolean
          mm_application_point?: string | null
          mm_contraindications?: string[] | null
          mm_evidence_level?: string | null
          mm_priority?: number | null
          mm_targets?: string[] | null
          name: string
          notes?: string | null
          pack_size?: string | null
          pack_size_num?: number | null
          parse_query?: string | null
          patient_info?: Json
          potency?: string | null
          price_auto?: number | null
          price_auto_sources?: Json | null
          price_auto_updated_at?: string | null
          price_currency?: string | null
          price_override?: number | null
          price_source_note?: string | null
          price_source_preference?: string
          price_updated_at?: string | null
          remedy_id?: string | null
          search_vector?: unknown
          subcategory?: string | null
          tags?: string[] | null
          targets?: string[]
          time_of_day_default?: string[] | null
          units_per_dose_num?: number | null
          updated_at?: string
        }
        Update: {
          acupuncture_protocol_id?: string | null
          age_max_years?: number | null
          age_min_years?: number | null
          application_point?: string | null
          catalog_priority?: number
          category?: Database["public"]["Enums"]["treatment_category"]
          contraindications?: string | null
          created_at?: string
          created_by?: string | null
          default_dilution_solvent?: string | null
          default_dilution_volume?: number | null
          default_dose?: number | null
          default_duration_days?: number | null
          default_frequency?: string | null
          default_route_label?: string | null
          dose_range_max?: number | null
          dose_range_min?: number | null
          dose_unit?: string | null
          evidence_level?: number
          form?: string | null
          glucose_only?: boolean
          id?: string
          infusion_rate?: string | null
          inn?: string | null
          is_active?: boolean
          is_off_label?: boolean
          is_rx?: boolean
          light_sensitive?: boolean
          mm_application_point?: string | null
          mm_contraindications?: string[] | null
          mm_evidence_level?: string | null
          mm_priority?: number | null
          mm_targets?: string[] | null
          name?: string
          notes?: string | null
          pack_size?: string | null
          pack_size_num?: number | null
          parse_query?: string | null
          patient_info?: Json
          potency?: string | null
          price_auto?: number | null
          price_auto_sources?: Json | null
          price_auto_updated_at?: string | null
          price_currency?: string | null
          price_override?: number | null
          price_source_note?: string | null
          price_source_preference?: string
          price_updated_at?: string | null
          remedy_id?: string | null
          search_vector?: unknown
          subcategory?: string | null
          tags?: string[] | null
          targets?: string[]
          time_of_day_default?: string[] | null
          units_per_dose_num?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_catalog_acupuncture_protocol_id_fkey"
            columns: ["acupuncture_protocol_id"]
            isOneToOne: false
            referencedRelation: "acupuncture_protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_catalog_remedy_id_fkey"
            columns: ["remedy_id"]
            isOneToOne: false
            referencedRelation: "repertory_remedies"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_catalog_backup_20260619: {
        Row: {
          acupuncture_protocol_id: string | null
          category: Database["public"]["Enums"]["treatment_category"] | null
          contraindications: string | null
          created_at: string | null
          created_by: string | null
          default_dilution_solvent: string | null
          default_dilution_volume: number | null
          default_dose: number | null
          default_duration_days: number | null
          default_frequency: string | null
          default_route_label: string | null
          dose_range_max: number | null
          dose_range_min: number | null
          dose_unit: string | null
          form: string | null
          glucose_only: boolean | null
          id: string | null
          infusion_rate: string | null
          inn: string | null
          is_active: boolean | null
          is_off_label: boolean | null
          is_rx: boolean | null
          light_sensitive: boolean | null
          name: string | null
          notes: string | null
          pack_size: string | null
          pack_size_num: number | null
          parse_query: string | null
          patient_info: Json | null
          potency: string | null
          price_auto: number | null
          price_auto_sources: Json | null
          price_auto_updated_at: string | null
          price_currency: string | null
          price_override: number | null
          price_source_note: string | null
          price_source_preference: string | null
          price_updated_at: string | null
          remedy_id: string | null
          search_vector: unknown
          subcategory: string | null
          tags: string[] | null
          time_of_day_default: string[] | null
          units_per_dose_num: number | null
          updated_at: string | null
        }
        Insert: {
          acupuncture_protocol_id?: string | null
          category?: Database["public"]["Enums"]["treatment_category"] | null
          contraindications?: string | null
          created_at?: string | null
          created_by?: string | null
          default_dilution_solvent?: string | null
          default_dilution_volume?: number | null
          default_dose?: number | null
          default_duration_days?: number | null
          default_frequency?: string | null
          default_route_label?: string | null
          dose_range_max?: number | null
          dose_range_min?: number | null
          dose_unit?: string | null
          form?: string | null
          glucose_only?: boolean | null
          id?: string | null
          infusion_rate?: string | null
          inn?: string | null
          is_active?: boolean | null
          is_off_label?: boolean | null
          is_rx?: boolean | null
          light_sensitive?: boolean | null
          name?: string | null
          notes?: string | null
          pack_size?: string | null
          pack_size_num?: number | null
          parse_query?: string | null
          patient_info?: Json | null
          potency?: string | null
          price_auto?: number | null
          price_auto_sources?: Json | null
          price_auto_updated_at?: string | null
          price_currency?: string | null
          price_override?: number | null
          price_source_note?: string | null
          price_source_preference?: string | null
          price_updated_at?: string | null
          remedy_id?: string | null
          search_vector?: unknown
          subcategory?: string | null
          tags?: string[] | null
          time_of_day_default?: string[] | null
          units_per_dose_num?: number | null
          updated_at?: string | null
        }
        Update: {
          acupuncture_protocol_id?: string | null
          category?: Database["public"]["Enums"]["treatment_category"] | null
          contraindications?: string | null
          created_at?: string | null
          created_by?: string | null
          default_dilution_solvent?: string | null
          default_dilution_volume?: number | null
          default_dose?: number | null
          default_duration_days?: number | null
          default_frequency?: string | null
          default_route_label?: string | null
          dose_range_max?: number | null
          dose_range_min?: number | null
          dose_unit?: string | null
          form?: string | null
          glucose_only?: boolean | null
          id?: string | null
          infusion_rate?: string | null
          inn?: string | null
          is_active?: boolean | null
          is_off_label?: boolean | null
          is_rx?: boolean | null
          light_sensitive?: boolean | null
          name?: string | null
          notes?: string | null
          pack_size?: string | null
          pack_size_num?: number | null
          parse_query?: string | null
          patient_info?: Json | null
          potency?: string | null
          price_auto?: number | null
          price_auto_sources?: Json | null
          price_auto_updated_at?: string | null
          price_currency?: string | null
          price_override?: number | null
          price_source_note?: string | null
          price_source_preference?: string | null
          price_updated_at?: string | null
          remedy_id?: string | null
          search_vector?: unknown
          subcategory?: string | null
          tags?: string[] | null
          time_of_day_default?: string[] | null
          units_per_dose_num?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      treatment_plan_items: {
        Row: {
          catalog_id: string | null
          created_at: string
          day_pattern: string | null
          dilution_solvent: string | null
          dilution_volume: number | null
          dose: number | null
          dose_unit: string | null
          dosing_schedule: string | null
          duration_days: number | null
          form_snapshot: string | null
          frequency: string | null
          id: string
          infusion_rate: string | null
          inn_snapshot: string | null
          is_off_label: boolean
          name_snapshot: string
          notes: string | null
          order_index: number
          plan_id: string
          potency: string | null
          prn_estimated_doses: number | null
          repertory_remedy_id: string | null
          route_override: string | null
          section_category: Database["public"]["Enums"]["treatment_category"]
          time_of_day: string[] | null
        }
        Insert: {
          catalog_id?: string | null
          created_at?: string
          day_pattern?: string | null
          dilution_solvent?: string | null
          dilution_volume?: number | null
          dose?: number | null
          dose_unit?: string | null
          dosing_schedule?: string | null
          duration_days?: number | null
          form_snapshot?: string | null
          frequency?: string | null
          id?: string
          infusion_rate?: string | null
          inn_snapshot?: string | null
          is_off_label?: boolean
          name_snapshot: string
          notes?: string | null
          order_index?: number
          plan_id: string
          potency?: string | null
          prn_estimated_doses?: number | null
          repertory_remedy_id?: string | null
          route_override?: string | null
          section_category: Database["public"]["Enums"]["treatment_category"]
          time_of_day?: string[] | null
        }
        Update: {
          catalog_id?: string | null
          created_at?: string
          day_pattern?: string | null
          dilution_solvent?: string | null
          dilution_volume?: number | null
          dose?: number | null
          dose_unit?: string | null
          dosing_schedule?: string | null
          duration_days?: number | null
          form_snapshot?: string | null
          frequency?: string | null
          id?: string
          infusion_rate?: string | null
          inn_snapshot?: string | null
          is_off_label?: boolean
          name_snapshot?: string
          notes?: string | null
          order_index?: number
          plan_id?: string
          potency?: string | null
          prn_estimated_doses?: number | null
          repertory_remedy_id?: string | null
          route_override?: string | null
          section_category?: Database["public"]["Enums"]["treatment_category"]
          time_of_day?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plan_items_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "treatment_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans_search"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "treatment_plan_items_remedy_id_fkey"
            columns: ["repertory_remedy_id"]
            isOneToOne: false
            referencedRelation: "repertory_remedies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_items_repertory_remedy_id_fkey"
            columns: ["repertory_remedy_id"]
            isOneToOne: false
            referencedRelation: "repertory_remedies"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plan_items_backup_20260619: {
        Row: {
          catalog_id: string | null
          created_at: string | null
          day_pattern: string | null
          dilution_solvent: string | null
          dilution_volume: number | null
          dose: number | null
          dose_unit: string | null
          dosing_schedule: string | null
          duration_days: number | null
          form_snapshot: string | null
          frequency: string | null
          id: string | null
          infusion_rate: string | null
          inn_snapshot: string | null
          is_off_label: boolean | null
          name_snapshot: string | null
          notes: string | null
          order_index: number | null
          plan_id: string | null
          potency: string | null
          prn_estimated_doses: number | null
          repertory_remedy_id: string | null
          route_override: string | null
          section_category:
            | Database["public"]["Enums"]["treatment_category"]
            | null
          time_of_day: string[] | null
        }
        Insert: {
          catalog_id?: string | null
          created_at?: string | null
          day_pattern?: string | null
          dilution_solvent?: string | null
          dilution_volume?: number | null
          dose?: number | null
          dose_unit?: string | null
          dosing_schedule?: string | null
          duration_days?: number | null
          form_snapshot?: string | null
          frequency?: string | null
          id?: string | null
          infusion_rate?: string | null
          inn_snapshot?: string | null
          is_off_label?: boolean | null
          name_snapshot?: string | null
          notes?: string | null
          order_index?: number | null
          plan_id?: string | null
          potency?: string | null
          prn_estimated_doses?: number | null
          repertory_remedy_id?: string | null
          route_override?: string | null
          section_category?:
            | Database["public"]["Enums"]["treatment_category"]
            | null
          time_of_day?: string[] | null
        }
        Update: {
          catalog_id?: string | null
          created_at?: string | null
          day_pattern?: string | null
          dilution_solvent?: string | null
          dilution_volume?: number | null
          dose?: number | null
          dose_unit?: string | null
          dosing_schedule?: string | null
          duration_days?: number | null
          form_snapshot?: string | null
          frequency?: string | null
          id?: string | null
          infusion_rate?: string | null
          inn_snapshot?: string | null
          is_off_label?: boolean | null
          name_snapshot?: string | null
          notes?: string | null
          order_index?: number | null
          plan_id?: string | null
          potency?: string | null
          prn_estimated_doses?: number | null
          repertory_remedy_id?: string | null
          route_override?: string | null
          section_category?:
            | Database["public"]["Enums"]["treatment_category"]
            | null
          time_of_day?: string[] | null
        }
        Relationships: []
      }
      treatment_plan_lab_control: {
        Row: {
          at_day: number | null
          control_point: string | null
          created_at: string
          custom_tests: string[] | null
          id: string
          notes: string | null
          order_index: number
          plan_id: string
          test_ids: string[] | null
          updated_at: string
        }
        Insert: {
          at_day?: number | null
          control_point?: string | null
          created_at?: string
          custom_tests?: string[] | null
          id?: string
          notes?: string | null
          order_index?: number
          plan_id: string
          test_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          at_day?: number | null
          control_point?: string | null
          created_at?: string
          custom_tests?: string[] | null
          id?: string
          notes?: string | null
          order_index?: number
          plan_id?: string
          test_ids?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plan_lab_control_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_lab_control_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans_search"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      treatment_plan_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          plan_id: string
          snapshot: Json
          version_no: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          plan_id: string
          snapshot: Json
          version_no: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          plan_id?: string
          snapshot?: Json
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans_search"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          based_on_template: string | null
          clinical_summary: string | null
          course_number: number | null
          created_at: string
          created_by: string
          diagnosis_short: string | null
          duration_days: number
          id: string
          is_public: boolean
          issued_at: string
          lab_control_enabled: boolean
          mode: Database["public"]["Enums"]["plan_mode"]
          patient_id: string
          print_count: number
          public_hash: string | null
          public_view_count: number
          show_cost_in_memo: boolean
          show_cost_in_print: boolean
          status: Database["public"]["Enums"]["plan_status"]
          total_cost_breakdown: Json | null
          total_cost_estimate: number | null
          updated_at: string
        }
        Insert: {
          based_on_template?: string | null
          clinical_summary?: string | null
          course_number?: number | null
          created_at?: string
          created_by: string
          diagnosis_short?: string | null
          duration_days?: number
          id?: string
          is_public?: boolean
          issued_at?: string
          lab_control_enabled?: boolean
          mode?: Database["public"]["Enums"]["plan_mode"]
          patient_id: string
          print_count?: number
          public_hash?: string | null
          public_view_count?: number
          show_cost_in_memo?: boolean
          show_cost_in_print?: boolean
          status?: Database["public"]["Enums"]["plan_status"]
          total_cost_breakdown?: Json | null
          total_cost_estimate?: number | null
          updated_at?: string
        }
        Update: {
          based_on_template?: string | null
          clinical_summary?: string | null
          course_number?: number | null
          created_at?: string
          created_by?: string
          diagnosis_short?: string | null
          duration_days?: number
          id?: string
          is_public?: boolean
          issued_at?: string
          lab_control_enabled?: boolean
          mode?: Database["public"]["Enums"]["plan_mode"]
          patient_id?: string
          print_count?: number
          public_hash?: string | null
          public_view_count?: number
          show_cost_in_memo?: boolean
          show_cost_in_print?: boolean
          status?: Database["public"]["Enums"]["plan_status"]
          total_cost_breakdown?: Json | null
          total_cost_estimate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_based_on_template_fkey"
            columns: ["based_on_template"]
            isOneToOne: false
            referencedRelation: "protocol_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      ultrasound_results: {
        Row: {
          bladder_volume: number | null
          bladder_wall_thickness: number | null
          conclusion: string | null
          created_at: string
          exam_date: string
          hydrocele_volume_left: number | null
          hydrocele_volume_right: number | null
          id: string
          left_epididymis_head: number | null
          left_epididymis_notes: string | null
          left_hydrocele: boolean | null
          left_inguinal_canal: string | null
          left_kidney_length: number | null
          left_kidney_notes: string | null
          left_spermatic_vein_diameter: number | null
          left_testis_depth: number | null
          left_testis_echostructure: string | null
          left_testis_length: number | null
          left_testis_volume: number | null
          left_testis_width: number | null
          left_varicocele_grade: number | null
          notes: string | null
          patient_id: string
          penile_length: number | null
          penile_stretched_length: number | null
          prostate_capsule: string | null
          prostate_depth: number | null
          prostate_echostructure: string | null
          prostate_length: number | null
          prostate_parenchyma: string | null
          prostate_volume: number | null
          prostate_width: number | null
          residual_urine: number | null
          right_epididymis_head: number | null
          right_epididymis_notes: string | null
          right_hydrocele: boolean | null
          right_inguinal_canal: string | null
          right_kidney_length: number | null
          right_kidney_notes: string | null
          right_spermatic_vein_diameter: number | null
          right_testis_depth: number | null
          right_testis_echostructure: string | null
          right_testis_length: number | null
          right_testis_volume: number | null
          right_testis_width: number | null
          right_varicocele_grade: number | null
          updated_at: string
          valsalva_max_velocity_left: number | null
          valsalva_max_velocity_right: number | null
          valsalva_reflux_left: boolean | null
          valsalva_reflux_right: boolean | null
        }
        Insert: {
          bladder_volume?: number | null
          bladder_wall_thickness?: number | null
          conclusion?: string | null
          created_at?: string
          exam_date?: string
          hydrocele_volume_left?: number | null
          hydrocele_volume_right?: number | null
          id?: string
          left_epididymis_head?: number | null
          left_epididymis_notes?: string | null
          left_hydrocele?: boolean | null
          left_inguinal_canal?: string | null
          left_kidney_length?: number | null
          left_kidney_notes?: string | null
          left_spermatic_vein_diameter?: number | null
          left_testis_depth?: number | null
          left_testis_echostructure?: string | null
          left_testis_length?: number | null
          left_testis_volume?: number | null
          left_testis_width?: number | null
          left_varicocele_grade?: number | null
          notes?: string | null
          patient_id: string
          penile_length?: number | null
          penile_stretched_length?: number | null
          prostate_capsule?: string | null
          prostate_depth?: number | null
          prostate_echostructure?: string | null
          prostate_length?: number | null
          prostate_parenchyma?: string | null
          prostate_volume?: number | null
          prostate_width?: number | null
          residual_urine?: number | null
          right_epididymis_head?: number | null
          right_epididymis_notes?: string | null
          right_hydrocele?: boolean | null
          right_inguinal_canal?: string | null
          right_kidney_length?: number | null
          right_kidney_notes?: string | null
          right_spermatic_vein_diameter?: number | null
          right_testis_depth?: number | null
          right_testis_echostructure?: string | null
          right_testis_length?: number | null
          right_testis_volume?: number | null
          right_testis_width?: number | null
          right_varicocele_grade?: number | null
          updated_at?: string
          valsalva_max_velocity_left?: number | null
          valsalva_max_velocity_right?: number | null
          valsalva_reflux_left?: boolean | null
          valsalva_reflux_right?: boolean | null
        }
        Update: {
          bladder_volume?: number | null
          bladder_wall_thickness?: number | null
          conclusion?: string | null
          created_at?: string
          exam_date?: string
          hydrocele_volume_left?: number | null
          hydrocele_volume_right?: number | null
          id?: string
          left_epididymis_head?: number | null
          left_epididymis_notes?: string | null
          left_hydrocele?: boolean | null
          left_inguinal_canal?: string | null
          left_kidney_length?: number | null
          left_kidney_notes?: string | null
          left_spermatic_vein_diameter?: number | null
          left_testis_depth?: number | null
          left_testis_echostructure?: string | null
          left_testis_length?: number | null
          left_testis_volume?: number | null
          left_testis_width?: number | null
          left_varicocele_grade?: number | null
          notes?: string | null
          patient_id?: string
          penile_length?: number | null
          penile_stretched_length?: number | null
          prostate_capsule?: string | null
          prostate_depth?: number | null
          prostate_echostructure?: string | null
          prostate_length?: number | null
          prostate_parenchyma?: string | null
          prostate_volume?: number | null
          prostate_width?: number | null
          residual_urine?: number | null
          right_epididymis_head?: number | null
          right_epididymis_notes?: string | null
          right_hydrocele?: boolean | null
          right_inguinal_canal?: string | null
          right_kidney_length?: number | null
          right_kidney_notes?: string | null
          right_spermatic_vein_diameter?: number | null
          right_testis_depth?: number | null
          right_testis_echostructure?: string | null
          right_testis_length?: number | null
          right_testis_volume?: number | null
          right_testis_width?: number | null
          right_varicocele_grade?: number | null
          updated_at?: string
          valsalva_max_velocity_left?: number | null
          valsalva_max_velocity_right?: number | null
          valsalva_reflux_left?: boolean | null
          valsalva_reflux_right?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ultrasound_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vault_links: {
        Row: {
          context_snippet: string | null
          created_at: string
          from_note_id: string
          id: string
          owner_id: string
          to_note_id: string | null
          to_title: string
        }
        Insert: {
          context_snippet?: string | null
          created_at?: string
          from_note_id: string
          id?: string
          owner_id: string
          to_note_id?: string | null
          to_title: string
        }
        Update: {
          context_snippet?: string | null
          created_at?: string
          from_note_id?: string
          id?: string
          owner_id?: string
          to_note_id?: string | null
          to_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_links_from_note_id_fkey"
            columns: ["from_note_id"]
            isOneToOne: false
            referencedRelation: "vault_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_links_to_note_id_fkey"
            columns: ["to_note_id"]
            isOneToOne: false
            referencedRelation: "vault_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_note_attachments: {
        Row: {
          created_at: string
          id: string
          kind: string
          mode: string
          note_id: string
          patient_id: string | null
          position: number
          ref_id: string | null
          snapshot: Json | null
          summary: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          mode?: string
          note_id: string
          patient_id?: string | null
          position?: number
          ref_id?: string | null
          snapshot?: Json | null
          summary?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          mode?: string
          note_id?: string
          patient_id?: string | null
          position?: number
          ref_id?: string | null
          snapshot?: Json | null
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_note_attachments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "vault_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_note_attachments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_note_embeddings: {
        Row: {
          content_hash: string
          embedding: unknown
          note_id: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          content_hash: string
          embedding: unknown
          note_id: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          content_hash?: string
          embedding?: unknown
          note_id?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_note_embeddings_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: true
            referencedRelation: "vault_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_note_patients: {
        Row: {
          created_at: string
          note_id: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          note_id: string
          patient_id: string
        }
        Update: {
          created_at?: string
          note_id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_note_patients_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "vault_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_note_patients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_notes: {
        Row: {
          content_md: string
          created_at: string
          daily_date: string | null
          folder_path: string
          id: string
          is_daily: boolean
          owner_id: string
          patient_id: string | null
          search_text: string | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          content_md?: string
          created_at?: string
          daily_date?: string | null
          folder_path?: string
          id?: string
          is_daily?: boolean
          owner_id: string
          patient_id?: string | null
          search_text?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          content_md?: string
          created_at?: string
          daily_date?: string | null
          folder_path?: string
          id?: string
          is_daily?: boolean
          owner_id?: string
          patient_id?: string | null
          search_text?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      video_case_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string
          user_id: string
          video_case_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type: string
          user_id: string
          video_case_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
          video_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_case_reactions_video_case_id_fkey"
            columns: ["video_case_id"]
            isOneToOne: false
            referencedRelation: "video_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      video_cases: {
        Row: {
          category: Database["public"]["Enums"]["case_category"]
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          sort_order: number | null
          thumbnail_path: string | null
          title: string
          updated_at: string
          video_path: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["case_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number | null
          thumbnail_path?: string | null
          title: string
          updated_at?: string
          video_path: string
        }
        Update: {
          category?: Database["public"]["Enums"]["case_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number | null
          thumbnail_path?: string | null
          title?: string
          updated_at?: string
          video_path?: string
        }
        Relationships: []
      }
      visit_text_templates: {
        Row: {
          created_at: string
          day_range: string
          field_key: string
          id: string
          label: string
          operation_keywords: string[] | null
          protocol_type: string | null
          sort_order: number
          template_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_range?: string
          field_key: string
          id?: string
          label: string
          operation_keywords?: string[] | null
          protocol_type?: string | null
          sort_order?: number
          template_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_range?: string
          field_key?: string
          id?: string
          label?: string
          operation_keywords?: string[] | null
          protocol_type?: string | null
          sort_order?: number
          template_text?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      blog_comments_public: {
        Row: {
          content: string | null
          created_at: string | null
          id: string | null
          is_approved: boolean | null
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_approved?: boolean | null
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_approved?: boolean | null
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      questions_public: {
        Row: {
          answer_text: string | null
          answered_at: string | null
          author_name: string | null
          created_at: string | null
          id: string | null
          is_published: boolean | null
          question_text: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          answer_text?: string | null
          answered_at?: string | null
          author_name?: string | null
          created_at?: string | null
          id?: string | null
          is_published?: boolean | null
          question_text?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          answer_text?: string | null
          answered_at?: string | null
          author_name?: string | null
          created_at?: string | null
          id?: string | null
          is_published?: boolean | null
          question_text?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      research_article_comments_public: {
        Row: {
          article_id: string | null
          author_name: string | null
          content: string | null
          created_at: string | null
          id: string | null
          is_approved: boolean | null
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_approved?: boolean | null
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_approved?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "research_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans_search: {
        Row: {
          clinical_summary: string | null
          course_number: number | null
          diagnosis_short: string | null
          duration_days: number | null
          issued_at: string | null
          item_inns: string[] | null
          item_names: string[] | null
          mode: string | null
          patient_age_years: number | null
          patient_birth_date: string | null
          patient_full_name: string | null
          patient_id: string | null
          plan_id: string | null
          search_text: string | null
          search_vec: unknown
          status: string | null
          template_name: string | null
          template_tags: string[] | null
          total_cost_estimate: number | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _analytics_filter_plans: {
        Args: { _doctor: string; _from: string; _status: string; _to: string }
        Returns: {
          based_on_template: string
          created_by: string
          duration_days: number
          id: string
          ref_date: string
          total_cost_estimate: number
        }[]
      }
      analytics_avg_cost_by_tag: {
        Args: { _doctor: string; _from: string; _status: string; _to: string }
        Returns: Json
      }
      analytics_doctors_list: { Args: never; Returns: Json }
      analytics_duration_histogram: {
        Args: { _doctor: string; _from: string; _status: string; _to: string }
        Returns: Json
      }
      analytics_irt_compare_periods: {
        Args: { _doctor?: string; _from: string; _status?: string; _to: string }
        Returns: Json
      }
      analytics_irt_dashboard: {
        Args: {
          _doctor?: string
          _from: string
          _status?: string
          _to: string
          _ttl_minutes?: number
        }
        Returns: Json
      }
      analytics_irt_meridian_distribution: {
        Args: {
          _doctor?: string
          _from?: string
          _status?: string
          _to?: string
        }
        Returns: {
          meridian_code: string
          meridian_name: string
          points_count: number
        }[]
      }
      analytics_irt_meridian_trends: {
        Args: {
          _doctor?: string
          _from?: string
          _status?: string
          _to?: string
        }
        Returns: {
          meridian_code: string
          month: string
          points_count: number
        }[]
      }
      analytics_irt_modality_usage: {
        Args: {
          _doctor?: string
          _from?: string
          _status?: string
          _to?: string
        }
        Returns: {
          count: number
          modality: string
        }[]
      }
      analytics_irt_nosology_distribution: {
        Args: {
          _doctor?: string
          _from?: string
          _status?: string
          _to?: string
        }
        Returns: {
          tag: string
          usage_count: number
        }[]
      }
      analytics_irt_plans_last_12m: {
        Args: { _doctor?: string; _status?: string }
        Returns: {
          month: string
          plans_count: number
        }[]
      }
      analytics_irt_plans_per_month: {
        Args: {
          _doctor?: string
          _from?: string
          _status?: string
          _to?: string
        }
        Returns: {
          month: string
          plans_count: number
        }[]
      }
      analytics_irt_top_points: {
        Args: {
          _doctor?: string
          _from?: string
          _status?: string
          _to?: string
        }
        Returns: {
          acupoint_id: string
          meridian_code: string
          name_ru: string
          usage_count: number
          who_code: string
        }[]
      }
      analytics_irt_top_protocols: {
        Args: {
          _doctor?: string
          _from?: string
          _status?: string
          _to?: string
        }
        Returns: {
          is_template: boolean
          name: string
          plans_count: number
          protocol_id: string
          usage_count: number
        }[]
      }
      analytics_plans_per_month: {
        Args: { _doctor: string; _from: string; _status: string; _to: string }
        Returns: Json
      }
      analytics_section_usage: {
        Args: { _doctor: string; _from: string; _status: string; _to: string }
        Returns: Json
      }
      analytics_top_catalog: {
        Args: {
          _doctor: string
          _from: string
          _limit?: number
          _status: string
          _to: string
        }
        Returns: Json
      }
      analytics_top_templates: {
        Args: {
          _doctor: string
          _from: string
          _limit?: number
          _status: string
          _to: string
        }
        Returns: Json
      }
      append_analysis_batch_log: {
        Args: { _batch_id: string; _entry: Json }
        Returns: undefined
      }
      append_embedding_batch_log: {
        Args: { _batch_id: string; _entry: Json }
        Returns: undefined
      }
      append_translation_batch_log: {
        Args: { _batch_id: string; _entry: Json }
        Returns: undefined
      }
      cohort_pathway_stats: {
        Args: {
          _age_max?: number
          _age_min?: number
          _icd10?: string
          _sex?: string
        }
        Returns: {
          pathway_name: string
          pathway_slug: string
          patients_affected: number
          patients_total: number
          severity_mild: number
          severity_moderate: number
          severity_severe: number
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_all_missing_embeddings: { Args: never; Returns: string }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_plan_public_hash: { Args: never; Returns: string }
      get_public_plan: { Args: { _hash: string }; Returns: Json }
      get_repertory_chapter_stats: {
        Args: never
        Returns: {
          chapter_id: string
          root_rubrics: number
          total_links: number
          total_rubrics: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_material_download: {
        Args: { material_id: string }
        Returns: undefined
      }
      increment_public_plan_view: {
        Args: { _hash: string }
        Returns: undefined
      }
      is_guardian_of: { Args: { _patient_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      next_history_number: { Args: never; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      refresh_treatment_plans_search: { Args: never; Returns: undefined }
      search_rubrics_by_embedding: {
        Args: { _limit?: number; _query: string }
        Returns: {
          chapter_id: string
          name: string
          name_ru: string
          rubric_id: string
          similarity: number
        }[]
      }
      search_treatment_plans: {
        Args: {
          _age_max?: number
          _age_min?: number
          _cost_max?: number
          _cost_min?: number
          _from?: string
          _limit?: number
          _q?: string
          _to?: string
        }
        Returns: Json
      }
      search_vault_by_embedding: {
        Args: { _limit?: number; _owner_id: string; _query: string }
        Returns: {
          folder_path: string
          note_id: string
          similarity: number
          snippet: string
          title: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "user" | "editor" | "surgeon" | "parent"
      case_category:
        | "hydrocele"
        | "cryptorchidism"
        | "hypospadias"
        | "varicocele"
        | "phimosis"
        | "other"
        | "sexology"
        | "psychology"
        | "infertility"
        | "erectile_dysfunction"
        | "enuresis"
        | "pelvic_pain"
        | "scrotal_pain"
        | "hernia"
        | "complications"
        | "rarities"
        | "spermatocele"
        | "spermatic_cord_cyst"
        | "short_frenulum"
        | "hydatids"
        | "penile_curvature"
        | "nevi"
        | "papillomas"
        | "scars"
        | "meatostenosis"
        | "testicular_torsion"
        | "preputial_synechiae"
        | "paraphimosis"
        | "buried_penis"
        | "lymphocele"
        | "scrotal_atheroma"
        | "micro_tese"
        | "orchiectomy"
      extemporaneous_form_type:
        | "unguentum"
        | "suspensio"
        | "suppositoria"
        | "mixtura"
        | "tinctura"
        | "linimentum"
        | "pasta"
        | "cremor"
        | "gel"
        | "solutio"
      plan_mode: "flat" | "scheduled"
      plan_status: "draft" | "issued" | "archived"
      treatment_category:
        | "iv_drip"
        | "iv_bolus"
        | "im"
        | "sc"
        | "oral_rx"
        | "oral_supplement"
        | "rectal"
        | "topical"
        | "nasal"
        | "sublingual"
        | "peptide"
        | "procedure"
        | "lifestyle"
        | "homeopathy"
        | "physiotherapy"
      user_type: "medical_specialist" | "patient" | "researcher"
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
      app_role: ["admin", "user", "editor", "surgeon", "parent"],
      case_category: [
        "hydrocele",
        "cryptorchidism",
        "hypospadias",
        "varicocele",
        "phimosis",
        "other",
        "sexology",
        "psychology",
        "infertility",
        "erectile_dysfunction",
        "enuresis",
        "pelvic_pain",
        "scrotal_pain",
        "hernia",
        "complications",
        "rarities",
        "spermatocele",
        "spermatic_cord_cyst",
        "short_frenulum",
        "hydatids",
        "penile_curvature",
        "nevi",
        "papillomas",
        "scars",
        "meatostenosis",
        "testicular_torsion",
        "preputial_synechiae",
        "paraphimosis",
        "buried_penis",
        "lymphocele",
        "scrotal_atheroma",
        "micro_tese",
        "orchiectomy",
      ],
      extemporaneous_form_type: [
        "unguentum",
        "suspensio",
        "suppositoria",
        "mixtura",
        "tinctura",
        "linimentum",
        "pasta",
        "cremor",
        "gel",
        "solutio",
      ],
      plan_mode: ["flat", "scheduled"],
      plan_status: ["draft", "issued", "archived"],
      treatment_category: [
        "iv_drip",
        "iv_bolus",
        "im",
        "sc",
        "oral_rx",
        "oral_supplement",
        "rectal",
        "topical",
        "nasal",
        "sublingual",
        "peptide",
        "procedure",
        "lifestyle",
        "homeopathy",
        "physiotherapy",
      ],
      user_type: ["medical_specialist", "patient", "researcher"],
    },
  },
} as const
