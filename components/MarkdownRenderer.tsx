import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    // Updated prose classes to lg for larger text
    <div className="prose prose-lg max-w-none dark:prose-invert prose-indigo text-gray-800">
      <ReactMarkdown
        components={{
          a: ({ node, ...props }) => (
            <a 
              {...props} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300 underline-offset-4 transition-colors font-medium" 
            />
          ),
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            return isInline ? (
              <code className="bg-gray-100 text-red-600 px-2 py-0.5 rounded text-base font-mono border border-gray-200" {...props}>
                {children}
              </code>
            ) : (
              <div className="bg-gray-800 text-gray-100 rounded-xl p-5 overflow-x-auto my-4 shadow-md text-base font-mono leading-relaxed">
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            );
          },
          ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 my-3 text-gray-800 space-y-2" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 my-3 text-gray-800 space-y-2" {...props} />,
          h1: ({node, ...props}) => <h1 className="text-3xl font-bold my-6 text-gray-900 pb-3 border-b border-gray-200" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-2xl font-bold my-5 text-gray-800" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-xl font-bold my-3 text-gray-800" {...props} />,
          p: ({node, ...props}) => <p className="my-3 leading-8 text-gray-800" {...props} />,
          table: ({node, ...props}) => <div className="overflow-x-auto my-5 rounded-lg border border-gray-200 shadow-sm"><table className="min-w-full divide-y divide-gray-200" {...props} /></div>,
          thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
          th: ({node, ...props}) => <th className="px-4 py-3 text-left text-sm font-bold text-gray-600 uppercase tracking-wider bg-gray-100" {...props} />,
          tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
          tr: ({node, ...props}) => <tr className="hover:bg-gray-50 transition-colors" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-3 text-base text-gray-700 whitespace-nowrap md:whitespace-normal" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-400 pl-4 py-2 my-4 bg-indigo-50 italic text-gray-700 rounded-r-lg" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;