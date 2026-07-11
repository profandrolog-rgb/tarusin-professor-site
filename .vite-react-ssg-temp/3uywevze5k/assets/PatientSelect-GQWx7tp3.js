import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { B as Button, L as Label, I as Input, s as supabase } from "../main.mjs";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Search, Plus } from "lucide-react";
function PatientSelect({ selectedPatient, onSelect }) {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBirthDay, setNewBirthDay] = useState("");
  const [newBirthMonth, setNewBirthMonth] = useState("");
  const [newBirthYear, setNewBirthYear] = useState("");
  const [creatingPatient, setCreatingPatient] = useState(false);
  useEffect(() => {
    if (search.length >= 2) {
      const fetchPatients = async () => {
        const { data } = await supabase.from("patients").select("id, full_name, birth_date").ilike("full_name", `%${search}%`).limit(10);
        setPatients(data || []);
        setShowDropdown(true);
      };
      fetchPatients();
    } else {
      setPatients([]);
      setShowDropdown(false);
    }
  }, [search]);
  const handleCreatePatient = async () => {
    const day = parseInt(newBirthDay, 10);
    const month = parseInt(newBirthMonth, 10);
    const year = parseInt(newBirthYear, 10);
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const valid = newName && day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1920 && year <= currentYear;
    if (!valid) return;
    const birthDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setCreatingPatient(true);
    const { data, error } = await supabase.from("patients").insert({ full_name: newName.trim(), birth_date: birthDate }).select("id, full_name, birth_date").maybeSingle();
    setCreatingPatient(false);
    if (error) {
      console.error("[PatientSelect] insert error", error);
      toast.error("Не удалось создать пациента", { description: error.message });
      return;
    }
    let patient = data;
    if (!patient) {
      const { data: found } = await supabase.from("patients").select("id, full_name, birth_date").eq("full_name", newName.trim()).eq("birth_date", birthDate).order("created_at", { ascending: false }).limit(1).maybeSingle();
      patient = found ?? null;
    }
    if (!patient) {
      toast.error("Пациент создан, но не удалось его прочитать. Обновите список и выберите вручную.");
      return;
    }
    onSelect(patient);
    setIsCreating(false);
    setNewName("");
    setNewBirthDay("");
    setNewBirthMonth("");
    setNewBirthYear("");
    setSearch("");
    toast.success("Пациент создан");
  };
  if (selectedPatient) {
    return /* @__PURE__ */ jsx("div", { className: "border rounded-lg p-4 bg-secondary/30", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: selectedPatient.full_name }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Дата рождения: ",
          format(new Date(selectedPatient.birth_date), "dd.MM.yyyy")
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => {
        onSelect(null);
        setSearch("");
      }, children: "Изменить" })
    ] }) });
  }
  if (isCreating) {
    const day = parseInt(newBirthDay, 10);
    const month = parseInt(newBirthMonth, 10);
    const year = parseInt(newBirthYear, 10);
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const birthValid = day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1920 && year <= currentYear;
    return /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-4 space-y-4", children: [
      /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Новый пациент" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "ФИО пациента" }),
        /* @__PURE__ */ jsx(Input, { value: newName, onChange: (e) => setNewName(e.target.value), placeholder: "Иванов Иван Иванович" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Дата рождения" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-center", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              inputMode: "numeric",
              maxLength: 2,
              value: newBirthDay,
              onChange: (e) => setNewBirthDay(e.target.value.replace(/\D/g, "")),
              placeholder: "ДД",
              className: "w-20 text-center"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "." }),
          /* @__PURE__ */ jsx(
            Input,
            {
              inputMode: "numeric",
              maxLength: 2,
              value: newBirthMonth,
              onChange: (e) => setNewBirthMonth(e.target.value.replace(/\D/g, "")),
              placeholder: "ММ",
              className: "w-20 text-center"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "." }),
          /* @__PURE__ */ jsx(
            Input,
            {
              inputMode: "numeric",
              maxLength: 4,
              value: newBirthYear,
              onChange: (e) => setNewBirthYear(e.target.value.replace(/\D/g, "")),
              placeholder: "ГГГГ",
              className: "w-28 text-center"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { onClick: handleCreatePatient, disabled: !newName || !birthValid || creatingPatient, children: [
          creatingPatient ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }) : null,
          "Создать"
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setIsCreating(false), children: "Отмена" })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2 relative", children: [
    /* @__PURE__ */ jsx(Label, { children: "Пациент" }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: search,
            onChange: (e) => setSearch(e.target.value),
            placeholder: "Поиск по ФИО (минимум 2 символа)...",
            className: "pl-9"
          }
        ),
        showDropdown && patients.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute z-[80] w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto", children: patients.map((p) => /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "w-full text-left px-4 py-2 hover:bg-secondary/50 transition-colors",
            onMouseDown: (e) => {
              e.preventDefault();
              onSelect(p);
              setShowDropdown(false);
              setSearch("");
            },
            children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: p.full_name }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground ml-2", children: [
                "(",
                format(new Date(p.birth_date), "dd.MM.yyyy"),
                ")"
              ] })
            ]
          },
          p.id
        )) }),
        showDropdown && patients.length === 0 && search.length >= 2 && /* @__PURE__ */ jsx("div", { className: "absolute z-[80] w-full mt-1 bg-background border rounded-md shadow-lg p-4 text-center text-muted-foreground", children: "Пациент не найден" })
      ] }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => setIsCreating(true), children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
        " Новый"
      ] })
    ] })
  ] });
}
export {
  PatientSelect as P
};
