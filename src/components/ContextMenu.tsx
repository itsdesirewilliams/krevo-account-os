import { useEffect } from "react";
import { useUI } from "../state/ui";

/* Approximate menu geometry, used to keep the menu inside the viewport. */
const MENU_WIDTH = 200;
const ITEM_HEIGHT = 32;
const MENU_PADDING = 8;

export function ContextMenuHost() {
  const ui = useUI();
  const menu = ui.menu;
  const closeMenu = ui.closeMenu;

  useEffect(() => {
    if (!menu) return;
    const close = () => closeMenu();
    const timer = window.setTimeout(() => document.addEventListener("click", close), 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", close);
    };
  }, [menu, closeMenu]);

  if (!menu) return null;

  const left = Math.max(0, Math.min(menu.x, window.innerWidth - MENU_WIDTH));
  const height = menu.items.length * ITEM_HEIGHT + MENU_PADDING;
  const top = Math.max(0, Math.min(menu.y, window.innerHeight - height));

  return (
    <div className="menu" style={{ left, top }}>
      {menu.items.map((item, index) => (
        <div
          key={index}
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
