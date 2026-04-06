'use client';

import {
  cloneElement,
  isValidElement,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

type SmartTooltipProps = {
  children: ReactElement;
  content: ReactNode;
  className?: string;
  offset?: number;
  placement?: TooltipPlacement;
  triggerMode?: 'hover' | 'click';
};

const VIEWPORT_PADDING = 8;

function clamp(value: number, min: number, max: number) {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

function subscribeToClientState() {
  return () => {};
}

export function SmartTooltip({
  children,
  content,
  className,
  offset = 10,
  placement = 'bottom',
  triggerMode = 'hover',
}: SmartTooltipProps) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const canUsePortal = useSyncExternalStore(subscribeToClientState, () => true, () => false);
  const [positionStyle, setPositionStyle] = useState<CSSProperties>({ left: -9999, top: -9999 });
  const [resolvedPlacement, setResolvedPlacement] = useState<TooltipPlacement>(placement);

  const placementPriority = useMemo<TooltipPlacement[]>(() => {
    const orders: Record<TooltipPlacement, TooltipPlacement[]> = {
      bottom: ['bottom', 'top', 'right', 'left'],
      top: ['top', 'bottom', 'right', 'left'],
      right: ['right', 'left', 'bottom', 'top'],
      left: ['left', 'right', 'bottom', 'top'],
    };

    return orders[placement];
  }, [placement]);

  useEffect(() => {
    if (!open || triggerMode !== 'click') {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!anchorElement) {
        return;
      }

      const target = event.target as Node;

      if (anchorElement.contains(target)) {
        return;
      }

      const tooltipElement = document.getElementById(tooltipId);
      if (tooltipElement?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [anchorElement, open, tooltipId, triggerMode]);

  useEffect(() => {
    if (!open || !anchorElement) {
      return;
    }

    function updatePosition() {
      if (!anchorElement) {
        return;
      }

      const tooltipElement = document.getElementById(tooltipId);
      if (!tooltipElement) {
        return;
      }

      const anchorRect = anchorElement.getBoundingClientRect();
      const tooltipRect = tooltipElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const available = {
        top: anchorRect.top - VIEWPORT_PADDING,
        bottom: viewportHeight - anchorRect.bottom - VIEWPORT_PADDING,
        left: anchorRect.left - VIEWPORT_PADDING,
        right: viewportWidth - anchorRect.right - VIEWPORT_PADDING,
      };

      let nextPlacement = placementPriority[0];
      for (const candidate of placementPriority) {
        if ((candidate === 'top' || candidate === 'bottom') && tooltipRect.height <= available[candidate]) {
          nextPlacement = candidate;
          break;
        }

        if ((candidate === 'left' || candidate === 'right') && tooltipRect.width <= available[candidate]) {
          nextPlacement = candidate;
          break;
        }
      }

      if (
        (nextPlacement === 'top' || nextPlacement === 'bottom') &&
        tooltipRect.height > available[nextPlacement] &&
        tooltipRect.height > Math.max(available.top, available.bottom)
      ) {
        nextPlacement = available.right >= available.left ? 'right' : 'left';
      }

      if (
        (nextPlacement === 'left' || nextPlacement === 'right') &&
        tooltipRect.width > available[nextPlacement] &&
        tooltipRect.width > Math.max(available.left, available.right)
      ) {
        nextPlacement = available.bottom >= available.top ? 'bottom' : 'top';
      }

      let nextTop = 0;
      let nextLeft = 0;

      if (nextPlacement === 'bottom') {
        nextTop = anchorRect.bottom + offset;
        nextLeft = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
      } else if (nextPlacement === 'top') {
        nextTop = anchorRect.top - tooltipRect.height - offset;
        nextLeft = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
      } else if (nextPlacement === 'right') {
        nextTop = anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2;
        nextLeft = anchorRect.right + offset;
      } else {
        nextTop = anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2;
        nextLeft = anchorRect.left - tooltipRect.width - offset;
      }

      const maxLeft = Math.max(VIEWPORT_PADDING, viewportWidth - tooltipRect.width - VIEWPORT_PADDING);
      const maxTop = Math.max(VIEWPORT_PADDING, viewportHeight - tooltipRect.height - VIEWPORT_PADDING);

      setResolvedPlacement(nextPlacement);
      setPositionStyle({
        left: clamp(nextLeft, VIEWPORT_PADDING, maxLeft),
        top: clamp(nextTop, VIEWPORT_PADDING, maxTop),
      });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorElement, offset, open, placementPriority, tooltipId]);

  if (!isValidElement(children)) {
    return null;
  }

  const childProps = children.props as {
    onMouseEnter?: (event: ReactMouseEvent<HTMLElement>) => void;
    onMouseLeave?: (event: ReactMouseEvent<HTMLElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
    onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  };

  const triggerProps = {
    'aria-describedby': open ? tooltipId : undefined,
    onMouseEnter: (event: ReactMouseEvent<HTMLElement>) => {
      childProps.onMouseEnter?.(event);
      setAnchorElement(event.currentTarget);
      if (triggerMode === 'hover') {
        setOpen(true);
      }
    },
    onMouseLeave: (event: ReactMouseEvent<HTMLElement>) => {
      childProps.onMouseLeave?.(event);
      if (triggerMode === 'hover') {
        setOpen(false);
      }
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      childProps.onFocus?.(event);
      setAnchorElement(event.currentTarget);
      setOpen(true);
    },
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      childProps.onBlur?.(event);
      if (triggerMode === 'hover') {
        setOpen(false);
      }
    },
    onClick: (event: ReactMouseEvent<HTMLElement>) => {
      childProps.onClick?.(event);
      setAnchorElement(event.currentTarget);
      if (triggerMode === 'click') {
        setOpen((current) => !current);
      }
    },
  };

  const tooltipPositionClass =
    resolvedPlacement === 'bottom'
      ? 'data-[state=open]:translate-y-0 data-[state=closed]:translate-y-1'
      : resolvedPlacement === 'top'
        ? 'data-[state=open]:translate-y-0 data-[state=closed]:-translate-y-1'
        : resolvedPlacement === 'right'
          ? 'data-[state=open]:translate-x-0 data-[state=closed]:translate-x-1'
          : 'data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-1';

  return (
    <>
      {cloneElement(children, triggerProps)}
      {canUsePortal
        ? createPortal(
          <div
            aria-hidden={!open}
            className={cn(
              'fixed z-[80] w-max max-w-[min(92vw,420px)] rounded-xl border border-primary/30 bg-[linear-gradient(165deg,rgba(255,255,255,0.98)_0%,rgba(240,250,255,0.98)_100%)] px-3 py-2 text-[12px] leading-5 text-foreground shadow-[0_14px_32px_rgba(73,101,163,0.22)] transition-all duration-150 ease-out',
              tooltipPositionClass,
              open ? 'pointer-events-none opacity-100' : 'pointer-events-none opacity-0',
              className
            )}
            data-state={open ? 'open' : 'closed'}
            id={tooltipId}
            role="tooltip"
            style={positionStyle}
          >
            {content}
          </div>,
          document.body
        )
        : null}
    </>
  );
}
