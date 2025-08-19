// React and Next.js type declarations
declare module 'react' {
  export * from 'react';
}

declare module 'next/navigation' {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    refresh: () => void;
    back: () => void;
  };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
}

declare module 'next/image' {
  import { DetailedHTMLProps, ImgHTMLAttributes } from 'react';
  
  export interface ImageProps extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    quality?: number;
    priority?: boolean;
    placeholder?: 'blur' | 'empty';
    style?: React.CSSProperties;
    className?: string;
  }
  
  export default function Image(props: ImageProps): JSX.Element;
}

declare module 'next/link' {
  import { AnchorHTMLAttributes, DetailedHTMLProps } from 'react';
  
  export interface LinkProps extends DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    prefetch?: boolean;
  }
  
  export default function Link(props: LinkProps): JSX.Element;
}

declare module 'next/server' {
  export class NextResponse {
    static json(body: any, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, init?: number | ResponseInit): NextResponse;
    static rewrite(url: string | URL, init?: ResponseInit): NextResponse;
    static next(init?: ResponseInit): NextResponse;
  }
  
  export interface NextRequest extends Request {
    nextUrl: URL;
    cookies: {
      get: (name: string) => { name: string; value: string } | undefined;
      getAll: () => Array<{ name: string; value: string }>;
      set: (name: string, value: string, options?: { path?: string; maxAge?: number }) => void;
      delete: (name: string) => void;
    };
  }
}

declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
  
  export const User: ComponentType<IconProps>;
  export const LogOut: ComponentType<IconProps>;
  export const ChevronDown: ComponentType<IconProps>;
  export const Clock: ComponentType<IconProps>;
  export const Store: ComponentType<IconProps>;
  export const UserCheck: ComponentType<IconProps>;
  export const AlertCircle: ComponentType<IconProps>;
  export const CheckCircle: ComponentType<IconProps>;
  export const Loader2: ComponentType<IconProps>;
  export const CircleAlert: ComponentType<IconProps>;
}

declare module '@/components/ui/tabs' {
  import { ReactNode } from 'react';
  
  export interface TabsProps {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    children: ReactNode;
    className?: string;
  }
  
  export function Tabs(props: TabsProps): JSX.Element;
  
  export interface TabsListProps {
    children: ReactNode;
    className?: string;
  }
  
  export function TabsList(props: TabsListProps): JSX.Element;
  
  export interface TabsTriggerProps {
    value: string;
    children: ReactNode;
    className?: string;
  }
  
  export function TabsTrigger(props: TabsTriggerProps): JSX.Element;
  
  export interface TabsContentProps {
    value: string;
    children: ReactNode;
    className?: string;
  }
  
  export function TabsContent(props: TabsContentProps): JSX.Element;
}

// Add JSX namespace to fix "JSX element implicitly has type 'any'" errors
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
