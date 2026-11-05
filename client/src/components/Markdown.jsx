import ReactMarkdown from 'react-markdown';

export default function Markdown({ children }) {
  return (
    <div className="prose">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
