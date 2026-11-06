import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSessionSupabaseClient: async () => ({
    auth: { signInWithPassword: mocks.signInWithPassword, signOut: mocks.signOut },
    rpc: mocks.rpc,
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  }),
}));

import { signInAction } from "@/features/auth/actions";

function credentials() {
  const data = new FormData();
  data.set("email", "someone@example.com");
  data.set("password", "correct-password");
  return data;
}

describe("관리자 로그인", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    mocks.signOut.mockResolvedValue({ error: null });
  });

  it("관리자면 관리자 화면으로 보낸다", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    await expect(signInAction({ error: null }, credentials())).rejects.toMatchObject({ url: "/admin" });
  });

  it("로그인은 됐지만 관리자가 아니면 세션을 끊고 이유를 알려 준다", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });

    const result = await signInAction({ error: null }, credentials());

    expect(result.error).toBeTruthy();
    expect(mocks.signOut).toHaveBeenCalled();
  });

  it("관리자 여부를 확인하지 못하면 세션을 끊고 실패로 알린다", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "db down" } });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await signInAction({ error: null }, credentials());

    expect(result.error).toBeTruthy();
    expect(mocks.signOut).toHaveBeenCalled();
  });
});
