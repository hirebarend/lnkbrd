export type Link = {
  clicks: {
    count: number;

    timestamp: number | null;
  };

  code: string;

  consumer: string;

  created: number;

  expires: number | null;

  externalId: string | null;

  geoTargeting: Array<{ country: string; url: string }>;

  name: string | null;

  openGraph: {
    description: string | null;

    image: string | null;

    title: string | null;
  } | null;

  status: 'active' | 'inactive';

  tags: Array<string>;

  updated: number;

  url: string;

  webhook: string | null;
};
