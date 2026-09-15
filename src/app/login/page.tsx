"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "@/components/ThemeToggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import LegalDocuments from "@/components/LegalDocuments";

const phoneRegex = /^1[3-9]\d{9}$/;

const phoneSchema = z
  .string()
  .min(1, "请输入手机号码")
  .regex(phoneRegex, "请输入有效的11位手机号码");

const codeLoginSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6, "验证码为6位数字"),
});

const passwordLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "请输入密码"),
});

const registerSchema = z.object({
  nickname: z.string().trim().min(1, "请输入昵称").max(20, "昵称最多20个字符"),
  phone: phoneSchema,
  password: z.string().min(6, "密码至少6位").max(64, "密码最多64位"),
  code: z.string().length(6, "验证码为6位数字"),
});

type CodeLoginFormValues = z.infer<typeof codeLoginSchema>;
type PasswordLoginFormValues = z.infer<typeof passwordLoginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get("phone") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [devPhone, setDevPhone] = useState<string>("");
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null,
  );
  const [lockoutRemaining, setLockoutRemaining] = useState<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lockoutRef = useRef<NodeJS.Timeout | null>(null);

  // 注册页头像
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  // 密码可见性
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const codeForm = useForm<CodeLoginFormValues>({
    resolver: zodResolver(codeLoginSchema),
    defaultValues: { phone: initialPhone, code: "" },
  });

  const pwdForm = useForm<PasswordLoginFormValues>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: { phone: initialPhone, password: "" },
  });

  const regForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nickname: "", phone: "", password: "", code: "" },
  });

  useEffect(() => {
    const savedPhone = localStorage.getItem("login_phone");
    if (savedPhone && !codeForm.getValues("phone")) {
      codeForm.setValue("phone", savedPhone);
      pwdForm.setValue("phone", savedPhone);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (lockoutRef.current) {
        clearInterval(lockoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function startCountdown() {
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
  }

  async function handleSendCode(phone: string, onError: (msg: string) => void) {
    if (!phoneRegex.test(phone)) {
      onError("请输入有效的11位手机号码");
      return;
    }

    localStorage.setItem("login_phone", phone);
    setIsSendingCode(true);
    setDevCode(null);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        onError(data.error || "发送失败");
        return;
      }

      if (data.devCode) {
        setDevCode(data.devCode);
        setDevPhone(phone);
        toast.success(`开发模式：验证码 ${data.devCode}`);
      } else {
        toast.success("验证码已发送，请注意查收短信");
      }

      startCountdown();
    } catch {
      onError("发送验证码失败，请稍后重试");
    } finally {
      setIsSendingCode(false);
    }
  }

  function handleLoginSuccess() {
    localStorage.removeItem("login_phone");
    toast.success("登录成功");
    router.replace("/");
  }

  async function onCodeLogin(data: CodeLoginFormValues) {
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

      handleLoginSuccess();
    } catch {
      toast.error("登录失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  async function onPasswordLogin(data: PasswordLoginFormValues) {
    if (lockoutRemaining && lockoutRemaining > 0) {
      toast.error(`操作过于频繁，请在 ${lockoutRemaining} 秒后重试`);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login-password", {
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
            `尝试次数过多，请在 ${Math.ceil(result.lockoutRemaining / 60)} 分钟后重试`,
          );
        } else {
          toast.error(result.error || "登录失败");
        }

        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);
        }
        return;
      }

      handleLoginSuccess();
    } catch {
      toast.error("登录失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarError("仅支持 JPG、PNG、GIF、WebP 格式");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("头像文件不能超过5MB");
      return;
    }

    setAvatarError(null);
    setAvatarFile(file);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onRegister(data: RegisterFormValues) {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("phone", data.phone);
      formData.append("nickname", data.nickname);
      formData.append("password", data.password);
      formData.append("code", data.code);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          toast.error("该手机号已注册，请直接登录");
          codeForm.setValue("phone", data.phone);
          document
            .querySelector<HTMLButtonElement>('[data-tab-trigger="login"]')
            ?.click();
          return;
        }
        toast.error(result.error || "注册失败");
        return;
      }

      localStorage.removeItem("login_phone");
      toast.success("注册成功，欢迎加入！");
      router.replace("/");
    } catch {
      toast.error("注册失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  function formatLockoutTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  const sendButton = (phoneValue: string, onError: (msg: string) => void) => (
    <Button
      type="button"
      variant="outline"
      disabled={isSendingCode || countdown > 0}
      onClick={() => handleSendCode(phoneValue, onError)}
      className="h-11 px-4 border-[#F8C8D4] text-[#F8C8D4] hover:bg-[#F8C8D4]/10 hover:text-[#F8C8D4] disabled:opacity-50 whitespace-nowrap"
    >
      {isSendingCode
        ? "发送中..."
        : countdown > 0
          ? `${countdown}s`
          : "获取验证码"}
    </Button>
  );

  const devCodePanel =
    devCode &&
    (codeForm.getValues("phone") === devPhone ||
      regForm.getValues("phone") === devPhone) ? (
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
        <p className="text-xs text-amber-600 mb-1">
          开发模式验证码（{devPhone}）
        </p>
        <p className="text-2xl font-bold text-amber-700 tracking-widest font-mono">
          {devCode}
        </p>
      </div>
    ) : null;

  const lockoutPanel = lockoutRemaining && lockoutRemaining > 0 && (
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
        <p className="text-sm font-medium text-red-600">操作过于频繁</p>
      </div>
      <p className="text-xs text-red-500">
        请在{" "}
        <span className="font-mono font-bold">
          {formatLockoutTime(lockoutRemaining)}
        </span>{" "}
        后重试
      </p>
    </div>
  );

  const attemptsPanel =
    remainingAttempts !== null &&
    remainingAttempts < 5 &&
    lockoutRemaining === null ? (
      <div className="rounded-lg bg-orange-50 border border-orange-200 p-2">
        <p className="text-xs text-orange-600 text-center">
          剩余尝试次数: {remainingAttempts}/5
        </p>
      </div>
    ) : null;

  const submitButton = (label: string, loadingLabel: string) => (
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
          {loadingLabel}
        </div>
      ) : (
        label
      )}
    </Button>
  );

  return (
    <div className="relative min-h-screen bg-[#FFF8F0]">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
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
            <h1 className="text-3xl font-bold text-[#3D2C2E] mb-2">虚拟恋人</h1>
            <p className="text-sm text-[#9B8A8E]">
              登录或创建账号，开始你的心动之旅
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-[#F8C8D4]/10 border border-white/50">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 h-11 bg-[#F8F0EA] rounded-xl p-1 mb-6">
                <TabsTrigger
                  value="login"
                  data-tab-trigger="login"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#3D2C2E] data-[state=active]:shadow-sm text-[#9B8A8E] font-medium transition-all"
                >
                  登录
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#3D2C2E] data-[state=active]:shadow-sm text-[#9B8A8E] font-medium transition-all"
                >
                  注册
                </TabsTrigger>
              </TabsList>

              {/* ==================== 登录 ==================== */}
              <TabsContent value="login">
                <LoginModeSwitcher
                  onSwitchToCode={() => {
                    const phone = pwdForm.getValues("phone");
                    if (phoneRegex.test(phone)) {
                      codeForm.setValue("phone", phone);
                    }
                  }}
                  onSwitchToPassword={() => {
                    const phone = codeForm.getValues("phone");
                    if (phoneRegex.test(phone)) {
                      pwdForm.setValue("phone", phone);
                    }
                  }}
                >
                  {/* —— 验证码登录 —— */}
                  <TabsContent value="code-login" className="mt-0">
                    <Form {...codeForm}>
                      <form
                        onSubmit={codeForm.handleSubmit(onCodeLogin)}
                        className="space-y-6"
                      >
                        <FormField
                          control={codeForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#3D2C2E] font-medium">
                                手机号码
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="请输入11位手机号码"
                                  type="tel"
                                  maxLength={11}
                                  className="h-11 border-[#EDE5E0] bg-white/50 text-[#3D2C2E] placeholder:text-[#9B8A8E]/60 focus:border-[#F8C8D4] focus:ring-[#F8C8D4]/20 transition-all tracking-wider font-mono"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={codeForm.control}
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
                                {sendButton(field.value, (msg) =>
                                  codeForm.setError("phone", { message: msg }),
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {devCodePanel}
                        {lockoutPanel}
                        {attemptsPanel}

                        {submitButton("登录", "登录中...")}
                      </form>
                    </Form>
                  </TabsContent>

                  {/* —— 密码登录 —— */}
                  <TabsContent value="password-login" className="mt-0">
                    <Form {...pwdForm}>
                      <form
                        onSubmit={pwdForm.handleSubmit(onPasswordLogin)}
                        className="space-y-6"
                      >
                        <FormField
                          control={pwdForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#3D2C2E] font-medium">
                                手机号码
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="请输入11位手机号码"
                                  type="tel"
                                  maxLength={11}
                                  className="h-11 border-[#EDE5E0] bg-white/50 text-[#3D2C2E] placeholder:text-[#9B8A8E]/60 focus:border-[#F8C8D4] focus:ring-[#F8C8D4]/20 transition-all tracking-wider font-mono"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={pwdForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#3D2C2E] font-medium">
                                密码
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    placeholder="请输入密码"
                                    type={
                                      showLoginPassword ? "text" : "password"
                                    }
                                    maxLength={64}
                                    className="h-11 pr-11 border-[#EDE5E0] bg-white/50 text-[#3D2C2E] placeholder:text-[#9B8A8E]/60 focus:border-[#F8C8D4] focus:ring-[#F8C8D4]/20 transition-all"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowLoginPassword(!showLoginPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B8A8E] hover:text-[#3D2C2E] transition-colors"
                                    tabIndex={-1}
                                    aria-label={
                                      showLoginPassword
                                        ? "隐藏密码"
                                        : "显示密码"
                                    }
                                  >
                                    {showLoginPassword ? (
                                      <EyeOff size={18} />
                                    ) : (
                                      <Eye size={18} />
                                    )}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {lockoutPanel}
                        {attemptsPanel}

                        {submitButton("登录", "登录中...")}
                      </form>
                    </Form>
                  </TabsContent>
                </LoginModeSwitcher>
              </TabsContent>

              {/* ==================== 注册 ==================== */}
              <TabsContent value="register">
                <Form {...regForm}>
                  <form
                    onSubmit={regForm.handleSubmit(onRegister)}
                    className="space-y-5"
                  >
                    {/* 头像上传 */}
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-[#F8C8D4] bg-[#FDF2F4] hover:bg-[#F8C8D4]/20 transition-colors group"
                        aria-label="上传头像"
                      >
                        {avatarPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarPreview}
                            alt="头像预览"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="flex flex-col items-center justify-center gap-0.5 text-[#F8A8BB] group-hover:text-[#F88BA3] transition-colors">
                            <Camera size={22} />
                            <span className="text-[10px]">
                              上传头像（可选）
                            </span>
                          </span>
                        )}
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <p className="text-xs text-[#9B8A8E]/70">
                        支持 JPG/PNG/GIF/WebP，不超过5MB
                      </p>
                      {avatarError && (
                        <p className="text-xs text-red-500">{avatarError}</p>
                      )}
                    </div>

                    <FormField
                      control={regForm.control}
                      name="nickname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#3D2C2E] font-medium">
                            昵称
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="给自己起个好听的名字"
                              type="text"
                              maxLength={20}
                              className="h-11 border-[#EDE5E0] bg-white/50 text-[#3D2C2E] placeholder:text-[#9B8A8E]/60 focus:border-[#F8C8D4] focus:ring-[#F8C8D4]/20 transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={regForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#3D2C2E] font-medium">
                            手机号码
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="请输入11位手机号码"
                              type="tel"
                              maxLength={11}
                              className="h-11 border-[#EDE5E0] bg-white/50 text-[#3D2C2E] placeholder:text-[#9B8A8E]/60 focus:border-[#F8C8D4] focus:ring-[#F8C8D4]/20 transition-all tracking-wider font-mono"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={regForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#3D2C2E] font-medium">
                            密码
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="至少6位密码"
                                type={
                                  showRegisterPassword ? "text" : "password"
                                }
                                maxLength={64}
                                className="h-11 pr-11 border-[#EDE5E0] bg-white/50 text-[#3D2C2E] placeholder:text-[#9B8A8E]/60 focus:border-[#F8C8D4] focus:ring-[#F8C8D4]/20 transition-all"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowRegisterPassword(!showRegisterPassword)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B8A8E] hover:text-[#3D2C2E] transition-colors"
                                tabIndex={-1}
                                aria-label={
                                  showRegisterPassword ? "隐藏密码" : "显示密码"
                                }
                              >
                                {showRegisterPassword ? (
                                  <EyeOff size={18} />
                                ) : (
                                  <Eye size={18} />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={regForm.control}
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
                            {sendButton(field.value, (msg) =>
                              regForm.setError("phone", { message: msg }),
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {devCodePanel}
                    {lockoutPanel}

                    {submitButton("注册并登录", "注册中...")}
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-[#9B8A8E]/60 leading-relaxed">
              登录即表示你同意我们的 <LegalDocuments type="terms" /> 和{" "}
              <LegalDocuments type="privacy" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 登录方式切换器：验证码登录 / 密码登录（嵌套 Tabs 实现）
 */
function LoginModeSwitcher({
  children,
  onSwitchToCode,
  onSwitchToPassword,
}: {
  children: React.ReactNode;
  onSwitchToCode: () => void;
  onSwitchToPassword: () => void;
}) {
  return (
    <Tabs defaultValue="code-login">
      <div className="flex justify-center mb-6">
        <TabsList className="h-9 bg-[#FFF8F0] rounded-full p-1">
          <TabsTrigger
            value="code-login"
            onClick={onSwitchToCode}
            className="rounded-full px-5 h-7 text-sm data-[state=active]:bg-white data-[state=active]:text-[#F88BA3] data-[state=active]:shadow-sm text-[#9B8A8E] transition-all"
          >
            验证码登录
          </TabsTrigger>
          <TabsTrigger
            value="password-login"
            onClick={onSwitchToPassword}
            className="rounded-full px-5 h-7 text-sm data-[state=active]:bg-white data-[state=active]:text-[#F88BA3] data-[state=active]:shadow-sm text-[#9B8A8E] transition-all"
          >
            密码登录
          </TabsTrigger>
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}
