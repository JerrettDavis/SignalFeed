import type {
  PushSubscription,
  PushSubscriptionRepository,
  StoredPushSubscription,
} from "@/domain/push/subscription";

export class InMemoryPushSubscriptionRepository implements PushSubscriptionRepository {
  private subscriptions: Map<string, StoredPushSubscription> = new Map();

  async save(userId: string, subscription: PushSubscription): Promise<StoredPushSubscription> {
    // Check if this exact subscription already exists
    for (const stored of this.subscriptions.values()) {
      if (stored.userId === userId && stored.subscription.endpoint === subscription.endpoint) {
        return stored;
      }
    }

    const stored: StoredPushSubscription = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      userId,
      subscription,
      createdAt: new Date().toISOString(),
    };

    this.subscriptions.set(stored.id, stored);
    return stored;
  }

  async findByUserId(userId: string): Promise<StoredPushSubscription[]> {
    return Array.from(this.subscriptions.values()).filter((sub) => sub.userId === userId);
  }

  async delete(id: string): Promise<void> {
    this.subscriptions.delete(id);
  }

  async getAll(): Promise<StoredPushSubscription[]> {
    return Array.from(this.subscriptions.values());
  }
}
