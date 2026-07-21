import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Mail, Lock, Loader2, UserCircle, Stethoscope, BookOpen } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type UserType = "medical_specialist" | "patient" | "researcher";

const Auth = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const authSchema = z.object({
    email: z.string().trim().email({ message: isEn ? "Invalid email format" : "Неверный формат email" }),
    password: z.string().min(6, { message: isEn ? "Password must be at least 6 characters" : "Пароль должен быть не менее 6 символов" }),
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; userType?: string }>({});
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get("tab") === "register" ? "signup" : "signin";
  const from = (location.state as { from?: string })?.from || "/";

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const validateForm = (isSignUp: boolean = false) => {
    const result = authSchema.safeParse({ email, password });
    const fieldErrors: { email?: string; password?: string; userType?: string } = {};
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({
        title: isEn ? "Sign in error" : "Ошибка входа",
        description: error.message === "Invalid login credentials"
          ? (isEn ? "Invalid email or password" : "Неверный email или пароль")
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: isEn ? "Signed in" : "Успешный вход", description: isEn ? "Welcome!" : "Добро пожаловать!" });
      navigate(from, { replace: true });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
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
    { value: "medical_specialist" as UserType, label: isEn ? "I am a medical specialist" : "Я медицинский специалист", icon: Stethoscope },
    { value: "patient" as UserType, label: isEn ? "I am a patient" : "Я пациент", icon: UserCircle },
    { value: "researcher" as UserType, label: isEn ? "I am exploring the topic" : "Я просто изучаю проблему", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {isEn ? "Home" : "На главную"}
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-4">
              {isEn ? "DT" : "ТД"}
            </div>
            <CardTitle className="text-2xl">{isEn ? "Sign In" : "Вход в систему"}</CardTitle>
            <CardDescription>
              {isEn ? "Sign in or register to view videos" : "Войдите или зарегистрируйтесь для просмотра видео"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={initialTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{isEn ? "Sign In" : "Вход"}</TabsTrigger>
                <TabsTrigger value="signup">{isEn ? "Register" : "Регистрация"}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signin-email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
                    </div>
                    <p className="text-sm text-destructive min-h-5">{errors.email || "\u00A0"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{isEn ? "Password" : "Пароль"}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signin-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" />
                    </div>
                    <p className="text-sm text-destructive min-h-5">{errors.password || "\u00A0"}</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isEn ? "Signing in..." : "Вход..."}</> : (isEn ? "Sign In" : "Войти")}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">{isEn ? "Who are you?" : "Кто вы?"}</Label>
                    <RadioGroup value={userType || ""} onValueChange={(value) => setUserType(value as UserType)} className="space-y-2">
                      {userTypeOptions.map((option) => (
                        <div key={option.value} className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${userType === option.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`} onClick={() => setUserType(option.value)}>
                          <RadioGroupItem value={option.value} id={option.value} />
                          <option.icon className="w-5 h-5 text-primary" />
                          <Label htmlFor={option.value} className="cursor-pointer flex-1">{option.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {errors.userType && <p className="text-sm text-destructive">{errors.userType}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{isEn ? "Password" : "Пароль"}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" />
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isEn ? "Registering..." : "Регистрация..."}</> : (isEn ? "Register" : "Зарегистрироваться")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
