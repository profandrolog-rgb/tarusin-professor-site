import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UziReproductiveOnlyData, UziUrinaryOnlyData, DynamicWithUziData, RepeatWithUziData } from "@/lib/visits/protocolSchemas";
import { UziReproductiveSection } from "../sections/UziReproductive";
import { UziUrinarySection } from "../sections/UziUrinary";
import { LocalStatusAndrologySection } from "../sections/LocalStatusAndrology";

export function UziReproductiveForm({ data, onChange }: { data: UziReproductiveOnlyData; onChange: (p: Partial<UziReproductiveOnlyData>) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1"><Label>Показания к исследованию</Label>
        <Textarea rows={2} value={data.indications || ""} onChange={(e) => onChange({ indications: e.target.value })} />
      </div>
      <UziReproductiveSection data={data.uzi || {}} onChange={(p) => onChange({ uzi: { ...(data.uzi || {}), ...p } })} />
      <div className="space-y-1"><Label>Рекомендации</Label>
        <Textarea rows={3} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
      </div>
    </div>
  );
}

export function UziUrinaryForm({ data, onChange }: { data: UziUrinaryOnlyData; onChange: (p: Partial<UziUrinaryOnlyData>) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1"><Label>Показания к исследованию</Label>
        <Textarea rows={2} value={data.indications || ""} onChange={(e) => onChange({ indications: e.target.value })} />
      </div>
      <UziUrinarySection data={data.uzi || {}} onChange={(p) => onChange({ uzi: { ...(data.uzi || {}), ...p } })} />
      <div className="space-y-1"><Label>Рекомендации</Label>
        <Textarea rows={3} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
      </div>
    </div>
  );
}

export function DynamicWithUziForm({ data, onChange }: { data: DynamicWithUziData; onChange: (p: Partial<DynamicWithUziData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-1"><Label>Жалобы / динамика</Label>
        <Textarea rows={3} value={data.complaints || ""} onChange={(e) => onChange({ complaints: e.target.value })} />
      </div>
      <Card><CardHeader><CardTitle className="text-sm">Локальный статус</CardTitle></CardHeader>
        <CardContent><LocalStatusAndrologySection data={data.local_status || {}} onChange={(p) => onChange({ local_status: { ...(data.local_status || {}), ...p } })} /></CardContent>
      </Card>
      <Card><CardHeader><CardTitle className="text-sm">УЗИ репродуктивной системы</CardTitle></CardHeader>
        <CardContent><UziReproductiveSection data={data.uzi || {}} onChange={(p) => onChange({ uzi: { ...(data.uzi || {}), ...p } })} /></CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1"><Label>Заключение</Label>
          <Textarea rows={4} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
        </div>
        <div className="space-y-1"><Label>Рекомендации</Label>
          <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

export function RepeatWithUziForm({ data, onChange }: { data: RepeatWithUziData; onChange: (p: Partial<RepeatWithUziData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-1"><Label>Жалобы</Label>
        <Textarea rows={3} value={data.complaints || ""} onChange={(e) => onChange({ complaints: e.target.value })} />
      </div>
      <Card><CardHeader><CardTitle className="text-sm">Локальный статус</CardTitle></CardHeader>
        <CardContent><LocalStatusAndrologySection data={data.local_status || {}} onChange={(p) => onChange({ local_status: { ...(data.local_status || {}), ...p } })} /></CardContent>
      </Card>
      <Card><CardHeader><CardTitle className="text-sm">УЗИ репродуктивной системы</CardTitle></CardHeader>
        <CardContent><UziReproductiveSection data={data.uzi || {}} onChange={(p) => onChange({ uzi: { ...(data.uzi || {}), ...p } })} /></CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1"><Label>Заключение / динамика</Label>
          <Textarea rows={4} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
        </div>
        <div className="space-y-1"><Label>Рекомендации</Label>
          <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
