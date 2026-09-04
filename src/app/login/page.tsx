"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().min(1, "请输入邮箱地址").email("请输入有效的邮箱地址"),
  code: z.string().length(6, "验证码为6位数字"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null,
  );
  const [lockoutRemaining, setLockoutRemaining] = useState<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lockoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: searchParams.get("email") || "",
      code: "",
    },
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem("login_email");
    if (savedEmail && !form.getValues("email")) {
      form.setValue("email", savedEmail);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (lockoutRef.current) {
        clearInterval(lockoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (lockoutRemaining && lockoutRemaining > 0) {
      lockoutRef.current = setInterval(() => {
        setLockoutRemaining((prev) => {
          if (prev && prev <= 1) {
            if (lockoutRef.current) clearInterval(lockoutRef.current);
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
    }

    return () => {
      if (lockoutRef.current) {
        clearInterval(lockoutRef.current);
      }
    };
  }, [lockoutRemaining]);

  async function handleSendCode() {
    const email = form.getValues("email");
    const emailValid = z.string().email().safeParse(email).success;

    if (!emailValid) {
      form.setError("email", { message: "请输入有效的邮箱地址" });
      return;
    }

    localStorage.setItem("login_email", email);
    setIsSendingCode(true);
    setDevCode(null);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "发送失败");
        return;
      }

      if (data.devCode) {
        setDevCode(data.devCode);
        toast.success(`开发模式：验证码 ${data.devCode}`);
      } else {
        toast.success("验证码已发送，请查收邮件");
      }

      setCountdown(60);

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      toast.error("发送验证码失败，请稍后重试");
    } finally {
      setIsSendingCode(false);
    }
  }

  async function onSubmit(data: LoginFormValues) {
    if (lockoutRemaining && lockoutRemaining > 0) {
      toast.error(`操作过于频繁，请在 ${lockoutRemaining} 秒后重试`);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.lockoutRemaining) {
          setLockoutRemaining(result.lockoutRemaining);
          toast.error(
            `验证次数过多，请在 ${Math.ceil(result.lockoutRemaining / 60)} 分钟后重试`,
          );
        } else {
          toast.error(result.error || "验证失败");
        }

        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);
        }
        return;
      }

      localStorage.removeItem("login_email");
      toast.success("登录成功");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("登录失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  function formatLockoutTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className="relative min-h-screen bg-[#FFF8F0]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#F8C8D4]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#A8D8EA]/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFB6C1]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F8C8D4] to-[#FFB6C1] shadow-lg shadow-[#F8C8D4]/30">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-[#3D2C2E] mb-2">欢迎回来</h1>
            <p className="text-sm text-[#9B8A8E]">邮箱验证码登录，安全便捷</p>
          </div>

          <div className="rounded-2xl bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-[#F8C8D4]/10 border border-white/50">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#3D2C2E] font-medium">
                        邮箱地址
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your@email.com"
                          type="email"
                          className="h-11 border-[#EDE5E0] bg-white/50 text-[#3D2C2E] placeholder:text-[#9B8A8E]/60 focus:border-[#F8C8D4] focus:ring-[#F8C8D4]/20 transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#3D2C2E] font-medium">
                        验证码
                      </FormLabel>
                      <div className="flex gap-3">
                        <FormControl>
                          <Input
                            placeholder="6位数字"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            className="h-11 border-[#EDE5E0] bg-white/50 text-[#3D2C2E] placeholder:text-[#9B8A8E]/60 focus:border-[#F8C8D4] focus:ring-[#F8C8D4]/20 transition-all flex-1 tracking-widest text-center font-mono text-lg"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isSendingCode || countdown > 0}
                          onClick={handleSendCode}
                          className="h-11 px-4 border-[#F8C8D4] text-[#F8C8D4] hover:bg-[#F8C8D4]/10 hover:text-[#F8C8D4] disabled:opacity-50 whitespace-nowrap"
                        >
                          {isSendingCode
                            ? "发送中..."
                            : countdown > 0
                              ? `${countdown}s`
                              : "获取验证码"}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {devCode && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
                    <p className="text-xs text-amber-600 mb-1">
                      开发模式验证码
                    </p>
                    <p className="text-2xl font-bold text-amber-700 tracking-widest font-mono">
                      {devCode}
                    </p>
                  </div>
                )}

                {lockoutRemaining && lockoutRemaining > 0 && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-red-600"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <p className="text-sm font-medium text-red-600">
                        操作过于频繁
                      </p>
                    </div>
                    <p className="text-xs text-red-500">
                      请在{" "}
                      <span className="font-mono font-bold">
                        {formatLockoutTime(lockoutRemaining)}
                      </span>{" "}
                      后重试
                    </p>
                  </div>
                )}

                {remainingAttempts !== null &&
                  remainingAttempts < 5 &&
                  lockoutRemaining === null && (
                    <div className="rounded-lg bg-orange-50 border border-orange-200 p-2">
                      <p className="text-xs text-orange-600 text-center">
                        剩余尝试次数: {remainingAttempts}/5
                      </p>
                    </div>
                  )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-[#F8C8D4] to-[#FFB6C1] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#F8C8D4]/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      登录中...
                    </div>
                  ) : (
                    "登录"
                  )}
                </Button>
              </form>
            </Form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-[#9B8A8E]/60">
              登录即表示你同意我们的{" "}
              <a href="#" className="underline hover:text-[#3D2C2E]">
                服务条款
              </a>{" "}
              和{" "}
              <a href="#" className="underline hover:text-[#3D2C2E]">
                隐私政策
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
