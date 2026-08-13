"use client";

type Props = {
  html: string;
  className?: string;
};

type ShapeType =
  | "triangle"
  | "trapezoid"
  | "circle"
  | "square"
  | "diamond";

function getShapeSvg(shape: ShapeType) {
  const stroke = "#111827";

  const commonProps = {
    width: "32",
    height: "24",
    viewBox: "0 0 32 24",
    xmlns: "http://www.w3.org/2000/svg",
    style: {
      display: "inline-block",
      verticalAlign: "middle",
    },
  };

  switch (shape) {
    case "triangle":
      return (
        <svg {...commonProps}>
          <polygon
            points="16,3 29,21 3,21"
            fill="none"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "trapezoid":
      return (
        <svg {...commonProps}>
          <polygon
            points="8,21 24,21 29,3 3,3"
            fill="none"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "circle":
      return (
        <svg {...commonProps}>
          <circle
            cx="16"
            cy="12"
            r="9"
            fill="none"
            stroke={stroke}
            strokeWidth="2.5"
          />
        </svg>
      );

    case "square":
      return (
        <svg {...commonProps}>
          <rect
            x="7"
            y="3"
            width="18"
            height="18"
            fill="none"
            stroke={stroke}
            strokeWidth="2.5"
          />
        </svg>
      );

    case "diamond":
      return (
        <svg {...commonProps}>
          <polygon
            points="16,2 29,12 16,22 3,12"
            fill="none"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    default:
      return null;
  }
}

function renderHtmlWithShapes(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const shapes = doc.querySelectorAll("[data-shape]");

  shapes.forEach((element) => {
    const shape = element.getAttribute(
      "data-shape"
    ) as ShapeType | null;

    if (!shape) {
      return;
    }

    const wrapper = doc.createElement("span");

    wrapper.setAttribute("data-rendered-shape", shape);

    wrapper.style.display = "inline-block";
    wrapper.style.verticalAlign = "middle";
    wrapper.style.margin = "0 4px";
    wrapper.style.lineHeight = "1";

    wrapper.innerHTML = getShapeSvgHtml(shape);

    element.replaceWith(wrapper);
  });

  return doc.body.innerHTML;
}

function getShapeSvgHtml(shape: ShapeType) {
  switch (shape) {
    case "triangle":
      return `
        <svg
          width="32"
          height="24"
          viewBox="0 0 32 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="16,3 29,21 3,21"
            fill="none"
            stroke="#111827"
            stroke-width="2.5"
            stroke-linejoin="round"
          />
        </svg>
      `;

    case "trapezoid":
      return `
        <svg
          width="32"
          height="24"
          viewBox="0 0 32 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="8,21 24,21 29,3 3,3"
            fill="none"
            stroke="#111827"
            stroke-width="2.5"
            stroke-linejoin="round"
          />
        </svg>
      `;

    case "circle":
      return `
        <svg
          width="32"
          height="24"
          viewBox="0 0 32 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="16"
            cy="12"
            r="9"
            fill="none"
            stroke="#111827"
            stroke-width="2.5"
          />
        </svg>
      `;

    case "square":
      return `
        <svg
          width="32"
          height="24"
          viewBox="0 0 32 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="7"
            y="3"
            width="18"
            height="18"
            fill="none"
            stroke="#111827"
            stroke-width="2.5"
          />
        </svg>
      `;

    case "diamond":
      return `
        <svg
          width="32"
          height="24"
          viewBox="0 0 32 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="16,2 29,12 16,22 3,12"
            fill="none"
            stroke="#111827"
            stroke-width="2.5"
            stroke-linejoin="round"
          />
        </svg>
      `;

    default:
      return "";
  }
}

export default function HtmlContent({
  html,
  className = "",
}: Props) {
  const processedHtml = renderHtmlWithShapes(html);

  return (
    <div
      className={`prose max-w-none ${className}`}
      dangerouslySetInnerHTML={{
        __html: processedHtml,
      }}
    />
  );
}