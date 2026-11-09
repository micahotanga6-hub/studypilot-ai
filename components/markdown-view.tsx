import ReactMarkdown from "react-markdown";

export function MarkdownView({ markdown }: { markdown: string }) {
  return (
    <div className="prose-note">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="underline decoration-pine/40 underline-offset-2">
              {children}
            </a>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
