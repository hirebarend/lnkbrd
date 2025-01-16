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

  const result: jsonwebtoken.JwtPayload = jsonwebtoken.decode(
    token,
  ) as jsonwebtoken.JwtPayload;

  return result.email;
}