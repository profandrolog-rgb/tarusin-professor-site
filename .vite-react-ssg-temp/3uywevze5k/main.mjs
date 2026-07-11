var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import * as React from "react";
import React__default, { useState, useEffect, useMemo, lazy, Suspense, createContext, useContext, useRef, Component, useSyncExternalStore, useCallback } from "react";
import { ClientOnly, ViteReactSSG } from "vite-react-ssg";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useLocation, Link, useNavigate, useRouteError, isRouteErrorResponse, Outlet, useNavigation } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { X, PanelLeft, ChevronLeft, Home, User, Stethoscope, Microscope, Users, Heart, GraduationCap, Tv, Video, Clapperboard, BookOpen, ClipboardList, Camera, ClipboardCheck, Star, Phone, Sparkles, ChevronRight, List, FileText, ArrowUp, Headphones, Film, ArrowLeft, ArrowRight, Menu, AlertTriangle, RefreshCw, Activity, ChevronDown, ChevronUp, CheckCircle2, Loader2, Check, Circle, Globe, Sun, Moon, Settings, LogOut, LogIn, UserPlus, Syringe, Award, Shield, Baby, Brain, MonitorCheck, Bone, Building, Trophy, Lightbulb, Quote, Calendar, MapPin, Clock, CheckCircle, Send, Navigation, Train, Bus, MessageCircle, MessageCircleQuestion, RotateCcw, Info, ShieldCheck, Scissors, HeartPulse, CalendarCheck, Search, TrendingUp } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTheme } from "next-themes";
import { Toaster as Toaster$2 } from "sonner";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Slot } from "@radix-ui/react-slot";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { createClient } from "@supabase/supabase-js";
import i18n from "i18next";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { useTranslation, initReactI18next } from "react-i18next";
import * as LabelPrimitive from "@radix-ui/react-label";
import useEmblaCarousel from "embla-carousel-react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { z } from "zod";
import { Helmet } from "react-helmet-async";
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1e6;
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}
const toastTimeouts = /* @__PURE__ */ new Map();
const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId
    });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t)
      };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast2) => {
          addToRemoveQueue(toast2.id);
        });
      }
      return {
        ...state,
        toasts: state.toasts.map(
          (t) => t.id === toastId || toastId === void 0 ? {
            ...t,
            open: false
          } : t
        )
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === void 0) {
        return {
          ...state,
          toasts: []
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId)
      };
  }
};
const listeners$1 = [];
let memoryState = { toasts: [] };
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners$1.forEach((listener) => {
    listener(memoryState);
  });
}
function toast({ ...props }) {
  const id = genId();
  const update = (props2) => dispatch({
    type: "UPDATE_TOAST",
    toast: { ...props2, id }
  });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      }
    }
  });
  return {
    id,
    dismiss,
    update
  };
}
function useToast() {
  const [state, setState] = React.useState(memoryState);
  React.useEffect(() => {
    listeners$1.push(setState);
    return () => {
      const index = listeners$1.indexOf(setState);
      if (index > -1) {
        listeners$1.splice(index, 1);
      }
    };
  }, [state]);
  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId })
  };
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Viewport,
  {
    ref,
    className: cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    ),
    ...props
  }
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
  return /* @__PURE__ */ jsx(ToastPrimitives.Root, { ref, className: cn(toastVariants({ variant }), className), ...props });
});
Toast.displayName = ToastPrimitives.Root.displayName;
const ToastAction = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Action,
  {
    ref,
    className: cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors group-[.destructive]:border-muted/40 hover:bg-secondary group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group-[.destructive]:focus:ring-destructive disabled:pointer-events-none disabled:opacity-50",
      className
    ),
    ...props
  }
));
ToastAction.displayName = ToastPrimitives.Action.displayName;
const ToastClose = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Close,
  {
    ref,
    className: cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-red-300 hover:text-foreground group-[.destructive]:hover:text-red-50 focus:opacity-100 focus:outline-none focus:ring-2 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    ),
    "toast-close": "",
    ...props,
    children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
  }
));
ToastClose.displayName = ToastPrimitives.Close.displayName;
const ToastTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(ToastPrimitives.Title, { ref, className: cn("text-sm font-semibold", className), ...props }));
ToastTitle.displayName = ToastPrimitives.Title.displayName;
const ToastDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(ToastPrimitives.Description, { ref, className: cn("text-sm opacity-90", className), ...props }));
ToastDescription.displayName = ToastPrimitives.Description.displayName;
function Toaster$1() {
  const { toasts } = useToast();
  return /* @__PURE__ */ jsxs(ToastProvider, { children: [
    toasts.map(function({ id, title, description, action, ...props }) {
      return /* @__PURE__ */ jsxs(Toast, { ...props, children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-1", children: [
          title && /* @__PURE__ */ jsx(ToastTitle, { children: title }),
          description && /* @__PURE__ */ jsx(ToastDescription, { children: description })
        ] }),
        action,
        /* @__PURE__ */ jsx(ToastClose, {})
      ] }, id);
    }),
    /* @__PURE__ */ jsx(ToastViewport, {})
  ] });
}
const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();
  return /* @__PURE__ */ jsx(
    Toaster$2,
    {
      theme,
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(
  TooltipPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
const MOBILE_BREAKPOINT = 768;
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(void 0);
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return !!isMobile;
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
const Separator = React.forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsx(
  SeparatorPrimitive.Root,
  {
    ref,
    decorative,
    orientation,
    className: cn("shrink-0 bg-border", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className),
    ...props
  }
));
Separator.displayName = SeparatorPrimitive.Root.displayName;
const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetPortal = SheetPrimitive.Portal;
const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-full border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);
const SheetContent = React.forwardRef(
  ({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ jsxs(SheetPortal, { children: [
    /* @__PURE__ */ jsx(SheetOverlay, {}),
    /* @__PURE__ */ jsxs(SheetPrimitive.Content, { ref, className: cn(sheetVariants({ side }), className), ...props, children: [
      children,
      /* @__PURE__ */ jsxs(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-secondary hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none", children: [
        /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
      ] })
    ] })
  ] })
);
SheetContent.displayName = SheetPrimitive.Content.displayName;
const SheetHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("flex flex-col space-y-2 text-center sm:text-left", className), ...props });
SheetHeader.displayName = "SheetHeader";
const SheetFooter = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className), ...props });
SheetFooter.displayName = "SheetFooter";
const SheetTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SheetPrimitive.Title, { ref, className: cn("text-lg font-semibold text-foreground", className), ...props }));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
const SheetDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SheetPrimitive.Description, { ref, className: cn("text-sm text-muted-foreground", className), ...props }));
SheetDescription.displayName = SheetPrimitive.Description.displayName;
function Skeleton({ className, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: cn("animate-pulse rounded-md bg-muted", className), ...props });
}
const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const SidebarContext = React.createContext(null);
function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}
const SidebarProvider = React.forwardRef(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open]
  );
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open2) => !open2) : setOpen((open2) => !open2);
  }, [isMobile, setOpen, setOpenMobile]);
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);
  const state = open ? "expanded" : "collapsed";
  const contextValue = React.useMemo(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  );
  return /* @__PURE__ */ jsx(SidebarContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsx(TooltipProvider, { delayDuration: 0, children: /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        "--sidebar-width": SIDEBAR_WIDTH,
        "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
        ...style
      },
      className: cn("group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar", className),
      ref,
      ...props,
      children
    }
  ) }) });
});
SidebarProvider.displayName = "SidebarProvider";
const Sidebar = React.forwardRef(({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  if (collapsible === "none") {
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: cn("flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground", className),
        ref,
        ...props,
        children
      }
    );
  }
  if (isMobile) {
    return /* @__PURE__ */ jsx(Sheet, { open: openMobile, onOpenChange: setOpenMobile, ...props, children: /* @__PURE__ */ jsx(
      SheetContent,
      {
        "data-sidebar": "sidebar",
        "data-mobile": "true",
        className: "w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
        style: {
          "--sidebar-width": SIDEBAR_WIDTH_MOBILE
        },
        side,
        children: /* @__PURE__ */ jsx("div", { className: "flex h-full w-full flex-col", children })
      }
    ) });
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref,
      className: "group peer hidden text-sidebar-foreground md:block",
      "data-state": state,
      "data-collapsible": state === "collapsed" ? collapsible : "",
      "data-variant": variant,
      "data-side": side,
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "relative h-svh w-[--sidebar-width] bg-transparent transition-[width] duration-200 ease-linear",
              "group-data-[collapsible=offcanvas]:w-0",
              "group-data-[side=right]:rotate-180",
              variant === "floating" || variant === "inset" ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]" : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
            )
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] duration-200 ease-linear md:flex",
              side === "left" ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]" : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
              // Adjust the padding for floating and inset variants.
              variant === "floating" || variant === "inset" ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]" : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
              className
            ),
            ...props,
            children: /* @__PURE__ */ jsx(
              "div",
              {
                "data-sidebar": "sidebar",
                className: "flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow",
                children
              }
            )
          }
        )
      ]
    }
  );
});
Sidebar.displayName = "Sidebar";
const SidebarTrigger = React.forwardRef(
  ({ className, onClick, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();
    return /* @__PURE__ */ jsxs(
      Button,
      {
        ref,
        "data-sidebar": "trigger",
        variant: "ghost",
        size: "icon",
        className: cn("h-7 w-7", className),
        onClick: (event) => {
          onClick == null ? void 0 : onClick(event);
          toggleSidebar();
        },
        ...props,
        children: [
          /* @__PURE__ */ jsx(PanelLeft, {}),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Toggle Sidebar" })
        ]
      }
    );
  }
);
SidebarTrigger.displayName = "SidebarTrigger";
const SidebarRail = React.forwardRef(
  ({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();
    return /* @__PURE__ */ jsx(
      "button",
      {
        ref,
        "data-sidebar": "rail",
        "aria-label": "Toggle Sidebar",
        tabIndex: -1,
        onClick: toggleSidebar,
        title: "Toggle Sidebar",
        className: cn(
          "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] group-data-[side=left]:-right-4 group-data-[side=right]:left-0 hover:after:bg-sidebar-border sm:flex",
          "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
          "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
          "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
          "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
          "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
          className
        ),
        ...props
      }
    );
  }
);
SidebarRail.displayName = "SidebarRail";
const SidebarInset = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    "main",
    {
      ref,
      className: cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className
      ),
      ...props
    }
  );
});
SidebarInset.displayName = "SidebarInset";
const SidebarInput = React.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      Input,
      {
        ref,
        "data-sidebar": "input",
        className: cn(
          "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          className
        ),
        ...props
      }
    );
  }
);
SidebarInput.displayName = "SidebarInput";
const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx("div", { ref, "data-sidebar": "header", className: cn("flex flex-col gap-2 p-2", className), ...props });
});
SidebarHeader.displayName = "SidebarHeader";
const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx("div", { ref, "data-sidebar": "footer", className: cn("flex flex-col gap-2 p-2", className), ...props });
});
SidebarFooter.displayName = "SidebarFooter";
const SidebarSeparator = React.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      Separator,
      {
        ref,
        "data-sidebar": "separator",
        className: cn("mx-2 w-auto bg-sidebar-border", className),
        ...props
      }
    );
  }
);
SidebarSeparator.displayName = "SidebarSeparator";
const SidebarContent = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      "data-sidebar": "content",
      className: cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      ),
      ...props
    }
  );
});
SidebarContent.displayName = "SidebarContent";
const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      "data-sidebar": "group",
      className: cn("relative flex w-full min-w-0 flex-col p-2", className),
      ...props
    }
  );
});
SidebarGroup.displayName = "SidebarGroup";
const SidebarGroupLabel = React.forwardRef(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return /* @__PURE__ */ jsx(
      Comp,
      {
        ref,
        "data-sidebar": "group-label",
        className: cn(
          "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
          "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
          className
        ),
        ...props
      }
    );
  }
);
SidebarGroupLabel.displayName = "SidebarGroupLabel";
const SidebarGroupAction = React.forwardRef(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(
      Comp,
      {
        ref,
        "data-sidebar": "group-action",
        className: cn(
          "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
          // Increases the hit area of the button on mobile.
          "after:absolute after:-inset-2 after:md:hidden",
          "group-data-[collapsible=icon]:hidden",
          className
        ),
        ...props
      }
    );
  }
);
SidebarGroupAction.displayName = "SidebarGroupAction";
const SidebarGroupContent = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, "data-sidebar": "group-content", className: cn("w-full text-sm", className), ...props })
);
SidebarGroupContent.displayName = "SidebarGroupContent";
const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("ul", { ref, "data-sidebar": "menu", className: cn("flex w-full min-w-0 flex-col gap-1", className), ...props }));
SidebarMenu.displayName = "SidebarMenu";
const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("li", { ref, "data-sidebar": "menu-item", className: cn("group/menu-item relative", className), ...props }));
SidebarMenuItem.displayName = "SidebarMenuItem";
const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline: "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]"
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const SidebarMenuButton = React.forwardRef(({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar();
  const button = /* @__PURE__ */ jsx(
    Comp,
    {
      ref,
      "data-sidebar": "menu-button",
      "data-size": size,
      "data-active": isActive,
      className: cn(sidebarMenuButtonVariants({ variant, size }), className),
      ...props
    }
  );
  if (!tooltip) {
    return button;
  }
  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip
    };
  }
  return /* @__PURE__ */ jsxs(Tooltip, { children: [
    /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: button }),
    /* @__PURE__ */ jsx(TooltipContent, { side: "right", align: "center", hidden: state !== "collapsed" || isMobile, ...tooltip })
  ] });
});
SidebarMenuButton.displayName = "SidebarMenuButton";
const SidebarMenuAction = React.forwardRef(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      ref,
      "data-sidebar": "menu-action",
      className: cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform peer-hover/menu-button:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover && "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      ),
      ...props
    }
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";
const SidebarMenuBadge = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      "data-sidebar": "menu-badge",
      className: cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className
      ),
      ...props
    }
  )
);
SidebarMenuBadge.displayName = "SidebarMenuBadge";
const SidebarMenuSkeleton = React.forwardRef(({ className, showIcon = false, ...props }, ref) => {
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref,
      "data-sidebar": "menu-skeleton",
      className: cn("flex h-8 items-center gap-2 rounded-md px-2", className),
      ...props,
      children: [
        showIcon && /* @__PURE__ */ jsx(Skeleton, { className: "size-4 rounded-md", "data-sidebar": "menu-skeleton-icon" }),
        /* @__PURE__ */ jsx(
          Skeleton,
          {
            className: "h-4 max-w-[--skeleton-width] flex-1",
            "data-sidebar": "menu-skeleton-text",
            style: {
              "--skeleton-width": width
            }
          }
        )
      ]
    }
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";
const SidebarMenuSub = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "ul",
    {
      ref,
      "data-sidebar": "menu-sub",
      className: cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className
      ),
      ...props
    }
  )
);
SidebarMenuSub.displayName = "SidebarMenuSub";
const SidebarMenuSubItem = React.forwardRef(({ ...props }, ref) => /* @__PURE__ */ jsx("li", { ref, ...props }));
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";
const SidebarMenuSubButton = React.forwardRef(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      ref,
      "data-sidebar": "menu-sub-button",
      "data-size": size,
      "data-active": isActive,
      className: cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring aria-disabled:pointer-events-none aria-disabled:opacity-50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      ),
      ...props
    }
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";
const mainNavItems = [
  { title: "Главная", url: "/", icon: Home },
  { title: "Обо мне", url: "/#about", icon: User },
  { title: "Консультации", url: "/#consultations", icon: Stethoscope },
  { title: "Методики", url: "/methodologies", icon: Microscope }
];
const pageNavItems = [
  { title: "Команда профессора", url: "/team", icon: Users },
  { title: "Для родителей и пациентов", url: "/for-parents", icon: Heart },
  { title: "Для врачей", url: "/for-doctors", icon: GraduationCap },
  { title: "СМИ и ТВ", url: "/media", icon: Tv },
  { title: "Видео", url: "/videos", icon: Video },
  { title: "Видео-кейсы", url: "/video-cases", icon: Clapperboard },
  { title: "Публикации", url: "/publications", icon: BookOpen },
  { title: "Клинические случаи", url: "/clinical-cases", icon: ClipboardList },
  { title: "Наши исследования", url: "/research", icon: Microscope },
  { title: "Путёвые заметки", url: "/travel-notes", icon: Camera },
  { title: "Мастер-классы", url: "/masterclasses", icon: GraduationCap },
  { title: "Размышлизмы", url: "/blog", icon: BookOpen },
  { title: "Самодиагностика", url: "/self-check", icon: ClipboardCheck },
  { title: "Отзывы", url: "/reviews", icon: Star },
  { title: "Контакты", url: "/contacts", icon: Phone }
];
function AppSidebar() {
  const location = useLocation();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isActive = (url) => {
    if (url === "/") {
      return location.pathname === "/";
    }
    if (url.startsWith("/#")) {
      return location.pathname === "/" && location.hash === url.replace("/", "");
    }
    return location.pathname === url;
  };
  const handleNavClick = (url) => {
    if (url.startsWith("/#")) {
      const hash = url.replace("/", "");
      if (location.pathname === "/") {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };
  return /* @__PURE__ */ jsxs(Sidebar, { collapsible: "offcanvas", className: "border-r border-border z-50", children: [
    /* @__PURE__ */ jsx(SidebarHeader, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0", children: "ТД" }),
      !isCollapsed && /* @__PURE__ */ jsxs("div", { className: "overflow-hidden", children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground text-sm truncate", children: "Профессор Тарусин" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground truncate", children: "Андролог, хирург" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(SidebarContent, { children: [
      /* @__PURE__ */ jsxs(SidebarGroup, { children: [
        /* @__PURE__ */ jsx(SidebarGroupLabel, { children: "Навигация" }),
        /* @__PURE__ */ jsx(SidebarGroupContent, { children: /* @__PURE__ */ jsx(SidebarMenu, { children: mainNavItems.map((item) => /* @__PURE__ */ jsx(SidebarMenuItem, { children: /* @__PURE__ */ jsx(
          SidebarMenuButton,
          {
            asChild: true,
            isActive: isActive(item.url),
            tooltip: item.title,
            children: /* @__PURE__ */ jsxs(
              Link,
              {
                to: item.url,
                onClick: () => handleNavClick(item.url),
                children: [
                  /* @__PURE__ */ jsx(item.icon, { className: "w-4 h-4" }),
                  /* @__PURE__ */ jsx("span", { children: item.title })
                ]
              }
            )
          }
        ) }, item.title)) }) })
      ] }),
      /* @__PURE__ */ jsxs(SidebarGroup, { children: [
        /* @__PURE__ */ jsx(SidebarGroupLabel, { children: "Разделы" }),
        /* @__PURE__ */ jsx(SidebarGroupContent, { children: /* @__PURE__ */ jsx(SidebarMenu, { children: pageNavItems.map((item) => /* @__PURE__ */ jsx(SidebarMenuItem, { children: /* @__PURE__ */ jsx(
          SidebarMenuButton,
          {
            asChild: true,
            isActive: isActive(item.url),
            tooltip: item.title,
            children: /* @__PURE__ */ jsxs(Link, { to: item.url, children: [
              /* @__PURE__ */ jsx(item.icon, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { children: item.title })
            ] })
          }
        ) }, item.title)) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SidebarFooter, { className: "p-2", children: /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "ghost",
        size: "sm",
        className: "w-full justify-start gap-2",
        onClick: toggleSidebar,
        children: [
          /* @__PURE__ */ jsx(ChevronLeft, { className: `w-4 h-4 transition-transform ${isCollapsed ? "rotate-180" : ""}` }),
          !isCollapsed && /* @__PURE__ */ jsx("span", { children: "Свернуть" })
        ]
      }
    ) })
  ] });
}
const KEY = "smartSearchTrail.v1";
const TTL_MS = 1e3 * 60 * 60 * 6;
function saveTrail(trail) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...trail, savedAt: Date.now() }));
    window.dispatchEvent(new Event("smart-trail:changed"));
  } catch {
  }
}
function loadTrail() {
  var _a;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const trail = JSON.parse(raw);
    if (!((_a = trail == null ? void 0 : trail.results) == null ? void 0 : _a.length)) return null;
    if (Date.now() - (trail.savedAt ?? 0) > TTL_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return trail;
  } catch {
    return null;
  }
}
function clearTrail() {
  try {
    sessionStorage.removeItem(KEY);
    window.dispatchEvent(new Event("smart-trail:changed"));
  } catch {
  }
}
const KIND_ICON$1 = {
  disease: Stethoscope,
  blog: FileText,
  video: Video,
  clinical: BookOpen,
  research: Microscope,
  podcast: Headphones,
  video_file: Film
};
const KIND_LABEL$1 = {
  disease: "Заболевание",
  blog: "Статья",
  video: "Видео",
  clinical: "Клинический случай",
  research: "Исследование",
  podcast: "Подкаст",
  video_file: "Видео"
};
function matchIndex$1(items, pathname) {
  const norm = (u) => u.split("#")[0].split("?")[0].replace(/\/+$/, "");
  const here = norm(pathname);
  return items.findIndex((it) => {
    const u = norm(it.url);
    return u === here || here.startsWith(u + "/");
  });
}
const SmartSearchTrail = () => {
  const [trail, setTrail] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const refresh = () => setTrail(loadTrail());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("smart-trail:changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("smart-trail:changed", refresh);
    };
  }, []);
  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);
  const currentIdx = useMemo(
    () => trail ? matchIndex$1(trail.results, location.pathname) : -1,
    [trail, location.pathname]
  );
  if (!trail || trail.results.length === 0) return null;
  if (location.pathname === "/" || location.pathname === "") return null;
  const prev = currentIdx > 0 ? trail.results[currentIdx - 1] : null;
  const next = currentIdx >= 0 && currentIdx < trail.results.length - 1 ? trail.results[currentIdx + 1] : null;
  const goHomeWithResults = () => {
    navigate("/?smart=restore#smart-search");
  };
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("div", { className: "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[min(96vw,720px)] w-full px-3 print:hidden", children: /* @__PURE__ */ jsxs("div", { className: "relative rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-2", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: goHomeWithResults,
          className: "flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline shrink-0",
          title: "К результатам поиска",
          children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "w-3.5 h-3.5" }),
            /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Подборка по запросу" }),
            /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "Подборка" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground truncate flex-1 min-w-0", title: trail.query, children: [
        "«",
        trail.query,
        "»"
      ] }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground shrink-0 hidden sm:inline", children: currentIdx >= 0 ? `${currentIdx + 1} из ${trail.results.length}` : `${trail.results.length} материалов` }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 ml-1", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "h-8 w-8",
            disabled: !prev,
            onClick: () => prev && navigate(prev.url),
            title: prev ? `Предыдущий: ${prev.title}` : "Это первый материал",
            children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "h-8 w-8",
            disabled: !next,
            onClick: () => next && navigate(next.url),
            title: next ? `Следующий: ${next.title}` : "Это последний материал",
            children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: cn("h-8 w-8", expanded && "bg-accent"),
            onClick: () => setExpanded((v) => !v),
            title: "Показать все",
            children: /* @__PURE__ */ jsx(List, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "h-8 w-8 text-muted-foreground hover:text-foreground",
            onClick: clearTrail,
            title: "Закрыть подборку",
            children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
          }
        )
      ] })
    ] }),
    expanded && /* @__PURE__ */ jsxs("div", { className: "border-t border-border max-h-[55vh] overflow-y-auto overscroll-contain p-2 space-y-1", children: [
      trail.results.map((r, i) => {
        const Icon = KIND_ICON$1[r.kind] ?? FileText;
        const active = i === currentIdx;
        return /* @__PURE__ */ jsxs(
          Link,
          {
            to: r.url,
            onClick: () => setExpanded(false),
            className: cn(
              "flex items-start gap-3 px-2 py-2 rounded-lg text-sm transition-colors",
              active ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-accent/60"
            ),
            children: [
              /* @__PURE__ */ jsx("div", { className: "shrink-0 w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center", children: /* @__PURE__ */ jsx(Icon, { className: "w-3.5 h-3.5" }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: [
                  KIND_LABEL$1[r.kind],
                  r.category ? ` · ${r.category}` : ""
                ] }),
                /* @__PURE__ */ jsx("div", { className: cn("leading-snug truncate", active && "font-semibold text-primary"), children: r.title })
              ] }),
              active && /* @__PURE__ */ jsx("span", { className: "text-[10px] text-primary shrink-0 self-center", children: "вы здесь" })
            ]
          },
          `${r.kind}-${r.id}`
        );
      }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: goHomeWithResults,
          className: "w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary py-2 mt-1 border-t border-border",
          children: [
            /* @__PURE__ */ jsx(ArrowUp, { className: "w-3 h-3" }),
            " вернуться к умному поиску"
          ]
        }
      )
    ] })
  ] }) }) });
};
const KIND_ICON = {
  disease: Stethoscope,
  blog: FileText,
  video: Video,
  clinical: BookOpen,
  research: Microscope,
  podcast: Headphones,
  video_file: Film
};
const KIND_LABEL = {
  disease: "Заболевание",
  blog: "Статья",
  video: "Видео",
  clinical: "Клинический случай",
  research: "Исследование",
  podcast: "Подкаст",
  video_file: "Видео"
};
function matchIndex(items, pathname) {
  const norm = (u) => u.split("#")[0].split("?")[0].replace(/\/+$/, "");
  const here = norm(pathname);
  return items.findIndex((it) => {
    const u = norm(it.url);
    return u === here || here.startsWith(u + "/");
  });
}
const SmartSearchEndCTA = () => {
  const [trail, setTrail] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const refresh = () => setTrail(loadTrail());
    refresh();
    window.addEventListener("smart-trail:changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("smart-trail:changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [location.pathname]);
  const currentIdx = useMemo(
    () => trail ? matchIndex(trail.results, location.pathname) : -1,
    [trail, location.pathname]
  );
  if (!trail || trail.results.length === 0) return null;
  if (location.pathname === "/" || location.pathname === "") return null;
  if (currentIdx < 0) return null;
  const others = trail.results.filter((_, i) => i !== currentIdx).slice(0, 3);
  const next = currentIdx < trail.results.length - 1 ? trail.results[currentIdx + 1] : null;
  return /* @__PURE__ */ jsx("section", { className: "container mx-auto px-4 my-10 print:hidden", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 md:p-8 shadow-sm", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 text-primary" }),
      /* @__PURE__ */ jsx("h3", { className: "text-base md:text-lg font-semibold", children: "Хотите узнать больше по теме?" })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mb-4", children: [
      "Вы пришли сюда по запросу ",
      /* @__PURE__ */ jsxs("span", { className: "text-foreground", children: [
        "«",
        trail.query,
        "»"
      ] }),
      ". Вернитесь к подборке или почитайте ещё материалы по этой теме."
    ] }),
    others.length > 0 && /* @__PURE__ */ jsx("ul", { className: "grid gap-2 mb-5 sm:grid-cols-2", children: others.map((r) => {
      const Icon = KIND_ICON[r.kind] ?? FileText;
      return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
        Link,
        {
          to: r.url,
          className: "group flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/40 transition-all h-full",
          children: [
            /* @__PURE__ */ jsx("div", { className: "shrink-0 w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center", children: /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: [
                KIND_LABEL[r.kind],
                r.category ? ` · ${r.category}` : ""
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-sm leading-snug group-hover:text-primary line-clamp-2", children: r.title })
            ] })
          ]
        }
      ) }, `${r.kind}-${r.id}`);
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          className: "sm:w-auto",
          onClick: () => navigate("/?smart=restore#smart-search"),
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-1.5" }),
            "К умному поиску"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Button,
        {
          className: "sm:w-auto",
          onClick: () => navigate((next ?? trail.results[0]).url),
          title: next ? `Дальше: ${next.title}` : `К началу подборки: ${trail.results[0].title}`,
          children: [
            "Почитать ещё по теме",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-1.5" })
          ]
        }
      )
    ] })
  ] }) });
};
const PatientChatbot = lazy(() => import("./assets/PatientChatbot-DJkd6VxX.js"));
function MainLayout({ children }) {
  return /* @__PURE__ */ jsxs(SidebarProvider, { defaultOpen: false, children: [
    /* @__PURE__ */ jsx(AppSidebar, {}),
    /* @__PURE__ */ jsx(SidebarTrigger, { className: "fixed bottom-20 left-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 md:bottom-24 md:left-8", children: /* @__PURE__ */ jsx(Menu, { className: "h-5 w-5" }) }),
    /* @__PURE__ */ jsxs("main", { className: "w-full min-h-screen", children: [
      children,
      /* @__PURE__ */ jsx(ClientOnly, { children: () => /* @__PURE__ */ jsx(SmartSearchEndCTA, {}) })
    ] }),
    /* @__PURE__ */ jsx(ClientOnly, { children: () => /* @__PURE__ */ jsx(SmartSearchTrail, {}) }),
    /* @__PURE__ */ jsx(ClientOnly, { children: () => /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(PatientChatbot, {}) }) })
  ] });
}
const SUPABASE_URL$2 = "https://bpbwkizvvythqotcyfii.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYndraXp2dnl0aHFvdGN5ZmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1Njc2MTQsImV4cCI6MjA4NTE0MzYxNH0.iv_pLSj27wOMUmfY0HOJ91bPm1u-b4wjiScYrP03bww";
const supabase = createClient(SUPABASE_URL$2, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true
  }
});
const AuthContext = createContext(void 0);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [isSurgeon, setIsSurgeon] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [loading, setLoading] = useState(true);
  const rolesPromiseRef = useRef(null);
  const checkRole = async (userId, role) => {
    try {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: role
      });
      if (error) {
        console.error(`Error checking ${role} role:`, error);
        return false;
      }
      return data === true;
    } catch (err) {
      console.error(`Error checking ${role} role:`, err);
      return false;
    }
  };
  const loadRoles = (userId) => {
    var _a;
    if (((_a = rolesPromiseRef.current) == null ? void 0 : _a.userId) === userId) {
      return rolesPromiseRef.current.promise;
    }
    const promise = Promise.all([
      checkRole(userId, "admin"),
      checkRole(userId, "editor"),
      checkRole(userId, "surgeon"),
      checkRole(userId, "parent")
    ]);
    rolesPromiseRef.current = { userId, promise };
    return promise;
  };
  const applyRoles = ([admin, editor, surgeon, parent]) => {
    setIsAdmin(admin);
    setIsEditor(editor);
    setIsSurgeon(surgeon);
    setIsParent(parent);
  };
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session2) => {
        if (event === "INITIAL_SESSION") return;
        setSession(session2);
        setUser((session2 == null ? void 0 : session2.user) ?? null);
        if (session2 == null ? void 0 : session2.user) {
          loadRoles(session2.user.id).then(applyRoles).finally(() => setLoading(false));
        } else {
          setIsAdmin(false);
          setIsEditor(false);
          setIsSurgeon(false);
          setIsParent(false);
          rolesPromiseRef.current = null;
          setLoading(false);
        }
      }
    );
    supabase.auth.getSession().then(({ data: { session: session2 } }) => {
      setSession(session2);
      setUser((session2 == null ? void 0 : session2.user) ?? null);
      if (session2 == null ? void 0 : session2.user) {
        loadRoles(session2.user.id).then((roles) => {
          applyRoles(roles);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };
  const signUp = async (email, password) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };
  const signOut = async () => {
    await supabase.auth.signOut();
  };
  return /* @__PURE__ */ jsx(
    AuthContext.Provider,
    {
      value: {
        user,
        session,
        isAdmin,
        isEditor,
        isSurgeon,
        isParent,
        loading,
        signIn,
        signUp,
        signOut
      },
      children
    }
  );
}
function useAuth() {
  const context = useContext(AuthContext);
  if (context === void 0) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
function FriendlyErrorScreen({
  title,
  description,
  details,
  onRetry
}) {
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-8 h-8 text-destructive" }) }),
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground mb-3", children: title }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6", children: description }),
    details && /* @__PURE__ */ jsxs("details", { className: "text-left bg-muted rounded-lg p-3 mb-6 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsx("summary", { className: "cursor-pointer font-medium text-foreground", children: "Технические подробности" }),
      /* @__PURE__ */ jsx("pre", { className: "mt-2 whitespace-pre-wrap break-words", children: details })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 justify-center", children: [
      /* @__PURE__ */ jsxs(Button, { onClick: onRetry ?? (() => window.location.reload()), variant: "default", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4 mr-2" }),
        " Перезагрузить страницу"
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", children: [
        /* @__PURE__ */ jsx(Home, { className: "w-4 h-4 mr-2" }),
        " На главную"
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-6", children: "Если ошибка повторяется — напишите нам, мы быстро починим." })
  ] }) });
}
function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  let title = "Что-то пошло не так";
  let description = "Не удалось открыть страницу. Это временный сбой — данные не потеряны.";
  let details;
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Страница не найдена";
      description = "Возможно, материал был удалён или перемещён.";
    } else {
      title = `Ошибка ${error.status}`;
      description = error.statusText || description;
    }
    details = typeof error.data === "string" ? error.data : void 0;
  } else if (error instanceof Error) {
    if (/JSON|Unexpected token/i.test(error.message)) {
      title = "Не удалось загрузить данные страницы";
      description = "Сервер вернул неожиданный ответ. Перезагрузите страницу — обычно помогает.";
    }
    details = error.message;
    console.error("[RouteErrorBoundary]", error);
  }
  return /* @__PURE__ */ jsx(
    FriendlyErrorScreen,
    {
      title,
      description,
      details,
      onRetry: () => navigate(0)
    }
  );
}
class AppErrorBoundary extends Component {
  constructor() {
    super(...arguments);
    __publicField(this, "state", { error: null });
    __publicField(this, "reset", () => this.setState({ error: null }));
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("[AppErrorBoundary]", error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return /* @__PURE__ */ jsx(
        FriendlyErrorScreen,
        {
          title: this.props.fallbackTitle ?? "Что-то пошло не так",
          description: this.props.fallbackDescription ?? "Произошёл сбой при отображении страницы. Попробуйте перезагрузить.",
          details: this.state.error.message,
          onRetry: () => {
            this.reset();
            if (typeof window !== "undefined") window.location.reload();
          }
        }
      );
    }
    return this.props.children;
  }
}
const tasks = /* @__PURE__ */ new Map();
const listeners = /* @__PURE__ */ new Set();
let snapshot = [];
const rebuild = () => {
  snapshot = Array.from(tasks.values()).sort((a, b) => b.startedAt - a.startedAt);
  listeners.forEach((l) => {
    try {
      l();
    } catch {
    }
  });
};
const subscribe = (l) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
function useAiActivity() {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
}
let idCounter = 0;
const nextId = () => `ai_${Date.now().toString(36)}_${(++idCounter).toString(36)}`;
const ENDPOINT_LABELS = [
  [/ai-chat/i, "AI-чат"],
  [/generate-image/i, "Генерация изображения"],
  [/edit-image/i, "Редактирование изображения"],
  [/transcribe/i, "Расшифровка речи"],
  [/pubmed-fulltext/i, "PubMed: полный текст"],
  [/pubmed/i, "PubMed поиск"],
  [/illustrate/i, "Иллюстрация"],
  [/translate/i, "Перевод"],
  [/analyze|analysis/i, "AI-анализ"],
  [/embed/i, "Векторизация"],
  [/parse-pdf|pdf-parse|ocr/i, "Разбор PDF/OCR"],
  [/dictate|dictation/i, "Диктовка"],
  [/repertory/i, "Репертори AI"],
  [/metabolic/i, "Метаболич. карта"],
  [/smoke/i, "Smoke-проверка"]
];
function labelForEndpoint(endpoint) {
  for (const [rx, name] of ENDPOINT_LABELS) if (rx.test(endpoint)) return name;
  const m = endpoint.match(/functions\/v1\/([^/?#]+)/);
  if (m) return `AI · ${m[1]}`;
  return "AI-операция";
}
function startAiTask(input) {
  const id = input.id || nextId();
  const label = input.label || (input.endpoint ? labelForEndpoint(input.endpoint) : "AI-операция");
  const task = {
    id,
    label,
    endpoint: input.endpoint,
    startedAt: Date.now(),
    phase: "start",
    detail: "Отправляю запрос…"
  };
  tasks.set(id, task);
  rebuild();
  return {
    id,
    progress: (detail, bytes) => {
      const t = tasks.get(id);
      if (!t || t.phase === "done" || t.phase === "error") return;
      t.phase = "progress";
      t.detail = detail;
      if (typeof bytes === "number") t.bytes = bytes;
      rebuild();
    },
    success: (detail) => {
      const t = tasks.get(id);
      if (!t) return;
      t.phase = "done";
      t.endedAt = Date.now();
      t.detail = detail || "Готово";
      rebuild();
      setTimeout(() => {
        const cur = tasks.get(id);
        if (cur && cur.phase === "done") {
          tasks.delete(id);
          rebuild();
        }
      }, 5e3);
    },
    fail: (error) => {
      const t = tasks.get(id);
      if (!t) return;
      t.phase = "error";
      t.endedAt = Date.now();
      t.error = error;
      t.detail = error;
      rebuild();
    }
  };
}
function dismissAiTask(id) {
  tasks.delete(id);
  rebuild();
}
function clearFinishedAiTasks() {
  for (const [id, t] of tasks) {
    if (t.phase === "done" || t.phase === "error") tasks.delete(id);
  }
  rebuild();
}
const AiActivityDock = () => {
  const tasks2 = useAiActivity();
  const [expanded, setExpanded] = useState(true);
  const [now, setNow] = useState(Date.now());
  const hasActive = tasks2.some((t) => t.phase === "start" || t.phase === "progress");
  const hasError = tasks2.some((t) => t.phase === "error");
  useEffect(() => {
    if (!hasActive) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [hasActive]);
  if (!tasks2.length) return null;
  const iconFor = (t) => {
    if (t.phase === "error") return /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-destructive shrink-0" });
    if (t.phase === "done") return /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-600 shrink-0" });
    return /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin text-primary shrink-0" });
  };
  const elapsed = (t) => {
    const end = t.endedAt ?? now;
    return Math.max(0, Math.round((end - t.startedAt) / 1e3));
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "fixed z-[70] pointer-events-auto",
        "bottom-4 right-4 w-[min(92vw,380px)]",
        "rounded-xl border shadow-lg backdrop-blur bg-background/95",
        hasError ? "border-destructive/50" : "border-border"
      ),
      role: "status",
      "aria-live": "polite",
      children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setExpanded((v) => !v),
            className: "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium",
            children: [
              /* @__PURE__ */ jsx(Activity, { className: cn("w-4 h-4", hasActive ? "text-primary animate-pulse" : hasError ? "text-destructive" : "text-emerald-600") }),
              /* @__PURE__ */ jsxs("span", { className: "flex-1 text-left truncate", children: [
                "AI-операции · ",
                tasks2.length,
                hasActive ? " · выполняется…" : hasError ? " · есть ошибки" : " · готово"
              ] }),
              expanded ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 opacity-60" }) : /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4 opacity-60" })
            ]
          }
        ),
        expanded && /* @__PURE__ */ jsxs("div", { className: "max-h-[50vh] overflow-y-auto border-t divide-y", children: [
          tasks2.map((t) => /* @__PURE__ */ jsxs("div", { className: "px-3 py-2 flex items-start gap-2 text-sm", children: [
            iconFor(t),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium truncate", children: t.label }),
                /* @__PURE__ */ jsxs("span", { className: "ml-auto text-xs tabular-nums opacity-70", children: [
                  elapsed(t),
                  "s"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: cn("text-xs mt-0.5 break-words", t.phase === "error" ? "text-destructive" : "opacity-75"), children: t.detail || (t.phase === "start" ? "Отправляю запрос…" : "") }),
              t.endpoint && /* @__PURE__ */ jsx("div", { className: "text-[10px] mt-0.5 opacity-40 truncate", title: t.endpoint, children: t.endpoint })
            ] }),
            (t.phase === "done" || t.phase === "error") && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => dismissAiTask(t.id),
                className: "opacity-60 hover:opacity-100 p-1 -m-1",
                "aria-label": "Скрыть",
                children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" })
              }
            )
          ] }, t.id)),
          tasks2.some((t) => t.phase === "done" || t.phase === "error") && /* @__PURE__ */ jsx("div", { className: "px-3 py-1.5 flex justify-end", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: clearFinishedAiTasks, className: "text-xs opacity-70 hover:opacity-100 underline", children: "Очистить завершённые" }) })
        ] })
      ]
    }
  );
};
let installed = false;
const SILENT_ENDPOINTS = [
  "timeweb-deploy-status",
  "timeweb-deploy",
  "trigger-timeweb-deploy"
];
function isSilent(urlOrName) {
  return SILENT_ENDPOINTS.some((s) => urlOrName.includes(s));
}
function installAiActivityHooks() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const isEdgeFn = typeof url === "string" && /\/functions\/v1\//.test(url);
    if (!isEdgeFn || isSilent(url)) return origFetch(input, init);
    const label = labelForEndpoint(url);
    const task = startAiTask({ label, endpoint: url });
    try {
      const resp = await origFetch(input, init);
      const ct = resp.headers.get("content-type") || "";
      const isStream = ct.includes("text/event-stream") || ct.includes("stream");
      if (isStream && resp.body) {
        task.progress("Соединение установлено · ожидаю данные…");
        let bytes = 0;
        const reader = resp.body.getReader();
        const stream = new ReadableStream({
          async pull(controller) {
            try {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                if (!resp.ok) task.fail(`HTTP ${resp.status}`);
                else task.success(`Готово · ${(bytes / 1024).toFixed(1)} KB`);
                return;
              }
              bytes += (value == null ? void 0 : value.byteLength) || 0;
              task.progress(`Стрим · ${(bytes / 1024).toFixed(1)} KB`, bytes);
              controller.enqueue(value);
            } catch (e) {
              controller.error(e);
              task.fail((e == null ? void 0 : e.message) || "Разрыв стрима");
            }
          },
          cancel(reason) {
            try {
              reader.cancel(reason);
            } catch {
            }
            task.fail("Отменено");
          }
        });
        return new Response(stream, { status: resp.status, statusText: resp.statusText, headers: resp.headers });
      }
      if (!resp.ok) task.fail(`HTTP ${resp.status} ${resp.statusText || ""}`.trim());
      else task.success("Готово");
      return resp;
    } catch (e) {
      task.fail((e == null ? void 0 : e.message) || "Сбой сети");
      throw e;
    }
  };
  try {
    const fns = supabase.functions;
    if (fns && typeof fns.invoke === "function" && !fns.__aiActivityWrapped) {
      const origInvoke = fns.invoke.bind(fns);
      fns.invoke = async (fnName, opts) => {
        var _a;
        if (isSilent(fnName)) return origInvoke(fnName, opts);
        const label = labelForEndpoint(fnName);
        const task = startAiTask({ label, endpoint: `functions/v1/${fnName}` });
        try {
          const res = await origInvoke(fnName, opts);
          if (res == null ? void 0 : res.error) {
            task.fail(((_a = res.error) == null ? void 0 : _a.message) || "Ошибка функции");
          } else {
            task.success("Готово");
          }
          return res;
        } catch (e) {
          task.fail((e == null ? void 0 : e.message) || "Сбой вызова");
          throw e;
        }
      };
      fns.__aiActivityWrapped = true;
    }
  } catch {
  }
}
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1e3 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});
const RouteLoader = () => /* @__PURE__ */ jsxs(Fragment, { children: [
  /* @__PURE__ */ jsx("div", { className: "fixed top-0 left-0 right-0 z-[60] h-0.5 overflow-hidden pointer-events-none", children: /* @__PURE__ */ jsx("div", { className: "h-full w-1/3 bg-primary animate-[loader_1.2s_ease-in-out_infinite]" }) }),
  /* @__PURE__ */ jsx("div", { className: "min-h-[40vh] flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) }),
  /* @__PURE__ */ jsx("style", { children: `@keyframes loader{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}` })
] });
const NavigationBar = () => {
  const nav2 = useNavigation();
  if (nav2.state === "idle") return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed top-0 left-0 right-0 z-[60] h-0.5 overflow-hidden pointer-events-none", children: /* @__PURE__ */ jsx("div", { className: "h-full w-1/3 bg-primary animate-[loader_1.2s_ease-in-out_infinite]" }) });
};
const RootLayout = () => {
  useEffect(() => {
    installAiActivityHooks();
  }, []);
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsxs(TooltipProvider, { children: [
    /* @__PURE__ */ jsx(MainLayout, { children: /* @__PURE__ */ jsxs(AppErrorBoundary, { children: [
      /* @__PURE__ */ jsx(NavigationBar, {}),
      /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(RouteLoader, {}), children: /* @__PURE__ */ jsx(Outlet, {}) })
    ] }) }),
    /* @__PURE__ */ jsx(Toaster$1, {}),
    /* @__PURE__ */ jsx(Toaster, {}),
    /* @__PURE__ */ jsx(AiActivityDock, {})
  ] }) }) });
};
const LangBoundary = ({ lang: lang2, children }) => {
  if (i18n.language !== lang2) {
    i18n.changeLanguage(lang2);
  }
  if (typeof document !== "undefined" && document.documentElement.lang !== lang2) {
    document.documentElement.lang = lang2;
  }
  return /* @__PURE__ */ jsx(Fragment, { children });
};
const headerPhoto = "/assets/header-photo-Dk7lgUXu.webp";
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[state=open]:bg-accent focus:bg-accent",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(ChevronRight, { className: "ml-auto h-4 w-4" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
const DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.SubContent,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
const DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
const DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
    ...props
  }
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Separator, { ref, className: cn("-mx-1 my-1 h-px bg-muted", className), ...props }));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
const SITE_URL$1 = "https://tarusin.pro";
function stripLangPrefix(pathname) {
  if (pathname === "/en" || pathname === "/en/") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  return pathname;
}
function getLangFromPath(pathname) {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ru";
}
function getAlternates(pathname) {
  const base = stripLangPrefix(pathname);
  const normalized = base === "/" || base.endsWith("/") ? base : `${base}/`;
  const ru2 = `${SITE_URL$1}${normalized}`;
  const en2 = normalized === "/" ? `${SITE_URL$1}/en/` : `${SITE_URL$1}/en${normalized}`;
  return { ru: ru2, en: en2, xDefault: ru2 };
}
const languages = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" }
];
const LanguageSwitcher = () => {
  const { i18n: i18n2 } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const current = languages.find((l) => l.code === i18n2.language) || languages[0];
  const switchTo = (code) => {
    try {
      window.localStorage.setItem("i18nextLng", code);
    } catch {
    }
    const bare = stripLangPrefix(location.pathname);
    const target = code === "en" ? bare === "/" ? "/en/" : `/en${bare}` : bare;
    if (target !== location.pathname) {
      navigate(target + location.search + location.hash);
    } else {
      i18n2.changeLanguage(code);
    }
  };
  return /* @__PURE__ */ jsxs(DropdownMenu, { children: [
    /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary", "aria-label": "Change language", children: [
      /* @__PURE__ */ jsx(Globe, { className: "w-4 h-4" }),
      /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: current.flag })
    ] }) }),
    /* @__PURE__ */ jsx(DropdownMenuContent, { align: "end", className: "min-w-[140px]", children: languages.map((lang2) => /* @__PURE__ */ jsxs(
      DropdownMenuItem,
      {
        onClick: () => switchTo(lang2.code),
        className: i18n2.language === lang2.code ? "bg-secondary" : "",
        children: [
          /* @__PURE__ */ jsx("span", { className: "mr-2", children: lang2.flag }),
          lang2.label
        ]
      },
      lang2.code
    )) })
  ] });
};
function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return localStorage.getItem("theme") === "dark" || !localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);
  return /* @__PURE__ */ jsx(
    Button,
    {
      variant: "ghost",
      size: "icon",
      onClick: () => setDark(!dark),
      className: "h-9 w-9 rounded-full",
      "aria-label": "Toggle theme",
      children: dark ? /* @__PURE__ */ jsx(Sun, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Moon, { className: "h-4 w-4" })
    }
  );
}
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { user, isAdmin, isSurgeon, signOut } = useAuth();
  const { t, i18n: i18n2 } = useTranslation();
  const mainNavItems2 = [
    { label: t("nav.home"), href: "#hero", isAnchor: true },
    { label: t("nav.about"), href: "#about", isAnchor: true },
    { label: t("nav.consultations"), href: "#consultations", isAnchor: true },
    { label: t("nav.methods"), href: "/methodologies", isAnchor: false }
  ];
  const moreNavItems = [
    { label: t("nav.team"), href: "/team" },
    { label: t("nav.forParents"), href: "/for-parents" },
    { label: t("nav.forDoctors"), href: "/for-doctors" },
    { label: t("nav.media"), href: "/media" },
    { label: t("nav.videos"), href: "/videos" },
    { label: t("nav.videoCases"), href: "/video-cases" },
    { label: t("nav.publications"), href: "/publications" },
    { label: t("nav.research"), href: "/research" },
    { label: t("nav.clinicalCases"), href: "/clinical-cases" },
    { label: t("nav.travelNotes"), href: "/travel-notes" },
    { label: t("nav.masterclasses"), href: "/masterclasses" },
    { label: t("nav.blog"), href: "/blog" },
    { label: t("nav.reviews"), href: "/reviews" },
    { label: t("nav.selfCheck"), href: "/self-check" },
    { label: t("nav.qa"), href: "/qa" },
    { label: t("nav.contacts"), href: "/contacts" }
  ];
  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };
  const scrollToSection = (href) => {
    if (!isHomePage) {
      window.location.href = "/" + href;
      return;
    }
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };
  return /* @__PURE__ */ jsx("header", { className: "fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between h-16 md:h-20", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("img", { src: headerPhoto, alt: "Professor Tarusin D.I.", width: 40, height: 40, decoding: "async", className: "w-10 h-10 rounded-full object-cover" }),
        /* @__PURE__ */ jsxs("div", { className: "hidden sm:block", children: [
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground", children: t("lang") === "en" ? "Professor Tarusin D.I." : "Профессор Тарусин Д.И." }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("hero.subtitle") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("nav", { className: "hidden lg:flex items-center gap-1", children: [
        mainNavItems2.map(
          (item) => item.isAnchor ? /* @__PURE__ */ jsx("button", { onClick: () => scrollToSection(item.href), className: "px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary", children: item.label }, item.href) : /* @__PURE__ */ jsx(Link, { to: item.href, className: "px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary", children: item.label }, item.href)
        ),
        /* @__PURE__ */ jsxs(DropdownMenu, { children: [
          /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("button", { className: "px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary inline-flex items-center gap-1", children: [
            t("nav.more"),
            /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" })
          ] }) }),
          /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-48", children: [
            moreNavItems.map((item) => /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsx(Link, { to: item.href, className: "w-full", children: item.label }) }, item.href)),
            /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
            isAdmin && /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "w-full flex items-center", children: [
              /* @__PURE__ */ jsx(Settings, { className: "w-4 h-4 mr-2" }),
              t("nav.adminPanel")
            ] }) }),
            !isAdmin && isSurgeon && /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/admin/operations-journal", className: "w-full flex items-center", children: [
              /* @__PURE__ */ jsx(Settings, { className: "w-4 h-4 mr-2" }),
              t("nav.opsJournal")
            ] }) }),
            user ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/portal", className: "w-full flex items-center", children: [
                /* @__PURE__ */ jsx(User, { className: "w-4 h-4 mr-2" }),
                i18n2.language === "en" ? "My Portal" : "Мой кабинет"
              ] }) }),
              /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: handleSignOut, className: "text-destructive", children: [
                /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4 mr-2" }),
                t("nav.signOut")
              ] })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/auth", className: "w-full flex items-center", children: [
                /* @__PURE__ */ jsx(LogIn, { className: "w-4 h-4 mr-2" }),
                t("nav.signIn")
              ] }) }),
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/auth?tab=register", className: "w-full flex items-center", children: [
                /* @__PURE__ */ jsx(UserPlus, { className: "w-4 h-4 mr-2" }),
                t("nav.signUp")
              ] }) })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(LanguageSwitcher, {}),
        /* @__PURE__ */ jsx(ThemeToggle, {}),
        /* @__PURE__ */ jsx(Link, { to: "/contacts", children: /* @__PURE__ */ jsx(Button, { className: "hidden sm:flex bg-accent hover:bg-accent/90 text-accent-foreground", children: t("nav.bookAppointment") }) }),
        /* @__PURE__ */ jsx("button", { onClick: () => setIsMenuOpen(!isMenuOpen), className: "lg:hidden p-2 text-foreground", "aria-label": "Toggle menu", children: isMenuOpen ? /* @__PURE__ */ jsx(X, { size: 24 }) : /* @__PURE__ */ jsx(Menu, { size: 24 }) })
      ] })
    ] }),
    isMenuOpen && /* @__PURE__ */ jsx("nav", { className: "lg:hidden py-4 border-t border-border max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-5rem)] overflow-y-auto overscroll-contain", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
      mainNavItems2.map(
        (item) => item.isAnchor ? /* @__PURE__ */ jsx("button", { onClick: () => scrollToSection(item.href), className: "px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors", children: item.label }, item.href) : /* @__PURE__ */ jsx(Link, { to: item.href, onClick: () => setIsMenuOpen(false), className: "px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors", children: item.label }, item.href)
      ),
      /* @__PURE__ */ jsx("div", { className: "border-t border-border my-2" }),
      moreNavItems.map((item) => /* @__PURE__ */ jsx(Link, { to: item.href, onClick: () => setIsMenuOpen(false), className: "px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors", children: item.label }, item.href)),
      /* @__PURE__ */ jsx(Link, { to: "/contacts", onClick: () => setIsMenuOpen(false), children: /* @__PURE__ */ jsx(Button, { className: "mt-2 w-full bg-accent hover:bg-accent/90 text-accent-foreground", children: t("nav.bookAppointmentFull") }) }),
      /* @__PURE__ */ jsx("div", { className: "border-t border-border my-2" }),
      isAdmin && /* @__PURE__ */ jsxs(Link, { to: "/admin", onClick: () => setIsMenuOpen(false), className: "px-4 py-3 text-left text-sm font-medium text-primary hover:bg-secondary rounded-lg transition-colors flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Settings, { className: "w-4 h-4" }),
        t("nav.adminPanel")
      ] }),
      !isAdmin && isSurgeon && /* @__PURE__ */ jsxs(Link, { to: "/admin/operations-journal", onClick: () => setIsMenuOpen(false), className: "px-4 py-3 text-left text-sm font-medium text-primary hover:bg-secondary rounded-lg transition-colors flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Settings, { className: "w-4 h-4" }),
        t("nav.opsJournal")
      ] }),
      user ? /* @__PURE__ */ jsxs("button", { onClick: handleSignOut, className: "px-4 py-3 text-left text-sm font-medium text-destructive hover:bg-secondary rounded-lg transition-colors flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }),
        t("nav.signOut")
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(Link, { to: "/auth", onClick: () => setIsMenuOpen(false), className: "px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(LogIn, { className: "w-4 h-4" }),
          t("nav.signIn")
        ] }),
        /* @__PURE__ */ jsxs(Link, { to: "/auth?tab=register", onClick: () => setIsMenuOpen(false), className: "px-4 py-3 text-left text-sm font-medium text-primary hover:bg-secondary rounded-lg transition-colors flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(UserPlus, { className: "w-4 h-4" }),
          t("nav.signUp")
        ] })
      ] })
    ] }) })
  ] }) });
};
const professorPhoto = "/assets/professor-photo-BGQCcfy3.webp";
const HeroSection = () => {
  const { t } = useTranslation();
  const scrollToSection = (href) => {
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };
  return /* @__PURE__ */ jsx("section", { id: "hero", className: "pt-20 md:pt-24 pb-16 md:pb-24 bg-gradient-to-b from-secondary/50 to-background", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4", children: /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center lg:text-left order-2 lg:order-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6", children: [
        /* @__PURE__ */ jsx(Syringe, { size: 16 }),
        /* @__PURE__ */ jsx("span", { children: t("hero.badge") })
      ] }),
      /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight", children: [
        t("hero.firstName"),
        /* @__PURE__ */ jsx("br", {}),
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: t("hero.lastName") })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-muted-foreground mb-2", children: t("hero.subtitle") }),
      /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-muted-foreground mb-8", children: t("hero.specialties") }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 justify-center lg:justify-start", children: [
        /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-3", children: /* @__PURE__ */ jsxs(Button, { size: "lg", onClick: () => window.open("tel:+74953030000"), className: "bg-accent hover:bg-accent/90 text-accent-foreground text-base px-6", children: [
          /* @__PURE__ */ jsx(Phone, { className: "w-5 h-5 mr-2" }),
          /* @__PURE__ */ jsxs("span", { className: "flex flex-col items-start leading-tight", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs opacity-80", children: t("hero.mataraClinic") }),
            /* @__PURE__ */ jsx("span", { children: "+7 (495) 303-00-00" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-center lg:justify-start", children: /* @__PURE__ */ jsx(Button, { size: "lg", variant: "outline", onClick: () => scrollToSection("#about"), className: "text-lg px-8", children: t("hero.learnMore") }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-border", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center lg:text-left", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center lg:justify-start gap-2 text-primary mb-1", children: [
            /* @__PURE__ */ jsx(Award, { size: 20 }),
            /* @__PURE__ */ jsx("span", { className: "text-2xl md:text-3xl font-bold", children: "42" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("hero.yearsExp") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center lg:text-left", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center lg:justify-start gap-2 text-primary mb-1", children: [
            /* @__PURE__ */ jsx(Users, { size: 20 }),
            /* @__PURE__ */ jsx("span", { className: "text-2xl md:text-3xl font-bold", children: "860+" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("hero.presentations") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center lg:text-left", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center lg:justify-start gap-2 text-primary mb-1", children: [
            /* @__PURE__ */ jsx(Stethoscope, { size: 20 }),
            /* @__PURE__ */ jsx("span", { className: "text-2xl md:text-3xl font-bold", children: "126+" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("hero.publicationsCount") })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "order-1 lg:order-2 flex justify-center", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx("div", { className: "w-72 md:w-96 lg:w-[28rem] rounded-2xl bg-gradient-to-br from-primary to-primary/60 p-1 shadow-2xl", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: professorPhoto,
          alt: `${t("hero.firstName")} ${t("hero.lastName")}`,
          width: 448,
          height: 560,
          fetchPriority: "high",
          decoding: "async",
          className: "w-full h-auto rounded-2xl border-4 border-background"
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "absolute -top-4 -right-4 w-20 h-20 bg-accent/20 rounded-full blur-xl" }),
      /* @__PURE__ */ jsx("div", { className: "absolute -bottom-8 -left-8 w-32 h-32 bg-primary/20 rounded-full blur-xl" })
    ] }) })
  ] }) }) });
};
const Card = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("rounded-lg border bg-card text-card-foreground shadow-sm", className), ...props }));
Card.displayName = "Card";
const CardHeader = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex flex-col space-y-1.5 p-6", className), ...props })
);
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("h3", { ref, className: cn("text-2xl font-semibold leading-none tracking-tight", className), ...props })
);
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("p", { ref, className: cn("text-sm text-muted-foreground", className), ...props })
);
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("p-6 pt-0", className), ...props })
);
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex items-center p-6 pt-0", className), ...props })
);
CardFooter.displayName = "CardFooter";
const boyIcon = "/assets/boy-icon-Dy2xtSpJ.png";
const manIcon = "/assets/man-icon-Zz7PSKeh.svg";
const surgeryIcon = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='iso-8859-1'?%3e%3csvg%20fill='%231e40af'%20height='800px'%20width='800px'%20version='1.1'%20id='Capa_1'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20viewBox='0%200%20394.995%20394.995'%20xml:space='preserve'%3e%3cpath%20d='M155.058,216.542c0-19.393-15.776-35.17-35.169-35.17s-35.17,15.777-35.17,35.17s15.777,35.17,35.17,35.17%20S155.058,235.935,155.058,216.542z%20M104.719,216.542c0-8.365,6.806-15.17,15.17-15.17s15.169,6.805,15.169,15.17%20s-6.805,15.17-15.169,15.17S104.719,224.907,104.719,216.542z%20M149.864,267.94c-19.393,0-35.169,15.777-35.169,35.17%20s15.776,35.17,35.169,35.17c19.394,0,35.172-15.777,35.172-35.17S169.257,267.94,149.864,267.94z%20M149.864,318.28%20c-8.364,0-15.169-6.805-15.169-15.17s6.805-15.17,15.169-15.17c8.366,0,15.172,6.805,15.172,15.17S158.23,318.28,149.864,318.28z%20M275.104,181.373c-19.393,0-35.169,15.777-35.169,35.17s15.776,35.17,35.169,35.17c19.394,0,35.172-15.777,35.172-35.17%20S294.498,181.373,275.104,181.373z%20M275.104,231.712c-8.364,0-15.169-6.805-15.169-15.17s6.805-15.17,15.169-15.17%20c8.366,0,15.172,6.805,15.172,15.17S283.47,231.712,275.104,231.712z%20M207.498,80.837V33.939l125.064,25.332v32.915%20c0,5.523,4.478,10,10,10s10-4.477,10-10V51.361c0.005-0.186,0.005-0.371,0-0.555V10c0-5.523-4.478-10-10-10s-10,4.477-10,10v28.865%20L199.483,11.91c-2.939-0.598-5.993,0.161-8.315,2.06c-2.323,1.899-3.67,4.741-3.67,7.741v59.126%20c-82.057,5.177-147.235,73.582-147.235,156.922c0,86.7,70.535,157.236,157.235,157.236s157.235-70.536,157.235-157.236%20C354.733,154.419,289.554,86.015,207.498,80.837z%20M197.498,374.995c-75.672,0-137.235-61.564-137.235-137.236%20c0-75.672,61.563-137.236,137.235-137.236s137.235,61.564,137.235,137.236C334.733,313.431,273.169,374.995,197.498,374.995z%20M232.667,159.849c0-19.393-15.777-35.17-35.17-35.17s-35.17,15.777-35.17,35.17s15.777,35.17,35.17,35.17%20S232.667,179.241,232.667,159.849z%20M197.498,175.019c-8.365,0-15.17-6.805-15.17-15.17s6.805-15.17,15.17-15.17%20s15.17,6.805,15.17,15.17S205.863,175.019,197.498,175.019z%20M245.129,267.94c-19.393,0-35.17,15.777-35.17,35.17%20s15.777,35.17,35.17,35.17s35.17-15.777,35.17-35.17S264.522,267.94,245.129,267.94z%20M245.129,318.28%20c-8.364,0-15.17-6.805-15.17-15.17s6.806-15.17,15.17-15.17s15.17,6.805,15.17,15.17S253.494,318.28,245.129,318.28z'/%3e%3c/svg%3e";
const microsurgeryIcon = "data:image/svg+xml,%3c?xml%20version='1.0'%20?%3e%3csvg%20xmlns='http://www.w3.org/2000/svg'%20version='1.1'%20viewBox='0%200%20512%20512'%20xml:space='preserve'%3e%3cpath%20fill='%231e40af'%20d='M421.038,44.765c-19.928-14.549-47.523-12.345-64.959,5.092%20c-0.201,0.201-237.603,237.603-266.789,266.79c-1.099,1.098-1.926,2.436-2.417,3.909l-13.454,40.36l-12.541,12.541%20c-9.291,9.317-11.216,23.095-5.858,34.258L2.929,459.808c-3.905,3.905-3.905,10.237,0,14.143c3.906,3.904,10.235,3.905,14.143,0%20l52.092-52.092c11.187,5.368,24.988,3.411,34.268-5.868l12.53-12.531l40.361-13.454c1.473-0.491,2.812-1.318,3.909-2.416%20l266.786-266.786c16.754-16.735,18.972-41.924,7.73-60.968C459.478,46.228,492,63.69,492,94.039v76.64%20c0,34.441-35.89,35.136-35.99,35.18c-29.985,0-54.38,24.395-54.38,54.38v64.767c-22.874,4.584-40.16,24.82-40.16,49.023v40.33%20c0,5.522,4.478,10,10,10h10.08v30.16c0,5.522,4.478,10,10,10s10-4.478,10-10v-30.16h20.16v30.16c0,5.522,4.478,10,10,10%20s10-4.478,10-10v-30.16h10.09c5.522,0,10-4.478,10-10v-40.33c0-24.206-17.292-44.444-40.17-49.024v-64.765%20c0-33.664,35.09-34.337,35.19-34.38c30.426,0,55.18-24.754,55.18-55.18v-76.64C512,46.308,458.923,19.619,421.038,44.765z%20M89.29,401.848c-3.941,3.941-10.309,3.956-14.259,0c-3.927-3.927-3.971-10.276,0-14.258l7.129-7.129l14.258,14.258L89.29,401.848z%20M147.759,371.778l-34.498,11.499l-19.659-19.66l11.499-34.496l48.056-48.056l42.661,42.654L147.759,371.778z%20M209.959,309.578%20l-42.661-42.654L273.85,160.372l42.658,42.657L209.959,309.578z%20M412.879,106.658l-82.229,82.229l-42.658-42.657L370.222,64%20c11.794-11.794,30.872-11.794,42.657,0C424.695,75.816,424.654,94.897,412.879,106.658z%20M441.8,374.028v30.33h-60.33v-30.33%20c0-16.542,13.458-30,30-30h0.33C428.342,344.028,441.8,357.486,441.8,374.028z%20M266.722,210.158c3.905,3.905,3.905,10.237,0,14.142%20l-35.5,35.499c-3.907,3.905-10.236,3.904-14.143,0c-3.905-3.905-3.905-10.237,0-14.143l35.5-35.5%20C256.487,206.253,262.818,206.254,266.722,210.158z'/%3e%3c/svg%3e";
const Dialog = SheetPrimitive.Root;
const DialogTrigger = SheetPrimitive.Trigger;
const DialogPortal = SheetPrimitive.Portal;
const DialogClose = SheetPrimitive.Close;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = SheetPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxs(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-sm:inset-0 max-sm:left-0 max-sm:top-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:h-[100dvh] max-sm:max-w-none max-sm:rounded-none max-sm:overflow-y-auto",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = SheetPrimitive.Content.displayName;
const DialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className), ...props });
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className), ...props });
DialogFooter.displayName = "DialogFooter";
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
DialogTitle.displayName = SheetPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SheetPrimitive.Description, { ref, className: cn("text-sm text-muted-foreground", className), ...props }));
DialogDescription.displayName = SheetPrimitive.Description.displayName;
const CertificateLightbox = ({ images, initialIndex, open, onOpenChange }) => {
  const [index, setIndex] = React.useState(initialIndex);
  React.useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft") setIndex((i) => i > 0 ? i - 1 : images.length - 1);
      if (e.key === "ArrowRight") setIndex((i) => i < images.length - 1 ? i + 1 : 0);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, images.length]);
  if (!images.length) return null;
  const current = images[index];
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-4xl w-[95vw] max-h-[90vh] p-0 bg-black/95 border-none overflow-hidden", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => onOpenChange(false),
        className: "absolute top-3 right-3 z-50 text-white/70 hover:text-white transition-colors",
        children: /* @__PURE__ */ jsx(X, { className: "w-6 h-6" })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-center min-h-[60vh]", children: [
      images.length > 1 && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setIndex((i) => i > 0 ? i - 1 : images.length - 1),
          className: "absolute left-2 z-40 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors",
          children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-6 h-6" })
        }
      ),
      /* @__PURE__ */ jsx(
        "img",
        {
          src: current.url,
          alt: current.title,
          className: "max-h-[80vh] max-w-full object-contain select-none",
          draggable: false
        }
      ),
      images.length > 1 && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setIndex((i) => i < images.length - 1 ? i + 1 : 0),
          className: "absolute right-2 z-40 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors",
          children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-6 h-6" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-white/80 text-sm", children: current.title }),
      /* @__PURE__ */ jsxs("p", { className: "text-white/80 text-xs mt-1", children: [
        index + 1,
        " / ",
        images.length
      ] })
    ] })
  ] }) });
};
const MAX_PUBLIC_CERTIFICATES = 60;
const AboutSection = () => {
  const { t } = useTranslation();
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const specializations = [
    { customIcon: boyIcon, titleKey: "about.specPedUroAndro", descKey: "about.specPedUroAndroDesc" },
    { customIcon: manIcon, titleKey: "about.specAdultAndro", descKey: "about.specAdultAndroDesc" },
    { icon: Baby, titleKey: "about.specPediatrics", descKey: "about.specPediatricsDesc" },
    { customIcon: surgeryIcon, titleKey: "about.specPedSurgery", descKey: "about.specPedSurgeryDesc" },
    { customIcon: microsurgeryIcon, titleKey: "about.specMicrosurgery", descKey: "about.specMicrosurgeryDesc" },
    { icon: Sparkles, titleKey: "about.specPlasticSurgery", descKey: "about.specPlasticSurgeryDesc" },
    { icon: Brain, titleKey: "about.specSexology", descKey: "about.specSexologyDesc" },
    { icon: MonitorCheck, titleKey: "about.specUltrasound", descKey: "about.specUltrasoundDesc" },
    { icon: Bone, titleKey: "about.specOrthopedics", descKey: "about.specOrthopedicsDesc" },
    { icon: Building, titleKey: "about.specHealthAdmin", descKey: "about.specHealthAdminDesc" }
  ];
  const achievements = [
    { value: "42", labelKey: "about.achYears" },
    { value: "126+", labelKey: "about.achArticles" },
    { value: "6", labelKey: "about.achChapters" },
    { value: "9+", labelKey: "about.achCandidates" }
  ];
  const careerItems = Array.from({ length: 9 }, (_, i) => ({
    titleKey: `about.career${i + 1}Title`,
    descKey: `about.career${i + 1}Desc`
  }));
  const { data: certificates = [] } = useQuery({
    queryKey: ["certificates-public", MAX_PUBLIC_CERTIFICATES],
    queryFn: async () => {
      const { data, error } = await supabase.from("certificates").select("id,title,image_path,sort_order,is_published").eq("is_published", true).order("sort_order", { ascending: true }).limit(MAX_PUBLIC_CERTIFICATES);
      if (error) throw error;
      return data;
    },
    staleTime: 1e3 * 60 * 5
  });
  const getImageUrl = (imagePath, size = "full") => {
    const transform = size === "thumb" ? { width: 480, height: 360, resize: "contain", quality: 70 } : { width: 1600, quality: 80 };
    const { data } = supabase.storage.from("certificates").getPublicUrl(imagePath, { transform });
    return data.publicUrl;
  };
  const certImages = React.useMemo(
    () => certificates.map((c) => ({ id: c.id, title: c.title, url: getImageUrl(c.image_path, "full") })),
    [certificates]
  );
  return /* @__PURE__ */ jsx("section", { id: "about", className: "py-16 md:py-24 bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-12 md:mb-16", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-foreground mb-4", children: t("about.title") }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-3xl mx-auto", children: t("about.description") })
    ] }),
    /* @__PURE__ */ jsx(Card, { className: "mb-12 md:mb-16 bg-primary/5 border-primary/20", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 md:p-10", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-2xl font-semibold text-foreground mb-6 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Shield, { className: "w-7 h-7 text-primary" }),
        t("about.careerTitle")
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-4", children: careerItems.map((item, i) => /* @__PURE__ */ jsxs("div", { className: `bg-background rounded-lg p-4 border border-border ${i === 8 ? "md:col-span-2" : ""}`, children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground", children: t(item.titleKey) }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t(item.descKey) })
      ] }, i)) })
    ] }) }),
    /* @__PURE__ */ jsx(Card, { className: "mb-12 md:mb-16 bg-card border-border shadow-lg", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6 md:p-10", children: /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-8 items-center", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-2xl font-semibold text-foreground mb-4", children: t("about.approachTitle") }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4 text-muted-foreground", children: [
          /* @__PURE__ */ jsx("p", { children: t("about.approachP1") }),
          /* @__PURE__ */ jsx("p", { children: t("about.approachP2") }),
          /* @__PURE__ */ jsx("p", { children: t("about.approachP3") })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-4", children: achievements.map((item, index) => /* @__PURE__ */ jsxs("div", { className: "bg-secondary rounded-xl p-6 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "text-3xl md:text-4xl font-bold text-primary mb-2", children: item.value }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: t(item.labelKey) })
      ] }, index)) })
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-2xl md:text-3xl font-bold text-foreground mb-4", children: t("about.specTitle") }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground max-w-xl mx-auto", children: t("about.specSubtitle") })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6", children: specializations.map((spec, index) => /* @__PURE__ */ jsx(Card, { className: "group bg-card border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors overflow-hidden", children: spec.customIcon ? /* @__PURE__ */ jsx("img", { src: spec.customIcon, alt: t(spec.titleKey), className: "w-8 h-8 object-contain", style: { filter: "invert(32%) sepia(98%) saturate(1234%) hue-rotate(196deg) brightness(94%) contrast(91%)" } }) : spec.icon ? /* @__PURE__ */ jsx(spec.icon, { className: "w-7 h-7 text-primary" }) : null }),
      /* @__PURE__ */ jsx("h4", { className: "font-semibold text-foreground mb-2 text-sm", children: t(spec.titleKey) }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t(spec.descKey) })
    ] }) }, index)) }),
    certificates.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-12 md:mt-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-2xl md:text-3xl font-bold text-foreground mb-4", children: t("about.diplomasTitle") }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground max-w-xl mx-auto", children: t("about.diplomasSubtitle") })
      ] }),
      /* @__PURE__ */ jsx(Card, { className: "mb-8 bg-muted/30 border-dashed", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
        "💬 ",
        /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: t("about.opinionLabel") }),
        " ",
        t("about.opinionText")
      ] }) }) }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4", children: certificates.map((cert, idx) => /* @__PURE__ */ jsx(
        Card,
        {
          className: "overflow-hidden border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer group",
          onClick: () => {
            setLightboxIndex(idx);
            setLightboxOpen(true);
          },
          children: /* @__PURE__ */ jsxs(CardContent, { className: "p-0", children: [
            /* @__PURE__ */ jsx("div", { className: "aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: getImageUrl(cert.image_path, "thumb"), alt: cert.title, loading: "lazy", decoding: "async", width: 480, height: 360, className: "w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" }) }),
            /* @__PURE__ */ jsx("div", { className: "p-3 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground truncate", children: cert.title }) })
          ] })
        },
        cert.id
      )) }),
      /* @__PURE__ */ jsx(
        CertificateLightbox,
        {
          images: certImages,
          initialIndex: lightboxIndex,
          open: lightboxOpen,
          onOpenChange: setLightboxOpen
        }
      )
    ] }),
    /* @__PURE__ */ jsx(Card, { className: "mt-12 bg-accent/10 border-accent/20", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
      "🦔 ",
      /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: t("about.funFactLabel") }),
      " ",
      t("about.funFact")
    ] }) }) })
  ] }) });
};
const PioneersSection = () => {
  const { t } = useTranslation();
  const pioneerItems = [
    { icon: Trophy, numKey: "1" },
    { icon: Lightbulb, numKey: "2" },
    { icon: Globe, numKey: "3" },
    { icon: Star, numKey: "4" },
    { icon: Lightbulb, numKey: "5" },
    { icon: Globe, numKey: "6" }
  ];
  return /* @__PURE__ */ jsx("section", { className: "py-16 md:py-24 bg-secondary/30", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-12 md:mb-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4", children: [
        /* @__PURE__ */ jsx(Trophy, { size: 16 }),
        /* @__PURE__ */ jsx("span", { children: t("pioneers.badge") })
      ] }),
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-foreground mb-4", children: t("pioneers.title") }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: t("pioneers.subtitle") })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto", children: pioneerItems.map((item, index) => /* @__PURE__ */ jsx(Card, { className: "group bg-card border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors", children: /* @__PURE__ */ jsx(item.icon, { className: "w-6 h-6 text-primary" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-primary mb-1", children: t(`pioneers.item${item.numKey}Year`) }),
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground mb-2 text-sm leading-snug", children: t(`pioneers.item${item.numKey}Title`) }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: t(`pioneers.item${item.numKey}Desc`) })
      ] })
    ] }) }) }, index)) })
  ] }) });
};
const ProfessorMessageSection = () => {
  const { t } = useTranslation();
  return /* @__PURE__ */ jsx("section", { className: "py-16 md:py-24 bg-background", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4", children: /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto", children: /* @__PURE__ */ jsx(Card, { className: "bg-primary/5 border-primary/20 overflow-hidden", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-8 md:p-12", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
      /* @__PURE__ */ jsx(Quote, { className: "w-8 h-8 text-primary" }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: t("professorMessage.title") })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-5 text-muted-foreground leading-relaxed", children: [
      /* @__PURE__ */ jsx("p", { className: "text-lg", children: t("professorMessage.greeting") }),
      /* @__PURE__ */ jsx("p", { children: t("professorMessage.p1") }),
      /* @__PURE__ */ jsx("p", { children: t("professorMessage.p2") }),
      /* @__PURE__ */ jsx("p", { children: t("professorMessage.p3") }),
      /* @__PURE__ */ jsx("p", { children: t("professorMessage.p4") }),
      /* @__PURE__ */ jsx("p", { className: "text-foreground font-medium italic", children: t("professorMessage.signature") })
    ] })
  ] }) }) }) }) });
};
const ConsultationsSection = () => {
  const { t } = useTranslation();
  const childSymptoms = t("consultations.childSymptoms", { returnObjects: true });
  const adultSymptoms = t("consultations.adultSymptoms", { returnObjects: true });
  const preparations = t("consultations.preparations", { returnObjects: true });
  const steps = Array.from({ length: 9 }, (_, i) => ({
    title: t(`consultations.step${i + 1}Title`),
    desc: t(`consultations.step${i + 1}Desc`)
  }));
  const scrollToContact = () => {
    const element = document.querySelector("#contact");
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };
  return /* @__PURE__ */ jsx("section", { id: "consultations", className: "py-16 md:py-24 bg-secondary/30", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-12 md:mb-16", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-foreground mb-4", children: t("consultations.title") }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: t("consultations.subtitle") })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-3 gap-6 md:gap-8", children: [
      /* @__PURE__ */ jsxs(Card, { className: "bg-card border-border shadow-lg", children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Stethoscope, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx(CardTitle, { className: "text-xl", children: t("consultations.patientPath") })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: steps.map((step, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0", children: i + 1 }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground", children: step.title }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: step.desc })
          ] })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "bg-card border-border shadow-lg", children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(FileText, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx(CardTitle, { className: "text-xl", children: t("consultations.whatProblems") })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-3 pb-2 border-b border-border", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-primary", children: t("consultations.children") }) }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-1.5", children: childSymptoms.map((symptom, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-primary flex-shrink-0" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: symptom })
            ] }, index)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-3 pb-2 border-b border-border", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-primary", children: t("consultations.men") }) }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-1.5", children: adultSymptoms.map((symptom, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-primary flex-shrink-0" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: symptom })
            ] }, index)) })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs(Card, { className: "bg-card border-border shadow-lg", children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Calendar, { className: "w-6 h-6 text-primary" }) }),
            /* @__PURE__ */ jsx(CardTitle, { className: "text-xl", children: t("consultations.howToPrepare") })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { className: "space-y-3", children: preparations.map((prep, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-primary flex-shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: prep })
          ] }, index)) })
        ] }),
        /* @__PURE__ */ jsx(Card, { className: "bg-primary text-primary-foreground shadow-lg", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 space-y-4", children: [
          /* @__PURE__ */ jsxs("h4", { className: "font-semibold text-lg", children: [
            t("consultations.contactInfo"),
            " — ",
            t("consultations.mataraName")
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm", children: t("consultations.mataraAddress") })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Phone, { className: "w-5 h-5" }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm", children: [
                "+7 (495) 303-00-00 (",
                t("consultations.reception"),
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Phone, { className: "w-5 h-5" }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm", children: [
                "+7 (926) 303-01-11 (",
                t("consultations.booking"),
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Phone, { className: "w-5 h-5" }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm", children: [
                "+7 (916) 030-30-31 (",
                t("consultations.booking"),
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm", children: t("consultations.byAppointment") })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Button, { onClick: scrollToContact, className: "w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4", children: t("consultations.bookAppointment") })
        ] }) })
      ] })
    ] })
  ] }) });
};
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
const Label = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(LabelPrimitive.Root, { ref, className: cn(labelVariants(), className), ...props }));
Label.displayName = LabelPrimitive.Root.displayName;
const CoursesSection = () => {
  const { toast: toast2 } = useToast();
  const { t, i18n: i18n2 } = useTranslation();
  const isEn = i18n2.language === "en";
  const courses2 = [1, 2, 3, 4, 5, 6].map((n) => ({
    title: t(`courses.course${n}Title`),
    description: t(`courses.course${n}Desc`),
    fullDescription: t(`courses.course${n}FullDesc`),
    duration: t(`courses.course${n}Duration`),
    format: t(`courses.course${n}Format`),
    audience: t(`courses.course${n}Audience`),
    price: t(`courses.course${n}Price`),
    badge: t(`courses.course${n}Badge`),
    nextDate: t(`courses.course${n}Date`),
    cta: t(`courses.course${n}CTA`),
    topics: t(`courses.courseTopicsList${n}`, { returnObjects: true }),
    highlighted: n === 5
  }));
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false, slidesToScroll: 1, containScroll: "trimSnaps" });
  const scrollPrev = useCallback(() => emblaApi == null ? void 0 : emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi == null ? void 0 : emblaApi.scrollNext(), [emblaApi]);
  const scrollToContact = () => {
    const element = document.querySelector("#contact");
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast2({ title: t("courses.fillRequired"), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1e3));
    setIsSubmitted(true);
    toast2({ title: t("courses.courseSubmitted"), description: t("courses.courseSubmittedDesc") });
    setTimeout(() => {
      setSelectedCourse(null);
      setIsSubmitted(false);
      setForm({ name: "", phone: "", email: "" });
    }, 3e3);
    setIsSubmitting(false);
  };
  const freeBadge = isEn ? "Free" : "Бесплатно";
  const uniqueBadge = isEn ? "Unique Author's Course" : "Уникальный авторский курс";
  const authorBadge = isEn ? "Author's Course" : "Авторский курс";
  return /* @__PURE__ */ jsxs("section", { id: "courses", className: "py-16 md:py-24 bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-12 md:mb-16", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4", children: [
          /* @__PURE__ */ jsx(GraduationCap, { size: 16 }),
          /* @__PURE__ */ jsx("span", { children: t("courses.badge") })
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-foreground mb-4", children: t("courses.title") }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: t("courses.subtitle") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx("div", { className: "overflow-hidden", ref: emblaRef, children: /* @__PURE__ */ jsx("div", { className: "flex gap-6", children: courses2.map((course, index) => /* @__PURE__ */ jsx("div", { className: "flex-[0_0_100%] min-w-0 sm:flex-[0_0_48%] lg:flex-[0_0_32%]", children: /* @__PURE__ */ jsxs(Card, { className: `border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col h-full ${course.highlighted ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10" : "bg-card"}`, children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "pb-4", children: [
            course.badge && /* @__PURE__ */ jsx(Badge, { className: `w-fit mb-2 ${course.badge === freeBadge ? "bg-green-100 text-green-700 hover:bg-green-100" : course.badge === uniqueBadge ? "bg-primary/15 text-primary hover:bg-primary/15" : course.badge === authorBadge ? "bg-primary/10 text-primary/80 hover:bg-primary/10" : "bg-accent/10 text-accent hover:bg-accent/10"}`, children: course.badge }),
            /* @__PURE__ */ jsx(CardTitle, { className: "text-lg leading-tight", children: course.title })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "flex-grow", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-4", children: course.description }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-primary" }),
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: course.duration })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
                /* @__PURE__ */ jsx(BookOpen, { className: "w-4 h-4 text-primary" }),
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: course.format })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
                /* @__PURE__ */ jsx(Users, { className: "w-4 h-4 text-primary" }),
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: course.audience })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mx-4 mb-2 px-3 py-2.5 rounded-lg bg-accent/10 border border-accent/20", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 text-sm font-semibold text-accent mb-0.5", children: /* @__PURE__ */ jsxs("span", { children: [
              "📅 ",
              t("courses.startDate", { date: course.nextDate })
            ] }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: course.cta })
          ] }),
          /* @__PURE__ */ jsxs(CardFooter, { className: "flex flex-col gap-3 pt-4 border-t border-border", children: [
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-foreground w-full", children: course.price }),
            /* @__PURE__ */ jsx(Button, { className: "w-full bg-primary hover:bg-primary/90", onClick: () => setSelectedCourse(course), children: t("courses.learnMore") })
          ] })
        ] }) }, index)) }) }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "icon", className: "absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg bg-background/90 backdrop-blur-sm z-10 flex", onClick: scrollPrev, children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "icon", className: "absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg bg-background/90 backdrop-blur-sm z-10 flex", onClick: scrollNext, children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-5 h-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center mt-12", children: [
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: t("courses.noCourseFound") }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "lg", onClick: scrollToContact, children: t("courses.contactForConsultation") })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: !!selectedCourse, onOpenChange: (open) => {
      if (!open) {
        setSelectedCourse(null);
        setIsSubmitted(false);
        setForm({ name: "", phone: "", email: "" });
      }
    }, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-lg max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "text-xl", children: selectedCourse == null ? void 0 : selectedCourse.title }),
        /* @__PURE__ */ jsx(DialogDescription, { className: "text-muted-foreground", children: selectedCourse == null ? void 0 : selectedCourse.fullDescription })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center p-3 bg-muted rounded-lg", children: [
            /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 mx-auto mb-1 text-primary" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: selectedCourse == null ? void 0 : selectedCourse.duration })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-center p-3 bg-muted rounded-lg", children: [
            /* @__PURE__ */ jsx(BookOpen, { className: "w-4 h-4 mx-auto mb-1 text-primary" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: selectedCourse == null ? void 0 : selectedCourse.format })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-center p-3 bg-muted rounded-lg", children: [
            /* @__PURE__ */ jsx(Users, { className: "w-4 h-4 mx-auto mb-1 text-primary" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: selectedCourse == null ? void 0 : selectedCourse.audience })
          ] })
        ] }),
        (selectedCourse == null ? void 0 : selectedCourse.topics) && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold text-foreground mb-2", children: t("courses.courseTopics") }),
          /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: selectedCourse.topics.map((topic, i) => /* @__PURE__ */ jsxs("li", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" }),
            topic
          ] }, i)) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-foreground", children: selectedCourse == null ? void 0 : selectedCourse.price }),
        isSubmitted ? /* @__PURE__ */ jsxs("div", { className: "text-center py-6", children: [
          /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3", children: /* @__PURE__ */ jsx(CheckCircle, { className: "w-7 h-7 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground mb-1", children: t("courses.courseSubmitted") }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("courses.courseSubmittedDesc") })
        ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmitRequest, className: "space-y-3 border-t border-border pt-4", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold text-foreground", children: isEn ? "Submit Request" : "Оставить заявку" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "course-name", children: t("courses.courseName") }),
            /* @__PURE__ */ jsx(Input, { id: "course-name", placeholder: "...", value: form.name, onChange: (e) => setForm((p) => ({ ...p, name: e.target.value })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "course-phone", children: t("courses.coursePhone") }),
            /* @__PURE__ */ jsx(Input, { id: "course-phone", type: "tel", placeholder: "+7 (999) 123-45-67", value: form.phone, onChange: (e) => setForm((p) => ({ ...p, phone: e.target.value })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "course-email", children: t("courses.courseEmail") }),
            /* @__PURE__ */ jsx(Input, { id: "course-email", type: "email", placeholder: "example@mail.com", value: form.email, onChange: (e) => setForm((p) => ({ ...p, email: e.target.value })) })
          ] }),
          /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: isSubmitting, children: isSubmitting ? t("courses.courseSubmitting") : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 mr-2" }),
            t("courses.courseSubmit")
          ] }) })
        ] })
      ] })
    ] }) })
  ] });
};
const reviews$2 = [
  {
    name: "Мама 12-летнего сына",
    nameEn: "Mother of a 12-year-old son",
    date: "Март 2026",
    dateEn: "March 2026",
    rating: 5,
    text: "После посещения доктора Тарусина Д.И. у нас остались положительные впечатления. Дмитрий Игоревич уделил достаточно внимания, произвёл обследование и сделал УЗИ. Врач подобрал лечение и направил на дополнительные исследования. Манера общения крайне дружелюбная, специалист смог найти общий язык с ребёнком. Информацию доносил в доступной форме, даже рисовал картинки и всё объяснял. Данного детского уролога можно порекомендовать.",
    textEn: "After visiting Dr. Tarusin, we were left with a very positive impression. Dmitry Igorevich gave sufficient attention, performed an examination and ultrasound. The doctor prescribed treatment and referred us for additional tests. His communication style is extremely friendly — he connected with our child easily. He explained everything in simple terms, even drawing pictures. We highly recommend this pediatric urologist.",
    source: "ПроДокторов"
  },
  {
    name: "Мама подростка",
    nameEn: "Mother of a teenager",
    date: "Февраль 2026",
    dateEn: "February 2026",
    rating: 5,
    text: "Обратились к врачу, прочитав отзывы. Искали специалиста в области детской андрологии-урологии. В других местах нам сразу говорили, что нашим вопросом не занимаются. Дмитрий Игоревич сказал, что запрос у нас редкий, не типичный. Очень внимательно выслушал, изучил имеющиеся исследования, осмотрел, назначил анализы и обследование. Подробно объяснил, зачем что нужно делать. Он нашёл подход к моему сыну-подростку. Это профессиональный доктор и очень неравнодушный человек!",
    textEn: "We found the doctor through reviews. We were looking for a specialist in pediatric andrology-urology. Other places immediately said they don't deal with our issue. Dmitry Igorevich said our case was rare and atypical. He listened very attentively, studied existing test results, examined, and ordered tests. He explained in detail why each step was necessary. He found an approach to my teenage son. This is a professional doctor and a truly caring person!",
    source: "ПроДокторов"
  },
  {
    name: "Любовь",
    date: "Февраль 2026",
    dateEn: "February 2026",
    rating: 5,
    text: "После постановки диагноза сыну очень долго искали врача — были на консультациях у 5 врачей. Обратились к доктору по рекомендации знакомых врачей. Дмитрий Игоревич — специалист уникальный. Проводит операции по своим авторским методикам. От первого осмотра до операции прошло ровно трое суток. На приёме доктор самостоятельно проводит все необходимые УЗИ. Доктор создаёт доверительные и безопасные отношения с ребёнком. Работает используя микроскоп, первоклассные материалы и медикаменты.",
    textEn: "After our son was diagnosed, we spent a long time searching for a doctor — we consulted 5 physicians. We came to Dr. Tarusin on the recommendation of fellow doctors. Dmitry Igorevich is a unique specialist. He performs surgeries using his own proprietary techniques. From the first examination to the surgery, only three days passed. During the appointment, the doctor personally performs all necessary ultrasounds. He builds trusting and safe relationships with children. He works with a microscope, first-class materials and medications.",
    source: "ПроДокторов"
  },
  {
    name: "Любовь",
    date: "Февраль 2026",
    dateEn: "February 2026",
    rating: 5,
    text: "После постановки диагноза сыну очень долго искали врача. Обратились к доктору по рекомендации знакомых врачей. Дмитрий Игоревич — специалист уникальный. Доктор проводит операции по своим авторским методикам. Врач, обладающий многолетним опытом, сделавший тысячи подобных операций, готовый брать ответственность и вести ребёнка от операции до выздоровления. Оборудование и методика — всё на высшем уровне.",
    textEn: "After our son's diagnosis, we searched for a long time for a doctor. We came on the recommendation of fellow physicians. Dmitry Igorevich is a unique specialist who performs surgeries using his own proprietary techniques. A doctor with many years of experience, having performed thousands of similar operations, ready to take responsibility and guide the child from surgery to recovery. Equipment and methodology — everything is at the highest level.",
    source: "DocDoc"
  },
  {
    name: "Олеся Р.",
    nameEn: "Olesya R.",
    date: "1 декабря 2023",
    dateEn: "December 1, 2023",
    rating: 5,
    text: "Делали 2 года назад операцию ребенку по устранению крипторхизма и пупочную грыжу. В нашем городе напугали, сказали оч сложная операция. Мы все на панике, жизнь рухнула. Приехали к профессору, сказал ерунда, всё сделаем. Сделал, делали узи все на месте, растет, развивается. Только потом на итоговом узи профессор признался, что операция не простая была. А мы то думали ерунда))) так он нас подготовил, что мы и не переживали. А так после операции ребенок отошел от наркоза, сел в машину и домой поехали. Супер профессор! Очень рекомендую. Нашли его через знакомых, работающих в сфере медицины. А ещё он очень весёлый. В таких ситуациях это важно) и с ребенком контакт наладил))",
    textEn: "Two years ago, we had surgery for our child to correct cryptorchidism and an umbilical hernia. In our city, doctors scared us, said it was a very complex operation. We were in panic, our world collapsed. We came to the professor, he said 'no big deal, we'll handle it.' He did it, ultrasound showed everything in place, growing and developing. Only later at the final ultrasound did the professor admit the surgery wasn't simple at all. And we thought it was nothing! That's how well he prepared us — we didn't worry at all. After surgery, the child woke from anesthesia, got in the car, and we drove home. Super professor! Highly recommend. We found him through friends in medicine. Also, he's very cheerful — in such situations, that matters! And he connected great with our child.",
    source: "Яндекс"
  },
  {
    name: "Арина",
    nameEn: "Arina",
    date: "20 января 2022",
    dateEn: "January 20, 2022",
    rating: 5,
    text: "После приема в районной поликлинике и невнятных диагнозов типа «ну, грубой патологии нет, но ваш ребёнок очень беспокойный, поэтому Узи провести не удалось, пусть вас педиатр ещё послушает» я кинулась искать настоящих специалистов! Обзвонив все известные сети и не найдя нигде окна на ближайшее время, узнала про клинику доктора Матара, пусть далеко, но оказалось два важных специалиста работают именно в ней: уролог Тарусин ДИ и кардиолог Тутельман КМ — интеллигентнейшие люди! Столь чуткого отношения к малышу и ко мне я давно не встречала! И ни у одного не возникло никаких проблем осмотреть моего сыночка. И успокоить меня, что мы не их пациенты :) Спасибо вам огромное! Мама Пети В.",
    textEn: "After a visit to a local clinic with vague diagnoses like 'no gross pathology, but your child is very restless, the ultrasound couldn't be done,' I rushed to find real specialists! After calling all known networks and finding no availability, I learned about Dr. Matara's clinic. Two important specialists work there: urologist Tarusin and cardiologist Tutelman — the most intelligent people! I haven't encountered such sensitive treatment of my baby and myself in a long time! Neither had any problems examining my son. And they reassured me that we weren't their patients :) Thank you so much!",
    source: "Яндекс"
  },
  {
    name: "Пользователь",
    nameEn: "User",
    date: "27 июля 2023",
    dateEn: "July 27, 2023",
    rating: 5,
    text: "С Дмитрием Игоревичем мы знакомы с сыном с далекого 2004 года, когда впервые попали к нему на прием по рекомендации нашего педиатра с диагнозом крипторхизм. Дмитрий Игоревич провел блестящую консультацию, в ходе которой нам все доступно объяснили что сыну требуется оперативное вмешательство. Мы полностью доверились доктору, который не только отличный специалист, но и приятный человек с чувством юмора, который вселяет уверенность в результат. Операция была проведена. Послеоперационный период был без осложнений. К Дмитрию Игоревичу мы приезжали каждый год на обследование. В 2021 год возник диагноз варикоцелле, было назначено лечение, но операцию, к сожалению, избежать не удалось. Но мы уже ничего не боялись, мы в надежных руках. И снова блестяще проведенная операция. И контрольное обследование через год. И вердикт «диагноз полностью здоров». Вы больше не нуждаетесь в ежегодном обследовании. Все хорошо. И по первому диагнозу и по второму. Мы были счастливы это услышать. Поэтому мы от всей семьи выражаем бесконечную благодарность и признательность профессору, человеку с большой буквы Тарусину Дмитрию Игоревичу. Желаем всего всего самого наилучшего в вашем таком важном и значимом деле!",
    textEn: "My son and I have known Dmitry Igorevich since 2004, when we first visited him on our pediatrician's recommendation with a cryptorchidism diagnosis. He gave a brilliant consultation, explaining clearly that surgery was needed. We fully trusted the doctor, who is not only an excellent specialist but also a pleasant person with a sense of humor who inspires confidence. The surgery was performed; recovery was without complications. We visited annually for check-ups. In 2021, varicocele was diagnosed, and unfortunately surgery couldn't be avoided. But we weren't afraid anymore — we were in safe hands. Another brilliantly performed surgery, a follow-up a year later, and the verdict: 'completely healthy.' Our entire family extends endless gratitude to Professor Tarusin!",
    source: "Яндекс"
  },
  {
    name: "Яна Кияницкая",
    nameEn: "Yana Kiyanitskaya",
    date: "10 января 2024",
    dateEn: "January 10, 2024",
    rating: 5,
    text: "Он профессионал. И урология его призвание. Он разбирается до мелочей. Очень внимателен и компетентен.",
    textEn: "He is a professional. Urology is his calling. He understands every detail. Very attentive and competent.",
    source: "Яндекс"
  },
  {
    name: "Ана",
    nameEn: "Ana",
    date: "9 декабря 2021",
    dateEn: "December 9, 2021",
    rating: 5,
    text: "Лучший врач Тарусин, делали в Морозовской операцию, одним днем, все отлично. Но он только платно.",
    textEn: "The best doctor, Tarusin. Had surgery at Morozovskaya Hospital, same-day, everything went perfectly. But he only works privately.",
    source: "Яндекс"
  },
  {
    name: "Osa",
    date: "8 декабря 2021",
    dateEn: "December 8, 2021",
    rating: 5,
    text: "Оооочень рекомендую Дмитрий Тарусин в Морозовской! Оооочень. Он супер врач и человечище.",
    textEn: "I highly, HIGHLY recommend Dmitry Tarusin at Morozovskaya! He is a super doctor and an amazing person.",
    source: "Яндекс"
  },
  {
    name: "Екатерина",
    nameEn: "Ekaterina",
    date: "31 января 2022",
    dateEn: "January 31, 2022",
    rating: 4,
    text: "Морозовская больница, Тарусин Дмитрий Игоревич. Профессор, доктор медицинских наук.",
    textEn: "Morozovskaya Hospital, Tarusin Dmitry Igorevich. Professor, Doctor of Medical Sciences.",
    source: "Яндекс"
  },
  {
    name: "Ася",
    nameEn: "Asya",
    date: "20 сентября 2022",
    dateEn: "September 20, 2022",
    rating: 5,
    text: "Отличный уролог, что ещё можно сказать, один из лучших.",
    textEn: "Excellent urologist, what else can I say — one of the best.",
    source: "Яндекс"
  },
  {
    name: "Тата Мисягина",
    nameEn: "Tata Misyagina",
    date: "11 февраля 2024",
    dateEn: "February 11, 2024",
    rating: 5,
    text: "Благодарю Дмитрия Игоревича за здоровье моих сыновей!",
    textEn: "I thank Dmitry Igorevich for the health of my sons!",
    source: "Яндекс"
  },
  {
    name: "Игорь Колос",
    nameEn: "Igor Kolos",
    date: "15 декабря 2024",
    dateEn: "December 15, 2024",
    rating: 5,
    text: "Дмитрий Игоревич — лучший, очень рекомендую!",
    textEn: "Dmitry Igorevich is the best, highly recommend!",
    source: "Яндекс"
  },
  {
    name: "Екатерина",
    nameEn: "Ekaterina",
    date: "23 сентября 2021",
    dateEn: "September 23, 2021",
    rating: 5,
    text: "Дмитрию очень доверяю. Хороший врач и человек.",
    textEn: "I trust Dmitry completely. A good doctor and a good person.",
    source: "Яндекс"
  },
  {
    name: "Inna A.",
    date: "20 мая 2024",
    dateEn: "May 20, 2024",
    rating: 5,
    text: "Рекомендую доктора Тарусина.",
    textEn: "I recommend Dr. Tarusin.",
    source: "Яндекс"
  },
  {
    name: "Сергей",
    nameEn: "Sergey",
    date: "28 декабря 2025",
    dateEn: "December 28, 2025",
    rating: 5,
    text: "Дмитрий Игоревич блестящий врач и человек. Огромное вам спасибо за ваш труд.",
    textEn: "Dmitry Igorevich is a brilliant doctor and person. Thank you so much for your work.",
    source: "Яндекс"
  },
  {
    name: "Михаил Литвиненко",
    nameEn: "Mikhail Litvinenko",
    date: "18 декабря 2025",
    dateEn: "December 18, 2025",
    rating: 5,
    text: "Дмитрий Тарусин — гениальный врач. Дмитрий мне говорил, что любит больше работать с детьми. Не так все запутано как у взрослых. Но я взрослый мужик, и Дмитрий до эры ИИ собрал схему лечения уровня доктора Хауса и Шерлока Холмса в медицине. Мне сейчас страшно представить какой уровень диагностики и лечения когда у него доступ ко всем большим языковым моделям. Однозначно рекомендую, особенно если у вас сложный случай. Врач красавчик!!",
    textEn: "Dmitry Tarusin is a genius doctor. He told me he prefers working with children — things aren't as complicated as with adults. But I'm an adult man, and even before the AI era, Dmitry assembled a treatment plan at the level of Dr. House and Sherlock Holmes in medicine. I can't even imagine the level of diagnostics and treatment he achieves now with access to all large language models. Absolutely recommend, especially for complex cases. The doctor is amazing!",
    source: "Яндекс"
  },
  {
    name: "Anna F-K",
    date: "15 октября 2025",
    dateEn: "October 15, 2025",
    rating: 5,
    text: "Уникальный специалист, высокого уровня и профессионал своего дела, деликатный и четкий. Очень приятный в общении. Нам прям повезло попасть именно к нему.",
    textEn: "A unique specialist, high-level professional — delicate and precise. Very pleasant to communicate with. We were truly fortunate to find him.",
    source: "Яндекс"
  },
  {
    name: "Ася М.",
    nameEn: "Asya M.",
    date: "1 августа 2025",
    dateEn: "August 1, 2025",
    rating: 5,
    text: "Тарусин Дмитрий Игоревич просто доктор от Бога, Профессор, самый лучший в сфере андрологии урологии! Моего сына и оперировал и наблюдал долгие годы, это доктор которому можно доверять на 100%!",
    textEn: "Tarusin Dmitry Igorevich is simply a God-given doctor, a Professor, the best in andrology and urology! He both operated on and monitored my son for many years — a doctor you can trust 100%!",
    source: "Яндекс"
  },
  {
    name: "Елена Яффе",
    nameEn: "Elena Yaffe",
    date: "23 июля 2025",
    dateEn: "July 23, 2025",
    rating: 5,
    text: "Отличная клиника! С момента консультации до операции (варикоцеле) прошла неделя! Доктор Тарусин Д.И., проводивший консультацию и операцию, — это не просто Доктор с большой буквы! Это гений медицины! Все прошло прекрасно и во время операции и в послеоперационный период! Огромная благодарность доктору Тарусину и всем сотрудникам клиники, внимательным и отзывчивым!",
    textEn: "Excellent clinic! From consultation to surgery (varicocele) was just one week! Dr. Tarusin, who performed both the consultation and surgery, is not just a Doctor with a capital D — he is a genius of medicine! Everything went perfectly, both during surgery and recovery! Enormous gratitude to Dr. Tarusin and all the clinic staff — attentive and responsive!",
    source: "Яндекс"
  },
  {
    name: "Алексей С.",
    nameEn: "Alexey S.",
    date: "20 июля 2025",
    dateEn: "July 20, 2025",
    rating: 5,
    text: "Хочу сказать огромное спасибо Тарусину Дмитрию Игоревичу и команде клиники доктора Матара. При планировании беременности выявили варикоцеле, оперативно провели подготовку и сделали операцию.",
    textEn: "I want to thank Tarusin Dmitry Igorevich and the team at Dr. Matara's clinic enormously. During pregnancy planning, varicocele was discovered; they promptly prepared and performed the surgery.",
    source: "Яндекс"
  },
  {
    name: "Ольга Щупак",
    nameEn: "Olga Shchupak",
    date: "16 июля 2025",
    dateEn: "July 16, 2025",
    rating: 5,
    text: "Дмитрий Игоревич — самый лучший детский уролог в Москве. Мы сделали у него уже несколько операций и все прошли супер гладко и главное — успешно! Очень внимательный к детям и детям в ним легко!",
    textEn: "Dmitry Igorevich is the best pediatric urologist in Moscow. We've had several surgeries with him and all went super smoothly and, most importantly, successfully! Very attentive to children, and kids feel comfortable with him!",
    source: "Яндекс"
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "2 июля 2025",
    dateEn: "July 2, 2025",
    rating: 5,
    text: "Тарусин Дмитрий Игоревич врач экстра класса! Консультирует неторопливо, сам делает УЗИ, назначает только необходимые анализы. Сыну провёл операцию с ювелирной точностью, с минимальным разрезом снаружи и максимально атравматично внутри мошонки (маленький синячок был). Сыну не потребовалось ни одной таблетки обезболивающего. Димитрий Игоревич талантливый хирург с огромным опытом!!! Человек, с горящими от работы весёлыми глазами!!!",
    textEn: "Tarusin Dmitry Igorevich is a world-class doctor! He consults unhurriedly, performs ultrasound himself, prescribes only necessary tests. He performed surgery on my son with jeweler's precision — minimal external incision and maximum atraumatic approach inside the scrotum (just a tiny bruise). My son didn't need a single pain pill. Dmitry Igorevich is a talented surgeon with vast experience! A person with cheerful, work-passionate eyes!",
    source: "Яндекс"
  },
  {
    name: "Елена Г.",
    nameEn: "Elena G.",
    date: "27 июня 2025",
    dateEn: "June 27, 2025",
    rating: 5,
    text: "Очень хороший, высококлассный врач! Профессионал своего дела! Рады, что попали на прием именно к нему! Сыну 8 лет, диагноз вторичный крипторхизм. Оперировались в апреле. К Дмитрию Игоревичу мы попали от другого практикующего хирурга, который настоятельно рекомендовал оперировать ребенка именно у Тарусина Д.И., что само по себе уже показательно. Такой качественной и безболезненной для ребенка диагностики не смог провести ни один из специалистов. Операция проведена, успешно. Ребенок здоров. Швы очень аккуратные, косметические. Все счастливы))) Дмитрию Игоревичу огромное СПАСИБО!!! Успехов Вам во всём!",
    textEn: "A very good, top-class doctor! A true professional! We're glad we ended up with him! Our son is 8, diagnosed with secondary cryptorchidism. Surgery was in April. We were referred by another practicing surgeon who strongly recommended Dr. Tarusin — which itself speaks volumes. No other specialist could perform such high-quality, painless diagnostics for the child. Surgery was successful. The child is healthy. Sutures are very neat, cosmetic. Everyone is happy! Enormous THANK YOU to Dmitry Igorevich!",
    source: "Яндекс"
  },
  {
    name: "Жанна Брылева",
    nameEn: "Zhanna Bryleva",
    date: "13 апреля 2025",
    dateEn: "April 13, 2025",
    rating: 5,
    text: "Отличный врач, тщательно и внимательно осмотрел ребенка. Получили ответы на все вопросы.",
    textEn: "Excellent doctor, thoroughly and attentively examined the child. We got answers to all our questions.",
    source: "Яндекс"
  },
  {
    name: "Юлия Васева",
    nameEn: "Yulia Vaseva",
    date: "18 марта 2025",
    dateEn: "March 18, 2025",
    rating: 5,
    text: "Умняшка, опытнай😊 знает что делает. Свои методики и разработки.",
    textEn: "Smart, experienced 😊 knows what he's doing. Has his own techniques and developments.",
    source: "Яндекс"
  },
  {
    name: "Ольга П.",
    nameEn: "Olga P.",
    date: "17 марта 2025",
    dateEn: "March 17, 2025",
    rating: 5,
    text: "Отличная компактная уютная клиника, где есть все необходимое, а главное, где можно быть уверенным в уровне врачей, которым доверяешь здоровье своего ребёнка. С сыном-подростком попали сюда в новогодние праздники, когда в Москве нужного специалиста было найти вообще невозможно. В клинике Матара — отзывчивый персонал и высочайшего класса врачи (наш теперь уже самый любимый доктор детский уролог-андролог Тарусин Дмитрий Игоревич!). Прошел месяц с момента операции и мой сын теперь здоров, починен самым лучшим образом. Ювелирная работа, малюсенький незаметный шов. Из впечатлений дня операции — очень крутой анестезиолог, очень добрые медсестры, и сам доктор Тарусин часто заходил проведать, как отходит сын от наркоза.",
    textEn: "An excellent, compact, cozy clinic with everything needed, and most importantly, where you can be confident in the level of doctors you trust with your child's health. We came here with our teenage son during the New Year holidays when finding the right specialist in Moscow was impossible. Dr. Matara's clinic has responsive staff and top-class doctors (our now favorite doctor — pediatric urologist-andrologist Tarusin Dmitry Igorevich!). A month after surgery, my son is healthy, repaired in the best way possible. Jeweler's work, a tiny invisible suture. Impressions from surgery day — an amazing anesthesiologist, very kind nurses, and Dr. Tarusin himself frequently checked on how my son was recovering from anesthesia.",
    source: "Яндекс"
  },
  {
    name: "Andrewka",
    date: "21 февраля 2025",
    dateEn: "February 21, 2025",
    rating: 5,
    text: "Лучшая клиника андрологии в Москве! Врачи добрые, видно, что профессионалы своего дела! Особенное спасибо Тарусину Дмитрию Игоревичу!",
    textEn: "The best andrology clinic in Moscow! Doctors are kind and clearly professionals! Special thanks to Tarusin Dmitry Igorevich!",
    source: "Яндекс"
  },
  {
    name: "Вильдан Вегерио",
    nameEn: "Vildan Vegerio",
    date: "2 февраля 2025",
    dateEn: "February 2, 2025",
    rating: 5,
    text: "Я хочу выразить огромную благодарность Дмитрию Игоревичу. Он — настоящий профессионал и очень чуткий человек. Дмитрий Игоревич — врач по призванию, который сразу определил верный диагноз. Настоятельно рекомендую его всем.",
    textEn: "I want to express enormous gratitude to Dmitry Igorevich. He is a true professional and a very sensitive person. Dmitry Igorevich is a doctor by calling who immediately determined the correct diagnosis. I strongly recommend him to everyone.",
    source: "Яндекс"
  },
  {
    name: "Мурад Дрисси-Раххали",
    nameEn: "Murad Drissi-Rakhali",
    date: "11 декабря 2024",
    dateEn: "December 11, 2024",
    rating: 5,
    text: "Оперировали ребенка 14 лет по поводу варикоцеле, по рекомендации попали к доктору Тарусину Дмитрию Игоревичу. Прекрасный специалист, мастер своего дела! Операция прошла отлично.",
    textEn: "Had surgery for our 14-year-old for varicocele; we came to Dr. Tarusin on recommendation. An excellent specialist, a master of his craft! The surgery went perfectly.",
    source: "Яндекс"
  },
  {
    name: "Марина Сторублевцева",
    nameEn: "Marina Storublevtseva",
    date: "3 декабря 2024",
    dateEn: "December 3, 2024",
    rating: 5,
    text: "Тарусин Дмитрий Игоревич чудесный весёлый доктор, легко находит подход даже к самым стеснительным детям))) а мамам очень понятно и подробно объясняет алгоритм действий в нашей ситуации. Очень рада, что нашла вас!",
    textEn: "Tarusin Dmitry Igorevich is a wonderful, cheerful doctor who easily connects even with the shyest children! And he explains the action plan to mothers very clearly and in detail. So glad I found you!",
    source: "Яндекс"
  },
  {
    name: "Auto777",
    date: "6 ноября 2024",
    dateEn: "November 6, 2024",
    rating: 5,
    text: "Здравствуйте! Сегодня были на приеме у профессора Тарусина Дмитрия Игоревича, такого чуткого и внимательного отношения давно не встречали. Настоящий специалист! И просто человек с большим сердцем!",
    textEn: "Hello! Today we had an appointment with Professor Tarusin Dmitry Igorevich — we haven't experienced such sensitive and attentive treatment in a long time. A true specialist! And simply a person with a big heart!",
    source: "Яндекс"
  },
  {
    name: "Александр Виноградов",
    nameEn: "Alexander Vinogradov",
    date: "4 сентября 2024",
    dateEn: "September 4, 2024",
    rating: 5,
    text: "Один из самых крутых спецов по детской андрологии в России! Легкое общее и с родителями, и с ребенком любого возраста. Знаю, потому что не только сам обращался, но рекомендовал многим — все довольны.",
    textEn: "One of the coolest specialists in pediatric andrology in Russia! Easy communication with both parents and children of any age. I know because I not only visited myself but recommended him to many — everyone is satisfied.",
    source: "Яндекс"
  },
  {
    name: "gooddayrvv",
    date: "19 декабря 2023",
    dateEn: "December 19, 2023",
    rating: 5,
    text: "Хочу оставить благодарность всему персоналу клиники доктора Матара — обращались к доктору Матару А.А. и к Тарусину Д.И. не единожды — всегда всё по существу, внимательно, профессионально, отзывчиво.",
    textEn: "I want to thank the entire staff of Dr. Matara's clinic — we've visited Dr. Matara and Dr. Tarusin multiple times — always to the point, attentive, professional, and responsive.",
    source: "Яндекс"
  },
  {
    name: "Михаил Ершов",
    nameEn: "Mikhail Ershov",
    date: "9 сентября 2024",
    dateEn: "September 9, 2024",
    rating: 5,
    text: "Врач уролог-андролог Тарусин Дмитрий Игоревич огромный специалист своего дела. Легко находит контакт с детьми и молодежью, а так же всегда подходит к лечению с большим энтузиазмом.",
    textEn: "Urologist-andrologist Tarusin Dmitry Igorevich is a tremendous specialist. He easily connects with children and young people, and always approaches treatment with great enthusiasm.",
    source: "Яндекс"
  },
  {
    name: "Света Магомедова",
    nameEn: "Sveta Magomedova",
    date: "15 апреля 2022",
    dateEn: "April 15, 2022",
    rating: 5,
    text: "Это самая замечательная клиника которая есть в городе Москва, там самые лучшие врачи а у нас была операция нас оперировал профессор Тарусин ему огромнейшее благодарность, также благодарность Середницкой Надежде Александровне и Тарасюк Нине Михайловне очень приятная обстановка быстро ребёнок вышел от наркоза быстро нас прооперировали и все слава богу хорошо всем советую эту клинику клинику доктора Матара.",
    textEn: "This is the most wonderful clinic in Moscow with the best doctors. We had surgery performed by Professor Tarusin — enormous gratitude to him, as well as to Serednitskaya and Tarasyuk. Very pleasant atmosphere, the child recovered from anesthesia quickly, the surgery was done quickly, and thank God everything went well. I recommend this clinic to everyone — Dr. Matara's clinic.",
    source: "Яндекс"
  },
  {
    name: "Антон Р.",
    nameEn: "Anton R.",
    date: "6 марта 2020",
    dateEn: "March 6, 2020",
    rating: 5,
    text: "Был здесь с сыном, делали операцию у Дмитрия Игоревича Тарусина. Очень понравилась чёткая организация на всех этапах, доброжелательное отношение персонала, профессионализм. Комфортные условия.",
    textEn: "Was here with my son, had surgery with Dmitry Igorevich Tarusin. Really liked the clear organization at every stage, the friendly staff attitude, and professionalism. Comfortable conditions.",
    source: "Яндекс"
  },
  {
    name: "Сергей Забиралов",
    nameEn: "Sergey Zabiralov",
    date: "25 июля 2024",
    dateEn: "July 25, 2024",
    rating: 5,
    text: "В марте 2024 г сделали ребенку операцию по поводу двухстороннего гидроцеле. Долго думали, но решились. Всё прошло хорошо. Спасибо Дмитрию Игоревичу. Перед операцией тоже большая подготовка была. Показывали результаты УЗИ в своем городе, которое Дмитрий Игоревич делал. Врачи сфоткали, чтобы знать для себя насколько подробным может быть УЗИ))) Также методика, применяемая Дмитрием Игоревичем сохраняет мышцу подъема и опускания для предотвращения перегрева органа.",
    textEn: "In March 2024, our child had surgery for bilateral hydrocele. We thought about it for a long time but decided to go ahead. Everything went well. Thank you, Dmitry Igorevich. There was extensive preparation before surgery too. We showed the ultrasound results from our city, done by Dmitry Igorevich — local doctors photographed them to see how detailed an ultrasound can be! Also, the technique used by Dmitry Igorevich preserves the cremaster muscle to prevent organ overheating.",
    source: "Яндекс"
  },
  {
    name: "Олег П.",
    nameEn: "Oleg P.",
    date: "10 мая 2024",
    dateEn: "May 10, 2024",
    rating: 5,
    text: "Огромная благодарность профессору Тарусину Дмитрию Игоревичу! Светлая голова, золотые руки! Так же огромная благодарность всей его команде. СПАСИБО!",
    textEn: "Enormous gratitude to Professor Tarusin Dmitry Igorevich! A brilliant mind, golden hands! Also huge thanks to his entire team. THANK YOU!",
    source: "Яндекс"
  },
  {
    name: "Андрей",
    nameEn: "Andrey",
    date: "24 марта 2023",
    dateEn: "March 24, 2023",
    rating: 5,
    text: "Делали операцию здесь ребенку по урологии. Врачи супер, отдельное спасибо профессору Д.И.Тарусину. Прошло удачно, через год повторный прием, все в норме.",
    textEn: "Had urology surgery for our child here. Doctors are superb, special thanks to Professor Tarusin. It went successfully; a year later at the follow-up, everything is normal.",
    source: "Яндекс"
  },
  {
    name: "Валентина",
    nameEn: "Valentina",
    date: "30 января 2024",
    dateEn: "January 30, 2024",
    rating: 5,
    text: "Сразу скажу, что лично не общалась. На приеме, а в дальнейшем и на операции был внук в сопровождении мамы и по совместительству моей дочерью. Остались только восторженные впечатления о докторе.",
    textEn: "I'll say right away that I didn't communicate personally. My grandson was at the appointment and later the surgery, accompanied by his mother (my daughter). Only enthusiastic impressions about the doctor remained.",
    source: "Яндекс"
  },
  {
    name: "Галина",
    nameEn: "Galina",
    date: "23 января 2022",
    dateEn: "January 23, 2022",
    rating: 5,
    text: "Работает прекрасный детский андролог-уролог. Профессор Тарусин. Очень редкий компетентный врач, замечательный человек. Благодарю Бога, что попали с сыном к нему.",
    textEn: "There works a wonderful pediatric andrologist-urologist — Professor Tarusin. A very rare competent doctor, a wonderful person. I thank God we got to see him with our son.",
    source: "Яндекс"
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "9 июня 2023",
    dateEn: "June 9, 2023",
    rating: 5,
    text: "Бесспорно наблюдалась и будем наблюдаться только у него. Очень внимательный, отзывчивый. Ну и, конечно, он один из лучших урологов-андрологов.",
    textEn: "Without a doubt, we've been and will continue to be observed only by him. Very attentive, responsive. And of course, he's one of the best urologists-andrologists.",
    source: "Яндекс"
  },
  {
    name: "Александр Баженов",
    nameEn: "Alexander Bazhenov",
    date: "12 июля 2024",
    dateEn: "July 12, 2024",
    rating: 5,
    text: "Безгранично благодарна профессору Тарусину Дмитрию Игоревичу! Пару лет назад попала с сыном к нему на консультацию. Тщательный осмотр, доброжелательное отношение сгладили страх перед операцией. Отмечу прекрасную работу анестезиолога! Спасибо! Да и персонал Клиники в целом очень отзывчивый! Сегодняшний визит к профессору подтвердил его профессионализм. Да что там говорить, у Дмитрия Игоревича золотые руки!!!!!! И кроме этого, несмотря на тяжелую и ответственную работу, всегда жизнерадостный, что, безусловно, заряжает уверенностью, что все будет хорошо! Низкий поклон.",
    textEn: "Boundlessly grateful to Professor Tarusin! A couple of years ago we came for a consultation with our son. Thorough examination and friendly attitude eased the fear of surgery. The anesthesiologist's work was excellent! The clinic staff is very responsive! Today's visit confirmed his professionalism. What can I say — Dmitry Igorevich has golden hands! Despite the demanding, responsible work, he's always cheerful, which inspires confidence that everything will be fine! Deep bow.",
    source: "Яндекс"
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "30 августа 2021",
    dateEn: "August 30, 2021",
    rating: 5,
    text: "Врач произвёл на нас впечатление! Так хорошо изучил историю болезни, вник во все детали, назначил дополнительные обследования! После приема мы почувствовали что есть шанс вылечить наше заболевание. Врач от Бога, это про Него! Спасибо.",
    textEn: "The doctor made a great impression! He studied the medical history so thoroughly, delved into every detail, ordered additional examinations! After the appointment, we felt there was a chance to cure our condition. A God-given doctor — that's about Him! Thank you.",
    source: "Яндекс"
  },
  // Отзывы с ПроДокторов
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "Декабрь 2025",
    dateEn: "December 2025",
    rating: 5,
    text: "Профессор Дмитрий Игоревич — очень внимательный, добрый и отзывчивый человек. Профессионал своего дела. Вылечил моего сына после перекрута яичек. Наблюдается у него. Здоровья Вам и Вашим близким, дорогой профессор!",
    textEn: "Professor Dmitry Igorevich is a very attentive, kind, and responsive person. A true professional. He cured my son after testicular torsion. We continue follow-ups with him. Wishing you and your family health, dear professor!",
    source: "ПроДокторов"
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "Октябрь 2025",
    dateEn: "October 2025",
    rating: 5,
    text: "К Тарусину Дмитрию Игоревичу впервые попали на прием по рекомендации врача, который наблюдал нашего сына 3 года (варикоцеле). На приеме произвел осмотр, УЗИ, подробно все рассказал и объяснил. После консультации не осталось сомнений по поводу операции. Через 2 недели сына прооперировали. Спустя год слышим заветные слова — здоров! Спасибо за Ваш профессионализм!",
    textEn: "We first visited Dr. Tarusin on a recommendation from a doctor who had been monitoring our son for 3 years (varicocele). During the appointment, he examined, performed ultrasound, and explained everything in detail. After the consultation, there were no doubts about surgery. Two weeks later, our son was operated on. A year later, we heard the cherished words — healthy! Thank you for your professionalism!",
    source: "ПроДокторов"
  },
  {
    name: "Медработник",
    nameEn: "Healthcare worker",
    date: "Октябрь 2025",
    dateEn: "October 2025",
    rating: 5,
    text: "Уролог папы порекомендовал Дмитрия Игоревича. Сказал, что лучше специалиста по детской урологии не найти! Я сама медработник и сразу поняла, что нам повезло! Специалисты такого уровня с деликатным и грамотным подходом сейчас на вес золота. Дмитрий Игоревич сделал сыну УЗИ с пристрастием, такого подробного объяснения я не видела!",
    textEn: "My husband's urologist recommended Dmitry Igorevich. He said there's no better pediatric urology specialist! Being a healthcare worker myself, I immediately understood how lucky we were! Specialists of this level with a delicate and competent approach are worth their weight in gold. Dmitry Igorevich performed a thorough ultrasound on our son — I've never seen such a detailed explanation!",
    source: "ПроДокторов"
  },
  {
    name: "Мама подростка",
    nameEn: "Mother of a teenager",
    date: "Июль 2025",
    dateEn: "July 2025",
    rating: 5,
    text: "Были на приёме с сыном 13-ти лет, диагноз «гипоплазия яичка». Дмитрий Игоревич тщательно изучил анализы, сам провёл УЗИ и предложил операцию. Операцию сделал с ювелирной точностью, через малюсенький разрез и с минимальной травматичностью. Дмитрий Игоревич — виртуоз Москвы, восстановил эстетику и улучшил функцию моему сыну. Можно смело доверить ему ребёнка.",
    textEn: "We visited with our 13-year-old son, diagnosed with testicular hypoplasia. Dmitry Igorevich thoroughly studied the tests, performed ultrasound himself, and suggested surgery. He performed the surgery with jeweler's precision through a tiny incision with minimal trauma. Dmitry Igorevich is Moscow's virtuoso — he restored aesthetics and improved function for my son. You can safely entrust your child to him.",
    source: "ПроДокторов"
  },
  {
    name: "Мама",
    nameEn: "Mother",
    date: "Март 2025",
    dateEn: "March 2025",
    rating: 5,
    text: "В новогодние праздники два коллеги из разных благотворительных фондов посоветовали Тарусина Дмитрия Игоревича со словами «только к нему». Оказался и врачом, и человеком совершенно изумительным. Объяснил и сыну отдельно, и мне, даже с рисованием картинки-схемы. Профессор — светило в области детской урологии-андрологии, он создавал отделение урологии и андрологии в Морозовской больнице. Потрясающе умеет общаться с ребенком!",
    textEn: "During the New Year holidays, two colleagues from different charities recommended Tarusin with the words 'go only to him.' He turned out to be an absolutely amazing doctor and person. He explained everything to my son separately and to me, even drawing diagrams. The Professor is a luminary in pediatric urology-andrology — he created the urology and andrology department at Morozovskaya Hospital. He's amazing at communicating with children!",
    source: "ПроДокторов"
  },
  {
    name: "Папа",
    nameEn: "Father",
    date: "Февраль 2025",
    dateEn: "February 2025",
    rating: 5,
    text: "Я обратился к Дмитрию Игоревичу с сыном. Врач сразу смог найти подход к ребёнку и расположить его к себе. Уже на первом приёме он поставил диагноз и через неделю провёл операцию. Всё прошло хорошо. Дмитрий Игоревич — врач по призванию. Если вы не хотите тратить время на походы по больницам, рекомендую обратиться к нему.",
    textEn: "I visited Dmitry Igorevich with my son. The doctor immediately found an approach to the child and put him at ease. At the very first appointment, he made a diagnosis and performed surgery a week later. Everything went well. Dmitry Igorevich is a doctor by calling. If you don't want to waste time going from hospital to hospital, I recommend contacting him.",
    source: "ПроДокторов"
  },
  {
    name: "Мама из Бузулука",
    nameEn: "Mother from Buzuluk",
    date: "Январь 2025",
    dateEn: "January 2025",
    rating: 5,
    text: "Тарусин Дмитрий Игоревич — врач от Бога! Только он обнаружил, что у нас слева не опустилось яичко. Наши врачи не видели данной проблемы. Провели операцию по низведению и фиксации яичка в мошонку. После того как сын пришел в себя, доктор зашел, объяснил доступным языком, показал медиафайл. Дмитрий Игоревич — врач с большой буквы. Вы самый крутой доктор в мире!",
    textEn: "Tarusin Dmitry Igorevich is a God-given doctor! Only he discovered that our left testicle hadn't descended. Our local doctors didn't see the problem. He performed surgery to bring down and fix the testicle in the scrotum. After our son came to, the doctor came in, explained everything in simple language, and showed a media file. Dmitry Igorevich is a Doctor with a capital D. You're the coolest doctor in the world!",
    source: "ПроДокторов"
  },
  {
    name: "Мама из Гагарина",
    nameEn: "Mother from Gagarin",
    date: "Декабрь 2024",
    dateEn: "December 2024",
    rating: 5,
    text: "У сына с рождения не было опущено одно яичко. Наши местные врачи ничего не находили. Знакомые посоветовали обратиться к Тарусину Дмитрию Игоревичу. Это доктор со всех больших букв! В 2022 году провёл сложнейшую операцию, дал рекомендации. Теперь мой ребёнок абсолютно здоров! Отношение в клинике к пациентам, как к родным людям. Дмитрий Игоревич, Вы самый крутой!",
    textEn: "Our son had an undescended testicle from birth. Local doctors found nothing. Friends recommended Dr. Tarusin. He is a Doctor in every sense! In 2022, he performed a very complex surgery and gave recommendations. Now my child is completely healthy! The clinic treats patients like family. Dmitry Igorevich, you're the coolest!",
    source: "ПроДокторов"
  },
  {
    name: "Мама",
    nameEn: "Mother",
    date: "Июнь 2024",
    dateEn: "June 2024",
    rating: 5,
    text: "В районной поликлинике заподозрили варикоз, но УЗИ не подтвердило диагноз. Доктор Тарусин диагностировал варикоцеле. Подробно объяснили, как будет проведена операция. Прооперирован срочно. Через час после операции сын поел. Тошноты не было. Наркоз идеальный! Полное восстановление через месяц. Не болело оперированное место ни разу. Спасибо за профессионализм!",
    textEn: "The local clinic suspected varicose veins, but ultrasound didn't confirm it. Dr. Tarusin diagnosed varicocele. They explained in detail how the surgery would be performed. Surgery was done urgently. An hour after surgery, our son ate. No nausea. Perfect anesthesia! Full recovery in a month. The surgical site never hurt even once. Thank you for your professionalism!",
    source: "ПроДокторов"
  },
  {
    name: "Мама",
    nameEn: "Mother",
    date: "Декабрь 2023",
    dateEn: "December 2023",
    rating: 5,
    text: "Год назад Дмитрий Игоревич провел потрясающую операцию моему сыну. В 10 лет был запущенный рубцовый фимоз. Консультацию провел подробно, в основном разговаривал с сыном. Ребенок доверился сразу. Далее он несколько раз заходил в палату, интересовался самочувствием. Послеоперационный период прошел без осложнений. Сын вспоминает доброго доктора. Превосходный доктор с золотыми руками и сердцем.",
    textEn: "A year ago, Dmitry Igorevich performed an amazing surgery on my son. At 10 years old, he had advanced cicatricial phimosis. The consultation was thorough — he mainly spoke with my son. The child trusted him immediately. He came to check on us in the ward several times. Recovery was complication-free. My son remembers the kind doctor. An outstanding doctor with golden hands and heart.",
    source: "ПроДокторов"
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "Декабрь 2023",
    dateEn: "December 2023",
    rating: 5,
    text: "Визит к Тарусину Дмитрию Игоревичу мне понравился, специалист высокого уровня! Он поставил диагноз в нужном направлении, чего другие врачи не смогли сделать. Свои выводы делал на основании осмотра, дополнительных исследований и опроса. Он работал со мной более часа. Я получил комплексную услугу.",
    textEn: "I enjoyed my visit to Dr. Tarusin — a high-level specialist! He made the right diagnosis, which other doctors couldn't. He based his conclusions on examination, additional tests, and interview. He worked with me for over an hour. I received comprehensive service.",
    source: "ПроДокторов"
  },
  {
    name: "Многодетный отец",
    nameEn: "Father of many children",
    date: "Ноябрь 2023",
    dateEn: "November 2023",
    rating: 5,
    text: "Рекомендации друзей из врачебной среды привели к Дмитрию Игоревичу. Как многодетный отец, я имел опыт работы с разными детскими врачами, но доктор Тарусин превысил все мои ожидания. Более внимательного, интеллигентного и доброго детского хирурга мы не встречали. Настоящий профессор с академическими знаниями и огромной практикой. Микрохирургическая операция Мармара прошла успешно. Благодарность всей хирургической бригаде!",
    textEn: "Recommendations from friends in the medical field led us to Dmitry Igorevich. As a father of many children, I've dealt with various pediatric doctors, but Dr. Tarusin exceeded all expectations. We've never met a more attentive, intelligent, and kind pediatric surgeon. A true professor with academic knowledge and vast practice. The microsurgical Marmar operation was successful. Gratitude to the entire surgical team!",
    source: "ПроДокторов"
  },
  {
    name: "Мама",
    nameEn: "Mother",
    date: "Июль 2023",
    dateEn: "July 2023",
    rating: 5,
    text: "С Дмитрием Игоревичем мы знакомы с сыном с 2004 года, когда попали с диагнозом «крипторхизм». Провел блестящую консультацию. Мы полностью доверились доктору, который не только отличный специалист, но и приятный человек с чувством юмора. В 2021 году возник диагноз «варикоцеле». И снова блестяще проведенная операция. Вердикт: «полностью здоров». Выражаем бесконечную благодарность профессору Тарусину!",
    textEn: "My son and I have known Dmitry Igorevich since 2004, when we came with a cryptorchidism diagnosis. He gave a brilliant consultation. We fully trusted the doctor, who is not only an excellent specialist but a pleasant person with humor. In 2021, varicocele was diagnosed. Another brilliantly performed surgery. Verdict: 'completely healthy.' We express endless gratitude to Professor Tarusin!",
    source: "ПроДокторов"
  },
  {
    name: "Мама 15-летнего сына",
    nameEn: "Mother of a 15-year-old son",
    date: "Март 2023",
    dateEn: "March 2023",
    rating: 5,
    text: "К чудо-доктору обратились по совету другого врача: «Ищите Тарусина Дмитрия Игоревича». После двух операций в разных клиниках проблема не ушла. Дмитрий Игоревич после тщательного УЗИ предложил операцию и прооперировал сам. Прошло 7 месяцев, рецидива нет! В Москве работает настоящий профессионал своего дела, невероятно чуткий и внимательный, профессор Тарусин!",
    textEn: "We found this miracle doctor on another doctor's advice: 'Look for Tarusin Dmitry Igorevich.' After two surgeries at different clinics, the problem persisted. After a thorough ultrasound, Dmitry Igorevich suggested surgery and performed it himself. Seven months have passed — no recurrence! In Moscow works a true professional, incredibly sensitive and attentive — Professor Tarusin!",
    source: "ПроДокторов"
  },
  {
    name: "Мама из Орска",
    nameEn: "Mother from Orsk",
    date: "Январь 2023",
    dateEn: "January 2023",
    rating: 5,
    text: "Наша история началась в 2010 году! Моему сыну сделали операцию, но через год грыжа появилась снова. Потом выяснилось, что у ребенка нет одного яичка! Нас отправили к профессору Тарусину. Мы наблюдались 7 лет у профессора. И вот произошло чудо — Доктор сделал долгожданную операцию! Он спас от онкологии. Наша история длилась 13 лет! Счастливый конец. Волшебником нашей истории является Дмитрий Игоревич!",
    textEn: "Our story began in 2010! My son had surgery, but a year later the hernia returned. Then it turned out the child was missing a testicle! We were sent to Professor Tarusin. We were monitored for 7 years. Then the miracle happened — the Doctor performed the long-awaited surgery! He saved us from cancer. Our story lasted 13 years! A happy ending. The wizard of our story is Dmitry Igorevich!",
    source: "ПроДокторов"
  },
  {
    name: "Мама",
    nameEn: "Mother",
    date: "Декабрь 2022",
    dateEn: "December 2022",
    rating: 5,
    text: "Мы обратились к Дмитрию Игоревичу, когда сыну (11 лет) поставили диагноз «крипторхизм». После консультации Тарусина все стало понятно: и план лечения, и с диагнозами разобрались. Врач лично делает УЗИ и диагностику. Легко находит контакт с детьми, что бывает непросто в деликатных вопросах с подростками. Дмитрий Игоревич провел операцию сыну, все прошло успешно!",
    textEn: "We came to Dmitry Igorevich when our son (11) was diagnosed with cryptorchidism. After Tarusin's consultation, everything became clear — treatment plan and diagnoses sorted out. The doctor personally performs ultrasound and diagnostics. He easily connects with children, which can be challenging with delicate issues involving teenagers. Dmitry Igorevich performed the surgery — everything went successfully!",
    source: "ПроДокторов"
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "Август 2019",
    dateEn: "August 2019",
    rating: 5,
    text: "Дмитрий Игоревич — великолепный профессионал, добрый и отзывчивый человек.",
    textEn: "Dmitry Igorevich is a magnificent professional, a kind and responsive person.",
    source: "ПроДокторов"
  },
  {
    name: "Мария К.",
    nameEn: "Maria K.",
    date: "Декабрь 2021",
    dateEn: "December 2021",
    rating: 5,
    text: "С 2015 года местные врачи не могли помочь. Тарусин разобрался сразу. Мы очень благодарны за профессионализм и внимательное отношение.",
    textEn: "Since 2015, local doctors couldn't help. Tarusin figured it out immediately. We are very grateful for his professionalism and attentive attitude.",
    source: "ПроДокторов"
  },
  {
    name: "Евгений К.",
    nameEn: "Evgeny K.",
    date: "Июль 2019",
    dateEn: "July 2019",
    rating: 5,
    text: "Вернулся после длинной операции, извинился перед очередью и принял всех. Невероятно. Такого отношения к пациентам я не встречал больше нигде.",
    textEn: "Returned after a long surgery, apologized to the waiting line, and saw every patient. Incredible. I've never encountered such attitude toward patients anywhere else.",
    source: "ПроДокторов"
  },
  {
    name: "Гость",
    nameEn: "Guest",
    date: "Апрель 2019",
    dateEn: "April 2019",
    rating: 5,
    text: "Сам принимает, сам делает УЗИ, сам читает гормоны. Таких в России не встречали. Профессор — уникальный специалист.",
    textEn: "He examines himself, performs ultrasound himself, reads hormones himself. We've never encountered such a doctor in Russia. The Professor is a unique specialist.",
    source: "ПроДокторов"
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "Июнь 2018",
    dateEn: "June 2018",
    rating: 5,
    text: "Консультация при беременности — отменил ненужные таблетки. Девочка родилась здоровой. Огромная благодарность доктору!",
    textEn: "Consultation during pregnancy — he canceled unnecessary medications. The girl was born healthy. Enormous gratitude to the doctor!",
    source: "ПроДокторов"
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "Май 2018",
    dateEn: "May 2018",
    rating: 5,
    text: "Умеет снять тревогу, поселить уверенность, что всё поправимо. Замечательный доктор.",
    textEn: "He knows how to relieve anxiety and instill confidence that everything can be fixed. A wonderful doctor.",
    source: "ПроДокторов"
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "Ноябрь 2017",
    dateEn: "November 2017",
    rating: 5,
    text: "Отличный специалист, отзывчивый и внимательный. Рекомендую всем.",
    textEn: "Excellent specialist, responsive and attentive. I recommend to everyone.",
    source: "ПроДокторов"
  },
  // DocDoc reviews
  {
    name: "Галина",
    nameEn: "Galina",
    date: "5 июля 2025",
    dateEn: "July 5, 2025",
    rating: 5,
    text: "Дмитрий Игоревич врач высочайшего уровня! Великолепно провёл осмотр моего сына, сам сделал УЗИ, всё понятно и подробно объяснил. Операцию сделал очень аккуратно. Обезболивающие после неё сын вообще не пил ни разу, ни синяков, ни отёков не было. У Дмитрия Игоревича всё выверено и отработано за годы его сложнейшей работы. Человек он весёлый, очень деликатный, любящий свою работу. Только к нему, он разберётся в любых, даже самых запутанных случаях.",
    textEn: "Dmitry Igorevich is a doctor of the highest level! He examined my son brilliantly, performed ultrasound himself, explained everything clearly and in detail. The surgery was done very neatly. My son never needed painkillers after it — no bruises, no swelling. Everything with Dmitry Igorevich is refined and perfected over years of complex work. He's a cheerful, very delicate person who loves his work. Go only to him — he'll figure out even the most complicated cases.",
    source: "DocDoc"
  },
  {
    name: "Вил",
    nameEn: "Vil",
    date: "2 февраля 2025",
    dateEn: "February 2, 2025",
    rating: 5,
    text: "В декабре обратились к врачу за консультацией, т.к. с марта месяца куда только не обращались — нам не могли помочь. Дмитрий Игоревич на первом приёме внимательно нас выслушал, сделал тщательное УЗИ, дал заключение на операцию. Через неделю была назначена дата. Утром приехали на операцию, вечером уже выписали. Хочу выразить огромную благодарность Дмитрию Игоревичу за его профессионализм и человечность. Всем смело его рекомендую как врача от бога и профессионала своего дела.",
    textEn: "In December, we consulted the doctor because since March we'd been everywhere — nobody could help. At the first appointment, Dmitry Igorevich listened attentively, performed a thorough ultrasound, and gave the conclusion for surgery. A week later, the date was set. We arrived in the morning for surgery and were discharged by evening. I want to express enormous gratitude to Dmitry Igorevich for his professionalism and humanity. I boldly recommend him to everyone as a God-given doctor and a professional.",
    source: "DocDoc"
  },
  {
    name: "Елена",
    nameEn: "Elena",
    date: "31 января 2025",
    dateEn: "January 31, 2025",
    rating: 5,
    text: "Тарусин Дмитрий Игоревич врач от Бога! Только он обнаружил, что у нас слева не опустилось яичко. Наши врачи не видели данной проблемы, говорили всё хорошо. 29.01.25г нам провели операцию по низведению и фиксации яичка в мошонку. После того как сын пришёл в себя, доктор зашёл в палату, объяснил доступным языком, как прошла операция, показал медиафайл. Дмитрий Игоревич — врач с большой буквы. Отношение в клинике к пациентам на высшем уровне.",
    textEn: "Tarusin Dmitry Igorevich is a God-given doctor! Only he discovered that our left testicle hadn't descended. Our doctors didn't see the problem, said everything was fine. On 01/29/2025, he performed surgery to bring down and fix the testicle. After our son came to, the doctor came to the ward, explained in simple language how the operation went, and showed a media file. Dmitry Igorevich is a Doctor with a capital D. The clinic's attitude toward patients is at the highest level.",
    source: "DocDoc"
  },
  {
    name: "Елена",
    nameEn: "Elena",
    date: "13 декабря 2023",
    dateEn: "December 13, 2023",
    rating: 5,
    text: "Год назад Дмитрий Игоревич провёл потрясающую операцию моему сыну. В 10 лет был запущенный рубцовый фимоз. Консультацию провёл подробно, в основном разговаривал с сыном, объясняя, как можно ему помочь. Ребёнок доверился сразу. В день операции доктор ещё раз объяснил всё. Несколько раз заходил в палату, интересовался самочувствием. Послеоперационный период прошёл без осложнений. Дмитрий Игоревич — превосходный доктор с золотыми руками и сердцем.",
    textEn: "A year ago, Dmitry Igorevich performed an amazing surgery on my son. At 10, he had advanced cicatricial phimosis. The consultation was thorough — he mainly talked to my son, explaining how he could help. The child trusted him immediately. On surgery day, the doctor explained everything again. He came to check on us in the ward multiple times. Recovery was complication-free. Dmitry Igorevich is an outstanding doctor with golden hands and heart.",
    source: "DocDoc"
  },
  {
    name: "Максим",
    nameEn: "Maxim",
    date: "27 июля 2023",
    dateEn: "July 27, 2023",
    rating: 5,
    text: "С Дмитрием Игоревичем мы знакомы с 2004 года, когда впервые попали с диагнозом крипторхизм. Провёл блестящую консультацию. Мы полностью доверились доктору, который не только отличный специалист, но и приятный человек с чувством юмора, вселяющий уверенность в результат. В 2021 году возник диагноз варикоцеле. И снова блестяще проведённая операция. Вердикт: «полностью здоров». Выражаем бесконечную благодарность профессору Тарусину Дмитрию Игоревичу!",
    textEn: "We've known Dmitry Igorevich since 2004, when we first came with a cryptorchidism diagnosis. He gave a brilliant consultation. We fully trusted the doctor, who is not only an excellent specialist but a pleasant person with humor, inspiring confidence in the outcome. In 2021, varicocele was diagnosed. Another brilliantly performed surgery. Verdict: 'completely healthy.' We express endless gratitude to Professor Tarusin!",
    source: "DocDoc"
  },
  // Doctu reviews
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "21 апреля 2023",
    dateEn: "April 21, 2023",
    rating: 5,
    text: "Мы были поражены врачом Тарусиным Дмитрием Игоревичем! Он тщательно изучил мою историю болезни, вник во все детали и назначил дополнительные обследования. После приёма мы почувствовали, что у нас есть шанс вылечить наше заболевание. Этот врач как посланник от Бога! Большое спасибо!",
    textEn: "We were astonished by Dr. Tarusin Dmitry Igorevich! He carefully studied my medical history, went into every detail and ordered additional examinations. After the appointment we felt that we finally had a chance to cure our condition. This doctor is like a messenger from God! Thank you so much!",
    source: "Докту"
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "14 декабря 2021",
    dateEn: "December 14, 2021",
    rating: 5,
    text: "СПАСИБО! СПАСИБО! и ещё раз СПАСИБО! Две операции в 2015 и 2016 году и не проходящая проблема. Полное отсутствие перспектив. И вот удача — Дмитрий Игоревич Тарусин. В результате: правильно поставленный диагноз, уникальный индивидуальный подход к ребёнку, блестящая операция и… счастливое будущее ребёнка! Низкий поклон!",
    textEn: "THANK YOU! THANK YOU! And THANK YOU again! Two surgeries in 2015 and 2016 and the problem still wouldn't go away. Total lack of perspective. And then a stroke of luck — Dmitry Igorevich Tarusin. The result: a correctly established diagnosis, a unique individual approach to the child, a brilliant surgery and… a happy future for the child! A low bow to you!",
    source: "Докту"
  },
  {
    name: "Дмитрий Сачков",
    nameEn: "Dmitry Sachkov",
    date: "27 января 2017",
    dateEn: "January 27, 2017",
    rating: 5,
    text: "Дмитрий Игоревич — чудесный человек и замечательный врач! Помог моему сыну без операции.",
    textEn: "Dmitry Igorevich is a wonderful person and an excellent doctor! He helped my son without surgery.",
    source: "Докту"
  },
  // Dr. Matara's clinic reviews
  {
    name: "Кристина",
    nameEn: "Kristina",
    date: "Сентябрь 2025",
    dateEn: "September 2025",
    rating: 5,
    text: "Благодарю профессора Асаада Ахмадовича Матара за оперативно качественное проведение операции по гипоспадии, за терпеливость и понимание. Мы всегда получали ответы на волнующие нас вопросы. Доктор был всегда на связи. Также очень поддерживала уролог-андролог Надежда Александровна Середницкая. В клинике царит домашняя и уютная атмосфера. Спасибо за то, что теперь у моего сына всё хорошо!",
    textEn: "I thank Professor Assad Akhmadovich Matara for the prompt, quality hypospadias surgery, for his patience and understanding. We always received answers to our questions. The doctor was always available. Urologist-andrologist Nadezhda Serednitskaya was also very supportive. The clinic has a homely, cozy atmosphere. Thank you for making my son well!",
    source: "Клиника доктора Матара"
  },
  {
    name: "Семья Можаевых",
    nameEn: "The Mozhaev family",
    date: "Сентябрь 2025",
    dateEn: "September 2025",
    rating: 5,
    text: "Хотим поблагодарить руководителя центра лечения мужского бесплодия Матара Сохейла Ахмадовича! У нас с супругой около 6 лет не было детей. Проходили лечение в нескольких учреждениях, безрезультатно. Уже отчаялись... С последней надеждой попали к этому замечательному доктору и вот спустя 8 месяцев лечения мы ждем малыша! Спасибо за поддержку и теплое отношение! Вы сотворили чудо!",
    textEn: "We want to thank the head of the male infertility treatment center, Dr. Matara Sokheil! My wife and I were childless for about 6 years. We underwent treatment at several facilities, to no avail. We had already given up... As a last hope, we came to this wonderful doctor, and after 8 months of treatment, we're expecting a baby! Thank you for the support and warm attitude! You worked a miracle!",
    source: "Клиника доктора Матара"
  },
  {
    name: "Надежда",
    nameEn: "Nadezhda",
    date: "Сентябрь 2025",
    dateEn: "September 2025",
    rating: 5,
    text: "В клинике доктора Матара моего сына наблюдает доктор Ерохин Е.А. более 3-х лет. Сделали операцию по коррекции сильного косоглазия в октябре 2024 г. Сегодня на контроле доктор похвалил — результат сохранился на 100%. Зрение держится. Глаза стоят ровно. Я, как медик, ценю тёплое, внимательное отношение к пациентам. В эту клинику хочется приезжать снова. Сын сказал поставить 1000%!",
    textEn: "At Dr. Matara's clinic, my son has been monitored by Dr. Erokhin for over 3 years. Surgery to correct severe strabismus was done in October 2024. At today's check-up, the doctor praised — the result is preserved 100%. Vision is stable. Eyes are straight. As a medical professional, I appreciate the warm, attentive attitude toward patients. You want to come back to this clinic. My son said to rate it 1000%!",
    source: "Клиника доктора Матара"
  },
  {
    name: "Мария",
    nameEn: "Maria",
    date: "Август 2025",
    dateEn: "August 2025",
    rating: 5,
    text: "Доктор Матар провел операцию нашему малышу по поводу гипоспадии. Мы в восторге от результата! Врач очень внимательный, перезванивал лично после выписки, интересовался состоянием. Чувствуется настоящая забота о пациентах.",
    textEn: "Dr. Matara performed hypospadias surgery on our baby. We are thrilled with the result! The doctor is very attentive, personally called after discharge to check on the condition. You can feel genuine care for patients.",
    source: "Клиника доктора Матара"
  },
  {
    name: "Мама",
    nameEn: "Mother",
    date: "Август 2025",
    dateEn: "August 2025",
    rating: 5,
    text: "Я мама мальчика 6 лет с гипоспадией мошоночной формы. В первый раз оперировали в другой клинике, но разошелся шов. Через несколько лет обратились в фонд «Тешам». Они посоветовали доктора Матара Асаада Ахмадовича в Москве. Он прооперировал мальчика очень хорошо. Ребенок ходил в туалет сидя до операции, теперь может ходить стоя. Он сам этому очень рад. Большое спасибо доктору и всему коллективу!",
    textEn: "I'm the mother of a 6-year-old boy with scrotal hypospadias. The first surgery at another clinic failed — the suture came apart. Years later, we contacted the Tesham Foundation. They recommended Dr. Matara in Moscow. He operated on the boy very well. Before surgery, the child could only use the toilet sitting down; now he can stand. He's very happy about it. Many thanks to the doctor and the entire team!",
    source: "Клиника доктора Матара"
  }
];
const ReviewsSection = () => {
  const { t, i18n: i18n2 } = useTranslation();
  const isEn = i18n2.language === "en";
  const [currentIndex, setCurrentIndex] = useState(0);
  const reviewsPerPage = 3;
  const maxIndex = reviews$2.length - reviewsPerPage;
  const [selectedReview, setSelectedReview] = useState(null);
  const nextSlide = () => {
    setCurrentIndex((prev) => prev >= maxIndex ? 0 : prev + 1);
  };
  const prevSlide = () => {
    setCurrentIndex((prev) => prev <= 0 ? maxIndex : prev - 1);
  };
  const displayReviews = reviews$2.slice(currentIndex, currentIndex + reviewsPerPage);
  const getName = (r) => isEn && r.nameEn ? r.nameEn : r.name;
  const getDate = (r) => isEn && r.dateEn ? r.dateEn : r.date;
  const getText = (r) => isEn ? r.textEn : r.text;
  return /* @__PURE__ */ jsx("section", { id: "reviews", className: "py-16 md:py-24 bg-secondary/30", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-12 md:mb-16", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-foreground mb-4", children: t("reviews.title") }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: t("reviews.subtitle") }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 mt-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsx(Star, { className: "w-5 h-5 fill-accent text-accent" }, i)) }),
        /* @__PURE__ */ jsx("span", { className: "text-lg font-semibold text-foreground", children: "5.0" }),
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
          reviews$2.length,
          "+ ",
          t("reviews.reviewsCount")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-3 gap-6", children: displayReviews.map((review, index) => /* @__PURE__ */ jsx(
        Card,
        {
          className: "bg-card border-border shadow-lg cursor-pointer hover:shadow-xl transition-shadow",
          onClick: () => setSelectedReview(review),
          children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
            /* @__PURE__ */ jsx(Quote, { className: "w-10 h-10 text-primary/20 mb-4" }),
            /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground mb-6 leading-relaxed line-clamp-6", children: [
              '"',
              getText(review),
              '"'
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-border", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground", children: getName(review) }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: getDate(review) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("div", { className: "flex mb-1", children: [...Array(review.rating)].map((_, i) => /* @__PURE__ */ jsx(Star, { className: "w-4 h-4 fill-accent text-accent" }, i)) }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: review.source })
              ] })
            ] })
          ] })
        },
        `${review.name}-${currentIndex}-${index}`
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-center items-center gap-4 mt-8", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            size: "icon",
            onClick: prevSlide,
            className: "rounded-full",
            children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
          currentIndex + 1,
          " — ",
          Math.min(currentIndex + reviewsPerPage, reviews$2.length),
          " ",
          isEn ? "of" : "из",
          " ",
          reviews$2.length
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            size: "icon",
            onClick: nextSlide,
            className: "rounded-full",
            children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-5 h-5" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-border", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-3xl font-bold text-primary", children: [
          reviews$2.length,
          "+"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: t("reviews.reviewsCount") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold text-primary", children: "100%" }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: isEn ? "Recommend" : "Рекомендуют" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold text-primary", children: "42" }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: t("about.achYears") })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-center mt-12", children: [
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: isEn ? "All reviews are verified and published on independent platforms" : "Все отзывы проверены и опубликованы на независимых платформах" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-center gap-3", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => window.open("https://yandex.ru/maps/org/klinika_doktora_matara/1124622894/reviews/", "_blank"), children: isEn ? "Read on Yandex" : "Читать на Яндексе" }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => window.open("https://prodoctorov.ru/moskva/vrach/32554-tarusin/otzivi/", "_blank"), children: isEn ? "Read on ProDoctors" : "Читать на ПроДокторов" }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => window.open("https://docdoc.ru/doctor/Tarusin_Dmitriy#reviews", "_blank"), children: isEn ? "Read on DocDoc" : "Читать на DocDoc" }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => window.open("https://doctu.ru/msk/doctor/tarusin-d-i#feedback", "_blank"), children: isEn ? "Read on Doctu" : "Читать на Докту" }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => window.open("https://www.matar-clinic.ru/reviews/", "_blank"), children: isEn ? "Dr. Matara's Clinic" : "Клиника доктора Матара" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: !!selectedReview, onOpenChange: () => setSelectedReview(null), children: /* @__PURE__ */ jsx(DialogContent, { className: "max-w-lg", children: selectedReview && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: getName(selectedReview) }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-normal text-muted-foreground", children: selectedReview.source })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex", children: [...Array(selectedReview.rating)].map((_, i) => /* @__PURE__ */ jsx(Star, { className: "w-4 h-4 fill-accent text-accent" }, i)) }),
        /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: getDate(selectedReview) })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-foreground leading-relaxed", children: [
        '"',
        getText(selectedReview),
        '"'
      ] })
    ] }) }) })
  ] }) });
};
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    "textarea",
    {
      className: cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ref,
      ...props
    }
  );
});
Textarea.displayName = "Textarea";
const Checkbox = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  CheckboxPrimitive.Root,
  {
    ref,
    className: cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(CheckboxPrimitive.Indicator, { className: cn("flex items-center justify-center text-current"), children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) })
  }
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
const ClinicCard = ({ name, address, phones, schedule, directions, labels }) => {
  var _a;
  return /* @__PURE__ */ jsxs(Card, { className: "bg-card border-border shadow-lg h-full", children: [
    /* @__PURE__ */ jsxs(CardContent, { className: "p-6 md:p-8", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-primary mb-6", children: name }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-primary" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground mb-1", children: labels.reception }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: address })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Phone, { className: "w-5 h-5 text-primary" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground mb-1", children: labels.phones }),
            /* @__PURE__ */ jsx("div", { className: "text-sm space-y-1", children: phones.map((phone, i) => /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("a", { href: phone.isWhatsApp ? `https://wa.me/${phone.href}` : `tel:${phone.href}`, target: phone.isWhatsApp ? "_blank" : void 0, rel: phone.isWhatsApp ? "noopener noreferrer" : void 0, className: "text-primary font-medium hover:underline transition-colors", children: phone.number }),
              /* @__PURE__ */ jsxs("span", { className: "ml-2 text-muted-foreground", children: [
                "(",
                phone.label,
                ")"
              ] })
            ] }, i)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-primary" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground mb-1", children: labels.schedule }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: schedule })
          ] })
        ] })
      ] })
    ] }),
    directions && /* @__PURE__ */ jsx("div", { className: "px-6 pb-6 md:px-8 md:pb-8 pt-0", children: /* @__PURE__ */ jsx(Card, { className: "bg-secondary/50 border-border", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
        /* @__PURE__ */ jsx(Navigation, { className: "w-4 h-4 text-primary" }),
        /* @__PURE__ */ jsx("h4", { className: "font-semibold text-foreground", children: labels.howToGet })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [
            /* @__PURE__ */ jsx(Train, { className: "w-3.5 h-3.5 text-muted-foreground" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-foreground", children: labels.metro })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: directions.metro.map((r, i) => /* @__PURE__ */ jsxs("div", { className: "p-2 bg-card rounded-md border border-border", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-0.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-foreground", children: r.name }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: r.time })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: r.detail })
          ] }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [
            /* @__PURE__ */ jsx(Bus, { className: "w-3.5 h-3.5 text-muted-foreground" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-foreground", children: labels.buses })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: directions.buses.map((b, i) => /* @__PURE__ */ jsxs("div", { className: "p-2 bg-card rounded-md border border-border", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs font-medium text-foreground mb-0.5", children: [
              "№ ",
              b.number
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: b.detail })
          ] }, i)) })
        ] })
      ] }),
      (_a = directions.extras) == null ? void 0 : _a.map((ex, i) => /* @__PURE__ */ jsxs("div", { className: "mt-2 p-2 bg-card rounded-md border border-border flex items-start gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm", children: ex.emoji }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-foreground", children: ex.title }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: ex.description })
        ] })
      ] }, i)),
      directions.parking && /* @__PURE__ */ jsxs("div", { className: "mt-2 p-2 bg-card rounded-md border border-border flex items-start gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm", children: directions.parking.emoji }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-foreground", children: directions.parking.title }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: directions.parking.description })
        ] })
      ] })
    ] }) }) })
  ] });
};
const ContactSection = () => {
  const { toast: toast2 } = useToast();
  const { t, i18n: i18n2 } = useTranslation();
  const isEn = i18n2.language === "en";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState({});
  const contactSchema = z.object({
    name: z.string().trim().min(2, isEn ? "Name must be at least 2 characters" : "Имя должно содержать минимум 2 символа").max(100),
    email: z.string().trim().email(isEn ? "Enter a valid email" : "Введите корректный email").max(255),
    phone: z.string().trim().min(10, isEn ? "Enter a valid phone number" : "Введите корректный номер телефона").max(20),
    message: z.string().trim().min(10, isEn ? "Message must be at least 10 characters" : "Сообщение должно содержать минимум 10 символов").max(1e3)
  });
  const labels = {
    reception: t("contact.reception"),
    phones: t("contact.phones"),
    schedule: t("contact.schedule"),
    howToGet: t("contact.howToGet"),
    metro: t("contact.metro"),
    buses: t("contact.buses"),
    parking: t("contact.parking")
  };
  const mataraDirections = {
    metro: [
      { name: isEn ? "Seligerskaya Station" : "М Селигерская", time: isEn ? "15 min" : "15 мин", detail: isEn ? "Bus 672, 179 to 'Korovinskoye Hwy'" : "Авт. 672, 179 до «Коровинское ш.»" },
      { name: isEn ? "Khovrino Station" : "М Ховрино", time: isEn ? "10 min" : "10 мин", detail: isEn ? "Bus 672 to 'Korovinskoye Hwy'" : "Авт. 672 до «Коровинское ш.»" }
    ],
    buses: [
      { number: "672", detail: isEn ? "from Khovrino / Seligerskaya" : "от м. Ховрино / Селигерская" },
      { number: "179", detail: isEn ? "from Seligerskaya" : "от м. Селигерская" }
    ],
    extras: [{ emoji: "🚶", title: isEn ? "Walk from Khovrino" : "Пешком от м. Ховрино", description: isEn ? "~20 min (1.5 km). Exit #3, along Korovinskoye Hwy towards the suburbs to Bldg 9/2" : "~20 мин (1.5 км). Выход №3, по Коровинскому шоссе в сторону области до д. 9 к. 2" }],
    parking: { emoji: "🚗", title: isEn ? "Parking" : "Парковка", description: isEn ? /* @__PURE__ */ jsxs(Fragment, { children: [
      "Enter from the outer side (not the courtyard). Gates ",
      /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "#1" }),
      " and ",
      /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "#3" }),
      " — call the clinic to open."
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      "Въезд к наружной стороне дома (не во двор). Шлагбаумы ",
      /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "№1" }),
      " и ",
      /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "№3" }),
      " — для открытия позвоните по одному из телефонов клиники."
    ] }) }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      toast2({ title: t("contact.consentRequired"), variant: "destructive" });
      return;
    }
    try {
      contactSchema.parse(formData);
      setErrors({});
      setIsSubmitting(true);
      const { error } = await supabase.from("appointment_requests").insert({
        parent_name: formData.name.trim(),
        contact_email: formData.email.trim(),
        contact_phone: formData.phone.trim(),
        problem_description: formData.message.trim(),
        child_age: "—"
      });
      if (error) throw error;
      setIsSubmitted(true);
      toast2({ title: t("contact.sent"), description: t("contact.sentDesc") });
      setTimeout(() => {
        setFormData({ name: "", email: "", phone: "", message: "" });
        setAgreed(false);
        setIsSubmitted(false);
      }, 3e3);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      } else {
        toast2({ title: isEn ? "Error sending" : "Ошибка отправки", description: isEn ? "Please try again or contact us by phone" : "Попробуйте ещё раз или свяжитесь по телефону", variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsx("section", { id: "contact", className: "py-16 md:py-24 bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-12 md:mb-16", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-foreground mb-4", children: t("contact.title") }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: t("contact.subtitle") })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mb-12 max-w-2xl mx-auto", children: /* @__PURE__ */ jsx(
      ClinicCard,
      {
        name: isEn ? "Dr. Matara's Clinic" : "Клиника доктора Матара",
        address: isEn ? "Moscow, Korovinskoye Hwy 9, Bldg 2" : "г. Москва, Коровинское шоссе д. 9 к. 2",
        phones: [
          { number: "+7 (495) 303-00-00", href: "+74953030000", label: isEn ? "reception" : "регистратура" },
          { number: "+7 (926) 303-01-11", href: "+79263030111", label: isEn ? "booking" : "запись" },
          { number: "+7 (916) 030-30-31", href: "+79160303031", label: isEn ? "booking" : "запись" }
        ],
        schedule: isEn ? "By appointment only" : "Только по предварительной записи",
        directions: mataraDirections,
        labels
      }
    ) }),
    /* @__PURE__ */ jsx("div", { className: "max-w-2xl mx-auto", children: /* @__PURE__ */ jsxs(Card, { className: "bg-card border-border shadow-lg", children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-xl", children: t("contact.formTitle") }) }),
      /* @__PURE__ */ jsx(CardContent, { children: isSubmitted ? /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(CheckCircle, { className: "w-8 h-8 text-primary" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-foreground mb-2", children: t("contact.sent") }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: t("contact.sentDesc") })
      ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: t("contact.name") }),
            /* @__PURE__ */ jsx(Input, { id: "name", name: "name", placeholder: t("contact.namePlaceholder"), value: formData.name, onChange: handleChange, className: errors.name ? "border-destructive" : "" }),
            errors.name && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: errors.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "phone", children: t("contact.phone") }),
            /* @__PURE__ */ jsx(Input, { id: "phone", name: "phone", type: "tel", placeholder: t("contact.phonePlaceholder"), value: formData.phone, onChange: handleChange, className: errors.phone ? "border-destructive" : "" }),
            errors.phone && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: errors.phone })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: t("contact.email") }),
          /* @__PURE__ */ jsx(Input, { id: "email", name: "email", type: "email", placeholder: t("contact.emailPlaceholder"), value: formData.email, onChange: handleChange, className: errors.email ? "border-destructive" : "" }),
          errors.email && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: errors.email })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "message", children: t("contact.message") }),
          /* @__PURE__ */ jsx(Textarea, { id: "message", name: "message", placeholder: t("contact.messagePlaceholder"), rows: 4, value: formData.message, onChange: handleChange, className: errors.message ? "border-destructive" : "" }),
          errors.message && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: errors.message })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx(Checkbox, { id: "agree", checked: agreed, onCheckedChange: (checked) => setAgreed(checked === true) }),
          /* @__PURE__ */ jsx(Label, { htmlFor: "agree", className: "text-sm text-muted-foreground leading-tight", children: t("contact.consent") })
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full bg-accent hover:bg-accent/90 text-accent-foreground", disabled: isSubmitting, children: isSubmitting ? t("contact.sending") : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 mr-2" }),
          t("contact.send")
        ] }) })
      ] }) })
    ] }) })
  ] }) });
};
const maxQrCode = "/assets/max-qr-DX0CWl6U.webp";
const maxIconImg = "data:image/webp;base64,UklGRmIJAABXRUJQVlA4IFYJAADQLwCdASrAAJcAPmEqkkakIiQhJvFL6IAMCWI7Ty5mt8X0UU9lltA9uW3P438adAKijt2/e+sD/ZevfxUP831XvMJ+y3rFf4D9sPdf/l/UA/rP+W6zX0GP219Nv9sPht/uf/G/a72tdVsUv5Xw/pi0HiCbXe7f1XohpaJnnkn+rChjVQ61PvSD/i9zneVYBaw3NLnYlGyunFAyuLagj0JcOZrp8LSQJ6gma4JtT6uh8W4Xrwm0muh4GX2A61IuHLrNm+lM3Zi1oY/lBL7an4UAaHSCHMwzPwdvVY/Nvrp5wlIXUdG6IGWlunL3vqTig1b2oLpKrpr/VKHB345tFezz+m5BmPdBD4X4QrTaUF+Laj+ZOVxclydpGCPW2x1SUhTeGWeDwOUhz8PEBU9rYusoy3WT5rF9hlik38KMYnxQZEQSX9LGNPWdYNlQV34hw1aPp0kP+1YdNca/7FAMMAULJ4lf63mvwC2XcsB2TlMckAXEL4YfTsINnox9LtICTvZn2V81rCYAAP7/gqXn/U4ndUYFfIXyvBPcbn7vK8E9xv/Ufr01XvLD9eWJl94PeCbxlW8cfbHDphoAVgg0KyMQSI5xATHmMPoABYXIVqiiklt85FYgT/Cz6IFIr1rrENcHPmhYYO34VJjBPsmho27JC3/7JnbwW/XIN0L4xoOQTUszyzFhag7b1uPOldKyiPdXIB7zSdb4fZvzcSPSKFiAfJbgQOj3O1x2Ff/efyHe8qn19342jafu3bzRNpRZxvjGelOQ6Hp18Ilj+0tsvJ8qjOmiY/N8ipezv8ZxWULCtpT/0AnnRK76BBkgNXMNNrUGkO2cAzSl6bjPtBCr1ac15XN2iGFJ5BCJl/iSxGnudMd3MrUV6HZUcve5c94G3nyCw6UTB2Dx0tnuwD55ws1FHKjBvWn8mW08JfXaJ0uBRWSqNcxouLSzKaNPZpbwUBISU0cS70801S8gl4ApvslV+rQYsQR/3Y2h1QtrZ+4h+ToUXTtnWPg9aYTclXh/PaV/VBxClVZeI0VfzVkPxNEk56ubeylwi0ql+uZhZYz1q2cz7Bhgrn7oVqB8MEphvGVVLygzjM8+tZSkES4vEPI+XYxJ4lQITcP6YiiLYGZeAbqqhGFcVXyd1JPGYSjm1IZ8ylOfPLWf9OqW2+TlvE9qGguIswSBMCQtZ1QUMZU1GJbZHHNITiTyU3IqxARDNGUu/REBvLgTHmmz7c8wQHBnEajEDYx91cOt0QEcKKeYlioC0DAjG0GFvDV+H3LMcah3z7ypVcVQ4jrX7UhTPQlni6lNyV43YtHxz17Skp2BUXEC2EnN92ITD5aw6/XrHsm8dlk5Vv8KpZnt5jWlGvF+jvNHB01M9AYOUHsyCE++FVB2uc4bBlpBEqzlN9Nh87k+eL3ewKQqLsPMqWgT53MctxY9uh2mg+kO5GxMbvzvYCQolCpj+zLD70Hear1z7ehNB18ic4hK8h6s18Smu6rWOHzXakMHSqra9T3IfTqEKbGYoICGqsSPv73SFVB6Rs51iy9D3+kp1aqv7cx/HXClIVcM0ncfPfzJNjm0VdsLrumAWyOyr71FooWTwYy62cpP66WHE63oHA+F3uF9AJHnIiS+rhjfjCTk/ay1tXXAdCfGZh52uQuafq1Rlac8HI5x0VC+q8oRTdOFNhDiBd18TzW1NYrSeUtDux5HGljw6GwUB6io79I/eeG41kiKvBFUqZpstBIJTvRgQy/FYLUE8xbM5kG3CRDuqX70j+vK97d6xVGz7mpuhZyadBX0zh/RljZVN9Kaw9SZOE7+9m8RFkTrbDbOufcxH/tUnrSoluTbySha5jjbYO3ta8D9oGLi8DatqWSngDp+KtSh84Jeomef4qxzYRz51a2e3xz1cundCvFT0uJ7mfliku83Ql+nYo5jAHiU9oIDmeN07FeGqSlwzKMKD8VNyG8PIwVBJd72Kh79/HFr1gnyEzYf3x/wcI/qN5Bj0dSuHVN8fN+0NHQWm3seBWBXx7UNtgD8WS2RJ0fYyNj9JgxMG3rfTeNHXIqXoFd2bt/QTzfwn+dOMPU9oBqGs0mbSanHUdiXYFq5bkG4JKAM/mza8HWGdAjR4vkNI7+udu+Hn+cP5+nHGf5Zk87ZRrKiO8vh92m5qFv/RRX9rHzxPLsu8vpbz0TysoCxy3RvKH54uKSZv68OK/FS9oxzGQQ4KcmNhjGOeis6+RMBa3iefcIyf1uzZYq8qqydtkrSQhMFagD6m1hZ9ZE17LWAYugqKS83bqIlg24GryAm0/1j8CVF4SS+vE6JjmOSTY+OjN1TDcnnnJBNzuPckRRyzGTiUFmvMy5FulxC+TMDF33WamopIbt+BXpdlYDSXXqakI3Fbf8Gwr7iJLfUpwB58cE4W9QcJsa4ppXryYG/5fQWZnaPq5imK9b7RDgb/MdrVExnUJnCxIVWc68coSL7UUxywcmpeqz9vIXCENIrE5DcgAvPNj/ZQqKfPulD/4VH3F9e3/9ix3633bghsafuoBsMkB7egGPic+pCqQi5Vv3WJz0d9yAH/v6i23lZoI3HoqDL378MPy7UH0MAJbOIWnrbmuwN11LX8hJ6AOJTSXQVc0HWJWmf9O31n1H156NZ0ctmqnYuLwLLcJYx3qpkir0DlYQYj5Gh/9ilU2kJu4mEYiDnJf/5YDA2Angslgggk0z3UGdzkY17Ta6jE3+uS9CgeQmr46EpR/jaMVY3V1V1dGzuhHYm72pbNGE3vocfPsfyhNGcCON4uJcFGbN1s3D1A21+WTWBz4JIREwiSpdFVtR7NynwMUolLCHH65GsgIoZzLXyfIa0tw59/crDrt5ANpPsYJiKl2ilU0G7nae9j8PHXp0wwcW0QHSONEwJzj5N+nYMMgeLbbUgCl7jnWZ4QibN4/dKeWY0WlDM0dC70KNsCA9HF96PFdNxcZqvOmVDQL/M5kFE5si6uPjXXayLs/5DiG3WOkdji1ZJ4MWu+y9uHuc/5MNNWMdIIfvhuywxvsXOiquPuLbFh496zD+YhqWrPB8//yYprKGnXYXE/rnx793j72503MD79U78kJkmjUQZrVDUQuzaAEB/XJVUNWWPx0OWp3l+ayNT/ibP3nsa2iBBSDsPw7O4siy2O5LKMIOMxM+9c5cmA/iim9RzPcpfC5Ex/G9+PIAAAA==";
const TelegramIcon = ({ className }) => /* @__PURE__ */ jsx("svg", { className, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" }) });
const InstagramIcon = ({ className }) => /* @__PURE__ */ jsx("svg", { className, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" }) });
const FacebookIcon = ({ className }) => /* @__PURE__ */ jsx("svg", { className, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" }) });
const DzenIcon = ({ className }) => /* @__PURE__ */ jsx("svg", { className, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c2.903 0 5.503 1.425 7.088 3.612h-3.6c-.788-.9-1.912-1.512-3.188-1.612v-2zm-4.8 0v2c-1.275.1-2.4.712-3.187 1.612h-3.6C1.998 5.025 4.598 3.6 7.5 3.6h-.3zM3.6 12c0-.9.15-1.763.413-2.575h2.85c-.15.825-.263 1.687-.263 2.575s.113 1.75.263 2.575h-2.85A8.372 8.372 0 0 1 3.6 12zm3.9 7.2v-2c1.275-.1 2.4-.712 3.188-1.612h3.6c-1.585 2.187-4.185 3.612-7.088 3.612h.3zm9.6-4.625c.15-.825.263-1.687.263-2.575s-.113-1.75-.263-2.575h2.85c.263.812.413 1.675.413 2.575s-.15 1.763-.413 2.575h-2.85z" }) });
const WhatsAppIcon = ({ className }) => /* @__PURE__ */ jsx("svg", { className, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" }) });
const YouTubeIcon = ({ className }) => /* @__PURE__ */ jsx("svg", { className, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" }) });
const VKIcon = ({ className }) => /* @__PURE__ */ jsx("svg", { className, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.727-1.033-1.007-1.49-1.143-1.744-1.143-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.15-3.574 2.15-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .643.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.474-.085.717-.576.717z" }) });
const ThreadsIcon = ({ className }) => /* @__PURE__ */ jsx("svg", { className, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.083.717 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.762 2.084-1.2 3.583-1.303 1.1-.076 2.126.012 3.06.262-.084-1.26-.57-2.206-1.48-2.75-.635-.38-1.47-.57-2.49-.57h-.036c-1.254.01-2.27.405-3.02 1.175l-1.471-1.404C8.61 5.462 10.15 4.842 12.04 4.822h.05c1.36 0 2.519.282 3.443.838 1.273.766 2.073 1.983 2.308 3.518.43.065.84.158 1.23.278l.01.003c1.375.425 2.51 1.175 3.282 2.168.952 1.222 1.28 2.767 1.088 4.188-.404 3.005-2.532 5.37-6.41 5.97-1.163.18-2.261.217-3.313.217h-.243zM12 13.284c-1.065.074-1.893.36-2.393.828-.398.373-.58.836-.544 1.377.033.502.276.942.684 1.239.528.384 1.288.584 2.132.539 1.07-.059 1.89-.453 2.442-1.173.373-.487.627-1.137.757-1.945-.929-.254-1.98-.397-3.078-.397v-.468z" }) });
const MaxIcon = ({ className }) => /* @__PURE__ */ jsx("img", { src: maxIconImg, alt: "MAX", className: `${className} rounded-sm object-contain` });
const MaxQrModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "relative bg-background rounded-2xl p-6 shadow-2xl max-w-xs mx-4 animate-in fade-in zoom-in-95", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsx("button", { onClick: onClose, className: "absolute top-2 right-2 w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground transition-colors", children: "✕" }),
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-3", children: [
      /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground", children: "Мессенджер MAX" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Отсканируйте QR-код" })
    ] }),
    /* @__PURE__ */ jsx("img", { src: maxQrCode, alt: "QR-код MAX мессенджера Дмитрия Тарусина", width: 256, height: 256, decoding: "async", className: "w-64 h-64 object-contain rounded-xl" })
  ] }) });
};
const SOCIAL_LINKS = [
  {
    icon: InstagramIcon,
    href: "https://www.instagram.com/androlog_di",
    label: "Instagram"
  },
  {
    icon: TelegramIcon,
    href: "https://t.me/+tMWpYqcllzo3NmYy",
    label: "Telegram",
    title: "Приёмная Профессора ДИ"
  },
  {
    icon: TelegramIcon,
    href: "https://t.me/androtolk",
    label: "Telegram (дети)",
    title: "Репродуктивное здоровье мальчиков"
  },
  {
    icon: TelegramIcon,
    href: "https://t.me/+252tMTFSq-03ZDFi",
    label: "Telegram (врачи)",
    title: "Андрология и Профессор"
  },
  {
    icon: VKIcon,
    href: "https://vk.com/androlog_di",
    label: "ВКонтакте"
  },
  {
    icon: FacebookIcon,
    href: "https://www.facebook.com/share/1CEzaVnGYW/?mibextid=wwXIfr",
    label: "Facebook"
  },
  {
    icon: ThreadsIcon,
    href: "https://www.threads.com/@androlog_di",
    label: "Threads"
  },
  {
    icon: DzenIcon,
    href: "https://dzen.ru/androlog_di",
    label: "Дзен",
    title: "Мужской ЗдравоХранитель"
  },
  {
    icon: YouTubeIcon,
    href: "https://www.youtube.com/@androlog_di",
    label: "YouTube",
    title: "Профессор и Андрология"
  },
  {
    icon: WhatsAppIcon,
    href: "https://wa.me/79778075544",
    label: "WhatsApp"
  },
  {
    icon: MaxIcon,
    href: "#max-qr",
    label: "MAX",
    title: "Мессенджер MAX",
    isQr: true
  }
];
const FOOTER_SOCIAL_LINKS = SOCIAL_LINKS.filter(
  (l) => ["Instagram", "Telegram", "ВКонтакте", "Facebook", "Дзен", "YouTube", "WhatsApp", "MAX"].includes(l.label)
);
const SocialBar = ({ className = "" }) => {
  const [showMaxQr, setShowMaxQr] = useState(false);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: `flex flex-wrap gap-2 ${className}`, children: SOCIAL_LINKS.map((social, i) => {
      if (social.isQr) {
        return /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowMaxQr(true),
            className: "w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors text-muted-foreground",
            "aria-label": social.title || social.label,
            title: social.title || social.label,
            children: /* @__PURE__ */ jsx(social.icon, { className: "w-4 h-4" })
          },
          `${social.label}-${i}`
        );
      }
      return /* @__PURE__ */ jsx(
        "a",
        {
          href: social.href,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors text-muted-foreground",
          "aria-label": social.title || social.label,
          title: social.title || social.label,
          children: /* @__PURE__ */ jsx(social.icon, { className: "w-4 h-4" })
        },
        `${social.label}-${i}`
      );
    }) }),
    /* @__PURE__ */ jsx(MaxQrModal, { isOpen: showMaxQr, onClose: () => setShowMaxQr(false) })
  ] });
};
const Footer = () => {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMaxQr, setShowMaxQr] = useState(false);
  const { t } = useTranslation();
  const handleNavClick = (href) => {
    if (location.pathname === "/") {
      const element = document.querySelector(href);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/" + href);
    }
  };
  const navItems = [
    { label: t("nav.home"), href: "#hero", type: "anchor" },
    { label: t("nav.about"), href: "#about", type: "anchor" },
    { label: t("nav.consultations"), href: "#consultations", type: "anchor" },
    { label: t("nav.methods"), href: "/methodologies", type: "link" },
    { label: t("nav.team"), href: "/team", type: "link" },
    { label: t("nav.forParents"), href: "/for-parents", type: "link" },
    { label: t("nav.forDoctors"), href: "/for-doctors", type: "link" },
    { label: t("nav.media"), href: "/media", type: "link" },
    { label: t("nav.videos"), href: "/videos", type: "link" },
    { label: t("nav.videoCases"), href: "/video-cases", type: "link" },
    { label: t("nav.publications"), href: "/publications", type: "link" },
    { label: t("nav.clinicalCases"), href: "/clinical-cases", type: "link" },
    { label: t("nav.travelNotes"), href: "/travel-notes", type: "link" },
    { label: t("nav.research"), href: "/research", type: "link" },
    { label: t("nav.blog"), href: "/blog", type: "link" },
    { label: t("nav.reviews"), href: "/reviews", type: "link" },
    { label: t("nav.qa"), href: "/qa", type: "link" },
    { label: t("nav.contacts"), href: "/contacts", type: "link" }
  ];
  return /* @__PURE__ */ jsx("footer", { className: "bg-foreground text-background py-12 md:py-16", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg", children: t("lang") === "en" ? "TD" : "ТД" }),
          /* @__PURE__ */ jsx("p", { className: "font-semibold", children: t("lang") === "en" ? "Professor Tarusin D.I." : "Профессор Тарусин Д.И." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-background/70 text-sm mb-4", children: t("footer.desc") }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: FOOTER_SOCIAL_LINKS.map((social, i) => {
          if (social.isQr) {
            return /* @__PURE__ */ jsx("button", { onClick: () => setShowMaxQr(true), className: "w-9 h-9 rounded-full bg-background/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors", "aria-label": social.title || social.label, title: social.title || social.label, children: /* @__PURE__ */ jsx(social.icon, { className: "w-4 h-4" }) }, `${social.label}-${i}`);
          }
          return /* @__PURE__ */ jsx("a", { href: social.href, target: "_blank", rel: "noopener noreferrer", className: "w-9 h-9 rounded-full bg-background/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors", "aria-label": social.title || social.label, title: social.title || social.label, children: /* @__PURE__ */ jsx(social.icon, { className: "w-4 h-4" }) }, `${social.label}-${i}`);
        }) }),
        /* @__PURE__ */ jsx(MaxQrModal, { isOpen: showMaxQr, onClose: () => setShowMaxQr(false) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-4", children: t("footer.navigation") }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: navItems.map(
          (item) => item.type === "anchor" ? /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("button", { onClick: () => handleNavClick(item.href), className: "text-background/70 hover:text-background transition-colors text-sm", children: item.label }) }, item.href) : /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: item.href, className: "text-background/70 hover:text-background transition-colors text-sm", children: item.label }) }, item.href)
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-4", children: t("footer.specializations") }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-background/70", children: [
          /* @__PURE__ */ jsx("li", { children: t("lang") === "en" ? "Pediatric Urology-Andrology" : "Детская урология-андрология" }),
          /* @__PURE__ */ jsx("li", { children: t("lang") === "en" ? "Adult Urology" : "Урология взрослых" }),
          /* @__PURE__ */ jsx("li", { children: t("lang") === "en" ? "Pediatrics" : "Педиатрия" }),
          /* @__PURE__ */ jsx("li", { children: t("lang") === "en" ? "Microsurgery" : "Микрохирургия" }),
          /* @__PURE__ */ jsx("li", { children: t("lang") === "en" ? "Plastic Surgery" : "Пластическая хирургия" }),
          /* @__PURE__ */ jsx("li", { children: t("lang") === "en" ? "Ultrasound Diagnostics" : "УЗИ-диагностика" }),
          /* @__PURE__ */ jsx("li", { children: t("lang") === "en" ? "Rehabilitation" : "Реабилитация" }),
          /* @__PURE__ */ jsx("li", { children: t("lang") === "en" ? "Sexology" : "Сексология" }),
          /* @__PURE__ */ jsx("li", { children: t("lang") === "en" ? "Reproductive Psychology" : "Репродуктивная психология" }),
          /* @__PURE__ */ jsx("li", { children: t("lang") === "en" ? "Reproductive Endocrinology" : "Репродуктивная эндокринология" }),
          /* @__PURE__ */ jsx("li", { children: t("lang") === "en" ? "Functional Orthopedics" : "Функциональная ортопедия" }),
          /* @__PURE__ */ jsx("li", { children: t("lang") === "en" ? "Pediatric Surgery" : "Детская хирургия" }),
          /* @__PURE__ */ jsx("li", { children: t("lang") === "en" ? "General Surgery" : "Хирургия" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-4", children: t("footer.contactsTitle") }),
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium text-background/90 text-sm mb-2", children: t("hero.mataraClinic") }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-sm", children: [
              /* @__PURE__ */ jsx(Phone, { className: "w-4 h-4 flex-shrink-0 text-background/70" }),
              /* @__PURE__ */ jsx("a", { href: "tel:+74953030000", className: "text-background/70 hover:text-background transition-colors", children: "+7 (495) 303-00-00" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-sm", children: [
              /* @__PURE__ */ jsx(Phone, { className: "w-4 h-4 flex-shrink-0 text-background/70" }),
              /* @__PURE__ */ jsx("a", { href: "tel:+79263030111", className: "text-background/70 hover:text-background transition-colors", children: "+7 (926) 303-01-11" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-sm", children: [
              /* @__PURE__ */ jsx(Phone, { className: "w-4 h-4 flex-shrink-0 text-background/70" }),
              /* @__PURE__ */ jsx("a", { href: "tel:+79160303031", className: "text-background/70 hover:text-background transition-colors", children: "+7 (916) 030-30-31" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3 text-sm", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 flex-shrink-0 mt-0.5 text-background/70" }),
              /* @__PURE__ */ jsx("span", { className: "text-background/70", children: t("lang") === "en" ? "Moscow, Korovinskoye Hwy 9, Bldg 2" : "Москва, Коровинское шоссе, 9 к2" })
            ] })
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "pt-8 border-t border-background/20", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center gap-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-background/60", children: t("footer.copyright", { year: currentYear }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
        /* @__PURE__ */ jsx(Link, { to: "/privacy-policy", className: "text-sm text-background/60 hover:text-background transition-colors", children: t("footer.privacyPolicy") }),
        /* @__PURE__ */ jsx(Link, { to: "/consent", className: "text-sm text-background/60 hover:text-background transition-colors", children: t("footer.dataConsent") })
      ] })
    ] }) })
  ] }) });
};
const QASection = () => {
  const { t, i18n: i18n2 } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { data: questions = [] } = useQuery({
    queryKey: ["published-questions-preview"],
    staleTime: 1e3 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await supabase.from("questions_public").select("id, author_name, question_text, answer_text, created_at").eq("is_published", true).not("answer_text", "is", null).order("answered_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    }
  });
  const goNext = useCallback(() => {
    if (questions.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  }, [questions.length]);
  const goPrev = useCallback(() => {
    if (questions.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length);
  }, [questions.length]);
  useEffect(() => {
    if (isPaused || questions.length <= 1) return;
    const interval = setInterval(goNext, 6e3);
    return () => clearInterval(interval);
  }, [isPaused, goNext, questions.length]);
  if (questions.length === 0) return null;
  const current = questions[currentIndex];
  const locale = i18n2.language === "en" ? "en-US" : "ru-RU";
  return /* @__PURE__ */ jsx("section", { className: "py-16 md:py-24 bg-secondary/30", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
      /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4", children: [
        /* @__PURE__ */ jsx(MessageCircle, { size: 16 }),
        /* @__PURE__ */ jsx("span", { children: t("qa.badge") })
      ] }),
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-foreground mb-4", children: t("qa.title") }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: t("qa.subtitle") })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto relative", onMouseEnter: () => setIsPaused(true), onMouseLeave: () => setIsPaused(false), children: [
      questions.length > 1 && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "absolute -left-4 md:-left-14 top-1/2 -translate-y-1/2 z-10 bg-card/80 hover:bg-card shadow-md rounded-full", onClick: goPrev, children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "absolute -right-4 md:-right-14 top-1/2 -translate-y-1/2 z-10 bg-card/80 hover:bg-card shadow-md rounded-full", onClick: goNext, children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-5 h-5" }) })
      ] }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border shadow-md transition-all duration-500 min-h-[200px]", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 md:p-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsxs("p", { className: "font-semibold text-foreground text-lg leading-relaxed", children: [
            "«",
            current.question_text,
            "»"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-2", children: [
            current.author_name,
            " • ",
            new Date(current.created_at).toLocaleDateString(locale)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pl-4 border-l-2 border-primary/30 mt-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground whitespace-pre-line leading-relaxed", children: current.answer_text }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-primary mt-3 font-medium", children: t("qa.answeredBy") })
        ] })
      ] }) }),
      questions.length > 1 && /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-2 mt-6", children: questions.map((_, idx) => /* @__PURE__ */ jsx("button", { onClick: () => setCurrentIndex(idx), className: `w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "bg-primary w-6" : "bg-primary/25 hover:bg-primary/50"}` }, idx)) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "text-center mt-8", children: /* @__PURE__ */ jsx(Link, { to: "/qa", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", children: [
      t("qa.allQA"),
      /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" })
    ] }) }) })
  ] }) });
};
const StickyBottomPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", question: "" });
  const { toast: toast2 } = useToast();
  const { t, i18n: i18n2 } = useTranslation();
  const isEn = i18n2.language === "en";
  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.question.trim()) {
      toast2({ title: t("sticky.fillAll"), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("questions").insert({
        author_name: formData.name.trim(),
        author_email: formData.email.trim(),
        question_text: formData.question.trim()
      });
      if (error) throw error;
      toast2({ title: t("sticky.questionSent"), description: t("sticky.questionSentDesc") });
      setFormData({ name: "", email: "", question: "" });
      setQuestionOpen(false);
    } catch {
      toast2({ title: t("sticky.errorSending"), description: t("sticky.tryLater"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "fixed bottom-0 left-0 right-0 z-50", children: [
    isExpanded && /* @__PURE__ */ jsx("div", { className: "bg-card border-t border-border shadow-2xl animate-in slide-in-from-bottom duration-300", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-foreground", children: t("sticky.bookAppointment") }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => setIsExpanded(false), children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "max-w-md mx-auto", children: /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-accent/10 border-2 border-accent/30 relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute -top-2.5 left-4 px-2 py-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full uppercase tracking-wider", children: t("sticky.priority") }),
        /* @__PURE__ */ jsx("h4", { className: "font-semibold text-foreground mb-2 mt-1", children: isEn ? "Dr. Matara's Clinic" : t("hero.mataraClinic") }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-3", children: isEn ? "Moscow, Korovinskoye Hwy 9, Bldg 2" : "Москва, Коровинское шоссе д. 9 к. 2" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxs("a", { href: "tel:+74953030000", className: "flex items-center gap-2 text-sm font-medium text-primary hover:underline", children: [
            /* @__PURE__ */ jsx(Phone, { className: "w-3.5 h-3.5" }),
            " +7 (495) 303-00-00 ",
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground font-normal", children: [
              "(",
              t("sticky.reception"),
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("a", { href: "tel:+79263030111", className: "flex items-center gap-2 text-sm text-primary hover:underline", children: [
            /* @__PURE__ */ jsx(Phone, { className: "w-3.5 h-3.5" }),
            " +7 (926) 303-01-11 ",
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground font-normal", children: [
              "(",
              t("sticky.booking"),
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("a", { href: "tel:+79160303031", className: "flex items-center gap-2 text-sm text-primary hover:underline", children: [
            /* @__PURE__ */ jsx(Phone, { className: "w-3.5 h-3.5" }),
            " +7 (916) 030-30-31 ",
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground font-normal", children: [
              "(",
              t("sticky.booking"),
              ")"
            ] })
          ] })
        ] })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "bg-primary text-primary-foreground shadow-lg", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between h-14", children: [
      /* @__PURE__ */ jsxs(Button, { variant: "ghost", onClick: () => setIsExpanded(!isExpanded), className: "text-primary-foreground hover:bg-primary-foreground/10 gap-2 font-semibold", children: [
        /* @__PURE__ */ jsx(Phone, { className: "w-4 h-4" }),
        /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: t("sticky.bookAppointment") }),
        /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: t("sticky.bookShort") }),
        /* @__PURE__ */ jsx(ChevronUp, { className: `w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}` })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "hidden md:flex items-center gap-4", children: /* @__PURE__ */ jsx("a", { href: "tel:+74953030000", className: "text-sm text-primary-foreground/90 hover:text-primary-foreground transition-colors", children: "+7 (495) 303-00-00" }) }),
      /* @__PURE__ */ jsxs(Dialog, { open: questionOpen, onOpenChange: setQuestionOpen, children: [
        /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", className: "text-primary-foreground hover:bg-primary-foreground/10 gap-2", children: [
          /* @__PURE__ */ jsx(MessageCircleQuestion, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: t("sticky.askQuestion") }),
          /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: t("sticky.askShort") })
        ] }) }),
        /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", children: [
          /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: t("sticky.questionTitle") }) }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmitQuestion, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "q-name", children: t("sticky.yourName") }),
              /* @__PURE__ */ jsx(Input, { id: "q-name", placeholder: "...", value: formData.name, onChange: (e) => setFormData((p) => ({ ...p, name: e.target.value })) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "q-email", children: t("sticky.emailForReply") }),
              /* @__PURE__ */ jsx(Input, { id: "q-email", type: "email", placeholder: "example@mail.com", value: formData.email, onChange: (e) => setFormData((p) => ({ ...p, email: e.target.value })) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "q-text", children: t("sticky.yourQuestion") }),
              /* @__PURE__ */ jsx(Textarea, { id: "q-text", placeholder: "...", rows: 4, value: formData.question, onChange: (e) => setFormData((p) => ({ ...p, question: e.target.value })) })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("sticky.questionHint") }),
            /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full bg-accent hover:bg-accent/90 text-accent-foreground", disabled: isSubmitting, children: isSubmitting ? t("sticky.sendingQuestion") : t("sticky.sendQuestion") })
          ] })
        ] })
      ] })
    ] }) }) })
  ] });
};
const DEFAULT_IMAGE = `${SITE_URL$1}/og-image.png`;
const PageMeta = ({ title, description, path, image, type = "website", lang: lang2, keywords }) => {
  let pathname = "/";
  try {
    pathname = useLocation().pathname;
  } catch {
    pathname = path;
  }
  const currentLang = lang2 ?? getLangFromPath(pathname);
  const bare = stripLangPrefix(path === "" ? "/" : path);
  const normalized = bare === "/" || bare.endsWith("/") ? bare : `${bare}/`;
  const canonicalPath = currentLang === "en" ? normalized === "/" ? "/en/" : `/en${normalized}` : normalized;
  const url = `${SITE_URL$1}${canonicalPath}`;
  const alts = getAlternates(canonicalPath);
  const ogImage = image || DEFAULT_IMAGE;
  const ogLocale = currentLang === "en" ? "en_US" : "ru_RU";
  return /* @__PURE__ */ jsxs(Helmet, { htmlAttributes: { lang: currentLang }, children: [
    /* @__PURE__ */ jsx("title", { children: title }),
    /* @__PURE__ */ jsx("meta", { name: "description", content: description }),
    keywords && keywords.length > 0 && /* @__PURE__ */ jsx("meta", { name: "keywords", content: keywords.join(", ") }),
    /* @__PURE__ */ jsx("link", { rel: "canonical", href: url }),
    /* @__PURE__ */ jsx("link", { rel: "alternate", hrefLang: "ru", href: alts.ru }),
    /* @__PURE__ */ jsx("link", { rel: "alternate", hrefLang: "en", href: alts.en }),
    /* @__PURE__ */ jsx("link", { rel: "alternate", hrefLang: "x-default", href: alts.xDefault }),
    /* @__PURE__ */ jsx("meta", { property: "og:title", content: title }),
    /* @__PURE__ */ jsx("meta", { property: "og:description", content: description }),
    /* @__PURE__ */ jsx("meta", { property: "og:url", content: url }),
    /* @__PURE__ */ jsx("meta", { property: "og:type", content: type }),
    /* @__PURE__ */ jsx("meta", { property: "og:image", content: ogImage }),
    /* @__PURE__ */ jsx("meta", { property: "og:image:alt", content: title }),
    /* @__PURE__ */ jsx("meta", { property: "og:locale", content: ogLocale }),
    /* @__PURE__ */ jsx("meta", { property: "og:site_name", content: "Профессор Тарусин Д.И." }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: title }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: description }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: ogImage }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:url", content: url })
  ] });
};
const SITE_URL = "https://tarusin.pro";
const physicianSchema = {
  "@context": "https://schema.org",
  "@type": "Physician",
  name: "Prof. Dmitry I. Tarusin",
  alternateName: "Проф. Тарусин Дмитрий Игоревич",
  url: SITE_URL,
  image: `${SITE_URL}/og-image.png`,
  description: "Professor, Doctor of Medical Sciences, pediatric urologist-andrologist and microsurgeon with 42+ years of experience.",
  medicalSpecialty: [
    { "@type": "MedicalSpecialty", name: "Pediatric Urology" },
    { "@type": "MedicalSpecialty", name: "Andrology" },
    { "@type": "MedicalSpecialty", name: "Microsurgery" }
  ],
  knowsAbout: [
    "Varicocele microsurgery",
    "Cryptorchidism treatment",
    "Hypospadias correction",
    "Hydrocele repair",
    "Phimosis treatment",
    "Pediatric andrology",
    "Testicular torsion",
    "Male infertility prevention"
  ],
  hasCredential: [
    { "@type": "EducationalOccupationalCredential", credentialCategory: "Doctor of Medical Sciences", dateCreated: "2005" },
    { "@type": "EducationalOccupationalCredential", credentialCategory: "Professor" }
  ],
  memberOf: {
    "@type": "Organization",
    name: "Russian Academy of Natural Sciences",
    alternateName: "RANS"
  },
  sameAs: [
    "https://www.youtube.com/@androlog_di",
    "https://uro.tv/speaker2021/tarusin_dmitriy_igorevich"
  ]
};
const medicalConditions = [
  { name: "Varicocele", desc: "Enlargement of veins within the scrotum, treated with microsurgical techniques.", url: "/results" },
  { name: "Cryptorchidism", desc: "Undescended testicle requiring surgical correction in childhood.", url: "/results" },
  { name: "Hypospadias", desc: "Congenital condition where the urethral opening is not at the tip of the penis.", url: "/results" },
  { name: "Hydrocele", desc: "Fluid accumulation around the testicle requiring surgical repair.", url: "/results" },
  { name: "Phimosis", desc: "Tight foreskin that cannot be retracted, often requiring treatment in children.", url: "/results" }
];
const conditionsSchema = medicalConditions.map((c) => ({
  "@context": "https://schema.org",
  "@type": "MedicalCondition",
  name: c.name,
  description: c.desc,
  url: `${SITE_URL}${c.url}`,
  possibleTreatment: {
    "@type": "MedicalTherapy",
    name: `${c.name} surgical treatment`,
    performer: { "@type": "Physician", name: "Prof. Dmitry I. Tarusin" }
  }
}));
const SchemaOrg = () => /* @__PURE__ */ jsxs(Helmet, { children: [
  /* @__PURE__ */ jsx("script", { type: "application/ld+json", children: JSON.stringify(physicianSchema) }),
  /* @__PURE__ */ jsx("script", { type: "application/ld+json", children: JSON.stringify(conditionsSchema) })
] });
const weights = [3, 2, 3, 2, 2, 3, 2, 2, 1, 2, 1, 2];
const DiagnosticChecklist = () => {
  const [checked, setChecked] = useState(/* @__PURE__ */ new Set());
  const [showResult, setShowResult] = useState(false);
  const { t } = useTranslation();
  const items = t("checklist.items", { returnObjects: true });
  const toggle = (idx) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
    setShowResult(false);
  };
  const totalWeight = Array.from(checked).reduce((sum, idx) => sum + (weights[idx] || 0), 0);
  const getResult = () => {
    if (totalWeight === 0) return null;
    if (totalWeight <= 2) return {
      level: "low",
      title: t("checklist.lowTitle"),
      text: t("checklist.lowText"),
      color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      icon: /* @__PURE__ */ jsx(Info, { className: "w-5 h-5" })
    };
    if (totalWeight <= 5) return {
      level: "medium",
      title: t("checklist.medTitle"),
      text: t("checklist.medText"),
      color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      icon: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5" })
    };
    return {
      level: "high",
      title: t("checklist.highTitle"),
      text: t("checklist.highText"),
      color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      icon: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5" })
    };
  };
  const result = getResult();
  return /* @__PURE__ */ jsx("section", { className: "py-16 md:py-24 bg-muted/30", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-foreground mb-4", children: t("checklist.title") }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: t("checklist.subtitle") })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "max-w-2xl mx-auto", children: /* @__PURE__ */ jsxs(Card, { className: "border-border shadow-lg", children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-primary" }),
        t("checklist.markSymptoms")
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        items.map((item, i) => /* @__PURE__ */ jsxs("label", { className: `flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checked.has(i) ? "bg-primary/5 border-primary/30" : "bg-card border-border hover:bg-muted/50"}`, children: [
          /* @__PURE__ */ jsx(Checkbox, { checked: checked.has(i), onCheckedChange: () => toggle(i), className: "mt-0.5" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-foreground leading-snug", children: item })
        ] }, i)),
        /* @__PURE__ */ jsxs("div", { className: "pt-4 flex gap-3", children: [
          /* @__PURE__ */ jsxs(Button, { onClick: () => setShowResult(true), disabled: checked.size === 0, className: "flex-1", children: [
            t("checklist.getResult"),
            " ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
          ] }),
          checked.size > 0 && /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => {
            setChecked(/* @__PURE__ */ new Set());
            setShowResult(false);
          }, children: /* @__PURE__ */ jsx(RotateCcw, { className: "w-4 h-4" }) })
        ] }),
        showResult && result && /* @__PURE__ */ jsxs("div", { className: `mt-4 p-4 rounded-xl border ${result.color}`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
            result.icon,
            /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: result.title })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm mb-3", children: result.text }),
          result.level !== "low" && /* @__PURE__ */ jsx(Button, { asChild: true, size: "sm", className: "mt-1", children: /* @__PURE__ */ jsxs("a", { href: "#contact", children: [
            t("nav.bookAppointmentFull"),
            " ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3 ml-1" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground text-center pt-2", children: t("checklist.disclaimer") })
      ] })
    ] }) })
  ] }) });
};
const ResultsCTA = () => {
  const { i18n: i18n2 } = useTranslation();
  const isEn = i18n2.language === "en";
  return /* @__PURE__ */ jsx("section", { className: "py-12 md:py-16 bg-background", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-8 h-8 text-primary" }) }),
    /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground mb-4", children: isEn ? "View Surgical Results" : "Результаты операций" }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6 max-w-xl mx-auto", children: isEn ? "Photo documentation of before-and-after surgical results is available in a separate protected section (18+). Access requires age confirmation." : "Фотодокументация результатов операций «до и после» доступна в отдельном защищённом разделе (18+). Для доступа необходимо подтверждение возраста." }),
    /* @__PURE__ */ jsx(Link, { to: "/results", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "gap-2", children: [
      isEn ? "View Results (18+)" : "Просмотреть результаты (18+)",
      /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
    ] }) })
  ] }) }) });
};
const stepsRu = [
  { icon: Phone, title: "Запись на приём", description: "Позвоните или напишите в WhatsApp. Мы подберём удобное время и клинику.", detail: "+7 (495) 303-00-00" },
  { icon: FileText, title: "Подготовка", description: "Соберите результаты предыдущих обследований, выписки и направления.", detail: "Список — в разделе «Памятка пациенту»" },
  { icon: Stethoscope, title: "Первичная консультация", description: "Осмотр, УЗИ-диагностика, обсуждение диагноза и плана лечения.", detail: "45–60 минут" },
  { icon: ClipboardCheck, title: "Предоперационная подготовка", description: "Если нужна операция — назначим анализы и обследования, объясним каждый шаг.", detail: "Список анализов выдаём на приёме" },
  { icon: Scissors, title: "Операция", description: "Современные микрохирургические методики, щадящий наркоз, минимальная травматичность.", detail: "Стационар 1–3 дня" },
  { icon: HeartPulse, title: "Восстановление", description: "Подробные рекомендации, связь с врачом в мессенджере, контроль заживления.", detail: "Памятка + фотоконтроль" },
  { icon: CalendarCheck, title: "Контрольные осмотры", description: "Плановые визиты через 1, 3 и 6 месяцев для оценки результата.", detail: "Наблюдение до полного выздоровления" }
];
const stepsEn = [
  { icon: Phone, title: "Book an Appointment", description: "Call or message via WhatsApp. We'll find a convenient time and clinic.", detail: "+7 (495) 303-00-00" },
  { icon: FileText, title: "Preparation", description: "Gather results of previous examinations, medical records and referrals.", detail: "See 'Patient Memo' section" },
  { icon: Stethoscope, title: "Initial Consultation", description: "Examination, ultrasound diagnostics, discussion of diagnosis and treatment plan.", detail: "45–60 minutes" },
  { icon: ClipboardCheck, title: "Pre-operative Preparation", description: "If surgery is needed — we'll order tests and examinations, explaining every step.", detail: "Test list provided at the visit" },
  { icon: Scissors, title: "Surgery", description: "Modern microsurgical techniques, gentle anesthesia, minimal invasiveness.", detail: "Hospital stay 1–3 days" },
  { icon: HeartPulse, title: "Recovery", description: "Detailed recommendations, doctor contact via messenger, healing monitoring.", detail: "Instructions + photo monitoring" },
  { icon: CalendarCheck, title: "Follow-up Visits", description: "Scheduled visits at 1, 3, and 6 months to assess results.", detail: "Monitoring until full recovery" }
];
const PatientJourney = () => {
  const { t, i18n: i18n2 } = useTranslation();
  const steps = i18n2.language === "en" ? stepsEn : stepsRu;
  return /* @__PURE__ */ jsx("section", { className: "py-16 md:py-24 bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-foreground mb-4", children: t("journey.title") }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: t("journey.subtitle") })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-px hidden sm:block" }),
      /* @__PURE__ */ jsx("div", { className: "space-y-6 sm:space-y-8", children: steps.map((step, i) => {
        const Icon = step.icon;
        const isLeft = i % 2 === 0;
        return /* @__PURE__ */ jsxs("div", { className: `relative flex items-start gap-4 sm:gap-0 ${isLeft ? "sm:flex-row" : "sm:flex-row-reverse"}`, children: [
          /* @__PURE__ */ jsx("div", { className: "hidden sm:block sm:absolute sm:left-1/2 sm:-translate-x-1/2 w-3 h-3 rounded-full bg-primary z-10 mt-4" }),
          /* @__PURE__ */ jsx("div", { className: `flex-1 sm:w-[calc(50%-1.5rem)] ${isLeft ? "sm:pr-6" : "sm:pl-6"}`, children: /* @__PURE__ */ jsxs(Card, { className: "p-4 border-border hover:shadow-md transition-shadow", children: [
            /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-3 mb-2 ${isLeft ? "sm:flex-row-reverse" : ""}`, children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md flex-shrink-0", children: /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5" }) }),
              /* @__PURE__ */ jsxs("div", { className: `flex-1 ${isLeft ? "sm:text-right" : ""}`, children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-primary", children: t("journey.step", { n: i + 1 }) }),
                /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground", children: step.title })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: `text-sm text-muted-foreground mb-2 ${isLeft ? "sm:text-right" : ""}`, children: step.description }),
            /* @__PURE__ */ jsx("p", { className: `text-xs text-primary font-medium ${isLeft ? "sm:text-right" : ""}`, children: step.detail })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "hidden sm:block sm:w-[calc(50%-1.5rem)]" })
        ] }, i);
      }) })
    ] })
  ] }) });
};
const STORAGE_KEY = "exit_popup_shown";
const COOLDOWN_MS = 24 * 60 * 60 * 1e3;
const ExitIntentPopup = () => {
  const [open, setOpen] = useState(false);
  const { t, i18n: i18n2 } = useTranslation();
  const isEn = i18n2.language === "en";
  const shouldShow = useCallback(() => {
    const last = localStorage.getItem(STORAGE_KEY);
    if (last && Date.now() - Number(last) < COOLDOWN_MS) return false;
    return true;
  }, []);
  const show = useCallback(() => {
    if (!shouldShow()) return;
    setOpen(true);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }, [shouldShow]);
  useEffect(() => {
    const handler = (e) => {
      if (e.clientY <= 5) show();
    };
    document.addEventListener("mouseleave", handler);
    return () => document.removeEventListener("mouseleave", handler);
  }, [show]);
  const scrollToContact = () => {
    setOpen(false);
    setTimeout(() => {
      var _a;
      (_a = document.querySelector("#contact")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };
  const callClinic = () => {
    setOpen(false);
    window.location.href = "tel:+74953030000";
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { className: "text-xl", children: isEn ? "Have questions?" : "Запишитесь на консультацию к профессору" }),
      /* @__PURE__ */ jsx(DialogDescription, { className: "text-base", children: isEn ? "Book a consultation with Professor Tarusin or send us a message — we'll respond within 24 hours." : "Запишитесь на консультацию к профессору Тарусину или напишите нам — ответим в течение 24 часов." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 mt-2", children: [
      /* @__PURE__ */ jsxs(Button, { onClick: scrollToContact, className: "w-full", children: [
        /* @__PURE__ */ jsx(CalendarCheck, { className: "w-4 h-4 mr-2" }),
        isEn ? "Book Consultation" : "Записаться на приём"
      ] }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: callClinic, className: "w-full", children: [
        /* @__PURE__ */ jsx(Phone, { className: "w-4 h-4 mr-2" }),
        isEn ? "Call the Clinic" : "Позвонить в клинику"
      ] })
    ] })
  ] }) });
};
const KIND_META = {
  disease: { label: "Заболевание", icon: Stethoscope },
  blog: { label: "Статья", icon: FileText },
  video: { label: "Видео", icon: Video },
  clinical: { label: "Клинический случай", icon: BookOpen },
  research: { label: "Исследование", icon: Microscope },
  podcast: { label: "Подкаст", icon: Headphones },
  video_file: { label: "Видео", icon: Film }
};
const POPULAR = [
  "У ребёнка не опустилось яичко",
  "Когда оперировать варикоцеле?",
  "Преждевременная эякуляция, лечение",
  "Фимоз у мальчика 5 лет",
  "Водянка яичка у новорождённого",
  "Гипоспадия — когда оперировать",
  "Боль в мошонке у подростка",
  "Энурез у ребёнка 7 лет"
];
const SmartSearch = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [focused, setFocused] = useState(false);
  const [autocomplete, setAutocomplete] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef(null);
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setAutocomplete([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const term = `%${q}%`;
        const sb = supabase;
        const [diseases, blogs, videos] = await Promise.all([
          sb.from("disease_articles").select("id, title, slug").ilike("title", term).eq("is_published", true).limit(4),
          sb.from("blog_posts").select("id, title, slug").ilike("title", term).limit(4),
          sb.from("video_cases").select("id, title").ilike("title", term).limit(3)
        ]);
        const items = [];
        (diseases.data ?? []).forEach((r) => items.push({ kind: "disease", title: r.title, url: `/for-parents/${r.slug}` }));
        (blogs.data ?? []).forEach((r) => items.push({ kind: "blog", title: r.title, url: `/blog#post-${r.slug ?? r.id}` }));
        (videos.data ?? []).forEach((r) => items.push({ kind: "video", title: r.title, url: `/video-cases#video-${r.id}` }));
        setAutocomplete(items.slice(0, 8));
      } catch {
        setAutocomplete([]);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [query]);
  const runSearch = async (q) => {
    if (!q.trim() || q.trim().length < 3) return;
    setFocused(false);
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const { data, error: error2 } = await supabase.functions.invoke("smart-search", { body: { query: q } });
      if (error2) throw error2;
      const list = (data == null ? void 0 : data.results) ?? [];
      setResults(list);
      if (list.length) {
        saveTrail({
          query: q.trim(),
          results: list.map((r) => ({ kind: r.kind, id: r.id, title: r.title, url: r.url, category: r.category, reason: r.reason }))
        });
      }
    } catch (e) {
      setError("Не удалось выполнить поиск. Попробуйте чуть позже.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (results) return;
    const trail = loadTrail();
    if (!trail) return;
    setQuery(trail.query);
    setResults(trail.results.map((r) => ({
      kind: r.kind,
      id: r.id,
      title: r.title,
      url: r.url,
      excerpt: "",
      reason: r.reason,
      category: r.category
    })));
    if (typeof window !== "undefined" && window.location.search.includes("smart=restore")) {
      setTimeout(() => {
        var _a;
        (_a = document.getElementById("smart-search")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, []);
  const onSubmit = (e) => {
    e.preventDefault();
    runSearch(query);
  };
  const popularFiltered = (() => {
    const q = query.trim().toLowerCase();
    const base = q ? POPULAR.filter((p) => p.toLowerCase().includes(q)) : POPULAR;
    return base.slice(0, 5);
  })();
  const dropdownItems = [
    ...autocomplete,
    ...popularFiltered.map((title) => ({ kind: "popular", title }))
  ];
  const showDropdown = focused && dropdownItems.length > 0;
  const pickItem = (item) => {
    if (item.url) {
      window.location.href = item.url;
      return;
    }
    setQuery(item.title);
    runSearch(item.title);
  };
  const onKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, dropdownItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      pickItem(dropdownItems[activeIdx]);
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };
  return /* @__PURE__ */ jsx("section", { id: "smart-search", className: "container mx-auto px-4 py-10 md:py-14 scroll-mt-24", children: /* @__PURE__ */ jsxs("div", { className: "relative max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-2xl opacity-60", "aria-hidden": true }),
    /* @__PURE__ */ jsxs("div", { className: "relative rounded-3xl border border-border bg-card/95 backdrop-blur-sm shadow-xl p-6 md:p-10", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-3", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "w-3.5 h-3.5" }),
        "Умный поиск"
      ] }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground mb-2", children: "Не тратьте время на поиски — спросите своими словами" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6 max-w-2xl", children: "На сайте собран большой объём материалов о заболеваниях и методах лечения: статьи, видео, клинические случаи и исследования. Напишите свой вопрос — я подберу для Вас самые подходящие материалы." }),
      /* @__PURE__ */ jsxs("form", { onSubmit, className: "flex flex-col sm:flex-row gap-2", children: [
        /* @__PURE__ */ jsxs("div", { ref: wrapRef, className: "relative flex-1", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: query,
              onChange: (e) => {
                setQuery(e.target.value);
                setActiveIdx(-1);
              },
              onFocus: () => setFocused(true),
              onKeyDown,
              placeholder: "Например: водянка яичка у ребёнка 3 лет",
              className: "pl-10 h-12 text-base",
              maxLength: 300,
              autoComplete: "off"
            }
          ),
          showDropdown && /* @__PURE__ */ jsxs("div", { className: "absolute z-50 left-0 right-0 top-[calc(100%+6px)] rounded-xl border border-border bg-popover shadow-2xl overflow-hidden", children: [
            autocomplete.length > 0 && /* @__PURE__ */ jsx("div", { className: "px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground", children: "Подходящие материалы" }),
            autocomplete.map((item, idx) => {
              const Meta = KIND_META[item.kind];
              const Icon = (Meta == null ? void 0 : Meta.icon) ?? FileText;
              const active = idx === activeIdx;
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onMouseDown: (e) => {
                    e.preventDefault();
                    pickItem(item);
                  },
                  onMouseEnter: () => setActiveIdx(idx),
                  className: `w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${active ? "bg-accent" : "hover:bg-accent/60"}`,
                  children: [
                    /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4 text-primary shrink-0" }),
                    /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", children: item.title }),
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: Meta == null ? void 0 : Meta.label })
                  ]
                },
                `ac-${idx}`
              );
            }),
            popularFiltered.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
              autocomplete.length > 0 && /* @__PURE__ */ jsx("div", { className: "h-px bg-border" }),
              /* @__PURE__ */ jsx("div", { className: "px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground", children: "Популярные вопросы" }),
              popularFiltered.map((title, i) => {
                const idx = autocomplete.length + i;
                const active = idx === activeIdx;
                return /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onMouseDown: (e) => {
                      e.preventDefault();
                      pickItem({ kind: "popular", title });
                    },
                    onMouseEnter: () => setActiveIdx(idx),
                    className: `w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${active ? "bg-accent" : "hover:bg-accent/60"}`,
                    children: [
                      /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4 text-muted-foreground shrink-0" }),
                      /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", children: title })
                    ]
                  },
                  `pop-${i}`
                );
              })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Button, { type: "submit", size: "lg", className: "h-12 px-6", disabled: loading || query.trim().length < 3, children: [
          loading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }),
          loading ? "Подбираю..." : "Найти"
        ] })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-destructive", children: error }),
      loading && /* @__PURE__ */ jsx("div", { className: "mt-6 space-y-3", children: [0, 1, 2].map((i) => /* @__PURE__ */ jsx("div", { className: "h-20 rounded-xl bg-muted/40 animate-pulse" }, i)) }),
      results && !loading && /* @__PURE__ */ jsx("div", { className: "mt-6", children: results.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "По Вашему запросу подходящих материалов не нашлось. Попробуйте переформулировать вопрос или воспользуйтесь чатом внизу страницы." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mb-3", children: [
          "Нашёл ",
          results.length,
          " подходящих материалов:"
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: results.map((r) => {
          const Meta = KIND_META[r.kind];
          const Icon = Meta.icon;
          return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
            Link,
            {
              to: r.url,
              className: "group flex gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-accent/5 transition-all",
              children: [
                /* @__PURE__ */ jsx("div", { className: "shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center", children: /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5" }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wider font-semibold text-primary/80", children: Meta.label }),
                    r.category && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground", children: [
                      "· ",
                      r.category
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground group-hover:text-primary transition-colors leading-snug", children: r.title }),
                  r.reason && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1 line-clamp-2", children: r.reason })
                ] }),
                /* @__PURE__ */ jsx(ArrowRight, { className: "shrink-0 w-4 h-4 text-muted-foreground self-center group-hover:text-primary group-hover:translate-x-1 transition-all" })
              ]
            }
          ) }, `${r.kind}-${r.id}`);
        }) })
      ] }) })
    ] })
  ] }) });
};
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Physician",
      "@id": "https://tarusin.pro/#person",
      "name": "Профессор Тарусин Дмитрий Игоревич",
      "alternateName": "Tarusin Dmitry Igorevich",
      "image": "https://tarusin.pro/assets/professor-photo-DpatXHVQ.png",
      "url": "https://tarusin.pro/",
      "telephone": "+7-495-303-00-00",
      "medicalSpecialty": [
        "PediatricUrology",
        "Andrology",
        "PediatricSurgery",
        "Microsurgery",
        "Ultrasound",
        "Sexology"
      ],
      "description": "Профессор, доктор медицинских наук, основатель детской урологии-андрологии в России. 42 года клинического опыта.",
      "knowsLanguage": ["ru", "en"],
      "memberOf": {
        "@type": "Organization",
        "name": "Российская академия естественных наук (РАЕН)"
      },
      "alumniOf": {
        "@type": "Organization",
        "name": "РМАПО"
      },
      "worksFor": [
        {
          "@type": "MedicalClinic",
          "name": "Клиника доктора Матара",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Коровинское шоссе, 9, корп. 2",
            "addressLocality": "Москва",
            "addressCountry": "RU"
          },
          "telephone": "+7-495-303-00-00"
        }
      ],
      "sameAs": [
        "https://www.instagram.com/androlog_di",
        "https://t.me/+tMWpYqcllzo3NmYy",
        "https://vk.com/androlog_di",
        "https://dzen.ru/androlog_di",
        "https://www.youtube.com/@androlog_di"
      ]
    },
    {
      "@type": "AggregateRating",
      "itemReviewed": { "@id": "https://tarusin.pro/#person" },
      "ratingValue": "4.9",
      "bestRating": "5",
      "ratingCount": "85",
      "reviewCount": "85"
    }
  ]
};
const Index = () => {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background pb-14", children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: "Проф. Тарусин Д.И. — детский уролог-андролог | Москва",
        description: "Профессор Тарусин Дмитрий Игоревич — основатель детской урологии-андрологии в России. Доктор медицинских наук, 42 года опыта. Запись на приём.",
        path: "/"
      }
    ),
    /* @__PURE__ */ jsx(Helmet, { children: /* @__PURE__ */ jsx("script", { type: "application/ld+json", children: JSON.stringify(jsonLd) }) }),
    /* @__PURE__ */ jsx(SchemaOrg, {}),
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsxs("main", { children: [
      /* @__PURE__ */ jsx(HeroSection, {}),
      /* @__PURE__ */ jsx(SmartSearch, {}),
      /* @__PURE__ */ jsx(AboutSection, {}),
      /* @__PURE__ */ jsx(PioneersSection, {}),
      /* @__PURE__ */ jsx(ProfessorMessageSection, {}),
      /* @__PURE__ */ jsx(DiagnosticChecklist, {}),
      /* @__PURE__ */ jsx(ResultsCTA, {}),
      /* @__PURE__ */ jsx(PatientJourney, {}),
      /* @__PURE__ */ jsx(ConsultationsSection, {}),
      /* @__PURE__ */ jsx(CoursesSection, {}),
      /* @__PURE__ */ jsx(ReviewsSection, {}),
      /* @__PURE__ */ jsx(QASection, {}),
      /* @__PURE__ */ jsx(ContactSection, {})
    ] }),
    /* @__PURE__ */ jsx(Footer, {}),
    /* @__PURE__ */ jsx(StickyBottomPanel, {}),
    /* @__PURE__ */ jsx(ExitIntentPopup, {})
  ] });
};
const NotFound = () => {
  const location = useLocation();
  const { i18n: i18n2 } = useTranslation();
  const isEn = i18n2.language === "en";
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen items-center justify-center bg-muted", children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: isEn ? "404 — Page Not Found | Prof. Tarusin D.I." : "404 — страница не найдена | проф. Тарусин Д.И.",
        description: isEn ? "The page you are looking for does not exist or has been moved. Return to the home page of Prof. Tarusin D.I.'s official site." : "Запрошенная страница не существует или была перемещена. Вернитесь на главную страницу официального сайта профессора Тарусина Д.И.",
        path: location.pathname
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "mb-4 text-4xl font-bold", children: "404" }),
      /* @__PURE__ */ jsx("p", { className: "mb-4 text-xl text-muted-foreground", children: isEn ? "Oops! Page not found" : "Страница не найдена" }),
      /* @__PURE__ */ jsx("a", { href: "/", className: "text-primary underline hover:text-primary/90", children: isEn ? "Return to Home" : "На главную" })
    ] })
  ] });
};
const SUPABASE_URL$1 = "https://bpbwkizvvythqotcyfii.supabase.co";
const SUPABASE_ANON$1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYndraXp2dnl0aHFvdGN5ZmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1Njc2MTQsImV4cCI6MjA4NTE0MzYxNH0.iv_pLSj27wOMUmfY0HOJ91bPm1u-b4wjiScYrP03bww";
const HEADERS$1 = {
  apikey: SUPABASE_ANON$1,
  Authorization: `Bearer ${SUPABASE_ANON$1}`,
  Accept: "application/json"
};
async function fetchJson$1(tag, url, init) {
  let res;
  try {
    res = await fetch(url, { ...init, headers: { ...HEADERS$1, ...(init == null ? void 0 : init.headers) || {} } });
  } catch (e) {
    console.warn(`[diseaseLoader:${tag}] network error:`, (e == null ? void 0 : e.message) || e);
    return null;
  }
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) {
    let bodyPreview = "";
    try {
      bodyPreview = (await res.text()).slice(0, 200);
    } catch {
    }
    console.warn(
      `[diseaseLoader:${tag}] HTTP ${res.status} ${res.statusText} (ct=${ct || "n/a"}) — ${bodyPreview}`
    );
    return null;
  }
  if (!ct.toLowerCase().includes("application/json")) {
    let bodyPreview = "";
    try {
      bodyPreview = (await res.text()).slice(0, 120);
    } catch {
    }
    console.warn(
      `[diseaseLoader:${tag}] non-JSON response (ct=${ct || "empty"}) — likely proxy/HTML fallback. Preview: ${bodyPreview}`
    );
    return null;
  }
  try {
    return await res.json();
  } catch (e) {
    console.warn(`[diseaseLoader:${tag}] JSON parse error:`, (e == null ? void 0 : e.message) || e);
    return null;
  }
}
async function diseaseLoader({ params }) {
  const slug = params.slug;
  const empty = { article: null, related: [] };
  if (!slug) return empty;
  const columns = [
    "id",
    "slug",
    "title",
    "description",
    "category",
    "age_group",
    "article_content",
    "video_path",
    "audio_path",
    "thumbnail_path",
    "keywords"
  ].join(",");
  const articleUrl = `${SUPABASE_URL$1}/rest/v1/disease_articles?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=${columns}&limit=1`;
  const articles = await fetchJson$1("article", articleUrl);
  const article = Array.isArray(articles) ? articles[0] : null;
  if (!article) return empty;
  const relUrl = `${SUPABASE_URL$1}/rest/v1/disease_articles?category=eq.${encodeURIComponent(article.category)}&is_published=eq.true&id=neq.${article.id}&select=id,slug,title,description,category&limit=3`;
  const relatedRaw = await fetchJson$1("related", relUrl);
  const related = Array.isArray(relatedRaw) ? relatedRaw : [];
  return { article, related };
}
async function diseaseStaticPaths() {
  const url = `${SUPABASE_URL$1}/rest/v1/disease_articles?is_published=eq.true&select=slug`;
  const rows = await fetchJson$1("static-paths", url);
  if (!Array.isArray(rows)) return [];
  return rows.filter((r) => r.slug).map((r) => `/for-parents/${r.slug}/`);
}
const SUPABASE_URL = "https://bpbwkizvvythqotcyfii.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYndraXp2dnl0aHFvdGN5ZmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1Njc2MTQsImV4cCI6MjA4NTE0MzYxNH0.iv_pLSj27wOMUmfY0HOJ91bPm1u-b4wjiScYrP03bww";
const HEADERS = {
  apikey: SUPABASE_ANON,
  Authorization: `Bearer ${SUPABASE_ANON}`,
  Accept: "application/json"
};
async function fetchJson(tag, url) {
  let res;
  try {
    res = await fetch(url, { headers: HEADERS });
  } catch (e) {
    console.warn(`[parentsLoader:${tag}] network error:`, (e == null ? void 0 : e.message) || e);
    return null;
  }
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) {
    let bodyPreview = "";
    try {
      bodyPreview = (await res.text()).slice(0, 200);
    } catch {
    }
    console.warn(
      `[parentsLoader:${tag}] HTTP ${res.status} ${res.statusText} (ct=${ct || "n/a"}) — ${bodyPreview}`
    );
    return null;
  }
  if (!ct.toLowerCase().includes("application/json")) {
    let bodyPreview = "";
    try {
      bodyPreview = (await res.text()).slice(0, 120);
    } catch {
    }
    console.warn(
      `[parentsLoader:${tag}] non-JSON response (ct=${ct || "empty"}) — likely proxy/HTML fallback. Preview: ${bodyPreview}`
    );
    return null;
  }
  try {
    return await res.json();
  } catch (e) {
    console.warn(`[parentsLoader:${tag}] JSON parse error:`, (e == null ? void 0 : e.message) || e);
    return null;
  }
}
async function parentsLoader() {
  const columns = [
    "id",
    "slug",
    "title",
    "description",
    "category",
    "sort_order",
    "age_group",
    "keywords",
    "video_path",
    "audio_path",
    "thumbnail_path",
    "article_content"
  ].join(",");
  const url = `${SUPABASE_URL}/rest/v1/disease_articles?is_published=eq.true&select=${columns}&order=sort_order.asc`;
  const articles = await fetchJson("list", url);
  return { articles: Array.isArray(articles) ? articles : [] };
}
const page = (loader) => async () => {
  const mod = await loader();
  return { Component: mod.default };
};
const lazyForParents = page(() => import("./assets/ForParents-CW_QLsVx.js"));
const lazyDiseaseDetail = page(() => import("./assets/DiseaseDetailPage-BH_bZWma.js"));
const lazyParentsMaterialLanding = page(() => import("./assets/ParentsMaterialLanding-DXX1nlR7.js"));
const lazyForDoctors = page(() => import("./assets/ForDoctors-BPJ3kbic.js"));
const lazyMedia = page(() => import("./assets/Media-Cv9QqLGQ.js"));
const lazyVideos = page(() => import("./assets/Videos-DYROpVgc.js"));
const lazyReviews = page(() => import("./assets/Reviews-B08GGtvm.js"));
const lazyContacts = page(() => import("./assets/Contacts-B-lqnJFU.js"));
const lazyPublications = page(() => import("./assets/Publications-DuO_1WCc.js"));
const lazyMethodologies = page(() => import("./assets/Methodologies-CaBLnnGA.js"));
const lazyTravelNotes = page(() => import("./assets/TravelNotes-BOcp64ql.js"));
const lazyMasterclasses = page(() => import("./assets/Masterclasses-Beu0ZwRx.js"));
const lazyClinicalCases = page(() => import("./assets/ClinicalCases-5JK96aJ5.js"));
const lazyBlog = page(() => import("./assets/Blog-BljlCIJM.js"));
const lazyVideoCases = page(() => import("./assets/VideoCases-CfprBOvO.js"));
const lazyTeam = page(() => import("./assets/Team-Cp_7cKGK.js"));
const lazyQA = page(() => import("./assets/QA-DIRvjiAZ.js"));
const lazyResearch = page(() => import("./assets/Research-CmwXV-oN.js"));
const lazyPrivacy = page(() => import("./assets/PrivacyPolicy-DO3WQvAn.js"));
const lazyConsent = page(() => import("./assets/Consent-CSr_fczJ.js"));
const lazyResults = page(() => import("./assets/Results-CkacERGZ.js"));
const lazySelfCheck = page(() => import("./assets/SelfCheck-D7QJH3_3.js"));
const lazySelfCheckDetail = page(() => import("./assets/SelfCheckDetail--XUCIk-J.js"));
const Auth = lazy(() => import("./assets/Auth-CwVkdTUy.js"));
const PatientPortal = lazy(() => import("./assets/PatientPortal-CtKsxUfE.js"));
const Admin = lazy(() => import("./assets/Admin-PORww6DL.js"));
const AdminRequests = lazy(() => import("./assets/AdminRequests-BP4qUFHb.js"));
const AdminCertificates = lazy(() => import("./assets/AdminCertificates-CRSAlLRy.js"));
const AdminPrescriptions = lazy(() => import("./assets/AdminPrescriptions-CgYoTGHV.js"));
const AdminQuestions = lazy(() => import("./assets/AdminQuestions-AQBFihOK.js"));
const AdminOperationsJournal = lazy(() => import("./assets/AdminOperationsJournal-Ddj2y_nR.js"));
const AdminPatientVisits = lazy(() => import("./assets/AdminPatientVisits-DjG0PoJH.js"));
const AdminPatientVisitNew = lazy(() => import("./assets/AdminPatientVisitNew-DckYPLmD.js"));
const AdminPatientVisitDetail = lazy(() => import("./assets/AdminPatientVisitDetail-BtaRyVo-.js"));
const AdminPatientVisitPrint = lazy(() => import("./assets/AdminPatientVisitPrint-DhuUUy-m.js"));
const AdminDiseaseArticles = lazy(() => import("./assets/AdminDiseaseArticles-VHi1AKYq.js"));
const AdminParentsMaterials = lazy(() => import("./assets/AdminParentsMaterials-_d9H_M-l.js"));
lazy(() => import("./assets/ParentsMaterialLanding-DXX1nlR7.js"));
const AdminPatientCards = lazy(() => import("./assets/AdminPatientCards-CmdQOGHv.js"));
const AdminConsultations = lazy(() => import("./assets/AdminConsultations-Bo6_owit.js"));
const AdminSelfCheck = lazy(() => import("./assets/AdminSelfCheck-BuewoeAB.js"));
const TreatmentPlans = lazy(() => import("./assets/TreatmentPlans-BLDgCbzs.js"));
const TreatmentPlanEditor = lazy(() => import("./assets/TreatmentPlanEditor-BkiHgVy3.js"));
const TreatmentPlanPrint = lazy(() => import("./assets/TreatmentPlanPrint-o8kf2kHs.js"));
const TreatmentPlanMemo = lazy(() => import("./assets/TreatmentPlanMemo-BpOeGWLi.js"));
const TreatmentCatalog = lazy(() => import("./assets/TreatmentCatalog-C5U_rCQd.js"));
const TreatmentTemplates = lazy(() => import("./assets/TreatmentTemplates-CW-rTVPz.js"));
const TreatmentTemplateEditor = lazy(() => import("./assets/TreatmentTemplateEditor-D_6mrmUU.js"));
const AdminLabTestsCatalog = lazy(() => import("./assets/AdminLabTestsCatalog-h6sNUusl.js"));
const AdminRepertory = lazy(() => import("./assets/AdminRepertory-Dgmh2x_3.js"));
const AdminRepertoryByComplaint = lazy(() => import("./assets/AdminRepertoryByComplaint-BHilgWYA.js"));
const AdminTranslationQueue = lazy(() => import("./assets/AdminTranslationQueue-kPfQoX2R.js"));
const AdminAcupoints = lazy(() => import("./assets/AdminAcupoints-dijL3A6p.js"));
const AdminAcupointsAtlas = lazy(() => import("./assets/AdminAcupointsAtlas-DsqBMIMz.js"));
const AdminAcupunctureProtocols = lazy(() => import("./assets/AdminAcupunctureProtocols-BbEGgPb2.js"));
const AdminAcupunctureProtocolEditor = lazy(() => import("./assets/AdminAcupunctureProtocolEditor-DD05AIrS.js"));
const AdminSystemSettings = lazy(() => import("./assets/AdminSystemSettings-CvdBW_Z8.js"));
const AdminVisitTemplates = lazy(() => import("./assets/AdminVisitTemplates-B8OBUUNC.js"));
const AdminSystemBackup = lazy(() => import("./assets/AdminSystemBackup-D5hPAbIg.js"));
const AdminMedicalReferences = lazy(() => import("./assets/AdminMedicalReferences-DGv1fsA3.js"));
const AdminAnalytics = lazy(() => import("./assets/AdminAnalytics-BxdeK6nJ.js"));
const AdminPodcastSources = lazy(() => import("./assets/AdminPodcastSources-CmrIny1Z.js"));
const AdminArticleOrchestrator = lazy(() => import("./assets/AdminArticleOrchestrator-PhkL6kZo.js"));
const AdminOrchestratorMetrics = lazy(() => import("./assets/AdminOrchestratorMetrics-B0LLEV8D.js"));
const AdminArticleImport = lazy(() => import("./assets/AdminArticleImport-sgqxuCS1.js"));
const AdminArticleUpload = lazy(() => import("./assets/AdminArticleUpload-ShZNCh2k.js"));
const AdminPatientDetail = lazy(() => import("./assets/AdminPatientDetail-gC32a4xg.js"));
const AdminPatientMetabolicMap = lazy(() => import("./assets/AdminPatientMetabolicMap-Ce2zlMto.js"));
const AdminPatientMetabolicMapPrint = lazy(() => import("./assets/AdminPatientMetabolicMapPrint-BhqBOzcy.js"));
const AdminMetabolicCohort = lazy(() => import("./assets/AdminMetabolicCohort-B2iTZy3n.js"));
const ParentMetabolicMap = lazy(() => import("./assets/ParentMetabolicMap-fm8CGJlt.js"));
const AdminPatients = lazy(() => import("./assets/AdminPatients-Cbrtxjpy.js"));
const AdminPatientNew = lazy(
  () => import("./assets/AdminPatientForm-DHNusKx1.js").then((mod) => {
    const AdminPatientForm = mod.default;
    return { default: () => /* @__PURE__ */ jsx(AdminPatientForm, { mode: "create" }) };
  })
);
const AdminPatientEdit = lazy(
  () => import("./assets/AdminPatientForm-DHNusKx1.js").then((mod) => {
    const AdminPatientForm = mod.default;
    return { default: () => /* @__PURE__ */ jsx(AdminPatientForm, { mode: "edit" }) };
  })
);
const TreatmentPlanCompare = lazy(() => import("./assets/TreatmentPlanCompare-DSxkXQUg.js"));
const PublicTreatmentPlan = lazy(() => import("./assets/PublicTreatmentPlan-C1Jwgimp.js"));
const Cabinet = lazy(() => import("./assets/Cabinet-B48uQDBB.js"));
const CabinetAgent = lazy(() => import("./assets/CabinetAgent-DMLhueep.js"));
const CabinetVault = lazy(() => import("./assets/CabinetVault-Cy5n0giq.js"));
const RuRoot = () => /* @__PURE__ */ jsx(LangBoundary, { lang: "ru", children: /* @__PURE__ */ jsx(RootLayout, {}) });
const EnRoot = () => /* @__PURE__ */ jsx(LangBoundary, { lang: "en", children: /* @__PURE__ */ jsx(RootLayout, {}) });
const ruPublicChildren = [
  { index: true, Component: Index },
  { path: "for-parents", lazy: lazyForParents, entry: "src/pages/ForParents.tsx", loader: parentsLoader },
  { path: "for-parents/materials/:slug", lazy: lazyParentsMaterialLanding, entry: "src/pages/ParentsMaterialLanding.tsx" },
  {
    path: "for-parents/:slug",
    lazy: lazyDiseaseDetail,
    entry: "src/pages/DiseaseDetailPage.tsx",
    loader: diseaseLoader,
    getStaticPaths: diseaseStaticPaths
  },
  { path: "for-doctors", lazy: lazyForDoctors, entry: "src/pages/ForDoctors.tsx" },
  { path: "media", lazy: lazyMedia, entry: "src/pages/Media.tsx" },
  { path: "videos", lazy: lazyVideos, entry: "src/pages/Videos.tsx" },
  { path: "reviews", lazy: lazyReviews, entry: "src/pages/Reviews.tsx" },
  { path: "contacts", lazy: lazyContacts, entry: "src/pages/Contacts.tsx" },
  { path: "publications", lazy: lazyPublications, entry: "src/pages/Publications.tsx" },
  { path: "methodologies", lazy: lazyMethodologies, entry: "src/pages/Methodologies.tsx" },
  { path: "travel-notes", lazy: lazyTravelNotes, entry: "src/pages/TravelNotes.tsx" },
  { path: "masterclasses", lazy: lazyMasterclasses, entry: "src/pages/Masterclasses.tsx" },
  { path: "clinical-cases", lazy: lazyClinicalCases, entry: "src/pages/ClinicalCases.tsx" },
  { path: "blog", lazy: lazyBlog, entry: "src/pages/Blog.tsx" },
  { path: "video-cases", lazy: lazyVideoCases, entry: "src/pages/VideoCases.tsx" },
  { path: "team", lazy: lazyTeam, entry: "src/pages/Team.tsx" },
  { path: "qa", lazy: lazyQA, entry: "src/pages/QA.tsx" },
  { path: "research", lazy: lazyResearch, entry: "src/pages/Research.tsx" },
  { path: "privacy-policy", lazy: lazyPrivacy, entry: "src/pages/PrivacyPolicy.tsx" },
  { path: "consent", lazy: lazyConsent, entry: "src/pages/Consent.tsx" },
  { path: "results", lazy: lazyResults, entry: "src/pages/Results.tsx" },
  { path: "self-check", lazy: lazySelfCheck, entry: "src/pages/SelfCheck.tsx" },
  { path: "self-check/:slug", lazy: lazySelfCheckDetail, entry: "src/pages/SelfCheckDetail.tsx" }
];
const enPublicChildren = [
  { index: true, Component: Index, entry: "src/pages/Index.tsx" },
  { path: "for-parents", lazy: lazyForParents, entry: "src/pages/ForParents.tsx" },
  { path: "for-parents/materials/:slug", lazy: lazyParentsMaterialLanding, entry: "src/pages/ParentsMaterialLanding.tsx" },
  { path: "for-parents/:slug", lazy: lazyDiseaseDetail, entry: "src/pages/DiseaseDetailPage.tsx" },
  { path: "for-doctors", lazy: lazyForDoctors, entry: "src/pages/ForDoctors.tsx" },
  { path: "media", lazy: lazyMedia, entry: "src/pages/Media.tsx" },
  { path: "videos", lazy: lazyVideos, entry: "src/pages/Videos.tsx" },
  { path: "reviews", lazy: lazyReviews, entry: "src/pages/Reviews.tsx" },
  { path: "contacts", lazy: lazyContacts, entry: "src/pages/Contacts.tsx" },
  { path: "publications", lazy: lazyPublications, entry: "src/pages/Publications.tsx" },
  { path: "methodologies", lazy: lazyMethodologies, entry: "src/pages/Methodologies.tsx" },
  { path: "travel-notes", lazy: lazyTravelNotes, entry: "src/pages/TravelNotes.tsx" },
  { path: "masterclasses", lazy: lazyMasterclasses, entry: "src/pages/Masterclasses.tsx" },
  { path: "clinical-cases", lazy: lazyClinicalCases, entry: "src/pages/ClinicalCases.tsx" },
  { path: "blog", lazy: lazyBlog, entry: "src/pages/Blog.tsx" },
  { path: "video-cases", lazy: lazyVideoCases, entry: "src/pages/VideoCases.tsx" },
  { path: "team", lazy: lazyTeam, entry: "src/pages/Team.tsx" },
  { path: "qa", lazy: lazyQA, entry: "src/pages/QA.tsx" },
  { path: "research", lazy: lazyResearch, entry: "src/pages/Research.tsx" },
  { path: "privacy-policy", lazy: lazyPrivacy, entry: "src/pages/PrivacyPolicy.tsx" },
  { path: "consent", lazy: lazyConsent, entry: "src/pages/Consent.tsx" },
  { path: "results", lazy: lazyResults, entry: "src/pages/Results.tsx" },
  { path: "self-check", lazy: lazySelfCheck, entry: "src/pages/SelfCheck.tsx" },
  { path: "self-check/:slug", lazy: lazySelfCheckDetail, entry: "src/pages/SelfCheckDetail.tsx" }
];
const routes = [
  {
    path: "/",
    element: /* @__PURE__ */ jsx(RuRoot, {}),
    errorElement: /* @__PURE__ */ jsx(RouteErrorBoundary, {}),
    children: [
      ...ruPublicChildren,
      // --- Приватные / служебные роуты: исключены из SSG ---
      { path: "auth", Component: Auth, entry: "src/pages/Auth.tsx" },
      { path: "portal", Component: PatientPortal, entry: "src/pages/PatientPortal.tsx" },
      { path: "admin", Component: Admin, entry: "src/pages/Admin.tsx" },
      { path: "admin/requests", Component: AdminRequests, entry: "src/pages/AdminRequests.tsx" },
      { path: "admin/certificates", Component: AdminCertificates, entry: "src/pages/AdminCertificates.tsx" },
      { path: "admin/prescriptions", Component: AdminPrescriptions, entry: "src/pages/AdminPrescriptions.tsx" },
      { path: "admin/questions", Component: AdminQuestions, entry: "src/pages/AdminQuestions.tsx" },
      { path: "admin/operations-journal", Component: AdminOperationsJournal, entry: "src/pages/AdminOperationsJournal.tsx" },
      { path: "admin/visits", Component: AdminPatientVisits, entry: "src/pages/AdminPatientVisits.tsx" },
      { path: "admin/visits/new", Component: AdminPatientVisitNew, entry: "src/pages/AdminPatientVisitNew.tsx" },
      { path: "admin/visits/:id", Component: AdminPatientVisitDetail, entry: "src/pages/AdminPatientVisitDetail.tsx" },
      { path: "admin/visits/:id/print", Component: AdminPatientVisitPrint, entry: "src/pages/AdminPatientVisitPrint.tsx" },
      { path: "admin/visit-templates", Component: AdminVisitTemplates, entry: "src/pages/AdminVisitTemplates.tsx" },
      { path: "admin/disease-articles", Component: AdminDiseaseArticles, entry: "src/pages/AdminDiseaseArticles.tsx" },
      { path: "admin/parents-materials", Component: AdminParentsMaterials, entry: "src/pages/AdminParentsMaterials.tsx" },
      { path: "admin/patient-cards", Component: AdminPatientCards, entry: "src/pages/AdminPatientCards.tsx" },
      { path: "admin/consultations", Component: AdminConsultations, entry: "src/pages/AdminConsultations.tsx" },
      { path: "admin/self-check", Component: AdminSelfCheck, entry: "src/pages/AdminSelfCheck.tsx" },
      { path: "admin/treatment-plans", Component: TreatmentPlans, entry: "src/pages/TreatmentPlans.tsx" },
      { path: "admin/treatment-plans/new", Component: TreatmentPlanEditor, entry: "src/pages/TreatmentPlanEditor.tsx" },
      { path: "admin/treatment-plans/:id", Component: TreatmentPlanEditor, entry: "src/pages/TreatmentPlanEditor.tsx" },
      { path: "admin/treatment-plans/:id/print", Component: TreatmentPlanPrint, entry: "src/pages/TreatmentPlanPrint.tsx" },
      { path: "admin/treatment-plans/:id/memo", Component: TreatmentPlanMemo, entry: "src/pages/TreatmentPlanMemo.tsx" },
      { path: "admin/treatment-catalog", Component: TreatmentCatalog, entry: "src/pages/TreatmentCatalog.tsx" },
      { path: "admin/lab-tests-catalog", Component: AdminLabTestsCatalog, entry: "src/pages/AdminLabTestsCatalog.tsx" },
      { path: "admin/repertory", Component: AdminRepertory, entry: "src/pages/AdminRepertory.tsx" },
      { path: "admin/repertory/by-complaint", Component: AdminRepertoryByComplaint, entry: "src/pages/AdminRepertoryByComplaint.tsx" },
      { path: "admin/translation-queue", Component: AdminTranslationQueue, entry: "src/pages/AdminTranslationQueue.tsx" },
      { path: "admin/acupoints", Component: AdminAcupoints, entry: "src/pages/AdminAcupoints.tsx" },
      { path: "admin/acupoints/atlas", Component: AdminAcupointsAtlas, entry: "src/pages/AdminAcupointsAtlas.tsx" },
      { path: "admin/acupoints/:who_code", Component: AdminAcupoints, entry: "src/pages/AdminAcupoints.tsx" },
      { path: "admin/acupuncture-protocols", Component: AdminAcupunctureProtocols, entry: "src/pages/AdminAcupunctureProtocols.tsx" },
      { path: "admin/acupuncture-protocols/:id", Component: AdminAcupunctureProtocolEditor, entry: "src/pages/AdminAcupunctureProtocolEditor.tsx" },
      { path: "admin/treatment-templates", Component: TreatmentTemplates, entry: "src/pages/TreatmentTemplates.tsx" },
      { path: "admin/treatment-templates/new", Component: TreatmentTemplateEditor, entry: "src/pages/TreatmentTemplateEditor.tsx" },
      { path: "admin/treatment-templates/:id", Component: TreatmentTemplateEditor, entry: "src/pages/TreatmentTemplateEditor.tsx" },
      { path: "admin/system-settings", Component: AdminSystemSettings, entry: "src/pages/AdminSystemSettings.tsx" },
      { path: "admin/medical-references", Component: AdminMedicalReferences, entry: "src/pages/AdminMedicalReferences.tsx" },
      { path: "admin/system-backup", Component: AdminSystemBackup, entry: "src/pages/AdminSystemBackup.tsx" },
      { path: "admin/analytics", Component: AdminAnalytics, entry: "src/pages/AdminAnalytics.tsx" },
      { path: "admin/podcast-sources", Component: AdminPodcastSources, entry: "src/pages/AdminPodcastSources.tsx" },
      { path: "admin/article-orchestrator", Component: AdminArticleOrchestrator, entry: "src/pages/AdminArticleOrchestrator.tsx" },
      { path: "admin/orchestrator-metrics", Component: AdminOrchestratorMetrics, entry: "src/pages/AdminOrchestratorMetrics.tsx" },
      { path: "admin/article-import", Component: AdminArticleImport, entry: "src/pages/AdminArticleImport.tsx" },
      { path: "admin/article-upload", Component: AdminArticleUpload, entry: "src/pages/AdminArticleUpload.tsx" },
      { path: "admin/patients", Component: AdminPatients, entry: "src/pages/AdminPatients.tsx" },
      { path: "admin/patients/new", Component: AdminPatientNew, entry: "src/pages/AdminPatientForm.tsx" },
      { path: "admin/patients/:id/edit", Component: AdminPatientEdit, entry: "src/pages/AdminPatientForm.tsx" },
      { path: "admin/patients/:id", Component: AdminPatientDetail, entry: "src/pages/AdminPatientDetail.tsx" },
      { path: "admin/patients/:id/metabolic-map", Component: AdminPatientMetabolicMap, entry: "src/pages/AdminPatientMetabolicMap.tsx" },
      { path: "admin/patients/:id/metabolic-map/print", Component: AdminPatientMetabolicMapPrint, entry: "src/pages/AdminPatientMetabolicMapPrint.tsx" },
      { path: "admin/research/metabolic-cohort", Component: AdminMetabolicCohort, entry: "src/pages/AdminMetabolicCohort.tsx" },
      { path: "parent/patients/:id/metabolic-map", Component: ParentMetabolicMap, entry: "src/pages/ParentMetabolicMap.tsx" },
      { path: "admin/treatment-plans/compare", Component: TreatmentPlanCompare, entry: "src/pages/TreatmentPlanCompare.tsx" },
      { path: "p/:hash", Component: PublicTreatmentPlan, entry: "src/pages/PublicTreatmentPlan.tsx" },
      { path: "cabinet", Component: Cabinet, entry: "src/pages/Cabinet.tsx" },
      { path: "cabinet/agent", Component: CabinetAgent, entry: "src/pages/CabinetAgent.tsx" },
      { path: "cabinet/vault", Component: CabinetVault, entry: "src/pages/CabinetVault.tsx" },
      { path: "*", Component: NotFound }
    ]
  },
  {
    path: "/en",
    element: /* @__PURE__ */ jsx(EnRoot, {}),
    errorElement: /* @__PURE__ */ jsx(RouteErrorBoundary, {}),
    children: [
      ...enPublicChildren,
      { path: "*", Component: NotFound, entry: "src/pages/NotFound.tsx" }
    ]
  }
];
const lang$1 = "ru";
const nav$1 = {
  home: "Главная",
  about: "Обо мне",
  consultations: "Консультации",
  methods: "Методики",
  more: "Ещё",
  team: "Моя команда",
  forParents: "Для родителей и пациентов",
  forDoctors: "Для врачей",
  media: "СМИ и ТВ",
  videos: "Видео",
  videoCases: "Видео-кейсы",
  publications: "Публикации",
  research: "Наши исследования",
  clinicalCases: "Клинические случаи",
  travelNotes: "Путёвые заметки",
  masterclasses: "Мастер-классы",
  blog: "Размышлизмы",
  reviews: "Отзывы",
  selfCheck: "Самодиагностика",
  qa: "Вопросы и ответы",
  contacts: "Контакты",
  adminPanel: "Админ-панель",
  opsJournal: "Операционный журнал",
  signIn: "Войти",
  signUp: "Регистрация",
  signOut: "Выйти",
  bookAppointment: "Записаться",
  bookAppointmentFull: "Записаться на приём"
};
const hero$1 = {
  badge: "Член-корреспондент РАЕН, доктор медицинских наук, профессор, врач высшей категории",
  firstName: "Тарусин",
  lastName: "Дмитрий Игоревич",
  subtitle: "Основатель детской урологии-андрологии в России",
  specialties: "Андролог (детский и взрослый) • Детский уролог • Детский хирург • Эксперт УЗИ диагностики • Микрохирург • Пластический хирург • Ортопед • Сексолог",
  learnMore: "Узнать больше",
  yearsExp: "года опыта",
  presentations: "выступлений",
  publicationsCount: "публикаций",
  mataraClinic: "Клиника доктора Матара"
};
const about$1 = {
  title: "Обо мне",
  description: "Доктор медицинских наук (с 2005 года), профессор, член-корреспондент РАЕН, врач высшей категории. В медицине с 13 лет, в хирургии с 14 лет. В 2003 году совместно с профессором Казанской И.В. организовал новую медицинскую специальность «детская урология-андрология» в России.",
  careerTitle: "Вехи карьеры",
  approachTitle: "Мой подход к лечению",
  approachP1: "За более чем 42 года практики я помог тысячам пациентов — от новорождённых до взрослых мужчин. Каждый случай уникален, и я убеждён, что успешное лечение начинается с внимательного отношения к пациенту.",
  approachP2: "Мои операции выполняются с деликатностью, сопоставимой с офтальмологической хирургией. Использую современные микрохирургические методы при крипторхизме, водянке, варикоцеле и сперматоцеле.",
  approachP3: "Признанный в мире эксперт в ультразвуковой диагностике органов репродуктивной системы у детей и подростков.",
  specTitle: "Мои специализации и сертификаты",
  specSubtitle: "Действующие сертификаты по 10+ направлениям медицины",
  diplomasTitle: "Дипломы и сертификаты",
  diplomasSubtitle: "Подтверждение квалификации и непрерывного профессионального развития",
  noCerts: "Сертификаты скоро появятся",
  pageOf: "Страница {{current}} из {{total}}",
  funFact: "Коллекционирую фигурки ежей — вторая по величине коллекция в мире (более 5800 экземпляров)!",
  funFactLabel: "Интересный факт:",
  opinionLabel: "Мнение:",
  opinionText: "на самом деле, я считаю исключительной глупостью систему подготовки кадров в России и бесконечный перевод бумаги на «удостоверения, сертификаты, дипломы, свидетельства». Более пустого времяпрепровождения, чем 40 лет накапливать макулатуру, я за свою жизнь не знал. Здесь представлены не все документы — в целом их хватает на большой чемодан. Здесь представлена примерно треть, а всего таких «знаков моего качества» 188 штук",
  achYears: "Года опыта",
  achArticles: "Научных статей",
  achChapters: "Глав в нац. руководствах",
  achCandidates: "Подготовленных кандидатов наук",
  career1Title: "Врач по оказанию экстренной хирургической помощи детям",
  career1Desc: "Тушинская ДГКБ № 7, ныне: больница им. З.А. Башляевой (с 1993 года)",
  career2Title: "Научный сотрудник отдела детской хирургии",
  career2Desc: "Кафедра хирургии детского возраста РМАПО (с 1994 года)",
  career3Title: "Руководитель Центра детской и подростковой андрологии г. Москвы",
  career3Desc: "С 2001 года",
  career4Title: "Директор Научно-практического центра детской андрологии",
  career4Desc: "С 2003 года",
  career5Title: "Руководитель Городского центра охраны репродуктивного здоровья детей и подростков",
  career5Desc: "Морозовская ДГКБ — единственный в России (с 2018 года)",
  career6Title: "Заместитель директора по науке",
  career6Desc: "Международный центр андрологии, Москва",
  career7Title: "Профессор - консультант",
  career7Desc: "Семейная клиника доктора Матара (с 2018 года)",
  career8Title: "Сопредседатель Всероссийской школы по детской урологии-андрологии",
  career8Desc: "С 2012 года",
  career9Title: "Автор и ведущий проекта «Лабиринты детской урологии»",
  career9Desc: "С 2024 года — образовательный проект для врачей",
  specPedUroAndro: "Детская урология-андрология",
  specPedUroAndroDesc: "Создатель специальности в России (с 2003 года)",
  specAdultAndro: "Андрология взрослых",
  specAdultAndroDesc: "Диагностика и лечение мужских заболеваний",
  specPediatrics: "Педиатрия",
  specPediatricsDesc: "Комплексное наблюдение и лечение детей",
  specPedSurgery: "Детская хирургия",
  specPedSurgeryDesc: "Хирургическое лечение врождённых и приобретённых патологий",
  specMicrosurgery: "Микрохирургия",
  specMicrosurgeryDesc: "Операции с точностью офтальмологической хирургии",
  specPlasticSurgery: "Пластическая хирургия",
  specPlasticSurgeryDesc: "Реконструктивные и эстетические операции",
  specSexology: "Сексология",
  specSexologyDesc: "Консультации по вопросам интимного здоровья",
  specUltrasound: "УЗИ-диагностика",
  specUltrasoundDesc: "Мировой эксперт в УЗИ органов репродуктивной системы",
  specOrthopedics: "Травматология-ортопедия",
  specOrthopedicsDesc: "Лечение травм и патологий опорно-двигательного аппарата",
  specHealthAdmin: "Организация здравоохранения",
  specHealthAdminDesc: "Руководство Городским центром охраны репродуктивного здоровья"
};
const pioneers$1 = {
  badge: "Впервые в России",
  title: "Пионер детской андрологии",
  subtitle: "Мои уникальные достижения, определившие развитие целого направления медицины в России",
  item1Year: "2003",
  item1Title: "Создание специальности «Детская урология-андрология»",
  item1Desc: "Совместно с профессором И.В. Казанской впервые в России организована и утверждена новая медицинская специальность",
  item2Year: "2001",
  item2Title: "Первый Центр детской и подростковой андрологии",
  item2Desc: "Создан и возглавлен первый в России городской Центр детской и подростковой андрологии г. Москвы",
  item3Year: "2018",
  item3Title: "Единственный в России Центр охраны репродуктивного здоровья",
  item3Desc: "Городской центр охраны репродуктивного здоровья детей и подростков на базе Морозовской ДГКБ — единственный в стране",
  item4Year: "2012",
  item4Title: "Всероссийская школа по детской урологии-андрологии",
  item4Desc: "Сопредседатель ежегодной Всероссийской школы — образовательная платформа для врачей по всей стране",
  item5Year: "2005",
  item5Title: "Докторская диссертация — фундамент специальности",
  item5Desc: "Защищена первая в России докторская диссертация по детской андрологии, определившая стандарты диагностики и лечения",
  item6Year: "2024",
  item6Title: "Проект «Лабиринты детской урологии»",
  item6Desc: "Авторский образовательный проект для врачей — систематизация знаний и обмен опытом в детской урологии-андрологии"
};
const professorMessage$1 = {
  title: "Моё обращение к вам",
  greeting: "Дорогие родители и пациенты,",
  p1: "За более чем 42 года в медицине я видел тысячи семей, которые приходили ко мне с тревогой и уходили с надеждой. Каждый ребёнок, каждый пациент — это отдельная история, требующая индивидуального подхода, терпения и глубокого понимания проблемы.",
  p2: "Детская урология-андрология — это специальность, которую я создавал в России с нуля. Когда в 2003 году мы с профессором Казанской И.В. формировали это направление, многие коллеги были настроены скептически. Но сегодня тысячи мальчиков и юношей получают квалифицированную помощь благодаря тому, что мы не сдались.",
  p3: "Я убеждён: хороший врач — это не тот, кто больше всех оперирует, а тот, кто точно знает, когда операция нужна, а когда — нет. Мой принцип — минимальная инвазивность при максимальном результате. Каждая операция выполняется с деликатностью, сопоставимой с офтальмологической хирургией.",
  p4: "Когда вы пишете мне или приходите на приём — знайте: я буду относиться к вашему ребёнку так, как если бы это был мой собственный. Это не просто слова, это моё профессиональное кредо.",
  signature: "Искренне ваш, профессор Д.И. Тарусин"
};
const international$1 = {
  badge: "Международная практика",
  title: "Признание за рубежом",
  subtitle: "Я регулярно провожу мастер-классы, консультации и выступления в международных медицинских центрах",
  countries: "Стран",
  trainedDoctors: "Обученных врачей",
  presentationsCount: "Выступлений",
  forForeignPatients: "Для иностранных пациентов:",
  forForeignPatientsText: "я принимаю пациентов из любой страны мира. Предварительная онлайн-консультация позволит спланировать визит и сократить время пребывания в Москве.",
  kazakhstan: "Казахстан",
  kazakhstanActivity: "Мастер-классы, консультации",
  uzbekistan: "Узбекистан",
  uzbekistanActivity: "Образовательные программы",
  armenia: "Армения",
  armeniaActivity: "Консультации",
  georgia: "Грузия",
  georgiaActivity: "Выступления",
  turkey: "Турция",
  turkeyActivity: "Международные конференции",
  germany: "Германия",
  germanyActivity: "Научное сотрудничество",
  israel: "Израиль",
  israelActivity: "Обмен опытом",
  italy: "Италия",
  italyActivity: "Конференции"
};
const consultations$1 = {
  title: "Консультации и приём",
  subtitle: "Индивидуальный подход к каждому пациенту с применением современных методов диагностики и лечения",
  patientPath: "Путь пациента",
  whatProblems: "С чем обращаются",
  howToPrepare: "Как подготовиться",
  contactInfo: "Контактная информация",
  children: "Дети",
  men: "Мужчины",
  byAppointment: "Только по предварительной записи",
  forInquiries: "для справок",
  whatsappBooking: "WhatsApp для записи",
  urgentQuestions: "для срочных вопросов",
  bookAppointment: "Записаться на приём",
  mataraName: "Клиника доктора Матара",
  mataraAddress: "г. Москва, Коровинское шоссе д. 9 к. 2",
  reception: "регистратура",
  booking: "запись",
  step1Title: "Сбор анамнеза",
  step1Desc: "Подробная беседа о жалобах и истории болезни",
  step2Title: "Осмотр",
  step2Desc: "Физикальное обследование пациента",
  step3Title: "УЗИ-диагностика",
  step3Desc: "При необходимости — ультразвуковое исследование",
  step4Title: "Оценка результатов",
  step4Desc: "Оценка результатов обследований и назначение дообследований при необходимости",
  step5Title: "План лечения",
  step5Desc: "Индивидуальные рекомендации и назначения",
  step6Title: "Подготовка к операции",
  step6Desc: "Обследования и рекомендации перед вмешательством",
  step7Title: "Операция",
  step7Desc: "Хирургическое лечение с применением современных методик",
  step8Title: "Реабилитация",
  step8Desc: "Послеоперационное наблюдение и восстановление",
  step9Title: "Пожизненное наблюдение",
  step9Desc: "Наблюдение по мужским функциям и болезням",
  childSymptoms: [
    "Проблемы с мочеиспусканием",
    "Боли в области паха или яичек",
    "Крипторхизм (неопущение яичка)",
    "Фимоз и парафимоз",
    "Варикоцеле",
    "Водянка яичка (гидроцеле)",
    "Паховые грыжи",
    "Нарушения полового развития",
    "Сперматоцеле",
    "Гинекомастия"
  ],
  adultSymptoms: [
    "Мужское бесплодие",
    "Нарушение потенции",
    "Угасание либидо",
    "Хроническая усталость",
    "Дефицит тестостерона",
    "Ожирение",
    "Нарушение обмена веществ",
    "Сексология",
    "Хроническая боль",
    "Эректильная дисфункция",
    "Реконструктивные операции",
    "Варикоцеле",
    "Дисгармоничный секс",
    "Искривления полового члена",
    "Болезнь Пейрони"
  ],
  preparations: [
    "Определите цели и ожидания от Вашего визита",
    "Вспомните историю своего заболевания и сопутствующих болезней",
    "Историю посещений врачей и лечение",
    "Возьмите с собой все имеющиеся медицинские документы",
    "Подготовьте список принимаемых препаратов",
    "Запишите вопросы, которые хотите обсудить",
    "При УЗИ мочевого пузыря — наполненный мочевой пузырь"
  ]
};
const courses$1 = {
  badge: "Образовательные программы",
  title: "Курсы и обучение",
  subtitle: "Делюсь многолетним опытом с коллегами и помогаю родителям лучше понимать здоровье своих детей",
  learnMore: "Узнать подробнее",
  contactForConsultation: "Связаться для консультации",
  noCourseFound: "Не нашли подходящий курс? Свяжитесь со мной для организации индивидуального обучения",
  courseName: "Ваше имя *",
  coursePhone: "Телефон *",
  courseEmail: "Email",
  courseSubmit: "Отправить заявку",
  courseSubmitting: "Отправка...",
  courseSubmitted: "Заявка отправлена!",
  courseSubmittedDesc: "Мы свяжемся с вами по поводу курса",
  fillRequired: "Заполните обязательные поля",
  courseTopics: "Темы курса:",
  course1Title: "Основы детской андрологии",
  course1Desc: "Курс для педиатров и детских хирургов. Диагностика и лечение урологических заболеваний у мальчиков.",
  course1FullDesc: "Комплексный курс, охватывающий основные аспекты детской андрологии: анатомия и физиология, диагностика врождённых и приобретённых заболеваний, современные подходы к лечению. Включает разбор клинических случаев и практические рекомендации.",
  course1Duration: "8 часов",
  course1Format: "Очно",
  course1Audience: "Для врачей",
  course1Price: "100 000 ₽",
  course1Badge: "Популярный",
  course1Date: "Сентябрь 2026",
  course1CTA: "Количество мест ограничено — забронируйте место заранее",
  course2Title: "Микрохирургические техники",
  course2Desc: "Мастер-класс по современным микрохирургическим методикам в андрологии и урологии.",
  course2FullDesc: "Практический мастер-класс с работой на операционном микроскопе. Участники осваивают технику микрохирургического шва, вазовазостомии, варикоцелэктомии под оптическим увеличением. Ограниченное число участников для максимального внимания.",
  course2Duration: "8 часов",
  course2Format: "Очно",
  course2Audience: "Для хирургов",
  course2Price: "120 000 ₽",
  course2Badge: "Авторский курс",
  course2Date: "Октябрь 2026",
  course2CTA: "Группа до 6 человек — успейте занять место",
  course3Title: "Здоровье мальчика",
  course3Desc: "Лекция для родителей о развитии и профилактике урологических проблем у мальчиков разного возраста.",
  course3FullDesc: "Доступная лекция для родителей: на что обратить внимание в разные периоды развития мальчика, когда обращаться к врачу, какие обследования нужны. Ответы на часто задаваемые вопросы в формате живого общения.",
  course3Duration: "2 часа",
  course3Format: "Онлайн",
  course3Audience: "Для родителей",
  course3Price: "Бесплатно",
  course3Badge: "Бесплатно",
  course3Date: "Ежемесячно",
  course3CTA: "Запишитесь — это бесплатно",
  course4Title: "УЗИ в андрологии",
  course4Desc: "Практический курс по ультразвуковой диагностике в детской и взрослой андрологии.",
  course4FullDesc: "Углублённый практический курс по УЗИ-диагностике органов мошонки, полового члена и предстательной железы. Разбор нормальной и патологической эхоанатомии, допплерография, стандартизация протоколов исследования.",
  course4Duration: "12 часов",
  course4Format: "Очно",
  course4Audience: "Для врачей",
  course4Price: "150 000 ₽",
  course4Badge: "Авторский курс",
  course4Date: "Ноябрь 2026",
  course4CTA: "Практика на реальном оборудовании — места заканчиваются",
  course5Title: "Сексология детского и подросткового возраста",
  course5Desc: "Курс по вопросам сексуального развития, нарушений полового созревания и психосексуальных особенностей у детей и подростков.",
  course5FullDesc: "Междисциплинарный курс на стыке андрологии, эндокринологии и психологии. Рассматриваются нормативное половое развитие, задержка и преждевременное пубертатное развитие, гендерная дисфория, расстройства сексуального поведения у подростков. Разбор клинических случаев и алгоритмы маршрутизации пациентов.",
  course5Duration: "16 часов",
  course5Format: "Очно",
  course5Audience: "Для врачей",
  course5Price: "220 000 ₽",
  course5Badge: "Уникальный авторский курс",
  course5Date: "Декабрь 2026",
  course5CTA: "Первый набор — станьте одним из первых выпускников",
  course6Title: "Физические методы реабилитации в андрологии",
  course6Desc: "Авторский курс совместно с компанией 4CLINIC. Методики физической реабилитации для восстановления мужского здоровья.",
  course6FullDesc: "Практико-ориентированный курс на стыке андрологии и реабилитологии. Участники освоят современные физические методы восстановления: тренировки мышц тазового дна, постуральная коррекция, кинезиотерапия при хронической тазовой боли, послеоперационная реабилитация. Совместная программа с экспертами компании 4CLINIC.",
  course6Duration: "12 часов",
  course6Format: "Очно",
  course6Audience: "Для врачей",
  course6Price: "По запросу",
  course6Badge: "Авторский курс",
  course6Date: "Январь 2027",
  course6CTA: "Научите пациента владеть своим телом — создайте свою профессиональную уникальность",
  courseTopicsList1: [
    "Анатомия и физиология",
    "Крипторхизм и гидроцеле",
    "Фимоз и гипоспадия",
    "Варикоцеле у подростков",
    "Диагностические алгоритмы"
  ],
  courseTopicsList2: [
    "Микрохирургический шов",
    "Варикоцелэктомия",
    "Вазовазостомия",
    "Работа с операционным микроскопом"
  ],
  courseTopicsList3: [
    "Нормы развития",
    "Тревожные симптомы",
    "Профилактические осмотры",
    "Вопросы и ответы"
  ],
  courseTopicsList4: [
    "Эхоанатомия органов мошонки",
    "Допплерография",
    "Диагностика варикоцеле",
    "Протоколы исследования"
  ],
  courseTopicsList5: [
    "Нормативное половое развитие",
    "Нарушения пубертата",
    "Психосексуальные расстройства",
    "Гендерная дисфория",
    "Междисциплинарный подход"
  ],
  courseTopicsList6: [
    "Мышцы тазового дна",
    "Кинезиотерапия",
    "Послеоперационная реабилитация",
    "Хроническая тазовая боль",
    "Совместно с 4CLINIC"
  ],
  startDate: "Старт: {{date}}"
};
const reviews$1 = {
  title: "Отзывы пациентов",
  subtitle: "Что говорят мои пациенты и их семьи",
  showMore: "Показать ещё",
  showLess: "Свернуть",
  allReviews: "Все отзывы",
  colleagueTitle: "Отзывы коллег",
  colleagueSubtitle: "Мнения врачей-специалистов, прошедших обучение и сотрудничающих со мной",
  platformsTitle: "Отзывы на площадках",
  platformsSubtitle: "Читайте отзывы на независимых медицинских платформах",
  readReviews: "Читать отзывы",
  reviewsCount: "отзывов",
  rating: "Рейтинг"
};
const qa$1 = {
  badge: "Часто задаваемые вопросы",
  title: "Вопросы и ответы",
  subtitle: "Мои ответы на вопросы пациентов",
  allQA: "Все вопросы и ответы",
  answeredBy: "— Профессор Д.И. Тарусин"
};
const contact$1 = {
  title: "Записаться на приём",
  subtitle: "Приём ведётся в двух клиниках — выберите удобную для вас",
  formTitle: "Форма обратной связи",
  name: "Ваше имя *",
  phone: "Телефон *",
  email: "Email *",
  message: "Сообщение *",
  consent: "Даю согласие на обработку персональных данных",
  send: "Отправить заявку",
  sending: "Отправка...",
  sent: "Заявка отправлена!",
  sentDesc: "Мы свяжемся с вами в ближайшее время",
  consentRequired: "Пожалуйста, дайте согласие на обработку персональных данных",
  reception: "Место приёма",
  phones: "Телефоны",
  schedule: "Приём",
  howToGet: "Как добраться",
  metro: "Метро / МЦД",
  buses: "Автобусы",
  parking: "Парковка",
  namePlaceholder: "Иван Иванов",
  phonePlaceholder: "Номер телефона",
  emailPlaceholder: "example@mail.ru",
  messagePlaceholder: "Опишите ваш вопрос или симптомы",
  privacyLink: "Политика конфиденциальности"
};
const checklist$1 = {
  title: "Нужна ли консультация андролога?",
  subtitle: "Пройдите простой чек-лист, чтобы понять, стоит ли обратиться к специалисту",
  markSymptoms: "Отметьте наблюдаемые симптомы",
  getResult: "Узнать результат",
  lowTitle: "Низкая вероятность",
  lowText: "Вероятнее всего, срочной консультации не требуется. Однако профилактический осмотр андролога рекомендован всем мальчикам в возрасте 0, 1, 3, 6, 10, 14 и 17 лет.",
  medTitle: "Рекомендуется консультация",
  medText: "Выявлены симптомы, которые желательно показать специалисту в плановом порядке. Запишитесь на приём в удобное время.",
  highTitle: "Настоятельно рекомендуем обратиться",
  highText: "Выявлены симптомы, требующие осмотра детского андролога. Рекомендуем записаться на ближайшее доступное время.",
  disclaimer: "Данный чек-лист носит информационный характер и не заменяет консультацию врача.",
  items: [
    "Одно или оба яичка не прощупываются в мошонке",
    "Асимметрия или припухлость мошонки",
    "Болезненность в области паха или мошонки",
    "Невозможность обнажить головку полового члена",
    "Покраснение или выделения из крайней плоти",
    "Отверстие мочеиспускательного канала расположено не на верхушке головки",
    "Ребёнок жалуется на боль при мочеиспускании",
    "Струя мочи слабая, прерывистая или направлена в сторону",
    "Энурез (ночное недержание) после 5 лет",
    "Задержка или раннее начало полового развития",
    "Увеличение грудных желёз у мальчика-подростка",
    "Расширенные вены мошонки (видимые или прощупываемые)"
  ]
};
const gallery$1 = {
  title: "Результаты операций",
  subtitle: "Примеры хирургических вмешательств с описанием методики и результатов",
  all: "Все",
  photosOnVisit: "Фотографии доступны на приёме",
  privacyNote: "В целях конфиденциальности пациентов",
  fullPhotos: "Полная фотодокументация результатов доступна на очной консультации.",
  bookLink: "Записаться на приём →"
};
const journey$1 = {
  title: "Как проходит лечение",
  subtitle: "От первого звонка до полного выздоровления — прозрачный и понятный путь",
  step: "Шаг {{n}}"
};
const footer$1 = {
  navigation: "Навигация",
  specializations: "Специализации",
  contactsTitle: "Контакты",
  copyright: "© {{year}} Профессор Д.И. Тарусин. Все права защищены.",
  privacyPolicy: "Политика конфиденциальности",
  dataConsent: "Согласие на обработку данных",
  desc: "Член-корреспондент РАЕН, профессор, доктор медицинских наук, врач высшей категории. Основатель детской андрологии в России. Headliner (HL), Opinion Leader (OL) Более 42 лет на страже мужского здоровья"
};
const sticky$1 = {
  bookAppointment: "Записаться на приём",
  bookShort: "Записаться",
  askQuestion: "Задать вопрос",
  askShort: "Вопрос",
  priority: "Приоритет",
  questionTitle: "Задайте мне вопрос",
  yourName: "Ваше имя *",
  emailForReply: "Email для ответа *",
  yourQuestion: "Ваш вопрос *",
  questionHint: "Ответ будет отправлен на указанный email и может быть опубликован в разделе «Вопросы и ответы»",
  sendQuestion: "Отправить вопрос",
  sendingQuestion: "Отправка...",
  fillAll: "Заполните все поля",
  questionSent: "Вопрос отправлен!",
  questionSentDesc: "Мы ответим вам в ближайшее время",
  errorSending: "Ошибка отправки",
  tryLater: "Попробуйте позже",
  reception: "регистратура",
  booking: "запись",
  inquiries: "для справок",
  whatsApp: "WhatsApp",
  urgent: "срочные"
};
const chatbot$1 = {
  title: "Мой помощник",
  subtitle: "Ответим на ваши вопросы",
  welcome: "Здравствуйте! Я виртуальный помощник профессора. Задайте вопрос о детской андрологии или выберите из популярных:",
  placeholder: "Задайте вопрос...",
  disclaimer: "Помощник не ставит диагнозов. Для консультации запишитесь на приём.",
  quickQ1: "В каком возрасте нужен осмотр андролога?",
  quickQ2: "Что такое фимоз у мальчиков?",
  quickQ3: "Как записаться на приём?",
  serverError: "Не удалось связаться с сервером. Попробуйте позже."
};
const ru = {
  lang: lang$1,
  nav: nav$1,
  hero: hero$1,
  about: about$1,
  pioneers: pioneers$1,
  professorMessage: professorMessage$1,
  international: international$1,
  consultations: consultations$1,
  courses: courses$1,
  reviews: reviews$1,
  qa: qa$1,
  contact: contact$1,
  checklist: checklist$1,
  gallery: gallery$1,
  journey: journey$1,
  footer: footer$1,
  sticky: sticky$1,
  chatbot: chatbot$1
};
const lang = "en";
const nav = {
  home: "Home",
  about: "About",
  consultations: "Consultations",
  methods: "Methods",
  more: "More",
  team: "My Team",
  forParents: "For Parents & Patients",
  forDoctors: "For Doctors",
  media: "Media & TV",
  videos: "Videos",
  videoCases: "Video Cases",
  publications: "Publications",
  research: "Our Research",
  clinicalCases: "Clinical Cases",
  travelNotes: "Travel Notes",
  masterclasses: "Masterclasses",
  blog: "Blog",
  reviews: "Reviews",
  selfCheck: "Self-Diagnosis",
  qa: "Q&A",
  contacts: "Contacts",
  adminPanel: "Admin Panel",
  opsJournal: "Operations Journal",
  signIn: "Sign In",
  signUp: "Sign Up",
  signOut: "Sign Out",
  bookAppointment: "Book",
  bookAppointmentFull: "Book an Appointment"
};
const hero = {
  badge: "Corresponding Member of RANS, Doctor of Medical Sciences, Professor, Highest Category Physician",
  firstName: "Tarusin",
  lastName: "Dmitry Igorevich",
  subtitle: "Founder of Pediatric Urology-Andrology in Russia",
  specialties: "Andrologist (pediatric & adult) • Pediatric Urologist • Pediatric Surgeon • Ultrasound Expert • Microsurgeon • Plastic Surgeon • Orthopedist • Sexologist",
  learnMore: "Learn More",
  yearsExp: "years of experience",
  presentations: "presentations",
  publicationsCount: "publications",
  mataraClinic: "Dr. Matara's Clinic"
};
const about = {
  title: "About Me",
  description: "Doctor of Medical Sciences (since 2005), Professor, Corresponding Member of RANS, Highest Category Physician. In medicine since age 13, in surgery since age 14. In 2003, together with Professor Kazanskaya I.V., established a new medical specialty — 'Pediatric Urology-Andrology' — in Russia.",
  careerTitle: "Career Milestones",
  approachTitle: "My Approach to Treatment",
  approachP1: "Over 42 years of practice, I've helped thousands of patients — from newborns to adult men. Every case is unique, and I firmly believe that successful treatment starts with attentive care for the patient.",
  approachP2: "My surgeries are performed with a precision comparable to ophthalmic surgery. I use modern microsurgical techniques for cryptorchidism, hydrocele, varicocele, and spermatocele.",
  approachP3: "A globally recognized expert in ultrasound diagnostics of the reproductive system in children and adolescents.",
  specTitle: "My Specializations & Certificates",
  specSubtitle: "Active certifications in 10+ medical fields",
  diplomasTitle: "Diplomas & Certificates",
  diplomasSubtitle: "Proof of qualification and continuous professional development",
  noCerts: "Certificates coming soon",
  pageOf: "Page {{current}} of {{total}}",
  funFact: "I collect hedgehog figurines — the second largest collection in the world (over 5,800 pieces)!",
  funFactLabel: "Fun fact:",
  opinionLabel: "Opinion:",
  opinionText: "To be honest, I consider the Russian system of certifications and endless paperwork exceptionally pointless. I've spent 40 years accumulating documents that fill a large suitcase. Only about a third are shown here — in total I have 188 such 'quality marks'.",
  achYears: "Years of experience",
  achArticles: "Scientific articles",
  achChapters: "Chapters in national guidelines",
  achCandidates: "Trained PhD candidates",
  career1Title: "Emergency pediatric surgeon",
  career1Desc: "Tushino Children's Hospital No. 7, now: Z.A. Bashlyaeva Hospital (since 1993)",
  career2Title: "Research Fellow, Department of Pediatric Surgery",
  career2Desc: "Chair of Pediatric Surgery, RMAPO (since 1994)",
  career3Title: "Head of Moscow Center for Pediatric and Adolescent Andrology",
  career3Desc: "Since 2001",
  career4Title: "Director, Research & Practice Center for Pediatric Andrology",
  career4Desc: "Since 2003",
  career5Title: "Head of City Center for Children's Reproductive Health",
  career5Desc: "Morozov Children's Hospital — the only one in Russia (since 2018)",
  career6Title: "Deputy Director for Research",
  career6Desc: "International Andrology Center, Moscow",
  career7Title: "Consulting Professor",
  career7Desc: "Dr. Matara Family Clinic (since 2018)",
  career8Title: "Co-chair, National School of Pediatric Urology-Andrology",
  career8Desc: "Since 2012",
  career9Title: "Author & host of 'Labyrinths of Pediatric Urology'",
  career9Desc: "Since 2024 — educational project for physicians",
  specPedUroAndro: "Pediatric Urology-Andrology",
  specPedUroAndroDesc: "Founder of the specialty in Russia (since 2003)",
  specAdultAndro: "Adult Andrology",
  specAdultAndroDesc: "Diagnosis and treatment of male diseases",
  specPediatrics: "Pediatrics",
  specPediatricsDesc: "Comprehensive monitoring and treatment of children",
  specPedSurgery: "Pediatric Surgery",
  specPedSurgeryDesc: "Surgical treatment of congenital and acquired conditions",
  specMicrosurgery: "Microsurgery",
  specMicrosurgeryDesc: "Surgeries with ophthalmic-level precision",
  specPlasticSurgery: "Plastic Surgery",
  specPlasticSurgeryDesc: "Reconstructive and aesthetic procedures",
  specSexology: "Sexology",
  specSexologyDesc: "Consultations on intimate health matters",
  specUltrasound: "Ultrasound Diagnostics",
  specUltrasoundDesc: "World expert in reproductive system ultrasound",
  specOrthopedics: "Traumatology & Orthopedics",
  specOrthopedicsDesc: "Treatment of musculoskeletal injuries and conditions",
  specHealthAdmin: "Healthcare Administration",
  specHealthAdminDesc: "Director of City Center for Reproductive Health"
};
const pioneers = {
  badge: "First in Russia",
  title: "Pioneer of Pediatric Andrology",
  subtitle: "My unique achievements that shaped an entire field of medicine in Russia",
  item1Year: "2003",
  item1Title: "Establishment of the specialty 'Pediatric Urology-Andrology'",
  item1Desc: "Together with Professor I.V. Kazanskaya, established and officially approved a new medical specialty for the first time in Russia",
  item2Year: "2001",
  item2Title: "First Center for Pediatric and Adolescent Andrology",
  item2Desc: "Founded and headed the first City Center for Pediatric and Adolescent Andrology in Moscow",
  item3Year: "2018",
  item3Title: "The only Center for Reproductive Health in Russia",
  item3Desc: "City Center for Children's and Adolescents' Reproductive Health at Morozov Children's Hospital — the only one in the country",
  item4Year: "2012",
  item4Title: "National School of Pediatric Urology-Andrology",
  item4Desc: "Co-chair of the annual National School — an educational platform for doctors across the country",
  item5Year: "2005",
  item5Title: "Doctoral dissertation — the foundation of the specialty",
  item5Desc: "Defended Russia's first doctoral dissertation on pediatric andrology, establishing standards for diagnosis and treatment",
  item6Year: "2024",
  item6Title: "'Labyrinths of Pediatric Urology' project",
  item6Desc: "An original educational project for physicians — systematizing knowledge and sharing experience in pediatric urology-andrology"
};
const professorMessage = {
  title: "My Message to You",
  greeting: "Dear parents and patients,",
  p1: "Over more than 42 years in medicine, I have seen thousands of families who came to me with anxiety and left with hope. Every child, every patient is a separate story requiring an individual approach, patience, and deep understanding of the problem.",
  p2: "Pediatric urology-andrology is a specialty I built from scratch in Russia. When Professor Kazanskaya and I created this field in 2003, many colleagues were skeptical. But today, thousands of boys and young men receive qualified care because we didn't give up.",
  p3: "I believe that a good doctor is not the one who operates the most, but the one who knows exactly when surgery is needed — and when it isn't. My principle is minimal invasiveness with maximum results. Every operation is performed with the delicacy of ophthalmic surgery.",
  p4: "When you write to me or come for an appointment — know this: I will treat your child as if they were my own. These are not just words — this is my professional creed.",
  signature: "Sincerely yours, Professor D.I. Tarusin"
};
const international = {
  badge: "International Practice",
  title: "International Recognition",
  subtitle: "I regularly conduct master classes, consultations, and lectures at international medical centers",
  countries: "Countries",
  trainedDoctors: "Trained doctors",
  presentationsCount: "Presentations",
  forForeignPatients: "For international patients:",
  forForeignPatientsText: "I see patients from any country. A preliminary online consultation helps plan your visit and reduce your stay in Moscow.",
  kazakhstan: "Kazakhstan",
  kazakhstanActivity: "Master classes, consultations",
  uzbekistan: "Uzbekistan",
  uzbekistanActivity: "Educational programs",
  armenia: "Armenia",
  armeniaActivity: "Consultations",
  georgia: "Georgia",
  georgiaActivity: "Lectures",
  turkey: "Turkey",
  turkeyActivity: "International conferences",
  germany: "Germany",
  germanyActivity: "Scientific collaboration",
  israel: "Israel",
  israelActivity: "Experience exchange",
  italy: "Italy",
  italyActivity: "Conferences"
};
const consultations = {
  title: "Consultations & Appointments",
  subtitle: "An individual approach to every patient using modern diagnostic and treatment methods",
  patientPath: "Patient Journey",
  whatProblems: "Common Conditions",
  howToPrepare: "How to Prepare",
  contactInfo: "Contact Information",
  children: "Children",
  men: "Men",
  byAppointment: "By appointment only",
  forInquiries: "inquiries",
  whatsappBooking: "WhatsApp booking",
  urgentQuestions: "urgent questions",
  bookAppointment: "Book an Appointment",
  mataraName: "Dr. Matara's Clinic",
  mataraAddress: "Moscow, Korovinskoye Hwy 9, Bldg 2",
  reception: "reception",
  booking: "booking",
  step1Title: "Medical History",
  step1Desc: "Detailed interview about complaints and medical history",
  step2Title: "Examination",
  step2Desc: "Physical examination of the patient",
  step3Title: "Ultrasound Diagnostics",
  step3Desc: "If necessary — ultrasound examination",
  step4Title: "Results Review",
  step4Desc: "Assessment of test results and ordering additional tests if needed",
  step5Title: "Treatment Plan",
  step5Desc: "Personalized recommendations and prescriptions",
  step6Title: "Surgery Preparation",
  step6Desc: "Pre-operative tests and recommendations",
  step7Title: "Surgery",
  step7Desc: "Surgical treatment using modern techniques",
  step8Title: "Rehabilitation",
  step8Desc: "Post-operative monitoring and recovery",
  step9Title: "Lifelong Follow-up",
  step9Desc: "Monitoring of male health functions and conditions",
  childSymptoms: [
    "Urination problems",
    "Pain in the groin or testicles",
    "Cryptorchidism (undescended testicle)",
    "Phimosis and paraphimosis",
    "Varicocele",
    "Hydrocele (testicular fluid)",
    "Inguinal hernias",
    "Disorders of sexual development",
    "Spermatocele",
    "Gynecomastia"
  ],
  adultSymptoms: [
    "Male infertility",
    "Erectile dysfunction",
    "Loss of libido",
    "Chronic fatigue",
    "Testosterone deficiency",
    "Obesity",
    "Metabolic disorders",
    "Sexology",
    "Chronic pain",
    "Erectile dysfunction",
    "Reconstructive surgery",
    "Varicocele",
    "Disharmonious intercourse",
    "Penile curvature",
    "Peyronie's disease"
  ],
  preparations: [
    "Define the goals and expectations for your visit",
    "Recall your medical history and related conditions",
    "History of doctor visits and treatments",
    "Bring all available medical documents",
    "Prepare a list of current medications",
    "Write down questions you'd like to discuss",
    "For bladder ultrasound — a full bladder is required"
  ]
};
const courses = {
  badge: "Educational Programs",
  title: "Courses & Training",
  subtitle: "Sharing decades of experience with colleagues and helping parents better understand their children's health",
  learnMore: "Learn More",
  contactForConsultation: "Contact for Consultation",
  noCourseFound: "Didn't find the right course? Contact me for individual training arrangements",
  courseName: "Your Name *",
  coursePhone: "Phone *",
  courseEmail: "Email",
  courseSubmit: "Submit Request",
  courseSubmitting: "Sending...",
  courseSubmitted: "Request Sent!",
  courseSubmittedDesc: "We'll contact you about the course",
  fillRequired: "Please fill in required fields",
  courseTopics: "Course Topics:",
  course1Title: "Fundamentals of Pediatric Andrology",
  course1Desc: "Course for pediatricians and pediatric surgeons. Diagnosis and treatment of urological conditions in boys.",
  course1FullDesc: "A comprehensive course covering the main aspects of pediatric andrology: anatomy and physiology, diagnosis of congenital and acquired conditions, modern treatment approaches. Includes clinical case analysis and practical recommendations.",
  course1Duration: "8 hours",
  course1Format: "In-person",
  course1Audience: "For physicians",
  course1Price: "100,000 ₽",
  course1Badge: "Popular",
  course1Date: "September 2026",
  course1CTA: "Limited spots available — book your place in advance",
  course2Title: "Microsurgical Techniques",
  course2Desc: "Master class on modern microsurgical techniques in andrology and urology.",
  course2FullDesc: "A hands-on master class with surgical microscope practice. Participants learn microsurgical suturing technique, vasovasostomy, varicocelectomy under optical magnification. Limited group size for maximum attention.",
  course2Duration: "8 hours",
  course2Format: "In-person",
  course2Audience: "For surgeons",
  course2Price: "120,000 ₽",
  course2Badge: "Author's Course",
  course2Date: "October 2026",
  course2CTA: "Group of up to 6 — secure your spot",
  course3Title: "Boy's Health",
  course3Desc: "A lecture for parents about the development and prevention of urological problems in boys of different ages.",
  course3FullDesc: "An accessible lecture for parents: what to watch for at different stages of a boy's development, when to see a doctor, what tests are needed. FAQ session in a live format.",
  course3Duration: "2 hours",
  course3Format: "Online",
  course3Audience: "For parents",
  course3Price: "Free",
  course3Badge: "Free",
  course3Date: "Monthly",
  course3CTA: "Sign up — it's free",
  course4Title: "Ultrasound in Andrology",
  course4Desc: "Practical course on ultrasound diagnostics in pediatric and adult andrology.",
  course4FullDesc: "An in-depth practical course on ultrasound of the scrotal organs, penis, and prostate. Analysis of normal and pathological echoarchitecture, Doppler imaging, standardization of examination protocols.",
  course4Duration: "12 hours",
  course4Format: "In-person",
  course4Audience: "For physicians",
  course4Price: "150,000 ₽",
  course4Badge: "Author's Course",
  course4Date: "November 2026",
  course4CTA: "Hands-on practice with real equipment — spots filling up",
  course5Title: "Pediatric & Adolescent Sexology",
  course5Desc: "Course on sexual development, puberty disorders, and psychosexual characteristics in children and adolescents.",
  course5FullDesc: "An interdisciplinary course at the intersection of andrology, endocrinology, and psychology. Topics include normative sexual development, delayed and precocious puberty, gender dysphoria, and adolescent sexual behavior disorders. Clinical case analysis and patient routing algorithms.",
  course5Duration: "16 hours",
  course5Format: "In-person",
  course5Audience: "For physicians",
  course5Price: "220,000 ₽",
  course5Badge: "Unique Author's Course",
  course5Date: "December 2026",
  course5CTA: "First cohort — become one of the first graduates",
  course6Title: "Physical Rehabilitation in Andrology",
  course6Desc: "Author's course in partnership with 4CLINIC. Physical rehabilitation methods for men's health restoration.",
  course6FullDesc: "A practice-oriented course at the intersection of andrology and rehabilitation. Participants will master modern physical recovery methods: pelvic floor training, postural correction, kinesiotherapy for chronic pelvic pain, and post-operative rehabilitation. Joint program with 4CLINIC experts.",
  course6Duration: "12 hours",
  course6Format: "In-person",
  course6Audience: "For physicians",
  course6Price: "On request",
  course6Badge: "Author's Course",
  course6Date: "January 2027",
  course6CTA: "Teach your patient to master their body — build your professional uniqueness",
  courseTopicsList1: [
    "Anatomy & physiology",
    "Cryptorchidism & hydrocele",
    "Phimosis & hypospadias",
    "Adolescent varicocele",
    "Diagnostic algorithms"
  ],
  courseTopicsList2: [
    "Microsurgical suturing",
    "Varicocelectomy",
    "Vasovasostomy",
    "Working with a surgical microscope"
  ],
  courseTopicsList3: [
    "Developmental norms",
    "Warning signs",
    "Preventive check-ups",
    "Q&A"
  ],
  courseTopicsList4: [
    "Scrotal echoarchitecture",
    "Doppler imaging",
    "Varicocele diagnostics",
    "Examination protocols"
  ],
  courseTopicsList5: [
    "Normative sexual development",
    "Puberty disorders",
    "Psychosexual disorders",
    "Gender dysphoria",
    "Interdisciplinary approach"
  ],
  courseTopicsList6: [
    "Pelvic floor muscles",
    "Kinesiotherapy",
    "Post-operative rehabilitation",
    "Chronic pelvic pain",
    "Partnership with 4CLINIC"
  ],
  startDate: "Start: {{date}}"
};
const reviews = {
  title: "Patient Reviews",
  subtitle: "What my patients and their families say",
  showMore: "Show More Reviews",
  showLess: "Show Less",
  allReviews: "All Reviews",
  colleagueTitle: "Colleague Reviews",
  colleagueSubtitle: "Opinions of specialist physicians who have trained with and collaborated with me",
  platformsTitle: "Reviews on Platforms",
  platformsSubtitle: "Read reviews on independent medical platforms",
  readReviews: "Read reviews",
  reviewsCount: "reviews",
  rating: "Rating"
};
const qa = {
  badge: "Frequently Asked Questions",
  title: "Questions & Answers",
  subtitle: "My answers to patient questions",
  allQA: "All Questions & Answers",
  answeredBy: "— Professor D.I. Tarusin"
};
const contact = {
  title: "Book an Appointment",
  subtitle: "We see patients at two clinics — choose the most convenient one",
  formTitle: "Contact Form",
  name: "Your Name *",
  phone: "Phone *",
  email: "Email *",
  message: "Message *",
  consent: "I consent to the processing of my personal data",
  send: "Submit Request",
  sending: "Sending...",
  sent: "Request Sent!",
  sentDesc: "We will contact you shortly",
  consentRequired: "Please consent to the processing of personal data",
  reception: "Location",
  phones: "Phones",
  schedule: "Schedule",
  howToGet: "Directions",
  metro: "Metro / Railway",
  buses: "Buses",
  parking: "Parking",
  namePlaceholder: "John Smith",
  phonePlaceholder: "Phone number",
  emailPlaceholder: "example@mail.com",
  messagePlaceholder: "Describe your question or symptoms",
  privacyLink: "Privacy Policy"
};
const checklist = {
  title: "Does Your Child Need an Andrologist?",
  subtitle: "Take this simple checklist to understand if you should consult a specialist",
  markSymptoms: "Check the observed symptoms",
  getResult: "Get Result",
  lowTitle: "Low Probability",
  lowText: "Most likely, an urgent consultation is not needed. However, preventive check-ups with an andrologist are recommended for all boys at ages 0, 1, 3, 6, 10, 14, and 17.",
  medTitle: "Consultation Recommended",
  medText: "Symptoms have been identified that should be shown to a specialist at your convenience. Schedule an appointment.",
  highTitle: "Strongly Recommended to Visit",
  highText: "Symptoms requiring examination by a pediatric andrologist have been identified. We recommend booking the earliest available appointment.",
  disclaimer: "This checklist is for informational purposes only and does not replace a medical consultation.",
  items: [
    "One or both testicles are not palpable in the scrotum",
    "Scrotal asymmetry or swelling",
    "Pain in the groin or scrotum",
    "Inability to retract the foreskin",
    "Redness or discharge from the foreskin",
    "The urethral opening is not at the tip of the glans",
    "The child complains of pain during urination",
    "Weak, intermittent, or misdirected urine stream",
    "Enuresis (bedwetting) after age 5",
    "Delayed or premature onset of puberty",
    "Enlarged breast tissue in a teenage boy",
    "Visible or palpable dilated scrotal veins"
  ]
};
const gallery = {
  title: "Surgical Results",
  subtitle: "Examples of surgical procedures with descriptions of techniques and outcomes",
  all: "All",
  photosOnVisit: "Photos available at consultation",
  privacyNote: "For patient confidentiality",
  fullPhotos: "Complete photographic documentation of results is available at an in-person consultation.",
  bookLink: "Book an appointment →"
};
const journey = {
  title: "How Treatment Works",
  subtitle: "From the first call to full recovery — a transparent and clear path",
  step: "Step {{n}}"
};
const footer = {
  navigation: "Navigation",
  specializations: "Specializations",
  contactsTitle: "Contacts",
  copyright: "© {{year}} Professor D.I. Tarusin. All rights reserved.",
  privacyPolicy: "Privacy Policy",
  dataConsent: "Data Processing Consent",
  desc: "Corresponding Member of RANS, Professor, Doctor of Medical Sciences, Highest Category Physician. Founder of Pediatric Andrology in Russia. Headliner (HL), Opinion Leader (OL). Over 42 years protecting men's health."
};
const sticky = {
  bookAppointment: "Book an Appointment",
  bookShort: "Book",
  askQuestion: "Ask a Question",
  askShort: "Question",
  priority: "Priority",
  questionTitle: "Ask Me a Question",
  yourName: "Your Name *",
  emailForReply: "Email for Reply *",
  yourQuestion: "Your Question *",
  questionHint: "The answer will be sent to the provided email and may be published in the Q&A section",
  sendQuestion: "Send Question",
  sendingQuestion: "Sending...",
  fillAll: "Please fill in all fields",
  questionSent: "Question Sent!",
  questionSentDesc: "We will reply shortly",
  errorSending: "Sending Error",
  tryLater: "Please try again later",
  reception: "reception",
  booking: "booking",
  inquiries: "inquiries",
  whatsApp: "WhatsApp",
  urgent: "urgent"
};
const chatbot = {
  title: "My Assistant",
  subtitle: "We'll answer your questions",
  welcome: "Hello! I'm the Professor's virtual assistant. Ask a question about pediatric andrology or choose from popular topics:",
  placeholder: "Ask a question...",
  disclaimer: "The assistant does not diagnose. For a consultation, please book an appointment.",
  quickQ1: "At what age should a boy see an andrologist?",
  quickQ2: "What is phimosis in boys?",
  quickQ3: "How do I book an appointment?",
  serverError: "Could not reach the server. Please try again later."
};
const en = {
  lang,
  nav,
  hero,
  about,
  pioneers,
  professorMessage,
  international,
  consultations,
  courses,
  reviews,
  qa,
  contact,
  checklist,
  gallery,
  journey,
  footer,
  sticky,
  chatbot
};
let initialLang = "ru";
if (typeof window !== "undefined") {
  if (window.location.pathname.startsWith("/en")) {
    initialLang = "en";
  } else {
    const stored = window.localStorage.getItem("i18nextLng");
    if (stored === "en" || stored === "ru") initialLang = stored;
  }
}
i18n.use(initReactI18next).init({
  resources: { ru: { translation: ru }, en: { translation: en } },
  lng: initialLang,
  fallbackLng: "ru",
  interpolation: { escapeValue: false }
});
if (typeof window === "undefined") {
  React__default.useLayoutEffect = React__default.useEffect;
}
const createRoot = ViteReactSSG({ routes });
export {
  SheetTitle as A,
  Button as B,
  Card as C,
  Dialog as D,
  buttonVariants as E,
  Footer as F,
  SheetFooter as G,
  Header as H,
  Input as I,
  TooltipProvider as J,
  Tooltip as K,
  Label as L,
  TooltipTrigger as M,
  TooltipContent as N,
  DropdownMenu as O,
  PageMeta as P,
  DropdownMenuTrigger as Q,
  DropdownMenuContent as R,
  SITE_URL$1 as S,
  Textarea as T,
  DropdownMenuItem as U,
  SheetDescription as V,
  DropdownMenuSeparator as W,
  useIsMobile as X,
  Skeleton as Y,
  CardContent as a,
  Badge as b,
  CardHeader as c,
  createRoot,
  CardTitle as d,
  useToast as e,
  DialogTrigger as f,
  getLangFromPath as g,
  DialogContent as h,
  DialogHeader as i,
  DialogTitle as j,
  DialogDescription as k,
  DialogFooter as l,
  DialogClose as m,
  cn as n,
  Separator as o,
  SocialBar as p,
  StickyBottomPanel as q,
  Checkbox as r,
  supabase as s,
  toast as t,
  useAuth as u,
  CardDescription as v,
  Sheet as w,
  SheetTrigger as x,
  SheetContent as y,
  SheetHeader as z
};
