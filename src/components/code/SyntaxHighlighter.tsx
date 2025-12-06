import { Highlight, themes } from "prism-react-renderer";

interface SyntaxHighlighterProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
}

const languageMap: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  html: "html",
  css: "css",
  java: "java",
  cpp: "cpp",
  sql: "sql",
  jsx: "jsx",
  tsx: "tsx",
  json: "json",
  bash: "bash",
  shell: "bash",
  markdown: "markdown",
  md: "markdown",
};

export default function SyntaxHighlighter({
  code,
  language,
  showLineNumbers = false,
  maxHeight = "auto",
}: SyntaxHighlighterProps) {
  const mappedLanguage = languageMap[language.toLowerCase()] || "javascript";

  return (
    <Highlight theme={themes.nightOwl} code={code.trim()} language={mappedLanguage as any}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} rounded-lg p-4 overflow-auto text-sm font-mono`}
          style={{ ...style, maxHeight, backgroundColor: "hsl(var(--muted) / 0.8)" }}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })} className="table-row">
              {showLineNumbers && (
                <span className="table-cell pr-4 text-muted-foreground/50 select-none text-right">
                  {i + 1}
                </span>
              )}
              <span className="table-cell">
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </span>
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
