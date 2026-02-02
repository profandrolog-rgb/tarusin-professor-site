import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Phone,
  Mail,
  User,
  Baby,
  MessageSquare,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AppointmentRequest {
  id: string;
  child_age: string;
  problem_description: string;
  contact_phone: string | null;
  contact_email: string | null;
  parent_name: string | null;
  status: string;
  created_at: string;
  notes: string | null;
}

const statusConfig = {
  pending: { label: "Ожидает", icon: Clock, variant: "secondary" as const },
  reviewed: { label: "Рассмотрено", icon: CheckCircle2, variant: "default" as const },
  rejected: { label: "Отклонено", icon: XCircle, variant: "destructive" as const },
};

const AdminRequests = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/requests" } });
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchRequests();
    }
  }, [user, isAdmin]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointment_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить заявки",
        variant: "destructive",
      });
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("appointment_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус",
        variant: "destructive",
      });
    } else {
      setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
      toast({
        title: "Статус обновлён",
      });
    }
  };

  const updateNotes = async (id: string, notes: string) => {
    const { error } = await supabase
      .from("appointment_requests")
      .update({ notes })
      .eq("id", id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить заметку",
        variant: "destructive",
      });
    } else {
      setRequests(requests.map(r => r.id === id ? { ...r, notes } : r));
      toast({
        title: "Заметка сохранена",
      });
    }
  };

  const deleteRequest = async (id: string) => {
    const { error } = await supabase
      .from("appointment_requests")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить заявку",
        variant: "destructive",
      });
    } else {
      setRequests(requests.filter(r => r.id !== id));
      toast({
        title: "Заявка удалена",
      });
    }
  };

  const filteredRequests = filter === "all" 
    ? requests 
    : requests.filter(r => r.status === filter);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          К панели администратора
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Заявки на приём
            </h1>
            <p className="text-muted-foreground">
              Всего заявок: {requests.length} | Показано: {filteredRequests.length}
            </p>
          </div>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Фильтр" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все заявки</SelectItem>
              <SelectItem value="pending">Ожидают</SelectItem>
              <SelectItem value="reviewed">Рассмотрены</SelectItem>
              <SelectItem value="rejected">Отклонены</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Заявок пока нет</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusInfo = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={request.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Badge variant={statusInfo.variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleString("ru-RU")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select 
                          value={request.status} 
                          onValueChange={(value) => updateStatus(request.id, value)}
                        >
                          <SelectTrigger className="w-[150px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Ожидает</SelectItem>
                            <SelectItem value="reviewed">Рассмотрено</SelectItem>
                            <SelectItem value="rejected">Отклонено</SelectItem>
                          </SelectContent>
                        </Select>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить заявку?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Это действие нельзя отменить.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteRequest(request.id)}>
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {request.parent_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{request.parent_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Baby className="w-4 h-4 text-muted-foreground" />
                        <span>Возраст: {request.child_age}</span>
                      </div>
                      {request.contact_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <a href={`tel:${request.contact_phone}`} className="text-primary hover:underline">
                            {request.contact_phone}
                          </a>
                        </div>
                      )}
                      {request.contact_email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <a href={`mailto:${request.contact_email}`} className="text-primary hover:underline">
                            {request.contact_email}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm">{request.problem_description}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Заметки администратора:</label>
                      <Textarea
                        value={request.notes || ""}
                        onChange={(e) => {
                          setRequests(requests.map(r => 
                            r.id === request.id ? { ...r, notes: e.target.value } : r
                          ));
                        }}
                        onBlur={(e) => updateNotes(request.id, e.target.value)}
                        placeholder="Добавьте заметку..."
                        className="min-h-[60px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRequests;
