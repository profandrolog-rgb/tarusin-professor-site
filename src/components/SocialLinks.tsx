// Shared social media icons and links
import { useState } from "react";
import maxQrCode from "@/assets/max-qr.webp";
import maxIconImg from "@/assets/icons/max-icon.webp";

export const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

export const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

export const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export const DzenIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c2.903 0 5.503 1.425 7.088 3.612h-3.6c-.788-.9-1.912-1.512-3.188-1.612v-2zm-4.8 0v2c-1.275.1-2.4.712-3.187 1.612h-3.6C1.998 5.025 4.598 3.6 7.5 3.6h-.3zM3.6 12c0-.9.15-1.763.413-2.575h2.85c-.15.825-.263 1.687-.263 2.575s.113 1.75.263 2.575h-2.85A8.372 8.372 0 0 1 3.6 12zm3.9 7.2v-2c1.275-.1 2.4-.712 3.188-1.612h3.6c-1.585 2.187-4.185 3.612-7.088 3.612h.3zm9.6-4.625c.15-.825.263-1.687.263-2.575s-.113-1.75-.263-2.575h2.85c.263.812.413 1.675.413 2.575s-.15 1.763-.413 2.575h-2.85z" />
  </svg>
);

export const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const VKIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.727-1.033-1.007-1.49-1.143-1.744-1.143-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.15-3.574 2.15-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .643.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.474-.085.717-.576.717z" />
  </svg>
);

export const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.083.717 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.762 2.084-1.2 3.583-1.303 1.1-.076 2.126.012 3.06.262-.084-1.26-.57-2.206-1.48-2.75-.635-.38-1.47-.57-2.49-.57h-.036c-1.254.01-2.27.405-3.02 1.175l-1.471-1.404C8.61 5.462 10.15 4.842 12.04 4.822h.05c1.36 0 2.519.282 3.443.838 1.273.766 2.073 1.983 2.308 3.518.43.065.84.158 1.23.278l.01.003c1.375.425 2.51 1.175 3.282 2.168.952 1.222 1.28 2.767 1.088 4.188-.404 3.005-2.532 5.37-6.41 5.97-1.163.18-2.261.217-3.313.217h-.243zM12 13.284c-1.065.074-1.893.36-2.393.828-.398.373-.58.836-.544 1.377.033.502.276.942.684 1.239.528.384 1.288.584 2.132.539 1.07-.059 1.89-.453 2.442-1.173.373-.487.627-1.137.757-1.945-.929-.254-1.98-.397-3.078-.397v-.468z" />
  </svg>
);

export const MaxIcon = ({ className }: { className?: string }) => (
  <img src={maxIconImg} alt="MAX" className={`${className} rounded-sm object-contain`} />
);

// QR code modal for MAX messenger
export const MaxQrModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-background rounded-2xl p-6 shadow-2xl max-w-xs mx-4 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground transition-colors">
          ✕
        </button>
        <div className="text-center mb-3">
          <p className="font-semibold text-foreground">Мессенджер MAX</p>
          <p className="text-sm text-muted-foreground">Отсканируйте QR-код</p>
        </div>
        <img src={maxQrCode} alt="QR-код MAX мессенджера Дмитрия Тарусина" width={256} height={256} decoding="async" className="w-64 h-64 object-contain rounded-xl" />
      </div>
    </div>
  );
};

// All social links for the professor
export const SOCIAL_LINKS = [
  {
    icon: InstagramIcon,
    href: "https://www.instagram.com/androlog_di",
    label: "Instagram",
  },
  {
    icon: TelegramIcon,
    href: "https://t.me/+tMWpYqcllzo3NmYy",
    label: "Telegram",
    title: "Приёмная Профессора ДИ",
  },
  {
    icon: TelegramIcon,
    href: "https://t.me/androtolk",
    label: "Telegram (дети)",
    title: "Репродуктивное здоровье мальчиков",
  },
  {
    icon: TelegramIcon,
    href: "https://t.me/+252tMTFSq-03ZDFi",
    label: "Telegram (врачи)",
    title: "Андрология и Профессор",
  },
  {
    icon: VKIcon,
    href: "https://vk.com/androlog_di",
    label: "ВКонтакте",
  },
  {
    icon: FacebookIcon,
    href: "https://www.facebook.com/share/1CEzaVnGYW/?mibextid=wwXIfr",
    label: "Facebook",
  },
  {
    icon: ThreadsIcon,
    href: "https://www.threads.com/@androlog_di",
    label: "Threads",
  },
  {
    icon: DzenIcon,
    href: "https://dzen.ru/androlog_di",
    label: "Дзен",
    title: "Мужской ЗдравоХранитель",
  },
  {
    icon: YouTubeIcon,
    href: "https://www.youtube.com/@androlog_di",
    label: "YouTube",
    title: "Профессор и Андрология",
  },
  {
    icon: WhatsAppIcon,
    href: "https://wa.me/79778075544",
    label: "WhatsApp",
  },
  {
    icon: MaxIcon,
    href: "#max-qr",
    label: "MAX",
    title: "Мессенджер MAX",
    isQr: true,
  },
];

// Subset for footer (main ones)
export const FOOTER_SOCIAL_LINKS = SOCIAL_LINKS.filter((l) =>
  ["Instagram", "Telegram", "ВКонтакте", "Facebook", "Дзен", "YouTube", "WhatsApp", "MAX"].includes(l.label)
);

// Compact social bar component with QR support for MAX
export const SocialBar = ({ className = "" }: { className?: string }) => {
  const [showMaxQr, setShowMaxQr] = useState(false);
  return (
    <>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {SOCIAL_LINKS.map((social, i) => {
          if ((social as any).isQr) {
            return (
              <button
                key={`${social.label}-${i}`}
                onClick={() => setShowMaxQr(true)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors text-muted-foreground"
                aria-label={social.title || social.label}
                title={social.title || social.label}
              >
                <social.icon className="w-4 h-4" />
              </button>
            );
          }
          return (
            <a
              key={`${social.label}-${i}`}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors text-muted-foreground"
              aria-label={social.title || social.label}
              title={social.title || social.label}
            >
              <social.icon className="w-4 h-4" />
            </a>
          );
        })}
      </div>
      <MaxQrModal isOpen={showMaxQr} onClose={() => setShowMaxQr(false)} />
    </>
  );
};

export default SocialBar;
