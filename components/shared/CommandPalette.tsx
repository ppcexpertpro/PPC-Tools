"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COMMANDS, filterCommands, type CommandItem } from "@/lib/commands/registry";
import { EnterKeyIcon, SearchIcon } from "@/components/shared/icons";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/cn";

const LIST_ID = "command-palette-list";

/*
 * The suite's primary navigation. Mounted once in the root layout; opened with
 * the platform's palette shortcut or the header trigger.
 *
 * Built on the native <dialog> for the same reason as components/shared/Dialog
 * - focus trap, Esc and top layer come from the platform. The parts that do
 * need hand-wiring are the combobox/listbox ARIA relationship and roving
 * `aria-activedescendant`, because focus deliberately never leaves the input:
 * moving DOM focus onto each option as you arrow through would make the search
 * field lose the caret and stop accepting keystrokes.
 */
export function CommandPalette() {
  const open = useUIStore((state) => state.isCommandPaletteOpen);
  const setOpen = useUIStore((state) => state.setCommandPaletteOpen);
  const toggle = useUIStore((state) => state.toggleCommandPalette);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activeOptionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const results = useMemo(() => filterCommands(COMMANDS, query), [query]);
  const activeCommand = results[activeIndex];

  // Group headings are shown only on an empty query. Once results are ranked
  // by relevance the groups interleave, and a list that prints "Outreach"
  // twice with something else between reads as a rendering bug.
  const grouped = useMemo(() => {
    if (query.trim()) return null;

    const sections: { group: string; items: CommandItem[] }[] = [];
    for (const command of results) {
      const last = sections[sections.length - 1];
      if (last?.group === command.group) last.items.push(command);
      else sections.push({ group: command.group, items: [command] });
    }
    return sections;
  }, [results, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggle();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setQuery("");
      setActiveIndex(0);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Esc and backdrop clicks close the element directly, so the store has to
  // follow the element rather than the other way round.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => setOpen(false);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [setOpen]);

  // Keeps the highlighted row visible when arrowing past either end of the
  // scroll box. `nearest` rather than `center` so short moves don't jump the
  // whole list under the cursor.
  useEffect(() => {
    activeOptionRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const select = (command: CommandItem) => {
    setOpen(false);
    router.push(command.href);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(results.length - 1);
    } else if (event.key === "Enter" && activeCommand) {
      event.preventDefault();
      select(activeCommand);
    }
  };

  const renderOption = (command: CommandItem, index: number) => {
    const isActive = index === activeIndex;

    return (
      <div
        key={command.id}
        ref={isActive ? activeOptionRef : undefined}
        id={`command-option-${command.id}`}
        role="option"
        aria-selected={isActive}
        onClick={() => select(command)}
        // Hover moves the selection rather than painting a second, competing
        // highlight - one row is "the one Enter will take" at any moment.
        onPointerMove={() => setActiveIndex(index)}
        className={cn(
          "flex cursor-pointer items-center justify-between gap-4 rounded-md px-3 py-2.5 text-sm",
          "transition-colors duration-150 ease-out",
          isActive ? "bg-signal-soft text-signal-strong" : "text-ink",
        )}
      >
        <span className="font-medium">{command.label}</span>
        {command.hint && (
          <span
            className={cn(
              "hidden flex-none text-xs sm:block",
              isActive ? "text-signal-strong/70" : "text-ink-faint",
            )}
          >
            {command.hint}
          </span>
        )}
      </div>
    );
  };

  let flatIndex = -1;

  return (
    <dialog
      ref={dialogRef}
      aria-label="Command palette"
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
      // Pinned to the upper third rather than centred: the list grows
      // downward, so a centred box would shift its own first row every time
      // the result count changes as you type.
      className="modal-surface mx-auto mt-[12vh] mb-auto w-[calc(100vw-2rem)] max-w-xl rounded-2xl border border-border bg-surface p-0 text-ink shadow-float"
    >
      <div className="flex items-center gap-3 border-b border-border px-4">
        <SearchIcon className="h-4 w-4 flex-none text-ink-faint" />
        <input
          autoFocus
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={LIST_ID}
          aria-autocomplete="list"
          aria-activedescendant={activeCommand ? `command-option-${activeCommand.id}` : undefined}
          aria-label="Search commands and pages"
          placeholder="Jump to..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onInputKeyDown}
          className="min-h-12 w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
        />
      </div>

      <div
        id={LIST_ID}
        role="listbox"
        aria-label="Commands"
        className="max-h-[min(24rem,55vh)] overflow-y-auto p-2"
      >
        {grouped
          ? grouped.map((section) => (
              <div key={section.group} role="group" aria-label={section.group}>
                <p className="px-3 pb-1 pt-3 font-mono text-[0.625rem] uppercase tracking-wider text-ink-faint">
                  {section.group}
                </p>
                {section.items.map((command) => {
                  flatIndex += 1;
                  return renderOption(command, flatIndex);
                })}
              </div>
            ))
          : results.map((command, index) => renderOption(command, index))}

        {results.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-ink-muted">
            Nothing matches “{query.trim()}”.
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 border-t border-border bg-paper px-4 py-2 text-ink-faint">
        <span className="flex items-center gap-1.5 text-xs">
          <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[0.625rem]">
            ↑↓
          </kbd>
          navigate
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <kbd className="flex items-center rounded border border-border bg-surface px-1.5 py-0.5">
            <EnterKeyIcon className="h-3 w-3" />
          </kbd>
          open
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[0.625rem]">
            esc
          </kbd>
          close
        </span>
      </div>
    </dialog>
  );
}
