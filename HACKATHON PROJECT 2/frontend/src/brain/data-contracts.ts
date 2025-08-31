/** CompleteQuestRequest */
export interface CompleteQuestRequest {
  /** Quest Id */
  quest_id: number;
}

/** CompleteQuestResponse */
export interface CompleteQuestResponse {
  completion: QuestCompletion;
  quest: Quest;
  /** Message */
  message: string;
  /** Daily Completions Used */
  daily_completions_used: number;
  /** Daily Completions Limit */
  daily_completions_limit: number;
}

/** CreateQuestRequest */
export interface CreateQuestRequest {
  /** Title */
  title: string;
}

/** CreateQuestResponse */
export interface CreateQuestResponse {
  quest: Quest;
  /** Message */
  message: string;
}

/** GenerateRivalResponse */
export interface GenerateRivalResponse {
  rival: Rival;
  /** Message */
  message: string;
  /** Is New */
  is_new: boolean;
  /** Slots Used */
  slots_used: number;
  /** Max Slots */
  max_slots: number;
}

/** GetRivalResponse */
export interface GetRivalResponse {
  rival: Rival | null;
  /** Has Rival */
  has_rival: boolean;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** InitializePaymentRequest */
export interface InitializePaymentRequest {
  /**
   * Email
   * @format email
   */
  email: string;
  /** Plan */
  plan: "monthly" | "annual";
  /** Callback Url */
  callback_url?: string | null;
}

/** InitializePaymentResponse */
export interface InitializePaymentResponse {
  /** Authorization Url */
  authorization_url: string;
  /** Access Code */
  access_code: string;
  /** Reference */
  reference: string;
  /** Message */
  message: string;
}

/** ListQuestsResponse */
export interface ListQuestsResponse {
  /** Quests */
  quests: Quest[];
  /** Total Count */
  total_count: number;
  /** Daily Completions Used */
  daily_completions_used: number;
  /** Daily Completions Limit */
  daily_completions_limit: number;
  /** Is Premium */
  is_premium: boolean;
}

/** ListRivalsResponse */
export interface ListRivalsResponse {
  /** Rivals */
  rivals: Rival[];
  /** Total Count */
  total_count: number;
  active_rival: Rival | null;
  /** Slots Used */
  slots_used: number;
  /** Max Slots */
  max_slots: number;
  /** Is Premium */
  is_premium: boolean;
}

/** Quest */
export interface Quest {
  /** Id */
  id: number;
  /** User Id */
  user_id: string;
  /** Title */
  title: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Completed Today
   * @default false
   */
  completed_today?: boolean;
  /**
   * Current Streak
   * @default 0
   */
  current_streak?: number;
}

/** QuestCompletion */
export interface QuestCompletion {
  /** Id */
  id: number;
  /** Quest Id */
  quest_id: number;
  /**
   * Date
   * @format date
   */
  date: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
}

/** QuotaStatus */
export interface QuotaStatus {
  /** Current Quest Count */
  current_quest_count: number;
  /** Max Quests */
  max_quests: number;
  /** Is Premium */
  is_premium: boolean;
  /** Can Create Quest */
  can_create_quest: boolean;
}

/** Rival */
export interface Rival {
  /** Id */
  id: number;
  /** User Id */
  user_id: string;
  /** Name */
  name: string;
  /** Archetype */
  archetype: string;
  /** Taunt */
  taunt: string;
  /** Personality Type */
  personality_type: string;
  /** Level */
  level: number;
  /** Experience */
  experience: number;
  /** Rival Order */
  rival_order: number;
  /** Is Active */
  is_active: boolean;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
}

/** SubscriptionStatus */
export interface SubscriptionStatus {
  /** Is Premium */
  is_premium: boolean;
  /** Subscription Type */
  subscription_type?: string | null;
  /** Status */
  status?: string | null;
  /** End Date */
  end_date?: string | null;
  /** Days Remaining */
  days_remaining?: number | null;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

/** VerifyPaymentResponse */
export interface VerifyPaymentResponse {
  /** Status */
  status: string;
  /** Message */
  message: string;
  /** Transaction Data */
  transaction_data: Record<string, any>;
  /** Subscription Status */
  subscription_status?: Record<string, any> | null;
}

export type CheckHealthData = HealthResponse;

export type InitializePaymentData = InitializePaymentResponse;

export type InitializePaymentError = HTTPValidationError;

export interface VerifyPaymentParams {
  /** Reference */
  reference: string;
}

export type VerifyPaymentData = VerifyPaymentResponse;

export type VerifyPaymentError = HTTPValidationError;

export type GetSubscriptionStatusData = SubscriptionStatus;

export type GetQuotaStatusData = QuotaStatus;

export type PaystackWebhookData = any;

export type CreateQuestData = CreateQuestResponse;

export type CreateQuestError = HTTPValidationError;

export type ListQuestsData = ListQuestsResponse;

export type CompleteTodayData = CompleteQuestResponse;

export type CompleteTodayError = HTTPValidationError;

export interface DeleteQuestParams {
  /** Quest Id */
  questId: number;
}

export type DeleteQuestData = any;

export type DeleteQuestError = HTTPValidationError;

export type GetRivalData = GetRivalResponse;

export type ListRivalsData = ListRivalsResponse;

export interface GenerateRivalParams {
  /**
   * Personality Type
   * @default "competitive"
   */
  personality_type?: string;
}

export type GenerateRivalData = GenerateRivalResponse;

export type GenerateRivalError = HTTPValidationError;
