"use client";

import { useEffect, useId, useRef, useState } from "react";

type Option = {
  label: string;
  value: string;
};

export function AnimatedSelect({
  name,
  label,
  value,
  placeholder,
  options,
  onChange
}: {
  name: string;
  label: string;
  value: string;
  placeholder: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="select-shell" ref={rootRef}>
      <input type="hidden" name={name} value={value} />
      <button
        className={`select-trigger ${open ? "is-open" : ""}`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${listboxId}-label ${listboxId}-button`}
        id={`${listboxId}-button`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`select-value ${selectedOption ? "is-selected" : "is-placeholder"}`} id={`${listboxId}-label`}>
          {selectedOption?.label ?? placeholder}
        </span>
        <span className="select-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      <div className={`select-panel ${open ? "is-open" : ""}`}>
        <ul id={listboxId} role="listbox" aria-label={label}>
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <li key={option.value}>
                <button
                  className={`select-option ${isSelected ? "is-selected" : ""}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
