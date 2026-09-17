import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";

// Use the Argon2id variant (Algorithm.Argon2id = 2). The const enum cannot be
// referenced directly because the project compiles with `isolatedModules`.
const ARGON2ID = 2;

const HASH_OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return argon2Hash(password, HASH_OPTIONS);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2Verify(passwordHash, password);
  } catch {
    return false;
  }
}