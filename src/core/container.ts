import { Db, MongoClient } from 'mongodb';
import { PostHog } from 'posthog-node';

export type Container = {
  db: Db;
  mongoClient: MongoClient;
  posthog: PostHog | undefined;
};

let container: Container | null = null;

export async function getContainer() {
  if (container) {
    return container;
  }

  const mongoClient = await MongoClient.connect(
    process.env.MONGODB_CONNECTION_STRING as string,
  );

  const db = mongoClient.db(process.env.MONGODB_DATABASE_NAME || 'lnkbrd');

  container = {
    db,
    mongoClient,
    posthog: process.env.POSTHOG_API_KEY
      ? new PostHog(process.env.POSTHOG_API_KEY, {
          host: 'https://eu.i.posthog.com',
        })
      : undefined,
  };

  return container;
}

export async function disposeContainer() {
  if (!container) {
    return;
  }

  await container.mongoClient.close();

  container = null;
}
