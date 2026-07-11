import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Mail, Lock, Loader2, Stethoscope, UserCircle, BookOpen } from "lucide-react";
import { z } from "zod";
import { e as useToast, u as useAuth, C as Card, c as CardHeader, d as CardTitle, v as CardDescription, a as CardContent, L as Label, I as Input, B as Button, s as supabase } from "../main.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CJYPrMmK.js";
import { R as RadioGroup, a as RadioGroupItem } from "./radio-group-CM9YN36E.js";
import "vite-react-ssg";
import "@tanstack/react-query";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@supabase/supabase-js";
import "i18next";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "react-helmet-async";
import "@radix-ui/react-tabs";
import "@radix-ui/react-radio-group";
const Auth = () => {
  var _a;
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const authSchema = z.object({
    email: z.string().trim().email({ message: isEn ? "Invalid email format" : "Неверный формат email" }),
    password: z.string().min(6, { message: isEn ? "Password must be at least 6 characters" : "Пароль должен быть не менее 6 символов" })
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get("tab") === "register" ? "signup" : "signin";
  const from = ((_a = location.state) == null ? void 0 : _a.from) || "/";
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);
  const validateForm = (isSignUp = false) => {
    const result = authSchema.safeParse({ email, password });
    const fieldErrors = {};
    if (!result.success) {
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
    }
    if (isSignUp && !userType) {
      fieldErrors.userType = isEn ? "Please select who you are" : "Пожалуйста, выберите кто вы";
    }
    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({
        title: isEn ? "Sign in error" : "Ошибка входа",
        description: error.message === "Invalid login credentials" ? isEn ? "Invalid email or password" : "Неверный email или пароль" : error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: isEn ? "Signed in" : "Успешный вход", description: isEn ? "Welcome!" : "Добро пожаловать!" });
      navigate(from, { replace: true });
    }
  };
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    setLoading(true);
    const { error } = await signUp(email, password);
    if (error) {
      setLoading(false);
      let message = error.message;
      if (error.message.includes("already registered")) {
        message = isEn ? "This email is already registered" : "Этот email уже зарегистрирован";
      }
      toast({ title: isEn ? "Registration error" : "Ошибка регистрации", description: message, variant: "destructive" });
      return;
    }
    const { data: { user: newUser } } = await supabase.auth.getUser();
    if (newUser && userType) {
      await supabase.from("profiles").insert({ user_id: newUser.id, email, user_type: userType });
    }
    setLoading(false);
    toast({ title: isEn ? "Registration successful" : "Регистрация успешна", description: isEn ? "You have been registered and signed in" : "Вы успешно зарегистрированы и вошли в систему" });
    navigate(from, { replace: true });
  };
  const userTypeOptions = [
    { value: "medical_specialist", label: isEn ? "I am a medical specialist" : "Я медицинский специалист", icon: Stethoscope },
    { value: "patient", label: isEn ? "I am a patient" : "Я пациент", icon: UserCircle },
    { value: "researcher", label: isEn ? "I am exploring the topic" : "Я просто изучаю проблему", icon: BookOpen }
  ];
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      isEn ? "Home" : "На главную"
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-4", children: isEn ? "DT" : "ТД" }),
        /* @__PURE__ */ jsx(CardTitle, { className: "text-2xl", children: isEn ? "Sign In" : "Вход в систему" }),
        /* @__PURE__ */ jsx(CardDescription, { children: isEn ? "Sign in or register to view videos" : "Войдите или зарегистрируйтесь для просмотра видео" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Tabs, { defaultValue: initialTab, className: "w-full", children: [
        /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [
          /* @__PURE__ */ jsx(TabsTrigger, { value: "signin", children: isEn ? "Sign In" : "Вход" }),
          /* @__PURE__ */ jsx(TabsTrigger, { value: "signup", children: isEn ? "Register" : "Регистрация" })
        ] }),
        /* @__PURE__ */ jsx(TabsContent, { value: "signin", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSignIn, className: "space-y-4 mt-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "signin-email", children: "Email" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx(Input, { id: "signin-email", type: "email", placeholder: "email@example.com", value: email, onChange: (e) => setEmail(e.target.value), className: "pl-10" })
            ] }),
            errors.email && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: errors.email })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "signin-password", children: isEn ? "Password" : "Пароль" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx(Input, { id: "signin-password", type: "password", placeholder: "••••••••", value: password, onChange: (e) => setPassword(e.target.value), className: "pl-10" })
            ] }),
            errors.password && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: errors.password })
          ] }),
          /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
            isEn ? "Signing in..." : "Вход..."
          ] }) : isEn ? "Sign In" : "Войти" })
        ] }) }),
        /* @__PURE__ */ jsx(TabsContent, { value: "signup", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSignUp, className: "space-y-4 mt-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-base font-medium", children: isEn ? "Who are you?" : "Кто вы?" }),
            /* @__PURE__ */ jsx(RadioGroup, { value: userType || "", onValueChange: (value) => setUserType(value), className: "space-y-2", children: userTypeOptions.map((option) => /* @__PURE__ */ jsxs("div", { className: `flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${userType === option.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`, onClick: () => setUserType(option.value), children: [
              /* @__PURE__ */ jsx(RadioGroupItem, { value: option.value, id: option.value }),
              /* @__PURE__ */ jsx(option.icon, { className: "w-5 h-5 text-primary" }),
              /* @__PURE__ */ jsx(Label, { htmlFor: option.value, className: "cursor-pointer flex-1", children: option.label })
            ] }, option.value)) }),
            errors.userType && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: errors.userType })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "signup-email", children: "Email" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx(Input, { id: "signup-email", type: "email", placeholder: "email@example.com", value: email, onChange: (e) => setEmail(e.target.value), className: "pl-10" })
            ] }),
            errors.email && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: errors.email })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "signup-password", children: isEn ? "Password" : "Пароль" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx(Input, { id: "signup-password", type: "password", placeholder: "••••••••", value: password, onChange: (e) => setPassword(e.target.value), className: "pl-10" })
            ] }),
            errors.password && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: errors.password })
          ] }),
          /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
            isEn ? "Registering..." : "Регистрация..."
          ] }) : isEn ? "Register" : "Зарегистрироваться" })
        ] }) })
      ] }) })
    ] })
  ] }) });
};
export {
  Auth as default
};
