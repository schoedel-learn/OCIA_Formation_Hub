import React from "react";
import Markdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <div className={`markdown-body leading-relaxed ${className}`}>
      <Markdown
        components={{
          h1: ({ ...props }) => <h1 className="text-lg font-serif font-bold text-zinc-900 dark:text-zinc-100 mt-3 mb-2" {...props} />,
          h2: ({ ...props }) => <h2 className="text-base font-serif font-bold text-zinc-800 dark:text-zinc-200 mt-2.5 mb-1.5" {...props} />,
          h3: ({ ...props }) => <h3 className="text-sm font-serif font-bold text-zinc-700 dark:text-zinc-300 mt-2 mb-1" {...props} />,
          p: ({ ...props }) => <p className="mb-2 leading-relaxed break-words" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc pl-5 mb-2.5 space-y-1" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1" {...props} />,
          li: ({ ...props }) => <li className="mb-0.5" {...props} />,
          strong: ({ ...props }) => <strong className="font-bold text-zinc-950 dark:text-zinc-50" {...props} />,
          em: ({ ...props }) => <em className="italic text-zinc-800 dark:text-zinc-200" {...props} />,
          code: ({ ...props }) => <code className="bg-zinc-100 dark:bg-zinc-800/80 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-mono text-[11px]" {...props} />,
          pre: ({ ...props }) => (
            <pre className="bg-zinc-100/65 dark:bg-zinc-950/45 p-3 rounded-lg font-mono text-[11px] overflow-x-auto my-3 border border-zinc-200 dark:border-zinc-800" {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-amber-600/60 pl-4 italic my-3 text-zinc-500 dark:text-zinc-400" {...props} />
          ),
          a: ({ ...props }) => <a className="text-amber-700 dark:text-amber-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
