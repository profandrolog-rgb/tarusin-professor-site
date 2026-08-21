import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, LockKeyhole, Network, Server, ShieldCheck, Terminal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NETCUP_CONSOLE_URL = "https://www.servercontrolpanel.de/scp-ui/servers/921603/screen";

const AdminServers = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [accessPassword, setAccessPassword] = useState("");
  const [accessError, setAccessError] = useState("");
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [panelUrl, setPanelUrl] = useState("");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/servers" } });
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleUnlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCheckingAccess(true);
    setAccessError("");

    try {
      const { data, error } = await supabase.functions.invoke("admin-server-access", {
        body: { password: accessPassword },
      });

      if (error || !data?.panelUrl) {
        setAccessError("Неверный дополнительный пароль");
        return;
      }

      setPanelUrl(data.panelUrl);
      setAccessPassword("");
    } catch {
      setAccessError("Не удалось проверить пароль. Попробуйте ещё раз.");
    } finally {
      setIsCheckingAccess(false);
    }
  };

  if (!panelUrl) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-md space-y-6">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад в админ-панель
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <LockKeyhole className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Дополнительная защита</CardTitle>
              <CardDescription>
                Введите отдельный пароль, чтобы открыть управление сервером и VPN.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleUnlock}>
                <div className="space-y-2">
                  <Label htmlFor="server-access-password">Пароль доступа</Label>
                  <Input
                    id="server-access-password"
                    type="password"
                    autoComplete="current-password"
                    value={accessPassword}
                    onChange={(event) => setAccessPassword(event.target.value)}
                    aria-invalid={Boolean(accessError)}
                    autoFocus
                  />
                  {accessError && <p className="text-sm text-destructive">{accessError}</p>}
                </div>
                <Button className="w-full" type="submit" disabled={!accessPassword || isCheckingAccess}>
                  {isCheckingAccess && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Открыть управление
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-5xl space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад в админ-панель
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">Серверы и VPN</h1>
              <Badge variant="secondary">Только для администратора</Badge>
            </div>
            <p className="text-muted-foreground">
              Быстрый переход к управлению отдельным VPN-сервером netcup.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPanelUrl("");
            }}
          >
            <LockKeyhole className="mr-2 h-4 w-4" />
            Заблокировать
          </Button>
        </div>

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Двойная защита включена</AlertTitle>
          <AlertDescription>
            Сначала проверяется роль администратора сайта, затем отдельный пароль. Пароль передаётся только
            защищённой серверной проверке и не сохраняется в браузере; доступ сбрасывается при обновлении страницы.
          </AlertDescription>
        </Alert>

        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <Server className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Панель 3x-ui</CardTitle>
              <CardDescription>
                Клиенты VPN, QR-коды, ссылки подписки, трафик и настройки VLESS Reality.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="font-medium">VPS nano G11s · Nuremberg</div>
                <div className="mt-1 font-mono text-muted-foreground">185.194.142.204 · VPN 443/tcp</div>
              </div>
              <Button asChild className="w-full">
                <a href={panelUrl} target="_blank" rel="noopener noreferrer">
                  Открыть 3x-ui
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10">
                <Terminal className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Консоль сервера</CardTitle>
              <CardDescription>
                Экран Debian в Server Control Panel: перезагрузка, восстановление доступа и работа через консоль.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-muted-foreground">
                  netcup может попросить повторно войти. Учётные данные netcup не передаются сайту.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <a href={NETCUP_CONSOLE_URL} target="_blank" rel="noopener noreferrer">
                  Открыть консоль netcup
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-sky-500/10">
                <Network className="h-6 w-6 text-sky-600" />
              </div>
              <CardTitle>Прокси сайта</CardTitle>
              <CardDescription>
                Основной маршрут сайта к базе данных и серверным функциям через api2.tarusin.pro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="font-medium">Управляемый маршрут Supabase</div>
                <div className="mt-1 font-mono text-muted-foreground">api2.tarusin.pro</div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/system-settings">
                  Проверка и управление прокси
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminServers;
