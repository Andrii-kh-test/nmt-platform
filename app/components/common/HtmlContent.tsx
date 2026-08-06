"use client";

type Props = {
  html: string;
  className?: string;
};

export default function HtmlContent({
  html,
  className = "",
}: Props) {
  return (
    <div
      className={`prose max-w-none ${className}`}
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  );
}