import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RepeatWithLabsData } from "@/lib/visits/protocolSchemas";
import { LocalStatusAndrologySection } from "../sections/LocalStatusAndrology";

interface Props {
  data: RepeatWithLabsData;
  onChange: (patch: Partial<RepeatWithLabsData>) => void;
}

export function RepeatWithLabsForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-1"><Label>Жалобы / динамика</Label>
        <Textarea rows={3} value={data.complaints || ""} onChange={(e) => onChange({ complaints: e.target.value })} />
      </div>

      <Card><CardHeader><CardTitle className="text-sm">Лабораторные данные</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1"><Label>Общий анализ крови</Label>
            <Textarea rows={2} value={data.cbc || ""} onChange={(e) => onChange({ cbc: e.target.value })} />
          </div>
          <div className="space-y-1"><Label>Общий анализ мочи</Label>
            <Textarea rows={2} value={data.urinalysis || ""} onChange={(e) => onChange({ urinalysis: e.target.value })} />
          </div>
          <div className="space-y-1"><Label>Биохимия крови</Label>
            <Textarea rows={2} value={data.biochem || ""} onChange={(e) => onChange({ biochem: e.target.value })} />
          </div>
          <div className="space-y-1"><Label>Гормональный профиль</Label>
            <Textarea rows={2} value={data.hormones || ""} onChange={(e) => onChange({ hormones: e.target.value })} />
          </div>
          <div className="space-y-1"><Label>Другие исследования</Label>
            <Textarea rows={2} value={data.other_labs || ""} onChange={(e) => onChange({ other_labs: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-sm">Локальный статус</CardTitle></CardHeader>
        <CardContent><LocalStatusAndrologySection data={data.local_status || {}} onChange={(p) => onChange({ local_status: { ...(data.local_status || {}), ...p } })} /></CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1"><Label>Заключение по обследованию</Label>
          <Textarea rows={4} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
        </div>
        <div className="space-y-1"><Label>Рекомендации</Label>
          <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
