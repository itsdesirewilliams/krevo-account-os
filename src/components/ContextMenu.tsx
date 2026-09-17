import { useEffect } from "react";
import { useUI } from "../state/ui";

export function ContextMenuHost() {
  const ui = useUI();
  const menu = ui.menu;

  useEffect(() => {
    if (!menu) return;
    const close = () => ui.closeMenu();
    const timer = window.setTimeout(() => document.addEventListener("click", close), 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", close);
    };
  }, [menu, ui]);

  if (!menu) return null;
  return (
    <div className="menu" style={{ left: menu.x, top: menu.y }}>
      {menu.items.map((item) => (
        <div
          key={item.label}
          className={"menu-item" + (item.danger ? " danger" : "")}
          onClick={() => {
            ui.closeMenu();
            item.action();
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
