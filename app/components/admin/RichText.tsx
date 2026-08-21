type Props = {
  html: string | null | undefined;
};

export default function RichText({
  html,
}: Props) {
  if (!html) {
    return null;
  }

  return (
    <div
      className="
        rich-text
        prose
        prose-slate
        max-w-none
        leading-relaxed
      "
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  );
}