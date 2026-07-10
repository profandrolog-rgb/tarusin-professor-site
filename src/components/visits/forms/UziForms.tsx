import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UziReproductiveOnlyData, UziUrinaryOnlyData, UziBladderData, DynamicWithUziData, RepeatWithUziData } from "@/lib/visits/protocolSchemas";

import { UziReproductiveSection } from "../sections/UziReproductive";
import { UziUrinarySection } from "../sections/UziUrinary";
import { LocalStatusAndrologySection } from "../sections/LocalStatusAndrology";
import { OrthoStatusSection } from "../sections/OrthoStatus";
import { PsychStatusSection } from "../sections/PsychStatus";
import { SmartFieldLabel } from "../SmartTemplates";
import { ClinicalHistorySection } from "../sections/ClinicalHistorySection";


export function UziReproductiveForm({ data, onChange, patientId, currentVisitId }: { data: UziReproductiveOnlyData; onChange: (p: Partial<UziReproductiveOnlyData>) => void; patientId?: string | null; currentVisitId?: string | null }) {
  return (
    <div className="space-y-4">
      <ClinicalHistorySection data={data as any} onChange={(p) => onChange(p as any)} rows={3} patientId={patientId} currentVisitId={currentVisitId} />
      <div className="space-y-1"><SmartFieldLabel value={data.indications || ""} onSet={(v) => onChange({ indications: v })}>Показания к исследованию</SmartFieldLabel>
        <Textarea rows={2} value={data.indications || ""} onChange={(e) => onChange({ indications: e.target.value })} />
      </div>
      <UziReproductiveSection data={data.uzi || {}} onChange={(p) => onChange({ uzi: { ...(data.uzi || {}), ...p } })} />
      <div className="space-y-1"><SmartFieldLabel fieldKey="recommendations">Рекомендации</SmartFieldLabel>
        <Textarea rows={3} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
      </div>
    </div>
  );
}

export function UziUrinaryForm({ data, onChange, patientId, currentVisitId }: { data: UziUrinaryOnlyData; onChange: (p: Partial<UziUrinaryOnlyData>) => void; patientId?: string | null; currentVisitId?: string | null }) {
  return (
    <div className="space-y-4">
      <ClinicalHistorySection data={data as any} onChange={(p) => onChange(p as any)} rows={3} patientId={patientId} currentVisitId={currentVisitId} />
      <div className="space-y-1"><SmartFieldLabel value={data.indications || ""} onSet={(v) => onChange({ indications: v })}>Показания к исследованию</SmartFieldLabel>
        <Textarea rows={2} value={data.indications || ""} onChange={(e) => onChange({ indications: e.target.value })} />
      </div>
      <UziUrinarySection data={data.uzi || {}} onChange={(p) => onChange({ uzi: { ...(data.uzi || {}), ...p } })} />
      <div className="space-y-1"><SmartFieldLabel fieldKey="recommendations">Рекомендации</SmartFieldLabel>
        <Textarea rows={3} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
      </div>
    </div>
  );
}

