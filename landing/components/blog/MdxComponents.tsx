import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

/**
 * Custom components used when rendering MDX content.
 * These replace default HTML elements with styled versions
 * that match the SpaceCheck design system.
 */
export const mdxComponents: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="text-3xl sm:text-4xl font-bold text-primary mt-8 mb-4 leading-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl sm:text-3xl font-bold text-primary mt-10 mb-4 leading-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl sm:text-2xl font-semibold text-primary mt-8 mb-3">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-gray-700 leading-relaxed mb-6 text-base sm:text-lg">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside ml-6 mb-6 space-y-2 text-gray-700 text-base sm:text-lg">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-6 mb-6 space-y-2 text-gray-700 text-base sm:text-lg">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  a: ({ href, children }) => {
    const isExternal = href?.startsWith('http');
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary hover:text-secondary/80 underline underline-offset-2 transition-colors"
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href ?? '#'}
        className="text-secondary hover:text-secondary/80 underline underline-offset-2 transition-colors"
      >
        {children}
      </Link>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-secondary pl-6 my-6 italic text-gray-600">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="bg-gray-100 text-secondary px-1.5 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto mb-6 text-sm">
      {children}
    </pre>
  ),
  hr: () => <hr className="border-gray-200 my-10" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-primary">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-600">{children}</em>
  ),
  img: (props) => {
    const src = props.src ?? '';
    const isVideo = /\.(mp4|webm|ogg)$/i.test(src);

    if (isVideo) {
      return (
        <video
          src={src}
          controls
          playsInline
          muted
          loop
          className="rounded-lg my-6 w-full shadow-sm"
        >
          {props.alt}
        </video>
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        {...props}
        alt={props.alt ?? ''}
        className="rounded-lg my-6 w-full shadow-sm"
        loading="lazy"
      />
    );
  },
  iframe: (props) => (
    <div className="relative aspect-video rounded-lg overflow-hidden my-6 shadow-sm">
      <iframe
        {...props}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
      />
    </div>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-primary border-b border-gray-200">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
      {children}
    </td>
  ),
};
