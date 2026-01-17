// TODO: Install @radix-ui/react-scroll-area and implement
// This is a stub to allow the build to pass

import type { ReactNode } from "react";

export const ScrollArea = ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) => {
  return <div {...props}>{children}</div>;
};

export const ScrollBar = () => null;
