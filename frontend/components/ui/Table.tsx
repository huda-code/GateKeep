"use client";

import { useRouter } from "next/navigation";
import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";

/** Hairline-ruled table. No outer border, no header fill — rules do all the work. */
export function Table({
  head,
  children,
  minWidth = 900,
}: {
  head: ReactNode;
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto bg-surface">
      <table className="w-full text-left" style={{ minWidth }}>
        <thead>
          <tr>{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Th({
  children,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={`border-b border-hairline px-inset py-3 font-ui text-ui font-normal text-ink-tertiary ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      className={`px-inset py-4 font-ui text-ui text-ink ${className ?? ""}`}
    >
      {children}
    </td>
  );
}

type TrProps = React.HTMLAttributes<HTMLTableRowElement> & {
  /**
   * Makes the whole row navigable on click. Keep a real <Link> in the row's
   * primary cell too — that's what carries keyboard and screen-reader access;
   * this only adds the mouse target.
   */
  href?: string;
};

export function Tr({ href, children, className, ...props }: TrProps) {
  const router = useRouter();

  return (
    <tr
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        if (!href) return;

        // Let buttons and links inside the row handle their own clicks.
        if (
          event.target instanceof Element &&
          event.target.closest("a, button, input, label")
        ) {
          return;
        }

        router.push(href);
      }}
      className={`border-b border-hairline last:border-b-0 ${
        href ? "cursor-pointer transition-colors hover:bg-sunken" : ""
      } ${className ?? ""}`}
    >
      {children}
    </tr>
  );
}
