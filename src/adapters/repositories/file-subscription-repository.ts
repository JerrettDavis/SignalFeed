import path from "node:path";
import type {
  Subscription,
  SubscriptionId,
} from "@/domain/subscriptions/subscription";
import type {
  SubscriptionFilters,
  SubscriptionRepository,
} from "@/ports/subscription-repository";
import {
  readCollection,
  writeCollection,
  getDataDir,
} from "@/adapters/repositories/file-store";
import { seedSubscriptions } from "@/data/seed";

const getFilePath = () => path.join(getDataDir(), "subscriptions.json");

export const fileSubscriptionRepository = (): SubscriptionRepository => {
  const filePath = getFilePath();

  return {
    async create(subscription) {
      const data = await readCollection<Subscription>(
        filePath,
        seedSubscriptions
      );
      data.push(subscription);
      await writeCollection(filePath, data);
    },
    async list(filters?: SubscriptionFilters) {
      const data = await readCollection<Subscription>(
        filePath,
        seedSubscriptions
      );
      if (!filters?.email) {
        return data;
      }
      return data.filter(
        (subscription) => subscription.email === filters.email
      );
    },
    async getById(id: SubscriptionId) {
      const data = await readCollection<Subscription>(
        filePath,
        seedSubscriptions
      );
      return data.find((item) => item.id === id) ?? null;
    },
    async update(subscription) {
      const data = await readCollection<Subscription>(
        filePath,
        seedSubscriptions
      );
      const index = data.findIndex((item) => item.id === subscription.id);
      if (index !== -1) {
        data[index] = subscription;
        await writeCollection(filePath, data);
      }
    },
    async delete(id) {
      const data = await readCollection<Subscription>(
        filePath,
        seedSubscriptions
      );
      const filtered = data.filter((item) => item.id !== id);
      await writeCollection(filePath, filtered);
    },
    async deleteMany(ids) {
      const data = await readCollection<Subscription>(
        filePath,
        seedSubscriptions
      );
      const idSet = new Set(ids);
      const filtered = data.filter((item) => !idSet.has(item.id));
      await writeCollection(filePath, filtered);
    },
  };
};
