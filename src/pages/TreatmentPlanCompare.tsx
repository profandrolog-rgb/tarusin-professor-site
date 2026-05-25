import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GitCompare } from "lucide-react";

export default function TreatmentPlanCompare() {
  const [params] = useSearchParams();
  const a = params.get("a");
  const b = params.get("b");

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <GitCompare className="w-12 h-12 mx-auto text-primary" />
          <h1 className="text-2xl font-bold">Сравнение курсов</h1>
          <p className="text-muted-foreground">
            Скоро. Здесь будет таблица side-by-side для курсов {a?.slice(0,8)}… и {b?.slice(0,8)}…
          </p>
          <Link to="/admin/treatment-plans">
            <Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4"/>К листам</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
