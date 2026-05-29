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
      disease_articles: {
        Row: {
          age_group: string
          article_content: string | null
          audio_path: string | null
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
      lab_results: {
        Row: {
          created_at: string
          id: string
          is_abnormal: boolean | null
          notes: string | null
          patient_id: string
          reference_max: number | null
          reference_min: number | null
          test_code: string | null
          test_date: string
          test_group: string
          test_name: string
          unit: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_abnormal?: boolean | null
          notes?: string | null
          patient_id: string
          reference_max?: number | null
          reference_min?: number | null
          test_code?: string | null
          test_date?: string
          test_group: string
          test_name: string
          unit: string
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          is_abnormal?: boolean | null
          notes?: string | null
          patient_id?: string
          reference_max?: number | null
          reference_min?: number | null
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
            foreignKeyName: "lab_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
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
          price_auto: number | null
          price_auto_sources: Json | null
          price_auto_updated_at: string | null
          price_avg: number | null
          ref_range_male: string | null
          short_name: string | null
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
          price_auto?: number | null
          price_auto_sources?: Json | null
          price_auto_updated_at?: string | null
          price_avg?: number | null
          ref_range_male?: string | null
          short_name?: string | null
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
          price_auto?: number | null
          price_auto_sources?: Json | null
          price_auto_updated_at?: string | null
          price_avg?: number | null
          ref_range_male?: string | null
          short_name?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
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
          telegram_username?: string | null
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
          slug: string
        }
        Insert: {
          abbrev?: string | null
          created_at?: string
          id?: string
          name_latin: string
          name_ru?: string | null
          slug: string
        }
        Update: {
          abbrev?: string | null
          created_at?: string
          id?: string
          name_latin?: string
          name_ru?: string | null
          slug?: string
        }
        Relationships: []
      }
      repertory_rubric_remedies: {
        Row: {
          created_at: string
          grade: number
          id: string
          remedy_id: string
          rubric_id: string
        }
        Insert: {
          created_at?: string
          grade: number
          id?: string
          remedy_id: string
          rubric_id: string
        }
        Update: {
          created_at?: string
          grade?: number
          id?: string
          remedy_id?: string
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
          parent_id: string | null
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          kent_page?: number | null
          name: string
          parent_id?: string | null
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          kent_page?: number | null
          name?: string
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
          form: string | null
          glucose_only: boolean
          id: string
          infusion_rate: string | null
          inn: string | null
          is_active: boolean
          is_off_label: boolean
          is_rx: boolean
          light_sensitive: boolean
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
          time_of_day_default: string[] | null
          units_per_dose_num: number | null
          updated_at: string
        }
        Insert: {
          acupuncture_protocol_id?: string | null
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
          form?: string | null
          glucose_only?: boolean
          id?: string
          infusion_rate?: string | null
          inn?: string | null
          is_active?: boolean
          is_off_label?: boolean
          is_rx?: boolean
          light_sensitive?: boolean
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
          time_of_day_default?: string[] | null
          units_per_dose_num?: number | null
          updated_at?: string
        }
        Update: {
          acupuncture_protocol_id?: string | null
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
          form?: string | null
          glucose_only?: boolean
          id?: string
          infusion_rate?: string | null
          inn?: string | null
          is_active?: boolean
          is_off_label?: boolean
          is_rx?: boolean
          light_sensitive?: boolean
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
          prostate_depth: number | null
          prostate_echostructure: string | null
          prostate_length: number | null
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
          prostate_depth?: number | null
          prostate_echostructure?: string | null
          prostate_length?: number | null
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
          prostate_depth?: number | null
          prostate_echostructure?: string | null
          prostate_length?: number | null
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_plan_public_hash: { Args: never; Returns: string }
      get_public_plan: { Args: { _hash: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_public_plan_view: {
        Args: { _hash: string }
        Returns: undefined
      }
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "user" | "editor" | "surgeon"
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
      app_role: ["admin", "user", "editor", "surgeon"],
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
      ],
      user_type: ["medical_specialist", "patient", "researcher"],
    },
  },
} as const
