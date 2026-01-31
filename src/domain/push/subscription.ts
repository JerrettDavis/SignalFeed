export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface StoredPushSubscription {
  id: string;
  userId: string;
  subscription: PushSubscription;
  createdAt: string;
}

export interface PushSubscriptionRepository {
  save(userId: string, subscription: PushSubscription): Promise<StoredPushSubscription>;
  findByUserId(userId: string): Promise<StoredPushSubscription[]>;
  delete(id: string): Promise<void>;
  getAll(): Promise<StoredPushSubscription[]>;
}
