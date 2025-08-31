import {
  CheckHealthData,
  CompleteQuestRequest,
  CompleteTodayData,
  CompleteTodayError,
  CreateQuestData,
  CreateQuestError,
  CreateQuestRequest,
  DeleteQuestData,
  DeleteQuestError,
  DeleteQuestParams,
  GenerateRivalData,
  GenerateRivalError,
  GenerateRivalParams,
  GetQuotaStatusData,
  GetRivalData,
  GetSubscriptionStatusData,
  InitializePaymentData,
  InitializePaymentError,
  InitializePaymentRequest,
  ListQuestsData,
  ListRivalsData,
  PaystackWebhookData,
  VerifyPaymentData,
  VerifyPaymentError,
  VerifyPaymentParams,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Initialize payment with Paystack
   *
   * @tags dbtn/module:payments, dbtn/hasAuth
   * @name initialize_payment
   * @summary Initialize Payment
   * @request POST:/routes/payments/initialize
   */
  initialize_payment = (data: InitializePaymentRequest, params: RequestParams = {}) =>
    this.request<InitializePaymentData, InitializePaymentError>({
      path: `/routes/payments/initialize`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Verify payment status with Paystack
   *
   * @tags dbtn/module:payments, dbtn/hasAuth
   * @name verify_payment
   * @summary Verify Payment
   * @request GET:/routes/payments/verify/{reference}
   */
  verify_payment = ({ reference, ...query }: VerifyPaymentParams, params: RequestParams = {}) =>
    this.request<VerifyPaymentData, VerifyPaymentError>({
      path: `/routes/payments/verify/${reference}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get current subscription status for user
   *
   * @tags dbtn/module:payments, dbtn/hasAuth
   * @name get_subscription_status
   * @summary Get Subscription Status
   * @request GET:/routes/payments/subscription-status
   */
  get_subscription_status = (params: RequestParams = {}) =>
    this.request<GetSubscriptionStatusData, any>({
      path: `/routes/payments/subscription-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get current quest quota status for user
   *
   * @tags dbtn/module:payments, dbtn/hasAuth
   * @name get_quota_status
   * @summary Get Quota Status
   * @request GET:/routes/payments/quota-status
   */
  get_quota_status = (params: RequestParams = {}) =>
    this.request<GetQuotaStatusData, any>({
      path: `/routes/payments/quota-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Handle Paystack webhooks for payment confirmations
   *
   * @tags dbtn/module:payments, dbtn/hasAuth
   * @name paystack_webhook
   * @summary Paystack Webhook
   * @request POST:/routes/payments/webhook
   */
  paystack_webhook = (params: RequestParams = {}) =>
    this.request<PaystackWebhookData, any>({
      path: `/routes/payments/webhook`,
      method: "POST",
      ...params,
    });

  /**
   * @description Create a new daily quest for the user - NO LIMITS on quest creation!
   *
   * @tags dbtn/module:quests, dbtn/hasAuth
   * @name create_quest
   * @summary Create Quest
   * @request POST:/routes/quests/create
   */
  create_quest = (data: CreateQuestRequest, params: RequestParams = {}) =>
    this.request<CreateQuestData, CreateQuestError>({
      path: `/routes/quests/create`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all quests for the current user with completion status and daily limits
   *
   * @tags dbtn/module:quests, dbtn/hasAuth
   * @name list_quests
   * @summary List Quests
   * @request GET:/routes/quests/list
   */
  list_quests = (params: RequestParams = {}) =>
    this.request<ListQuestsData, any>({
      path: `/routes/quests/list`,
      method: "GET",
      ...params,
    });

  /**
   * @description Mark a quest as completed for today - WITH DAILY COMPLETION LIMITS!
   *
   * @tags dbtn/module:quests, dbtn/hasAuth
   * @name complete_today
   * @summary Complete Today
   * @request POST:/routes/quests/complete-today
   */
  complete_today = (data: CompleteQuestRequest, params: RequestParams = {}) =>
    this.request<CompleteTodayData, CompleteTodayError>({
      path: `/routes/quests/complete-today`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a quest and all its completions
   *
   * @tags dbtn/module:quests, dbtn/hasAuth
   * @name delete_quest
   * @summary Delete Quest
   * @request DELETE:/routes/quests/delete/{quest_id}
   */
  delete_quest = ({ questId, ...query }: DeleteQuestParams, params: RequestParams = {}) =>
    this.request<DeleteQuestData, DeleteQuestError>({
      path: `/routes/quests/delete/${questId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Get the primary/active rival for the user
   *
   * @tags dbtn/module:rivals, dbtn/hasAuth
   * @name get_rival
   * @summary Get Rival
   * @request GET:/routes/rivals/get
   */
  get_rival = (params: RequestParams = {}) =>
    this.request<GetRivalData, any>({
      path: `/routes/rivals/get`,
      method: "GET",
      ...params,
    });

  /**
   * @description List all rivals for the user with subscription limits
   *
   * @tags dbtn/module:rivals, dbtn/hasAuth
   * @name list_rivals
   * @summary List Rivals
   * @request GET:/routes/rivals/list
   */
  list_rivals = (params: RequestParams = {}) =>
    this.request<ListRivalsData, any>({
      path: `/routes/rivals/list`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate a new rival with specified personality type
   *
   * @tags dbtn/module:rivals, dbtn/hasAuth
   * @name generate_rival
   * @summary Generate Rival
   * @request POST:/routes/rivals/generate
   */
  generate_rival = (query: GenerateRivalParams, params: RequestParams = {}) =>
    this.request<GenerateRivalData, GenerateRivalError>({
      path: `/routes/rivals/generate`,
      method: "POST",
      query: query,
      ...params,
    });
}
