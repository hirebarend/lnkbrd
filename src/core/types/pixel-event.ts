import { UAParser } from 'ua-parser-js';

export type PixelEvent = {
  consumer: string;

  country: string | null;

  ipAddress: string | null;

  metadata:
    | {
        code: string;
        longUrl: string;
      }
    | { [key: string]: string };

  referrer: string | null;

  tags: Array<string>;

  timestamp: number;

  type: string;

  userAgent: UAParser.IResult;
};
