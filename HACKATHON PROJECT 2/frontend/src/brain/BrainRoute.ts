import {
  CheckHealthData,
  CompleteQuestRequest,
  CompleteTodayData,
  CreateQuestData,
  CreateQuestRequest,
  DeleteQuestData,
  GenerateRivalData,
  GetQuotaStatusData,
  GetRivalData,
  GetSubscriptionStatusData,
  InitializePaymentData,
  InitializePaymentRequest,
  ListQuestsData,
  ListRivalsData,
  PaystackWebhookData,
  VerifyPaymentData,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Initialize payment with Paystack
   * @tags dbtn/module:payments, dbtn/hasAuth
   * @name initialize_payment
   * @summary Initialize Payment
   * @request POST:/routes/payments/initialize
   */
  export namespace initialize_payment {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = InitializePaymentRequest;
    export type RequestHeaders = {};
    export type ResponseBody = InitializePaymentData;
  }

  /**
   * @description Verify payment status with Paystack
   * @tags dbtn/module:payments, dbtn/hasAuth
   * @name verify_payment
   * @summary Verify Payment
   * @request GET:/routes/payments/verify/{reference}
   */
  export namespace verify_payment {
    export type RequestParams = {
      /** Reference */
      reference: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VerifyPaymentData;
  }

  /**
   * @description Get current subscription status for user
   * @tags dbtn/module:payments, dbtn/hasAuth
   * @name get_subscription_status
   * @summary Get Subscription Status
   * @request GET:/routes/payments/subscription-status
   */
  export namespace get_subscription_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSubscriptionStatusData;
  }

  /**
   * @description Get current quest quota status for user
   * @tags dbtn/module:payments, dbtn/hasAuth
   * @name get_quota_status
   * @summary Get Quota Status
   * @request GET:/routes/payments/quota-status
   */
  export namespace get_quota_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetQuotaStatusData;
  }

  /**
   * @description Handle Paystack webhooks for payment confirmations
   * @tags dbtn/module:payments, dbtn/hasAuth
   * @name paystack_webhook
   * @summary Paystack Webhook
   * @request POST:/routes/payments/webhook
   */
  export namespace paystack_webhook {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PaystackWebhookData;
  }

  /**
   * @description Create a new daily quest for the user - NO LIMITS on quest creation!
   * @tags dbtn/module:quests, dbtn/hasAuth
   * @name create_quest
   * @summary Create Quest
   * @request POST:/routes/quests/create
   */
  export namespace create_quest {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateQuestRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateQuestData;
  }

  /**
   * @description List all quests for the current user with completion status and daily limits
   * @tags dbtn/module:quests, dbtn/hasAuth
   * @name list_quests
   * @summary List Quests
   * @request GET:/routes/quests/list
   */
  export namespace list_quests {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListQuestsData;
  }

  /**
   * @description Mark a quest as completed for today - WITH DAILY COMPLETION LIMITS!
   * @tags dbtn/module:quests, dbtn/hasAuth
   * @name complete_today
   * @summary Complete Today
   * @request POST:/routes/quests/complete-today
   */
  export namespace complete_today {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CompleteQuestRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CompleteTodayData;
  }

  /**
   * @description Delete a quest and all its completions
   * @tags dbtn/module:quests, dbtn/hasAuth
   * @name delete_quest
   * @summary Delete Quest
   * @request DELETE:/routes/quests/delete/{quest_id}
   */
  export namespace delete_quest {
    export type RequestParams = {
      /** Quest Id */
      questId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteQuestData;
  }

  /**
   * @description Get the primary/active rival for the user
   * @tags dbtn/module:rivals, dbtn/hasAuth
   * @name get_rival
   * @summary Get Rival
   * @request GET:/routes/rivals/get
   */
  export namespace get_rival {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRivalData;
  }

  /**
   * @description List all rivals for the user with subscription limits
   * @tags dbtn/module:rivals, dbtn/hasAuth
   * @name list_rivals
   * @summary List Rivals
   * @request GET:/routes/rivals/list
   */
  export namespace list_rivals {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListRivalsData;
  }

  /**
   * @description Generate a new rival with specified personality type
   * @tags dbtn/module:rivals, dbtn/hasAuth
   * @name generate_rival
   * @summary Generate Rival
   * @request POST:/routes/rivals/generate
   */
  export namespace generate_rival {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Personality Type
       * @default "competitive"
       */
      personality_type?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateRivalData;
  }
}
