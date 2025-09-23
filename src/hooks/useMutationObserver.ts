/**
 * Generic mutation observer hook for detecting DOM changes
 */
import { useEffect, useRef, useCallback } from 'react';

interface UseMutationObserverOptions {
  childList?: boolean;
  subtree?: boolean;
  attributes?: boolean;
  attributeFilter?: string[];
  characterData?: boolean;
}

export function useMutationObserver(
  callback: (mutations: MutationRecord[]) => void,
  targetNode?: Element | null,
  options: UseMutationObserverOptions = {}
) {
  const observerRef = useRef<MutationObserver | null>(null);

  const observe = useCallback((node: Element) => {
    if (!observerRef.current) return;
    observerRef.current.observe(node, {
      childList: options.childList ?? true,
      subtree: options.subtree ?? true,
      attributes: options.attributes ?? false,
      attributeFilter: options.attributeFilter,
      characterData: options.characterData ?? false,
    });
  }, [options.childList, options.subtree, options.attributes, options.attributeFilter, options.characterData]);

  const disconnect = useCallback(() => {
    if (!observerRef.current) return;
    observerRef.current.disconnect();
  }, []);

  useEffect(() => {
    observerRef.current = new MutationObserver(callback);

    if (targetNode) {
      observe(targetNode);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [callback, targetNode, observe]);

  return { observe, disconnect };
}