import * as jsonwebtoken from 'jsonwebtoken';

export function getConsumerFromHeader(
  header: string | Array<string> | undefined,
): string | null {
  if (!header) {
    return null;
  }

  if (header instanceof Array) {
    return null;
  }

  const headerSplitted: Array<string> = header.split(' ');

  if (headerSplitted.length !== 2) {
    return null;
  }

  if (headerSplitted[0].toLowerCase() !== 'bearer') {
    return null;
  }

  const token: string = headerSplitted[1];

  try {
    const result: jsonwebtoken.JwtPayload = jsonwebtoken.verify(
      token,
      process.env.SECRET || 'P@ssword!',
    ) as jsonwebtoken.JwtPayload;

    return result.sub || '';
  } catch {
    return null;
  }
}
