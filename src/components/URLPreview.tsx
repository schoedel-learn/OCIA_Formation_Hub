import React, { useState, useEffect } from "react";
import { Link2, Image as ImageIcon, ExternalLink } from "lucide-react";

interface URLPreviewProps {
  url: string;
}

interface PreviewData {
  title: string;
  description: string;
  image: string;
  url: string;
}

export default function URLPreview({ url }: URLPreviewProps) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Check if URL is a direct image file
  const isDirectImage = /\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i.test(url);

  useEffect(() => {
    if (isDirectImage) return;

    let isMounted = true;
    setLoading(true);
    setError(false);

    const fetchPreview = async () => {
      try {
        const res = await fetch(`/api/url-preview?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [url, isDirectImage]);

  if (isDirectImage) {
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 max-w-lg shadow-sm">
        <a href={url} target="_blank" rel="noopener noreferrer" className="block group relative">
          <img
            src={url}
            alt="User shared image"
            referrerPolicy="no-referrer"
            className="w-full h-auto max-h-80 object-cover transition duration-300 group-hover:scale-[1.01]"
          />
          <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white flex items-center space-x-1 backdrop-blur-xs">
            <ImageIcon className="w-3 h-3" />
            <span>Direct Image</span>
          </div>
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-3 flex items-center space-x-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 animate-pulse max-w-xl">
        <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
          <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
          <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mt-2.5 max-w-xl">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/20 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40 transition group"
        >
          <div className="flex items-center space-x-2 text-zinc-600 dark:text-zinc-400 group-hover:text-brand transition min-w-0">
            <Link2 className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-mono truncate">{url}</span>
          </div>
          <ExternalLink className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0 ml-2" />
        </a>
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/10 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition shadow-2xs max-w-xl">
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col sm:flex-row text-left group">
        {data.image && (
          <div className="sm:w-28 sm:h-24 h-32 w-full shrink-0 relative bg-zinc-100 dark:bg-zinc-800/60 overflow-hidden border-b sm:border-b-0 sm:border-r border-zinc-200 dark:border-zinc-800">
            <img
              src={data.image}
              alt={data.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition duration-300 group-hover:scale-102"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
        <div className="p-3.5 flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center space-x-1 text-[10px] text-zinc-400 font-mono mb-1">
            <Link2 className="w-3 h-3" />
            <span className="truncate">{new URL(url).hostname}</span>
          </div>
          <h4 className="font-serif font-bold text-xs text-zinc-800 dark:text-zinc-200 line-clamp-1 group-hover:text-brand transition mb-1 leading-snug">
            {data.title}
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {data.description}
          </p>
        </div>
      </a>
    </div>
  );
}