export function UziBladderForm({ data, onChange }: { data: UziBladderData; onChange: (p: Partial<UziBladderData>) => void }) {
  const printEnabled = data.print_enabled !== false;
  return (
    <div className="space-y-4">
      <Card className="border-dashed">
        <CardContent className="pt-4 pb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={printEnabled}
              onCheckedChange={(v) => onChange({ print_enabled: v === true })}
            />
            <span className="text-sm">
              Включить этот протокол в печатный бланк
              <span className="text-muted-foreground ml-1">(можно отключить, чтобы сохранить данные без вывода на печать)</span>
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="space-y-1">
        <SmartFieldLabel value={data.indications || ""} onSet={(v) => onChange({ indications: v })}>Показания к исследованию</SmartFieldLabel>
        <Textarea rows={2} value={data.indications || ""} onChange={(e) => onChange({ indications: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Аппарат / датчик</Label>
        <Input value={data.device || ""} onChange={(e) => onChange({ device: e.target.value })} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Мочевой пузырь</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Объём до микции (мл)</Label>
              <Input value={data.bladder_volume || ""} onChange={(e) => onChange({ bladder_volume: e.target.value })} placeholder="напр. 250" />
            </div>
            <div className="space-y-1">
              <Label>Позыв на микцию</Label>
              <Input value={data.micturition_urge || ""} onChange={(e) => onChange({ micturition_urge: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Стенки мочевого пузыря</Label>
            <Textarea rows={2} value={data.bladder_walls || ""} onChange={(e) => onChange({ bladder_walls: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Содержимое</Label>
            <Textarea rows={2} value={data.bladder_contents || ""} onChange={(e) => onChange({ bladder_contents: e.target.value })} />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Остаточная моча (мл)</Label>
              <Input value={data.residual_urine || ""} onChange={(e) => onChange({ residual_urine: e.target.value })} placeholder="напр. 15 мл" />
            </div>
            <div className="space-y-1">
              <Label>Остаточная моча, %</Label>
              <Input value={data.residual_urine_percent || ""} onChange={(e) => onChange({ residual_urine_percent: e.target.value })} placeholder="напр. 6%" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <SmartFieldLabel fieldKey="conclusion">Заключение</SmartFieldLabel>
          <Textarea rows={4} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
        </div>
        <div className="space-y-1">
          <SmartFieldLabel fieldKey="recommendations">Рекомендации</SmartFieldLabel>
          <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
        </div>
      </div>
    </div>
  );
}


export function DynamicWithUziForm({ data, onChange, birthDate, patientId, currentVisitId }: { data: DynamicWithUziData; onChange: (p: Partial<DynamicWithUziData>) => void; birthDate?: string | null; patientId?: string | null; currentVisitId?: string | null }) {
  return (
    <div className="space-y-6">
      <ClinicalHistorySection
        data={data as any}
        onChange={(p) => onChange(p as any)}
        rows={4}
        patientId={patientId}
        currentVisitId={currentVisitId}
      />
      <div className="space-y-1"><SmartFieldLabel value={data.lab_results || ""} onSet={(v) => onChange({ lab_results: v })}>Лабораторные данные</SmartFieldLabel>
        <Textarea rows={3} value={data.lab_results || ""} onChange={(e) => onChange({ lab_results: e.target.value })} />
      </div>
      <Card><CardHeader><CardTitle className="text-sm">Локальный статус</CardTitle></CardHeader>
        <CardContent><LocalStatusAndrologySection data={data.local_status || {}} onChange={(p) => onChange({ local_status: { ...(data.local_status || {}), ...p } })} /></CardContent>
      </Card>
      <OrthoStatusSection value={data.ortho_status} onChange={(v) => onChange({ ortho_status: v })} />
      <PsychStatusSection value={data} onChange={onChange} birthDate={birthDate} />

      <Card><CardHeader><CardTitle className="text-sm">УЗИ репродуктивной системы</CardTitle></CardHeader>
        <CardContent><UziReproductiveSection data={data.uzi || {}} onChange={(p) => onChange({ uzi: { ...(data.uzi || {}), ...p } })} /></CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1"><SmartFieldLabel fieldKey="conclusion">Заключение</SmartFieldLabel>
          <Textarea rows={4} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
        </div>
        <div className="space-y-1"><SmartFieldLabel fieldKey="recommendations">Рекомендации</SmartFieldLabel>
          <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

export function RepeatWithUziForm({ data, onChange, birthDate }: { data: RepeatWithUziData; onChange: (p: Partial<RepeatWithUziData>) => void; birthDate?: string | null }) {
  return (
    <div className="space-y-6">
      <ClinicalHistorySection data={data as any} onChange={(p) => onChange(p as any)} rows={3} />
      <Card><CardHeader><CardTitle className="text-sm">Локальный статус</CardTitle></CardHeader>
        <CardContent><LocalStatusAndrologySection data={data.local_status || {}} onChange={(p) => onChange({ local_status: { ...(data.local_status || {}), ...p } })} /></CardContent>
      </Card>
      <OrthoStatusSection value={data.ortho_status} onChange={(v) => onChange({ ortho_status: v })} />
      <PsychStatusSection value={data} onChange={onChange} birthDate={birthDate} />

      <Card><CardHeader><CardTitle className="text-sm">УЗИ репродуктивной системы</CardTitle></CardHeader>
        <CardContent><UziReproductiveSection data={data.uzi || {}} onChange={(p) => onChange({ uzi: { ...(data.uzi || {}), ...p } })} /></CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1"><SmartFieldLabel fieldKey="conclusion">Заключение / динамика</SmartFieldLabel>
          <Textarea rows={4} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
        </div>
        <div className="space-y-1"><SmartFieldLabel fieldKey="recommendations">Рекомендации</SmartFieldLabel>
          <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
