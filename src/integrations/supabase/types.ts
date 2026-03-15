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
      patients: {
        Row: {
          birth_date: string
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          birth_date: string
          created_at?: string
          full_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          full_name?: string
          id?: string
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
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
      user_type: ["medical_specialist", "patient", "researcher"],
    },
  },
} as const
