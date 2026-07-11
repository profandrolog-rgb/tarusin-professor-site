import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from "react";
import { I as Input, B as Button } from "../main.mjs";
import { MessageCircle, Bot, X, User, Loader2, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import "vite-react-ssg";
import "react-router-dom";
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
import "zod";
import "react-helmet-async";
const CHAT_URL = `${"https://bpbwkizvvythqotcyfii.supabase.co"}/functions/v1/patient-chat`;
const PatientChatbot = () => {
  var _a;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const { t } = useTranslation();
  const quickQuestions = [t("chatbot.quickQ1"), t("chatbot.quickQ2"), t("chatbot.quickQ3")];
  useEffect(() => {
    var _a2;
    (_a2 = scrollRef.current) == null ? void 0 : _a2.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);
  const sendMessage = useCallback(async (text) => {
    var _a2, _b, _c;
    if (!text.trim() || isLoading) return;
    const userMsg = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);
    let assistantSoFar = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYndraXp2dnl0aHFvdGN5ZmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1Njc2MTQsImV4cCI6MjA4NTE0MzYxNH0.iv_pLSj27wOMUmfY0HOJ91bPm1u-b4wjiScYrP03bww"}`
        },
        body: JSON.stringify({ messages: allMessages })
      });
      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Error" }));
        setMessages((prev) => [...prev, { role: "assistant", content: err.error || t("chatbot.serverError") }]);
        setIsLoading(false);
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      const upsert = (chunk) => {
        assistantSoFar += chunk;
        const snapshot = assistantSoFar;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if ((last == null ? void 0 : last.role) === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: snapshot } : m);
          }
          return [...prev, { role: "assistant", content: snapshot }];
        });
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = (_c = (_b = (_a2 = parsed.choices) == null ? void 0 : _a2[0]) == null ? void 0 : _b.delta) == null ? void 0 : _c.content;
            if (content) upsert(content);
          } catch {
          }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: t("chatbot.serverError") }]);
    }
    setIsLoading(false);
  }, [messages, isLoading, t]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    !isOpen && /* @__PURE__ */ jsx("button", { onClick: () => setIsOpen(true), className: "fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform animate-in fade-in slide-in-from-bottom-4", "aria-label": "Open chat", children: /* @__PURE__ */ jsx(MessageCircle, { className: "w-6 h-6" }) }),
    isOpen && /* @__PURE__ */ jsxs("div", { className: "fixed bottom-20 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-4 py-3 border-b border-border bg-primary/5 rounded-t-2xl", children: [
        /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Bot, { className: "w-5 h-5 text-primary" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-foreground", children: t("chatbot.title") }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("chatbot.subtitle") })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setIsOpen(false), className: "p-1 rounded-md hover:bg-muted transition-colors", children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5 text-muted-foreground" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { ref: scrollRef, className: "flex-1 overflow-y-auto px-4 py-3 space-y-3", children: [
        messages.length === 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5", children: /* @__PURE__ */ jsx(Bot, { className: "w-4 h-4 text-primary" }) }),
            /* @__PURE__ */ jsx("div", { className: "bg-muted rounded-xl rounded-tl-sm px-3 py-2 text-sm text-foreground max-w-[85%]", children: t("chatbot.welcome") })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 ml-9", children: quickQuestions.map((q) => /* @__PURE__ */ jsx("button", { onClick: () => sendMessage(q), className: "text-xs bg-primary/10 text-primary rounded-full px-3 py-1.5 hover:bg-primary/20 transition-colors text-left", children: q }, q)) })
        ] }),
        messages.map((msg, i) => /* @__PURE__ */ jsxs("div", { className: `flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`, children: [
          /* @__PURE__ */ jsx("div", { className: `w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.role === "user" ? "bg-accent/10" : "bg-primary/10"}`, children: msg.role === "user" ? /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-accent" }) : /* @__PURE__ */ jsx(Bot, { className: "w-4 h-4 text-primary" }) }),
          /* @__PURE__ */ jsx("div", { className: `rounded-xl px-3 py-2 text-sm max-w-[85%] ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`, children: msg.role === "assistant" ? /* @__PURE__ */ jsx("div", { className: "prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0", children: /* @__PURE__ */ jsx(ReactMarkdown, { children: msg.content }) }) : msg.content })
        ] }, i)),
        isLoading && ((_a = messages[messages.length - 1]) == null ? void 0 : _a.role) === "user" && /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Bot, { className: "w-4 h-4 text-primary" }) }),
          /* @__PURE__ */ jsx("div", { className: "bg-muted rounded-xl rounded-tl-sm px-3 py-2", children: /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin text-muted-foreground" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 border-t border-border", children: [
        /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
          e.preventDefault();
          sendMessage(input);
        }, className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Input, { ref: inputRef, value: input, onChange: (e) => setInput(e.target.value), placeholder: t("chatbot.placeholder"), className: "flex-1 text-sm", disabled: isLoading }),
          /* @__PURE__ */ jsx(Button, { type: "submit", size: "icon", disabled: !input.trim() || isLoading, className: "flex-shrink-0", children: /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground mt-1.5 text-center", children: t("chatbot.disclaimer") })
      ] })
    ] })
  ] });
};
export {
  PatientChatbot as default
};
